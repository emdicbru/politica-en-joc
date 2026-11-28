// Electoporra del 29N (#electoporra; #pronostics, #prediccio i #escons hi porten). Es juga amb les monedes de joc (botiga.js;
// moneda inventada, sense cap valor: no es poden comprar ni bescanviar), sol o amb un grup d'amics (les Lligues d'amics), en
// quatre passos:
//  1. El teu Congrés: cadascú reparteix els 350 escons i hi aposta monedes. Com més escons encerti, més en cobra
//     (EP_CONG: ×4 si n'encerta el 97 % o més, ×2 del 94 al 96 %, les recupera del 90 al 93 %; si no, les perd).
//  2. Preguntes: monedes a les preguntes que vulgui. A cada pregunta, les monedes dels qui l'han fallada es reparteixen entre
//     els qui l'han encertada en proporció al que hi han posat (que recuperen); si ningú l'encerta, tothom recupera les seves.
//  3. Les teves apostes: «aquest partit traurà tants escons» (exactament ×5; com a mínim o com a màxim ×1,5).
//  4. Grup: la classificació del grup; durant la nit, en directe, el percentatge d'escons que encerta cadascú.
// Tothom té 300 monedes de regal per jugar-hi (EP_BONUS). Abans del tancament dels col·legis no es mostra què ha
// pronosticat ningú (llei d'enquestes): només qui ja ha jugat.
// Dades: Firestore porra/{uid} (b: preguntes, s: el Congrés, cs: l'aposta al Congrés, x: les apostes pròpies); les regles
// tanquen els canvis a les 20:00 del 29N. La Sala de control publica els pots de les preguntes i liquida (control.js).

const PRON_OPEN = Date.UTC(2026, 10, 22, 23); // 23N 00:00
const PRON_CLOSE = ESP_T.nit;                  // 29N 20:00
const EP_BONUS = 300;                          // monedes de regal per jugar a l'Electoporra
const EP_STEP = 10;
const EP_MAX = 5000;
const EP_XN = 10;                              // apostes pròpies, com a molt
const EP_CONG = [[97, 4], [94, 2], [90, 1]];   // encert mínim (%) → multiplicador de l'aposta al Congrés
const PRON_INV23 = ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"]; // investidura del 2023
const EP_CAT = ["B", "GI", "L", "T"];
// Partits del Congrés que es reparteixen (els petits, plegats a «Més partits»)
const EP_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "salf", "erc", "junts", "bildu", "pnv", "alhora", "d21", "adelante", "bng", "cc"];
const EP_MORE = ["fo", "pacma", "te", "sy"];
// Com es presenta cada partit el 29N (BOE del 3-11-2026): surt sota el nom, al repartir el Congrés
const EP_NOTE = {
  pp: "A Navarra, amb UPN (llista UPN-PP)", psoe: "PSC a Catalunya", fa: "Comuns, Compromís, Ara Més, CHA, UPC… No a Terol, Ceuta ni Melilla",
  podemos: "No sol a Catalunya, País Valencià, Balears ni Canàries", salf: "No a Bizkaia, Gipuzkoa, Girona, Lleida, Cantàbria ni Ciudad Real",
  erc: "Catalunya", junts: "Catalunya", alhora: "Catalunya", bildu: "País Basc, i a Navarra amb ERC", pnv: "País Basc (a Navarra, dins de Geroa Bai)",
  d21: "Democracia 21 i Ciudadanos · Madrid i Barcelona", adelante: "Andalusia", bng: "Galícia", cc: "Canàries",
  fo: "A les 52 circumscripcions", pacma: "30 circumscripcions", te: "Terol", sy: "Sòria",
};
const pronRange = (party, cuts) => ({
  opts: [["a", cuts[0] === 1 ? "Cap" : `Menys de ${cuts[0]}`], ["b", cuts[1] - 1 === cuts[0] ? `${cuts[0]}` : `De ${cuts[0]} a ${cuts[1] - 1}`], ["c", `De ${cuts[1]} a ${cuts[2] - 1}`], ["d", `${cuts[2]} o més`]],
  res: (d) => { const n = d.seats[party] || 0; return n < cuts[0] ? "a" : n < cuts[1] ? "b" : n < cuts[2] ? "c" : "d"; },
});
const epCatTop = (d) => {
  const v = {};
  (d.provs || []).filter((p) => EP_CAT.includes(p.code)).forEach((p) => Object.entries(p.vots || {}).forEach(([k, n]) => { if (k !== "altres") v[k] = (v[k] || 0) + n; }));
  return Object.entries(v).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};
const PRON_M = [
  { id: "m1", e: "🥇", q: "Qui serà la primera força?", opts: [["pp", "PP"], ["psoe", "PSOE"], ["vox", "Vox"], ["altre", "Un altre partit"]], res: (d) => (["pp", "psoe", "vox"].includes(d.ranking[0]) ? d.ranking[0] : "altre") },
  { id: "m6", e: "🔵", q: "PP i Vox sumaran majoria absoluta (176)?", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.pp || 0) + (d.seats.vox || 0) >= 176 ? "si" : "no") },
  { id: "m7", e: "🔴", q: "Els partits que van investir Sánchez el 2023 tornaran a sumar 176?", hint: "PSOE, FA, Podemos, ERC, Junts, EH Bildu, PNV, BNG i CC", opts: [["si", "Sí"], ["no", "No"]], res: (d) => (PRON_INV23.reduce((a, k) => a + (d.seats[k] || 0), 0) >= 176 ? "si" : "no") },
  { id: "m2", e: "🏛️", q: "Quants escons traurà el PP?", ...pronRange("pp", [120, 140, 160]) },
  { id: "m3", e: "🏛️", q: "Quants escons traurà el PSOE?", ...pronRange("psoe", [100, 120, 140]) },
  { id: "m4", e: "🏛️", q: "Quants escons traurà Vox?", ...pronRange("vox", [30, 45, 60]) },
  { id: "m8", e: "🏛️", q: "Quants escons traurà Frente Amplio?", hint: "Amb Comuns-Front Ampli, Compromís, CHA i les altres marques de FA", ...pronRange("fa", [15, 25, 35]) },
  { id: "m9", e: "🟣", q: "Quants escons traurà Podemos?", ...pronRange("podemos", [1, 3, 6]) },
  { id: "m10", e: "🟤", q: "Quants escons traurà SALF (Se Acabó La Fiesta)?", ...pronRange("salf", [1, 3, 6]) },
  { id: "m11", e: "🗳️", q: "Alhora traurà algun escó?", hint: "Es presenta a Barcelona, Girona, Lleida i Tarragona", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.alhora || 0) > 0 ? "si" : "no") },
  { id: "m12", e: "🗳️", q: "D21 (Democracia 21 amb Ciudadanos) traurà algun escó?", hint: "Es presenta a Madrid i Barcelona", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.d21 || 0) > 0 ? "si" : "no") },
  { id: "m13", e: "⚖️", q: "Junts o ERC: qui traurà més escons?", opts: [["junts", "Junts"], ["erc", "ERC"], ["empat", "Empataran"]], res: (d) => { const j = d.seats.junts || 0, e = d.seats.erc || 0; return j > e ? "junts" : e > j ? "erc" : "empat"; } },
  { id: "m14", e: "📍", q: "Quin partit serà el més votat a Catalunya?", opts: [["psoe", "PSC"], ["junts", "Junts"], ["erc", "ERC"], ["pp", "PP"], ["altre", "Un altre"]], res: (d) => { if (!d.provs?.length) return null; const k = epCatTop(d); return ["psoe", "junts", "erc", "pp"].includes(k) ? k : "altre"; } }, // sense circumscripcions, es resol a mà
  { id: "m5", e: "📈", q: "La participació serà més alta o més baixa que el 2023 (66,6 %)?", opts: [["alta", "Més alta"], ["baixa", "Més baixa"]], res: (d) => (d.participacio == null ? null : d.participacio >= 66.6 ? "alta" : "baixa") },
];
const EP_STEPS = [["congres", "🏛️", "El teu Congrés"], ["preguntes", "🎯", "Preguntes"], ["apostes", "✍️", "Les teves apostes"], ["grup", "👥", "Grup"]];
const PronState = { mine: null, draft: null, step: "congres", league: null, leagues: [], saving: false, uid: null };
const EP_GROUP_KEY = "r29n-ep-grup";

function pronState() {
  const m = Esp.cfg.pron || "auto";
  const t = espNow();
  if (m === "off") return "off";
  if (m === "tancada" || t >= PRON_CLOSE) return "tancada";
  if (m === "oberta") return "oberta";
  return t < PRON_OPEN ? "aviat" : "oberta";
}
// Resultat de cada pregunta: el liquidat a la Sala de control o, mentre s'escruta, el provisional
function pronResults(d = Esp.data) {
  if (Esp.cfg.pronRes) return { res: Esp.cfg.pronRes, final: true };
  if (!d) return null;
  return { res: Object.fromEntries(PRON_M.map((m) => [m.id, m.res(d)])), final: false };
}
const epBets = (p) => p?.b || {};
const epMk = (p) => PRON_M.reduce((a, m) => a + (epBets(p)[m.id]?.a || 0), 0);
// Tot el que hi ha apostat: preguntes, Congrés i apostes pròpies
const pronStaked = (p) => epMk(p) + (p?.s ? p.cs || 0 : 0) + (p?.x || []).reduce((a, x) => a + (x.a || 0), 0);
const pronCount = (p) => PRON_M.filter((m) => epBets(p)[m.id]?.a > 0).length;
// Pots de cada pregunta: pots[m][opció] = { n: jugadors, a: monedes }; i de les apostes pròpies, per partit:
// pots.x[partit]["escons|marge"] = monedes
function pronPotsFrom(all) {
  const pots = { x: {} };
  PRON_M.forEach((m) => { pots[m.id] = {}; m.opts.forEach(([o]) => { pots[m.id][o] = { n: 0, a: 0 }; }); });
  all.forEach((pl) => {
    PRON_M.forEach((m) => { const b = epBets(pl)[m.id]; if (b && pots[m.id][b.o]) { pots[m.id][b.o].n++; pots[m.id][b.o].a += b.a; } });
    (pl.x || []).forEach((x) => { if (!epXValid(x)) return; const k = `${x.n}|${x.t}`; (pots.x[x.p] ||= {})[k] = (pots.x[x.p][k] || 0) + x.a; });
  });
  return pots;
}
// Què et torna una pregunta: si l'encertes, el que hi has posat més la teva part (en proporció) del que hi han posat els qui l'han fallada
function pronQ(m, b, win, pots) {
  if (!b || !win) return { got: b ? b.a : 0, share: 0, open: true };
  const pm = pots?.[m.id];
  const nobody = pm && pm[win] && pm[win].a === 0;
  if (b.o !== win) return nobody ? { got: b.a, share: 0, refund: true } : { got: 0, share: 0, lost: true };
  if (!pm || !pm[win]) return { got: b.a, share: null };
  const losers = Object.entries(pm).reduce((a, [o, v]) => a + (o === win ? 0 : v.a), 0);
  const share = pm[win].a ? losers * (b.a / pm[win].a) : 0;
  return { got: b.a + share, share };
}
// Escons encertats (per a cada partit, els que coincideixen) i en percentatge dels 350
const epHits = (s, real) => (s && real ? Object.keys({ ...s, ...real }).reduce((a, k) => a + Math.min(s[k] || 0, real[k] || 0), 0) : null);
const epPct = (hits) => (hits == null ? null : Math.round((hits / 350) * 1000) / 10);
const epCongMul = (pct) => (EP_CONG.find(([p]) => pct >= p) || [0, 0])[1];
// Apostes pròpies: «el partit P traurà N escons, amb un marge de ±t» (t = 0, 1 o 3). No hi ha quotes fixes: les monedes dels
// qui fallen amb aquell partit es reparteixen entre els qui l'encerten, amb més part com més precís (pes = monedes / (2t + 1)).
// Si l'encerta tothom, ningú no guanya res; si no l'encerta ningú, tothom recupera les seves. Així no hi ha apostes «segures»
// que donin monedes: una aposta òbvia l'encerta tothom i només et torna el que hi has posat.
const EP_XT = [[0, "exactament"], [1, "±1 escó"], [3, "±3 escons"]];
const epXValid = (x) => x && typeof x.n === "number" && [0, 1, 3].includes(x.t) && x.a > 0;
const epXOk = (x, seats) => epXValid(x) && Math.abs((seats?.[x.p] || 0) - x.n) <= x.t;
function epXQ(x, seats, pots) {
  if (!epXValid(x)) return { got: x.a || 0, refund: true }; // apostes d'abans de la v147 («com a mínim»…): es retornen
  if (!seats) return { got: x.a, open: true };
  const hit = epXOk(x, seats), pm = pots?.x?.[x.p];
  if (!pm) return { got: x.a, hit, share: null };
  let L = 0, W = 0;
  Object.entries(pm).forEach(([k, a]) => { const [n, t] = k.split("|").map(Number); if (Math.abs((seats[x.p] || 0) - n) <= t) W += a / (2 * t + 1); else L += a; });
  if (!hit) return W > 0 ? { got: 0, hit, lost: true } : { got: x.a, hit, refund: true };
  const share = W ? L * (x.a / (2 * x.t + 1)) / W : 0;
  return { got: x.a + share, hit, share };
}
// Balanç de tot: el que s'hi ha posat i el que en torna (total); amb «partial», sense els pots encara
function pronBalance(p, r, pots = Esp.cfg.pronPots || PronState.pots, d = Esp.data) {
  const staked = pronStaked(p);
  if (!r) return { staked, total: staked, net: 0, partial: true };
  let total = 0;
  PRON_M.forEach((m) => { total += pronQ(m, epBets(p)[m.id], r.res[m.id], pots).got; });
  const seats = d?.seats;
  if (p?.s && p.cs) total += seats ? p.cs * epCongMul(epPct(epHits(p.s, seats))) : p.cs;
  (p?.x || []).forEach((x) => { total += epXQ(x, seats, pots).got; });
  total = Math.round(total);
  return { staked, total, net: total - staked, partial: !pots };
}
const epFmt = (n) => `${fmt(Math.round(n))} ${Math.round(n) === 1 ? "moneda" : "monedes"}`;
const epCoin = (n) => `<span class="ep-coin">🪙 ${fmt(Math.round(n))}</span>`;
function pronCountdown() {
  const s = Math.max(0, Math.round((PRON_CLOSE - espNow()) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}
// Les monedes en joc i les que ja t'ha tornat l'Electoporra (es desen al progrés: botiga.js les resta i les suma al moneder)
function epSyncCoins(r) {
  if (typeof Coins === "undefined" || !window.Online?.user) return;
  const mine = PronState.mine;
  Coins.setEp(pronStaked(mine), r?.final ? pronBalance(mine, r).total : 0);
}
// Monedes que pots posar ara: el moneder més el regal, més el que ja tens apostat i desat
const epAvail = () => (typeof Coins !== "undefined" ? Coins.epBalance() + pronStaked(PronState.mine) : EP_BONUS);
const epDraft = () => (PronState.draft ||= JSON.parse(JSON.stringify({ b: epBets(PronState.mine), s: PronState.mine?.s || null, pv: PronState.mine?.pv || null, cs: PronState.mine?.cs || 0, x: (PronState.mine?.x || []).filter(epXValid) })));
const epDirty = () => { const D = PronState.draft, M = PronState.mine || {}; if (!D) return false; const n = (o) => JSON.stringify([PRON_M.map((m) => o.b?.[m.id] || null), o.s ? Object.entries(o.s).filter(([, v]) => v).sort() : null, o.s ? o.cs || 0 : 0, o.x || [], o.pv ? Object.keys(o.pv).sort().map((c) => [c, Object.entries(o.pv[c]).filter(([, v]) => v).sort()]) : null]); return n(D) !== n({ b: M.b, s: M.s, cs: M.cs, x: M.x, pv: M.pv }); };
const epSeatSum = (s) => Object.values(s || {}).reduce((a, n) => a + (n || 0), 0);
// Escons que pot treure com a molt cada partit: els de les circumscripcions on es presenta
let epMaxCache = null;
const epMax = (k) => {
  if (!epMaxCache) { epMaxCache = {}; [...EP_PARTIES, ...EP_MORE].forEach((p) => { epMaxCache[p] = SIM_PROVS.filter((x) => typeof prdRuns !== "function" || prdRuns(p, x.code)).reduce((a, x) => a + x.seats, 0); }); }
  return epMaxCache[k] ?? 350;
};
// El Congrés del 2023 (UPN, que ara va amb el PP, dins del PP)
const epCong2023 = () => { const s = {}; Object.entries(ESP_2023).forEach(([k, v]) => { s[k] = v[0]; }); s.pp = (s.pp || 0) + 1; return s; };

// ---------- Per províncies ----------
// El teu Congrés repartit circumscripció per circumscripció. Per començar, l'app el reparteix sola de manera que cada
// partit tingui els escons que li has donat: vots del 2023 de cada lloc (on es presenta), multiplicats per un factor per
// partit que s'ajusta fins que la Llei d'Hondt dona el total que vols; i, si encara no quadra, es mouen escons solts.
function epAutoProv(s) {
  const B = prdBase(), ids = Object.keys(s).filter((k) => s[k] > 0);
  const seatsOf = Object.fromEntries(SIM_PROVS.map((p) => [p.code, p.seats]));
  const base = B.provs.map((p) => {
    const v = {};
    ids.forEach((k) => { if (prdRuns(k, p.code)) v[k] = p.v[k] || B.pat(k, p) * B.V * 0.01 || 1; });
    return { code: p.code, v, b: p.b, alt: p.v.altres || 0 };
  });
  const f = Object.fromEntries(ids.map((k) => [k, 1]));
  let best = null;
  for (let it = 0; it < 90; it++) {
    const tot = {}, pv = {};
    base.forEach(({ code, v, b, alt }) => {
      const vv = { altres: alt };
      Object.entries(v).forEach(([k, n]) => { vv[k] = n * f[k]; });
      const won = nitProv(vv, b, seatsOf[code]).won;
      pv[code] = { ...won };
      Object.entries(won).forEach(([k, n]) => { tot[k] = (tot[k] || 0) + n; });
    });
    const err = ids.reduce((a, k) => a + Math.abs((tot[k] || 0) - s[k]), 0) + Object.keys(tot).filter((k) => !s[k]).reduce((a, k) => a + tot[k], 0);
    if (!best || err < best.err) best = { err, pv: JSON.parse(JSON.stringify(pv)) };
    if (!err) break;
    ids.forEach((k) => { f[k] *= Math.pow((s[k] + 0.4) / ((tot[k] || 0) + 0.4), 0.55); });
  }
  // Ajust final: escons solts d'un partit que en té de més a un que en té de menys, on es presenti
  const pv = best.pv, sum = (k) => Object.values(pv).reduce((a, x) => a + (x[k] || 0), 0);
  for (let g = 0; g < 400; g++) {
    const need = [...ids, ...Object.keys(s)].find((k) => sum(k) < (s[k] || 0));
    const extra = [...new Set(Object.values(pv).flatMap(Object.keys))].find((k) => sum(k) > (s[k] || 0));
    if (!need || !extra) break;
    const code = Object.keys(pv).find((c) => (pv[c][extra] || 0) > 0 && prdRuns(need, c));
    if (!code) break;
    pv[code][extra]--; if (!pv[code][extra]) delete pv[code][extra];
    pv[code][need] = (pv[code][need] || 0) + 1;
  }
  return pv;
}
const epProvSum = (pv) => { const s = {}; Object.values(pv || {}).forEach((x) => Object.entries(x).forEach(([k, n]) => { if (n > 0) s[k] = (s[k] || 0) + n; })); return s; };
// Les dades per dibuixar el mapa (prediccio.js): el model del 2023 amb els escons de cada circumscripció triats
const epProvD = (pv) => prdCompute(prdStart("2023"), {}, pv);

// ---------- Recorregut guiat ----------
// La primera vegada: què és i com es juga, i un sol botó per començar. Després, pas a pas (WIZ), amb «Enrere» i «Següent»;
// al final es desa tot de cop i es proposa jugar-hi amb amics. Qui ja ha jugat veu el resum (i el pot editar) i el seu grup.
const WIZ = [
  { id: "cong", t: "Reparteix el teu Congrés", d: "Com quedaran els 350 escons? Reparteix-los entre els partits." },
  { id: "prov", t: "I per províncies?", d: "Opcional: reparteix els escons circumscripció per circumscripció en un mapa.", opt: true },
  { id: "cs", t: "Aposta-hi monedes", d: "Quantes monedes hi apostes? Com més escons encertis, més en cobraràs." },
  { id: "img", t: "Comparteix el teu Congrés", d: "Descarrega la imatge o comparteix-la a les xarxes. Ho pots fer ara o més tard." },
  { id: "preg", t: "Respon les preguntes", d: "Opcional: aposta monedes a les preguntes que vulguis.", opt: true },
  { id: "x", t: "Fes les teves apostes", d: "Opcional: «aquest partit traurà tants escons».", opt: true },
  { id: "fi", t: "Desa-ho i juga amb amics", d: "Revisa-ho, desa-ho i, si vols, crea un grup o entra al dels teus amics." },
];
const EP_DRAFT_KEY = "r29n-ep-esborrany";
const epSaveDraft = () => { if (PronState.draft && PronState.uid) store.set(EP_DRAFT_KEY, { uid: PronState.uid, d: PronState.draft, t: Date.now() }); };
const epHasSaved = () => !!PronState.mine && (pronStaked(PronState.mine) > 0 || !!PronState.mine.s);

async function renderPronostics(arg) {
  const root = $("#pron-page");
  if (!root) return;
  const join = arg && /^[A-Z2-9]{5}$/.test(arg) ? arg : null;
  if (/^#(pronostics|prediccio|escons)(\/|$)/.test(location.hash)) history.replaceState(null, "", "#electoporra");
  const O = window.Online;
  const st = pronState();
  const logged = !!O?.user;
  if (logged && PronState.uid !== O.user.uid) {
    PronState.uid = O.user.uid;
    root.innerHTML = `<div class="card ep-load"><p class="muted">Carregant l'Electoporra…</p></div>`;
    PronState.mine = await O.pronGet();
    const dr = store.get(EP_DRAFT_KEY, null);
    PronState.draft = dr && dr.uid === O.user.uid && st === "oberta" ? dr.d : null;
    PronState.leagues = await O.pronLeagues();
    const saved = store.get(EP_GROUP_KEY, null);
    PronState.league = PronState.leagues.some((l) => l.code === saved) ? saved : PronState.leagues[0]?.code || "sol";
    PronState.mode = null;
    if (!/^#(pronostics|electoporra|prediccio|escons)/.test(location.hash)) return;
  }
  if (logged && join) {
    if (!PronState.leagues.some((l) => l.code === join)) {
      const lg = await O.leagueJoin(join);
      if (lg) { PronState.leagues.push(lg); toast(`Ja ets al grup «${lg.name}»`); Sfx.play("unlock"); }
    }
    if (PronState.leagues.some((l) => l.code === join)) { PronState.league = join; store.set(EP_GROUP_KEY, join); }
    history.replaceState(null, "", "#electoporra");
  } else if (join) store.set("r29n-ep-unir", join);
  if (logged && !join) { const pend = store.get("r29n-ep-unir", null); if (pend) { store.set("r29n-ep-unir", null); return renderPronostics(pend); } }
  const night = ["nit", "despres"].includes(espFase());
  if (night && !Esp.data && espResultsMode() !== "off" && !PronState.fetching) {
    PronState.fetching = true;
    espFetchResults().then(() => { PronState.fetching = false; if (/^#(pronostics|electoporra)/.test(location.hash)) renderPronostics(); });
  }
  const r = pronResults(night || Esp.cfg.pronRes ? Esp.data : null);
  if (logged) epSyncCoins(r);
  const open = st === "oberta";
  if (!open) PronState.mode = "home";
  else if (!PronState.mode) PronState.mode = epHasSaved() ? "home" : "intro";
  if (arg === "congres" && open && logged) { PronState.mode = "wiz"; PronState.wi = 0; }
  if (["grup", "amics", "lligues"].includes(arg) && logged && epHasSaved()) { PronState.mode = "home"; setTimeout(() => document.getElementById("ep-grup")?.scrollIntoView({ behavior: "smooth", block: "start" }), 600); }
  const status = st === "aviat" ? "S'obre el 23 de novembre" : open ? `Es tanca d'aquí a <b>${pronCountdown()}</b> · 29N, 20:00` : st === "off" ? "No disponible" : r?.final ? "Resultat final" : r ? "Tancada · es resol en directe amb l'escrutini" : "Tancada · es resoldrà amb l'escrutini";
  const wiz = PronState.mode === "wiz";
  root.innerHTML = `${espPreviewBar()}
    <header class="ep-hero ${wiz ? "slim" : ""}">
      <div class="ep-hero-t"><p class="ep-k">29N · Eleccions generals</p><h1>Electoporra</h1>
        ${wiz ? "" : `<p>Endevina com quedarà el Congrés, aposta-hi monedes del joc i mira qui l'encerta més entre els teus amics.</p>`}
        <p class="ep-status">${status}</p></div>
      ${logged ? `<div class="ep-wallet" aria-live="polite"><small>${open ? "Et queden per apostar" : "Les teves monedes"}</small><b data-ep-wallet>0</b><span>🪙 monedes</span></div>` : ""}
    </header>
    <div data-pbody class="ep-body"></div>
    <p class="sim-fiction">Les monedes són una moneda inventada de Política en Joc: no es poden comprar, no tenen cap valor i no es poden bescanviar per res. Fins a les 20:00 del 29N ningú veu què han apostat els altres.</p>`;
  espBind(root);
  const body = $("[data-pbody]", root);
  if (!logged || PronState.mode === "intro") epIntro(body, logged, st);
  else if (wiz) epWiz(body, st, r);
  else epHome(body, st, r);
  epWalletSync();
}
function epWalletSync() {
  const w = $("[data-ep-wallet]");
  if (!w) return;
  const D = PronState.draft || PronState.mine;
  w.textContent = fmt(pronState() === "oberta" ? Math.max(0, epAvail() - pronStaked(D)) : typeof Coins !== "undefined" ? Coins.balance() : 0);
  w.classList.toggle("neg", pronState() === "oberta" && epAvail() - pronStaked(D) < 0);
}

// ---------- La primera vegada ----------
function epIntro(body, logged, st) {
  const steps = [["🏛️", "Reparteix el teu Congrés", "Com quedaran els 350 escons? Tu decideixes quants en treu cada partit i, si vols, província a província en un mapa."], ["🪙", "Aposta-hi monedes", `Tens ${EP_BONUS} monedes de regal. Com més escons encertis, més en guanyes.`], ["📸", "Comparteix-lo", "Descarrega la imatge del teu Congrés (o del teu mapa) per penjar-la a les xarxes."], ["👥", "Juga amb amics", "Crea un grup i, la nit electoral, mireu en directe qui s'hi acosta més."]];
  body.innerHTML = `<section class="card ep-intro">
      <h2>Com es juga?</h2>
      <ol class="ep-how">${steps.map(([e, t, d], i) => `<li style="--i:${i}"><span class="ep-how-n">${i + 1}</span><span class="ep-how-e" aria-hidden="true">${e}</span><div><b>${t}</b><p>${d}</p></div></li>`).join("")}</ol>
      <p class="ep-sub">També hi ha preguntes i apostes pròpies, si en vols més. Es tanca a les 20:00 del 29N.</p>
      ${st === "aviat" ? `<p class="ep-sub"><b>S'obre el 23 de novembre.</b></p>` : st !== "oberta" ? `<p class="ep-sub"><b>Ja està tancada.</b></p>` : logged ? `<button class="btn primary lg ep-go" type="button" data-start>Comença ›</button>${PronState.draft ? `<p class="ep-sub">Tens una Electoporra a mig fer: continuaràs per on la vas deixar.</p>` : ""}` : `<button class="btn primary lg ep-go" type="button" data-plogin>Entra per començar</button><p class="ep-sub">Cal un compte perquè es desi i la puguis comparar amb els teus amics.</p>`}
    </section>`;
  if (logged && PronState.leagues.length) {
    body.insertAdjacentHTML("beforeend", `<details class="card ep-mygroups"><summary>👥 Els teus grups <small>${PronState.leagues.length}</small></summary><ul>${PronState.leagues.map((l) => `<li><b>${esc(l.name)}</b><small>${l.members.length} ${l.members.length === 1 ? "membre" : "membres"} · codi ${esc(l.code)}</small>${l.owner === window.Online.user.uid ? `<button class="linkish" type="button" data-mgdel="${l.code}">🗑️ Esborra'l</button>` : `<button class="linkish" type="button" data-mgleave="${l.code}">Surt-ne</button>`}</li>`).join("")}</ul></details>`);
    const drop = (code) => { PronState.leagues = PronState.leagues.filter((l) => l.code !== code); if (PronState.league === code) { PronState.league = PronState.leagues[0]?.code || "sol"; store.set(EP_GROUP_KEY, PronState.league); } renderPronostics(); };
    $$("[data-mgdel]", body).forEach((b) => b.addEventListener("click", async () => { const l = PronState.leagues.find((x) => x.code === b.dataset.mgdel); if (confirm(`Vols esborrar el grup «${l.name}»? S'esborrarà per a tots els membres.`) && (await window.Online.leagueDelete(l.code))) { toast("Grup esborrat"); drop(l.code); } }));
    $$("[data-mgleave]", body).forEach((b) => b.addEventListener("click", async () => { const l = PronState.leagues.find((x) => x.code === b.dataset.mgleave); if (confirm(`Vols sortir del grup «${l.name}»?`) && (await window.Online.leagueLeave(l.code))) { toast("Has sortit del grup"); drop(l.code); } }));
  }
  $("[data-start]", body)?.addEventListener("click", () => { PronState.mode = "wiz"; PronState.wi = PronState.wi || 0; Sfx.play("pick"); renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("[data-plogin]", body)?.addEventListener("click", () => window.Online?.accountClick?.());
}

// ---------- Pas a pas ----------
function epWiz(body, st, r) {
  const D = epDraft();
  const i = Math.max(0, Math.min(WIZ.length - 1, PronState.wi || 0)), S = WIZ[i];
  body.innerHTML = `<section class="ep-wiz">
      <div class="ep-prog" aria-label="Pas ${i + 1} de ${WIZ.length}">${WIZ.map((w, j) => `<button type="button" class="${j < i ? "done" : j === i ? "on" : ""}" data-wgo="${j}" ${j > i && !epWizCan(j) ? "disabled" : ""} aria-label="${esc(w.t)}"><i></i></button>`).join("")}</div>
      <header class="ep-wiz-h"><p class="ep-wiz-n">Pas ${i + 1} de ${WIZ.length}${S.opt ? " · opcional" : ""}</p><h2>${esc(S.t)}</h2><p>${esc(S.d)}</p></header>
      <div class="ep-wiz-b" data-wstep></div>
    </section>
    <nav class="ep-wnav" data-wnav></nav>`;
  const box = $("[data-wstep]", body);
  const nav = () => {
    const ok = epWizOk(S.id), last = i === WIZ.length - 1;
    const n = $("[data-wnav]", body);
    const left = epAvail() - pronStaked(D);
    n.innerHTML = `<button class="btn ghost" type="button" data-wprev>${i ? "‹ Enrere" : "Surt"}</button>
      <div class="ep-wnav-m"><b>🪙 ${fmt(pronStaked(D))}</b> apostades · ${left >= 0 ? `et queden ${fmt(left)}` : `<span class="down">et passes de ${fmt(-left)}</span>`}</div>
      ${last ? "" : `<button class="btn primary" type="button" data-wnext ${ok ? "" : "disabled"}>${S.opt && !epWizHas(S.id) ? "Salta-ho ›" : "Següent ›"}</button>`}`;
    $("[data-wprev]", n).addEventListener("click", () => { if (i) epWizGo(i - 1); else { PronState.mode = epHasSaved() ? "home" : "intro"; renderPronostics(); } });
    $("[data-wnext]", n)?.addEventListener("click", () => epWizGo(i + 1));
    epWalletSync();
  };
  const changed = () => { epSaveDraft(); nav(); };
  $$("[data-wgo]", body).forEach((b) => b.addEventListener("click", () => epWizGo(Number(b.dataset.wgo))));
  ({ cong: epStepCong, prov: epStepProv, cs: epStepStake, img: epStepImg, preg: epStepPreg, x: epStepX, fi: epStepFi })[S.id](box, D, changed, st, r);
  nav();
}
function epWizGo(j) { PronState.wi = j; Sfx.play("pick"); renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); }
const epWizOk = (id) => { const D = epDraft(); return id === "cong" ? epSeatSum(D.s) === 350 : id === "prov" ? !D.pv || epProvMissing(D.pv).length === 0 : id === "cs" ? (D.cs || 0) >= EP_STEP : true; };
const epProvMissing = (pv) => SIM_PROVS.filter((p) => epSeatSum(pv?.[p.code]) !== p.seats);
const epWizCan = (j) => WIZ.slice(0, j).every((w) => epWizOk(w.id));
const epWizHas = (id) => { const D = epDraft(); return id === "preg" ? pronCount(D) > 0 : id === "x" ? (D.x || []).length > 0 : id === "prov" ? !!D.pv : true; };

// Pas 1: el Congrés
function epStepCong(box, D, changed) {
  if (!D.s) {
    const prev = typeof prdFinal === "function" ? prdFinal() : null;
    box.innerHTML = `<p class="ep-ask">Per on vols començar?</p>
      <div class="ep-starts">
        <button type="button" data-from="2023"><span>🏛️</span><b>El Congrés d'ara</b><small>Els escons del 2023 (el d'UPN, dins del PP), i el canvies</small></button>
        ${prev ? `<button type="button" data-from="prd"><span>🔮</span><b>La teva predicció</b><small>La que vas fer amb els vots</small></button>` : ""}
        <button type="button" data-from="zero"><span>✏️</span><b>De zero</b><small>Tots els partits a 0</small></button>
      </div>`;
    $$("[data-from]", box).forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.from;
      D.s = f === "2023" ? epCong2023() : f === "prd" ? (() => { const x = prdFinal(); return { ...prdCompute(x.t, x.o || {}, x.s || {}).seats }; })() : {};
      delete D.s.upn; delete D.s.altres;
      Sfx.play("pick"); epStepCong(box, D, changed); changed();
    }));
    return;
  }
  if (D.pv) {
    box.innerHTML = `<div class="ep-cong-g"><div class="ep-hemi">${nitHemi({ seats: { ...D.s }, totalSeats: epSeatSum(D.s) }, "")}</div>
      <div class="ep-cong-side"><p class="ep-left ok">🗺️ L'estàs repartint per províncies<small>El total és la suma de les circumscripcions.</small></p>
        <button class="btn" type="button" data-goprov>Edita'l al mapa</button></div></div>
      <ul class="ep-seat-l">${Object.keys(D.s).filter((k) => D.s[k]).sort((a, b) => D.s[b] - D.s[a]).map((k) => `<li style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))}<b>${D.s[k]}</b></li>`).join("")}</ul>`;
    $("[data-goprov]", box).addEventListener("click", () => epWizGo(1));
    return;
  }
  const s = D.s, sum = epSeatSum(s), left = 350 - sum;
  const sums = [["PP + Vox", ["pp", "vox"]], ["Els de la investidura del 2023", PRON_INV23]].map(([t, ids]) => [t, ids.reduce((a, k) => a + (s[k] || 0), 0)]);
  const row = (k) => { const p = nitParty(k), n = s[k] || 0; return `<div class="ep-prow" style="--c:${p.color}" data-k="${k}"><span class="ep-pn"><b>${esc(p.sig)}</b>${EP_NOTE[k] ? `<small>${esc(EP_NOTE[k])}</small>` : ""}</span>
    <div class="ep-seatbox"><button type="button" data-ss="-1" aria-label="Un escó menys a ${esc(p.sig)}" ${n ? "" : "disabled"}>−</button><input type="text" inputmode="numeric" value="${n}" data-sn aria-label="Escons de ${esc(p.sig)}"><button type="button" data-ss="1" aria-label="Un escó més a ${esc(p.sig)}" ${left > 0 && n < epMax(k) ? "" : "disabled"}>+</button></div><span class="ep-seatu">escons</span></div>`; };
  box.innerHTML = `<div class="ep-cong-g">
      <div class="ep-hemi">${nitHemi({ seats: { ...s }, totalSeats: sum }, "").replace(/<div class="nt-hemi-c">[\s\S]*?<\/div>/, `<div class="nt-hemi-c"><b>${sum}</b><small>de 350 escons</small></div>`)}</div>
      <div class="ep-cong-side">
        <p class="ep-left ${left === 0 ? "ok" : left < 0 ? "ko" : ""}" aria-live="polite" data-left>${epLeftHtml(left)}</p>
        <ul class="ep-sums">${sums.map(([t, n]) => `<li class="${n >= 176 ? "maj" : ""}"><span>${esc(t)}</span><b>${n}</b>${n >= 176 ? "<em>majoria</em>" : ""}</li>`).join("")}</ul>
        <button class="linkish ep-reset" type="button" data-creset>Torna a començar</button>
      </div>
    </div>
    <p class="ep-tip">Toca <b>+</b> i <b>−</b>, mantén-los premuts per anar més de pressa, o escriu el número.</p>
    <div class="ep-prows">${EP_PARTIES.map(row).join("")}</div>
    <details class="ep-more" ${EP_MORE.some((k) => s[k]) ? "open" : ""}><summary>Més partits <small>${EP_MORE.map((k) => esc(nitSig(k))).join(", ")}</small></summary><div class="ep-prows">${EP_MORE.map(row).join("")}</div></details>`;
  const redraw = () => { const y = scrollY; epStepCong(box, D, changed); changed(); scrollTo(0, y); };
  const clamp = (k, v) => Math.max(0, Math.min(epMax(k), 350 - (epSeatSum(D.s) - (D.s[k] || 0)), Math.round(v) || 0));
  $$(".ep-prow", box).forEach((rw) => {
    const k = rw.dataset.k;
    $$("[data-ss]", rw).forEach((b) => {
      let tm = null, iv = null, held = false;
      b.addEventListener("click", () => { if (held) { held = false; return; } D.s[k] = clamp(k, (D.s[k] || 0) + Number(b.dataset.ss)); redraw(); });
      b.addEventListener("pointerdown", () => { tm = setTimeout(() => { held = true; iv = setInterval(() => { D.s[k] = clamp(k, (D.s[k] || 0) + Number(b.dataset.ss)); $("[data-sn]", rw).value = D.s[k]; const l = $("[data-left]", box); if (l) l.innerHTML = epLeftHtml(350 - epSeatSum(D.s)); }, 90); }, 400); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => { clearTimeout(tm); if (iv) { clearInterval(iv); iv = null; setTimeout(redraw, 0); } }));
    });
    $("[data-sn]", rw).addEventListener("change", (e) => { D.s[k] = clamp(k, Number(e.target.value.replace(/\D/g, ""))); redraw(); });
  });
  $("[data-creset]", box).addEventListener("click", () => { D.s = null; redraw(); });
}
const epLeftHtml = (left) => (left === 0 ? "✓ Tots els escons repartits<small>Per donar-ne més a un partit, primer treu-ne a un altre.</small>" : left > 0 ? `Queden <b>${left}</b> ${left === 1 ? "escó" : "escons"} per repartir` : `Te'n sobren <b>${-left}</b>`);

// Pas opcional: per províncies, en un mapa
function epStepProv(box, D, changed) {
  if (!D.pv) {
    box.innerHTML = `<div class="ep-provask">
        <div class="ep-provask-map" aria-hidden="true">${simSpainMap("prd-map ep-minimap")}</div>
        <p>Si vols, pots dir també <b>quants escons treu cada partit a cada circumscripció</b>. Començaràs amb un repartiment que ja suma el teu Congrés, i el retoques on vulguis.</p>
        <p class="ep-sub">No compta per a l'aposta (que és pel total del Congrés), però tindràs el mapa per compartir-lo.</p>
        <div class="ep-starts two"><button type="button" data-pvyes><span>🗺️</span><b>Sí, al mapa</b><small>Circumscripció per circumscripció</small></button>
        <button type="button" data-pvno><span>⏭️</span><b>No cal</b><small>Em quedo amb el total</small></button></div>
      </div>`;
    $("[data-pvyes]", box).addEventListener("click", () => {
      box.innerHTML = `<p class="ep-sub" style="text-align:center">Repartint els escons per províncies…</p>`;
      setTimeout(() => { D.pv = epAutoProv(D.s); D.s = epProvSum(D.pv); PronState.psel = null; Sfx.play("pick"); epStepProv(box, D, changed); changed(); }, 30);
    });
    $("[data-pvno]", box).addEventListener("click", () => epWizGo(PronState.wi + 1));
    return;
  }
  const d = epProvD(D.pv), miss = epProvMissing(D.pv);
  const p = PronState.psel != null ? d.provs.find((x) => x.i === PronState.psel) : null;
  PRD.sel = PronState.psel;
  const provs = [...SIM_PROVS].sort((a, b) => a.name.localeCompare(b.name));
  let edit = "";
  if (p) {
    const x = D.pv[p.code] || {}, tot = epSeatSum(x), left = p.seats - tot;
    const ks = [...EP_PARTIES, ...EP_MORE].filter((k) => prdRuns(k, p.code) || x[k]);
    edit = `<div class="ep-pedit" style="--c:${nitParty(p.winner || "pp").color}">
      <header><h3>${esc(p.name)}</h3><span>${p.seats} ${p.seats === 1 ? "escó" : "escons"}</span><button class="ep-x" type="button" data-pclose aria-label="Tanca">✕</button></header>
      <p class="ep-left ${left ? "ko" : "ok"}">${left > 0 ? `Hi queden <b>${left}</b> per repartir` : left < 0 ? `N'hi sobren <b>${-left}</b>` : "✓ Tots repartits"}</p>
      <div class="ep-prows">${ks.map((k) => { const pp = nitParty(k), n = x[k] || 0; return `<div class="ep-prow" style="--c:${pp.color}" data-pk="${k}"><span class="ep-pn"><b>${esc(pp.sig)}</b></span><div class="ep-seatbox"><button type="button" data-ps="-1" aria-label="Un escó menys a ${esc(pp.sig)}" ${n ? "" : "disabled"}>−</button><input type="text" inputmode="numeric" value="${n}" data-pn aria-label="Escons de ${esc(pp.sig)} a ${esc(p.name)}"><button type="button" data-ps="1" aria-label="Un escó més a ${esc(pp.sig)}" ${left > 0 ? "" : "disabled"}>+</button></div></div>`; }).join("")}</div>
    </div>`;
  }
  box.innerHTML = `<p class="ep-tip">Toca una circumscripció del mapa (o tria-la a la llista) per canviar-ne els escons.</p>
    <label class="ep-psel">Circumscripció <select data-psel><option value="">Tria-la…</option>${provs.map((q) => `<option value="${q.i}" ${q.i === PronState.psel ? "selected" : ""}>${esc(q.name)} (${q.seats})${epSeatSum(D.pv[q.code]) !== q.seats ? " ⚠️" : ""}</option>`).join("")}</select></label>
    <div class="ep-provmap">${prdMapSvg(d)}</div>
    ${edit}
    ${miss.length ? `<p class="ep-warn">⚠️ Falta acabar de repartir: ${miss.map((q) => esc(q.name)).join(", ")}.</p>` : ""}
    <div class="ep-ptot"><b>El teu Congrés</b>${Object.keys(D.s).filter((k) => D.s[k]).sort((a, b) => D.s[b] - D.s[a]).map((k) => `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} <b>${D.s[k]}</b></span>`).join("")}</div>
    <button class="linkish ep-reset" type="button" data-pvoff>Deixa-ho estar: em quedo amb el total, sense províncies</button>`;
  const redraw = () => { const y = scrollY; epStepProv(box, D, changed); changed(); scrollTo(0, y); };
  prdPaintMap(box, d, (i) => { PronState.psel = PronState.psel === i ? null : i; Sfx.play("pick"); redraw(); setTimeout(() => $(".ep-pedit", box)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60); });
  $("[data-psel]", box).addEventListener("change", (e) => { PronState.psel = e.target.value === "" ? null : Number(e.target.value); redraw(); });
  $("[data-pclose]", box)?.addEventListener("click", () => { PronState.psel = null; redraw(); });
  $("[data-pvoff]", box).addEventListener("click", () => { if (!confirm("Vols deixar el repartiment per províncies? El teu Congrés es manté com ara.")) return; D.pv = null; PronState.psel = null; redraw(); });
  if (p) {
    const x = (D.pv[p.code] ||= {});
    const set = (k, v) => { const others = epSeatSum(x) - (x[k] || 0); x[k] = Math.max(0, Math.min(p.seats - others, Math.round(v) || 0)); if (!x[k]) delete x[k]; D.s = epProvSum(D.pv); redraw(); };
    $$("[data-pk]", box).forEach((rw) => {
      const k = rw.dataset.pk;
      $$("[data-ps]", rw).forEach((b) => b.addEventListener("click", () => set(k, (x[k] || 0) + Number(b.dataset.ps))));
      $("[data-pn]", rw).addEventListener("change", (e) => set(k, Number(e.target.value.replace(/\D/g, ""))));
    });
  }
}

// Pas 2: l'aposta al Congrés
function epStepStake(box, D, changed) {
  if (!D.cs) D.cs = 100;
  const cs = D.cs;
  box.innerHTML = `<div class="ep-betcard">
      <p class="ep-sub">Això són <b>monedes</b>, no escons. Les recuperes multiplicades segons quants escons del teu Congrés coincideixin amb el resultat.</p>
      ${epStakeHtml("cs", cs, "Hi aposto")}
      <ul class="ep-pay">
        <li><span>Si n'encertes el 97 % o més</span><b>cobres ×4</b><em>${epCoin(cs * 4)}</em></li>
        <li><span>Del 94 al 97 %</span><b>cobres ×2</b><em>${epCoin(cs * 2)}</em></li>
        <li><span>Del 90 al 94 %</span><b>les recuperes</b><em>${epCoin(cs)}</em></li>
        <li><span>Menys del 90 %</span><b>les perds</b><em>${epCoin(0)}</em></li>
      </ul>
      <p class="ep-note">L'encert és la part dels 350 escons que coincideix amb el resultat, partit per partit. Per fer-te'n una idea: qui repetís el Congrés del 2023 a les eleccions del 2023 l'hauria encertat al 100 %.</p>
    </div>`;
  epStakeBind(box, () => D.cs, (k, v) => { D.cs = v; const y = scrollY; epStepStake(box, D, changed); changed(); scrollTo(0, y); });
}

// Pas 3: la imatge per compartir (amb el nom que vulguis, o cap)
const EP_IMGS = [["congres", "🏛️ El Congrés"], ["partits", "📊 Partit per partit"], ["mapa", "🗺️ El mapa"]];
function epStepImg(box, D) {
  const kinds = EP_IMGS.filter(([k]) => k !== "mapa" || D.pv);
  if (!kinds.some(([k]) => k === PronState.img)) PronState.img = "congres";
  if (PronState.imgName === undefined) PronState.imgName = window.Online?.profile?.handle || "";
  box.innerHTML = `<div class="ep-imgs">
      <div class="ep-imgk" role="radiogroup" aria-label="Imatge">${kinds.map(([k, t]) => `<button type="button" role="radio" aria-checked="${PronState.img === k}" data-ik="${k}">${t}</button>`).join("")}</div>
      ${D.pv ? "" : `<p class="ep-sub">Per tenir també el mapa, reparteix el Congrés per províncies (pas 2).</p>`}
      <label class="ep-iname">Títol de la imatge
        <span><em>El Congrés de</em><input type="text" maxlength="30" value="${esc(PronState.imgName)}" placeholder="el teu nom (o deixa-ho buit)" data-iname></span>
        <small>Si ho deixes buit, posarà «El meu Congrés».</small></label>
      <figure class="ep-prev" data-iprev></figure>
      <div class="ep-imgact">
        ${navigator.share ? `<button class="btn primary" type="button" data-ishare>📤 Comparteix-la</button>` : ""}
        <button class="btn ${navigator.share ? "" : "primary"}" type="button" data-idown>⬇️ Descarrega la imatge</button>
      </div>
    </div>`;
  let tm = 0;
  const draw = async () => {
    try { await document.fonts?.ready; } catch { /* sense fonts */ }
    const cv = epCanvas(PronState.img, D.s, PronState.imgName.trim(), D.pv);
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "El teu Congrés");
    $("[data-iprev]", box).replaceChildren(cv);
    return cv;
  };
  draw();
  $$("[data-ik]", box).forEach((b) => b.addEventListener("click", () => { PronState.img = b.dataset.ik; $$("[data-ik]", box).forEach((x) => x.setAttribute("aria-checked", String(x === b))); draw(); }));
  $("[data-iname]", box).addEventListener("input", (e) => { PronState.imgName = e.target.value; clearTimeout(tm); tm = setTimeout(draw, 250); });
  const text = () => { const ids = Object.keys(D.s).filter((k) => D.s[k]).sort((a, b) => D.s[b] - D.s[a]), [a, b] = ids; return `El meu Congrés per al 29N: ${nitSig(a)} ${D.s[a]}, ${nitSig(b)} ${D.s[b]}. I el teu? Fes-lo a l'Electoporra de Política en Joc:\n${location.origin}${location.pathname}#electoporra`; };
  $("[data-ishare]", box)?.addEventListener("click", async () => { const cv = await draw(); shareCanvas(cv, `electoporra-${PronState.img}.png`, text(), "electoporra"); });
  $("[data-idown]", box).addEventListener("click", async () => {
    const cv = await draw();
    const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
    if (!blob) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `electoporra-${PronState.img}.png`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Imatge descarregada"); window.Stats?.add("sh", 1, "electoporra_img");
  });
}
// Les imatges (1080 × 1350): el Congrés amb les majories, partit per partit, o el mapa per províncies
function epCanvas(kind, s0, name, pv) {
  const s = Object.fromEntries(Object.entries(s0 || {}).filter(([, n]) => n > 0));
  const ids = Object.keys(s).sort((a, b) => s[b] - s[a] || (ESP_ORDER.indexOf(a) - ESP_ORDER.indexOf(b)));
  const sub = { congres: "Eleccions generals · 29N · Així quedaria el Congrés", partits: "Eleccions generals · 29N · Partit per partit", mapa: "Eleccions generals · 29N · Província a província" }[kind];
  const { cv, c, W, H } = prdCvBase(name, sub);
  const L = 56, R = W - 56;
  // Llegenda en una graella de columnes iguals: ● PP 140
  const legend = (y, cols, size) => {
    const cw = (R - L) / cols, lh = size + 20;
    ids.forEach((k, j) => {
      const x = L + (j % cols) * cw, yy = y + Math.floor(j / cols) * lh;
      c.fillStyle = nitParty(k).color; c.beginPath(); c.arc(x + 11, yy - size * 0.35, 11, 0, Math.PI * 2); c.fill();
      c.textAlign = "left"; c.fillStyle = PRD_C.ink; c.font = prdFSans(size, 800); c.fillText(nitSig(k), x + 30, yy, cw - 100);
      c.textAlign = "right"; c.font = prdFDisp(size); c.fillText(String(s[k]), x + cw - 24, yy);
    });
    return y + Math.ceil(ids.length / cols) * lh;
  };
  const bars = (y, w) => {
    const sc = w / 350;
    [["PP + Vox", ["pp", "vox"]], ["PSOE i els partits de la investidura del 2023", PRON_INV23], ["PP + PSOE", ["pp", "psoe"]]].forEach(([t, ks]) => {
      const n = ks.reduce((a, k) => a + (s[k] || 0), 0), ok = n >= NIT_MAJ;
      c.textAlign = "left"; c.fillStyle = PRD_C.ink; c.font = prdFSans(26, 800); c.fillText(t, L, y, w - 230);
      c.textAlign = "right"; c.font = prdFDisp(30); c.fillText(String(n), R - 140, y + 2);
      c.font = prdFSans(22, 800); c.fillStyle = ok ? PRD_C.up : PRD_C.down; c.fillText(ok ? "✔ majoria" : "✘ no arriba", R, y);
      const by = y + 16;
      c.fillStyle = "rgba(23,23,61,.08)"; c.fillRect(L, by, w, 18);
      let bx = L;
      ks.filter((k) => s[k]).sort((a, b) => s[b] - s[a]).forEach((k) => { c.fillStyle = nitParty(k).color; c.fillRect(bx, by, s[k] * sc, 18); bx += s[k] * sc; });
      c.fillStyle = PRD_C.ink; c.fillRect(L + NIT_MAJ * sc - 1.5, by - 6, 3, 30);
      y += 92;
    });
    return y;
  };
  // Hemicicle amb el total al buit del mig (sense trepitjar els seients)
  const hemi = (cx, cy, Rr, r) => {
    const seats = hemicycleSeats(350);
    let n = 0;
    ids.slice().sort((a, b) => (ESP_ORDER.indexOf(a) + 1 || 50) - (ESP_ORDER.indexOf(b) + 1 || 50)).forEach((k) => { c.fillStyle = nitParty(k).color; for (let j = 0; j < s[k]; j++) { const q = seats[n++]; if (!q) return; c.beginPath(); c.arc(cx + q.x * Rr, cy + q.y * Rr, r, 0, Math.PI * 2); c.fill(); } });
    c.textAlign = "center"; c.fillStyle = PRD_C.ink; c.font = prdFSans(22, 700); c.fillStyle = PRD_C.muted; c.fillText("350 diputats · majoria absoluta: 176", cx, cy + 44);
  };
  if (kind === "congres") {
    hemi(W / 2, 510, 330, 7.8);
    const cols = ids.length > 12 ? 3 : 2;
    let y = legend(620, cols, ids.length > 12 ? 26 : 28);
    y = Math.max(y + 30, 860);
    c.textAlign = "left"; c.fillStyle = PRD_C.muted; c.font = prdFSans(22, 800); c.fillText("MAJORIES (176 ESCONS)", L, y);
    bars(y + 56, R - L);
    return cv;
  }
  if (kind === "partits") {
    const n = ids.length, top = 200, lh = Math.min(60, 620 / Math.max(1, n));
    const maxS = Math.max(...ids.map((k) => s[k]), 1), bx = 250, bw = R - 230 - bx;
    c.textAlign = "right"; c.font = prdFSans(18, 800); c.fillStyle = PRD_C.muted;
    c.fillText("ESCONS", R - 120, top + 10); c.fillText("VS 2023", R, top + 10);
    const ref = epCong2023();
    ids.forEach((k, j) => {
      const y = top + 50 + j * lh, col = nitParty(k).color, sz = Math.min(28, lh * 0.5);
      c.fillStyle = col; c.beginPath(); c.arc(L + 10, y - sz * 0.35, 10, 0, Math.PI * 2); c.fill();
      c.textAlign = "left"; c.fillStyle = PRD_C.ink; c.font = prdFSans(sz, 800); c.fillText(nitSig(k), L + 30, y, bx - L - 40);
      c.fillStyle = "rgba(23,23,61,.07)"; c.fillRect(bx, y - sz * 0.8, bw, sz);
      c.fillStyle = col; c.fillRect(bx, y - sz * 0.8, Math.max(4, (s[k] / maxS) * bw), sz);
      c.textAlign = "right"; c.fillStyle = PRD_C.ink; c.font = prdFDisp(sz); c.fillText(String(s[k]), R - 120, y);
      const df = ref[k] === undefined ? null : s[k] - ref[k];
      c.font = prdFSans(Math.min(22, sz * 0.8), 800); c.fillStyle = df > 0 ? PRD_C.up : df < 0 ? PRD_C.down : PRD_C.muted;
      c.fillText(df == null ? (["salf", "alhora", "d21"].includes(k) ? "nou" : "—") : df === 0 ? "=" : `${df > 0 ? "+" : "−"}${Math.abs(df)}`, R, y);
    });
    // A sota, les majories
    const y0 = top + 50 + n * lh + 20;
    c.fillStyle = "rgba(23,23,61,.12)"; c.fillRect(L, y0, R - L, 2);
    c.textAlign = "left"; c.fillStyle = PRD_C.muted; c.font = prdFSans(20, 800); c.fillText("MAJORIES (176 ESCONS)", L, y0 + 44);
    bars(y0 + 92, R - L);
    return cv;
  }
  // mapa
  const d = epProvD(pv);
  const y = prdCvMap(c, d, 40, 170, W - 80, 860);
  c.textAlign = "center"; c.fillStyle = PRD_C.muted; c.font = prdFSans(20, 600);
  c.fillText("Cada punt és un diputat.", W / 2, y + 30);
  legend(y + 76, 4, 22);
  return cv;
}

// Pas 4: preguntes
function epStepPreg(box, D, changed) {
  const B = D.b;
  box.innerHTML = `<div class="ep-howto"><b>Com funciona</b><p>Tria una resposta i decideix quantes monedes hi apostes. Si l'encertes, recuperes les teves monedes i et quedes part de les dels qui l'han fallada (com més hi apostis, més part).</p></div>
    <div class="ep-list">${PRON_M.map((m) => { const b = B[m.id]; return `<section class="card ep-m ${b ? "has" : ""}">
      <header><span class="ep-e" aria-hidden="true">${m.e}</span><h3>${esc(m.q)}</h3>${b?.a ? epCoin(b.a) : ""}</header>
      ${m.hint ? `<p class="ep-hint">${esc(m.hint)}</p>` : ""}
      <div class="ep-opts">${m.opts.map(([o, t]) => `<button type="button" data-mo="${m.id}" data-o="${o}" aria-pressed="${b?.o === o}">${esc(t)}</button>`).join("")}</div>
      ${b ? epStakeHtml(m.id, b.a) + `<button type="button" class="ep-del" data-del="${m.id}">Treu aquesta aposta</button>` : ""}
    </section>`; }).join("")}</div>`;
  const redraw = () => { const y = scrollY; epStepPreg(box, D, changed); changed(); scrollTo(0, y); };
  $$("[data-mo]", box).forEach((btn) => btn.addEventListener("click", () => { const m = btn.dataset.mo, o = btn.dataset.o; if (B[m]?.o === o) delete B[m]; else B[m] = { o, a: B[m]?.a || 50 }; Sfx.play("pick"); redraw(); }));
  epStakeBind(box, (k) => B[k]?.a, (k, v) => { if (B[k]) B[k].a = v; redraw(); });
  $$("[data-del]", box).forEach((b) => b.addEventListener("click", () => { delete B[b.dataset.del]; redraw(); }));
}

// Pas 5: apostes pròpies
const epXLine = (x) => `<b>${esc(nitSig(x.p))}</b> traurà ${x.t ? `entre <b>${Math.max(0, x.n - x.t)} i ${x.n + x.t}</b>` : `exactament <b>${x.n}</b>`} escons`;
function epStepX(box, D, changed) {
  const xs = D.x;
  const f = (PronState.xf ||= { p: "vox", n: 40, t: 1, a: 50 });
  box.innerHTML = `<div class="ep-howto"><b>Com funciona</b><p>Tria un partit i quants escons creus que traurà. Les monedes dels qui fallen amb aquell partit es reparteixen entre els qui l'encerten, i com més precís siguis, més part t'emportes. Si l'encerta tothom, ningú no guanya res: només recuperes les teves monedes.</p></div>
    <div class="ep-xmake">
      <div class="ep-sentence">
        <select data-xp aria-label="Partit">${[...EP_PARTIES, ...EP_MORE].map((k) => `<option value="${k}" ${f.p === k ? "selected" : ""}>${esc(nitSig(k))}</option>`).join("")}</select>
        <span>traurà</span>
        <span class="ep-seatbox sm"><button type="button" data-xn="-1" aria-label="Un escó menys">−</button><input type="text" inputmode="numeric" value="${f.n}" data-xnv aria-label="Escons"><button type="button" data-xn="1" aria-label="Un escó més">+</button></span>
        <span>escons</span>
      </div>
      <div class="ep-xt" role="radiogroup" aria-label="Precisió">${EP_XT.map(([t, l]) => `<button type="button" role="radio" aria-checked="${f.t === t}" data-xt="${t}">${l}${t === 0 ? " <small>més part</small>" : t === 3 ? " <small>menys part</small>" : ""}</button>`).join("")}</div>
      ${epStakeHtml("x", f.a, "Hi aposto")}
      <p class="ep-xwin" data-xwin>${epXLine(f)}</p>
      <button class="btn primary" type="button" data-xadd ${xs.length >= EP_XN ? "disabled" : ""}>＋ Afegeix l'aposta</button>
    </div>
    ${xs.length ? `<ul class="ep-xul">${xs.map((x, j) => `<li style="--c:${nitParty(x.p).color}"><span class="ep-xs">${epXLine(x)}</span><span class="ep-xa">${epCoin(x.a)}</span><button type="button" class="ep-del" data-xdel="${j}" aria-label="Treu-la">✕</button></li>`).join("")}</ul>` : ""}`;
  const redraw = () => { const y = scrollY; epStepX(box, D, changed); changed(); scrollTo(0, y); };
  const line = () => { const el = $("[data-xwin]", box); if (el) el.innerHTML = epXLine(f); };
  $("[data-xp]", box).addEventListener("change", (e) => { f.p = e.target.value; f.n = Math.min(f.n, epMax(f.p)); $("[data-xnv]", box).value = f.n; line(); });
  const setN = (v) => { f.n = Math.max(0, Math.min(epMax(f.p), Math.round(v) || 0)); $("[data-xnv]", box).value = f.n; line(); };
  $$("[data-xn]", box).forEach((b) => b.addEventListener("click", () => setN(f.n + Number(b.dataset.xn))));
  $("[data-xnv]", box).addEventListener("change", (e) => setN(Number(e.target.value.replace(/\D/g, ""))));
  $$("[data-xt]", box).forEach((b) => b.addEventListener("click", () => { f.t = Number(b.dataset.xt); $$("[data-xt]", box).forEach((x) => x.setAttribute("aria-checked", String(x === b))); line(); }));
  epStakeBind(box, () => f.a, (k, v) => { f.a = v; $("[data-stake] [data-sv]", box).value = v; });
  $("[data-xadd]", box).addEventListener("click", () => {
    if (D.x.length >= EP_XN) return;
    if (D.x.some((x) => x.p === f.p)) return toast(`Ja tens una aposta sobre ${nitSig(f.p)}: treu-la si la vols canviar`);
    D.x.push({ p: f.p, n: f.n, t: f.t, a: f.a }); Sfx.play("pick"); toast("Aposta afegida"); redraw();
  });
  $$("[data-xdel]", box).forEach((b) => b.addEventListener("click", () => { D.x.splice(Number(b.dataset.xdel), 1); redraw(); }));
}

// Pas 6: resum, desar i grup
// Què impedeix desar (es diu clarament, amb la manera d'arreglar-ho)
function epProblems(D) {
  const out = [], left = epAvail() - pronStaked(D);
  if (left < 0) out.push(`Et passes de ${epFmt(-left)}. Baixa l'aposta al Congrés o treu-ne d'alguna pregunta o aposta pròpia.`);
  if (D.s && epSeatSum(D.s) !== 350) out.push(`El teu Congrés té ${epSeatSum(D.s)} escons: n'hi ha d'haver 350 (pas 1).`);
  if (D.s && (D.cs || 0) < EP_STEP) out.push(`Aposta almenys ${EP_STEP} monedes al teu Congrés (pas 3).`);
  if (D.pv && epProvMissing(D.pv).length) out.push(`Falta acabar de repartir ${epProvMissing(D.pv).map((q) => q.name).join(", ")} (pas 2).`);
  if (!D.s && !pronCount(D) && !(D.x || []).length) out.push("Encara no has apostat res.");
  return out;
}
function epStepFi(box, D, changed) {
  const left = epAvail() - pronStaked(D), dirty = epDirty() || !epHasSaved(), done = PronState.justSaved;
  const mk = PRON_M.filter((m) => D.b[m.id]?.a > 0);
  box.innerHTML = `<div class="ep-ticket">
      <h3>🎟️ La teva Electoporra</h3>
      <ul>
        <li><span>🏛️ El teu Congrés</span><em>${epCoin(D.cs || 0)}</em><button class="linkish" type="button" data-wgo2="0">Edita</button></li>
        <li><span>🎯 ${mk.length} ${mk.length === 1 ? "pregunta" : "preguntes"}</span><em>${epCoin(epMk(D))}</em><button class="linkish" type="button" data-wgo2="4">Edita</button></li>
        <li><span>✍️ ${(D.x || []).length} ${(D.x || []).length === 1 ? "aposta pròpia" : "apostes pròpies"}</span><em>${epCoin((D.x || []).reduce((a, x) => a + x.a, 0))}</em><button class="linkish" type="button" data-wgo2="5">Edita</button></li>
        <li class="tot"><span>Total apostat</span><em>${epCoin(pronStaked(D))}</em><span></span></li>
      </ul>
      <p class="ep-sub">Pots apostar fins a ${epCoin(epAvail())} (les teves monedes i les ${EP_BONUS} de regal).</p>
      ${epProblems(D).map((t) => `<p class="ep-warn">⚠️ ${t}</p>`).join("")}
      ${done && !dirty ? `<p class="ep-saved">✓ Desada! Pots canviar-la fins a les 20:00 del 29N.</p>` : `<button class="btn primary lg ep-go" type="button" data-fsave ${epProblems(D).length || PronState.saving ? "disabled" : ""}>${PronState.saving ? "Desant…" : epHasSaved() ? "💾 Desa els canvis" : "💾 Desa la meva Electoporra"}</button>`}
    </div>
    ${done && !dirty ? `<div class="ep-friends">
      <h3>👥 I ara, juga amb amics</h3>
      <p class="ep-sub">Crea un grup i passa'ls el codi, o entra al d'algú. La nit electoral veureu en directe qui s'acosta més al resultat.</p>
      ${epGroupFormsHtml()}
      <button class="btn ghost" type="button" data-fhome>${PronState.leagues.length ? "Fet ›" : "Ara no, jugo sol ›"}</button>
    </div>` : ""}`;
  $$("[data-wgo2]", box).forEach((b) => b.addEventListener("click", () => epWizGo(Number(b.dataset.wgo2))));
  $("[data-fsave]", box)?.addEventListener("click", async () => { if (await epSave()) { PronState.justSaved = true; epStepFi(box, D, changed); changed(); if (typeof confetti === "function") confetti(80); } });
  $("[data-fhome]", box)?.addEventListener("click", () => { PronState.mode = "home"; PronState.justSaved = false; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  epGroupFormsBind(box, () => { PronState.mode = "home"; PronState.justSaved = false; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
}
async function epSave() {
  if (espPreview()) { toast("Vista prèvia: no es desa"); return false; }
  const D = epDraft();
  const b = {};
  PRON_M.forEach((m) => { if (D.b[m.id] && D.b[m.id].a > 0) b[m.id] = { o: D.b[m.id].o, a: D.b[m.id].a }; });
  const full = D.s && epSeatSum(D.s) === 350;
  const pvOk = full && D.pv && epProvMissing(D.pv).length === 0;
  const doc = { b, ...(full ? { s: Object.fromEntries(Object.entries(D.s).filter(([, n]) => n > 0)), cs: D.cs || 0 } : {}), ...(pvOk ? { pv: D.pv } : {}), x: (D.x || []).filter(epXValid).slice(0, EP_XN) };
  PronState.saving = true;
  const prev = pronStaked(PronState.mine);
  const ok = await window.Online.pronSave(doc);
  PronState.saving = false;
  if (!ok) return false;
  PronState.mine = { ...(PronState.mine || {}), ...doc }; if (!full) { delete PronState.mine.s; delete PronState.mine.cs; } if (!pvOk) delete PronState.mine.pv;
  PronState.draft = null; store.set(EP_DRAFT_KEY, null);
  epSyncCoins(null);
  if (pronStaked(PronState.mine) > prev) window.Stats?.add("aposta", pronStaked(PronState.mine) - prev);
  Sfx.play("unlock"); toast("Electoporra desada"); Progress.unlock("pron-fet");
  return true;
}

// Control de monedes: clarament una aposta, no un nombre d'escons
const epStakeHtml = (key, a, label = "Hi aposto") => `<div class="ep-stake" data-stake="${key}">
  <span class="ep-stake-l">${label}</span>
  <div class="ep-coinbox"><button type="button" data-sd="-10" aria-label="10 monedes menys">−</button><span class="ep-coinv"><i aria-hidden="true">🪙</i><input type="text" inputmode="numeric" value="${a}" data-sv aria-label="Monedes que hi aposto"></span><button type="button" data-sd="10" aria-label="10 monedes més">+</button></div>
  <span class="ep-stake-u">monedes</span>
  <div class="ep-quick">${[50, 100].map((n) => `<button type="button" data-sq="${n}">+${n}</button>`).join("")}</div>
</div>`;
function epStakeBind(box, get, set) {
  $$("[data-stake]", box).forEach((el) => {
    const k = el.dataset.stake, inp = $("[data-sv]", el);
    const put = (v) => { set(k, Math.max(EP_STEP, Math.min(EP_MAX, Math.round(v / EP_STEP) * EP_STEP))); };
    $$("[data-sd]", el).forEach((b) => b.addEventListener("click", () => put((get(k) || 0) + Number(b.dataset.sd))));
    $$("[data-sq]", el).forEach((b) => b.addEventListener("click", () => put((get(k) || 0) + Number(b.dataset.sq))));
    inp.addEventListener("change", () => put(Number(inp.value.replace(/\D/g, "")) || 0));
  });
}

// ---------- Grups ----------
const epGroupFormsHtml = () => `<div class="ep-gforms">
    <form class="ep-gform" data-gnew><label>Crea un grup<input type="text" maxlength="30" required placeholder="Nom del grup: p. ex. Els de la feina" data-gname></label><button class="btn primary" type="submit">Crea'l</button></form>
    <form class="ep-gform" data-gjoin><label>O entra-hi amb un codi<input type="text" maxlength="5" required placeholder="ABCDE" autocapitalize="characters" data-gcode></label><button class="btn" type="submit">Entra-hi</button></form>
  </div>`;
function epGroupFormsBind(box, after) {
  const O = window.Online;
  $("[data-gnew]", box)?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("[data-gname]", box).value.trim();
    if (!name) return;
    const lg = await O.leagueCreate(name);
    if (!lg) return;
    PronState.leagues.push(lg); PronState.league = lg.code; store.set(EP_GROUP_KEY, lg.code);
    toast("Grup creat! Ara convida-hi els teus amics"); Sfx.play("unlock"); after();
  });
  $("[data-gjoin]", box)?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = $("[data-gcode]", box).value.trim().toUpperCase();
    if (!/^[A-Z2-9]{5}$/.test(code)) return toast("El codi té 5 lletres o xifres");
    const lg = await O.leagueJoin(code);
    if (!lg) return;
    if (!PronState.leagues.some((l) => l.code === lg.code)) PronState.leagues.push(lg);
    PronState.league = lg.code; store.set(EP_GROUP_KEY, lg.code);
    toast(`Ja ets al grup «${lg.name}»`); Sfx.play("unlock"); after();
  });
}
async function epInvite(lg) {
  const url = `${location.origin}${location.pathname}#electoporra/${lg.code}`;
  const text = `Juguem a l'Electoporra del 29N? Entra al grup «${lg.name}» (codi ${lg.code}):\n${url}`;
  if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancel·lat */ } }
  try { await navigator.clipboard.writeText(text); toast("Invitació copiada: enganxa-la al grup de WhatsApp"); } catch { prompt("Copia la invitació:", text); }
}

// ---------- Qui ja ha jugat: el resum i el grup ----------
async function epHome(body, st, r) {
  const open = st === "oberta";
  const M = PronState.mine || {};
  const real = !open && r && Esp.data ? Esp.data.seats : null;
  const pots = Esp.cfg.pronPots || PronState.pots;
  const s = M.s, hits = real && s ? epHits(s, real) : null, pct = epPct(hits);
  const bal = real ? pronBalance(M, r, pots) : null;
  const unsaved = open && PronState.draft && epDirty();
  const mk = PRON_M.filter((m) => epBets(M)[m.id]?.a > 0);
  const ids = s ? Object.keys(s).filter((k) => s[k]).sort((a, b) => s[b] - s[a]) : [];
  // Qui ja hi juga amb amics veu primer el seu grup
  const grpFirst = PronState.leagues.length > 0;
  body.innerHTML = `${unsaved ? `<div class="ep-unsaved"><span>✏️ Tens canvis sense desar.</span><button class="btn sm primary" type="button" data-cont>Continua</button></div>` : ""}
    ${grpFirst ? `<section class="card ep-grp top" data-grp id="ep-grup"></section>` : ""}
    <section class="card ep-mine">
      <header class="ep-mine-h"><h2>${open ? "🎟️ La teva Electoporra" : "🎟️ Com t'està anant"}</h2>${open ? `<span class="ep-mine-a"><button class="btn sm" type="button" data-edit>✏️ Edita-la</button><button class="btn sm ghost" type="button" data-restart>🔄 Comença de zero</button></span>` : ""}</header>
      <p class="ep-sub">${open ? `Desada. Hi tens ${epCoin(pronStaked(M))} apostades i la pots canviar fins a les 20:00 del 29N.` : bal && !bal.partial ? `${r.final ? "Has acabat amb" : "Ara mateix en tindries"} ${epCoin(bal.total)} de les ${epCoin(bal.staked)} que hi vas apostar (<b class="${bal.net >= 0 ? "up" : "down"}">${bal.net >= 0 ? "+" : "−"}${fmt(Math.abs(bal.net))}</b>).` : `Hi tens ${epCoin(pronStaked(M))} en joc.`}</p>

      <h3 class="ep-mine-t">🏛️ El teu Congrés</h3>
      ${s ? `<div class="ep-mine-g">
        <div class="ep-hemi">${nitHemi({ seats: { ...s }, totalSeats: epSeatSum(s) }, "").replace(/<div class="nt-hemi-c">[\s\S]*?<\/div>/, `<div class="nt-hemi-c"><b>${pct != null ? `${fmt(pct)} %` : "350"}</b><small>${pct != null ? "d'encert" : "escons"}</small></div>`)}</div>
        <div>
          <ul class="ep-seat-l full">${ids.map((k) => `<li style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))}<b>${s[k]}</b>${real ? `<small class="${(real[k] || 0) === s[k] ? "up" : "down"}" title="Escrutini">${real[k] || 0}</small>` : ""}</li>`).join("")}</ul>
          ${real ? `<p class="ep-sub">Al costat, els escons que surten ara de l'escrutini.</p>` : ""}
          <ul class="ep-sums">${[["PP + Vox", ["pp", "vox"]], ["Els de la investidura del 2023", PRON_INV23]].map(([t, ks]) => { const n = ks.reduce((a, k) => a + (s[k] || 0), 0); return `<li class="${n >= 176 ? "maj" : ""}"><span>${esc(t)}</span><b>${n}</b>${n >= 176 ? "<em>majoria</em>" : ""}</li>`; }).join("")}</ul>
        </div>
      </div>
      <div class="ep-mine-bet"><span>Hi has apostat ${epCoin(M.cs || 0)}</span>${real ? `<b class="${epCongMul(pct) > 1 ? "up" : epCongMul(pct) === 1 ? "" : "down"}">${epCongMul(pct) ? `${epCongMul(pct) === 1 ? "les recuperes" : `en cobres ×${epCongMul(pct)}`}: ${epCoin((M.cs || 0) * epCongMul(pct))}` : "ara les perds"}</b>` : `<small>Si n'encertes el 97 % o més, ${epCoin((M.cs || 0) * 4)}; del 94 al 97 %, ${epCoin((M.cs || 0) * 2)}; del 90 al 94 %, les recuperes.</small>`}</div>
      ${M.pv ? `<details class="ep-mine-map"><summary>🗺️ El teu repartiment per províncies</summary><p class="ep-sub">Toca una circumscripció per veure'n els escons.</p><div class="ep-provmap" data-mmap></div><div class="ep-mine-prov" data-mprov></div></details>` : ""}
      ${open ? `<button class="linkish ep-mine-img" type="button" data-img>📸 Descarrega o comparteix la imatge del teu Congrés</button>` : ""}` : `<p class="ep-sub">No has repartit el Congrés.${open ? ` <button class="linkish" type="button" data-edit2>Fes-ho ara</button>` : ""}</p>`}

      <h3 class="ep-mine-t">🎯 Les teves respostes</h3>
      ${mk.length ? `<ul class="ep-mine-q">${mk.map((m) => { const b = epBets(M)[m.id], out = r?.res?.[m.id], q = out ? pronQ(m, b, out, pots) : null; return `<li class="${out ? (b.o === out ? "win" : q?.refund ? "" : "lose") : ""}"><span class="ep-mq">${m.e} ${esc(m.q)}</span><span class="ep-ma"><b>${esc(m.opts.find(([o]) => o === b.o)?.[1] || b.o)}</b>${epCoin(b.a)}${out ? `<em>${b.o === out ? "✔" : q?.refund ? "↩" : "✘"}</em>` : ""}</span></li>`; }).join("")}</ul>` : `<p class="ep-sub">No n'has respost cap.</p>`}

      <h3 class="ep-mine-t">✍️ Les teves apostes</h3>
      ${(M.x || []).filter(epXValid).length ? `<ul class="ep-xul">${(M.x || []).filter(epXValid).map((x) => { const ok = real ? epXOk(x, real) : null; return `<li class="${ok === true ? "win" : ok === false ? "lose" : ""}" style="--c:${nitParty(x.p).color}"><span class="ep-xs">${epXLine(x)}</span><span class="ep-xa">${epCoin(x.a)}${real ? ` <em>${ok ? "✔" : "✘"} (${real[x.p] || 0})</em>` : ""}</span></li>`; }).join("")}</ul>` : `<p class="ep-sub">No n'has fet cap.</p>`}
    </section>
    ${grpFirst ? "" : `<section class="card ep-grp" data-grp id="ep-grup"></section>`}`;
  $("[data-cont]", body)?.addEventListener("click", () => { PronState.mode = "wiz"; PronState.wi = 0; renderPronostics(); });
  $("[data-restart]", body)?.addEventListener("click", () => {
    if (!confirm("Vols tornar a començar l'Electoporra de zero? El que tens desat no canvia fins que tornis a desar.")) return;
    PronState.draft = { b: {}, s: null, pv: null, cs: 0, x: [] }; PronState.xf = null; PronState.psel = null; epSaveDraft();
    PronState.mode = "wiz"; PronState.wi = 0; Sfx.play("pick"); renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("[data-edit]", body)?.addEventListener("click", () => { PronState.mode = "wiz"; PronState.wi = 0; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("[data-img]", body)?.addEventListener("click", () => { PronState.mode = "wiz"; PronState.wi = 3; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("[data-edit2]", body)?.addEventListener("click", () => { PronState.mode = "wiz"; PronState.wi = 0; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  // El mapa (només per mirar): en tocar una circumscripció, els seus escons
  const mm = $("[data-mmap]", body);
  if (mm && M.pv) {
    const d = epProvD(M.pv);
    const paint = () => {
      PRD.sel = PronState.msel ?? null;
      mm.innerHTML = prdMapSvg(d);
      prdPaintMap(mm, d, (i) => { PronState.msel = PronState.msel === i ? null : i; paint(); });
      const p = d.provs.find((x) => x.i === PronState.msel);
      $("[data-mprov]", body).innerHTML = p ? `<b>${esc(p.name)}</b> · ${p.seats} ${p.seats === 1 ? "escó" : "escons"}: ${Object.entries(M.pv[p.code] || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} ${n}</span>`).join("")}` : "";
    };
    paint();
  }
  epGroupCard($("[data-grp]", body), st, r);
}
async function epGroupCard(box, st, r) {
  const closed = st !== "oberta" && st !== "aviat";
  const real = closed && r && Esp.data ? Esp.data.seats : null;
  const lg = PronState.leagues.find((l) => l.code === PronState.league) || PronState.leagues[0];
  const meUid = window.Online.user.uid;
  const head = `<header class="ep-mine-h"><h2>👥 ${lg ? `El teu grup: ${esc(lg.name)}` : "Juga amb amics"}</h2></header>
    ${PronState.leagues.length > 1 ? `<div class="ep-gtabs" role="tablist" aria-label="Els teus grups">${PronState.leagues.map((l) => `<button type="button" role="tab" aria-selected="${l.code === lg?.code}" data-gtab="${l.code}">${esc(l.name)} <small>${l.members.length}</small></button>`).join("")}</div>` : ""}`;
  const forms = `<details class="ep-gmore" ${lg ? "" : "open"}><summary>${lg ? "Crea un altre grup o entra-hi amb un codi" : "Crea un grup o entra-hi amb un codi"}</summary>${epGroupFormsHtml()}</details>`;
  if (!lg) {
    box.innerHTML = `${head}<p class="ep-sub">La gràcia és jugar-hi amb amics: la nit electoral veureu en directe qui s'acosta més al resultat.</p>${forms}`;
    epGroupFormsBind(box, () => renderPronostics());
    return;
  }
  box.innerHTML = `${head}<p class="muted">Carregant…</p>`;
  const docs = await window.Online.pronMembers(lg.members);
  if (closed && r && !Esp.cfg.pronPots && !PronState.pots && Date.now() - (PronState.allAt || 0) > 60000) {
    PronState.allAt = Date.now();
    const all = await window.Online.pronAll();
    if (all) PronState.pots = pronPotsFrom(all);
  }
  const pots = Esp.cfg.pronPots || PronState.pots;
  const byUid = Object.fromEntries(docs.map((p) => [p.uid, p]));
  const rows = lg.members.map((uid) => {
    const p = byUid[uid] || null, hits = real && p?.s ? epHits(p.s, real) : null, bal = p && real ? pronBalance(p, r, pots) : null;
    return { uid, name: p?.name || (uid === meUid ? window.Online.profile?.handle : null) || "Jugador", photo: p?.photo, played: !!p && (pronStaked(p) > 0 || !!p.s), cong: !!p?.s, hits, pct: epPct(hits), net: bal && !bal.partial ? bal.net : null };
  });
  if (real) rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || (b.net ?? 0) - (a.net ?? 0));
  else rows.sort((a, b) => Number(b.played) - Number(a.played));
  const av = (x) => (x.photo ? `<img src="${esc(x.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="ep-av">${esc((x.name || "?")[0])}</span>`);
  box.innerHTML = `${head}
    <p class="ep-sub">${real ? (r.final ? "Resultat final: qui s'ha acostat més al Congrés." : "En directe: qui s'acosta més al Congrés que surt de l'escrutini.") : closed ? "Ja està tancat. Quan comenci l'escrutini, aquí veureu qui s'acosta més." : "Fins a les 20:00 del 29N només es veu qui ja ha jugat. La nit electoral, en directe, qui s'acosta més al resultat."}</p>
    <ol class="ep-rank">${rows.map((x, i) => `<li class="${x.uid === meUid ? "me" : ""}" style="--i:${i}">
      <span class="ep-pos">${real ? (i < 3 && x.pct != null ? ["🥇", "🥈", "🥉"][i] : i + 1) : ""}</span>${av(x)}
      <span class="ep-nm"><b>${esc(x.name)}</b>${real ? (x.pct != null ? `<span class="ep-meter" aria-hidden="true"><i style="--p:${x.pct}%"></i></span><small>${x.hits} de 350 escons${x.net != null ? ` · ${x.net >= 0 ? "+" : "−"}${fmt(Math.abs(x.net))} monedes` : ""}</small>` : `<small>No va repartir el Congrés</small>`) : `<small>${x.played ? (x.cong ? "Ja ha fet el seu Congrés ✓" : "Ha jugat, sense Congrés") : "Encara no ha jugat"}</small>`}</span>
      <b class="ep-pts">${real ? (x.pct != null ? `${fmt(x.pct)} %` : "—") : x.played ? "✔" : "…"}</b></li>`).join("")}</ol>
    ${!closed ? `<div class="ep-ginv"><span>Codi del grup: <b>${esc(lg.code)}</b></span><button class="btn sm primary" type="button" data-ginv>🔗 Convida-hi amics</button></div>` : ""}
    ${!closed ? forms : ""}
    <p class="ep-gown">${lg.owner === meUid ? `<button class="linkish" type="button" data-gdel>🗑️ Esborra el grup</button>` : `<button class="linkish" type="button" data-gleave>Surt del grup</button>`}</p>`;
  $$("[data-gtab]", box).forEach((b) => b.addEventListener("click", () => { PronState.league = b.dataset.gtab; store.set(EP_GROUP_KEY, PronState.league); Sfx.play("pick"); epGroupCard(box, st, r); }));
  $("[data-ginv]", box)?.addEventListener("click", () => epInvite(lg));
  const drop = () => { PronState.leagues = PronState.leagues.filter((l) => l.code !== lg.code); PronState.league = PronState.leagues[0]?.code || "sol"; store.set(EP_GROUP_KEY, PronState.league); renderPronostics(); };
  $("[data-gdel]", box)?.addEventListener("click", async () => { if (!confirm(`Vols esborrar el grup «${lg.name}»? S'esborrarà per a tots els membres.`)) return; if (await window.Online.leagueDelete(lg.code)) { toast("Grup esborrat"); drop(); } });
  $("[data-gleave]", box)?.addEventListener("click", async () => { if (!confirm(`Vols sortir del grup «${lg.name}»?`)) return; if (await window.Online.leagueLeave(lg.code)) { toast("Has sortit del grup"); drop(); } });
  epGroupFormsBind(box, () => renderPronostics());
}

// Targeta per a la columna de la nit electoral
function pronNitCard(d) {
  const st = pronState();
  if (st === "off" || st === "aviat") return "";
  const mine = PronState.mine;
  if (!window.Online?.user || !mine) return `<section class="card pron-nit"><h2 class="section-title sm">🎰 Electoporra</h2><p class="muted">${st === "oberta" ? "Endevina el Congrés i aposta-hi monedes abans de les 20:00!" : "Mira qui s'acosta més entre els teus amics."}</p><a class="btn" href="#electoporra">${st === "oberta" ? "Juga a l'Electoporra" : "Obre l'Electoporra"}</a></section>`;
  const hits = mine.s && d ? epHits(mine.s, d.seats) : null;
  return `<section class="card pron-nit"><h2 class="section-title sm">🎰 La teva Electoporra</h2>
    ${hits != null ? `<p class="pron-nit-n"><b>${fmt(epPct(hits))} %</b> d'encert del teu Congrés</p>` : `<p class="muted">${fmt(pronStaked(mine))} monedes en joc</p>`}
    <a class="btn" href="#electoporra">Mira el teu grup</a></section>`;
}

ACHIEVEMENTS.push({ id: "pron-fet", name: "Electoporrista", desc: "Juga a l'Electoporra del 29N." });
