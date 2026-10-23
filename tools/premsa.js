#!/usr/bin/env node
// Envia les notes de premsa de Política en Joc. L'executa GitHub Actions cada 5 minuts (.github/workflows/premsa.yml)
// i també a l'instant si el Centre de control l'engega.
//  1. Baixes: aplica les que la gent ha demanat des de l'enllaç del correu (press_unsub/{codi}).
//  2. Publica la nota al web: la foto i el text a web/premsa/ (GitHub Pages), perquè el correu hi pugui enllaçar i
//     perquè surti a la Sala de premsa (#premsa) un cop enviada.
//  3. Envia: la prova (a l'adreça de proves) o la nota a tots els contactes que toquen, un correu per persona, amb el
//     servei Brevo. Cada enviament queda apuntat (press_notes/{id}/sends/{contacte}): si s'atura (p. ex. pel límit
//     diari del servei), la següent execució continua on ho havia deixat i no repeteix ningú.
// Secrets: FIREBASE_SA (clau de servei de Firebase en JSON) i BREVO_KEY (clau de l'API de Brevo). Vegeu CONFIGURACIO.md.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { execSync } = require("child_process");
const admin = require("firebase-admin");
const { premsaMail } = require("../js/premsa-mail.js");

const SA = process.env.FIREBASE_SA, KEY = process.env.BREVO_KEY, GH = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || "emdicbru/politica-en-joc";
const PAGES = "https://emdicbru.github.io/politica-en-joc/";
const SITE = "https://politicaenjoc.cat/";
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "web", "premsa");
if (!SA) { console.log("Falta el secret FIREBASE_SA: no es fa res."); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA)) });
const db = admin.firestore();

const CFG_DEFAULT = { fromName: "Política en Joc", from: "hola@politicaenjoc.cat", replyTo: "brudomingosola@gmail.com", testTo: "brudomingosola@gmail.com", attach: true };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const okEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || "");
const matches = (c, tags) => !c.unsub && okEmail(c.email) && (!tags?.length || (c.tags || []).some((t) => tags.includes(t)));

// ---------- Publicació a GitHub Pages ----------
function git(cmd) { return execSync(`git ${cmd}`, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString(); }
function commitPush(msg) {
  git(`add web/premsa`);
  try { git(`diff --staged --quiet`); return false; } catch { /* hi ha canvis */ }
  git(`-c user.name=premsa-bot -c user.email=premsa-bot@users.noreply.github.com commit -m ${JSON.stringify(msg)}`);
  for (let i = 0; i < 4; i++) {
    try { git(`pull --rebase`); git(`push`); return true; } catch (e) { log("push reintent", i + 1, String(e.message).slice(0, 120)); execSync("sleep 5"); }
  }
  throw new Error("No s'ha pogut desar a GitHub");
}
// Els canvis que desa el bot no engeguen sols la publicació de GitHub Pages: s'engega a mà
async function deployPages() {
  if (!GH) return log("Sense GITHUB_TOKEN: no es pot engegar GitHub Pages");
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/pages.yml/dispatches`, { method: "POST", headers: { Authorization: `Bearer ${GH}`, Accept: "application/vnd.github+json" }, body: JSON.stringify({ ref: "main" }) });
  if (r.status !== 204) log("No s'ha pogut engegar GitHub Pages:", r.status, (await r.text()).slice(0, 200));
}
// Espera que la nota ja es pugui llegir a GitHub Pages (amb el contingut nou)
async function waitPublished(id, hash) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${PAGES}premsa/${id}.json?t=${Date.now()}`, { cache: "no-store" });
      if (r.ok && (await r.json()).h === hash) return true;
    } catch { /* encara no */ }
    await sleep(10000);
  }
  return false;
}
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

async function publish(id, n, cfg) {
  const hash = crypto.createHash("sha1").update(JSON.stringify([n.title, n.lead, n.body, n.caption, n.place, n.hasPhoto ? n.photoV || 1 : 0, cfg.contact, cfg.about])).digest("hex").slice(0, 16);
  if (n.pubHash === hash && n.webUrl) return { photoUrl: n.photoUrl || null, webUrl: n.webUrl };
  fs.mkdirSync(DIR, { recursive: true });
  let photoUrl = null;
  if (n.hasPhoto) {
    const m = (await db.doc(`press_media/${id}`).get()).data();
    if (m?.data) {
      const name = `${id}-${n.photoV || 1}.jpg`;
      fs.writeFileSync(path.join(DIR, name), Buffer.from(m.data.split(",").pop(), "base64"));
      photoUrl = `${PAGES}premsa/${name}`;
    }
  }
  const pub = { id, h: hash, title: n.title || "", lead: n.lead || "", body: n.body || "", caption: n.caption || "", place: n.place || "", photo: photoUrl, date: n.sentAt || Date.now(), contact: cfg.contact || "", about: cfg.about || "" };
  fs.writeFileSync(path.join(DIR, `${id}.json`), JSON.stringify(pub));
  // Si la nota ja era a la Sala de premsa, s'hi actualitza
  const idxF = path.join(DIR, "index.json"), idx = readJson(idxF, []);
  const at = idx.findIndex((x) => x.id === id);
  if (at >= 0) { idx[at] = { id, title: pub.title, lead: pub.lead, photo: photoUrl, date: idx[at].date }; fs.writeFileSync(idxF, JSON.stringify(idx)); }
  commitPush(`Nota de premsa: ${pub.title.slice(0, 60)}`);
  await deployPages();
  log("Esperant que la nota es publiqui a GitHub Pages…");
  if (!(await waitPublished(id, hash))) log("Avís: la nota encara no es veu a GitHub Pages; s'envia igualment");
  const out = { photoUrl, webUrl: `${SITE}#premsa/${id}` };
  await db.doc(`press_notes/${id}`).update({ ...out, pubHash: hash });
  return out;
}
// Quan s'ha enviat, la nota entra a la llista pública de la Sala de premsa
async function list(id, n, urls) {
  const idxF = path.join(DIR, "index.json"), idx = readJson(idxF, []).filter((x) => x.id !== id);
  idx.unshift({ id, title: n.title || "", lead: n.lead || "", photo: urls.photoUrl, date: Date.now() });
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(idxF, JSON.stringify(idx.slice(0, 200)));
  commitPush(`Sala de premsa: ${String(n.title || "").slice(0, 60)}`);
  await deployPages();
}

// ---------- Enviament (Brevo) ----------
async function brevo(cfg, to, mail, attach) {
  const body = {
    sender: { name: cfg.fromName, email: cfg.from },
    to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }],
    subject: mail.subject, htmlContent: mail.html, textContent: mail.text, tags: ["premsa"],
  };
  if (cfg.replyTo) body.replyTo = { email: cfg.replyTo };
  if (attach) body.attachment = [attach];
  if (to.unsubUrl) body.headers = { "List-Unsubscribe": `<${to.unsubUrl}>` };
  const r = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = new Error(`${r.status}: ${(await r.text()).slice(0, 240)}`); e.status = r.status; throw e; }
  return (await r.json()).messageId || "";
}
// El servei ha dit prou per avui (límit del pla) o la clau no és bona: cal aturar-se, no és culpa del contacte
const isStop = (e) => [401, 402, 429].includes(e.status) || (e.status === 403 && /quota|limit|credit/i.test(e.message));

async function photoAttach(id, n, cfg) {
  if (!n.hasPhoto || cfg.attach === false) return null;
  const m = (await db.doc(`press_media/${id}`).get()).data();
  return m?.data ? { name: `politica-en-joc-${id.slice(0, 6)}.jpg`, content: m.data.split(",").pop() } : null;
}

async function sendTest(id, n, cfg) {
  const ref = db.doc(`press_notes/${id}`);
  const to = cfg.testTo;
  if (!okEmail(to)) return ref.update({ status: "esborrany", testAt: Date.now(), testError: "Falta l'adreça de proves (Configuració)" });
  try {
    const urls = await publish(id, n, cfg);
    const mail = premsaMail(n, { name: "Prova", cfg, ...urls, unsubUrl: `${SITE}#baixa/prova`, date: Date.now() });
    mail.subject = `[PROVA] ${mail.subject}`;
    await brevo(cfg, { email: to, unsubUrl: `${SITE}#baixa/prova` }, mail, await photoAttach(id, n, cfg));
    await ref.update({ status: "esborrany", testAt: Date.now(), testTo: to, testError: admin.firestore.FieldValue.delete() });
    log("Prova enviada a", to);
  } catch (e) {
    await ref.update({ status: "esborrany", testAt: Date.now(), testError: String(e.message).slice(0, 300) });
    log("Error a la prova:", e.message);
  }
}

async function sendAll(id, n, cfg) {
  const ref = db.doc(`press_notes/${id}`);
  let urls;
  try { urls = await publish(id, n, cfg); }
  catch (e) { return ref.update({ status: "error", error: `No s'ha pogut publicar la nota al web: ${String(e.message).slice(0, 200)}` }); }
  const contacts = (await db.collection("press_contacts").get()).docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => matches(c, n.tags));
  const done = new Set((await ref.collection("sends").get()).docs.filter((d) => d.data().ok).map((d) => d.id));
  const todo = contacts.filter((c) => !done.has(c.id));
  const attach = await photoAttach(id, n, cfg);
  await ref.update({ status: "enviant", total: contacts.length, paused: admin.firestore.FieldValue.delete() });
  let sent = done.size, failed = 0, stop = null;
  for (const c of todo) {
    const unsubUrl = c.tok ? `${SITE}#baixa/${c.tok}` : null;
    const mail = premsaMail(n, { name: c.name, cfg, ...urls, unsubUrl, date: n.queuedAt || Date.now() });
    try {
      const mid = await brevo(cfg, { email: c.email, name: c.name, unsubUrl }, mail, attach);
      await ref.collection("sends").doc(c.id).set({ email: c.email, ok: true, mid, t: Date.now() });
      sent++;
    } catch (e) {
      if (isStop(e)) { stop = e; break; }
      await ref.collection("sends").doc(c.id).set({ email: c.email, ok: false, err: String(e.message).slice(0, 300), t: Date.now() });
      failed++;
    }
    if ((sent + failed) % 10 === 0) await ref.update({ sent, failed });
    await sleep(250);
  }
  if (stop) {
    const quota = stop.status !== 401;
    await ref.update({ sent, failed, status: quota ? "enviant" : "error", ...(quota ? { paused: "El servei d'enviament ha arribat al seu límit: l'enviament continuarà sol quan ho permeti (normalment, l'endemà)." } : { error: "La clau del servei d'enviament (BREVO_KEY) no és vàlida." }) });
    return log("Aturat:", stop.message);
  }
  await ref.update({ sent, failed, status: "enviat", sentAt: Date.now() });
  log(`Nota «${n.title}» enviada: ${sent} correus${failed ? `, ${failed} errors` : ""}`);
  try { await list(id, n, urls); } catch (e) { log("No s'ha pogut afegir a la Sala de premsa:", e.message); }
}

(async () => {
  const cfgRef = db.doc("press_cfg/main");
  const cfg = { ...CFG_DEFAULT, ...((await cfgRef.get()).data() || {}) };
  // Estat del servei, perquè el Centre de control sàpiga si tot està a punt (només s'escriu si canvia o cada hora)
  const run = { ok: !!KEY, msg: KEY ? "A punt" : "Falta la clau del servei d'enviament (secret BREVO_KEY a GitHub)" };
  if (!cfg.run || cfg.run.ok !== run.ok || cfg.run.msg !== run.msg || Date.now() - cfg.run.t > 3600e3) await cfgRef.set({ run: { ...run, t: Date.now() } }, { merge: true });

  // 1) Baixes
  const uns = await db.collection("press_unsub").get();
  if (uns.size) {
    const byTok = new Map((await db.collection("press_contacts").get()).docs.map((d) => [d.data().tok, d]));
    for (const u of uns.docs) {
      const c = byTok.get(u.id);
      if (c && !c.data().unsub) { await c.ref.update({ unsub: true, unsubAt: Date.now() }); log("Baixa:", c.id); }
      await u.ref.delete();
    }
  }
  // 2) Notes per enviar
  const notes = await db.collection("press_notes").where("status", "in", ["prova", "envia", "enviant"]).get();
  if (!notes.size) return log("Cap nota per enviar");
  for (const d of notes.docs) {
    const n = d.data();
    if (!KEY) {
      await d.ref.update(n.status === "prova" ? { status: "esborrany", testAt: Date.now(), testError: run.msg } : { status: "error", error: run.msg });
      continue;
    }
    if (n.status === "prova") await sendTest(d.id, n, cfg);
    else await sendAll(d.id, n, cfg);
  }
})().catch((e) => { console.error(e); process.exit(1); });
