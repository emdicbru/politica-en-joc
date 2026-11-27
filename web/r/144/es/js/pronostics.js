// Electoporra del 29N (#electoporra; abans #pronostics, que continua funcionant). Tres jocs en un, amb les monedes de joc
// (botiga.js; moneda inventada, sense cap valor: no es poden comprar ni bescanviar):
//  1. Apostes: cadascú posa monedes a les preguntes que vol (com a mínim 10 a cadascuna). A cada pregunta, les monedes dels
//     qui l'han fallada es reparteixen entre els qui l'han encertada en proporció al que hi han posat (que recuperen); si
//     ningú l'encerta, tothom recupera les seves. L'app no fixa quotes ni opina sobre qui guanyarà.
//  2. Escons: cadascú hi envia la seva predicció (prediccio.js) i, amb l'escrutini, es compta quants escons ha encertat.
//  3. Apostes personalitzades: dins d'una Lliga d'amics, qualsevol membre en pot crear una (amb opcions o amb un número,
//     i guanya qui s'hi acosta més); la resol qui l'ha creada quan es tanca.
// Tothom té 300 monedes de regal per jugar-hi (EP_BONUS), a més de les que ha guanyat jugant. Abans del tancament dels
// col·legis no es mostra què ha pronosticat ningú (llei d'enquestes): només qui ja ha jugat.
// Dades: Firestore porra/{uid} (apostes «b» i escons «s») i porrax/{id} (apostes personalitzades); les regles tanquen els
// canvis a les 20:00 del 29N. La Sala de control publica els pots i liquida (control.js), com feia la Lliga de pronòstics.

const PRON_OPEN = Date.UTC(2026, 10, 22, 23); // 23N 00:00
const PRON_CLOSE = ESP_T.nit;                  // 29N 20:00
const EP_BONUS = 300;                          // monedes de regal per jugar a l'Electoporra
const EP_STEP = 10;
const EP_MAX = 5000;
const EP_XMAX = 2000;
const PRON_INV23 = ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"]; // investidura del 2023
const EP_CAT = ["B", "GI", "L", "T"];
const pronRange = (party, cuts, last = "o más") => ({
  opts: [["a", cuts[0] === 1 ? "Ninguna" : `Menos de ${cuts[0]}`], ["b", cuts[1] - 1 === cuts[0] ? `${cuts[0]}` : `De ${cuts[0]} a ${cuts[1] - 1}`], ["c", `De ${cuts[1]} a ${cuts[2] - 1}`], ["d", `${cuts[2]} ${last}`]],
  res: (d) => { const n = d.seats[party] || 0; return n < cuts[0] ? "a" : n < cuts[1] ? "b" : n < cuts[2] ? "c" : "d"; },
});
const epCatTop = (d) => {
  const v = {};
  (d.provs || []).filter((p) => EP_CAT.includes(p.code)).forEach((p) => Object.entries(p.vots || {}).forEach(([k, n]) => { if (k !== "altres") v[k] = (v[k] || 0) + n; }));
  return Object.entries(v).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};
const PRON_M = [
  { id: "m1", e: "🥇", q: "¿Quién será la primera fuerza?", opts: [["pp", "PP"], ["psoe", "PSOE"], ["vox", "Vox"], ["altre", "Otro partido"]], res: (d) => (["pp", "psoe", "vox"].includes(d.ranking[0]) ? d.ranking[0] : "altre") },
  { id: "m6", e: "🔵", q: "¿PP y Vox sumarán mayoría absoluta (176)?", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.pp || 0) + (d.seats.vox || 0) >= 176 ? "si" : "no") },
  { id: "m7", e: "🔴", q: "¿Los partidos que invistieron a Sánchez en 2023 volverán a sumar 176?", hint: "PSOE, FA, Podemos, ERC, Junts, EH Bildu, PNV, BNG y CC", opts: [["si", "Sí"], ["no", "No"]], res: (d) => (PRON_INV23.reduce((a, k) => a + (d.seats[k] || 0), 0) >= 176 ? "si" : "no") },
  { id: "m2", e: "🏛️", q: "¿Cuántos escaños sacará el PP?", ...pronRange("pp", [120, 140, 160]) },
  { id: "m3", e: "🏛️", q: "¿Cuántos escaños sacará el PSOE?", ...pronRange("psoe", [100, 120, 140]) },
  { id: "m4", e: "🏛️", q: "¿Cuántos escaños sacará Vox?", ...pronRange("vox", [30, 45, 60]) },
  { id: "m8", e: "🏛️", q: "¿Cuántos escaños sacará Frente Amplio?", hint: "Con Comuns-Front Ampli, Compromís, CHA y las otras marcas de FA", ...pronRange("fa", [15, 25, 35]) },
  { id: "m9", e: "🟣", q: "¿Cuántos escaños sacará Podemos?", ...pronRange("podemos", [1, 3, 6]) },
  { id: "m10", e: "🟤", q: "¿Cuántos escaños sacará SALF (Se Acabó La Fiesta)?", ...pronRange("salf", [1, 3, 6]) },
  { id: "m11", e: "🗳️", q: "¿Sacará Alhora algún escaño?", hint: "Se presenta en Barcelona, Girona, Lleida y Tarragona", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.alhora || 0) > 0 ? "si" : "no") },
  { id: "m12", e: "🗳️", q: "¿Sacará D21 (Democracia 21 con Ciudadanos) algún escaño?", hint: "Se presenta en Madrid y Barcelona", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.d21 || 0) > 0 ? "si" : "no") },
  { id: "m13", e: "⚖️", q: "Junts o ERC: ¿quién sacará más escaños?", opts: [["junts", "Junts"], ["erc", "ERC"], ["empat", "Empatarán"]], res: (d) => { const j = d.seats.junts || 0, e = d.seats.erc || 0; return j > e ? "junts" : e > j ? "erc" : "empat"; } },
  { id: "m14", e: "📍", q: "¿Qué partido será el más votado en Cataluña?", opts: [["psoe", "PSC"], ["junts", "Junts"], ["erc", "ERC"], ["pp", "PP"], ["altre", "Otro"]], res: (d) => { const k = epCatTop(d); return ["psoe", "junts", "erc", "pp"].includes(k) ? k : "altre"; } },
  { id: "m5", e: "📈", q: "¿La participación será más alta o más baja que en 2023 (66,6 %)?", opts: [["alta", "Más alta"], ["baixa", "Más baja"]], res: (d) => (d.participacio == null ? null : d.participacio >= 66.6 ? "alta" : "baixa") },
];
const PronState = { mine: null, draft: null, tab: "apostes", league: null, saving: false, sort: "escons", all: null, allAt: 0, xs: {}, xform: false };

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
const pronStaked = (p) => PRON_M.reduce((a, m) => a + (epBets(p)[m.id]?.a || 0), 0);
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
// Balanç de les apostes: el que s'hi ha posat i el que en torna (total); amb «partial», sense els pots encara
function pronBalance(p, r, pots = Esp.cfg.pronPots) {
  const staked = pronStaked(p);
  if (!r) return { staked, total: staked, net: 0, partial: true };
  let total = 0;
  PRON_M.forEach((m) => { total += pronQ(m, epBets(p)[m.id], r.res[m.id], pots).got; });
  total = Math.round(total);
  return { staked, total, net: total - staked, partial: !pots };
}
// Escons encertats: per a cada partit, els que coincideixen (com a molt 350)
const epHits = (s, real) => (s && real ? Object.keys({ ...s, ...real }).reduce((a, k) => a + Math.min(s[k] || 0, real[k] || 0), 0) : null);
// Apostes personalitzades: què torna cada aposta un cop resolta
function epXWinners(x) {
  const bs = Object.entries(x.bets || {});
  if (x.res == null) return null;
  if (x.kind === "opt") return new Set(bs.filter(([, b]) => b.o === x.res).map(([u]) => u));
  const best = Math.min(...bs.map(([, b]) => Math.abs(b.n - x.res)));
  return new Set(bs.filter(([, b]) => Math.abs(b.n - x.res) === best).map(([u]) => u));
}
function epXGot(x, uid) {
  const b = x.bets?.[uid];
  if (!b) return 0;
  const w = epXWinners(x);
  if (!w) return null;
  const pot = Object.values(x.bets).reduce((a, y) => a + y.a, 0);
  const wa = Object.entries(x.bets).reduce((a, [u, y]) => a + (w.has(u) ? y.a : 0), 0);
  if (!wa) return b.a;
  return w.has(uid) ? Math.round(b.a + (pot - wa) * (b.a / wa)) : 0;
}
const epFmt = (n) => `${fmt(Math.round(n))} ${Math.round(n) === 1 ? "moneda" : "monedas"}`;
function pronCountdown() {
  const s = Math.max(0, Math.round((PRON_CLOSE - espNow()) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}
// Les teves monedes en joc i les que ja t'han tornat (es desen al progrés: botiga.js les resta i les suma al moneder)
function epSyncCoins(r) {
  if (typeof Coins === "undefined" || !window.Online?.user) return;
  const uid = window.Online.user.uid, mine = PronState.mine;
  let st = pronStaked(mine), won = 0;
  if (r?.final) won += pronBalance(mine, r).total;
  Object.values(PronState.xs).flat().forEach((x) => { const b = x.bets?.[uid]; if (!b) return; st += b.a; const g = epXGot(x, uid); if (g != null) won += g; });
  Coins.setEp(st, won);
}
// Monedes que pots posar ara: el moneder més el regal, més el que ja tens posat a les apostes desades
const epAvail = () => (typeof Coins !== "undefined" ? Coins.epBalance() + pronStaked(PronState.mine) : EP_BONUS);

async function renderPronostics(arg) {
  const root = $("#pron-page");
  if (!root) return;
  if (arg && ["apostes", "escons", "amics", "general"].includes(arg)) PronState.tab = arg;
  if (arg === "meus") PronState.tab = "apostes";
  if (arg === "lligues") PronState.tab = "amics";
  const O = window.Online;
  const st = pronState();
  const logged = !!O?.user;
  if (logged && PronState.uid !== O.user.uid) {
    PronState.uid = O.user.uid;
    root.innerHTML = `<div class="card ep-load"><p class="muted">Cargando la Electoporra…</p></div>`;
    PronState.mine = await O.pronGet();
    PronState.draft = null;
    PronState.leagues = await O.pronLeagues();
    PronState.xs = {};
    await Promise.all(PronState.leagues.map(async (l) => { PronState.xs[l.code] = await O.porraXList(l.code); }));
    if (!["pronostics", "electoporra"].includes(location.hash.slice(1).split("/")[0])) return;
  }
  const night = ["nit", "despres"].includes(espFase());
  if (night && !Esp.data && espResultsMode() !== "off" && !PronState.fetching) {
    PronState.fetching = true;
    espFetchResults().then(() => { PronState.fetching = false; if (/^#(pronostics|electoporra)/.test(location.hash)) renderPronostics(); });
  }
  const r = pronResults(night || Esp.cfg.pronRes ? Esp.data : null);
  if (logged) epSyncCoins(r);
  const avail = epAvail();
  const status = st === "aviat" ? "Se abre el 23 de noviembre" : st === "oberta" ? `Se cierra dentro de <b>${pronCountdown()}</b> (29N, 20:00)` : st === "off" ? "No disponible" : r?.final ? "Liquidada" : r ? "Cerrada · se resuelve en directo con el escrutinio" : "Cerrada · se resolverá con el escrutinio";
  root.innerHTML = `${espPreviewBar()}
    <header class="ep-hero">
      <div class="ep-hero-t"><p class="ep-k">29N · Elecciones generales</p><h1>Electoporra</h1>
        <p>Apuesta monedas en las preguntas que quieras, envía tu predicción de escaños y mira quién acierta más entre tus amigos. También podéis hacer apuestas vuestras.</p>
        <p class="ep-status">${status}</p></div>
      <div class="ep-wallet"><small>${st === "oberta" ? "Puedes apostar" : "Tus monedas"}</small><b data-ep-wallet>${fmt(st === "oberta" ? Math.max(0, avail - pronStaked(PronState.draft ? { b: PronState.draft } : PronState.mine)) : typeof Coins !== "undefined" ? Coins.balance() : 0)}</b><span>🪙 monedas</span>${st === "oberta" ? `<em>Incluye ${EP_BONUS} de regalo</em>` : ""}</div>
    </header>
    <nav class="ep-tabs" role="tablist">${[["apostes", "🎯 Apuestas"], ["escons", "🏛️ Escaños"], ["amics", "👥 Amigos"], ["general", "🏆 Ranking"]].map(([k, t]) => `<button type="button" role="tab" aria-selected="${PronState.tab === k}" data-ptab="${k}">${t}</button>`).join("")}</nav>
    <div data-pbody class="ep-body"></div>
    <p class="sim-fiction">Las monedas son una moneda inventada de Política en Joc: no se pueden comprar, no tienen ningún valor y no se pueden canjear por nada. Antes de las 20:00 del 29N nadie ve qué han apostado los demás.</p>`;
  espBind(root);
  $$("[data-ptab]", root).forEach((b) => b.addEventListener("click", () => { PronState.tab = b.dataset.ptab; renderPronostics(); }));
  const body = $("[data-pbody]", root);
  if (!logged) {
    body.innerHTML = `<div class="card ep-login"><h2>Entra para jugar</h2><p>Las apuestas y la predicción se guardan en tu cuenta para que puedas compararlas con tus amigos.</p><button class="btn primary lg" type="button" data-plogin>Entra</button></div>`;
    $("[data-plogin]", body).addEventListener("click", () => O?.accountClick?.());
    return;
  }
  if (PronState.tab === "apostes") pronMine(body, st, r);
  else if (PronState.tab === "escons") epSeats(body, st, r);
  else if (PronState.tab === "amics") pronLeagues(body, st, r);
  else pronGeneral(body, r);
}

// ---------- 1. Apostes ----------
function pronMine(body, st, r) {
  const open = st === "oberta";
  const D = (PronState.draft ||= JSON.parse(JSON.stringify(epBets(PronState.mine))));
  const avail = epAvail(), staked = PRON_M.reduce((a, m) => a + (D[m.id]?.a || 0), 0), left = avail - staked;
  const dirty = JSON.stringify(PRON_M.map((m) => D[m.id] || null)) !== JSON.stringify(PRON_M.map((m) => epBets(PronState.mine)[m.id] || null));
  const pots = Esp.cfg.pronPots || PronState.pots;
  body.innerHTML = `${st === "aviat" ? `<div class="card ep-soon"><b>Las apuestas se abren el 23 de noviembre.</b> Ya puedes mirar qué preguntas habrá.</div>` : ""}
    ${open ? `<p class="ep-how">Elige una respuesta y pon las monedas que quieras. Si aciertas, recuperas lo que has puesto y te toca parte de lo que han puesto quienes fallan, en proporción. No hace falta responderlas todas.</p>` : ""}
    <div class="ep-list">${PRON_M.map((m) => {
      const b = D[m.id];
      const out = r?.res?.[m.id];
      const q = out && b ? pronQ(m, b, out, pots) : null;
      return `<section class="card ep-m ${b ? "has" : ""}" data-m="${m.id}">
        <header><span class="ep-e" aria-hidden="true">${m.e}</span><h3>${esc(m.q)}</h3>${b?.a ? `<span class="ep-chip">🪙 ${fmt(b.a)}</span>` : ""}</header>
        ${m.hint ? `<p class="ep-hint">${esc(m.hint)}</p>` : ""}
        <div class="ep-opts">${m.opts.map(([o, t]) => `<button type="button" data-mo="${m.id}" data-o="${o}" aria-pressed="${b?.o === o}" class="${out === o ? "win" : ""}" ${open ? "" : "disabled"}>${esc(t)}${out === o ? ` <small>${r.final ? "✔" : "ahora"}</small>` : ""}</button>`).join("")}</div>
        ${open ? (b ? `<div class="ep-stake"><span>Pones</span><button type="button" data-st="${m.id}" data-d="-50" aria-label="50 menos">−50</button><button type="button" data-st="${m.id}" data-d="-10" aria-label="10 menos">−</button><input type="text" inputmode="numeric" data-sv="${m.id}" value="${b.a}" aria-label="Monedas"><button type="button" data-st="${m.id}" data-d="10" aria-label="10 más">+</button><button type="button" data-st="${m.id}" data-d="50" aria-label="50 más">+50</button><button type="button" class="ep-x" data-del="${m.id}" aria-label="Quita la apuesta">✕</button></div>` : "")
          : b ? `<p class="ep-res">Has puesto <b>${fmt(b.a)}</b> a «${esc(m.opts.find(([o]) => o === b.o)?.[1] || b.o)}»${q ? (q.lost ? ` · <span class="down">${r.final ? "fallada" : "ahora la fallas"}</span>` : q.refund ? " · nadie la ha acertado: la recuperas" : out === b.o ? ` · <span class="up">${r.final ? "acertada" : "ahora la aciertas"}${q.share ? `: +${fmt(Math.round(q.share))}` : q.share === null ? " (el bote se publica después de las 20:00)" : ""}</span>` : "") : ""}</p>` : `<p class="ep-res muted">No apostaste.</p>`}
      </section>`;
    }).join("")}</div>
    ${open ? `<div class="ep-bar ${left < 0 ? "bad" : ""}"><div><b>${pronCount({ b: D })} ${pronCount({ b: D }) === 1 ? "aposta" : "apuestas"} · ${epFmt(staked)}</b><small>${left < 0 ? `Te pasas de ${epFmt(-left)}` : !dirty ? (pronCount({ b: D }) ? "Guardado. Puedes cambiarlo hasta las 20:00 del 29N." : "Elige alguna respuesta para empezar.") : `Te quedan ${epFmt(left)}`}</small></div><button class="btn primary" type="button" data-psave ${!dirty || left < 0 || PronState.saving ? "disabled" : ""}>${PronState.saving ? "Guardando…" : "Guarda las apuestas"}</button></div>` : ""}`;
  if (!open) return;
  const redraw = () => { const y = scrollY; pronMine(body, st, r); epWallet(); scrollTo(0, y); };
  const free = (m) => avail - PRON_M.reduce((a, x) => a + (x.id === m ? 0 : D[x.id]?.a || 0), 0);
  $$("[data-mo]", body).forEach((btn) => btn.addEventListener("click", () => {
    const m = btn.dataset.mo, o = btn.dataset.o;
    if (D[m]?.o === o) delete D[m];
    else D[m] = { o, a: D[m]?.a || Math.max(EP_STEP, Math.min(50, Math.floor(free(m) / EP_STEP) * EP_STEP)) };
    Sfx.play("pick"); redraw();
  }));
  const setA = (m, v) => { if (!D[m]) return; D[m].a = Math.max(EP_STEP, Math.min(EP_MAX, Math.round(v / EP_STEP) * EP_STEP)); redraw(); };
  $$("[data-st]", body).forEach((b) => b.addEventListener("click", () => setA(b.dataset.st, (D[b.dataset.st]?.a || 0) + Number(b.dataset.d))));
  $$("[data-sv]", body).forEach((i) => i.addEventListener("change", () => setA(i.dataset.sv, Number(i.value.replace(/\D/g, "")) || 0)));
  $$("[data-del]", body).forEach((b) => b.addEventListener("click", () => { delete D[b.dataset.del]; redraw(); }));
  $("[data-psave]", body)?.addEventListener("click", async () => {
    if (espPreview()) return toast("Vista previa: las apuestas no se guardan");
    const b = {};
    PRON_M.forEach((m) => { if (D[m.id] && D[m.id].a > 0) b[m.id] = { o: D[m.id].o, a: D[m.id].a }; });
    PronState.saving = true; redraw();
    const doc = { b, ...(PronState.mine?.s ? { s: PronState.mine.s, sv: PronState.mine.sv || "" } : {}) };
    const ok = await window.Online.pronSave(doc);
    PronState.saving = false;
    if (ok) {
      const prev = pronStaked(PronState.mine);
      PronState.mine = { ...(PronState.mine || {}), ...doc }; PronState.draft = null;
      epSyncCoins(null);
      if (pronStaked(PronState.mine) > prev) window.Stats?.add("aposta", pronStaked(PronState.mine) - prev);
      Sfx.play("unlock"); toast("Apuestas guardadas"); Progress.unlock("pron-fet");
      if (typeof confetti === "function" && !prev) confetti(60);
    }
    renderPronostics();
  });
}
function epWallet() {
  const w = $("[data-ep-wallet]");
  if (w && pronState() !== "oberta") { w.textContent = fmt(typeof Coins !== "undefined" ? Coins.balance() : 0); return; }
  if (w) w.textContent = fmt(Math.max(0, epAvail() - PRON_M.reduce((a, m) => a + ((PronState.draft || epBets(PronState.mine))[m.id]?.a || 0), 0)));
}

// ---------- 2. Escons: la teva predicció ----------
function epSeats(body, st, r) {
  const open = st === "oberta";
  const f = typeof prdFinal === "function" ? (prdFinal() || (PRD.t ? { t: PRD.t, o: PRD.o, s: PRD.s } : null)) : null;
  const sent = PronState.mine?.s || null;
  const cur = f ? prdCompute(f.t, f.o || {}, f.s || {}) : null;
  const curS = cur ? Object.fromEntries(Object.entries(cur.seats).filter(([, n]) => n > 0)) : null;
  const same = sent && curS && JSON.stringify(Object.entries(sent).filter(([, n]) => n).sort()) === JSON.stringify(Object.entries(curS).sort());
  const real = r && Esp.data ? Esp.data.seats : null;
  const show = open ? (curS || sent) : sent;
  const hits = !open && sent && real ? epHits(sent, real) : null;
  const dd = show ? { seats: show, totalSeats: Object.values(show).reduce((a, n) => a + n, 0) } : null;
  const ids = show ? Object.keys(show).filter((k) => show[k]).sort((a, b) => show[b] - show[a]) : [];
  body.innerHTML = `<section class="card ep-seats">
      <h2>${open ? "Tu predicción de escaños" : "La predicción que enviaste"}</h2>
      <p class="ep-how">${open ? "Es la que haces en «Tu predicción». Envíala aquí y, con el escrutinio, verás cuántos escaños has acertado y cómo quedas entre tus amigos." : hits != null ? "" : sent ? "Cuando haya resultados, verás cuántos escaños has acertado." : "No enviaste ninguna predicción de escaños."}</p>
      ${hits != null ? `<div class="ep-hits"><b>${hits}</b><span>de 350 escaños acertados ${r.final ? "" : "(ahora mismo)"}</span><i style="--p:${(hits / 350) * 100}%"></i></div>` : ""}
      ${dd ? `<div class="ep-seats-g"><div>${nitHemi(dd, "").replace(/<small>[^<]*<\/small>/, "<small>diputats</small>")}</div>
        <ul class="ep-seat-l">${ids.map((k) => `<li style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))}<b>${show[k]}</b>${real ? `<small class="${(real[k] || 0) === show[k] ? "up" : ""}">${real[k] || 0}</small>` : ""}</li>`).join("")}</ul></div>` : `<p class="muted">Aún no has hecho ninguna predicción.</p>`}
      ${open ? `<div class="ep-seat-act">
        ${!cur ? `<a class="btn primary" href="#prediccio">🔮 Haz tu predicción</a>` : `<button class="btn primary" type="button" data-ep-send ${same ? "disabled" : ""}>${same ? "✓ Enviada" : sent ? "Envía la nueva versión" : "📨 Envíala a la Electoporra"}</button><a class="btn" href="#prediccio">✏️ Cámbiala</a>`}
        ${sent && !same ? `<p class="ep-warn">Has cambiado la predicción desde que la enviaste: vuelve a enviarla para que cuente la nueva.</p>` : ""}
      </div>` : ""}
    </section>`;
  $("[data-ep-send]", body)?.addEventListener("click", async (e) => {
    if (espPreview()) return toast("Vista previa: no se guarda");
    e.target.disabled = true;
    const doc = { b: epBets(PronState.mine), s: curS, sv: prdEncode(f.t, f.o || {}, PRD.name || "", f.s || {}).slice(0, 1500) };
    if (await window.Online.pronSave(doc)) { PronState.mine = { ...(PronState.mine || {}), ...doc }; Sfx.play("unlock"); toast("Predicción enviada a la Electoporra"); Progress.unlock("pron-fet"); }
    renderPronostics();
  });
}

// ---------- 3. Amics: classificació i apostes personalitzades ----------
async function pronLeagues(body, st, r) {
  const leagues = PronState.leagues || [];
  if (!leagues.length) {
    body.innerHTML = `<div class="card ep-empty"><h2>Juega con tus amigos</h2><p>La Electoporra se juega con las Ligas de amigos. Crea una (o únete a la de alguien con el código) y aquí veréis quién acierta más. También podréis hacer apuestas vuestras.</p><a class="btn primary" href="#ranking">Crea o únete a una liga</a></div>`;
    return;
  }
  const lg = leagues.find((l) => l.code === PronState.league) || leagues[0];
  PronState.league = lg.code;
  body.innerHTML = `<div class="card"><p class="muted">Cargando ${esc(lg.name)}…</p></div>`;
  const docs = await window.Online.pronMembers(lg.members);
  if (r && !Esp.cfg.pronPots && st !== "oberta" && !PronState.pots && Date.now() - PronState.allAt > 60000) {
    PronState.allAt = Date.now();
    const all = await window.Online.pronAll();
    if (all) PronState.pots = pronPotsFrom(all);
  }
  const pots = Esp.cfg.pronPots || PronState.pots;
  const closed = st !== "oberta" && st !== "aviat";
  const real = closed && r && Esp.data ? Esp.data.seats : null;
  const xs = PronState.xs[lg.code] || [];
  const byUid = Object.fromEntries(docs.map((p) => [p.uid, p]));
  const rows = lg.members.map((uid) => {
    const p = byUid[uid] || null;
    const xNet = xs.reduce((a, x) => { const b = x.bets?.[uid], g = b ? epXGot(x, uid) : null; return a + (b && g != null ? g - b.a : 0); }, 0);
    const bal = p && closed ? pronBalance(p, r, pots) : null;
    const name = p?.name || xs.map((x) => x.bets?.[uid]?.nm).find(Boolean) || (uid === window.Online.user.uid ? window.Online.profile?.handle : null) || "Jugador";
    return { uid, p, name, photo: p?.photo, n: pronCount(p), seats: !!p?.s, hits: real && p?.s ? epHits(p.s, real) : null, net: (bal && !bal.partial ? bal.net : 0) + xNet };
  });
  const S = PronState.sort;
  if (closed && real) rows.sort((a, b) => (S === "escons" ? (b.hits ?? -1) - (a.hits ?? -1) || b.net - a.net : b.net - a.net || (b.hits ?? -1) - (a.hits ?? -1)));
  else rows.sort((a, b) => b.n + (b.seats ? 5 : 0) - (a.n + (a.seats ? 5 : 0)));
  const av = (x) => (x.photo ? `<img src="${esc(x.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="ep-av">${esc((x.name || "?")[0])}</span>`);
  body.innerHTML = `${leagues.length > 1 ? `<div class="ep-lg-pick">${leagues.map((l) => `<button type="button" aria-pressed="${l.code === lg.code}" data-lg="${l.code}">${esc(l.name)} <small>${l.members.length}</small></button>`).join("")}</div>` : ""}
    <section class="card ep-lg">
      <header class="ep-lg-h"><div><h2>${esc(lg.name)}</h2><p class="muted">${closed ? (real ? (r.final ? "Resultado final." : "Clasificación provisional: se mueve con el escrutinio.") : "Ya está cerrado. La clasificación llegará con el escrutinio.") : "Hasta las 20:00 del 29N solo se ve quién ya ha jugado, no qué ha apostado."}</p></div><a class="linklike" href="#ranking">Gestiona las ligas →</a></header>
      ${closed && real ? `<div class="ep-sort" role="group" aria-label="Ordenar por"><button type="button" aria-pressed="${S === "escons"}" data-sort="escons">🎯 Escaños acertados</button><button type="button" aria-pressed="${S === "monedes"}" data-sort="monedes">🪙 Monedas ganadas</button></div>` : ""}
      <ol class="ep-rank">${rows.map((x, i) => `<li class="${x.uid === window.Online.user.uid ? "me" : ""}" style="--i:${i}">
        <span class="ep-pos">${closed && real ? (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) : ""}</span>${av(x)}
        <span class="ep-nm"><b>${esc(x.name)}</b><small>${closed && real ? `${x.hits != null ? `${x.hits} escaños acertados` : "Sin predicción de escaños"} · ${x.net >= 0 ? "+" : "−"}${fmt(Math.abs(x.net))} monedas` : `${x.n ? `${x.n} ${x.n === 1 ? "aposta" : "apuestas"}` : "Ninguna apuesta"}${x.seats ? " · predicción enviada ✓" : ""}`}</small></span>
        <b class="ep-pts">${closed && real ? (S === "escons" ? (x.hits ?? "—") : `${x.net >= 0 ? "+" : "−"}${fmt(Math.abs(x.net))}`) : x.n || x.seats ? "✔" : "—"}</b>
      </li>`).join("")}</ol>
    </section>
    <section class="card ep-xs">
      <header class="ep-lg-h"><div><h2>Apuestas del grupo</h2><p class="muted">Las crea cualquiera de la liga. Gana quien acierta (o quien se acerca más al número) y se lleva las monedas de los demás en proporción a lo que ha puesto. La resuelve quien la ha creado.</p></div>
        <button class="btn sm primary" type="button" data-xnew>${PronState.xform ? "Cierra" : "＋ Nueva apuesta"}</button></header>
      ${PronState.xform ? epXFormHtml() : ""}
      <div class="ep-xlist">${xs.length ? xs.sort((a, b) => (a.res == null) - (b.res == null) || b.t - a.t).map((x) => epXHtml(x)).join("") : `<p class="muted">Aún no hay ninguna. Por ejemplo: «¿Cuántos escaños sacará Alhora?» o «¿A qué hora sabremos quién gana?».</p>`}</div>
    </section>`;
  $$("[data-lg]", body).forEach((b) => b.addEventListener("click", () => { PronState.league = b.dataset.lg; pronLeagues(body, st, r); }));
  $$("[data-sort]", body).forEach((b) => b.addEventListener("click", () => { PronState.sort = b.dataset.sort; pronLeagues(body, st, r); }));
  $("[data-xnew]", body).addEventListener("click", () => { PronState.xform = !PronState.xform; pronLeagues(body, st, r); });
  epXBind(body, lg, () => pronLeagues(body, st, r));
}
const EP_DEF_CLOSE = PRON_CLOSE;
const epDt = (ms) => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
function epXFormHtml() {
  return `<form class="ep-xform" data-xform>
    <label>Pregunta<input type="text" name="q" maxlength="140" required placeholder="Por ejemplo: ¿cuántos escaños sacará Alhora?"></label>
    <div class="ep-xkind" role="radiogroup" aria-label="Tipo"><label><input type="radio" name="kind" value="opt" checked><span>Con opciones</span></label><label><input type="radio" name="kind" value="num"><span>Con un número <small>(gana quien se acerca más)</small></span></label></div>
    <div class="ep-xopts" data-xopts>${[0, 1, 2, 3].map((i) => `<input type="text" name="o${i}" maxlength="40" placeholder="Opción ${i + 1}${i > 1 ? " (si quieres)" : ""}">`).join("")}</div>
    <label>Se cierra<input type="datetime-local" name="close" value="${epDt(Math.max(EP_DEF_CLOSE, Date.now() + 3600e3))}" min="${epDt(Date.now() + 600e3)}"></label>
    <button class="btn primary" type="submit">Crea la apuesta</button>
  </form>`;
}
function epXHtml(x) {
  const me = window.Online.user.uid, mine = x.bets?.[me], open = Date.now() < x.close && x.res == null;
  const bs = Object.entries(x.bets || {}), pot = bs.reduce((a, [, b]) => a + b.a, 0), seeAll = !open || Date.now() >= PRON_CLOSE;
  const w = epXWinners(x), got = mine ? epXGot(x, me) : null;
  const optTot = (i) => bs.filter(([, b]) => b.o === i).reduce((a, [, b]) => a + b.a, 0);
  return `<article class="ep-x ${open ? "" : "closed"}" data-x="${x.id}">
    <header><h3>${esc(x.q)}</h3><span class="ep-chip">🪙 ${fmt(pot)}</span></header>
    <p class="ep-x-m">De ${esc(x.byName || "alguien")} · ${bs.length} ${bs.length === 1 ? "persona" : "personas"} · ${open ? `se cierra ${new Date(x.close).toLocaleString(typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es-ES" : "es-ES", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : x.res == null ? "cerrada: falta que la resuelva" : `resuelta: ${x.kind === "opt" ? esc(x.opts[x.res] || "") : fmt(x.res)}`}</p>
    ${x.kind === "opt" ? `<div class="ep-opts">${x.opts.map((o, i) => `<button type="button" data-xo="${i}" aria-pressed="${mine?.o === i}" class="${x.res === i ? "win" : ""}" ${open ? "" : "disabled"}>${esc(o)}${seeAll && pot ? `<small>${Math.round((optTot(i) / pot) * 100)} %</small>` : ""}</button>`).join("")}</div>`
      : `<div class="ep-xnum">${open ? `<label>Tu número<input type="number" step="any" data-xn value="${mine ? mine.n : ""}" placeholder="?"></label>` : ""}${seeAll ? `<ul>${bs.sort((a, b) => a[1].n - b[1].n).map(([u, b]) => `<li class="${w?.has(u) ? "win" : ""}">${esc(b.nm || "")}: <b>${fmt(b.n)}</b></li>`).join("")}</ul>` : ""}</div>`}
    ${open ? `<div class="ep-stake"><span>Pones</span><button type="button" data-xd="-10" aria-label="10 menos">−</button><input type="text" inputmode="numeric" data-xa value="${mine?.a || 20}" aria-label="Monedas"><button type="button" data-xd="10" aria-label="10 más">+</button><button class="btn sm primary" type="button" data-xbet>${mine ? "Actualiza" : "Apuesta"}</button>${mine ? `<button class="btn sm ghost" type="button" data-xun>Retírala</button>` : ""}</div>` : ""}
    ${mine && !open ? `<p class="ep-res">${got == null ? `Tienes ${epFmt(mine.a)} en juego.` : got > mine.a ? `<span class="up">¡Ganas ${epFmt(got - mine.a)}!</span>` : got === mine.a ? "Recuperas lo que pusiste." : `<span class="down">Pierdes ${epFmt(mine.a)}.</span>`}</p>` : ""}
    ${!open && x.res == null && x.by === me ? `<div class="ep-xres"><b>¿Cómo ha acabado?</b>${x.kind === "opt" ? `<select data-xr>${x.opts.map((o, i) => `<option value="${i}">${esc(o)}</option>`).join("")}</select>` : `<input type="number" step="any" data-xr placeholder="El número que ha salido">`}<button class="btn sm primary" type="button" data-xresolve>Resuélvela</button></div>` : ""}
    ${x.by === me && bs.every(([u]) => u === me) ? `<button class="linkish ep-xdel" type="button" data-xdel>Bórrala</button>` : ""}
  </article>`;
}
function epXBind(body, lg, redraw) {
  const O = window.Online, me = O.user.uid;
  const reload = async () => { PronState.xs[lg.code] = await O.porraXList(lg.code); epSyncCoins(pronResults(Esp.data)); epWallet(); redraw(); };
  const form = $("[data-xform]", body);
  form?.addEventListener("change", () => { $("[data-xopts]", form).hidden = form.kind.value === "num"; });
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = form.q.value.trim(), kind = form.kind.value;
    const opts = kind === "opt" ? [0, 1, 2, 3].map((i) => form[`o${i}`].value.trim()).filter(Boolean) : [];
    const close = new Date(form.close.value).getTime();
    if (q.length < 3) return toast("Escribe la pregunta");
    if (kind === "opt" && opts.length < 2) return toast("Hacen falta al menos dos opciones");
    if (!(close > Date.now() + 60e3)) return toast("La hora de cierre tiene que ser más adelante");
    if (close > Date.now() + 29 * 864e5) return toast("Como mucho, dentro de 29 días");
    if (espPreview()) return toast("Vista previa: no se guarda");
    if (await O.porraXCreate({ lg: lg.code, q, kind, opts, close })) { PronState.xform = false; toast("Apuesta creada: ya podéis jugar"); Sfx.play("unlock"); reload(); }
  });
  $$("[data-x]", body).forEach((card) => {
    const id = card.dataset.x, x = (PronState.xs[lg.code] || []).find((y) => y.id === id);
    if (!x) return;
    let pick = x.bets?.[me]?.o;
    $$("[data-xo]", card).forEach((b) => b.addEventListener("click", () => { pick = Number(b.dataset.xo); $$("[data-xo]", card).forEach((y) => y.setAttribute("aria-pressed", String(y === b))); Sfx.play("pick"); }));
    const amt = $("[data-xa]", card);
    $$("[data-xd]", card).forEach((b) => b.addEventListener("click", () => { amt.value = Math.max(EP_STEP, Math.min(EP_XMAX, (Number(amt.value) || 0) + Number(b.dataset.xd))); }));
    $("[data-xbet]", card)?.addEventListener("click", async () => {
      const a = Math.max(EP_STEP, Math.min(EP_XMAX, Math.round((Number(String(amt.value).replace(/\D/g, "")) || 0) / EP_STEP) * EP_STEP));
      const prev = x.bets?.[me]?.a || 0;
      if (a - prev > (typeof Coins !== "undefined" ? Coins.epBalance() : 0)) return toast("No tienes suficientes monedas");
      const bet = { a, nm: O.profile?.handle || "Jugador" };
      if (x.kind === "opt") { if (pick == null) return toast("Elige una opción"); bet.o = pick; }
      else { const n = Number($("[data-xn]", card).value); if (!Number.isFinite(n) || $("[data-xn]", card).value === "") return toast("Escribe tu número"); bet.n = n; }
      if (espPreview()) return toast("Vista previa: no se guarda");
      if (await O.porraXBet(id, bet)) { toast("Apuesta hecha"); Sfx.play("unlock"); reload(); }
    });
    $("[data-xun]", card)?.addEventListener("click", async () => { if (await O.porraXBet(id, null)) { toast("Apuesta retirada: te devolvemos las monedas"); reload(); } });
    $("[data-xresolve]", card)?.addEventListener("click", async () => {
      const v = $("[data-xr]", card).value;
      if (v === "") return toast("Indica cómo ha acabado");
      const res = x.kind === "opt" ? Number(v) : Number(v);
      if (!Number.isFinite(res)) return;
      if (!confirm("¿Seguro? Se repartirán las monedas según este resultado.")) return;
      if (await O.porraXResolve(id, res)) { toast("Resuelta: ya se han repartido las monedas"); if (typeof confetti === "function") confetti(50); reload(); }
    });
    $("[data-xdel]", card)?.addEventListener("click", async () => { if (confirm("¿Quieres borrar esta apuesta?") && (await O.porraXDelete(id))) reload(); });
  });
}

// ---------- 4. Rànquing general ----------
function pronGeneral(body, r) {
  const rank = Esp.cfg.pronRank || [];
  if (!rank.length) {
    body.innerHTML = `<div class="card ep-empty"><h2>Ranking general</h2><p>La clasificación de todos se publica cuando acabe el escrutinio y se liquiden las apuestas. ¡Hasta entonces, juega con tus amigos!</p></div>`;
    return;
  }
  const meUid = window.Online?.user?.uid;
  body.innerHTML = `<section class="card ep-lg"><h2>Ranking general</h2><p class="muted">Monedas que devuelve a cada uno la Electoporra.</p>
    <ol class="ep-rank">${rank.map((p, i) => `<li class="${p.uid === meUid ? "me" : ""}" style="--i:${i}"><span class="ep-pos">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>${p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="ep-av">${esc((p.name || "?")[0])}</span>`}<span class="ep-nm"><b>${esc(p.name || "Jugador")}</b></span><b class="ep-pts">${fmt(p.fitxes)}</b></li>`).join("")}</ol></section>`;
}

// Targeta per a la columna de la nit electoral
function pronNitCard(d) {
  const st = pronState();
  if (st === "off" || st === "aviat") return "";
  const mine = PronState.mine;
  if (!window.Online?.user || !mine) return `<section class="card pron-nit"><h2 class="section-title sm">🎰 Electoporra</h2><p class="muted">${st === "oberta" ? "¡Apuesta monedas y envía tu predicción antes de las 20:00!" : "Mira cómo van tus amigos."}</p><a class="btn" href="#electoporra">${st === "oberta" ? "Juega a la Electoporra" : "Abre la Electoporra"}</a></section>`;
  const r = pronResults(d);
  const b = pronBalance(mine, r);
  const hits = mine.s && d ? epHits(mine.s, d.seats) : null;
  return `<section class="card pron-nit"><h2 class="section-title sm">🎰 Tu Electoporra</h2>
    ${hits != null ? `<p class="pron-nit-n"><b>${hits}</b> escaños acertados ${r?.final ? "" : "ahora mismo"}</p>` : ""}
    <p class="muted">${pronCount(mine)} apuestas · ${r && !b.partial ? `${b.net >= 0 ? "+" : "−"}${fmt(Math.abs(b.net))} monedas` : `${fmt(b.staked)} monedas en juego`}</p>
    <a class="btn" href="#electoporra/amics">Mira a tus amigos</a></section>`;
}

ACHIEVEMENTS.push({ id: "pron-fet", name: "Electoporrista", desc: "Juega a la Electoporra del 29N." });
