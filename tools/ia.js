// Crida a la IA des de GitHub Actions: el servei d'avisos (worker/avisos.js, POST /ia) fa servir Cloudflare Workers AI.
// L'accés és amb el testimoni OIDC que GitHub dona a cada execució (cal «permissions: id-token: write» al workflow):
// no hi ha cap clau guardada enlloc.
"use strict";
const fs = require("fs"), path = require("path");

const CFG = fs.readFileSync(path.join(__dirname, "..", "js", "firebase-config.js"), "utf8");
const URL_IA = (CFG.match(/avisosUrl:\s*"([^"]+)"/) || [])[1] + "/ia";

async function oidc() {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!u || !t) throw new Error("sense testimoni OIDC (cal permissions: id-token: write)");
  const r = await fetch(`${u}&audience=pej-ia`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error(`OIDC ${r.status}`);
  return (await r.json()).value;
}

// Envia els missatges i en torna el JSON de la resposta (el model a vegades l'embolcalla amb text: es busca el bloc { … })
async function askJson(messages, { warn = console.warn, max_tokens = 6000, temperature = 0.3 } = {}) {
  let tok;
  try { tok = await oidc(); } catch (e) { warn("IA:", e.message); return null; }
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(URL_IA, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ messages, max_tokens, temperature }) });
      const txt = await r.text();
      if (!r.ok) { warn("IA HTTP", r.status, txt.slice(0, 300)); continue; }
      const { text, model } = JSON.parse(txt);
      const clean = String(text).replace(/^[\s\S]*?<\/think>/, "");
      for (const cand of [clean, (clean.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1], (clean.match(/\{[\s\S]*\}/) || [])[0]]) {
        if (!cand) continue;
        try { const j = JSON.parse(cand); j.__model = model; return j; } catch { /* el següent */ }
      }
      warn("IA: el model no ha tornat JSON:", clean.slice(0, 300));
    } catch (e) { warn("IA error:", e.message); }
  }
  return null;
}

module.exports = { askJson };
