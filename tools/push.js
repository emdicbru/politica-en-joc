#!/usr/bin/env node
// Envia les notificacions push de Política en Joc. L'executa GitHub Actions cada 5 minuts (.github/workflows/push.yml),
// a l'instant si el Centre de control l'engega, i al minut just si el servei d'avisos (worker/avisos.js) el desperta.
//  - Repte diari: cada dia a l'hora triada al Centre de control (config/push: diariOn, diariHora «HH:MM»). Amb
//    diariNoJugat, a qui ja l'ha fet avui no li arriba (només se sap dels dispositius lligats a un compte).
//  - Recordatori de ratxa (ratxaOn, ratxaHora): a qui té ratxa de 2 dies o més i encara no ha fet el repte d'avui.
//  - Avisos (pushes/): «pending» surten ara; «scheduled» surten quan arriba «at» i, si es repeteixen (rep), es
//    tornen a programar per a la propera vegada. Públic (aud): tots, compte, nojugat (no ha fet el repte d'avui),
//    inactius (fa 7 dies o més que no entra).
// Fa servir l'estàndard Web Push amb claus VAPID pròpies (secrets VAPID_PUBLIC i VAPID_PRIVATE) i llegeix les
// subscripcions de Firestore amb la clau de servei (secret FIREBASE_SA). Les subscripcions caducades s'esborren.
"use strict";
const admin = require("firebase-admin");
const webpush = require("web-push");

const SA = process.env.FIREBASE_SA;
if (!SA || !process.env.VAPID_PRIVATE || !process.env.VAPID_PUBLIC) { console.log("Falten els secrets (FIREBASE_SA, VAPID_PUBLIC, VAPID_PRIVATE): no s'envia res."); process.exit(0); }
webpush.setVapidDetails("https://politica-en-joc.web.app", process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();
const { madrid, dailyNumber, hm, nextAt, audienceFilter } = require("./push-lib.js");

// Les subscripcions, amb el perfil de qui té el dispositiu lligat al compte (per saber si ha jugat avui, la ratxa…)
let subsCache = null;
async function allSubs() {
  if (subsCache) return subsCache;
  const snap = await db.collection("push").get();
  const subs = snap.docs.map((d) => ({ id: d.id, sub: d.data().sub, uid: d.data().uid || null })).filter((x) => x.sub?.endpoint);
  const uids = [...new Set(subs.map((s) => s.uid).filter(Boolean))];
  const users = {};
  for (let i = 0; i < uids.length; i += 100) {
    const refs = uids.slice(i, i + 100).map((u) => db.collection("users").doc(u));
    (await db.getAll(...refs)).forEach((d) => { if (d.exists) { const x = d.data(); users[d.id] = { last: x.daily?.last || null, streak: x.daily?.streak || 0, upd: x.updatedAt?.toMillis?.() || 0 }; } });
  }
  subsCache = subs.map((s) => ({ ...s, user: s.uid ? users[s.uid] || null : null }));
  return subsCache;
}
async function send(aud, msg, personal = null) {
  const today = madrid().day;
  const list = (await allSubs()).filter((s) => audienceFilter(aud, s, today, Date.now()));
  let sent = 0, failed = 0;
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async (x) => {
      const m = personal ? { ...msg, ...personal(x) } : msg;
      const payload = JSON.stringify({ title: m.title || "", body: m.body || "", url: m.url || "./#inici", tag: m.tag || "" });
      try { await webpush.sendNotification(x.sub, payload, { TTL: 43200, urgency: "high" }); sent++; }
      catch (e) {
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) await db.collection("push").doc(x.id).delete().catch(() => {});
      }
    }));
  }
  return { sent, failed, total: list.length };
}

(async () => {
  const cfgRef = db.collection("config").doc("push");
  const cfg = (await cfgRef.get()).data() || {};
  const now = madrid();
  const nowMin = now.hour * 60 + now.minute;
  // 1) Repte diari (a l'hora triada; si s'ha passat l'hora, encara surt aquell dia)
  if (cfg.diariOn !== false && nowMin >= hm(cfg.diariHora ?? 9) && cfg.diariLast !== now.day) {
    await cfgRef.set({ diariLast: now.day }, { merge: true }); // primer es marca, perquè dues execucions no l'enviïn dos cops
    const n = dailyNumber(now.day);
    const msg = { title: `🗳️ Repte diari #${n}`, body: "Ja tens el repte d'avui: 10 proves contra el rellotge. Mantens la ratxa?", url: "./#joc/diari", tag: "diari" };
    const r = await send(cfg.diariNoJugat === false ? "tots" : "diari", msg, (x) => (x.user?.streak >= 2 ? { body: `🔥 Portes ${x.user.streak} dies de ratxa. El repte d'avui ja és aquí: no la perdis!` } : {}));
    await db.collection("pushes").add({ ...msg, topic: "diari", kind: "diari", status: "sent", created: Date.now(), ...r });
    console.log("Repte diari", now.day, r);
  }
  // 2) Recordatori de ratxa (al vespre, a qui encara no l'ha fet i té ratxa)
  if (cfg.ratxaOn && nowMin >= hm(cfg.ratxaHora ?? "20:30") && cfg.ratxaLast !== now.day) {
    await cfgRef.set({ ratxaLast: now.day }, { merge: true });
    const msg = { title: "🔥 Que no se't trenqui la ratxa!", body: "Encara no has fet el repte d'avui. Tens fins a mitjanit.", url: "./#joc/diari", tag: "diari" };
    const r = await send("ratxa", msg, (x) => ({ body: `Portes ${x.user?.streak || 2} dies seguits: encara no has fet el repte d'avui i tens fins a mitjanit.` }));
    await db.collection("pushes").add({ ...msg, topic: "ratxa", kind: "ratxa", status: "sent", created: Date.now(), ...r });
    console.log("Recordatori de ratxa", now.day, r);
  }
  // 3) Avisos: els de la cua (ara) i els programats que ja toquen
  const [pend, sched] = await Promise.all([db.collection("pushes").where("status", "==", "pending").get(), db.collection("pushes").where("status", "==", "scheduled").get()]);
  const due = [...pend.docs, ...sched.docs.filter((d) => (d.data().at || 0) <= Date.now())];
  for (const d of due) {
    const m = d.data();
    // Es reclama abans d'enviar (transacció): si dues execucions coincideixen, només l'envia una
    const mine = await db.runTransaction(async (tx) => {
      const cur = (await tx.get(d.ref)).data();
      if (!cur || !["pending", "scheduled"].includes(cur.status) || (cur.status === "scheduled" && (cur.at || 0) > Date.now())) return false;
      tx.update(d.ref, { status: "sending" });
      return true;
    });
    if (!mine) continue;
    try {
      const r = await send(m.aud || "tots", { ...m, tag: m.tag || "" });
      const next = m.rep && m.rep !== "cap" ? nextAt(m, Date.now()) : null;
      const runs = (m.runs || 0) + 1;
      if (next) await d.ref.update({ status: "scheduled", at: next, runs, lastSent: Date.now(), last: r });
      else await d.ref.update({ status: "sent", sentAt: Date.now(), runs, ...r });
      console.log("Avís", m.title, r, next ? `· proper: ${new Date(next).toISOString()}` : "");
    } catch (e) {
      await d.ref.update({ status: "error", error: String(e.message || e).slice(0, 300) });
      console.error("Error", m.title, e.message);
    }
  }
  if (!due.length) console.log("Cap avís pendent");
})().catch((e) => { console.error(e); process.exit(1); });
