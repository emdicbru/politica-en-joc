// Simulador del 29N · Les pantalles de joc: el quarter general de campanya, l'informatiu del vespre i la nit electoral.
// El motor (sim-engine.js) fa tots els càlculs; aquí es dibuixa, s'anima i es reacciona a les decisions del jugador.

const SIM_NS = "http://www.w3.org/2000/svg";
const simReduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const simDateOf = (s, day = s.day) => (s.round === 2 || s.days !== 6 ? null : SIM_DATES[Math.max(0, Math.min(day, 6) - 1)]);
const simOrd = (n) => (typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? `${n}.º` : `${n}${n === 1 ? "r" : n === 2 ? "n" : n === 3 ? "r" : "è"}`);
const simSign = (x, d = 1) => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${simNum(Math.abs(x), d)}`;
// Hora de la nit electoral a partir dels minuts des de les 20.00 h
const simClock = (t) => { const m = Math.round(20 * 60 + t); return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

// =========================================================
// Quarter general de campanya
// =========================================================
function simGauges(s) {
  const mom = s.mom?.jo || 0;
  const g = (k, icon, label, pct, txt, warn = false) => `<div class="hq-g ${warn ? "warn" : ""}" data-g="${k}"><span class="hq-g-i" aria-hidden="true">${icon}</span><div><small>${label}</small><b>${txt}</b><i><em style="width:${Math.max(0, Math.min(100, pct))}%"></em></i></div></div>`;
  return g("en", "⚡", "Energia", s.energy, `${Math.round(s.energy)}`, s.energy < SIM_ENERGY.tired)
    + g("money", "💶", "Diners", (s.money / 130) * 100, fmt(s.money), s.money < 8)
    + g("cred", "🛡️", "Credibilitat", s.cred, fmt(s.cred), s.cred < 40)
    + g("moral", "🔥", "Militància", s.moral, fmt(s.moral), s.moral < 40)
    + g("aw", "👁️", "Notorietat", s.awG * 100, `${Math.round(s.awG * 100)} %`)
    + `<div class="hq-g mom ${mom > 0.12 ? "up" : mom < -0.12 ? "down" : ""}" data-g="mom"><span class="hq-g-i" aria-hidden="true">${mom > 0.12 ? "📈" : mom < -0.12 ? "📉" : "➖"}</span><div><small>Impuls</small><b>${mom > 0.12 ? "A l'alça" : mom < -0.12 ? "A la baixa" : "Estable"}</b></div></div>`;
}

// Marcador: els escons que et dona l'última enquesta que coneixes, comparats amb l'objectiu
function simScoreboard(s) {
  if (s.round === 2) return "";
  const goal = s.goal;
  const poll = simPollsHidden() ? null : [...s.polls].reverse().find((p) => (p.round || 1) === (s.round || 1));
  const seats = poll?.seats ? poll.seats.jo : null;
  const rg = poll?.range?.jo;
  const top = Math.max(goal * 1.3, seats || 0, rg?.[1] || 0, 6);
  const x = (v) => `${Math.min(100, (v / top) * 100)}%`;
  const src = !poll ? (simPollsHidden() ? "aquests dies no es mostren enquestes (LOREG)" : "encara no hi ha cap enquesta")
    : `${poll.internal ? "enquesta interna" : esc(SIM_POLLSTERS.find((q) => q.k === poll.pollster)?.name || "enquesta")}, ${poll.day ? `dia ${poll.day}` : "abans de començar"}`;
  const ok = seats !== null && seats >= goal;
  return `<div class="hq-score ${ok ? "ok" : ""}" style="--pc:${s.me.color}">
    <div class="hq-score-n"><small>Projecció</small><b>${seats === null ? "?" : seats}</b><span>${seats === 1 ? "escó" : "escons"}</span></div>
    <div class="hq-score-m">
      <div class="hq-score-bar" aria-hidden="true">${rg && rg[1] > rg[0] ? `<u style="left:${x(rg[0])};width:calc(${x(rg[1])} - ${x(rg[0])})"></u>` : ""}<i style="width:${x(seats || 0)}"></i><em style="left:${x(goal)}"><span>🎯 ${goal}</span></em></div>
      <small>${ok ? "Ara mateix arribes a l'objectiu" : seats === null ? `Objectiu: ${goal} escons` : `Et ${goal - seats === 1 ? "falta 1 escó" : `falten ${goal - seats} escons`} per a l'objectiu`} · ${src}</small>
    </div>
  </div>`;
}

function simTickerHtml(s) {
  const items = (s.news || []).filter((n) => (n.round || 1) === (s.round || 1)).slice(-14).reverse();
  if (!items.length) return "";
  const row = items.map((n) => `<span class="${n.tone === "bad" ? "bad" : ""}">${n.party ? simLogo(simById(s, n.party)) : ""}<em aria-hidden="true">${n.icon || "•"}</em>${esc(n.t)}</span>`).join("");
  return `<div class="hq-ticker" data-tab-go="diari" role="button" tabindex="0" aria-label="Teletip: obre el diari de campanya"><b class="hq-tk-l">Teletip</b><div class="hq-tk-win"><div class="hq-tk-track ${simReduced() ? "still" : ""}" style="--n:${items.length}">${row}${simReduced() ? "" : `<span aria-hidden="true" class="hq-tk-gap"></span>${row}`}</div></div></div>`;
}

// Punt de la pantalla on cau una circumscripció del mapa (per als efectes)
function simMapPoint(box, svg, i) {
  const g = SIM_MAP.provs[SIM_PROVS[i].code];
  const r = svg.getBoundingClientRect(), b = box.getBoundingClientRect();
  const k = r.width / SIM_MAP.w;
  return { x: r.left - b.left + g.x * k, y: r.top - b.top + g.y * k };
}
// Efecte sobre el mapa: ones i un text que s'enfila. i: circumscripció (o null: tot l'Estat)
function simFx(box, svg, i, text, cls = "") {
  if (!box || !svg) return;
  const p = i === null || i === undefined ? { x: box.clientWidth / 2, y: box.clientHeight * 0.42 } : simMapPoint(box, svg, i);
  const el = document.createElement("div");
  el.className = `hq-fx ${cls} ${i === null || i === undefined ? "wide" : ""}`;
  el.style.left = `${p.x}px`; el.style.top = `${p.y}px`;
  el.innerHTML = `<i></i><i></i>${text ? `<b>${text}</b>` : ""}`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
// La caravana: on és el candidat i el recorregut d'avui (i, si hi ha una circumscripció triada, el camí fins allà)
function simDrawRoute(svg, s, sel) {
  svg.querySelector(".hq-route")?.remove();
  const P = (i) => SIM_MAP.provs[SIM_PROVS[i].code];
  const g = document.createElementNS(SIM_NS, "g");
  g.setAttribute("class", "hq-route");
  const pts = s.route.map(P);
  let html = "";
  for (let k = 1; k < pts.length; k++) {
    const tr = simTravel(s.route[k - 1], s.route[k]).k;
    html += `<line class="leg ${tr}" x1="${pts[k - 1].x}" y1="${pts[k - 1].y}" x2="${pts[k].x}" y2="${pts[k].y}"/>`;
  }
  if (sel !== null && sel !== undefined && sel !== s.loc) {
    const a = P(s.loc), b = P(sel);
    html += `<line class="next ${simTravel(s.loc, sel).k}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  }
  const c = P(s.loc);
  html += `<g class="hq-token" transform="translate(${c.x} ${c.y})"><circle class="halo" r="15"/><circle r="15" fill="${s.me.color}"/><text y="5.5" fill="${simInk(s.me.color)}">${esc((s.me.leader || s.me.name).trim().charAt(0).toUpperCase())}</text></g>`;
  g.innerHTML = html;
  svg.appendChild(g);
}

function simHud0(G) { G.ctx.hud([]); }

function simCampaign(G) {
  const s = G.state;
  simHud0(G);
  if (G.sel === undefined) G.sel = null;
  if (!G.map || G.map === "poll" && simPollsHidden()) G.map = "aw";
  G.tab = G.tab || "agenda";
  G.cat = G.cat || "terr";
  const date = simDateOf(s);
  const el = simMount(G, `<div class="sim-wrap hq" style="--pc:${s.me.color};--pci:${simInk(s.me.color)}" data-slot="${s.slot}">
    <header class="hq-top">
      <div class="hq-id">${simLogoSvg(s.me, 46)}<div><b>${esc(s.me.name)}</b><small>${s.round === 2 ? "Campanya de les eleccions següents" : `Objectiu: ${s.goal} escons`}</small></div></div>
      <div class="hq-clock"><small>${date ? `${date.w} · ${date.d}` : `Dia ${s.day} de ${s.days}`}</small><b>Dia ${s.day}<span> de ${s.days}</span></b><ol class="hq-slots" data-slots></ol></div>
      <button class="btn hq-end" data-endday></button>
    </header>
    <div class="hq-gauges" data-gauges></div>
    <div data-ticker></div>
    <div class="hq-main">
      <section class="hq-mapcard">
        <div class="hq-maptop">
          <span class="hq-agenda" data-agenda-chip></span>
          <div class="hq-seg" role="tablist" aria-label="Què mostra el mapa">
            <button role="tab" data-map="aw">Notorietat</button>${simPollsHidden() ? "" : `<button role="tab" data-map="poll">Enquesta</button>`}<button role="tab" data-map="riv">Rivals</button>
          </div>
        </div>
        <div class="hq-mapbox" data-mapbox>${simSpainMap("hq-svg")}</div>
        <div class="hq-legend" data-legend></div>
        <label class="hq-provselect"><span>O tria-la de la llista</span><select data-provsel><option value="">Circumscripció…</option>${[...SIM_PROVS].sort((a, b) => a.name.localeCompare(b.name, "ca")).map((p) => `<option value="${p.i}">${esc(p.name)} · ${p.seats}</option>`).join("")}</select></label>
        <div class="hq-prov" data-prov aria-live="polite"></div>
      </section>
      <aside class="hq-side">
        <div data-score></div>
        <div class="hq-tabs" role="tablist">
          <button role="tab" data-tab="agenda">Agenda <em data-badge></em></button>
          <button role="tab" data-tab="enquestes">Enquestes</button>
          <button role="tab" data-tab="diari">Diari</button>
        </div>
        <div class="hq-panel" data-panel></div>
      </aside>
    </div>
    <section class="hq-deck">
      <div class="hq-deck-top"><h4>Accions</h4><div class="hq-cats" role="tablist">${[["terr", "Al territori"], ["media", "Mitjans i missatge"], ["estr", "Estratègia"]].map(([k, l]) => `<button role="tab" data-cat="${k}">${l}</button>`).join("")}</div></div>
      <div class="hq-cards" data-cards></div>
      <div class="hq-picker" data-picker hidden></div>
    </section>
    <div class="hq-result" data-result aria-live="polite"></div>
  </div>`);

  const svg = $(".sim-map", el), box = $("[data-mapbox]", el);
  const pickProv = (i) => { G.sel = i; Sfx.play("pick"); if (G.cat !== "terr") G.cat = "terr"; refresh(); if (window.innerWidth < 900) $("[data-prov]", el).scrollIntoView?.({ block: "nearest", behavior: "smooth" }); };
  simMapPick(svg, pickProv);
  $("[data-provsel]", el).addEventListener("change", (e) => { if (e.target.value !== "") pickProv(Number(e.target.value)); });
  $$("[data-map]", el).forEach((b) => b.addEventListener("click", () => { G.map = b.dataset.map; Sfx.play("pick"); refresh(); }));
  $$("[data-tab]", el).forEach((b) => b.addEventListener("click", () => { G.tab = b.dataset.tab; Sfx.play("pick"); refresh(); }));
  $$("[data-cat]", el).forEach((b) => b.addEventListener("click", () => { G.cat = b.dataset.cat; Sfx.play("pick"); closePicker(); refresh(); }));
  const goDiari = () => { G.tab = "diari"; refresh(); $("[data-panel]", el).scrollIntoView?.({ block: "nearest", behavior: "smooth" }); };
  $("[data-ticker]", el).addEventListener("click", (e) => { if (e.target.closest("[data-tab-go]")) goDiari(); });
  $("[data-ticker]", el).addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-tab-go]")) { e.preventDefault(); goDiari(); } });

  // Acaba el dia (amb confirmació si encara queden franges)
  let armed = false, armTimer = null;
  const endBtn = $("[data-endday]", el);
  endBtn.addEventListener("click", () => {
    const left = 3 - s.slot;
    if (left > 0 && !armed && s.energy >= 4) {
      armed = true;
      endBtn.textContent = `Segur? ${left === 1 ? "Queda 1 franja" : `Queden ${left} franges`}`;
      endBtn.classList.add("armed");
      armTimer = G.ctx.after(3500, () => { armed = false; refresh(); });
      return;
    }
    clearTimeout(armTimer);
    Sfx.play("pick");
    if ((s.day === 4 && s.days >= 6) || s.day === s.days) { s.stage = "debate"; simSave(G); simDebateScreen(G); }
    else simAfterDay(G, null);
  });

  // ---------- Accions ----------
  const closePicker = () => { const p = $("[data-picker]", el); p.hidden = true; p.dataset.for = ""; };
  function act(type, arg = null) {
    const before = simElection(s);
    const r = simAct(s, type, arg);
    if (!r.ok) { toast(r.msg); Sfx.play("ko"); return; }
    const after = simElection(s);
    Sfx.play(r.good ? "ok" : "ko");
    if (type === "enquesta") { G.map = "poll"; G.tab = "enquestes"; }
    simSave(G);
    closePicker();
    refresh();
    // Efectes: ones al mapa, text que s'enfila i la targeta del resultat
    const dNat = (after.totals.jo.share - before.totals.jo.share) * 100;
    const pi = r.fx?.prov;
    const dProv = pi !== null && pi !== undefined && after.provs[pi].votes.jo !== undefined ? (after.provs[pi].votes.jo / after.provs[pi].valid - before.provs[pi].votes.jo / before.provs[pi].valid) * 100 : null;
    const fxText = dProv !== null && Math.abs(dProv) >= 0.05 ? `${simSign(dProv)} pts` : Math.abs(dNat) >= 0.05 ? `${simSign(dNat)} pts` : "";
    if (type !== "enquesta" && type !== "descans") simFx(box, $(".sim-map", el), pi, fxText, r.good ? "" : "bad");
    if (r.fx?.hit && pi === null) simFx(box, $(".sim-map", el), null, "", "hit");
    const lines = [];
    if (Math.abs(dNat) >= 0.05) lines.push(`<span class="${dNat > 0 ? "up" : "down"}">Intenció de vot a tot l'Estat: ${simSign(dNat)} punts</span>`);
    if (dProv !== null && Math.abs(dProv) >= 0.05) lines.push(`<span class="${dProv > 0 ? "up" : "down"}">A ${esc(SIM_PROVS[pi].name)}: ${simSign(dProv)} punts</span>`);
    const dSeats = after.totals.jo.seats - before.totals.jo.seats;
    if (dSeats) lines.push(`<span class="${dSeats > 0 ? "up" : "down"}">${dSeats > 0 ? "+" : ""}${dSeats} ${Math.abs(dSeats) === 1 ? "escó" : "escons"} segons el teu equip</span>`);
    const cost = [r.fx?.money ? `💶 ${r.fx.money}` : "", r.fx?.en ? `⚡ ${r.fx.en > 0 ? "+" : ""}${r.fx.en}` : ""].filter(Boolean).join(" · ");
    showResult(SIM_ACTIONS[type].icon, r.msg, lines, cost, r.good);
  }
  function showResult(icon, msg, lines, cost, good) {
    const res = $("[data-result]", el);
    res.innerHTML = `<div class="hq-res ${good ? "" : "bad"}"><span class="hq-res-i" aria-hidden="true">${icon}</span><div><p>${esc(msg)}</p>${lines.length ? `<p class="hq-res-d">${lines.join("")}</p>` : ""}${cost ? `<small>${cost}</small>` : ""}</div><button class="hq-res-x" aria-label="Tanca" data-x>×</button></div>`;
    $("[data-x]", res).addEventListener("click", () => { res.innerHTML = ""; });
    clearTimeout(G.resTimer);
    G.resTimer = setTimeout(() => { if (res.isConnected) res.innerHTML = ""; }, 6000);
    G.ctx.onCleanup(() => clearTimeout(G.resTimer));
  }

  // Selector per a les accions que demanen triar alguna cosa (tema, rival, públic, eix)
  function picker(type) {
    const p = $("[data-picker]", el);
    if (p.dataset.for === type && !p.hidden) return closePicker();
    p.dataset.for = type;
    p.hidden = false;
    let head = "", body = "";
    if (type === "agenda") {
      head = "Quin tema vols posar al centre del debat?";
      body = SIM_THEMES.map((t, i) => `<button class="hq-pick ${s.me.prio.includes(i) ? "prio" : ""}" data-arg="${i}"><span aria-hidden="true">${t.icon}</span><b>${t.label}</b>${s.agenda === i ? `<em class="now">Tema d'avui</em>` : ""}<i style="width:${(s.me.iss[i] / 1.3) * 100}%" title="Credibilitat en aquest tema"></i></button>`).join("");
    } else if (type === "atac") {
      head = "Contra quin rival? Funciona millor amb qui competeix pels teus votants.";
      const poll = s.polls[s.polls.length - 1];
      body = [...s.rivals].sort((a, b) => simDist(a, s.me) - simDist(b, s.me)).map((R) => {
        const ov = Math.max(0, 1 - simDist(R, s.me) / 6), done = (s.used.atac || []).some((x) => x.day === s.day && x.id === R.id);
        return `<button class="hq-pick" data-arg="${R.id}" ${done ? "disabled" : ""}>${simLogo(R)}<b>${esc(R.name)}</b><em class="${ov > 0.4 ? "hot" : ""}">${done ? "Ja hi has carregat avui" : ov > 0.4 ? "Competiu pels mateixos votants" : ov > 0.15 ? "Teniu alguns votants en comú" : "Pocs votants en comú"}</em>${poll ? `<small>${simNum(poll.est[R.id] || 0)} %</small>` : ""}</button>`;
      }).join("");
    } else if (type === "anuncis") {
      head = "A quin públic s'adreça la publicitat?";
      body = SIM_AD_SEGS.map((k) => { const g = SIM_SEGMENTS.find((x) => x.k === k); return `<button class="hq-pick" data-arg="${k}"><b>${g ? esc(g.label) : "Tothom"}</b><em>${g ? "Més efecte amb aquest públic" : "Més notorietat arreu"}</em></button>`; }).join("");
    } else if (type === "matisar") {
      head = "Quina posició vols acostar al centre? Costa 5 punts de credibilitat.";
      body = Object.entries(SIM_AXES).map(([ax, l]) => `<button class="hq-pick" data-arg="${ax}" ${simCanAct(s, "matisar", ax) ? "disabled" : ""}><b>${l.charAt(0).toUpperCase() + l.slice(1)}</b><em>${simAxis[ax](s.me[ax])}</em></button>`).join("");
    }
    p.innerHTML = `<p>${head}</p><div class="hq-picks">${body}</div>`;
    $$("[data-arg]", p).forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.arg;
      act(type, type === "agenda" ? Number(v) : v);
    }));
  }

  // Comprova si una acció es pot fer (amb un argument de prova per a les que en demanen)
  const probe = (k) => {
    const a = SIM_ACTIONS[k];
    if (a.needProv) return G.sel === null ? "Tria una circumscripció al mapa." : simCanAct(s, k, G.sel);
    if (a.needTheme) return simCanAct(s, k, 0);
    if (a.needRival) return state0Rivals() ? simCanAct(s, k, s.rivals.find((r) => !(s.used.atac || []).some((x) => x.day === s.day && x.id === r.id))?.id) : null;
    if (a.needSeg) return simCanAct(s, k, "");
    if (a.needAxis) return ["eco", "ter", "val"].every((ax) => simCanAct(s, k, ax)) ? simCanAct(s, k, "eco") : null;
    return simCanAct(s, k);
  };
  const state0Rivals = () => s.rivals.length > 0;

  function cardHtml(k) {
    const a = SIM_ACTIONS[k];
    const err = probe(k);
    const c = simActCost(s, k, a.needProv ? G.sel : null);
    const where = a.needProv && G.sel !== null ? `<small>a ${esc(SIM_PROVS[G.sel].name)}</small>` : "";
    const soft = err && !/Tria una/.test(err);
    return `<button class="hq-card ${err ? "off" : ""}" data-act="${k}" ${err ? `aria-disabled="true" data-err="${esc(err)}"` : ""}>
      <span class="hq-card-i" aria-hidden="true">${a.icon}</span>
      <b>${a.label}${where}</b>
      <span class="hq-card-d">${esc(soft ? err : a.desc)}</span>
      <span class="hq-cost">${c.money ? `<em title="Diners">💶 ${c.money}</em>` : ""}${c.en ? `<em title="Energia">⚡ ${c.en}</em>` : ""}${a.free ? "<em>Sense franja</em>" : ""}${k === "descans" ? `<em>⚡ +${SIM_ENERGY.rest}</em>` : ""}${c.travel.k === "vol" ? "<em>✈️</em>" : ""}</span>
    </button>`;
  }

  // ---------- Pintar ----------
  function refresh() {
    el.dataset.slot = String(s.slot);
    $("[data-slots]", el).innerHTML = SIM_SLOTS.map((x, k) => `<li class="${k < s.slot ? "done" : k === s.slot ? "now" : ""}" title="${x.label}"><i aria-hidden="true">${x.icon}</i><span>${x.label}</span></li>`).join("");
    $("[data-gauges]", el).innerHTML = simGauges(s);
    $("[data-ticker]", el).innerHTML = simTickerHtml(s);
    $("[data-score]", el).innerHTML = simScoreboard(s);
    const th = s.agenda !== null && s.agenda !== undefined ? SIM_THEMES[s.agenda] : null;
    $("[data-agenda-chip]", el).innerHTML = th ? `<span aria-hidden="true">${th.icon}</span><small>Tema del dia</small><b>${th.label}</b>${s.me.prio.includes(s.agenda) ? `<em>És el teu</em>` : ""}` : "";

    // Mapa
    $$("[data-map]", el).forEach((b) => { b.classList.toggle("on", b.dataset.map === G.map); b.setAttribute("aria-selected", b.dataset.map === G.map); });
    const poll = s.polls[s.polls.length - 1];
    const est = poll?.provs;
    const rallies = {};
    s.log.forEach((l) => { if (l.type === "miting" && (l.round || 1) === (s.round || 1)) rallies[l.arg] = (rallies[l.arg] || 0) + 1; });
    const coal = s.used.coal || [];
    const rivWhere = {};
    (s.lastMoves || []).forEach((m) => (m.provs || []).forEach((i) => { (rivWhere[i] = rivWhere[i] || []).push(m.id); }));
    // Escala de la notorietat relativa a la partida (del lloc on menys et coneixen al que més), perquè es vegin les diferències
    const awAll = SIM_PROVS.map((_, i) => simAware(s, i));
    const awLo = Math.min(...awAll), awHi = Math.max(awLo + 0.15, ...awAll);
    simPaintMap(svg, (i) => {
      const p = SIM_PROVS[i], e = est?.[i];
      const aware = Math.round(simAware(s, i) * 100);
      const label = `${p.name}, ${p.seats} escons. Us coneix el ${aware} %${e?.rank ? `. Hi vas ${simOrd(e.rank)} segons l'enquesta` : ""}.`;
      if (G.map === "poll" && est) {
        const lead = e ? simById(s, e.lead) : null;
        return { fill: lead ? lead.color : SIM_GREY, ink: lead ? simInk(lead.color) : "var(--ink)", sel: G.sel === i, label, mark: e?.won ? `${e.won}★` : e?.rank ? simOrd(e.rank) : "" };
      }
      if (G.map === "riv") {
        const ids = rivWhere[i];
        const R = ids ? simById(s, ids[0]) : null;
        return { fill: R ? R.color : "var(--card)", ink: R ? simInk(R.color) : "var(--ink)", sel: G.sel === i, label, mark: ids && ids.length > 1 ? `+${ids.length - 1}` : "" };
      }
      const k = Math.round(10 + 82 * (awAll[i] - awLo) / (awHi - awLo));
      return { fill: `color-mix(in srgb, ${s.me.color} ${k}%, var(--card))`, ink: k > 52 ? simInk(s.me.color) : "var(--ink)", sel: G.sel === i, label,
        mark: `${s.used.cand.includes(i) ? "★" : ""}${"●".repeat(Math.min(3, rallies[i] || 0))}${coal.includes(p.ccaa) ? "◆" : ""}${s.mob[i] > 0.04 ? "▲" : ""}` };
    });
    simDrawRoute(svg, s, G.sel);
    $("[data-legend]", el).innerHTML = G.map === "aw"
      ? `<span>Us coneix el ${Math.round(awLo * 100)} %</span><i class="grad" style="--pc:${s.me.color}"></i><span>${Math.round(awHi * 100)} %</span><em>★ candidat local · ● míting · ◆ coalició · ▲ porta a porta · ◯ on és la caravana</em>`
      : G.map === "poll" ? `<em>Color: partit que va primer segons ${poll?.internal ? "la teva enquesta interna" : `l'enquesta del ${poll?.day ? `dia ${poll.day}` : "començament"}`}. Número: la teva posició (★ escons que hi treus).</em>`
        : `<em>${(s.lastMoves || []).length ? "On han fet campanya els rivals l'últim dia." : "Encara no han fet campanya: ho veuràs quan acabi el dia."}</em>`;
    $("[data-provsel]", el).value = G.sel === null ? "" : String(G.sel);

    // Circumscripció triada
    const pv = $("[data-prov]", el);
    if (G.sel === null) pv.innerHTML = `<p class="hq-hint">👆 Tria una circumscripció al mapa per fer-hi un míting, porta a porta, fitxar-hi un candidat o pactar-hi una coalició. A les províncies petites es reparteixen pocs escons i costa més entrar-hi.</p>`;
    else {
      const p = SIM_PROVS[G.sel], e = est?.[G.sel];
      const w = simSegmentWeights(p);
      const top = SIM_SEGMENTS.map((g) => ({ g, v: w[g.k] })).sort((a, b) => b.v - a.v).slice(0, 3);
      const tag = (v, lo, mid, hi) => (v < 0.35 ? lo : v < 0.65 ? mid : hi);
      const tr = simTravel(s.loc, G.sel);
      const pill = !e ? "" : e.won ? `<span class="hq-pill ok">Segons l'enquesta, hi treus ${e.won} ${e.won === 1 ? "escó" : "escons"}${e.need === 0 ? " (l'últim, per pocs vots)" : ""}</span>`
        : `<span class="hq-pill">Hi vas ${simOrd(e.rank)}${e.need !== null ? ` · et falten ${simNum(e.need)} punts per a un escó` : ""}</span>`;
      pv.innerHTML = `<div class="hq-prov-h"><div><small>${esc(p.ccaa)}</small><h4>${esc(p.name)}</h4></div><div class="hq-prov-seats"><b>${p.seats}</b><small>${p.seats === 1 ? "escó" : "escons"}</small></div><button class="hq-x" data-unsel aria-label="Treu la selecció">×</button></div>
        ${pill}
        <p class="hq-travel ${tr.k}"><span aria-hidden="true">${{ aqui: "📍", prop: "🚗", lluny: "🚆", vol: "✈️" }[tr.k]}</span>${SIM_TRAVEL_LABEL[tr.k]}${tr.en ? ` · ⚡ ${tr.en}` : ""}${tr.cost ? ` · 💶 ${tr.cost}` : ""}</p>
        <div class="hq-prov-tags"><span>${tag(p.urb, "Rural", "Mixta", "Urbana")}</span><span>Identitat pròpia ${tag(p.ter, "baixa", "mitjana", "alta")}</span><span>${tag(p.age, "Població jove", "Edat mitjana", "Població envellida")}</span></div>
        <p class="hq-prov-aw">Us coneix el <b>${Math.round(simAware(s, G.sel) * 100)} %</b> · ${fmt(p.pop * SIM_K.census)} electors · ${fmt((p.pop * SIM_K.census) / p.seats)} per escó${s.mob[G.sel] > 0.01 ? ` · mobilització +${Math.round(s.mob[G.sel] * 100)} %` : ""}</p>
        <p class="hq-prov-seg"><small>Hi predominen</small>${top.map(({ g, v }) => `<span>${esc(g.label)} <b>${Math.round(v * 100)} %</b></span>`).join("")}</p>`;
      $("[data-unsel]", pv).addEventListener("click", () => { G.sel = null; refresh(); });
    }

    // Accions
    $$("[data-cat]", el).forEach((b) => { b.classList.toggle("on", b.dataset.cat === G.cat); b.setAttribute("aria-selected", b.dataset.cat === G.cat); });
    const keys = Object.keys(SIM_ACTIONS).filter((k) => SIM_ACTIONS[k].cat === G.cat);
    $("[data-cards]", el).innerHTML = keys.map(cardHtml).join("");
    $$("[data-act]", el).forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.act, a = SIM_ACTIONS[k];
      if (b.dataset.err) {
        Sfx.play("ko");
        toast(b.dataset.err);
        if (a.needProv && G.sel === null) { box.classList.remove("ping"); void box.offsetWidth; box.classList.add("ping"); }
        return;
      }
      if (a.needTheme || a.needRival || a.needSeg || a.needAxis) { Sfx.play("pick"); return picker(k); }
      act(k, a.needProv ? G.sel : null);
    }));
    if (!$("[data-picker]", el).hidden && $("[data-picker]", el).dataset.for) { const t = $("[data-picker]", el).dataset.for; $("[data-picker]", el).dataset.for = ""; picker(t); }

    // Panell lateral
    $$("[data-tab]", el).forEach((b) => { b.classList.toggle("on", b.dataset.tab === G.tab); b.setAttribute("aria-selected", b.dataset.tab === G.tab); });
    const open = (s.offers || []).filter((o) => o.status === "nova").length;
    $("[data-badge]", el).textContent = open ? String(open) : "";
    const panel = $("[data-panel]", el);
    if (G.tab === "agenda") panel.innerHTML = simAgendaPanel(s);
    else if (G.tab === "enquestes") panel.innerHTML = simPollPanel(s);
    else panel.innerHTML = simDiaryPanel(s);
    bindPanel(panel);

    if (!armed) { endBtn.classList.remove("armed"); endBtn.textContent = s.day === s.days ? "Tanca la campanya" : "Acaba el dia"; }
    endBtn.classList.toggle("pulse", s.slot >= 3 || s.energy < 4);
  }

  function bindPanel(panel) {
    $$("[data-acc]", panel).forEach((b) => b.addEventListener("click", () => {
      if (s.slot >= 3) { toast("Avui ja no et queden franges"); Sfx.play("ko"); return; }
      const o = simOffer(s, b.dataset.acc);
      if (o && SIM_OFFER_EN[o.type] > s.energy) { toast("El candidat està esgotat: cal descansar."); Sfx.play("ko"); return; }
      Sfx.play("pick");
      s.stage = "media"; s.media = { id: b.dataset.acc };
      simSave(G); simMediaScreen(G);
    }));
    $$("[data-dec]", panel).forEach((b) => b.addEventListener("click", () => {
      const r = simDecline(s, b.dataset.dec);
      if (r) { Sfx.play(b.closest("[data-type='cara']") ? "ko" : "pick"); simSave(G); refresh(); if (r.msg) showResult("💬", r.msg, [], "", r.good !== false && !/cara a cara|No respons/.test(r.msg)); }
    }));
    $$("[data-rep]", panel).forEach((b) => b.addEventListener("click", () => {
      const r = simDoReplica(s, b.dataset.rep, Number(b.dataset.k));
      if (!r) return;
      Sfx.play(r.good ? "ok" : "ko");
      simSave(G); refresh();
      showResult("💬", r.msg, [], r.k < 2 ? `⚡ −${SIM_OFFER_EN.replica}` : "", r.good);
    }));
  }

  refresh();
  if (!SimPrefs.get().tuto4) simTutorial(G);
}

// Agenda d'avui: rèpliques, reptes, entrevistes i fòrums
function simAgendaPanel(s) {
  const offers = s.offers || [];
  if (!offers.length) return `<p class="hq-empty">Avui no t'ha arribat cap proposta. Les entrevistes i els fòrums gasten una franja i energia; les rèpliques, no.</p>`;
  return `<ul class="hq-offers">${offers.map((o) => {
    if (o.type === "replica") {
      const R = simById(s, o.rival);
      const done = o.status !== "nova";
      return `<li class="hq-offer replica ${done ? "done" : ""}" data-type="replica"><span class="hq-offer-i" aria-hidden="true">💬</span>
        <div><em class="hard">Rèplica</em><b>${esc(simGram(`${simThe(R)} t'ha atacat`))}</b><small>Pots replicar sense gastar cap franja. Si calles, el seu missatge cala.</small>
        ${done ? `<span class="hq-offer-st">${o.status === "feta" ? "Fet" : "Sense resposta"}</span>` : `<div class="hq-rep-btns"><button class="btn sm" data-rep="${o.id}" data-k="0">Respon amb dades</button><button class="btn sm" data-rep="${o.id}" data-k="1">Contraataca</button><button class="btn sm ghost" data-rep="${o.id}" data-k="2">Ignora-ho</button></div>`}</div></li>`;
    }
    const i = simOfferInfo(s, o);
    const done = o.status !== "nova";
    // Sense franges o sense prou energia no es pot acceptar (però sí declinar)
    const why = done ? "" : s.slot >= 3 ? "Avui ja no et queden franges" : SIM_OFFER_EN[o.type] > s.energy ? "Al candidat li falta energia: descansa abans" : "";
    return `<li class="hq-offer ${done ? "done" : ""}" data-type="${o.type}"><span class="hq-offer-i" aria-hidden="true">${SIM_MEDIA_ICON[o.type]}</span>
      <div><em class="${i.hard ? "hard" : ""}">${esc(i.tag)}</em><b>${esc(i.title)}</b><small>${esc(i.sub)} · ⚡ ${SIM_OFFER_EN[o.type]}</small>
      ${done ? `<span class="hq-offer-st">${o.status === "feta" ? "Fet" : "Declinat"}</span>` : `<div class="hq-rep-btns"><button class="btn sm primary" data-acc="${o.id}" ${why ? "disabled" : ""}>Accepta</button><button class="btn sm ghost" data-dec="${o.id}">Declina</button></div>${why ? `<small class="hq-offer-why">${why}</small>` : ""}`}</div></li>`;
  }).join("")}</ul>`;
}

// Seguiment d'enquestes: gràfic de línies i l'última enquesta amb la projecció d'escons
function simPollTracker(s) {
  const polls = s.polls.filter((p) => (p.round || s.round || 1) === (s.round || 1));
  if (!polls.length) return "";
  const last = polls[polls.length - 1];
  const ids = Object.keys(last.est).sort((a, b) => last.est[b] - last.est[a]).filter((id, k) => k < 6 || id === "jo");
  const W = 320, H = 150, P = 22, maxD = Math.max(s.days, 1);
  const top = Math.max(...polls.flatMap((p) => ids.map((id) => p.est[id] || 0)), 5);
  const ymax = Math.ceil(top / 5) * 5;
  const X = (d) => P + (d / maxD) * (W - P - 8), Y = (v) => H - 18 - (v / ymax) * (H - 30);
  const grid = [0, ymax / 2, ymax].map((v) => `<line x1="${P}" x2="${W - 6}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${P - 4}" y="${Y(v) + 3}" text-anchor="end">${v}</text>`).join("");
  const b0 = X(simBanDay(s) - 0.5);
  const ban = s.days >= 3 ? `<rect class="ban" x="${b0}" y="8" width="${X(maxD) - b0}" height="${H - 26}"/><text class="banl" x="${(b0 + X(maxD)) / 2}" y="18" text-anchor="middle">Sense enquestes</text>` : "";
  const lines = ids.map((id) => {
    const p = simById(s, id);
    const pts = polls.map((q) => `${X(q.day)},${Y(q.est[id] || 0)}`).join(" ");
    return `<g class="ln ${id === "jo" ? "me" : ""}" style="--pc:${p.color}"><polyline points="${pts}"/>${polls.map((q) => `<circle cx="${X(q.day)}" cy="${Y(q.est[id] || 0)}" r="${id === "jo" ? 3.4 : 2.4}" class="${q.internal ? "int" : ""}"/>`).join("")}</g>`;
  }).join("");
  const xl = Array.from({ length: maxD + 1 }, (_, d) => `<text x="${X(d)}" y="${H - 4}" text-anchor="middle">${d === 0 ? "Inici" : d}</text>`).join("");
  return `<svg class="hq-trk" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolució de les enquestes del joc">${grid}${ban}${lines}${xl}</svg>
    <p class="hq-trk-l">${ids.map((id) => `<span class="${id === "jo" ? "me" : ""}" style="--pc:${simById(s, id).color}">${esc(simById(s, id).sig)}</span>`).join("")}<span class="int">○ enquesta interna</span></p>`;
}
function simPollTable(s, poll, prev) {
  const ids = Object.keys(poll.est).sort((a, b) => (poll.seats?.[b] ?? 0) - (poll.seats?.[a] ?? 0) || poll.est[b] - poll.est[a]);
  const rows = ids.filter((id, k) => k < 8 || id === "jo" || (poll.seats?.[id] || 0) > 0);
  const max = Math.max(...rows.map((id) => poll.est[id]), 1);
  return `<div class="hq-ptab">${rows.map((id) => {
    const p = simById(s, id), d = prev ? poll.est[id] - (prev.est[id] ?? poll.est[id]) : null;
    const rg = poll.range?.[id];
    return `<div class="hq-prow ${id === "jo" ? "me" : ""}">${simLogo(p)}<span class="t"><i style="width:${(poll.est[id] / max) * 100}%;--pc:${p.color}"></i></span><b>${simNum(poll.est[id])} %</b>${d === null ? "<small></small>" : `<small class="${d > 0.05 ? "up" : d < -0.05 ? "down" : ""}">${d > 0.05 ? "▲" : d < -0.05 ? "▼" : "="}${Math.abs(d) >= 0.05 ? simNum(Math.abs(d)) : ""}</small>`}<em>${poll.seats ? `${poll.seats[id]}${rg && rg[1] > rg[0] ? `<small>${rg[0]}–${rg[1]}</small>` : ""}` : ""}</em></div>`;
  }).join("")}</div>`;
}
function simPollPanel(s) {
  if (simPollsHidden()) return `<p class="hq-empty">Durant els cinc dies anteriors a la votació no es mostren enquestes, tampoc les del joc, perquè hi surten partits reals (article 69.7 de la LOREG).</p>`;
  const polls = s.polls;
  const last = polls[polls.length - 1];
  const prevPub = polls.slice(0, -1).reverse().find((p) => p.internal === last.internal) || polls[polls.length - 2];
  const who = last.internal ? "Enquesta interna del teu partit" : `${SIM_POLLSTERS.find((x) => x.k === last.pollster)?.name || "Enquesta"}`;
  return `${simPollTracker(s)}
    <div class="hq-pollhead"><b>${esc(who)}</b><small>${last.day === 0 ? "Abans de començar" : `Dia ${last.day}`} · ${fmt(last.sample)} entrevistes · ±${simNum(last.margin)} punts</small></div>
    <div class="hq-ptab-h"><span>Partit</span><span>Vot</span><span>Escons</span></div>
    ${simPollTable(s, last, prevPub)}
    ${simPollsBanned(s) ? `<p class="hq-ban">🚫 Des del dia ${simBanDay(s)} no es poden publicar enquestes (art. 69.7 de la LOREG). Les internes del partit sí que es poden fer: no es difonen.</p>` : ""}
    <p class="hq-note"><b>Enquestes del joc (ficció).</b> Cada institut té el seu biaix i el seu marge d'error; la forquilla d'escons és el que pot passar dins d'aquest marge.</p>`;
}
function simDiaryPanel(s) {
  const news = (s.news || []).filter((n) => (n.round || 1) === (s.round || 1));
  if (!news.length) return `<p class="hq-empty">Encara no ha passat res. Tens 3 franges cada dia: matí, tarda i vespre.</p>`;
  const days = [...new Set(news.map((n) => n.day))].sort((a, b) => b - a);
  return days.map((d) => `<div class="hq-diary"><h5>${d === s.day ? "Avui" : `Dia ${d}`}</h5><ul>${news.filter((n) => n.day === d).reverse().slice(0, 14).map((n) => `<li class="${n.party === "jo" ? "me" : ""} ${n.tone === "bad" ? "bad" : ""}"><em aria-hidden="true">${n.icon || "•"}</em>${n.party ? simLogo(simById(s, n.party)) : ""}<span>${esc(n.t)}</span></li>`).join("")}</ul></div>`).join("");
}

// Tutorial de quatre passos, la primera vegada
function simTutorial(G) {
  const steps = [
    { t: "El mapa i la caravana", d: "Cada província és una circumscripció, amb els escons que reparteix. Toca'n una per fer-hi campanya: el cercle és on és el candidat. Viatjar lluny gasta energia, i a les illes, Ceuta i Melilla cal agafar l'avió." },
    { t: "Tres franges i l'energia", d: "Cada dia tens matí, tarda i vespre. Cada acció gasta diners i energia: un candidat esgotat rendeix menys i pot relliscar. A la nit recupera forces, i també pots descansar." },
    { t: "El tema del dia i el teletip", d: "Cada dia els mitjans parlen d'un tema: en surten guanyant els partits que el dominen. Pots intentar marcar l'agenda. Al teletip hi ha tot el que passa a la campanya." },
    { t: "Enquestes i rivals", d: "Cada matí un institut publica una enquesta (fins que la llei ho prohibeix, els últims dies). Els rivals fan campanya on es juguen escons i et poden atacar: a l'agenda podràs replicar." },
  ];
  let k = 0;
  const box = h(`<div class="sim-tuto" role="dialog" aria-modal="true" aria-label="Com es juga"><div class="sim-tuto-card card"><p class="sim-kick" data-n></p><h3 class="sim-h" data-t></h3><p data-d></p>
    <div class="sim-actions-row"><button class="btn ghost" data-skip>Salta</button><button class="btn primary" data-next>Següent</button></div></div></div>`);
  document.body.appendChild(box);
  const draw = () => {
    $("[data-n]", box).textContent = `Com es juga · ${k + 1} de ${steps.length}`;
    $("[data-t]", box).textContent = steps[k].t;
    $("[data-d]", box).textContent = steps[k].d;
    $("[data-next]", box).textContent = k === steps.length - 1 ? "Som-hi" : "Següent";
  };
  const close = () => { box.remove(); SimPrefs.set("tuto4", true); };
  draw();
  $("[data-next]", box).focus();
  $("[data-skip]", box).addEventListener("click", close);
  $("[data-next]", box).addEventListener("click", () => { Sfx.play("pick"); if (++k >= steps.length) close(); else draw(); });
  G.ctx.onCleanup(() => box.remove());
}

// =========================================================
// L'informatiu del vespre (final de cada jornada)
// =========================================================
const SIM_NEWS_PRIO = { enquesta: 10, debat: 9, cara: 8, relliscada: 8, polemica: 7, replica: 6, impuls: 6, event: 5, veda: 5, tema: 4, rival: 3, atac: 6, miting: 4, entrevista: 4, coalicio: 4, candidat: 3, agenda: 3, anuncis: 2, xarxes: 2, porta: 2, forum: 2, matisar: 3 };
function simNewscast(G, dayDone, out) {
  const s = G.state;
  const round = s.round || 1;
  const today = (s.news || []).filter((n) => n.day === dayDone && (n.round || 1) === round);
  const morning = (s.news || []).filter((n) => n.day === s.day && n.day !== dayDone && (n.round || 1) === round);
  const score = (n) => (SIM_NEWS_PRIO[n.kind] || 1) + (n.party === "jo" || n.target === "jo" ? 3 : 0) + (n.tone === "bad" ? 1 : 0) + (n.kind === "rival" && n.icon === "🎯" ? 1 : 0);
  const heads = [...today].sort((a, b) => score(b) - score(a)).filter((n, k, arr) => arr.findIndex((x) => x.t === n.t) === k).slice(0, 5);
  const lead = heads[0];
  const poll = out.poll;
  const pubs = s.polls.filter((p) => !p.internal);
  const prev = poll ? pubs[pubs.length - 2] : null;
  const temaN = morning.find((n) => n.kind === "tema");
  const veda = morning.find((n) => n.kind === "veda");
  const camp = out.moves.filter((m) => m.kind === "camp");
  const where = {};
  out.moves.forEach((m) => (m.provs || []).forEach((i) => { (where[i] = where[i] || []).push(m.id); }));
  const date = simDateOf(s, dayDone);
  const replies = (s.offers || []).filter((o) => o.type === "replica").length;
  const cara = (s.offers || []).some((o) => o.type === "cara");
  const chip = (n) => (n.party ? `<span class="tv-chips">${simLogo(simById(s, n.party))}${n.target && n.target !== n.party ? `<span class="tv-vs">vs</span>${simLogo(simById(s, n.target))}` : ""}</span>` : "");
  const el = simMount(G, `<div class="sim-wrap"><div class="tv">
    <header class="tv-top"><span class="tv-live">En directe</span><div><b>Informatiu del vespre</b><small>${date ? `${date.w} ${date.d} · ` : ""}Dia ${dayDone} de ${s.days}</small></div><span class="tv-logo">${simLogoSvg(s.me, 30)}</span></header>
    ${lead ? `<div class="tv-lead ${lead.tone === "bad" ? "bad" : ""}"><span class="tv-lead-i" aria-hidden="true">${lead.icon || "📰"}</span><div><small>Titular</small><h3>${esc(lead.t)}</h3><p>${chip(lead)}</p></div></div>` : ""}
    ${heads.length > 1 ? `<ul class="tv-heads">${heads.slice(1).map((n, k) => `<li style="--d:${k}" class="${n.tone === "bad" ? "bad" : ""}"><em aria-hidden="true">${n.icon || "•"}</em><span class="tv-h-t">${esc(n.t)}</span>${chip(n)}</li>`).join("")}</ul>` : ""}
    ${poll && !simPollsHidden() ? `<section class="tv-poll"><div class="tv-sec"><b>📊 L'enquesta del matí</b><small>${esc(SIM_POLLSTERS.find((x) => x.k === poll.pollster)?.name || "")} · ${fmt(poll.sample)} entrevistes · ±${simNum(poll.margin)} punts · ficció</small></div>
      <div class="tv-poll-g"><div>${simPollTable(s, poll, prev)}</div><div class="tv-hemi">${simHemi(s, poll.seats, `<strong>${poll.seats.jo}</strong><small>escons de ${esc(s.me.sig)}</small>`)}</div></div></section>` : ""}
    ${veda ? `<p class="tv-ban">🚫 ${esc(veda.t)}. A partir d'ara, si vols saber com vas, encarrega una enquesta interna.</p>` : ""}
    <div class="tv-grid">
      <section class="tv-riv"><div class="tv-sec"><b>🗺️ On han fet campanya els rivals</b></div><div class="sim-mapbox mini">${simSpainMap("mini")}</div>
        <details><summary>Detall per partit</summary><ul class="sim-moves">${camp.map((m) => `<li>${simLogo(simById(s, m.id))}<span>${esc(m.msg.replace(/^.*? fa campanya a /, ""))}<small>${esc([...new Set(m.why)].join(" · "))}</small></span></li>`).join("")}</ul></details></section>
      ${s.phase === "campaign" ? `<section class="tv-tomorrow"><div class="tv-sec"><b>🌅 Demà</b></div>
        ${temaN ? `<p class="tv-tema"><span aria-hidden="true">${temaN.icon}</span><span><small>Tema del dia</small><b>${esc(SIM_THEMES[temaN.theme]?.label || temaN.t)}</b>${s.me.prio.includes(temaN.theme) ? "<em>És un dels teus temes!</em>" : ""}</span></p>` : ""}
        <ul class="tv-todo">${(s.offers || []).length ? `<li>📅 ${(s.offers || []).length} ${(s.offers || []).length === 1 ? "proposta" : "propostes"} a l'agenda${cara ? ", entre elles un repte a cara a cara" : ""}</li>` : ""}${replies ? `<li>💬 ${replies === 1 ? "Un rival t'ha atacat: pots replicar" : `${replies} rivals t'han atacat: pots replicar`}</li>` : ""}<li>⚡ Energia del candidat: ${Math.round(s.energy)}</li><li>💶 Diners: ${fmt(s.money)}</li></ul>${simScoreboard(s)}</section>` : `<section class="tv-tomorrow"><div class="tv-sec"><b>🤫 Arriba la jornada de reflexió</b></div><p>S'ha acabat la campanya. Dissabte no es pot demanar el vot i diumenge s'obren els col·legis.</p></section>`}
    </div>
    <div class="tv-actions"><button class="btn primary lg" data-go>${s.phase === "reflection" ? "Arriba la jornada de reflexió" : `Comença el dia ${s.day}`}</button></div>
  </div></div>`);
  simPaintMap($(".sim-map", el), (i) => { const ids = where[i]; if (!ids) return {}; const p = simById(s, ids[0]); return { fill: p.color, ink: simInk(p.color), mark: ids.length > 1 ? `+${ids.length - 1}` : "" }; });
  if (poll) Sfx.play(prev && poll.est.jo > (prev.est.jo || 0) + 0.2 ? "ok" : "tick");
  $("[data-go]", el).addEventListener("click", () => { Sfx.play("pick"); simGo(G); });
}

// =========================================================
// Nit electoral: enquesta a peu d'urna, escrutini en directe i escons en joc
// =========================================================
// Les sumes de la nit: els dos blocs que es van comptar a les investidures del 2023 (Sumar hi és ara Frente Amplio i Podemos)
// i, si hi pot ser decisiu, el partit del jugador
const SIM_BLOCS = [
  { label: "PSOE i els socis de la investidura del 2023", ids: ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"] },
  { label: "PP i Vox", ids: ["pp", "vox"] },
];
function simSumsHtml(s, totals, done = true) {
  const seat = (id) => totals[id]?.seats || 0;
  const me = seat("jo");
  const w = (n) => `${(n / 350) * 100}%`;
  return `<div class="tv-sums"><div class="tv-sec"><b>🧮 Les sumes</b><small>Majoria absoluta: ${SIM_MAJ} escons</small></div>${SIM_BLOCS.map((b) => {
    const ids = b.ids.filter((id) => totals[id] && seat(id) > 0);
    const n = ids.reduce((t, id) => t + seat(id), 0);
    const key = n < SIM_MAJ && n + me >= SIM_MAJ && me > 0;
    const note = n >= SIM_MAJ ? (done ? "Majoria absoluta" : "Ara mateix, majoria absoluta")
      : key ? `Amb ${esc(s.me.sig)} en sumarien ${n + me}: ${done ? "tens la clau" : "ara mateix, tens la clau"}` : `En falten ${SIM_MAJ - n}`;
    return `<div class="tv-sum ${n >= SIM_MAJ ? "ok" : ""} ${key ? "key" : ""}"><p><span>${esc(b.label)}</span><b>${n}</b></p>
      <div class="tv-sum-bar">${ids.map((id) => `<i style="width:${w(seat(id))};--pc:${simById(s, id).color}" title="${esc(simById(s, id).sig)}: ${seat(id)}"></i>`).join("")}${key ? `<i class="me" style="width:${w(me)};--pc:${s.me.color}" title="${esc(s.me.sig)}: ${me}"></i>` : ""}<u style="left:${w(SIM_MAJ)}"></u></div>
      <small>${note}</small></div>`;
  }).join("")}</div>`;
}
function simNight(G) {
  const s = G.state, { ctx } = G;
  ctx.hud([]);
  const r = simElection(s);
  const lean = simRuralLean(r);
  const exit = simExitPoll(s, r);
  const parties = [s.me, ...s.rivals];
  const order = simHemiOrder(s);
  const END = Math.max(...SIM_PROVS.map((p, i) => { const c = simCountPace(i); return c.start + c.dur; })) + 2;
  const firstPoll = s.polls.find((p) => p.day === 0) || s.polls[0];
  let t = 0, speed = 1, done = false, timer = null, last = null, meSaid = null;
  const seen = new Set();
  const el = simMount(G, `<div class="sim-wrap"><div class="tv tv-night" data-stage="exit">
    <header class="tv-top"><span class="tv-live">En directe</span><div><b>${s.round === 2 ? "Nit electoral, quatre anys després" : "Nit electoral · 29N"}</b><small>Eleccions generals · Congrés dels Diputats</small></div>
      <div class="tv-clock"><b data-clock>20:00</b><small data-pct>Escrutat 0,0 %</small></div></header>
    <div class="tv-bar" aria-hidden="true"><i data-bar></i></div>
    <section class="tv-exit" data-exit>
      <div class="tv-sec"><b>🗳️ Enquesta a peu d'urna</b><small>A les 20.00 h, en tancar els col·legis · ficció</small></div>
      <div class="tv-exit-rows" data-exit-rows></div>
      <p class="tv-exit-me" data-exit-me></p>
      <div class="tv-actions"><button class="btn primary lg" data-count>Comença l'escrutini</button></div>
    </section>
    <div class="tv-night-grid" data-count-view hidden>
      <section class="tv-hemicard">
        <div class="hemi-wrap">${hemicycleSVG(order.map((p) => ({ id: p.id, color: p.color, seats: r.totals[p.id].seats })))}<div class="hemi-center"><strong data-me>0</strong><small>escons de ${esc(s.me.sig)}</small></div></div>
        <div class="tv-tally" data-tally></div>
        <div data-sums></div>
      </section>
      <div class="tv-side">
        <section class="tv-mapcard"><div class="tv-sec"><b>Qui guanya a cada circumscripció</b><small>Les rurals es compten abans</small></div><div class="sim-mapbox night">${simSpainMap("night")}</div></section>
        <section class="tv-battles"><div class="tv-sec"><b>🔥 Escons en joc</b></div><ul data-battles></ul></section>
        <section class="tv-feed"><ol data-ticker aria-live="polite"></ol></section>
      </div>
    </div>
    <footer class="tv-ctl" data-ctl hidden>
      <div class="tv-speed" role="group" aria-label="Velocitat de l'escrutini"><button data-speed="1" class="on">▶ ×1</button><button data-speed="4">⏩ ×4</button></div>
      <button class="btn" data-skip>Salta al resultat</button>
    </footer>
  </div></div>`);
  const tv = $(".tv-night", el);
  const map = $(".sim-map", el);
  const circles = $$(".hemicycle circle", el);
  circles.forEach((c) => c.setAttribute("fill", SIM_GREY));
  const ticker = $("[data-ticker]", el);
  const say = (txt, cls = "") => {
    const li = document.createElement("li");
    li.className = cls;
    li.innerHTML = `<small>${simClock(t)}</small><span>${txt}</span>`;
    ticker.prepend(li);
    while (ticker.children.length > 7) ticker.lastChild.remove();
  };

  // 1. Enquesta a peu d'urna
  const exRows = Object.keys(exit.est).filter((id) => exit.est[id] >= 0.8 || exit.range[id][1] > 0 || id === "jo").sort((a, b) => exit.seats[b] - exit.seats[a] || exit.est[b] - exit.est[a]);
  $("[data-exit-rows]", el).innerHTML = exRows.map((id, k) => { const p = simById(s, id), rg = exit.range[id]; return `<div class="tv-xrow ${id === "jo" ? "me" : ""}" style="--d:${k}">${simLogo(p)}<span class="n">${esc(p.name)}</span><span class="t"><i data-w="${(exit.est[id] / Math.max(...exRows.map((x) => exit.est[x]))) * 100}" style="--pc:${p.color}"></i></span><b>${simNum(exit.est[id])} %</b><em>${rg[0] === rg[1] ? rg[0] : `${rg[0]}–${rg[1]}`}<small>escons</small></em></div>`; }).join("");
  // Les barres creixen una darrere l'altra (transició d'amplada un cop pintades a zero)
  requestAnimationFrame(() => requestAnimationFrame(() => $$("[data-exit-rows] i[data-w]", el).forEach((i) => { i.style.width = `${i.dataset.w}%`; })));
  const exMe = exit.range.jo;
  $("[data-exit-me]", el).innerHTML = `${simLogoSvg(s.me, 28)} <span>${esc(s.me.name)}: <b>${exMe[0] === exMe[1] ? exMe[0] : `entre ${exMe[0]} i ${exMe[1]}`} ${exMe[1] === 1 ? "escó" : "escons"}</b>${s.round !== 2 ? ` · objectiu: ${s.goal}` : ""}</span>`;
  Sfx.play("tick");

  // 2. Escrutini
  const paint = (c) => {
    const pct = Math.min(1, c.pct);
    $("[data-clock]", el).textContent = simClock(t);
    $("[data-pct]", el).textContent = `Escrutat ${simPct(pct, 1)} %`;
    $("[data-bar]", el).style.width = `${pct * 100}%`;
    $("[data-me]", el).textContent = c.totals.jo.seats;
    // Hemicicle: els partits d'esquerres omplen des de l'esquerra i els de dretes des de la dreta; al mig, el que encara no s'ha assignat
    const fills = new Array(350).fill(SIM_GREY);
    let L = 0, R = 349;
    const half = order.length / 2;
    order.forEach((p, k) => { if (k < half) for (let n = 0; n < c.totals[p.id].seats && L < 350; n++) fills[L++] = p.color; });
    [...order].reverse().forEach((p, k) => { if (k < order.length - half) for (let n = 0; n < c.totals[p.id].seats && R >= 0; n++) fills[R--] = p.color; });
    circles.forEach((ci, k) => ci.setAttribute("fill", fills[k]));
    const counted = c.valid || 1;
    const rows = [...parties].filter((p) => c.totals[p.id].votes || p.id === "jo").sort((a, b) => c.totals[b.id].seats - c.totals[a.id].seats || c.totals[b.id].votes - c.totals[a.id].votes);
    $("[data-tally]", el).innerHTML = rows.slice(0, 10).map((p) => {
      const was = p.id === "jo" ? null : SIM_SEATS_2023[p.id];
      const dd = was === null || was === undefined || pct < 0.999 ? null : c.totals[p.id].seats - was;
      return `<div class="tv-trow ${p.id === "jo" ? "me" : ""}">${simLogo(p)}<span>${esc(p.name)}</span><small>${simPct(c.totals[p.id].votes / counted)} %</small><b>${c.totals[p.id].seats}</b>${dd === null ? "<em></em>" : `<em class="${dd > 0 ? "up" : dd < 0 ? "down" : ""}">${dd > 0 ? "+" : ""}${dd}</em>`}</div>`;
    }).join("");
    simPaintMap(map, (i) => {
      const p = c.provs[i];
      if (!p.f) return { fill: "", ink: "var(--ink)" };
      const win = Object.keys(p.won).sort((a, b) => p.won[b] - p.won[a] || p.votes[b] - p.votes[a])[0];
      const P = simById(s, win);
      return { fill: `color-mix(in srgb, ${P.color} ${Math.round(35 + 65 * p.f)}%, var(--card))`, ink: p.f > 0.5 ? simInk(P.color) : "var(--ink)", in: true, mark: p.won.jo ? `★${p.won.jo}` : "" };
    });
    $("[data-sums]", el).innerHTML = simSumsHtml(s, c.totals, pct >= 0.999);
    const bat = simBattles(c, 3);
    $("[data-battles]", el).innerHTML = bat.length ? bat.map((b) => { const H = simById(s, b.holder), C = simById(s, b.chaser); return `<li class="${b.holder === "jo" || b.chaser === "jo" ? "me" : ""}"><b>${esc(SIM_PROVS[b.i].name)}</b><span>${simLogo(H)}<em>⟷</em>${simLogo(C)}</span><small>${simNum(b.pct, 2)} % · ${fmt(b.gap)} vots · escrutat ${Math.round(b.f * 100)} %</small></li>`; }).join("") : `<li class="none">Cap escó ajustat ara mateix</li>`;
  };
  const moments = (c) => {
    const pct = c.pct;
    [0.25, 0.5, 0.75].forEach((m) => { if (pct >= m && !seen.has(`p${m}`)) { seen.add(`p${m}`); say(`Escrutat el ${Math.round(m * 100)} %.`); } });
    const lead = Object.keys(c.totals).sort((a, b) => c.totals[b].seats - c.totals[a].seats || c.totals[b].votes - c.totals[a].votes)[0];
    if (last) {
      const lastLead = Object.keys(last.totals).sort((a, b) => last.totals[b].seats - last.totals[a].seats || last.totals[b].votes - last.totals[a].votes)[0];
      if (lead !== lastLead && pct > 0.03) { say(`<b>${esc(simGram(simThe(simById(s, lead))))}</b> passa al davant en escons.`, "hot"); Sfx.play("tick"); }
      // Els escons del jugador: primer una projecció i, després, només els canvis que s'aguanten uns minuts
      // (amb poc escrutat, l'últim escó d'una circumscripció va i ve)
      const mine = c.totals.jo.seats;
      if (pct >= 0.05 && !meSaid) {
        meSaid = { seats: mine, t };
        say(`Primeres dades: <b>${esc(s.me.sig)}</b> ${mine ? `en treuria ${mine === 1 ? "un escó" : `${mine}`}` : "encara no treu cap escó"}.`, mine ? "me" : "");
      } else if (meSaid && mine !== meSaid.seats && t - meSaid.t >= 10) {
        const dMe = mine - meSaid.seats;
        if (dMe > 0) { say(`<b>${esc(s.me.sig)}</b> suma ${dMe === 1 ? "un escó" : `${dMe} escons`}: ja en té ${mine}.`, "me"); Sfx.play("ok"); }
        else { say(`<b>${esc(s.me.sig)}</b> perd ${dMe === -1 ? "un escó" : `${-dMe} escons`}: ara en té ${mine}.`, "bad"); Sfx.play("ko"); }
        meSaid = { seats: mine, t };
      }
      c.provs.forEach((p, i) => { if (p.f >= 1 && last.provs[i].f < 1 && p.won.jo) say(`${esc(SIM_PROVS[i].name)}, escrutat: ${esc(s.me.sig)} hi treu ${p.won.jo === 1 ? "1 escó" : `${p.won.jo} escons`}.`, "me"); });
    }
    if (pct > 0 && !seen.has("first")) { seen.add("first"); say("Arriben els primers resultats. Les meses rurals són les primeres a comptar."); }
    last = c;
  };
  const step = () => {
    t = Math.min(END, t + 2);
    const c = simCountAt(r, t, lean);
    moments(c);
    paint(c);
    if (t >= END) finish();
  };
  const run = () => {
    if (timer) timer();
    timer = ctx.every(Math.round(170 / speed), step);
  };
  const begin = () => {
    tv.dataset.stage = "count";
    $("[data-exit]", el).hidden = true;
    $("[data-count-view]", el).hidden = false;
    $("[data-ctl]", el).hidden = false;
    Sfx.play("pick");
    say("Tanquen els col·legis electorals: comença l'escrutini.");
    paint(simCountAt(r, 0, lean));
    run();
  };
  $("[data-count]", el).addEventListener("click", begin);
  $$("[data-speed]", el).forEach((b) => b.addEventListener("click", () => {
    speed = Number(b.dataset.speed);
    $$("[data-speed]", el).forEach((x) => x.classList.toggle("on", x === b));
    if (!done) run();
  }));
  $("[data-skip]", el).addEventListener("click", () => { t = END - 2; step(); });

  function finish() {
    if (done) return;
    done = true;
    if (timer) timer();
    const me = r.totals.jo;
    const ok = s.round === 2 || me.seats >= s.goal;
    const est = firstPoll?.est.jo;
    $("[data-ctl]", el).innerHTML = `<div class="tv-final ${ok ? "ok" : ""}">
        <div><small>Resultat definitiu</small><b>${esc(s.me.sig)}: ${me.seats} ${me.seats === 1 ? "escó" : "escons"} · ${simPct(me.share)} %</b>
        <span>${s.round === 2 ? "" : ok ? `Objectiu complert (${s.goal})` : `Objectiu: ${s.goal} escons`}${est !== undefined && s.round !== 2 && !simPollsHidden() ? ` · la primera enquesta et donava un ${simNum(est)} %` : ""}</span></div>
        <button class="btn primary lg pulse" data-next>${simShortMode(s) || s.round === 2 ? "Veure el resultat" : "Veure l'informe electoral"}</button></div>`;
    say(`Escrutat el 100 %: <b>${esc(s.me.sig)}</b> ${me.seats ? `treu ${me.seats === 1 ? "un escó" : `${me.seats} escons`}` : "es queda sense escó"}.`, me.seats ? "me" : "bad");
    if (ok && me.seats > 0 && !simReduced()) simConfetti(tv, [s.me.color, "#ffcf3d", "#ff4b2b", "#fffaf0"]);
    Sfx.play(ok ? "win" : "tick");
    $("[data-next]", el).addEventListener("click", () => simAfterNight(G, r));
  }
}

// Confeti senzill (CSS) per a les celebracions
function simConfetti(host, colors) {
  const box = document.createElement("div");
  box.className = "sim-confetti";
  box.setAttribute("aria-hidden", "true");
  box.innerHTML = Array.from({ length: 70 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--d:${(k % 14) * 0.07}s;--r:${(k * 53) % 360}deg;--c:${colors[k % colors.length]};--s:${0.7 + ((k * 7) % 6) / 10}"></i>`).join("");
  host.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}
