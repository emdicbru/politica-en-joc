#!/usr/bin/env node
// Actualitza les enquestes del pactòmetre (data/enquestes.json) a partir del recull de la Viquipèdia en anglès,
// «Opinion polling for the 2026 Spanish general election» (la mateixa font que es feia servir a mà a js/pacte.js).
// No fa servir cap clau: l'API de la Viquipèdia és pública. Si alguna cosa no quadra (la taula canvia de format, hi ha
// massa poques enquestes, els escons no sumen), no toca res i ho avisa a GitHub Actions.
//
// Regles:
//  · Tampoc les enquestes internes dels partits (p. ex. «Vox/The Objective»).
//  · Les enquestes encarregades per mitjans d'extrema dreta o vetats (OKDiario, EDATV, Libertad Digital, La Gaceta,
//    esRadio, Periodista Digital) no s'hi inclouen.
//  · Veda electoral (LOREG, art. 69.7): del 24 al 28 de novembre no es pot publicar cap enquesta nova. Aquells dies no
//    s'actualitza res, i l'app ja amaga les enquestes (js/pacte.js, POLL_BLACKOUT).
//  · Escons: si l'enquesta dona un interval (114/120), es fa servir el punt mitjà, com a mà.
// Ús: node tools/update-polls.js [--prova]   (--prova: no desa res, només ho mostra)
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "enquestes.json");
const PAGE = "Opinion_polling_for_the_2026_Spanish_general_election";
const API = `https://en.wikipedia.org/w/api.php?action=parse&page=${PAGE}&prop=text|revid&redirects=1&format=json&formatversion=2`;
const SOURCE = `https://en.wikipedia.org/wiki/${PAGE}`;
const N_SEATS = 9, N_PCT = 12;
const PCT_KEYS = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "salf"];
const BANNED = /okdiario|edatv|libertad digital|la gaceta|esradio|periodista digital/i;
// Enquestes internes dels partits (la «firma» és el mateix partit): tampoc, per neutralitat
const PARTY_POLL = /^(PP|PSOE|Vox|Sumar|Podemos|ERC|Junts|PNV|EH Bildu|Bildu|BNG|CC|UPN|SALF)\s*(\/|$)/i;
// Veda: del 24 de novembre a les 0:00 fins que tanquen els col·legis (hora peninsular)
const BLACKOUT = [Date.parse("2026-11-24T00:00:00+01:00"), Date.parse("2026-11-29T21:00:00+01:00")];
const DRY = process.argv.includes("--prova");

const log = (...a) => console.log("[enquestes]", ...a);
// A GitHub Actions, l'avís surt a la pàgina de l'execució (es pot llegir sense entrar al registre)
const warn = (msg) => { console.log(process.env.GITHUB_ACTIONS ? `::warning title=Enquestes::${msg}` : `[enquestes] AVÍS: ${msg}`); };

// Partit de cada columna, pel nom de l'article de la Viquipèdia o pel text de la capçalera
const PARTY = [
  [/^PP$|People's Party/i, "pp"], [/^PSOE$|Socialist Workers/i, "psoe"], [/^Vox/i, "vox"], [/^FA$|Frente Amplio|Sumar/i, "fa"],
  [/^Podemos/i, "podemos"], [/^ERC$|Republican Left of Catalonia/i, "erc"], [/^Junts|Together for Catalonia/i, "junts"],
  [/Bildu/i, "bildu"], [/^PNV$|Basque Nationalist/i, "pnv"], [/^BNG$|Galician Nationalist/i, "bng"], [/^CCa?$|Canarian Coalition/i, "cc"],
  [/^UPN$|Navarrese People/i, "upn"], [/SALF|Se Acabó La Fiesta/i, "salf"],
];
const partyOf = (s) => (PARTY.find(([re]) => re.test(s)) || [])[1] || "altres";

const clean = (s) => s.replace(/<sup[\s\S]*?<\/sup>/g, "").replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "")
  .replace(/&#160;|&nbsp;/g, " ").replace(/&#8211;|&ndash;/g, "–").replace(/&amp;/g, "&").trim();
const cellsOf = (row) => [...row.matchAll(/<(t[hd])([^>]*)>([\s\S]*?)(?=<t[hd][\s>]|$)/g)].map((m) => ({ tag: m[1], span: Number((m[2].match(/colspan="(\d+)"/) || [])[1] || 1), html: m[3] }));

// «28.5\n114/120» → { pct: 28.5, seats: 117 }
function value(html) {
  const [a, b] = clean(html).split("\n").map((x) => x.trim());
  const num = (x) => { const v = parseFloat(String(x || "").replace(",", ".")); return Number.isFinite(v) ? v : null; };
  const pct = num(a);
  let seats = null;
  if (b) { const r = b.split("/").map((x) => parseInt(x, 10)).filter(Number.isFinite); if (r.length) seats = r.reduce((s, x) => s + x, 0) / r.length; }
  return { pct, seats };
}

// Data de fi del treball de camp («26 Oct–5 Nov», «1–14 Oct», «31 Dec») → «5 nov», per mostrar-la com abans
const MON = { jan: "gen", feb: "febr", mar: "març", apr: "abr", may: "maig", jun: "juny", jul: "jul", aug: "ag", sep: "set", oct: "oct", nov: "nov", dec: "des" };
const dateCa = (s) => s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => MON[m.toLowerCase()]).replace(/\s+\d{4}$/, "");

function parse(html) {
  // La primera taula de resultats: la que té «Polling firm» i «Turnout» (la de les enquestes més recents)
  const tables = html.split("<table").slice(1).map((t) => t.split("</table>")[0]);
  const t = tables.find((x) => /Polling firm/.test(x) && /Turnout/.test(x));
  if (!t) throw new Error("no trobo la taula d'enquestes");
  const rows = t.split(/<tr[^>]*>/).slice(1);
  // Capçalera: les 4 primeres columnes són firma, dates, mostra i participació; després, un partit per columna
  const head = cellsOf(rows[0]);
  const cols = [];
  for (const c of head) {
    const txt = clean(c.html), title = (c.html.match(/title="([^"]+)"/) || [])[1] || "";
    if (/Polling firm|Fieldwork|Sample|Turnout|Lead/.test(txt)) continue;
    cols.push(partyOf(title || txt));
  }
  if (!cols.includes("pp") || !cols.includes("psoe")) throw new Error("la capçalera ha canviat: " + cols.join(","));
  const polls = [];
  for (const r of rows.slice(1)) {
    const cs = cellsOf(r);
    if (cs.length < 6 || cs[0].tag !== "td") continue;
    const firm = clean(cs[0].html).replace(/\n/g, " "), d = clean(cs[1].html);
    if (!firm || /election|Hypothetical/i.test(firm)) continue;
    if (BANNED.test(firm)) { log("descartada (font vetada):", firm); continue; }
    if (PARTY_POLL.test(firm)) { log("descartada (enquesta d'un partit):", firm); continue; }
    const pct = {}, seats = {};
    let k = 0;
    for (const c of cs.slice(4)) {
      if (k >= cols.length) break;
      const v = value(c.html), id = cols[k];
      // Una casella que ocupa dues columnes (p. ex. coalició FA + FV) compta per al primer partit
      if (v.pct != null) pct[id] = (pct[id] || 0) + v.pct;
      if (v.seats != null) seats[id] = (seats[id] || 0) + v.seats;
      k += c.span;
    }
    polls.push({ n: firm.replace(/\s*\/\s*/, " / "), d: dateCa(d), pct, seats });
  }
  return polls;
}

(async () => {
  if (Date.now() >= BLACKOUT[0] && Date.now() < BLACKOUT[1]) { log("Veda electoral: no s'actualitza res fins que tanquin els col·legis."); return; }
  const r = await fetch(API, { headers: { "User-Agent": "PoliticaEnJoc/1.0 (https://politicaenjoc.cat; enquestes del pactometre)" } });
  if (!r.ok) return warn(`la Viquipèdia ha respost ${r.status}: no es canvia res`);
  const j = await r.json();
  if (!j.parse) return warn("resposta inesperada de la Viquipèdia: no es canvia res");
  let polls;
  try { polls = parse(j.parse.text); } catch (e) { return warn(`${e.message}: no es canvia res`); }

  // De cada institut i mitjà, només l'onada més recent (la taula va de més nova a més antiga), perquè no pesi el doble
  const seen = new Set(), latest = polls.filter((p) => !seen.has(p.n) && seen.add(p.n));
  const withSeats = latest.filter((p) => Object.keys(p.seats).length >= 6).slice(0, N_SEATS);
  const withPct = latest.filter((p) => p.pct.pp != null && p.pct.psoe != null).slice(0, N_PCT);
  // Comprovacions: prou enquestes i xifres versemblants
  const bad = withSeats.filter((p) => { const s = Object.values(p.seats).reduce((a, b) => a + b, 0); return s < 300 || s > 360 || !(p.seats.pp > 60 && p.seats.pp < 220); });
  if (withSeats.length < 5 || withPct.length < 6) return warn(`només hi ha ${withSeats.length} enquestes amb escons i ${withPct.length} amb percentatges: no es canvia res`);
  if (bad.length) return warn(`escons estranys a ${bad.map((p) => p.n).join(", ")}: no es canvia res`);

  const out = {
    about: "Enquestes del pactòmetre. Les actualitza tools/update-polls.js a partir de la Viquipèdia (recull d'enquestes). Escons: punt mitjà dels intervals; l'app els ajusta a 350.",
    source: SOURCE, revid: j.parse.revid,
    seats: withSeats.map((p) => ({ n: p.n, d: p.d, s: p.seats })),
    pctKeys: PCT_KEYS, pct: withPct.map((p) => PCT_KEYS.map((k) => (p.pct[k] != null ? Math.round(p.pct[k] * 10) / 10 : null))),
  };
  const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const same = old && JSON.stringify({ ...old, updated: 0, revid: 0 }) === JSON.stringify({ ...out, updated: 0, revid: 0 });
  log(`${out.seats.length} enquestes amb escons (la més recent: ${out.seats[0].n}, ${out.seats[0].d}) · ${out.pct.length} amb percentatges`);
  if (same) { log("Sense canvis."); return; }
  out.updated = new Date().toISOString().slice(0, 10);
  if (DRY) { console.log(JSON.stringify(out, null, 1).slice(0, 1500)); return; }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
  log("Desat", OUT);
})().catch((e) => { warn("error inesperat: " + e.message); process.exit(0); });
