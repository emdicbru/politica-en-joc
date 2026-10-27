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
  opts: [[`a`, `Menos de ${cuts[0]}`], [`b`, `De ${cuts[0]} a ${cuts[1] - 1}`], [`c`, `De ${cuts[1]} a ${cuts[2] - 1}`], [`d`, `${cuts[2]} o más`]],
  res: (d) => { const n = d.seats[party] || 0; return n < cuts[0] ? "a" : n < cuts[1] ? "b" : n < cuts[2] ? "c" : "d"; },
});
const PRON_M = [
  { id: "m1", q: "¿Quién será la primera fuerza?", opts: [["pp", "PP"], ["psoe", "PSOE"], ["vox", "Vox"], ["altre", "Otro partido"]], res: (d) => (["pp", "psoe", "vox"].includes(d.ranking[0]) ? d.ranking[0] : "altre") },
  { id: "m2", q: "¿Cuántos escaños sacará el PP?", ...pronRange("pp", [120, 140, 160]) },
  { id: "m3", q: "¿Cuántos escaños sacará el PSOE?", ...pronRange("psoe", [100, 120, 140]) },
  { id: "m4", q: "¿Cuántos escaños sacará Vox?", ...pronRange("vox", [30, 45, 60]) },
  { id: "m8", q: "¿Cuántos escaños sacará Frente Amplio?", ...pronRange("fa", [15, 25, 35]) },
  { id: "m5", q: "¿La participación será más alta o más baja que en 2023 (66,6 %)?", opts: [["alta", "Más alta"], ["baixa", "Más baja"]], res: (d) => ((d.participacio || 0) >= 66.6 ? "alta" : "baixa") },
  { id: "m6", q: "¿PP y Vox sumarán mayoría absoluta (176)?", opts: [["si", "Sí"], ["no", "No"]], res: (d) => ((d.seats.pp || 0) + (d.seats.vox || 0) >= 176 ? "si" : "no") },
  { id: "m7", q: "¿Los partidos que invistieron a Sánchez en 2023 volverán a sumar 176?", hint: "PSOE, FA, Podemos, ERC, Junts, EH Bildu, PNV, BNG y CC", opts: [["si", "Sí"], ["no", "No"]], res: (d) => (PRON_INV23.reduce((a, k) => a + (d.seats[k] || 0), 0) >= 176 ? "si" : "no") },
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
const pronFmt = (n) => `${fmt(Math.round(n))} fichas`;
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
  const status = st === "aviat" ? `Se abre el 23 de noviembre` : st === "oberta" ? `Se cierra dentro de <b>${pronCountdown()}</b> (29N, 20:00)` : st === "off" ? "No disponible" : r?.final ? "Liquidada" : r ? "Cerrada · se resuelve en directo con el escrutinio" : "Cerrada · se resolverá con el escrutinio";
  root.innerHTML = `${espPreviewBar()}
    <header class="pron-hero">
      <div><p class="esp-k">🎟️ Juego · elecciones del 29N</p><h1>Liga de pronósticos</h1>
        <p>Reparte tus <b>${fmt(PRON_BASE)} fichas</b> (y, si quieres, las monedas que hayas ganado jugando) entre al menos ${PRON_MIN_Q} preguntas. En cada pregunta, las fichas de quienes fallan se reparten a partes iguales entre quienes aciertan. ¡Pon más donde estés más seguro!</p>
        <p class="pron-status">${status}</p></div>
      <div class="pron-wallet"><small>${st === "oberta" || st === "aviat" ? "Te quedan por repartir" : !r ? "En juego" : r.final ? "Tus fichas" : bal.partial ? "Recuperarías (sin el bote)" : "Ahora mismo tendrías"}</small><b>${fmt(st === "oberta" || st === "aviat" ? pronBudget(PronState.draft || mine) - pronStaked(PronState.draft || mine) : bal.total)}</b><span>fichas</span></div>
    </header>
    <nav class="pron-tabs">${[["meus", "Mis pronósticos"], ["lligues", "Mis ligas"], ["general", "Ranking general"]].map(([k, t]) => `<button type="button" class="${PronState.tab === k ? "on" : ""}" data-ptab="${k}">${t}</button>`).join("")}</nav>
    <div data-pbody></div>
    <p class="sim-fiction">Las fichas son una moneda inventada de Política en Joc: no se pueden comprar, no tienen ningún valor y no se pueden canjear por nada. Las que ganes se guardan para las próximas elecciones.</p>`;
  espBind(root);
  $$("[data-ptab]", root).forEach((b) => b.addEventListener("click", () => { PronState.tab = b.dataset.ptab; renderPronostics(); }));
  const body = $("[data-pbody]", root);
  if (!logged) {
    body.innerHTML = `<div class="card pron-login"><h2 class="section-title sm">Entra para jugar</h2><p>Los pronósticos se guardan en tu cuenta para que los puedas comparar con tus ligas de amigos.</p><button class="btn primary lg" type="button" data-plogin>Entra</button></div>`;
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
  body.innerHTML = `${st === "aviat" ? `<div class="card pron-soon"><b>Los mercados se abren el 23 de noviembre.</b> Ya puedes hacerte una idea de los pronósticos que habrá.</div>` : ""}
    ${open && typeof Coins !== "undefined" ? `<section class="card pron-extra">
      <div><b>🪙 Añade monedas</b><p>${maxExtra || D.extra ? `${D.extra ? `Añades ${fmt(D.extra)} monedas; puedes añadir hasta ${fmt(maxExtra)}.` : `Tienes ${fmt(coins)} monedas de juego.`} Las que añadas se convierten en fichas de esta Liga: si aciertas, las multiplicarás, pero no vuelven al monedero.` : `Juega a los minijuegos para ganar monedas y añadirlas aquí (hacen falta ${PRON_EXTRA_STEP}).`} <a href="#botiga">¿Qué son?</a></p></div>
      ${maxExtra || D.extra ? `<div class="pron-stake"><span>Añades</span><button type="button" data-ex="-${PRON_EXTRA_STEP}" aria-label="Menos">−</button><input type="text" inputmode="numeric" data-exv value="${D.extra || 0}" aria-label="Monedas"><button type="button" data-ex="${PRON_EXTRA_STEP}" aria-label="Más">+</button></div>` : ""}
    </section>` : !open && PronState.mine?.extra ? `<p class="muted">Añadiste ${fmt(PronState.mine.extra)} monedas de juego.</p>` : ""}
    <div class="pron-list">${PRON_M.map((m) => {
      const b = D[m.id];
      const out = r?.res?.[m.id];
      const q = out && b ? pronQ(m, b, out, Esp.cfg.pronPots) : null;
      return `<section class="card pron-m ${b ? "has" : ""}">
        <header><h3>${esc(m.q)}</h3><span class="pron-x">${b?.a ? fmt(b.a) : "Bote"}</span></header>
        ${m.hint ? `<p class="muted pron-hint">${esc(m.hint)}</p>` : ""}
        <div class="pron-opts">${m.opts.map(([o, t]) => `<button type="button" data-mo="${m.id}" data-o="${o}" class="${b?.o === o ? "on" : ""} ${out === o ? "win" : ""}" ${open ? "" : "disabled"}>${esc(t)}${out === o ? ` <small>${r.final ? "✔" : "ahora"}</small>` : ""}</button>`).join("")}</div>
        ${open ? `<div class="pron-stake ${b ? "" : "off"}"><span>Pones</span><button type="button" data-st="${m.id}" data-d="-50" aria-label="Menos">−</button><input type="text" inputmode="numeric" data-sv="${m.id}" value="${b?.a || 0}" aria-label="Fichas"><button type="button" data-st="${m.id}" data-d="50" aria-label="Más">+</button><span class="pron-ret">Si la aciertas, las recuperas y te toca parte del bote</span></div>`
          : b ? `<p class="pron-res">Has puesto <b>${fmt(b.a)}</b> a «${esc(m.opts.find(([o]) => o === b.o)?.[1] || b.o)}»${q ? (out === b.o ? ` · <span class="up">${r.final ? "acertada" : "ahora la aciertas"}${q.share ? `: +${fmt(Math.round(q.share))} del bote` : q.share === null ? " (el bote se publica a las 20:00)" : ""}</span>` : q.lost ? ` · <span class="down">${r.final ? "fallada" : "ahora la fallas"}</span>` : ` · nadie la ha acertado: la recuperas`) : ""}</p>` : `<p class="muted pron-res">No pusiste fichas.</p>`}
      </section>`;
    }).join("")}</div>
    ${open ? (() => {
      const n = pronCount(D), ok = left === 0 && n >= PRON_MIN_Q;
      const need = n < PRON_MIN_Q ? `Responde al menos ${PRON_MIN_Q} preguntas (tienes ${n})` : left > 0 ? `Repártelas todas: quedan ${fmt(left)}` : left < 0 ? `Te pasas de ${fmt(-left)} fichas` : dirty ? "Todo listo: guárdalo" : "Guardado. Puedes cambiarlo hasta las 20:00 del 29N.";
      return `<div class="pron-bar ${left < 0 ? "bad" : ok ? "ok" : ""}"><div><b>${n}/${PRON_M.length} preguntas · ${fmt(pronBudget(D) - left)} de ${fmt(pronBudget(D))} fichas</b><small>${need}</small></div><button class="btn primary" type="button" data-psave ${!dirty || !ok || PronState.saving ? "disabled" : ""}>${PronState.saving ? "Guardando…" : "Guarda"}</button></div>`;
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
    if (espPreview()) return toast("Vista previa: los pronósticos no se guardan");
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
    if (ok) { PronState.mine = { ...bets }; PronState.draft = null; Sfx.play("unlock"); toast("Pronósticos guardados"); Progress.unlock("pron-fet"); }
    else PronState.draft = D;
    renderPronostics();
  });
}
function pronWalletSync() {
  const w = $(".pron-wallet b");
  if (w && PronState.draft) w.textContent = fmt(pronBudget(PronState.draft) - pronStaked(PronState.draft));
}

async function pronLeagues(body, st, r) {
  body.innerHTML = `<div class="card"><p class="muted">Cargando tus ligas…</p></div>`;
  const leagues = await window.Online.pronLeagues();
  if (!leagues.length) {
    body.innerHTML = `<div class="card pron-empty"><h2 class="section-title sm">Juega con tus amigos</h2><p>Las ligas de pronósticos son las mismas Ligas de amigos del reto diario. Crea una o únete con un código.</p><a class="btn primary" href="#ranking">Crea o únete a una liga</a></div>`;
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
  body.innerHTML = `<div class="pron-lg-pick">${leagues.map((l) => `<button type="button" class="${l.code === lg.code ? "on" : ""}" data-lg="${l.code}">${esc(l.name)} <small>${l.members.length}</small></button>`).join("")}<a class="linklike" href="#ranking">Gestiona las ligas →</a></div>
    <section class="card pron-lg">
      <h2 class="section-title sm">${esc(lg.name)}</h2>
      <p class="muted">${closed ? (r ? (r.final ? "Resultado final de la liga." : "Clasificación provisional: se mueve con el escrutinio.") : "Los pronósticos ya están cerrados. La clasificación llegará con el escrutinio.") : "Hasta que cierren los colegios no se ve qué ha pronosticado nadie: solo quién ya ha jugado."}</p>
      <ol class="pron-rank">${rows.map(({ p, b, n }, i) => `<li class="${p.uid === window.Online.user.uid ? "me" : ""}">
        <span class="pron-pos">${closed && r ? i + 1 : ""}</span>
        ${p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="pron-av">${esc((p.name || "?")[0])}</span>`}
        <span class="pron-nm"><b>${esc(p.name || "Jugador")}</b><small>${closed ? PRON_M.filter((m) => p[m.id]).map((m) => `${esc(m.opts.find(([o]) => o === p[m.id].o)?.[1] || "")} (${fmt(p[m.id].a)})`).slice(0, 3).join(" · ") + (n > 3 ? " …" : "") : `${n} ${n === 1 ? "pronóstico" : "pronósticos"}`}</small></span>
        <b class="pron-pts">${closed && r ? fmt(b.total) : n ? "✔" : "—"}</b>
      </li>`).join("")}</ol>
      ${missing > 0 ? `<p class="muted">${missing} ${missing === 1 ? "miembro aún no ha" : "miembros aún no han"} hecho pronósticos.</p>` : ""}
    </section>`;
  $$("[data-lg]", body).forEach((b) => b.addEventListener("click", () => { PronState.league = b.dataset.lg; pronLeagues(body, st, r); }));
}

function pronGeneral(body, r) {
  const rank = Esp.cfg.pronRank || [];
  if (!rank.length) {
    body.innerHTML = `<div class="card pron-empty"><h2 class="section-title sm">Ranking general</h2><p>El ranking de todo el mundo se publica cuando acabe el escrutinio y se liquiden los pronósticos. Hasta entonces, ¡juega con tus ligas!</p></div>`;
    return;
  }
  const meUid = window.Online?.user?.uid;
  body.innerHTML = `<section class="card pron-lg"><h2 class="section-title sm">Ranking general</h2>
    <ol class="pron-rank">${rank.map((p, i) => `<li class="${p.uid === meUid ? "me" : ""}"><span class="pron-pos">${i + 1}</span>${p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="pron-av">${esc((p.name || "?")[0])}</span>`}<span class="pron-nm"><b>${esc(p.name || "Jugador")}</b></span><b class="pron-pts">${fmt(p.fitxes)}</b></li>`).join("")}</ol>
    ${PronState.mine?.fitxes !== undefined ? `<p>Tú tienes <b>${pronFmt(PronState.mine.fitxes)}</b>.</p>` : ""}</section>`;
}

// Targeta per a la columna de la nit electoral
function pronNitCard(d) {
  const st = pronState();
  if (st === "off" || st === "aviat") return "";
  const mine = PronState.mine;
  if (!window.Online?.user || !mine) return `<section class="card pron-nit"><h2 class="section-title sm">🎟️ Liga de pronósticos</h2><p class="muted">${st === "oberta" ? "¡Reparte tus fichas antes de las 20:00!" : "Mira cómo van tus ligas."}</p><a class="btn" href="#pronostics">${st === "oberta" ? "Haz los pronósticos" : "Abre la liga"}</a></section>`;
  const r = pronResults(d);
  const b = pronBalance(mine, r);
  return `<section class="card pron-nit"><h2 class="section-title sm">🎟️ Tus fichas</h2>
    <p class="pron-nit-n"><b>${fmt(r ? b.total : pronBudget(mine) - b.staked)}</b> fichas ${r ? (r.final ? "(final)" : "ahora mismo") : ""}</p>
    <a class="btn" href="#pronostics/lligues">Mira tus ligas</a></section>`;
}

ACHIEVEMENTS.push({ id: "pron-fet", name: "Pronosticador", desc: "Reparte tus fichas en la Liga de pronósticos del 29N." });
