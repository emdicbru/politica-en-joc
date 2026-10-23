#!/usr/bin/env node
// Envia les notificacions push de Política en Joc. L'executa GitHub Actions cada 5 minuts (.github/workflows/push.yml)
// i també a l'instant si el Centre de control l'engega.
//  - Repte diari: cada dia a l'hora triada al Centre de control (config/push), a tothom que té les notificacions.
//  - Avisos de la cua (pushes/ amb status "pending"), també a tothom (ja no es trien temes).
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

const madrid = (d = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
};
// El repte #1 va ser l'1 d'octubre de 2026 (js/reptes.js)
const dailyNumber = (day) => Math.round((Date.parse(day + "T12:00:00Z") - Date.parse("2026-10-01T12:00:00Z")) / 864e5) + 1;

async function subsFor(topic) {
  const snap = topic === "tots" ? await db.collection("push").get() : await db.collection("push").where("topics", "array-contains", topic).get();
  return snap.docs.map((d) => ({ id: d.id, sub: d.data().sub })).filter((x) => x.sub?.endpoint);
}
async function send(topic, msg) {
  const list = await subsFor(topic);
  const payload = JSON.stringify({ title: msg.title || "", body: msg.body || "", url: msg.url || "./#inici", tag: msg.tag || "" });
  let sent = 0, failed = 0;
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async (x) => {
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
  // 1) Repte diari
  const cfgRef = db.collection("config").doc("push");
  const cfg = (await cfgRef.get()).data() || {};
  const now = madrid();
  if (cfg.diariOn !== false && now.hour >= (cfg.diariHora ?? 9) && cfg.diariLast !== now.day) {
    await cfgRef.set({ diariLast: now.day }, { merge: true }); // primer es marca, perquè dues execucions no l'enviïn dos cops
    const n = dailyNumber(now.day);
    const msg = { title: `🗳️ Repte diari #${n}`, body: "Ja tens el repte d'avui: 10 proves contra el rellotge. Mantens la ratxa?", url: "./#joc/diari", tag: "diari" };
    const r = await send("tots", msg);
    await db.collection("pushes").add({ ...msg, topic: "diari", kind: "diari", status: "sent", created: Date.now(), ...r });
    console.log("Repte diari", now.day, r);
  }
  // 2) Avisos de la cua
  const pend = await db.collection("pushes").where("status", "==", "pending").get();
  for (const d of pend.docs) {
    const m = d.data();
    await d.ref.update({ status: "sending" });
    try {
      const r = await send("tots", { ...m, tag: m.tag || "" });
      await d.ref.update({ status: "sent", sentAt: Date.now(), ...r });
      console.log("Avís", m.title, r);
    } catch (e) {
      await d.ref.update({ status: "error", error: String(e.message || e).slice(0, 300) });
      console.error("Error", m.title, e.message);
    }
  }
  if (!pend.size) console.log("Cap avís a la cua");
})().catch((e) => { console.error(e); process.exit(1); });
