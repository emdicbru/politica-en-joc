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
const EP_XMUL = { eq: 5, min: 1.5, max: 1.5 };
const PRON_INV23 = ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"]; // investidura del 2023
const EP_CAT = ["B", "GI", "L", "T"];
// Partits del Congrés que es reparteixen (els petits, plegats a «Més partits»)
const EP_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "salf", "erc", "junts", "bildu", "pnv", "alhora", "d21", "bng", "cc"];
const EP_MORE = ["pacma", "adelante", "te", "sy"];
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
  { id: "m14", e: "📍", q: "Quin partit serà el més votat a Catalunya?", opts: [["psoe", "PSC"], ["junts", "Junts"], ["erc", "ERC"], ["pp", "PP"], ["altre", "Un altre"]], res: (d) => { const k = epCatTop(d); return ["psoe", "junts", "erc", "pp"].includes(k) ? k : "altre"; } },
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
// Pots de cada pregunta: pots[m][opció] = { n: jugadors, a: monedes }
function pronPotsFrom(all) {
  const pots = {};
  PRON_M.forEach((m) => { pots[m.id] = {}; m.opts.forEach(([o]) => { pots[m.id][o] = { n: 0, a: 0 }; }); });
  all.forEach((pl) => PRON_M.forEach((m) => { const b = epBets(pl)[m.id]; if (b && pots[m.id][b.o]) { pots[m.id][b.o].n++; pots[m.id][b.o].a += b.a; } }));
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
const epXOk = (x, seats) => { const n = seats?.[x.p] || 0; return x.c === "eq" ? n === x.n : x.c === "min" ? n >= x.n : n <= x.n; };
const epXPay = (x) => Math.round(x.a * EP_XMUL[x.c]);
// Balanç de tot: el que s'hi ha posat i el que en torna (total); amb «partial», sense els pots de les preguntes encara
function pronBalance(p, r, pots = Esp.cfg.pronPots, d = Esp.data) {
  const staked = pronStaked(p);
  if (!r) return { staked, total: staked, net: 0, partial: true };
  let total = 0;
  PRON_M.forEach((m) => { total += pronQ(m, epBets(p)[m.id], r.res[m.id], pots).got; });
  const seats = d?.seats;
  if (p?.s && p.cs) total += seats ? p.cs * epCongMul(epPct(epHits(p.s, seats))) : p.cs;
  (p?.x || []).forEach((x) => { total += seats ? (epXOk(x, seats) ? epXPay(x) : 0) : x.a; });
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
const epDraft = () => (PronState.draft ||= JSON.parse(JSON.stringify({ b: epBets(PronState.mine), s: PronState.mine?.s || null, cs: PronState.mine?.cs || 0, x: PronState.mine?.x || [] })));
const epDirty = () => { const D = PronState.draft, M = PronState.mine || {}; if (!D) return false; const n = (o) => JSON.stringify([PRON_M.map((m) => o.b?.[m.id] || null), o.s ? Object.entries(o.s).filter(([, v]) => v).sort() : null, o.s ? o.cs || 0 : 0, o.x || []]); return n(D) !== n({ b: M.b, s: M.s, cs: M.cs, x: M.x }); };
const epSeatSum = (s) => Object.values(s || {}).reduce((a, n) => a + (n || 0), 0);
// Escons que pot treure com a molt cada partit: els de les circumscripcions on es presenta
let epMaxCache = null;
const epMax = (k) => {
  if (!epMaxCache) { epMaxCache = {}; [...EP_PARTIES, ...EP_MORE].forEach((p) => { epMaxCache[p] = SIM_PROVS.filter((x) => typeof prdRuns !== "function" || prdRuns(p, x.code)).reduce((a, x) => a + x.seats, 0); }); }
  return epMaxCache[k] ?? 350;
};
// El Congrés del 2023 (UPN, que ara va amb el PP, dins del PP)
const epCong2023 = () => { const s = {}; Object.entries(ESP_2023).forEach(([k, v]) => { s[k] = v[0]; }); s.pp = (s.pp || 0) + 1; return s; };

async function renderPronostics(arg) {
  const root = $("#pron-page");
  if (!root) return;
  if (arg && EP_STEPS.some(([k]) => k === arg)) PronState.step = arg;
  if (["meus", "preguntes"].includes(arg)) PronState.step = "preguntes";
  if (["lligues", "amics", "general"].includes(arg)) PronState.step = "grup";
  if (arg === "escons") PronState.step = "congres";
  const join = arg && /^[A-Z2-9]{5}$/.test(arg) ? arg : null;
  if (/^#(pronostics|prediccio|escons)(\/|$)/.test(location.hash)) history.replaceState(null, "", `#electoporra${PronState.step === "congres" ? "" : `/${PronState.step}`}`);
  const O = window.Online;
  const st = pronState();
  const logged = !!O?.user;
  if (logged && PronState.uid !== O.user.uid) {
    PronState.uid = O.user.uid;
    root.innerHTML = `<div class="card ep-load"><p class="muted">Carregant l'Electoporra…</p></div>`;
    PronState.mine = await O.pronGet();
    PronState.draft = null;
    PronState.leagues = await O.pronLeagues();
    const saved = store.get(EP_GROUP_KEY, null);
    PronState.league = PronState.leagues.some((l) => l.code === saved) ? saved : saved === "sol" ? "sol" : PronState.leagues[0]?.code || "sol";
    if (!/^#(pronostics|electoporra|prediccio|escons)/.test(location.hash)) return;
  }
  if (logged && join && !PronState.leagues.some((l) => l.code === join)) {
    const lg = await O.leagueJoin(join);
    if (lg) { PronState.leagues.push(lg); PronState.league = lg.code; store.set(EP_GROUP_KEY, lg.code); PronState.step = "grup"; toast(`Ja ets al grup «${lg.name}»`); Sfx.play("unlock"); }
    history.replaceState(null, "", "#electoporra");
  } else if (join) { PronState.league = join; }
  const night = ["nit", "despres"].includes(espFase());
  if (night && !Esp.data && espResultsMode() !== "off" && !PronState.fetching) {
    PronState.fetching = true;
    espFetchResults().then(() => { PronState.fetching = false; if (/^#(pronostics|electoporra)/.test(location.hash)) renderPronostics(); });
  }
  if (st !== "oberta" && PronState.step === "congres" && !PronState.stepSet && night) PronState.step = "grup";
  const r = pronResults(night || Esp.cfg.pronRes ? Esp.data : null);
  if (logged) epSyncCoins(r);
  const status = st === "aviat" ? "S'obre el 23 de novembre" : st === "oberta" ? `Es tanca d'aquí a <b>${pronCountdown()}</b> · 29N, 20:00` : st === "off" ? "No disponible" : r?.final ? "Resultat final" : r ? "Tancada · es resol en directe amb l'escrutini" : "Tancada · es resoldrà amb l'escrutini";
  const lg = PronState.leagues.find((l) => l.code === PronState.league);
  root.innerHTML = `${espPreviewBar()}
    <header class="ep-hero">
      <div class="ep-hero-t"><p class="ep-k">29N · Eleccions generals</p><h1>Electoporra</h1>
        <p>Endevina com quedarà el Congrés i aposta-hi monedes del joc. Juga sol o amb els teus amics.</p>
        <p class="ep-status">${status}</p></div>
      ${logged ? `<div class="ep-wallet" aria-live="polite"><small>${st === "oberta" ? "Et queden per apostar" : "Les teves monedes"}</small><b data-ep-wallet>0</b><span>🪙 monedes</span>${st === "oberta" ? `<em>Inclou ${EP_BONUS} de regal</em>` : ""}</div>` : ""}
    </header>
    ${logged ? `<div class="ep-group">${epGroupBarHtml(lg)}</div>
    <nav class="ep-steps" role="tablist" aria-label="Passos">${EP_STEPS.map(([k, e, t], i) => `<button type="button" role="tab" aria-selected="${PronState.step === k}" data-step="${k}"><span class="ep-n">${epStepDone(k) ? "✓" : i + 1}</span><span class="ep-st"><i aria-hidden="true">${e}</i> ${t}</span></button>`).join("")}</nav>` : ""}
    <div data-pbody class="ep-body"></div>
    ${logged && st === "oberta" ? `<div class="ep-bar" data-ep-bar></div>` : ""}
    <p class="sim-fiction">Les monedes són una moneda inventada de Política en Joc: no es poden comprar, no tenen cap valor i no es poden bescanviar per res. Fins a les 20:00 del 29N ningú veu què han apostat els altres.</p>`;
  espBind(root);
  const body = $("[data-pbody]", root);
  if (!logged) {
    body.innerHTML = `<div class="card ep-login"><h2>Entra per jugar</h2><p>Necessites un compte perquè l'Electoporra es desi i la puguis comparar amb els teus amics. Tens ${EP_BONUS} monedes de regal per començar.</p><button class="btn primary lg" type="button" data-plogin>Entra</button></div>`;
    $("[data-plogin]", body).addEventListener("click", () => O?.accountClick?.());
    return;
  }
  $$("[data-step]", root).forEach((b) => b.addEventListener("click", () => { PronState.step = b.dataset.step; PronState.stepSet = true; renderPronostics(); window.scrollTo({ top: Math.max(0, ($(".ep-steps")?.offsetTop || 0) - 70), behavior: "smooth" }); }));
  epGroupBind(root);
  ({ congres: epCongres, preguntes: pronMine, apostes: epMine, grup: pronLeagues })[PronState.step](body, st, r);
  epBarSync();
}
const epStepDone = (k) => {
  const M = PronState.draft || { b: epBets(PronState.mine), s: PronState.mine?.s, cs: PronState.mine?.cs, x: PronState.mine?.x };
  return k === "congres" ? epSeatSum(M.s) === 350 && M.cs > 0 : k === "preguntes" ? pronCount(M) > 0 : k === "apostes" ? (M.x || []).length > 0 : false;
};
// Barra de baix: el que has apostat, el que et queda i Desa
function epBarSync() {
  const bar = $("[data-ep-bar]"), w = $("[data-ep-wallet]");
  const D = PronState.draft || { b: epBets(PronState.mine), s: PronState.mine?.s, cs: PronState.mine?.cs, x: PronState.mine?.x };
  const left = epAvail() - pronStaked(D);
  if (w) w.textContent = fmt(pronState() === "oberta" ? Math.max(0, left) : typeof Coins !== "undefined" ? Coins.balance() : 0);
  $$("[data-step]").forEach((b, i) => { const n = $(".ep-n", b); if (n) n.textContent = epStepDone(b.dataset.step) ? "✓" : i + 1; });
  if (!bar) return;
  const dirty = epDirty(), seats = D.s ? epSeatSum(D.s) : 350;
  const err = left < 0 ? `Et passes de ${epFmt(-left)}: treu-ne d'alguna aposta` : D.s && seats !== 350 && (D.cs || 0) > 0 ? `Al teu Congrés hi ha ${seats} escons: n'hi ha d'haver 350` : null;
  bar.className = `ep-bar ${err ? "bad" : dirty ? "dirty" : ""}`;
  bar.innerHTML = `<div class="ep-bar-t"><b>🪙 ${fmt(pronStaked(D))} apostades</b><small>${err || (dirty ? `Et queden ${epFmt(Math.max(0, left))} · falta desar-ho` : pronStaked(D) ? "✓ Desat. Pots canviar-ho fins a les 20:00 del 29N." : "Comença pel teu Congrés")}</small></div><button class="btn primary" type="button" data-psave ${!dirty || err || PronState.saving ? "disabled" : ""}>${PronState.saving ? "Desant…" : "Desa"}</button>`;
  $("[data-psave]", bar)?.addEventListener("click", epSave);
}
async function epSave() {
  if (espPreview()) return toast("Vista prèvia: no es desa");
  const D = epDraft();
  const b = {};
  PRON_M.forEach((m) => { if (D.b[m.id] && D.b[m.id].a > 0) b[m.id] = { o: D.b[m.id].o, a: D.b[m.id].a }; });
  const full = D.s && epSeatSum(D.s) === 350;
  const doc = { b, ...(full ? { s: Object.fromEntries(Object.entries(D.s).filter(([, n]) => n > 0)), cs: D.cs || 0 } : {}), x: (D.x || []).slice(0, EP_XN) };
  PronState.saving = true; epBarSync();
  const prev = pronStaked(PronState.mine);
  const ok = await window.Online.pronSave(doc);
  PronState.saving = false;
  if (ok) {
    PronState.mine = { ...(PronState.mine || {}), ...doc }; if (!full) { delete PronState.mine.s; delete PronState.mine.cs; }
    PronState.draft = null;
    epSyncCoins(null);
    if (pronStaked(PronState.mine) > prev) window.Stats?.add("aposta", pronStaked(PronState.mine) - prev);
    Sfx.play("unlock"); toast("Electoporra desada"); Progress.unlock("pron-fet");
    if (typeof confetti === "function" && !prev) confetti(70);
  }
  renderPronostics();
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

// ---------- Grup: sol o amb amics ----------
function epGroupBarHtml(lg) {
  const ls = PronState.leagues;
  return `<div class="ep-gsel"><span class="ep-gl">Jugues</span>
      <div class="ep-gchips" role="group" aria-label="Grup">
        <button type="button" data-g="sol" aria-pressed="${PronState.league === "sol"}">👤 Sol</button>
        ${ls.map((l) => `<button type="button" data-g="${l.code}" aria-pressed="${l.code === PronState.league}">👥 ${esc(l.name)} <small>${l.members.length}</small></button>`).join("")}
        <button type="button" class="ep-gadd" data-gopen="new" aria-expanded="${PronState.gform === "new"}">＋ Crea un grup</button>
        <button type="button" class="ep-gadd" data-gopen="join" aria-expanded="${PronState.gform === "join"}">🔑 Tinc un codi</button>
      </div></div>
    ${PronState.gform === "new" ? `<form class="ep-gform" data-gnew><label>Nom del grup<input type="text" maxlength="30" required placeholder="Per exemple: La colla del poble" data-gname></label><button class="btn primary" type="submit">Crea'l</button></form>` : ""}
    ${PronState.gform === "join" ? `<form class="ep-gform" data-gjoin><label>Codi del grup<input type="text" maxlength="5" required placeholder="ABCDE" autocapitalize="characters" data-gcode></label><button class="btn primary" type="submit">Entra-hi</button></form>` : ""}
    ${lg ? `<div class="ep-ginv"><span>Convida-hi amics amb el codi <b>${esc(lg.code)}</b></span><button class="btn sm" type="button" data-ginv>🔗 Envia la invitació</button></div>` : ""}`;
}
function epGroupBind(root) {
  const O = window.Online;
  $$("[data-g]", root).forEach((b) => b.addEventListener("click", () => { PronState.league = b.dataset.g; store.set(EP_GROUP_KEY, PronState.league); Sfx.play("pick"); renderPronostics(); }));
  $$("[data-gopen]", root).forEach((b) => b.addEventListener("click", () => { PronState.gform = PronState.gform === b.dataset.gopen ? null : b.dataset.gopen; renderPronostics(); setTimeout(() => $("[data-gname], [data-gcode]")?.focus(), 50); }));
  $("[data-gnew]", root)?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("[data-gname]", root).value.trim();
    if (!name) return;
    const lg = await O.leagueCreate(name);
    if (!lg) return;
    PronState.leagues.push(lg); PronState.league = lg.code; PronState.gform = null; store.set(EP_GROUP_KEY, lg.code);
    toast("Grup creat! Ara convida-hi els teus amics"); Sfx.play("unlock"); renderPronostics();
  });
  $("[data-gjoin]", root)?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = $("[data-gcode]", root).value.trim().toUpperCase();
    if (!/^[A-Z2-9]{5}$/.test(code)) return toast("El codi té 5 lletres o xifres");
    const lg = await O.leagueJoin(code);
    if (!lg) return;
    if (!PronState.leagues.some((l) => l.code === lg.code)) PronState.leagues.push(lg);
    PronState.league = lg.code; PronState.gform = null; store.set(EP_GROUP_KEY, lg.code);
    toast(`Ja ets al grup «${lg.name}»`); Sfx.play("unlock"); renderPronostics();
  });
  $("[data-ginv]", root)?.addEventListener("click", async () => {
    const lg = PronState.leagues.find((l) => l.code === PronState.league);
    if (!lg) return;
    const url = `${location.origin}${location.pathname}#electoporra/${lg.code}`;
    const text = `Juguem a l'Electoporra del 29N? Entra al grup «${lg.name}» (codi ${lg.code}):\n${url}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancel·lat */ } }
    try { await navigator.clipboard.writeText(text); toast("Invitació copiada: enganxa-la al grup de WhatsApp"); } catch { prompt("Copia la invitació:", text); }
  });
}

// ---------- 1. El teu Congrés ----------
function epCongres(body, st, r) {
  const open = st === "oberta";
  const D = epDraft();
  const real = !open && r && Esp.data ? Esp.data.seats : null;
  const s = open ? D.s : PronState.mine?.s || null;
  if (!s && open) {
    const prev = typeof prdFinal === "function" ? prdFinal() : null;
    body.innerHTML = `<section class="card ep-start">
      <h2>Com quedarà el Congrés?</h2>
      <p>Reparteix els <b>350 escons</b> entre els partits com creus que quedaran el 29N. Després hi apostes monedes: com més escons encertis, més en guanyes.</p>
      <p class="ep-sub">Per on vols començar?</p>
      <div class="ep-starts">
        <button type="button" data-from="2023"><span>🏛️</span><b>El Congrés d'ara</b><small>Els escons del 2023, i el canvies</small></button>
        ${prev ? `<button type="button" data-from="prd"><span>🔮</span><b>La teva predicció</b><small>La que vas fer amb els vots</small></button>` : ""}
        <button type="button" data-from="zero"><span>✏️</span><b>De zero</b><small>Tots els partits a 0</small></button>
      </div></section>`;
    $$("[data-from]", body).forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.from;
      D.s = f === "2023" ? epCong2023() : f === "prd" ? (() => { const x = prdFinal(); const d = prdCompute(x.t, x.o || {}, x.s || {}); return { ...d.seats }; })() : {};
      delete D.s.upn; delete D.s.altres;
      if (!D.cs) D.cs = 100;
      Sfx.play("pick"); epCongres(body, st, r); epBarSync();
    }));
    return;
  }
  if (!s) { body.innerHTML = `<div class="card ep-empty"><h2>El teu Congrés</h2><p>No vas repartir els escons del Congrés.</p></div>`; return; }
  const sum = epSeatSum(s), left = 350 - sum;
  const dd = { seats: { ...s }, totalSeats: sum };
  const hits = real ? epHits(s, real) : null, pct = epPct(hits);
  const sums = [["PP + Vox", ["pp", "vox"]], ["Els de la investidura del 2023", PRON_INV23]].map(([t, ids]) => [t, ids.reduce((a, k) => a + (s[k] || 0), 0)]);
  const row = (k) => { const p = nitParty(k), n = s[k] || 0; return `<div class="ep-prow" style="--c:${p.color}" data-k="${k}">
      <span class="ep-pn"><i></i><b>${esc(p.sig)}</b></span>
      ${open ? `<div class="ep-seatbox"><button type="button" data-ss="-1" aria-label="Un escó menys a ${esc(p.sig)}" ${n ? "" : "disabled"}>−</button><input type="text" inputmode="numeric" value="${n}" data-sn aria-label="Escons de ${esc(p.sig)}"><button type="button" data-ss="1" aria-label="Un escó més a ${esc(p.sig)}" ${left > 0 && n < epMax(k) ? "" : "disabled"}>+</button></div><span class="ep-seatu">escons</span>`
        : `<b class="ep-seatfix">${n}</b><span class="ep-seatu">escons</span>${real ? `<span class="ep-real ${(real[k] || 0) === n ? "ok" : ""}">${real[k] || 0} reals</span>` : ""}`}
    </div>`; };
  const cs = (open ? D.cs : PronState.mine?.cs) || 0;
  body.innerHTML = `<section class="card ep-cong">
      <header class="ep-cong-h"><div><h2>${open ? "El teu Congrés" : "El Congrés que vas apostar"}</h2><p class="ep-sub">${open ? "Reparteix els 350 escons. Toca + i − (o escriu el número)." : real ? "Comparat amb l'escrutini, escó a escó." : "Es compararà amb l'escrutini."}</p></div>
        ${open ? `<button class="btn sm ghost" type="button" data-creset>Torna a començar</button>` : ""}</header>
      <div class="ep-cong-g">
        <div class="ep-hemi">${nitHemi(dd, "").replace(/<div class="nt-hemi-c">[\s\S]*?<\/div>/, `<div class="nt-hemi-c"><b>${sum}</b><small>de 350 escons</small></div>`)}</div>
        <div class="ep-cong-side">
          ${open ? `<p class="ep-left ${left === 0 ? "ok" : left < 0 ? "ko" : ""}" aria-live="polite">${left === 0 ? "✓ Tots els escons repartits<small>Per donar-ne més a un partit, primer treu-ne a un altre.</small>" : left > 0 ? `Queden <b>${left}</b> ${left === 1 ? "escó" : "escons"} per repartir` : `Te'n sobren <b>${-left}</b>`}</p>` : ""}
          ${pct != null ? `<div class="ep-hits"><b>${fmt(pct)} %</b><span>d'encert · ${hits} de 350 escons ${r.final ? "" : "(ara mateix)"}</span><i style="--p:${pct}%"></i></div>` : ""}
          <ul class="ep-sums">${sums.map(([t, n]) => `<li class="${n >= 176 ? "maj" : ""}"><span>${esc(t)}</span><b>${n}</b>${n >= 176 ? "<em>majoria</em>" : ""}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="ep-prows">${EP_PARTIES.map(row).join("")}</div>
      <details class="ep-more" ${EP_MORE.some((k) => s[k]) ? "open" : ""}><summary>Més partits <small>${EP_MORE.map((k) => esc(nitSig(k))).join(", ")}</small></summary><div class="ep-prows">${EP_MORE.map(row).join("")}</div></details>
    </section>
    <section class="card ep-betcard">
      <h3>🪙 La teva aposta al Congrés</h3>
      <p class="ep-sub">Això són monedes, no escons: com més escons encertis, més monedes cobres.</p>
      ${open ? epStakeHtml("cs", cs, "Hi aposto") : `<p class="ep-res">Hi vas apostar ${epCoin(cs)} monedes.</p>`}
      <ul class="ep-pay">
        <li class="${pct != null && pct >= 97 ? "on" : ""}"><span>Si n'encertes el 97 % o més</span><b>cobres ×4</b><em>${epCoin(cs * 4)}</em></li>
        <li class="${pct != null && pct >= 94 && pct < 97 ? "on" : ""}"><span>Del 94 al 97 %</span><b>cobres ×2</b><em>${epCoin(cs * 2)}</em></li>
        <li class="${pct != null && pct >= 90 && pct < 94 ? "on" : ""}"><span>Del 90 al 94 %</span><b>les recuperes</b><em>${epCoin(cs)}</em></li>
        <li class="${pct != null && pct < 90 ? "on" : ""}"><span>Menys del 90 %</span><b>les perds</b><em>${epCoin(0)}</em></li>
      </ul>
      <p class="ep-note">L'encert és la part dels 350 escons que coincideix amb el resultat, partit per partit.</p>
    </section>`;
  if (!open) return;
  const redraw = () => { const y = scrollY; epCongres(body, st, r); epBarSync(); scrollTo(0, y); };
  const clamp = (k, v) => Math.max(0, Math.min(epMax(k), 350 - (epSeatSum(D.s) - (D.s[k] || 0)), Math.round(v) || 0));
  $$(".ep-prow", body).forEach((rw) => {
    const k = rw.dataset.k;
    $$("[data-ss]", rw).forEach((b) => {
      let tm = null, iv = null, held = false;
      b.addEventListener("click", () => { if (held) { held = false; return; } D.s[k] = clamp(k, (D.s[k] || 0) + Number(b.dataset.ss)); redraw(); });
      b.addEventListener("pointerdown", () => {
        tm = setTimeout(() => {
          held = true;
          iv = setInterval(() => {
            D.s[k] = clamp(k, (D.s[k] || 0) + Number(b.dataset.ss));
            const inp = $("[data-sn]", rw); if (inp) inp.value = D.s[k];
            epLiveLeft(body, D);
          }, 90);
        }, 400);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => { clearTimeout(tm); if (iv) { clearInterval(iv); iv = null; setTimeout(redraw, 0); } }));
    });
    $("[data-sn]", rw).addEventListener("change", (e) => { D.s[k] = clamp(k, Number(e.target.value.replace(/\D/g, ""))); redraw(); });
  });
  $("[data-creset]", body)?.addEventListener("click", () => { D.s = null; D.cs = 0; redraw(); });
  epStakeBind(body, () => D.cs, (k, v) => { D.cs = v; redraw(); });
}
function epLiveLeft(body, D) { const l = $(".ep-left", body), n = 350 - epSeatSum(D.s); if (l) l.innerHTML = n === 0 ? "✓ Tots els escons repartits" : n > 0 ? `Queden <b>${n}</b> per repartir` : `Te'n sobren <b>${-n}</b>`; }

// ---------- 2. Preguntes ----------
function pronMine(body, st, r) {
  const open = st === "oberta";
  const D = epDraft().b;
  const pots = Esp.cfg.pronPots || PronState.pots;
  body.innerHTML = `${st === "aviat" ? `<div class="card ep-soon"><b>Les apostes s'obren el 23 de novembre.</b> Ja pots mirar quines preguntes hi haurà.</div>` : ""}
    ${open ? `<div class="ep-howto"><b>Com funciona</b><p>Tria una resposta i decideix quantes monedes hi apostes. Si l'encertes, recuperes les teves monedes i et quedes part de les dels qui l'han fallada (com més hi apostis, més part). No cal respondre-les totes.</p></div>` : ""}
    <div class="ep-list">${PRON_M.map((m) => {
      const b = D[m.id];
      const out = r?.res?.[m.id];
      const q = out && b ? pronQ(m, b, out, pots) : null;
      return `<section class="card ep-m ${b ? "has" : ""}" data-m="${m.id}">
        <header><span class="ep-e" aria-hidden="true">${m.e}</span><h3>${esc(m.q)}</h3>${b?.a ? epCoin(b.a) : ""}</header>
        ${m.hint ? `<p class="ep-hint">${esc(m.hint)}</p>` : ""}
        <div class="ep-opts">${m.opts.map(([o, t]) => `<button type="button" data-mo="${m.id}" data-o="${o}" aria-pressed="${b?.o === o}" class="${out === o ? "win" : ""}" ${open ? "" : "disabled"}>${esc(t)}${out === o ? ` <small>${r.final ? "✔" : "ara"}</small>` : ""}</button>`).join("")}</div>
        ${open ? (b ? epStakeHtml(m.id, b.a) + `<button type="button" class="ep-del" data-del="${m.id}">Treu aquesta aposta</button>` : "")
          : b ? `<p class="ep-res">Hi vas apostar ${epCoin(b.a)} a «${esc(m.opts.find(([o]) => o === b.o)?.[1] || b.o)}»${q ? (q.lost ? ` · <span class="down">${r.final ? "fallada" : "ara la falles"}</span>` : q.refund ? " · ningú l'ha encertada: la recuperes" : out === b.o ? ` · <span class="up">${r.final ? "encertada" : "ara l'encertes"}${q.share ? `: +${fmt(Math.round(q.share))}` : q.share === null ? " (el bot es publica després de les 20:00)" : ""}</span>` : "") : ""}</p>` : `<p class="ep-res muted">No hi vas apostar.</p>`}
      </section>`;
    }).join("")}</div>`;
  if (!open) return;
  const redraw = () => { const y = scrollY; pronMine(body, st, r); epBarSync(); scrollTo(0, y); };
  $$("[data-mo]", body).forEach((btn) => btn.addEventListener("click", () => {
    const m = btn.dataset.mo, o = btn.dataset.o;
    if (D[m]?.o === o) delete D[m];
    else D[m] = { o, a: D[m]?.a || 50 };
    Sfx.play("pick"); redraw();
  }));
  epStakeBind(body, (k) => D[k]?.a, (k, v) => { if (D[k]) D[k].a = v; redraw(); });
  $$("[data-del]", body).forEach((b) => b.addEventListener("click", () => { delete D[b.dataset.del]; redraw(); }));
}

// ---------- 3. Les teves apostes ----------
const EP_XC = [["min", "com a mínim"], ["eq", "exactament"], ["max", "com a màxim"]];
function epMine(body, st, r) {
  const open = st === "oberta";
  const D = epDraft();
  const xs = open ? D.x : PronState.mine?.x || [];
  const real = !open && r && Esp.data ? Esp.data.seats : null;
  const f = (PronState.xf ||= { p: "pp", c: "min", n: 140, a: 50 });
  body.innerHTML = `${open ? `<section class="card ep-xmake">
      <h2>Fes la teva aposta</h2>
      <p class="ep-sub">Escull un partit i quants escons creus que traurà. Després, quantes monedes hi apostes.</p>
      <div class="ep-sentence">
        <select data-xp aria-label="Partit">${[...EP_PARTIES, ...EP_MORE].map((k) => `<option value="${k}" ${f.p === k ? "selected" : ""}>${esc(nitSig(k))}</option>`).join("")}</select>
        <span>traurà</span>
        <select data-xc aria-label="Condició">${EP_XC.map(([c, t]) => `<option value="${c}" ${f.c === c ? "selected" : ""}>${t}</option>`).join("")}</select>
        <span class="ep-seatbox sm"><button type="button" data-xn="-1" aria-label="Un escó menys">−</button><input type="text" inputmode="numeric" value="${f.n}" data-xnv aria-label="Escons"><button type="button" data-xn="1" aria-label="Un escó més">+</button></span>
        <span>escons</span>
      </div>
      ${epStakeHtml("x", f.a, "Hi aposto")}
      <p class="ep-xwin" data-xwin>Si l'encertes, en cobres ${epCoin(Math.round(f.a * EP_XMUL[f.c]))} (×${String(EP_XMUL[f.c]).replace(".", ",")})</p>
      <button class="btn primary" type="button" data-xadd ${xs.length >= EP_XN ? "disabled" : ""}>＋ Afegeix l'aposta</button>
      ${xs.length >= EP_XN ? `<p class="ep-sub">Com a molt, ${EP_XN} apostes.</p>` : ""}
    </section>` : ""}
    <section class="card ep-xlist">
      <h2>${open ? "Les teves apostes" : "Les apostes que vas fer"}</h2>
      ${xs.length ? `<ul>${xs.map((x, i) => { const ok = real ? epXOk(x, real) : null; return `<li class="${ok === true ? "win" : ok === false ? "lose" : ""}" style="--c:${nitParty(x.p).color}">
        <span class="ep-xs"><i></i><b>${esc(nitSig(x.p))}</b> traurà ${EP_XC.find(([c]) => c === x.c)[1]} <b>${x.n}</b> escons</span>
        <span class="ep-xa">${epCoin(x.a)} → ${epCoin(epXPay(x))}</span>
        ${real ? `<span class="ep-xr">${ok ? `✔ ${r.final ? "encertada" : "ara l'encertes"}` : `✘ ${r.final ? "fallada" : "ara la falles"}`} <small>(${real[x.p] || 0} escons)</small></span>` : ""}
        ${open ? `<button type="button" class="ep-del" data-xdel="${i}" aria-label="Treu-la">✕</button>` : ""}</li>`; }).join("")}</ul>` : `<p class="muted">${open ? "Encara no n'has fet cap. Per exemple: «Vox traurà com a mínim 40 escons»." : "No en vas fer cap."}</p>`}
      <p class="ep-note">Exactament: en cobres ×5. Com a mínim o com a màxim: ×1,5. Es resolen soles amb l'escrutini.</p>
    </section>`;
  if (!open) return;
  const redraw = () => { const y = scrollY; epMine(body, st, r); epBarSync(); scrollTo(0, y); };
  const win = () => { const el = $("[data-xwin]", body); if (el) el.innerHTML = `Si l'encertes, en cobres ${epCoin(Math.round(f.a * EP_XMUL[f.c]))} (×${String(EP_XMUL[f.c]).replace(".", ",")})`; };
  $("[data-xp]", body).addEventListener("change", (e) => { f.p = e.target.value; f.n = Math.min(f.n, epMax(f.p)); $("[data-xnv]", body).value = f.n; });
  $("[data-xc]", body).addEventListener("change", (e) => { f.c = e.target.value; win(); });
  const setN = (v) => { f.n = Math.max(0, Math.min(epMax(f.p), Math.round(v) || 0)); $("[data-xnv]", body).value = f.n; };
  $$("[data-xn]", body).forEach((b) => b.addEventListener("click", () => setN(f.n + Number(b.dataset.xn))));
  $("[data-xnv]", body).addEventListener("change", (e) => setN(Number(e.target.value.replace(/\D/g, ""))));
  epStakeBind(body, () => f.a, (k, v) => { f.a = v; $("[data-stake] [data-sv]", body).value = v; win(); });
  $("[data-xadd]", body).addEventListener("click", () => {
    if (D.x.length >= EP_XN) return;
    D.x.push({ p: f.p, c: f.c, n: f.n, a: f.a });
    Sfx.play("pick"); toast("Aposta afegida. Recorda desar-ho."); redraw();
  });
  $$("[data-xdel]", body).forEach((b) => b.addEventListener("click", () => { D.x.splice(Number(b.dataset.xdel), 1); redraw(); }));
}

// ---------- 4. Grup ----------
async function pronLeagues(body, st, r) {
  const closed = st !== "oberta" && st !== "aviat";
  const real = closed && r && Esp.data ? Esp.data.seats : null;
  const lg = PronState.leagues.find((l) => l.code === PronState.league);
  const meUid = window.Online.user.uid;
  if (!lg) {
    const m = PronState.mine, b = m ? pronBalance(m, real ? r : null) : null, hits = real && m?.s ? epHits(m.s, real) : null;
    body.innerHTML = `<section class="card ep-solo">
      <h2>Jugues sol</h2>
      ${real ? `<div class="ep-hits"><b>${hits != null ? `${fmt(epPct(hits))} %` : "—"}</b><span>${hits != null ? `d'encert del teu Congrés · ${hits} de 350 escons` : "No vas repartir el Congrés"}</span>${hits != null ? `<i style="--p:${epPct(hits)}%"></i>` : ""}</div>
        <p>${b && !b.partial ? `Ara mateix l'Electoporra et tornaria ${epCoin(b.total)} de les ${epCoin(b.staked)} que hi vas apostar.` : `Tens ${epCoin(pronStaked(m))} en joc.`}</p>` : `<p>La gràcia és jugar-hi amb amics: durant la nit electoral veureu en directe qui s'acosta més al resultat.</p>`}
      <div class="ep-solo-a"><button class="btn primary" type="button" data-gopen2="new">＋ Crea un grup</button><button class="btn" type="button" data-gopen2="join">🔑 Tinc un codi</button></div>
    </section>`;
    $$("[data-gopen2]", body).forEach((b) => b.addEventListener("click", () => { PronState.gform = b.dataset.gopen2; renderPronostics(); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => $("[data-gname], [data-gcode]")?.focus(), 300); }));
    return;
  }
  body.innerHTML = `<div class="card"><p class="muted">Carregant ${esc(lg.name)}…</p></div>`;
  const docs = await window.Online.pronMembers(lg.members);
  if (closed && r && !Esp.cfg.pronPots && !PronState.pots && Date.now() - (PronState.allAt || 0) > 60000) {
    PronState.allAt = Date.now();
    const all = await window.Online.pronAll();
    if (all) PronState.pots = pronPotsFrom(all);
  }
  const pots = Esp.cfg.pronPots || PronState.pots;
  const byUid = Object.fromEntries(docs.map((p) => [p.uid, p]));
  const rows = lg.members.map((uid) => {
    const p = byUid[uid] || null;
    const hits = real && p?.s ? epHits(p.s, real) : null;
    const bal = p && real ? pronBalance(p, r, pots) : null;
    return { uid, p, name: p?.name || (uid === meUid ? window.Online.profile?.handle : null) || "Jugador", photo: p?.photo, played: !!p && (pronStaked(p) > 0 || !!p.s), cong: !!p?.s, n: pronCount(p) + (p?.x || []).length, hits, pct: epPct(hits), net: bal && !bal.partial ? bal.net : null };
  });
  if (real) rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || (b.net ?? 0) - (a.net ?? 0));
  else rows.sort((a, b) => Number(b.played) - Number(a.played));
  const av = (x) => (x.photo ? `<img src="${esc(x.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="ep-av">${esc((x.name || "?")[0])}</span>`);
  body.innerHTML = `<section class="card ep-lg">
      <header class="ep-lg-h"><div><h2>${esc(lg.name)}</h2><p class="ep-sub">${real ? (r.final ? "Resultat final: qui s'ha acostat més al Congrés." : "En directe: qui s'acosta més al Congrés que surt de l'escrutini.") : closed ? "Ja està tancat. Quan comenci l'escrutini, aquí veureu qui s'acosta més." : "Fins a les 20:00 del 29N només es veu qui ja ha jugat. Després, en directe, qui s'acosta més al resultat."}</p></div></header>
      <ol class="ep-rank">${rows.map((x, i) => `<li class="${x.uid === meUid ? "me" : ""}" style="--i:${i}">
        <span class="ep-pos">${real ? (i < 3 && x.pct != null ? ["🥇", "🥈", "🥉"][i] : i + 1) : ""}</span>${av(x)}
        <span class="ep-nm"><b>${esc(x.name)}</b>
          ${real ? (x.pct != null ? `<span class="ep-meter" aria-hidden="true"><i style="--p:${x.pct}%"></i></span><small>${x.hits} de 350 escons${x.net != null ? ` · ${x.net >= 0 ? "+" : "−"}${fmt(Math.abs(x.net))} monedes` : ""}</small>` : `<small>No va repartir el Congrés</small>`)
            : `<small>${x.played ? `${x.cong ? "Congrés fet ✓" : "Sense Congrés"}${x.n ? ` · ${x.n} ${x.n === 1 ? "aposta" : "apostes"}` : ""}` : "Encara no ha jugat"}</small>`}</span>
        <b class="ep-pts">${real ? (x.pct != null ? `${fmt(x.pct)} %` : "—") : x.played ? "✔" : "…"}</b>
      </li>`).join("")}</ol>
      ${!real && rows.some((x) => !x.played) ? `<p class="ep-sub">Recorda-ho als que encara no han jugat: es tanca a les 20:00 del 29N.</p>` : ""}
    </section>`;
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
    <a class="btn" href="#electoporra/grup">Mira el teu grup</a></section>`;
}

ACHIEVEMENTS.push({ id: "pron-fet", name: "Electoporrista", desc: "Juga a l'Electoporra del 29N." });
