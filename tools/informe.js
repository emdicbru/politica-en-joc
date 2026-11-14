#!/usr/bin/env node
// Informe setmanal de Política en Joc: cada dilluns, el resum de la setmana anterior (dl–dg) a partir dels comptadors
// anònims (stats/{dia}_{n} i stats/{dia}_w) i de les notificacions (pushes). L'envia per correu amb Brevo als
// destinataris de privat/informe.dest (els tria el Centre de control) i en desa còpia a privat/informe.last.
// L'executa GitHub Actions (.github/workflows/informe.yml): el dilluns de bon matí i, al minut just, el servei d'avisos.
// Si ja s'ha enviat l'informe d'aquella setmana, no fa res (FORCE=1 per tornar-lo a enviar).
// Secrets: FIREBASE_SA i BREVO_KEY (els mateixos que les notes de premsa).
"use strict";
const admin = require("firebase-admin");
const SA = process.env.FIREBASE_SA, KEY = process.env.BREVO_KEY;
if (!SA) { console.log("Falta FIREBASE_SA: no es fa res."); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();

const day = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(t));
const fmt = (n) => Math.round(n || 0).toLocaleString("ca-ES");
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + (Number(b) || 0), 0);
const GAMES = { diari: "Repte diari", actualitat: "Test d'actualitat", assembla: "Test d'afinitat", duel: "Duels" };

async function week(fromMs) {
  const days = [...Array(7)].map((_, i) => day(fromMs + i * 864e5));
  const snap = await db.collection("stats").where(admin.firestore.FieldPath.documentId(), ">=", days[0]).where(admin.firestore.FieldPath.documentId(), "<=", days[6] + "_~").get();
  const S = { u: 0 };
  snap.docs.forEach((d) => {
    const x = d.data();
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === "number") S[k] = (S[k] || 0) + v;
      else if (v && typeof v === "object") { const m = (S[k] ||= {}); for (const [kk, vv] of Object.entries(v)) m[kk] = (m[kk] || 0) + (Number(vv) || 0); }
    }
  });
  return { days, S };
}
const pct = (a, b) => (b ? ` (${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} %)` : "");

(async () => {
  // La setmana passada: de dilluns a diumenge (hora de Madrid)
  const now = Date.now();
  const wd = (new Date(day(now) + "T12:00:00Z").getUTCDay() + 6) % 7; // 0 = dilluns
  const mon = Date.parse(day(now) + "T12:00:00Z") - (wd + 7) * 864e5;
  const ref = db.collection("privat").doc("informe");
  const cfg = (await ref.get()).data() || {};
  const id = day(mon);
  if (cfg.last?.week === id && cfg.last?.status === "enviat" && !process.env.FORCE) { console.log("L'informe d'aquesta setmana ja s'ha enviat"); return; }
  const [{ days, S }, { S: P }] = await Promise.all([week(mon), week(mon - 7 * 864e5)]);
  const clicks = (o) => Object.entries(o.pc || {}).filter(([k]) => /^t/.test(k)).reduce((a, [, v]) => a + v, 0);
  const topG = Object.entries(S.f || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g, n]) => `${GAMES[g] || g} (${fmt(n)})`).join(", ");
  const src = Object.entries(S.src || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${fmt(n)})`).join(", ");
  const pushes = await db.collection("pushes").where("created", ">=", mon).where("created", "<", mon + 7 * 864e5).get();
  const sent = pushes.docs.reduce((a, d) => a + (d.data().sent || 0), 0);
  const range = `${days[0].split("-").reverse().join("/")} – ${days[6].split("-").reverse().join("/")}`;
  const lines = [
    `Visites: ${fmt(S.u)} persones úniques (suma de cada dia)${pct(S.u, P.u)}; ${fmt(S.ses)} sessions${pct(S.ses || 0, P.ses || 0)}.`,
    `Partides acabades: ${fmt(sum(S.f))}${pct(sum(S.f), sum(P.f))}. Les més jugades: ${topG || "—"}.`,
    `Repte diari: ${fmt(S.diari)} partides · Test d'actualitat: ${fmt(S.f?.actualitat)} · Test d'afinitat: ${fmt(S.f?.assembla)}.`,
    `Comparticions de resultats: ${fmt(sum(S.sh))}${pct(sum(S.sh), sum(P.sh))}.`,
    `Notificacions: ${fmt(sent)} enviades i ${fmt(clicks(S))} clics${sent ? ` (${Math.round((clicks(S) / sent) * 1000) / 10} %)` : ""}.`,
    `D'on arriba la gent: ${src || "—"}.`,
  ];
  const text = `Política en Joc · Informe setmanal (${range})\n\n${lines.map((l) => `• ${l}`).join("\n")}\n\nDades anònimes i agregades del Centre de control (politicaenjoc.cat/#control).`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#17173d"><h2 style="margin:0 0 4px">Política en Joc · Informe setmanal</h2><p style="color:#5e5a74;margin:0 0 16px">${range}</p><ul style="line-height:1.55;padding-left:18px">${lines.map((l) => `<li>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</li>`).join("")}</ul><p style="color:#5e5a74;font-size:13px">Dades anònimes i agregades. Més detall al <a href="https://politicaenjoc.cat/#control">Centre de control</a>.</p></div>`;
  const dest = (cfg.dest || []).filter((x) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(x));
  let status = "desat (sense destinataris)";
  if (dest.length && KEY) {
    try {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ sender: { name: "Política en Joc", email: "hola@politicaenjoc.cat" }, to: dest.map((email) => ({ email })), subject: `Informe setmanal · ${range}`, htmlContent: html, textContent: text, tags: ["informe"] }) });
      status = r.ok ? "enviat" : `error ${r.status}: ${(await r.text()).slice(0, 160)}`;
    } catch (e) { status = `error: ${String(e.message || e).slice(0, 160)}`; }
  } else if (dest.length) status = "desat (falta BREVO_KEY)";
  await ref.set({ last: { week: id, at: Date.now(), status, text, to: dest.length } }, { merge: true });
  console.log("Informe", id, status);
})().catch((e) => { console.error(e); process.exit(1); });
