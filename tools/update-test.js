#!/usr/bin/env node
// Test d'actualitat del dia (data/test.json): 8-10 preguntes noves cada dia, per a tothom les mateixes, amb rànquing propi.
// Unes 6 sobre els temes de l'actualitat dels últims dies i unes 4 de cultura general lligada a alguna notícia (si es
// parla d'una cimera del clima, on es va signar l'Acord de París). Mai sobre quin mitjà publica què.
// La IA és la de Cloudflare (tools/ia.js). Dues passades: proposta i verificació (la IA respon cada pregunta sense saber
// la correcta i només queden les que encerta i no troba ambigües). Si en surten massa poques, no es publica i es torna
// a provar a l'hora següent (el workflow s'executa cada hora al matí).
// Ús: node tools/update-test.js [--dia AAAA-MM-DD] [--prova]
"use strict";
const fs = require("fs"), path = require("path");
const { askJson } = require("./ia.js");

const ROOT = path.join(__dirname, "..");
const NEWS = path.join(ROOT, "data", "news.json"), OUT = path.join(ROOT, "data", "test.json");
const KEEP_DAYS = 21, MIN_Q = 8, MAX_Q = 10;
const TOPICS = ["campanya", "parlament", "politica", "economia", "habitatge", "justicia", "internacional", "energia", "territori", "immigracio", "societat", "cultura", "historia", "geografia", "ciencia"];
const arg = (k) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes("--prova");
const madrid = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);
const DAY = arg("dia") || madrid();
const BLACKOUT = [Date.parse("2026-11-24T00:00:00+01:00"), Date.parse("2026-11-29T21:00:00+01:00")];

const log = (...a) => console.log("[test]", ...a);
const warn = (...a) => { const m = a.join(" ").replace(/\s+/g, " "); console.log(process.env.GITHUB_ACTIONS ? `::warning title=Test d'actualitat::${m}` : `[test] AVÍS: ${m}`); };

(async () => {
  const test = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { days: {} };
  if (test.days[DAY]) { log("El test de", DAY, "ja hi és."); return; }
  const news = JSON.parse(fs.readFileSync(NEWS, "utf8"));
  // Titulars dels últims 3 dies, sense repetits; es marca quantes fonts diferents expliquen cada tema
  const since = Date.now() - 72 * 3600e3, seen = new Set();
  const items = news.items.filter((x) => x.d >= since && x.t && !seen.has(x.t) && seen.add(x.t)).slice(0, 160);
  if (items.length < 25) return warn("massa pocs titulars:", items.length);
  const list = items.map((x, i) => `${i}. [${x.s}] ${x.t}`).join("\n");
  // Preguntes dels últims dies, per no repetir-les
  const recent = Object.entries(test.days).filter(([d]) => d >= madrid(new Date(Date.now() - 10 * 864e5))).flatMap(([, v]) => v.questions.map((q) => q.q));
  const veda = Date.now() >= BLACKOUT[0] && Date.now() < BLACKOUT[1];

  const sys = `Ets l'editor del «Test d'actualitat» diari de Política en Joc, una app en català sobre política i les eleccions generals del 29 de novembre de 2026. Escrius en català correcte i neutral.
Fes 14 preguntes de resposta múltiple:
- 9 d'ACTUALITAT ("k":"actualitat"): sobre els TEMES i FETS dels titulars (què s'ha decidit, qui ha fet què, quina xifra, on ha passat). El fet ha d'aparèixer en almenys 2 mitjans diferents de la llista. MAI preguntis quin mitjà publica o titula una cosa, ni sobre els mitjans.
- 5 de CULTURA GENERAL ("k":"cultura") lligades a algun tema dels titulars: història, geografia, institucions, ciència, economia o cultura que ajudin a entendre la notícia (exemple: si es parla d'una cimera del clima, «A quina ciutat es va signar l'acord sobre el clima del 2015?»). Només dades establertes i indiscutibles.
Regles:
- Neutralitat política estricta: res d'opinions, valoracions ni preguntes que afavoreixin o perjudiquin cap partit.
- Res de sang, morbositat ni bromes sobre accidents o víctimes.${veda ? "\n- Estem en veda electoral: cap pregunta sobre enquestes ni sondejos." : ""}
- No t'inventis res. Si dubtes, no facis la pregunta.
- Enunciat clar i que s'entengui sol (sense «segons aquest titular»), de com a molt 130 caràcters.
- 4 opcions curtes (màxim 40 caràcters), del mateix tipus i versemblants; la primera és la correcta. Cap opció com «Totes» o «Cap».
- "exp": 1 o 2 frases que expliquin la resposta amb context.
- "t": un d'aquests temes: ${TOPICS.join(", ")}. "src": els números dels titulars en què es basa (per a les d'actualitat, almenys 2 de mitjans diferents; per a les de cultura, el de la notícia relacionada).
- Varietat: temes diferents, no més de 2 preguntes sobre el mateix fet, i dificultat variada (algunes fàcils, algunes difícils).
${recent.length ? `- No repeteixis aquestes preguntes dels últims dies:\n${recent.slice(0, 60).map((q) => "  · " + q).join("\n")}` : ""}
Respon NOMÉS amb JSON: {"questions":[{"k":"actualitat","q":"…","a":["correcta","…","…","…"],"exp":"…","t":"…","src":[1,2]}]}`;
  const draft = await askJson([{ role: "system", content: sys }, { role: "user", content: `Data: ${DAY}. Titulars dels últims dies:\n${list}` }], { warn, temperature: 0.4, max_tokens: 7000 });
  if (!draft || !Array.isArray(draft.questions)) return warn("sense resposta vàlida de la IA (proposta)");
  log("model", draft.__model, "· proposades", draft.questions.length);

  // Validació de forma
  const norm = (s) => String(s || "").trim();
  let cand = draft.questions.map((q) => ({ k: q.k === "cultura" ? "cultura" : "actualitat", q: norm(q.q), a: (q.a || []).map(norm), exp: norm(q.exp), t: TOPICS.includes(q.t) ? q.t : q.k === "cultura" ? "cultura" : "politica", src: (q.src || []).map(Number).filter((i) => items[i]) }))
    .filter((q) => q.q.length >= 15 && q.q.length <= 160 && q.a.length === 4 && q.a.every((x) => x && x.length <= 60) && new Set(q.a.map((x) => x.toLowerCase())).size === 4 && q.exp)
    .filter((q) => !/\b(diari|mitjà|titular|publica|segons el|la vanguardia|el país|ara\.cat|vilaweb)\b/i.test(q.q))
    .filter((q) => q.k === "cultura" || new Set(q.src.map((i) => items[i].s)).size >= 2);
  log("vàlides de forma", cand.length);
  if (cand.length < MIN_Q) return warn("massa poques preguntes vàlides:", cand.length);

  // Verificació: la IA respon a cegues (opcions barrejades) i diu si la pregunta és clara i certa
  const shuffled = cand.map((q) => { const o = [...q.a].sort(() => Math.random() - 0.5); return { o, ok: o.indexOf(q.a[0]) }; });
  const vsys = `Ets un verificador de fets molt estricte. Per a cada pregunta, tria l'opció correcta (índex 0-3) fent servir els titulars i el teu coneixement, i digues si la pregunta és vàlida: certa, no ambigua (només una opció correcta), neutral i comprensible sola. Respon NOMÉS amb JSON: {"answers":[{"i":0,"choice":2,"valid":true,"why":"…"}]}`;
  const vq = cand.map((q, i) => `${i}. ${q.q}\n   ${shuffled[i].o.map((x, j) => `${j}) ${x}`).join("  ")}`).join("\n");
  const check = await askJson([{ role: "system", content: vsys }, { role: "user", content: `Titulars:\n${list}\n\nPreguntes:\n${vq}` }], { warn, temperature: 0, max_tokens: 4000 });
  if (!check || !Array.isArray(check.answers)) return warn("sense resposta vàlida de la IA (verificació)");
  const good = cand.filter((q, i) => { const a = check.answers.find((x) => Number(x.i) === i); return a && a.valid === true && Number(a.choice) === shuffled[i].ok; });
  log("superen la verificació", good.length, "de", cand.length);
  if (good.length < MIN_Q) return warn("després de la verificació en queden massa poques:", good.length);

  // Barreja: unes 6 d'actualitat i unes 4 de cultura
  const act = good.filter((q) => q.k === "actualitat"), cul = good.filter((q) => q.k === "cultura");
  const pick = [...act.slice(0, Math.max(MAX_Q - Math.min(4, cul.length), 0)), ...cul.slice(0, 4)].slice(0, MAX_Q);
  const questions = pick.map((q) => ({ k: q.k, t: q.t, q: q.q, a: q.a, exp: q.exp, ...(q.src.length ? { u: items[q.src[0]].u, s: [...new Set(q.src.map((i) => items[i].s))].slice(0, 3) } : {}) }));
  test.days[DAY] = { n: questions.length, model: draft.__model, questions };
  // Només els últims dies
  const keep = madrid(new Date(Date.now() - KEEP_DAYS * 864e5));
  for (const d of Object.keys(test.days)) if (d < keep) delete test.days[d];
  test.about = "Test d'actualitat del dia (secció Inici i Rànquing). El genera cada matí tools/update-test.js amb la IA de Cloudflare i una verificació. La primera resposta de 'a' és la correcta (l'app les barreja). 'k': actualitat o cultura.";
  test.updated = DAY;
  log(`${questions.length} preguntes per al ${DAY} (${questions.filter((q) => q.k === "actualitat").length} d'actualitat, ${questions.filter((q) => q.k === "cultura").length} de cultura)`);
  if (DRY) { console.log(JSON.stringify(test.days[DAY], null, 1)); return; }
  fs.writeFileSync(OUT, JSON.stringify(test, null, 1) + "\n");
})().catch((e) => { warn("error inesperat:", e.message); process.exit(0); });
