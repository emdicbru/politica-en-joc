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
// Versió del generador: si el test del dia el va fer una versió anterior, es torna a generar
const GEN_V = 2;
const VERIFY_MODELS = ["@cf/openai/gpt-oss-120b", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"];
// Fitxa de qui és qui (de les dades de l'app), perquè el model no s'equivoqui de càrrecs
function whoIsWho() {
  // Els caps de llista del 29N (els mateixos que DAILY_CANDIDATES de js/content-diari.js, que no és al repositori de les eines)
  const cands = [["PP", "Alberto Núñez Feijóo"], ["PSOE", "Pedro Sánchez"], ["Vox", "Santiago Abascal"], ["Frente Amplio", "Ada Colau"], ["Podemos", "Irene Montero"], ["ERC", "Gabriel Rufián"],
    ["Junts", "Míriam Nogueras"], ["PNV", "Maribel Vaquero"], ["EH Bildu", "Oskar Matute"], ["BNG", "Néstor Rego"], ["CC", "Cristina Valido"]];
  return [
    ...cands.map(([p, n]) => `${n}: cap de llista de ${p} a les eleccions generals del 29N`),
    "Pedro Sánchez (PSOE): president del Govern d'Espanya", "Salvador Illa (PSC): president de la Generalitat de Catalunya",
    "Francina Armengol (PSOE): presidenta del Congrés", "Carlos Cuerpo: vicepresident primer i ministre d'Economia; també de Transports des del 3-11-2026",
    "Isabel Díaz Ayuso (PP): presidenta de la Comunitat de Madrid", "Ada Colau: exalcaldessa de Barcelona (2015-2023)",
  ].map((x) => "- " + x).join("\n");
}
// Text sense accents ni signes, per comparar la resposta amb els titulars
const flat = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
// La resposta correcta d'una pregunta d'actualitat ha de sortir en algun dels titulars citats (paraules de 4 lletres o més, i les xifres)
function grounded(answer, heads) {
  const keys = flat(answer).split(" ").filter((w) => w.length >= 4 || /\d/.test(w));
  if (!keys.length) return false;
  return heads.some((h) => { const t = " " + flat(h) + " "; return keys.every((w) => t.includes(" " + w + " ") || t.includes(" " + w)); });
}
const TOPICS = ["campanya", "parlament", "politica", "economia", "habitatge", "justicia", "internacional", "energia", "territori", "immigracio", "societat", "cultura", "historia", "geografia", "ciencia"];
const arg = (k) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : null; };
const DRY = process.argv.includes("--prova");
const madrid = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);
// --dema: el test de demà (per provar el generador amb --prova quan el d'avui ja hi és)
const DAY = arg("dia") || (process.argv.includes("--dema") ? madrid(new Date(Date.now() + 864e5)) : madrid());
const BLACKOUT = [Date.parse("2026-11-24T00:00:00+01:00"), Date.parse("2026-11-29T21:00:00+01:00")];

const log = (...a) => console.log("[test]", ...a);
const warn = (...a) => { const m = a.join(" ").replace(/\s+/g, " "); console.log(process.env.GITHUB_ACTIONS ? `::warning title=Test d'actualitat::${m}` : `[test] AVÍS: ${m}`); };

(async () => {
  const test = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { days: {} };
  if (test.days[DAY] && (test.days[DAY].v || 1) >= GEN_V) { log("El test de", DAY, "ja hi és."); return; }
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
Fes 16 preguntes de resposta múltiple:
- 10 d'ACTUALITAT ("k":"actualitat"): sobre els TEMES i FETS dels titulars (què s'ha decidit, qui ha fet què, quina xifra, on ha passat). El fet ha d'aparèixer en almenys 2 mitjans diferents de la llista. MAI preguntis quin mitjà publica o titula una cosa, ni sobre els mitjans.
- 6 de CULTURA GENERAL ("k":"cultura") lligades a algun tema dels titulars: història, geografia, institucions, ciència, economia o cultura que ajudin a entendre la notícia (exemple: si es parla d'una cimera del clima, «A quina ciutat es va signar l'acord sobre el clima del 2015?»). Només dades establertes i indiscutibles.
Regles:
- Neutralitat política estricta: res d'opinions, valoracions ni preguntes que afavoreixin o perjudiquin cap partit.
- Res de sang, morbositat ni bromes sobre accidents o víctimes.${veda ? "\n- Estem en veda electoral: cap pregunta sobre enquestes ni sondejos." : ""}
- No t'inventis res: ni noms, ni càrrecs, ni xifres. A les d'actualitat, la resposta correcta ha de sortir tal qual en algun dels titulars que cites. Si dubtes, no facis la pregunta.
- Càrrecs i candidatures: fes servir aquesta fitxa i no n'atribueixis cap altre:
${whoIsWho()}
- Com a molt 2 preguntes del tipus «qui ha dit / qui ha fet». Pregunta també pel QUÈ: què s'ha aprovat, quina mesura, quina xifra, on, quan, per què.
- Les opcions incorrectes han de ser del mateix tipus que la correcta i diferents en cada pregunta: no repeteixis el mateix grup d'opcions (per exemple, sempre els mateixos quatre polítics).
- Res de preguntes que demanin recordar xifres del sistema electoral: quants diputats o senadors elegeix una circumscripció, repartiments d'escons, la llei d'Hondt, barreres electorals o majories.
- Res de loteries, successos, morbositat, ni preguntes «segons la notícia». Les de cultura s'han de poder respondre sense haver llegit cap notícia.
- Enunciat clar i que s'entengui sol (sense «segons aquest titular»), de com a molt 130 caràcters.
- 4 opcions curtes (màxim 40 caràcters), del mateix tipus i versemblants; la primera és la correcta. Cap opció com «Totes» o «Cap».
- "exp": una frase curta (màxim 160 caràcters) que expliqui la resposta amb context.
- "t": un d'aquests temes: ${TOPICS.join(", ")}. "src": els números dels titulars en què es basa (per a les d'actualitat, almenys 2 de mitjans diferents; per a les de cultura, el de la notícia relacionada).
- Varietat: temes diferents, no més de 2 preguntes sobre el mateix fet, i dificultat variada (algunes fàcils, algunes difícils).
- Català normatiu (gènere i concordança: «el finançament», «la Generalitat»). Noms propis de persones tal com són; topònims en català (Canàries, Saragossa).
${recent.length ? `- No repeteixis aquestes preguntes dels últims dies:\n${recent.slice(0, 60).map((q) => "  · " + q).join("\n")}` : ""}
Respon NOMÉS amb JSON: {"questions":[{"k":"actualitat","q":"…","a":["correcta","…","…","…"],"exp":"…","t":"…","src":[1,2]}]}`;
  const draft = await askJson([{ role: "system", content: sys }, { role: "user", content: `Data: ${DAY}. Titulars dels últims dies:\n${list}` }], { warn, temperature: 0.4, max_tokens: 6000, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" });
  // La llista pot arribar sola o amb un altre nom: es fa servir la primera llista que hi hagi
  if (draft && !Array.isArray(draft.questions)) draft.questions = Array.isArray(draft) ? [...draft] : Object.values(draft).find(Array.isArray);
  if (!draft || !Array.isArray(draft.questions)) return warn("sense resposta vàlida de la IA (proposta):", draft ? JSON.stringify(draft).slice(0, 400) : "res");
  log("model", draft.__model, "· proposades", draft.questions.length);

  // Validació de forma. Els camps poden arribar amb altres noms (question, options…); es compta per què es descarta cada una
  const norm = (s) => String(s || "").trim();
  const pickA = (q) => { const opts = q.a || q.options || q.opcions || q.answers || []; const ok = q.correct ?? q.answer ?? q.resposta; return (typeof ok === "string" && opts.includes(ok) ? [ok, ...opts.filter((x) => x !== ok)] : typeof ok === "number" && opts[ok] !== undefined ? [opts[ok], ...opts.filter((_, j) => j !== ok)] : opts).map(norm); };
  const why = {}, no = (r) => { why[r] = (why[r] || 0) + 1; return false; };
  let cand = draft.questions.map((q) => {
    const k = (q.k || q.kind || q.tipus) === "cultura" ? "cultura" : "actualitat", t = q.t || q.topic || q.tema;
    return { k, q: norm(q.q || q.question || q.pregunta), a: pickA(q), exp: norm(q.exp || q.explanation || q.explicacio), t: TOPICS.includes(t) ? t : k === "cultura" ? "cultura" : "politica", src: (q.src || q.sources || q.fonts || []).map(Number).filter((i) => items[i]) };
  }).filter((q) => {
    if (q.q.length < 15 || q.q.length > 160) return no("enunciat");
    if (q.a.length !== 4 || !q.a.every((x) => x && x.length <= 60) || new Set(q.a.map((x) => x.toLowerCase())).size !== 4) return no("opcions");
    if (!q.exp) return no("explicació");
    if (/(diari|mitjà|titular|publica|segons el|la vanguardia|el país|ara.cat|vilaweb)/i.test(q.q)) return no("mitjans");
    // Els titulars que expliquen el mateix fet: hi surt la resposta i alguna paraula clau de la pregunta
    // Si la resposta és un nom o una xifra (el que la IA s'inventava), ha de sortir tal qual als titulars; si és un concepte
    // (en català, i els titulars sovint en castellà), n'hi ha prou que els titulars citats siguin de 2 mitjans diferents
    const literal = q.k !== "cultura" && /d|[A-ZÀ-ÚÇ]/.test(q.a[0]);
    if (literal) {
      const keys = flat(q.q).split(" ").filter((w) => w.length >= 6).map((w) => w.slice(0, 5));
      const same = items.map((x, i) => i).filter((i) => grounded(q.a[0], [items[i].t]) && keys.some((w) => flat(items[i].t).includes(w)));
      q.src = [...new Set([...q.src.filter((i) => grounded(q.a[0], [items[i].t])), ...same])];
    }
    if (q.k !== "cultura" && new Set(q.src.map((i) => items[i].s)).size < 2) return no(literal ? "nom o xifra en menys de 2 mitjans" : "menys de 2 mitjans");
    if (/loteria|primitiva|bonoloto|euromilions|segons la not[ií]cia|en les not[ií]cies|assassina|mort[ae]s?/i.test(q.q + " " + q.a.join(" "))) return no("tema vetat");
    if (/hondt|quants (diputats|senadors|escons)|escons (elegeix|t[eé]|reparteix)|barrera electoral|majoria absoluta/i.test(q.q)) return no("sistema electoral");
    if (literal && !grounded(q.a[0], q.src.map((i) => items[i].t))) return no("resposta no als titulars");
    return true;
  });
  if (Object.keys(why).length) warn("descartades:", JSON.stringify(why), "· exemple rebut:", JSON.stringify(draft.questions[0]).slice(0, 500));
  // Cap joc d'opcions repetit (3 o més opcions en comú amb una pregunta anterior) i com a molt 2 de «qui»
  const kept = []; let who = 0;
  for (const q of cand) {
    const set = new Set(q.a.map(flat));
    if (kept.some((k) => k.a.filter((x) => set.has(flat(x))).length >= 3)) { log("descartada (opcions repetides):", q.q); continue; }
    if (/^(qui|quin pol[ií]tic|quina pol[ií]tica|quin l[ií]der|quina l[ií]der|quin president|quina presidenta|quin ministre|quina ministra|quin alcalde|quina alcaldessa)\b/i.test(q.q) && ++who > 2) { log("descartada (massa preguntes de «qui»):", q.q); continue; }
    kept.push(q);
  }
  cand = kept;
  log("vàlides de forma", cand.length);
  if (cand.length < MIN_Q) return warn("massa poques preguntes vàlides:", cand.length);

  // Verificació: la IA respon a cegues (opcions barrejades) i diu si la pregunta és clara i certa
  const shuffled = cand.map((q) => { const o = [...q.a].sort(() => Math.random() - 0.5); return { o, ok: o.indexOf(q.a[0]) }; });
  const vsys = `Ets un verificador de fets molt estricte. Per a cada pregunta, tria l'opció correcta (índex 0-3) fent servir els titulars i el teu coneixement, i digues si la pregunta és vàlida: certa, no ambigua (només una opció correcta), neutral i comprensible sola. Respon NOMÉS amb JSON: {"answers":[{"i":0,"choice":2,"valid":true,"why":"…"}]}`;
  const vq = cand.map((q, i) => `${i}. ${q.q}\n   ${shuffled[i].o.map((x, j) => `${j}) ${x}`).join("  ")}`).join("\n");
  const checks = [];
  for (const model of VERIFY_MODELS) {
    const c = await askJson([{ role: "system", content: vsys }, { role: "user", content: `Fitxa de qui és qui:\n${whoIsWho()}\n\nTitulars:\n${list}\n\nPreguntes:\n${vq}` }], { warn, temperature: 0, max_tokens: 5000, model });
    if (c && !Array.isArray(c.answers)) c.answers = Object.values(c).find(Array.isArray);
    if (!c || !Array.isArray(c.answers)) return warn("sense resposta vàlida de la IA (verificació amb " + model + "):", c ? JSON.stringify(c).slice(0, 400) : "res");
    checks.push(c);
  }
  const good = cand.filter((q, i) => checks.every((c) => { const a = c.answers.find((x) => Number(x.i) === i); return a && a.valid === true && Number(a.choice) === shuffled[i].ok; }));
  log("superen la verificació", good.length, "de", cand.length);
  if (good.length < MIN_Q) return warn("després de la verificació en queden massa poques:", good.length);

  // Barreja: unes 6 d'actualitat i unes 4 de cultura
  const act = good.filter((q) => q.k === "actualitat"), cul = good.filter((q) => q.k === "cultura");
  const pick = [...act.slice(0, Math.max(MAX_Q - Math.min(4, cul.length), 0)), ...cul.slice(0, 4)].slice(0, MAX_Q);
  const questions = pick.map((q) => ({ k: q.k, t: q.t, q: q.q, a: q.a, exp: q.exp, ...(q.src.length ? { u: items[q.src[0]].u, s: [...new Set(q.src.map((i) => items[i].s))].slice(0, 3) } : {}) }));
  test.days[DAY] = { v: GEN_V, n: questions.length, model: draft.__model, questions };
  // Només els últims dies
  const keep = madrid(new Date(Date.now() - KEEP_DAYS * 864e5));
  for (const d of Object.keys(test.days)) if (d < keep) delete test.days[d];
  test.about = "Test d'actualitat del dia (secció Inici i Rànquing). El genera cada matí tools/update-test.js amb la IA de Cloudflare i una verificació. La primera resposta de 'a' és la correcta (l'app les barreja). 'k': actualitat o cultura.";
  test.updated = DAY;
  log(`${questions.length} preguntes per al ${DAY} (${questions.filter((q) => q.k === "actualitat").length} d'actualitat, ${questions.filter((q) => q.k === "cultura").length} de cultura)`);
  if (DRY) { console.log(JSON.stringify(test.days[DAY], null, 1)); warn(`PROVA (${DAY}, no es desa): ` + questions.map((q, i) => `${i + 1}. [${q.k}] ${q.q} → ${q.a[0]} (${q.a.slice(1).join(" / ")})`).join(" || ").slice(0, 3800)); return; }
  fs.writeFileSync(OUT, JSON.stringify(test, null, 1) + "\n");
})().catch((e) => { warn("error inesperat:", e.message); process.exit(0); });
