// Lliga de pronòstics del 29N (#pronostics). Cada jugador té 1.000 fitxes (moneda inventada de l'app, sense cap valor:
// no es poden comprar ni bescanviar) i les ha de repartir totes entre almenys 5 preguntes. A cada pregunta, les fitxes
// dels qui l'han fallada es reparteixen a parts iguals entre els qui l'han encertada (que recuperen les seves); si
// ningú l'encerta, tothom recupera les seves. L'app no fixa quotes ni opina sobre qui guanyarà. Es juga amb les
// Lligues d'amics; abans del tancament dels col·legis no es mostra què pronostica ningú (llei d'enquestes).
// Els pots de cada pregunta (quants jugadors i fitxes hi ha a cada opció) es publiquen des de la Sala de control
// després de les 20:00 del 29N.
// Les fitxes que es guanyen es queden per a les properes eleccions (municipals del 2027).
// A sobre de les 1.000 fitxes, cadascú hi pot afegir monedes de joc (botiga.js): es converteixen en fitxes (camp «extra»)
// i ja no tornen al moneder.
// Dades: Firestore pron/{uid}; les regles limiten les fitxes i tanquen els canvis a les 20:00 del 29N.

const PRON_OPEN = Date.UTC(2026, 10, 22, 23); // 23N 00:00
const PRON_CLOSE = ESP_T.nit;                  // 29N 20:00
const PRON_BASE = 1000;
const PRON_STEP = 10;
const PRON_MIN_Q = 5;
const PRON_EXTRA_MAX = 2000;
const PRON_EXTRA_STEP = 50;
const pronBudget = (b) => PRON_BASE + (b?.extra || 0);
const PRON_INV23 = ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"]; // investidura del 2023
const pronRange = (party, cuts) => ({
  opts: [[`a`, `Menys de ${cuts[0]}`], [`b`, `De ${cuts[0]} a ${cuts[1] - 1}`], [`c`, `De ${cuts[1]} a ${cuts[2] - 1}`], [`d`, `${cuts[2]} o més`]],
  res: (d) => { const n = d.seats[party] || 0; return n < cuts[0] ? "a" : n < cuts[1] ? "b" : n < cuts[2] ? "c" : "d"; },
});
const PRON_M = [
  { id: "m1", q: "Qui serà la primera força?", opts: [["pp", "PP"], ["psoe", "PSOE"], ["vox", "Vox"], ["altre", "Un altre partit"]], res: (d) => (["pp", "psoe", "vox"].includes(d.ranking[0]) ? d.ranking[0] : "altre") },
  { id: "m2", q: "Quants escons traurà el PP?", ...pronRange("pp", [120, 140, 160]) },
  { id: "m3", q: "Quants escons traurà el PSOE?", ...pronRange("psoe", [100, 120, 140]) },
  { id: "m4", q: "Quants escons traurà Vox?", ...pronRange("vox", [30, 45, 60]) },
  { id: "m8", q: "Quants escons traurà Frente Amplio?", ...pronRange("fa", [15, 25, 35]) },
  { id: "m5", q: "La participació serà més alta o més baixa que el 2023 (66,6 %)?", opts: [["alta", "Més alta"], ["baixa", "Més baixa"]], res: (d) => ((d.participacio || 0) >= 66.6 ? "alta" : "baixa") },
  { id: "m6", q: "PP i Vox sumaran majoria absoluta (176)?", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.pp || 0) + (d.seats.vox || 0) >= 176 ? "si" : "no") },
  { id: "m7", q: "Els partits que van investir Sánchez el 2023 tornaran a sumar 176?", hint: "PSOE, FA, Podemos, ERC, Junts, EH Bildu, PNV, BNG i CC", opts: [["si", "Sí"], ["no", "No"]], res: (d) => (PRON_INV23.reduce((a, k) => a + (d.seats[k] || 0), 0) >= 176 ? "si" : "no") },
];
const PronState = { mine: null, draft: null, loaded: false, tab: "meus", league: null, members: null, saving: false };

function pronState() {
  const m = Esp.cfg.pron || "auto";
  const t = espNow();
  if (m === "off") return "off";
  if (m === "tancada" || t >= PRON_CLOSE) return "tancada";
  if (m === "oberta") return "oberta";
  return t < PRON_OPEN ? "aviat" : "oberta";
}
// Resultat de cada mercat: el liquidat a la Sala de control o, mentre s'escruta, el provisional
function pronResults(d = Esp.data) {
  if (Esp.cfg.pronRes) return { res: Esp.cfg.pronRes, final: true };
  if (!d) return null;
  return { res: Object.fromEntries(PRON_M.map((m) => [m.id, m.res(d)])), final: false };
}
const pronStaked = (b) => PRON_M.reduce((a, m) => a + (b?.[m.id]?.a || 0), 0);
const pronCount = (b) => PRON_M.filter((m) => b?.[m.id]?.a > 0).length;
// Pots de cada pregunta: pots[m][opció] = { n: jugadors, a: fitxes }
function pronPotsFrom(all) {
  const pots = {};
  PRON_M.forEach((m) => { pots[m.id] = {}; m.opts.forEach(([o]) => { pots[m.id][o] = { n: 0, a: 0 }; }); });
  all.forEach((pl) => PRON_M.forEach((m) => { const b = pl[m.id]; if (b && pots[m.id][b.o]) { pots[m.id][b.o].n++; pots[m.id][b.o].a += b.a; } }));
  return pots;
}
// Què et dona una pregunta: si l'encertes, el que hi has posat més la teva part del pot dels qui l'han fallada
function pronQ(m, b, win, pots) {
  if (!b) return { got: 0, share: 0 };
  const pm = pots?.[m.id];
  if (b.o !== win) return { got: pm && pm[win] && pm[win].n === 0 ? b.a : 0, share: 0, lost: !(pm && pm[win] && pm[win].n === 0) };
  if (!pm || !pm[win]) return { got: b.a, share: null };
  const losers = Object.entries(pm).reduce((a, [o, v]) => a + (o === win ? 0 : v.a), 0);
  const share = pm[win].n ? losers / pm[win].n : 0;
  return { got: b.a + share, share };
}
function pronBalance(b, r, pots = Esp.cfg.pronPots) {
  const staked = pronStaked(b);
  if (!r) return { staked, won: null, total: pronBudget(b), partial: true };
  let total = pronBudget(b) - staked, partial = !pots;
  PRON_M.forEach((m) => { total += pronQ(m, b?.[m.id], r.res[m.id], pots).got; });
  return { staked, won: total - (pronBudget(b) - staked), total: Math.round(total), partial };
}
const pronFmt = (n) => `${fmt(Math.round(n))} fitxes`;
function pronCountdown() {
  const s = Math.max(0, Math.round((PRON_CLOSE - espNow()) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}

async function renderPronostics(arg) {
  const root = $("#pron-page");
  if (!root) return;
  if (arg && ["meus", "lligues", "general"].includes(arg)) PronState.tab = arg;
  const O = window.Online;
  const st = pronState();
  const logged = !!O?.user;
  if (logged && PronState.uid !== O.user.uid) {
    PronState.uid = O.user.uid;
    PronState.mine = await O.pronGet();
    PronState.draft = null;
    if (PronState.mine && typeof Coins !== "undefined") Coins.setBet(PronState.mine.extra || 0);
    if (location.hash.slice(1).split("/")[0] !== "pronostics") return;
  }
  const night = ["nit", "despres"].includes(espFase());
  if (night && !Esp.data && espResultsMode() !== "off" && !PronState.fetching) {
    PronState.fetching = true;
    espFetchResults().then(() => { PronState.fetching = false; if (location.hash.startsWith("#pronostics")) renderPronostics(); });
  }
  const r = pronResults(night || Esp.cfg.pronRes ? Esp.data : null);
  const mine = PronState.mine || {};
  const bal = pronBalance(mine, st === "oberta" ? null : r);
  const status = st === "aviat" ? `S'obre el 23 de novembre` : st === "oberta" ? `Es tanca d'aquí a <b>${pronCountdown()}</b> (29N, 20:00)` : st === "off" ? "No disponible" : r?.final ? "Liquidada" : r ? "Tancada · es resol en directe amb l'escrutini" : "Tancada · es resoldrà amb l'escrutini";
  root.innerHTML = `${espPreviewBar()}
    <header class="pron-hero">
      <div><h1>Lliga de pronòstics</h1>
        <p>Reparteix les teves <b>${fmt(PRON_BASE)} fitxes</b> (i, si vols, les monedes que hagis guanyat jugant) entre almenys ${PRON_MIN_Q} preguntes. A cada pregunta, les fitxes dels qui fallen es reparteixen a parts iguals entre els qui encerten. Posa'n més on estiguis més segur!</p>
        <p class="pron-status">${status}</p></div>
      <div class="pron-wallet"><small>${st === "oberta" || st === "aviat" ? "Et queden per repartir" : !r ? "En joc" : r.final ? "Les teves fitxes" : bal.partial ? "Recuperaries (sense el pot)" : "Ara mateix tindries"}</small><b>${fmt(st === "oberta" || st === "aviat" ? pronBudget(PronState.draft || mine) - pronStaked(PronState.draft || mine) : bal.total)}</b><span>fitxes</span></div>
    </header>
    <nav class="pron-tabs">${[["meus", "Els meus pronòstics"], ["lligues", "Les meves lligues"], ["general", "Rànquing general"]].map(([k, t]) => `<button type="button" class="${PronState.tab === k ? "on" : ""}" data-ptab="${k}">${t}</button>`).join("")}</nav>
    <div data-pbody></div>
    <p class="sim-fiction">Les fitxes són una moneda inventada de Política en Joc: no es poden comprar, no tenen cap valor i no es poden bescanviar per res. Les que guanyis es guarden per a les properes eleccions.</p>`;
  espBind(root);
  $$("[data-ptab]", root).forEach((b) => b.addEventListener("click", () => { PronState.tab = b.dataset.ptab; renderPronostics(); }));
  const body = $("[data-pbody]", root);
  if (!logged) {
    body.innerHTML = `<div class="card pron-login"><h2 class="section-title sm">Entra per jugar</h2><p>Els pronòstics es guarden al teu compte perquè els puguis comparar amb les teves lligues d'amics.</p><button class="btn primary lg" type="button" data-plogin>Entra</button></div>`;
    $("[data-plogin]", body).addEventListener("click", () => O?.accountClick?.());
    return;
  }
  if (PronState.tab === "meus") pronMine(body, st, r);
  else if (PronState.tab === "lligues") pronLeagues(body, st, r);
  else pronGeneral(body, r);
}

function pronMine(body, st, r) {
  const open = st === "oberta";
  const D = (PronState.draft ||= JSON.parse(JSON.stringify({ ...Object.fromEntries(PRON_M.map((m) => [m.id, PronState.mine?.[m.id] || null])), extra: PronState.mine?.extra || 0 })));
  const left = pronBudget(D) - pronStaked(D);
  const dirty = JSON.stringify([...PRON_M.map((m) => D[m.id] || null), D.extra || 0]) !== JSON.stringify([...PRON_M.map((m) => PronState.mine?.[m.id] || null), PronState.mine?.extra || 0]);
  const coins = typeof Coins !== "undefined" ? Coins.balance() + (PronState.mine?.extra || 0) : 0;
  const maxExtra = Math.min(PRON_EXTRA_MAX, Math.floor(coins / PRON_EXTRA_STEP) * PRON_EXTRA_STEP);
  body.innerHTML = `${st === "aviat" ? `<div class="card pron-soon"><b>Els mercats s'obren el 23 de novembre.</b> Ja pots fer-te una idea dels pronòstics que hi haurà.</div>` : ""}
    ${open && typeof Coins !== "undefined" ? `<section class="card pron-extra">
      <div><b>🪙 Afegeix-hi monedes</b><p>${maxExtra || D.extra ? `${D.extra ? `Hi afegeixes ${fmt(D.extra)} monedes; en pots afegir fins a ${fmt(maxExtra)}.` : `Tens ${fmt(coins)} monedes de joc.`} Les que hi afegeixis es converteixen en fitxes d'aquesta Lliga: si encertes, les multiplicaràs, però no tornen al moneder.` : `Juga als minijocs per guanyar monedes i afegir-les aquí (en calen ${PRON_EXTRA_STEP}).`} <a href="#botiga">Què són?</a></p></div>
      ${maxExtra || D.extra ? `<div class="pron-stake"><span>Hi afegeixes</span><button type="button" data-ex="-${PRON_EXTRA_STEP}" aria-label="Menys">−</button><input type="text" inputmode="numeric" data-exv value="${D.extra || 0}" aria-label="Monedes"><button type="button" data-ex="${PRON_EXTRA_STEP}" aria-label="Més">+</button></div>` : ""}
    </section>` : !open && PronState.mine?.extra ? `<p class="muted">Hi vas afegir ${fmt(PronState.mine.extra)} monedes de joc.</p>` : ""}
    <div class="pron-list">${PRON_M.map((m) => {
      const b = D[m.id];
      const out = r?.res?.[m.id];
      const q = out && b ? pronQ(m, b, out, Esp.cfg.pronPots) : null;
      return `<section class="card pron-m ${b ? "has" : ""}">
        <header><h3>${esc(m.q)}</h3><span class="pron-x">${b?.a ? fmt(b.a) : "Pot"}</span></header>
        ${m.hint ? `<p class="muted pron-hint">${esc(m.hint)}</p>` : ""}
        <div class="pron-opts">${m.opts.map(([o, t]) => `<button type="button" data-mo="${m.id}" data-o="${o}" class="${b?.o === o ? "on" : ""} ${out === o ? "win" : ""}" ${open ? "" : "disabled"}>${esc(t)}${out === o ? ` <small>${r.final ? "✔" : "ara"}</small>` : ""}</button>`).join("")}</div>
        ${open ? `<div class="pron-stake ${b ? "" : "off"}"><span>Hi poses</span><button type="button" data-st="${m.id}" data-d="-50" aria-label="Menys">−</button><input type="text" inputmode="numeric" data-sv="${m.id}" value="${b?.a || 0}" aria-label="Fitxes"><button type="button" data-st="${m.id}" data-d="50" aria-label="Més">+</button><span class="pron-ret">Si l'encertes, les recuperes i et toca part del pot</span></div>`
          : b ? `<p class="pron-res">Hi has posat <b>${fmt(b.a)}</b> a «${esc(m.opts.find(([o]) => o === b.o)?.[1] || b.o)}»${q ? (out === b.o ? ` · <span class="up">${r.final ? "encertada" : "ara l'encertes"}${q.share ? `: +${fmt(Math.round(q.share))} del pot` : q.share === null ? " (el pot es publica a les 20:00)" : ""}</span>` : q.lost ? ` · <span class="down">${r.final ? "fallada" : "ara la falles"}</span>` : ` · ningú l'ha encertada: la recuperes`) : ""}</p>` : `<p class="muted pron-res">No hi vas posar fitxes.</p>`}
      </section>`;
    }).join("")}</div>
    ${open ? (() => {
      const n = pronCount(D), ok = left === 0 && n >= PRON_MIN_Q;
      const need = n < PRON_MIN_Q ? `Respon almenys ${PRON_MIN_Q} preguntes (en tens ${n})` : left > 0 ? `Reparteix-les totes: en queden ${fmt(left)}` : left < 0 ? `Et passes de ${fmt(-left)} fitxes` : dirty ? "Tot a punt: desa-ho" : "Desat. Pots canviar-ho fins a les 20:00 del 29N.";
      return `<div class="pron-bar ${left < 0 ? "bad" : ok ? "ok" : ""}"><div><b>${n}/${PRON_M.length} preguntes · ${fmt(pronBudget(D) - left)} de ${fmt(pronBudget(D))} fitxes</b><small>${need}</small></div><button class="btn primary" type="button" data-psave ${!dirty || !ok || PronState.saving ? "disabled" : ""}>${PronState.saving ? "Desant…" : "Desa"}</button></div>`;
    })() : ""}`;
  if (!open) return;
  const redraw = () => pronMine(body, st, r);
  $$("[data-mo]", body).forEach((btn) => btn.addEventListener("click", () => {
    const m = btn.dataset.mo, o = btn.dataset.o;
    if (D[m]?.o === o) D[m] = null;
    else D[m] = { o, a: D[m]?.a || Math.min(Math.max(PRON_STEP, Math.round((pronBudget(D) - pronStaked(D)) / 2 / PRON_STEP) * PRON_STEP), Math.max(0, pronBudget(D) - pronStaked(D))) || PRON_STEP };
    Sfx.play("pick"); redraw(); pronWalletSync();
  }));
  const setX = (v) => { D.extra = Math.max(0, Math.min(maxExtra, Math.round(v / PRON_EXTRA_STEP) * PRON_EXTRA_STEP)); Sfx.play("pick"); redraw(); pronWalletSync(); };
  $$("[data-ex]", body).forEach((b) => b.addEventListener("click", () => setX((D.extra || 0) + Number(b.dataset.ex))));
  $("[data-exv]", body)?.addEventListener("change", (e) => setX(Number(e.target.value.replace(/\D/g, "")) || 0));
  const setA = (m, v) => { if (!D[m]) return; const free = pronBudget(D) - pronStaked(D) + D[m].a; D[m].a = Math.max(PRON_STEP, Math.min(free, Math.round(v / PRON_STEP) * PRON_STEP)); redraw(); pronWalletSync(); };
  $$("[data-st]", body).forEach((b) => b.addEventListener("click", () => setA(b.dataset.st, (D[b.dataset.st]?.a || 0) + Number(b.dataset.d))));
  $$("[data-sv]", body).forEach((i) => i.addEventListener("change", () => setA(i.dataset.sv, Number(i.value.replace(/\D/g, "")) || 0)));
  $("[data-psave]", body)?.addEventListener("click", async () => {
    if (espPreview()) return toast("Vista prèvia: els pronòstics no es desen");
    const bets = {};
    PRON_M.forEach((m) => { if (D[m.id] && D[m.id].a > 0) bets[m.id] = { o: D[m.id].o, a: D[m.id].a }; });
    if (D.extra > 0) bets.extra = D.extra;
    PronState.saving = true; redraw();
    const ok = await window.Online.pronSave(bets);
    PronState.saving = false;
    if (ok) {
      const prevExtra = PronState.mine?.extra || 0;
      if (typeof Coins !== "undefined") Coins.setBet(D.extra || 0);
      if ((D.extra || 0) > prevExtra) window.Stats?.add("aposta", D.extra - prevExtra);
    }
    if (ok) { PronState.mine = { ...bets }; PronState.draft = null; Sfx.play("unlock"); toast("Pronòstics desats"); Progress.unlock("pron-fet"); }
    else PronState.draft = D;
    renderPronostics();
  });
}
function pronWalletSync() {
  const w = $(".pron-wallet b");
  if (w && PronState.draft) w.textContent = fmt(pronBudget(PronState.draft) - pronStaked(PronState.draft));
}

async function pronLeagues(body, st, r) {
  body.innerHTML = `<div class="card"><p class="muted">Carregant les teves lligues…</p></div>`;
  const leagues = await window.Online.pronLeagues();
  if (!leagues.length) {
    body.innerHTML = `<div class="card pron-empty"><h2 class="section-title sm">Juga amb els teus amics</h2><p>Les lligues de pronòstics són les mateixes Lligues d'amics del repte diari. Crea'n una o uneix-te amb un codi.</p><a class="btn primary" href="#ranking">Crea o uneix-te a una lliga</a></div>`;
    return;
  }
  const lg = leagues.find((l) => l.code === PronState.league) || leagues[0];
  PronState.league = lg.code;
  const docs = await window.Online.pronMembers(lg.members);
  const closed = st !== "oberta" && st !== "aviat";
  const rows = docs.map((p) => ({ p, b: pronBalance(p, closed ? r : null), n: PRON_M.filter((m) => p[m.id]).length }));
  if (closed) rows.sort((a, b) => b.b.total - a.b.total);
  else rows.sort((a, b) => b.n - a.n);
  const missing = lg.members.length - docs.length;
  body.innerHTML = `<div class="pron-lg-pick">${leagues.map((l) => `<button type="button" class="${l.code === lg.code ? "on" : ""}" data-lg="${l.code}">${esc(l.name)} <small>${l.members.length}</small></button>`).join("")}<a class="linklike" href="#ranking">Gestiona les lligues →</a></div>
    <section class="card pron-lg">
      <h2 class="section-title sm">${esc(lg.name)}</h2>
      <p class="muted">${closed ? (r ? (r.final ? "Resultat final de la lliga." : "Classificació provisional: es mou amb l'escrutini.") : "Els pronòstics ja estan tancats. La classificació arribarà amb l'escrutini.") : "Fins que tanquin els col·legis no es veu què ha pronosticat ningú: només qui ja ha jugat."}</p>
      <ol class="pron-rank">${rows.map(({ p, b, n }, i) => `<li class="${p.uid === window.Online.user.uid ? "me" : ""}" data-user="${p.uid}">
        <span class="pron-pos">${closed && r ? i + 1 : ""}</span>
        ${p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="pron-av">${esc((p.name || "?")[0])}</span>`}
        <span class="pron-nm"><b>${esc(p.name || "Jugador")}</b><small>${closed ? PRON_M.filter((m) => p[m.id]).map((m) => `${esc(m.opts.find(([o]) => o === p[m.id].o)?.[1] || "")} (${fmt(p[m.id].a)})`).slice(0, 3).join(" · ") + (n > 3 ? " …" : "") : `${n} ${n === 1 ? "pronòstic" : "pronòstics"}`}</small></span>
        <b class="pron-pts">${closed && r ? fmt(b.total) : n ? "✔" : "—"}</b>
      </li>`).join("")}</ol>
      ${missing > 0 ? `<p class="muted">${missing} ${missing === 1 ? "membre encara no ha" : "membres encara no han"} fet pronòstics.</p>` : ""}
    </section>`;
  $$("[data-lg]", body).forEach((b) => b.addEventListener("click", () => { PronState.league = b.dataset.lg; pronLeagues(body, st, r); }));
}

function pronGeneral(body, r) {
  const rank = Esp.cfg.pronRank || [];
  if (!rank.length) {
    body.innerHTML = `<div class="card pron-empty"><h2 class="section-title sm">Rànquing general</h2><p>El rànquing de tothom es publica quan acabi l'escrutini i es liquidin els pronòstics. Fins aleshores, juga amb les teves lligues!</p></div>`;
    return;
  }
  const meUid = window.Online?.user?.uid;
  body.innerHTML = `<section class="card pron-lg"><h2 class="section-title sm">Rànquing general</h2>
    <ol class="pron-rank">${rank.map((p, i) => `<li class="${p.uid === meUid ? "me" : ""}" data-user="${p.uid}"><span class="pron-pos">${i + 1}</span>${p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="pron-av">${esc((p.name || "?")[0])}</span>`}<span class="pron-nm"><b>${esc(p.name || "Jugador")}</b></span><b class="pron-pts">${fmt(p.fitxes)}</b></li>`).join("")}</ol>
    ${PronState.mine?.fitxes !== undefined ? `<p>Tu en tens <b>${pronFmt(PronState.mine.fitxes)}</b>.</p>` : ""}</section>`;
}

// Targeta per a la columna de la nit electoral
function pronNitCard(d) {
  const st = pronState();
  if (st === "off" || st === "aviat") return "";
  const mine = PronState.mine;
  if (!window.Online?.user || !mine) return `<section class="card pron-nit"><h2 class="section-title sm">🎟️ Lliga de pronòstics</h2><p class="muted">${st === "oberta" ? "Reparteix les teves fitxes abans de les 20:00!" : "Mira com van les teves lligues."}</p><a class="btn" href="#pronostics">${st === "oberta" ? "Fes els pronòstics" : "Obre la lliga"}</a></section>`;
  const r = pronResults(d);
  const b = pronBalance(mine, r);
  return `<section class="card pron-nit"><h2 class="section-title sm">🎟️ Les teves fitxes</h2>
    <p class="pron-nit-n"><b>${fmt(r ? b.total : pronBudget(mine) - b.staked)}</b> fitxes ${r ? (r.final ? "(final)" : "ara mateix") : ""}</p>
    <a class="btn" href="#pronostics/lligues">Mira les teves lligues</a></section>`;
}

ACHIEVEMENTS.push({ id: "pron-fet", name: "Pronosticador", desc: "Reparteix les teves fitxes a la Lliga de pronòstics del 29N." });
