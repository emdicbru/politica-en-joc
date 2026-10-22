#!/usr/bin/env node
// Genera les preguntes del quiz de l'actualitat (data/quiz.json) a partir dels titulars de data/news.json.
// Fa servir GitHub Models amb el GITHUB_TOKEN del workflow: és gratuït (capa gratuïta amb límits diaris) i no
// necessita cap clau ni targeta. Si el servei falla o s'arriba al límit, no toca res i el quiz es queda com estava.
//
// Regles: preguntes sobre els fets, no sobre els mitjans; cada fet ha d'aparèixer en almenys 2 mitjans diferents;
// una segona passada comprova que cada pregunta es pot respondre només amb els titulars citats.
// Ús: GITHUB_TOKEN=... node tools/update-quiz.js
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const NEWS = path.join(ROOT, "data", "news.json");
const QUIZ = path.join(ROOT, "data", "quiz.json");
const API = "https://models.github.ai/inference/chat/completions";
const MODELS = ["openai/gpt-4.1", "openai/gpt-4.1-mini"];
const TOPICS = ["enquestes", "habitatge", "immigracio", "justicia", "energia", "economia", "territori", "internacional", "campanya", "parlament", "politica"];
const KEEP_DAYS = 10; // l'app fa servir cada pregunta 10 dies
const MAX_NEW = 8;
const token = process.env.GITHUB_TOKEN;

const today = new Date().toISOString().slice(0, 10);
const log = (...a) => console.log("[quiz]", ...a);

async function ask(messages) {
  for (const model of MODELS) {
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 3500, response_format: { type: "json_object" } }),
      });
      if (!r.ok) { log(model, "HTTP", r.status, (await r.text()).slice(0, 200)); continue; }
      const j = await r.json();
      return JSON.parse(j.choices[0].message.content);
    } catch (e) { log(model, "error", e.message); }
  }
  return null;
}

(async () => {
  if (!token) { log("Sense GITHUB_TOKEN: no es genera res."); return; }
  const news = JSON.parse(fs.readFileSync(NEWS, "utf8"));
  const quiz = JSON.parse(fs.readFileSync(QUIZ, "utf8"));
  if (quiz.updatedAuto === today) { log("Ja s'ha generat avui."); return; }

  // Titulars de les darreres 36 hores, sense repetits
  const since = Date.now() - 36 * 3600e3, seen = new Set();
  const items = news.items.filter((x) => x.d >= since && x.t && !seen.has(x.t) && seen.add(x.t)).slice(0, 110);
  if (items.length < 15) { log("Massa pocs titulars:", items.length); return; }
  const list = items.map((x, i) => `${i}. [${x.s}] ${x.t}`).join("\n");
  const old = quiz.questions.filter((q) => Date.now() - new Date(q.d) < KEEP_DAYS * 864e5);

  // 1) Proposta de preguntes
  const sys = `Ets l'editor d'un quiz d'actualitat política espanyola en català, per a una app sobre les eleccions generals del 29 de novembre de 2026.
Regles estrictes:
- Pregunta sobre FETS (qui ha fet o dit què, què s'ha decidit, quina xifra), MAI sobre quin mitjà ho diu o com ho titula.
- Cada pregunta s'ha de poder respondre només amb els titulars que cites, i el fet ha d'aparèixer en almenys 2 mitjans diferents.
- No t'inventis res que no digui cap titular. Si dubtes, no facis la pregunta.
- 4 opcions curtes i plausibles; la primera és la correcta. Les incorrectes han de ser versemblants però clarament falses segons els titulars.
- "exp": 1-2 frases que expliquin la resposta i, si ve al cas, el context institucional (sense opinió).
- Neutralitat: res que afavoreixi o perjudiqui cap partit; to informatiu.
- Català correcte. No repeteixis cap de les preguntes que ja existeixen.
Respon només amb JSON: {"questions":[{"q":"...","a":["correcta","...","...","..."],"exp":"...","t":"un de: ${TOPICS.join(", ")}","src":[índexs dels titulars]}]}`;
  const draft = await ask([
    { role: "system", content: sys },
    { role: "user", content: `Preguntes que ja existeixen (no les repeteixis):\n${old.map((q) => "- " + q.q).join("\n") || "(cap)"}\n\nTitulars d'avui (índex. [mitjà] titular):\n${list}\n\nFes fins a ${MAX_NEW} preguntes.` },
  ]);
  if (!draft || !Array.isArray(draft.questions)) { log("Sense resposta vàlida: no es canvia res."); return; }

  // Validació mecànica
  const norm = (s) => String(s || "").trim().toLowerCase();
  let cand = draft.questions.filter((q) => {
    if (!q || typeof q.q !== "string" || !Array.isArray(q.a) || q.a.length !== 4 || !Array.isArray(q.src)) return false;
    if (new Set(q.a.map(norm)).size !== 4 || q.a.some((x) => !String(x).trim())) return false;
    const src = q.src.map(Number).filter((i) => items[i]);
    const outlets = new Set(src.map((i) => items[i].s));
    if (outlets.size < 2) return false;
    if (/\b(diari|mitjà|titular|segons\s+(el|la)\s+[A-Z])/i.test(q.q)) return false; // preguntes sobre els mitjans
    if (old.some((o) => norm(o.q) === norm(q.q))) return false;
    q.src = src;
    return true;
  });
  log("proposades", draft.questions.length, "vàlides", cand.length);
  if (!cand.length) return;

  // 2) Comprovació: cada pregunta, respost només amb els seus titulars (opcions barrejades)
  const shuffled = cand.map((q, i) => {
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    return { i, order, text: `P${i}: ${q.q}\nOpcions: ${order.map((k, j) => `${"ABCD"[j]}) ${q.a[k]}`).join(" | ")}\nTitulars:\n${q.src.map((s) => `- [${items[s].s}] ${items[s].t}`).join("\n")}` };
  });
  const check = await ask([
    { role: "system", content: `Ets un verificador. Per a cada pregunta, respon NOMÉS amb la informació dels titulars que l'acompanyen. Si els titulars no permeten saber la resposta amb seguretat, o si més d'una opció pot ser correcta, marca "ok": false. Respon només amb JSON: {"answers":[{"p":número,"letter":"A|B|C|D","ok":true|false}]}` },
    { role: "user", content: shuffled.map((s) => s.text).join("\n\n") },
  ]);
  if (!check || !Array.isArray(check.answers)) { log("Sense verificació: no es canvia res."); return; }
  const good = cand.filter((q, i) => {
    const a = check.answers.find((x) => Number(x.p) === i);
    if (!a || a.ok !== true) return false;
    const j = "ABCD".indexOf(String(a.letter).trim().toUpperCase());
    return j >= 0 && shuffled[i].order[j] === 0;
  });
  log("superen la verificació", good.length);
  if (!good.length) return;

  const fresh = good.map((q) => ({
    d: today,
    t: TOPICS.includes(q.t) ? q.t : "politica",
    q: q.q.trim(),
    a: q.a.map((x) => String(x).trim()),
    exp: String(q.exp || "").trim(),
    u: items[q.src[0]].u,
    auto: true,
  }));
  quiz.questions = [...fresh, ...old];
  quiz.updated = today;
  quiz.updatedAuto = today;
  fs.writeFileSync(QUIZ, JSON.stringify(quiz, null, 2) + "\n");
  log("noves", fresh.length, "total", quiz.questions.length);
})().catch((e) => { console.error("[quiz] error inesperat:", e.message); process.exit(0); });
