// Crida a la IA des de GitHub Actions: el servei d'avisos (worker/avisos.js, POST /ia) fa servir Cloudflare Workers AI.
// L'accés és amb el testimoni OIDC que GitHub dona a cada execució (cal «permissions: id-token: write» al workflow):
// no hi ha cap clau guardada enlloc.
"use strict";
// L'adreça del servei d'avisos (la mateixa que avisosUrl a js/firebase-config.js). No és cap secret.
const URL_IA = (process.env.AVISOS_URL || "https://pej-avisos.brudomingosola.workers.dev") + "/ia";

async function oidc() {
  const u = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, t = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!u || !t) throw new Error("sense testimoni OIDC (cal permissions: id-token: write)");
  const r = await fetch(`${u}&audience=pej-ia`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error(`OIDC ${r.status}`);
  return (await r.json()).value;
}

// Envia els missatges i en torna el JSON de la resposta (el model a vegades l'embolcalla amb text: es busca el bloc { … })
async function askJson(messages, { warn = console.warn, max_tokens = 6000, temperature = 0.3, model = null } = {}) {
  let tok;
  try { tok = await oidc(); } catch (e) { warn("IA:", e.message); return null; }
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(URL_IA, { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ messages, max_tokens, temperature, ...(model ? { model } : {}) }) });
      const txt = await r.text();
      if (!r.ok) { warn("IA HTTP", r.status, txt.slice(0, 300)); continue; }
      const { text, model: used } = JSON.parse(txt);
      const clean = String(text).replace(/^[\s\S]*?<\/think>/, "");
      for (const cand of [clean, (clean.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1], (clean.match(/\{[\s\S]*\}/) || [])[0]]) {
        if (!cand) continue;
        try { const j = JSON.parse(cand); j.__model = used; return j; } catch { /* el següent */ }
      }
      // Resposta tallada (s'ha acabat l'espai): es queden els elements de la llista que han arribat sencers
      const cut = salvage(clean);
      if (cut) { warn("IA: resposta tallada; se n'aprofiten", cut[Object.keys(cut)[0]].length, "elements"); cut.__model = used; return cut; }
      warn("IA: el model no ha tornat JSON:", clean.slice(0, 300));
    } catch (e) { warn("IA error:", e.message); }
  }
  return null;
}

// {"questions":[{…},{…},{… (tallat) → {"questions":[{…},{…}]}: es talla just després de l'últim objecte de la llista que
// es tanca bé (comptant claus i cometes)
function salvage(s) {
  const m = s.match(/\{\s*"(\w+)"\s*:\s*\[/);
  if (!m) return null;
  let depth = 0, inStr = false, esc = false, lastEnd = -1;
  for (let i = m.index + m[0].length; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") { depth--; if (depth === 0 && c === "}") lastEnd = i; if (depth < 0) break; }
  }
  if (lastEnd < 0) return null;
  try { return JSON.parse(s.slice(m.index, lastEnd + 1) + "]}"); } catch { return null; }
}

module.exports = { askJson, salvage };
