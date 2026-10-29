// Simulador de debat electoral: pantalles, plató i control del debat.
// El motor és a debat-engine.js; el plató en 3D, a debat-plato.js (es carrega només en entrar al plató).

const DB_PREFS_KEY = "r29n-debat";
const DB_NET = { cara: "Cadena privada", quatre: "Televisión pública", set: "Televisión pública", petits: "Canal autonómico" };

ACHIEVEMENTS.push(
  { id: "debat-guanya", name: "Ganador del debate", desc: "Gana la encuesta flash de un debate electoral." },
  { id: "debat-cara", name: "Cara a cara", desc: "Gana un cara a cara en el simulador de debate." },
  { id: "debat-set", name: "Entre siete", desc: "Gana el debate a siete, con todos los grupos del Congreso." },
  { id: "debat-verifica", name: "Verificación en directo", desc: "Pilla a un rival diciendo un dato falso durante un debate." },
  { id: "debat-minut", name: "Minuto de oro", desc: "Mira a cámara en el momento justo durante el minuto de oro." },
);

registerGame({
  id: "debat",
  cat: "parlament",
  hidden: true, // s'hi arriba des de la secció Simulador
  backHref: "#simulador",
  backLabel: "Vuelve a los simuladores",
  tagline: "Planta cara a los candidatos en un plató de televisión.",
  kicker: "Simulador de debate",
  title: "Debate electoral",
  color: "#3554ff",
  level: 2,
  meta: "10 min",
  icon: icon(`<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M7 9h4M7 12h7"/>`),
  desc: "Eres el cabeza de lista de un partido que creas tú. Decide a qué debate vas, prepárate y planta cara a los candidatos reales en un plató en 3D: interrupciones, datos falsos, preguntas trampa, nervios y el minuto de oro. Al final, una encuesta flash dice quién ha ganado.",
  rules: ["Crea tu candidato", "Elige el debate y prepárate", "Plató en 3D", "Encuesta flash al final"],
  start(ctx) { dbSetup({ ctx, me: null }); },
});

// ---------- 1. El teu candidat ----------
function dbSetup(G) {
  const { ctx } = G;
  const saved = store.get(DB_PREFS_KEY, null);
  const me = G.me || saved || { name: DB_NAMES[Math.floor(Math.random() * DB_NAMES.length)], party: "Nueva Plaza", sig: "NP", color: DB_COLORS[0], ideo: "cesq", terr: "autonom", size: "gran", style: "rigor" };
  if (!me.look) Object.assign(me, { look: DB_NAME_LOOKS[Math.max(0, DB_NAMES.indexOf(me.name))], skin: DB_SKINS[1], hairC: DB_HAIRS[1] });
  G.me = me;
  const seg = (name, list, cur) => `<div class="db-seg" role="radiogroup" aria-label="${name}">${list.map((x) => `<button type="button" role="radio" data-${name}="${x.k}" aria-checked="${x.k === cur}" class="${x.k === cur ? "on" : ""}">${x.label}</button>`).join("")}</div>`;
  const cards = (name, list, cur) => `<div class="db-choices">${list.map((x) => `<button type="button" class="db-choice ${x.k === cur ? "on" : ""}" data-${name}="${x.k}" aria-pressed="${x.k === cur}"><b>${x.label}</b><small>${x.d}</small></button>`).join("")}</div>`;
  ctx.body.innerHTML = `<div class="db-wrap">
    <div class="card db-card">
      <p class="kicker">Paso 1 de 3 · Tu candidato</p>
      <h2 class="db-h">¿Quién se presenta al debate?</h2>
      <div class="db-setup">
        <div class="db-form">
          <label>Nombre del candidato<span class="db-in"><input data-f="name" maxlength="26" value="${esc(me.name)}" autocomplete="off"><button type="button" class="db-dice" data-dice aria-label="Otro nombre">🎲</button></span></label>
          <label>Nombre del partido<input data-f="party" maxlength="30" value="${esc(me.party)}" autocomplete="off"></label>
          <label>Siglas<input data-f="sig" maxlength="6" value="${esc(me.sig)}" autocomplete="off"></label>
          <div class="db-colors" role="radiogroup" aria-label="Color">${DB_COLORS.map((c) => `<button type="button" role="radio" aria-label="Color ${c}" aria-checked="${c === me.color}" class="${c === me.color ? "on" : ""}" data-color="${c}" style="--c:${c}"></button>`).join("")}</div>
        </div>
        <div class="db-preview" aria-hidden="true">
          <div class="db-prev-led">DEBATE 29N</div>
          <div class="db-prev-pod" data-prev><b></b><small></small></div>
        </div>
      </div>
      <h3 class="db-h3">Aspecto</h3>
      <div class="db-looks" role="radiogroup" aria-label="Peinado">${DB_LOOKS.map((x) => `<button type="button" role="radio" data-look="${x.k}" aria-checked="${x.k === me.look}" class="${x.k === me.look ? "on" : ""}">${x.label}</button>`).join("")}</div>
      <div class="db-tones">
        <span>Piel</span><div class="db-colors sm" role="radiogroup" aria-label="Tono de piel">${DB_SKINS.map((c) => `<button type="button" role="radio" aria-label="Tono ${c}" aria-checked="${c === me.skin}" class="${c === me.skin ? "on" : ""}" data-skin="${c}" style="--c:${c}"></button>`).join("")}</div>
        <span>Pelo</span><div class="db-colors sm" role="radiogroup" aria-label="Color de pelo">${DB_HAIRS.map((c) => `<button type="button" role="radio" aria-label="Pelo ${c}" aria-checked="${c === me.hairC}" class="${c === me.hairC ? "on" : ""}" data-hairc="${c}" style="--c:${c}"></button>`).join("")}</div>
      </div>
      <h3 class="db-h3">Ideología</h3>${seg("ideo", DB_IDEOS, me.ideo)}
      <h3 class="db-h3">Modelo territorial</h3>${seg("terr", DB_TERRS, me.terr)}
      <h3 class="db-h3">Tamaño del partido</h3>${cards("size", DB_SIZES, me.size)}
      <h3 class="db-h3">Estilo del candidato</h3>${cards("style", DB_STYLES, me.style)}
      <div class="db-actions"><button class="btn primary lg" data-next>${typeof DbOpts !== "undefined" && DbOpts.amics ? "Següent: la sala amb els amics →" : "Siguiente: las invitaciones →"}</button></div>
    </div>
  </div>`;
  const el = ctx.body;
  const paint = () => {
    const p = $("[data-prev]", el);
    p.style.setProperty("--c", me.color);
    $("b", p).textContent = me.sig || "?";
    $("small", p).textContent = me.name;
  };
  paint();
  $$("[data-f]", el).forEach((i) => i.addEventListener("input", () => {
    me[i.dataset.f] = i.value.trim();
    if (i.dataset.f === "party" && !el.dataset.sigTouched) {
      me.sig = me.party.split(/\s+/).filter((w) => w.length > 2 || /^\p{Lu}/u.test(w)).map((w) => w[0]).join("").toUpperCase().slice(0, 5) || "P";
      $("[data-f=sig]", el).value = me.sig;
    }
    if (i.dataset.f === "sig") { el.dataset.sigTouched = "1"; me.sig = i.value.trim().toUpperCase(); }
    paint();
  }));
  $("[data-dice]", el).addEventListener("click", () => {
    me.name = DB_NAMES[(DB_NAMES.indexOf(me.name) + 1) % DB_NAMES.length];
    $("[data-f=name]", el).value = me.name;
    // Si encara no ha triat aspecte, el dau també proposa el de cada nom
    if (!me.lookTouched) { me.look = DB_NAME_LOOKS[DB_NAMES.indexOf(me.name)]; $$("[data-look]", el).forEach((x) => { const on = x.dataset.look === me.look; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); }); }
    paint(); Sfx.play("pick");
  });
  const pickOne = (attr, key) => $$(`[data-${attr}]`, el).forEach((b) => b.addEventListener("click", () => {
    me[key] = b.dataset[attr];
    $$(`[data-${attr}]`, el).forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute(x.getAttribute("role") === "radio" ? "aria-checked" : "aria-pressed", on); });
    paint(); Sfx.play("pick");
  }));
  $$("[data-look]", el).forEach((b) => b.addEventListener("click", () => { me.lookTouched = true; }));
  pickOne("color", "color"); pickOne("look", "look"); pickOne("skin", "skin"); pickOne("hairc", "hairC"); pickOne("ideo", "ideo"); pickOne("terr", "terr"); pickOne("size", "size"); pickOne("style", "style");
  $("[data-next]", el).addEventListener("click", () => {
    if (!me.name) me.name = DB_NAMES[0];
    if (!me.party) me.party = "Nueva Plaza";
    if (!me.sig) me.sig = "NP";
    store.set(DB_PREFS_KEY, me);
    Sfx.play("pick");
    // Debat entre amics (debat-amics.js): en lloc de les invitacions de les televisions, la sala
    if (typeof DbOpts !== "undefined" && DbOpts.amics && dbmOn()) return dbmHome(G);
    dbInvitesScreen(G);
  });
}

// ---------- 2. Invitacions ----------
function dbInvitesScreen(G) {
  const { ctx, me } = G;
  const inv = dbInvites(me.size);
  const lineup = (k) => (k === "cara" ? [dbCaraRival(me.ideo)] : DB_LINEUPS[k].slice(0, DB_FORMATS[k].rivals));
  ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card">
    <p class="kicker">Paso 2 de 3 · Las invitaciones</p>
    <h2 class="db-h">¿A qué debate vas?</h2>
    <p class="db-lead">Las televisiones invitan a los partidos según la representación que tienen. Es el criterio de proporcionalidad de la Junta Electoral Central. Como tu partido es <b>${DB_SIZES.find((s) => s.k === me.size).label.toLowerCase()}</b>, estas son las invitaciones:</p>
    <div class="db-invites">${Object.keys(DB_FORMATS).map((k) => {
      const F = DB_FORMATS[k], ok = inv.includes(k);
      return `<button type="button" class="db-invite ${ok ? "" : "off"}" data-fmt="${k}" ${ok ? "" : "disabled"}>
        <span class="db-inv-net">${ok ? "📩 Invitación" : "🔒 Sin invitación"} · ${DB_NET[k]}</span>
        <b>${F.title}</b>
        <small>${F.desc}</small>
        <span class="db-inv-faces">${lineup(k).map((id) => { const p = PARTIES.find((x) => x.id === id); return `<i style="--pc:${p.color}" title="${esc(p.cand?.name || p.sig)}">${p.sig}</i>`; }).join("")}<i class="me" style="--pc:${me.color}">${esc(me.sig)}</i></span>
        ${ok ? "" : `<em>${k === "cara" ? "Solo para los dos partidos que pueden ganar" : k === "quatre" ? "Solo para los cuatro partidos más grandes" : k === "set" ? "Solo para los grupos del Congreso" : "Solo para los partidos sin grupo"}</em>`}
      </button>`;
    }).join("")}</div>
    ${inv.length > 1 ? `<p class="db-note">Declinar un debate también es una decisión: si no vas, los rivales hablarán sin ti y te reprocharán el atril vacío.</p>` : ""}
    <div class="db-actions"><button class="btn ghost" data-back>← Atrás</button></div>
  </div></div>`;
  $("[data-back]", ctx.body).addEventListener("click", () => dbSetup(G));
  $$("[data-fmt]:not([disabled])", ctx.body).forEach((b) => b.addEventListener("click", () => { G.format = b.dataset.fmt; Sfx.play("pick"); dbPrepScreen(G); }));
}

// ---------- 3. Preparació ----------
function dbPrepScreen(G) {
  const { ctx } = G;
  const prep = G.prep || { dades: 1, repliques: 1, camera: 1 };
  G.prep = prep;
  G.strat = G.strat || "centre";
  const left = () => 3 - prep.dades - prep.repliques - prep.camera;
  const items = [
    ["dades", "Datos y cifras", "Recordarás mejor los datos y detectarás los falsos."],
    ["repliques", "Réplicas", "Más réplicas disponibles y más calma ante las interrupciones."],
    ["camera", "Ante la cámara", "Menos nervios y más acierto en el minuto de oro."],
  ];
  const draw = () => {
    ctx.body.innerHTML = `<div class="db-wrap"><div class="card db-card">
      <p class="kicker">Paso 3 de 3 · La preparación</p>
      <h2 class="db-h">${DB_FORMATS[G.format].title} · ${DB_NET[G.format]}</h2>
      <h3 class="db-h3">Tres horas de ensayo con el equipo</h3>
      <p class="db-lead">Repártelas. Quedan <b data-left>${left()}</b> ${left() === 1 ? "hora" : "horas"}.</p>
      <div class="db-prep">${items.map(([k, t, d]) => `<div class="db-prep-row">
        <div><b>${t}</b><small>${d}</small></div>
        <div class="db-step"><button type="button" data-minus="${k}" aria-label="Menos ${t}" ${prep[k] ? "" : "disabled"}>−</button><span>${"●".repeat(prep[k])}${"○".repeat(3 - prep[k])}</span><button type="button" data-plus="${k}" aria-label="Más ${t}" ${left() ? "" : "disabled"}>+</button></div>
      </div>`).join("")}</div>
      <h3 class="db-h3">Estrategia</h3>
      <div class="db-choices">${Object.entries(DB_STRAT).map(([k, s]) => `<button type="button" class="db-choice ${G.strat === k ? "on" : ""}" data-strat="${k}" aria-pressed="${G.strat === k}"><b>${s.label}</b><small>${s.d}</small></button>`).join("")}</div>
      <div class="db-actions"><button class="btn ghost" data-back>← Atrás</button><button class="btn primary lg" data-go>Entra en el plató 🎬</button></div>
      <p class="db-fiction">${DB_DISCLAIMER}</p>
    </div></div>`;
    $$("[data-plus]", ctx.body).forEach((b) => b.addEventListener("click", () => { if (left() > 0) { prep[b.dataset.plus]++; Sfx.play("pick"); draw(); } }));
    $$("[data-minus]", ctx.body).forEach((b) => b.addEventListener("click", () => { if (prep[b.dataset.minus] > 0) { prep[b.dataset.minus]--; Sfx.play("pick"); draw(); } }));
    $$("[data-strat]", ctx.body).forEach((b) => b.addEventListener("click", () => { G.strat = b.dataset.strat; Sfx.play("pick"); draw(); }));
    $("[data-back]", ctx.body).addEventListener("click", () => dbInvitesScreen(G));
    $("[data-go]", ctx.body).addEventListener("click", () => { Sfx.play("pick"); dbStudio(G); });
  };
  draw();
}

// ---------- 4. El plató ----------
async function dbStudio(G) {
  const { ctx } = G;
  const st = dbNewGame({ seed: Math.floor(Math.random() * 1e9), me: G.me, format: G.format, prep: G.prep, strat: G.strat });
  G.st = st;
  const F = DB_FORMATS[G.format];
  const net = DB_NET[G.format];
  // Aspecte de cada avatar (el jugador el tria; els rivals, segons DB_CAST)
  const num = (c) => parseInt(String(c).replace("#", ""), 16);
  const cast = (o) => (o ? { look: o.look, age: o.age, skin: num(o.skin), hair: num(o.hair) } : {});
  const meSeed = [...st.me.name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % 1000;
  const cands = [{ id: "jo", name: st.me.name, sig: st.me.sig, color: st.me.color, me: true, seed: meSeed, ...cast({ look: G.me.look, age: 44, skin: G.me.skin, hair: G.me.hairC }) },
    ...st.rivals.map((r, i) => ({ id: r.id, name: r.cand, sig: r.sig, color: r.color, seed: 11 + i * 7, ...cast(DB_CAST[r.id]) }))];
  // El jugador ocupa una posició al mig (sorteig)
  const order = [...cands.slice(1)];
  order.splice(Math.floor(order.length / 2), 0, cands[0]);
  const T = h(`<div class="db-theater" role="dialog" aria-modal="true" aria-label="Debate electoral">
    <div class="db-stage"><div class="db-flash"></div><div class="db-loading"><span class="dot-live"></span> Preparando el plató…</div><div class="db-lower" data-lower hidden><span class="db-who" data-who></span><p class="db-say" data-say></p></div></div>
    <div class="db-top">
      <span class="db-live"><i></i>EN DIRECTO</span>
      <span class="db-net">${esc(net)} · ${esc(F.title)}</span>
      <span class="db-blockname" data-blockname></span>
      <button type="button" class="db-x" data-exit aria-label="Sal del debate">✕</button>
    </div>
    <div class="db-clocks" data-clocks aria-label="Tiempo que le queda a cada candidato"></div>
    <aside class="db-meters" aria-label="Cómo va el debate">
      <div class="db-curve"><span class="db-m-h">Medidor en directo</span><svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true"><path class="db-dl-mid" d="M0 20H120"/><path class="db-dl-rivals" data-dl="rivals"/><path class="db-dl-base" data-dl="base"/><path class="db-dl-indecisos" data-dl="indecisos"/></svg><b data-imp>—</b></div>
      <div class="db-segs" data-segs></div>
      <div class="db-time"><span class="db-m-h">Tu tiempo</span><span class="db-bar"><i data-timebar></i></span><b data-time></b></div>
      <div class="db-time"><span class="db-m-h">Nervios</span><span class="db-bar nerves"><i data-nerves></i></span><b data-nervesv></b></div>
      <div class="db-reps"><span class="db-m-h">Réplicas</span><span data-reps></span></div>
    </aside>
    <div class="db-panel" data-panel></div>
    <div class="db-ticker" aria-label="Redes sociales"><span class="db-tick-h">Redes</span><span class="db-tick" data-tick>Empieza el debate. #Debate29N</span></div>
  </div>`);
  document.body.appendChild(T);
  document.body.classList.add("db-lock");
  const stage = $(".db-stage", T);
  let plato = null;
  try {
    const mod = await import(new URL("js/debat/debat-plato.js?v=40", window.PEJ_CDN || document.baseURI).href);
    plato = await mod.createPlato(stage, { cands: order, title: "DEBATE 29N", net: `${net.toUpperCase()} · ${F.title.toUpperCase()}` });
  } catch (e) {
    console.warn("Plató 3D no disponible: " + (e && (e.stack || e.message || e)));
    plato = dbFlatStudio(stage, order);
  }
  $(".db-loading", stage)?.remove();
  const done = () => { plato?.dispose(); T.remove(); document.body.classList.remove("db-lock"); };
  ctx.onCleanup(done);
  G.T = T; G.plato = plato; G.cands = cands;
  T.dbPlato = plato; // per a les proves visuals
  $("[data-exit]", T).addEventListener("click", () => {
    if (confirm("¿Quieres salir del debate? No se guardará.")) { done(); location.hash = "#simulador"; }
  });
  dbMeters(G);
  dbDialStart(G);
  try {
    await dbRun(G);
  } catch (e) {
    if (e !== "fi") throw e;
  }
}

// Plató pla, si el dispositiu no pot mostrar 3D
function dbFlatStudio(stage, cands) {
  stage.classList.add("flat");
  stage.insertAdjacentHTML("beforeend", `<div class="db-flat"><div class="db-flat-led">DEBATE 29N</div><div class="db-flat-row">${cands.map((c) => `<span class="db-flat-pod" data-fp="${c.id}" style="--c:${c.color}"><i></i><b>${esc(c.sig)}</b></span>`).join("")}</div></div>`);
  let cur = null;
  return {
    shot() {}, react() {}, resize() {}, dispose() {},
    screen(t) { const l = $(".db-flat-led", stage); if (l) l.textContent = t; },
    speak(id) { if (cur) cur.classList.remove("on"); cur = $(`[data-fp="${id}"]`, stage); if (cur) cur.classList.add("on"); },
  };
}

// Indicadors: corba, grups de votants, temps, nervis, rèpliques
function dbMeters(G, d) {
  const { st, T } = G;
  $("[data-imp]", T).textContent = dbImpression(st);
  dbClocks(G);
  const lab = { base: "Los tuyos", indecisos: "Indecisos", rivals: "De los rivales" };
  $("[data-segs]", T).innerHTML = Object.keys(lab).map((k) => {
    const dv = d?.[k];
    return `<span class="db-segc ${dv > 0.4 ? "up" : dv < -0.4 ? "down" : ""}" data-seg="${k}"><small><i class="db-sw"></i>${lab[k]}</small><b>${Math.round(st.seg[k])}</b>${dv ? `<em>${dv > 0 ? "+" : ""}${fmtDb(dv)}</em>` : ""}</span>`;
  }).join("");
  $("[data-timebar]", T).style.width = `${(st.time / st.total) * 100}%`;
  $("[data-timebar]", T).parentElement.classList.toggle("low", st.time < 60);
  $("[data-time]", T).textContent = dbClock(st.time);
  $("[data-nerves]", T).style.width = `${st.nerves}%`;
  $("[data-nervesv]", T).textContent = st.nerves >= 70 ? "Altos" : st.nerves >= 45 ? "Medios" : "Bajos";
  $("[data-reps]", T).textContent = "●".repeat(st.replies) + "○".repeat(Math.max(0, 1 + st.prep.repliques - st.replies));
  if (st.social[0]) $("[data-tick]", T).innerHTML = st.social.slice(0, 4).map((s) => `<span class="${s.good ? "good" : "bad"}"><b>${s.tag}</b> ${esc(s.text)}</span>`).join("");
}
// Medidor en directe, com els panells d'espectadors de les televisions: una línia per grup que es mou mentre parla
// algú. Mentre parles tu, s'acosta a poc a poc a la nova valoració; quan t'ataquen, cau una mica fins que respons.
function dbDialStart(G) {
  const { st, T, ctx } = G;
  const keys = ["base", "indecisos", "rivals"];
  const D = (G.dial = { v: { ...st.seg }, hist: [] });
  for (let i = 0; i < 70; i++) D.hist.push({ ...st.seg });
  const y = (v) => (40 - ((Math.max(15, Math.min(95, v)) - 15) / 80) * 40).toFixed(1);
  ctx.every(200, () => {
    if (!T.isConnected) return;
    const talk = G.talking, dip = G.attacking ? 3 : 0;
    keys.forEach((k) => {
      const target = st.seg[k] - (k === "rivals" ? 0 : dip);
      const ease = talk === "jo" ? 0.06 : 0.14;
      const noise = talk ? (Math.random() - 0.5) * (talk === "jo" ? 1.6 : 0.9) : (Math.random() - 0.5) * 0.25;
      D.v[k] = Math.max(0, Math.min(100, D.v[k] + (target - D.v[k]) * ease + noise));
    });
    D.hist.push({ ...D.v });
    if (D.hist.length > 70) D.hist.shift();
    const n = D.hist.length - 1;
    keys.forEach((k) => { $(`[data-dl="${k}"]`, T)?.setAttribute("d", D.hist.map((p, i) => `${i ? "L" : "M"}${((i / n) * 120).toFixed(1)} ${y(p[k])}`).join("")); });
  });
}
// Rellotges de tots els candidats, com als debats de televisió (el de qui parla corre en directe)
function dbClocks(G) {
  const { st, T } = G;
  const box = $("[data-clocks]", T);
  if (!box) return;
  G.shown = G.shown || {};
  const ids = st.order;
  if (!box.children.length) {
    box.innerHTML = ids.map((id) => {
      const c = id === "jo" ? { sig: st.me.sig, color: st.me.color } : dbRival(st, id);
      return `<span class="db-clk${id === "jo" ? " me" : ""}" data-clk="${id}" style="--c:${c.color}"><i></i><b>${esc(c.sig)}</b><em></em></span>`;
    }).join("");
  }
  ids.forEach((id) => {
    const el = $(`[data-clk="${id}"]`, box);
    // Només corre en directe el de qui parla; la resta mostra el temps real (interrupcions, repreguntes…)
    const v = G.talking === id ? G.shown[id] ?? dbTimeOf(st, id) : dbTimeOf(st, id);
    $("em", el).textContent = dbClock(Math.max(0, v));
    el.classList.toggle("on", G.talking === id);
    el.classList.toggle("low", v > 0 && v < 30);
    el.classList.toggle("out", v <= 0);
  });
}
const fmtDb = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
const dbClock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

// ---------- Control del debat ----------
// Segons per decidir quan hi ha pressa (interrupcions, atacs, repreguntes): més si t'has preparat les rèpliques
const dbDecideSecs = (st) => 9 + st.prep.repliques * 2;

async function dbRun(G) {
  const { st, ctx, plato, T } = G;
  const panel = $("[data-panel]", T);
  const alive = () => { if (!ctx.alive() || !T.isConnected) throw "fi"; };
  const who = (id) => (id === "mod" ? { name: DB_MOD.name, sub: DB_MOD.role, color: "#ffcf3d" } : id === "jo" ? { name: st.me.name, sub: st.me.party, color: st.me.color } : (() => { const r = st.rivals.find((x) => x.id === id); return { name: r.cand, sub: r.name, color: r.color }; })());
  const isRival = (id) => st.rivals.some((r) => r.id === id);
  // Algú parla: pla de càmera, rètol i text a màquina d'escriure.
  // interrupt: mentre parla un rival, hi ha el botó «Interromp» (torna "int" si el prems).
  // cutaway: mentre parles tu, la càmera ensenya un moment la reacció d'un rival.
  const say = async (id, text, { shot = id, cont = true, interrupt = false, cutaway = null } = {}) => {
    alive();
    plato.shot(shot === "jo" || isRival(shot) || ["mod", "wide", "two"].includes(shot) ? shot : "wide");
    plato.speak(id);
    const w = who(id);
    const lower = $("[data-lower]", T);
    lower.hidden = false;
    lower.style.setProperty("--c", w.color);
    $("[data-who]", T).innerHTML = `<i></i><b>${esc(w.name)}</b><small>${esc(w.sub)}</small>`;
    const sayEl = $("[data-say]", T);
    sayEl.textContent = "";
    let skip = false, cut = false, cutDone = false;
    const canInt = interrupt && isRival(id) && dbCanInterrupt(st);
    if (!cont) panel.innerHTML = ""; // mentre parles, sense les opcions que ja has triat
    if (cont) panel.innerHTML = `<div class="db-cont-row">${canInt ? `<button type="button" class="btn db-int" data-int>✋ Interrumpe <small>(${2 - st.stats.interrupts})</small></button>` : ""}<button type="button" class="btn primary db-cont" data-cont>Continúa ▸</button></div>`;
    $("[data-cont]", panel)?.addEventListener("click", () => { skip = true; }, { once: true });
    $("[data-int]", panel)?.addEventListener("click", () => { cut = true; skip = true; }, { once: true });
    // Els rivals parlen una mica més a poc a poc quan els pots interrompre
    const speed = canInt ? 30 : 18;
    // El rellotge de qui parla corre mentre parla (el motor ja n'ha descomptat el temps)
    G.talking = id;
    G.shown = G.shown || {};
    const t0 = id === "mod" ? null : G.shown[id] ?? dbTimeOf(st, id), t1 = id === "mod" ? null : dbTimeOf(st, id);
    const tick = (p) => { if (t0 !== null) G.shown[id] = t0 + (t1 - t0) * p; dbClocks(G); };
    for (let i = 0; i <= text.length; i += 2) {
      if (skip) break;
      sayEl.textContent = text.slice(0, i);
      if (i % 6 === 0) tick(i / text.length);
      if (cutaway && !cutDone && i >= text.length * 0.45 && text.length > 60) {
        cutDone = true;
        plato.shot(cutaway); plato.react(cutaway, dbRand(st, "reaccio") < 0.5 ? "shake" : "nod");
        ctx.after(1100, () => { if (T.isConnected) plato.shot(shot === "jo" ? "jo" : shot); });
      }
      await dbWait(ctx, speed);
      alive();
    }
    G.talking = null; G.attacking = false;
    tick(1);
    if (cut) { sayEl.textContent = `${sayEl.textContent.trim()}…`; return "int"; }
    sayEl.textContent = text;
    if (cont) {
      if (canInt) {
        // Encara el pots tallar abans de continuar
        const r = await new Promise((res) => {
          const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); off(); res("cont"); } });
          $("[data-cont]", panel)?.addEventListener("click", () => { off(); res("cont"); }, { once: true });
          $("[data-int]", panel)?.addEventListener("click", () => { off(); res("int"); }, { once: true });
        });
        if (r === "int") return "int";
      } else await dbClick(ctx, panel, "[data-cont]", !skip);
    }
    return "ok";
  };
  // Tria entre opcions al panell. secs: compte enrere; si s'acaba, torna -1 (et quedes callat)
  const choose = (title, sub, opts, secs = 0) => new Promise((res) => {
    let done = false;
    const pick = (i) => { if (done) return; done = true; res(i); };
    panel.innerHTML = `<div class="db-ask">${secs ? `<div class="db-timer" style="--s:${secs}s" aria-hidden="true"><i></i></div>` : ""}<p class="db-ask-t">${title}${secs ? ` <span class="db-ask-clock" data-clock>${secs}</span>` : ""}</p>${sub ? `<p class="db-ask-s">${sub}</p>` : ""}<div class="db-opts">${opts.map((o, i) => `<button type="button" class="db-opt ${o.cls || ""}" data-o="${i}" ${o.disabled ? "disabled" : ""}>${o.icon ? `<span class="db-opt-i">${o.icon}</span>` : ""}<span class="db-opt-b"><b>${esc(o.label)}</b>${o.d ? `<small>${esc(o.d)}</small>` : ""}${o.quote ? `<q>${esc(o.quote)}</q>` : ""}</span>${o.secs ? `<span class="db-opt-s ${o.secs > st.time ? "over" : ""}">${o.secs} s</span>` : ""}</button>`).join("")}</div></div>`;
    $$("[data-o]", panel).forEach((b) => b.addEventListener("click", () => { Sfx.play("pick"); pick(Number(b.dataset.o)); }, { once: true }));
    panel.scrollTop = 0;
    if (secs) {
      let left = secs;
      const tick = () => {
        if (done) return;
        left--;
        const c = $("[data-clock]", panel);
        if (c) { c.textContent = left; c.classList.toggle("hot", left <= 3); }
        if (left <= 0) { Sfx.play("ko"); return pick(-1); }
        ctx.after(1000, tick);
      };
      ctx.after(1000, tick);
    }
  });
  // Mostra l'efecte d'una decisió
  const feedback = async (r, extra = "") => {
    dbMeters(G, r.d);
    Sfx.play(r.good === false || (r.d && r.d.indecisos < -0.5) ? "ko" : "ok");
    const chips = r.d ? Object.entries(r.d).filter(([, v]) => Math.abs(v) >= 0.1).map(([k, v]) => `<span class="${v > 0 ? "up" : "down"}">${{ base: "Los tuyos", indecisos: "Indecisos", rivals: "De los rivales" }[k]} ${v > 0 ? "+" : ""}${fmtDb(v)}</span>`).join("") : "";
    panel.innerHTML = `<div class="db-fb ${r.good === false ? "bad" : "good"}">${r.msg ? `<p>${esc(r.msg)}</p>` : ""}${extra}${chips ? `<div class="db-fb-chips">${chips}</div>` : ""}<button type="button" class="btn primary db-cont" data-cont>Continúa ▸</button></div>`;
    if (r.good !== false && r.d && (r.d.indecisos >= 3 || r.d.base >= 4)) { plato.react("jo", "nod"); $(".db-flash", T).classList.remove("go"); void T.offsetWidth; $(".db-flash", T).classList.add("go"); }
    await dbClick(ctx, panel, "[data-cont]");
  };
  // Interromps un rival
  const interrupt = async (rivalId, wasAttack) => {
    const rr = dbInterrupt(st, rivalId, wasAttack);
    plato.react(rivalId, "shake");
    await say("jo", rr.line, { shot: st.rivals.length === 1 ? "two" : "jo", cont: false });
    await dbWait(ctx, 400);
    if (!rr.ok) await say("mod", "Por favor, respete el turno de palabra.", { shot: "mod", cont: false });
    await feedback(rr);
  };
  // La moderadora dona o treu la paraula (sense esperar cap clic)
  const announce = async (text) => { await say("mod", text, { shot: "mod", cont: false }); await dbWait(ctx, 650); };
  // Decisió amb compte enrere: si s'acaba, et quedes callat
  const decide = async (title, sub, ev) => {
    const j = await choose(title, sub, ev.opts.map((o) => ({ ...o, quote: null })), dbDecideSecs(st));
    return j < 0 ? "silenci" : ev.opts[j].k;
  };

  plato.screen("DEBATE 29N", `${DB_NET[st.format].toUpperCase()} · ${DB_FORMATS[st.format].title.toUpperCase()}`);
  plato.shot("wide");
  await dbWait(ctx, 900);
  await say("mod", `Buenas noches y bienvenidos al ${DB_FORMATS[st.format].title.toLowerCase()}. Hoy nos acompañan ${G.cands.map((c) => c.name).join(", ")}. Los tiempos están pactados y yo los haré cumplir.`, { shot: "wide" });
  // L'ordre d'intervenció s'ha sortejat abans del debat
  await say("mod", `El orden de intervención se ha decidido por sorteo: ${st.order.map((id) => dbSurname(id === "jo" ? st.me.name : dbRival(st, id).cand)).join(", ")}. En cada bloque, el orden irá rotando. En el rótulo de arriba, el tiempo que le queda a cada candidato.`, { shot: "wide" });
  // La primera vegada, com funciona el plató
  if (!store.get(DB_PREFS_KEY, {})?.tuto) {
    await dbTutorial(ctx, panel);
    store.set(DB_PREFS_KEY, { ...store.get(DB_PREFS_KEY, {}), tuto: 1 });
  }

  while (!st.done) {
    alive();
    const block = dbBlock(st);
    const B = DB_BLOCKS[block];
    $("[data-blockname]", T).textContent = `${st.bi + 1}/${st.blocks.length} · ${B.title}`;
    plato.screen(B.title.toUpperCase(), `BLOQUE ${st.bi + 1} DE ${st.blocks.length}`);
    plato.shot("wide");
    await dbWait(ctx, 600);
    await say("mod", dbQuestion(st, block), { shot: "mod" });

    // El teu torn
    const myTurn = async () => {
      if (block === "pactes") {
        const ev = dbEvent(st);
        await say("mod", ev.text.replace(`${DB_MOD.name}: `, "").replace(/^«|»$/g, ""), { shot: "mod" });
        plato.shot("jo"); plato.speak("jo");
        const i = await choose("Pregunta trampa", "Todo el mundo espera tu respuesta.", ev.opts);
        const r = dbResolve(st, ev, ev.opts[i].k);
        await say("jo", ev.opts[i].label + ".", { cont: false });
        await feedback(r);
      } else {
        if (st.time > 0 && st.time < 45 && !G.warned) { G.warned = true; await announce(`${dbTract(st, "jo", "voc")}, le quedan ${Math.round(st.time)} segundos.`); }
        const cards = dbCards(st);
        const titles = { obertura: "¿Cómo te presentas?", tancament: "Tu minuto de oro" };
        plato.shot("jo"); plato.speak(null);
        const i = await choose(titles[block] || "¿Cómo respondes?", block === "tancament" ? "Lo último que verán antes de votar." : `Te quedan ${dbClock(st.time)}. Las respuestas largas pueden hacer que te corten.`, cards.map((c) => ({ ...c, d: null })));
        const card = cards[i];
        if (card.closing) card.cameraHit = await dbCameraQTE(G, panel);
        const r = dbAnswer(st, card);
        if (card.cameraHit) ctx.achieve("debat-minut");
        const watcher = card.k === "atac" ? dbLeader(st).id : dbPick(st, "pla", st.rivals).id;
        await say("jo", card.quote, { shot: "jo", cont: false, cutaway: card.closing ? null : watcher });
        await dbWait(ctx, 300);
        await feedback({ d: r.d, msg: r.cut ? `${DB_MOD.name}: «Se le ha acabado el tiempo, lo siento.»` : dbReactionMsg(r.d), good: !r.cut && r.d.indecisos >= 0 });
        // La moderadora repregunta si no has concretat
        const fu = dbFollowUp(st, card);
        if (fu) {
          await say("mod", fu.text, { shot: "mod" });
          plato.shot("jo");
          const k = await decide(fu.title, "Rápido: la cámara te enfoca.", fu);
          const rr = dbResolve(st, fu, k);
          if (k === "concreta") await say("jo", fu.concrete, { shot: "jo", cont: false });
          await feedback(rr);
        }
        // Obstacle
        const ev = dbEvent(st);
        if (ev) {
          if (ev.rival) {
            const R = st.rivals.find((x) => x.id === ev.rival);
            if (ev.type === "interrupcio") plato.react(R.id, "shake");
            await say(R.id, ev.text.replace(`${R.cand}: `, "").replace(/^«|»$/g, ""), { shot: ev.type === "interrupcio" && st.rivals.length === 1 ? "two" : R.id });
          } else if (ev.type === "micro") {
            $("[data-say]", T).textContent = "…";
            dbMute(T, true);
          }
          plato.shot("jo");
          const sub = ev.type === "verifica" ? `${ev.hint}` : ev.type === "blanc" ? ev.q : ev.type === "micro" ? ev.text : "";
          // Les interrupcions i els atacs personals demanen resposta ràpida
          const k = ["interrupcio", "personal"].includes(ev.type) ? await decide(ev.title, sub, ev) : ev.opts[await choose(ev.title, sub, ev.opts.map((o) => ({ ...o, quote: null })))].k;
          dbMute(T, false);
          const rr = dbResolve(st, ev, k);
          if (ev.type === "verifica" && rr.good && k === "fals") { ctx.achieve("debat-verifica"); plato.react(ev.rival, "shake"); }
          await feedback(rr, rr.exp ? `<p class="db-fb-exp"><b>${ev.type === "blanc" ? "El dato" : "Verificación"}:</b> ${esc(rr.exp)}</p>` : "");
        }
        // Dos rivals s'enganxen entre ells
        const cl = dbClash(st);
        if (cl) {
          plato.react(cl.b, "shake");
          await say(cl.a, cl.lineA, { shot: cl.a });
          plato.react(cl.a, "shake");
          await say(cl.b, cl.lineB, { shot: cl.b });
          plato.shot("wide");
          const k = await decide(cl.title, cl.text, cl);
          if (k === "pau") { plato.shot("jo"); await say("jo", "Mientras ustedes se pelean, la gente espera soluciones. Volvamos a lo que importa.", { shot: "jo", cont: false }); }
          await feedback(dbResolve(st, cl, k));
        }
      }
    };

    // Intervencions per l'ordre sortejat (que roda a cada bloc). Mentre parla un rival, el pots interrompre.
    const seq = dbSpeakers(st), alusio = new Set();
    for (let si = 0; si < seq.length; si++) {
      alive();
      const id = seq[si];
      if (si > 0 || id !== "jo") await announce(alusio.has(id) ? `Por alusiones, tiene la palabra ${dbTract(st, id)}.` : id === "jo" ? `${dbTract(st, "jo", "voc")}, es su turno.` : `Tiene la palabra ${dbTract(st, id)}.`);
      if (id === "jo") {
        await myTurn();
        // Si has atacat el favorit i no li tocava parlar, té dret a respondre per al·lusions
        const L = dbLeader(st);
        if (st.mine?.block === block && st.mine.k === "atac" && !seq.slice(si + 1).includes(L.id) && L.time > 0) { seq.push(L.id); alusio.add(L.id); }
        continue;
      }
      const t = dbRivalSpeak(st, id, alusio.has(id));
      if (t.out) { await announce(`${dbTract(st, id, "voc")}, ya ha agotado su tiempo. Lo siento.`); continue; }
      const R = dbRival(st, id);
      if (t.replyTo) { plato.react("jo", "shake"); G.attacking = true; }
      if ((await say(id, t.line, { shot: t.replyTo && st.rivals.length === 1 ? "two" : id, interrupt: !t.cut, cutaway: t.replyTo ? "jo" : null })) === "int") { await interrupt(id, t.replyTo); continue; }
      if (t.agree) dbMeters(G, t.d);
      if (t.cut) { plato.react(id, "shake"); await announce(`${dbTract(st, id, "voc")}, se le ha acabado el tiempo.`); continue; }
      let attacked = t.replyTo;
      if (t.attack) {
        plato.react("jo", "shake"); G.attacking = true;
        if ((await say(id, t.attack, { shot: st.rivals.length === 1 ? "two" : id, interrupt: true })) === "int") { await interrupt(id, true); continue; }
        attacked = true;
      }
      if (attacked) {
        plato.shot("jo");
        const opts = DB_REPLY_OPTS.map((o) => ({ ...o, disabled: o.token && st.replies <= 0, d: o.token && st.replies <= 0 ? "No te quedan réplicas." : o.d }));
        const k = await choose(`${t.replyTo ? "Te contesta" : "Te ataca"} ${R.cand}`, (st.replies === 1 ? "Te queda 1 réplica." : st.replies ? `Te quedan ${st.replies} réplicas.` : "No te quedan réplicas."), opts, dbDecideSecs(st));
        const rr = k < 0 ? dbResolve(st, {}, "silenci") : dbReply(st, id, opts[k].k);
        await feedback({ ...rr, good: rr.ok ?? rr.good });
      }
    }
    dbMeters(G);
    dbNextBlock(st);
  }
  await say("mod", "Y hasta aquí el debate. Gracias a los candidatos y a ustedes por seguirnos. Ahora, la decisión es suya.", { shot: "wide" });
  dbFinish(G);
}

// La primera vegada: com funciona el plató
function dbTutorial(ctx, panel) {
  panel.innerHTML = `<div class="db-tuto">
    <p class="db-ask-t">Cómo funciona el plató</p>
    <ul>
      <li><b>Medidor en directo:</b> un panel de espectadores reacciona mientras hablas, con una línea para cada grupo: tus votantes (amarillo), los indecisos (blanco) y los de los rivales (rojo). Los indecisos son los que deciden quién gana.</li>
      <li><b>Relojes:</b> arriba, el tiempo que le queda a cada candidato. El orden de intervención se ha sorteado y rota en cada bloque. A quien se pasa, la moderadora lo corta.</li>
      <li><b>Réplicas:</b> los rivales responden a lo que has dicho. Si atacas al favorito, tendrá turno por alusiones.</li>
      <li><b>Nervios:</b> si suben demasiado, las buenas respuestas hacen menos efecto y te puedes quedar en blanco.</li>
      <li><b>Fichas de réplica:</b> para responder con fuerza cuando te atacan.</li>
      <li><b>✋ Interrumpe:</b> mientras habla un rival, lo puedes cortar (dos veces por debate). Arriesgado, pero puede ser el momento de la noche.</li>
      <li><b>Cuenta atrás:</b> algunas decisiones hay que tomarlas rápido. Si no eliges nada, te quedas callado.</li>
    </ul>
    <button type="button" class="btn primary db-cont" data-cont>Entendido, empezamos ▸</button>
  </div>`;
  return dbClick(ctx, panel, "[data-cont]");
}

const dbReactionMsg = (d) => (d.indecisos >= 4 ? "Muy buena respuesta: la curva de los indecisos se dispara." : d.indecisos >= 1.5 ? "Buena respuesta. Los indecisos te escuchan." : d.base >= 3 ? "Los tuyos lo celebran, pero los indecisos no se inmutan." : d.indecisos < 0 ? "A los indecisos no les gusta este tono." : "Respuesta correcta, sin mucho impacto.");
const dbMute = (T, on) => T.classList.toggle("db-mute", on);
const dbWait = (ctx, ms) => new Promise((res) => ctx.after(ms, res));
// Espera un clic (o la tecla d'espai o Enter)
function dbClick(ctx, panel, sel, focus = true) {
  return new Promise((res) => {
    const b = $(sel, panel);
    if (!b) return res();
    if (focus) b.focus({ preventScroll: true });
    const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); off(); res(); } });
    b.addEventListener("click", () => { off(); res(); }, { once: true });
  });
}
// Minut d'or: mirar a càmera quan s'encén el pilot vermell
function dbCameraQTE(G, panel) {
  const { ctx, st } = G;
  return new Promise((res) => {
    panel.innerHTML = `<div class="db-qte"><p class="db-ask-t">Mira a cámara</p><p class="db-ask-s">Toca el botón justo cuando se encienda el piloto rojo de la cámara.</p><button type="button" class="db-tally" data-tally aria-label="Mira a cámara"><i></i></button><p class="db-qte-r" data-r></p></div>`;
    const btn = $("[data-tally]", panel);
    const win = 650 + st.prep.camera * 180;
    let lit = 0, done = false;
    const finish = (hit, msg) => { if (done) return; done = true; $("[data-r]", panel).textContent = msg; Sfx.play(hit ? "ok" : "ko"); btn.disabled = true; ctx.after(900, () => res(hit)); };
    ctx.after(1100 + Math.random() * 1600, () => {
      if (done) return;
      lit = performance.now(); btn.classList.add("on");
      ctx.after(win, () => { btn.classList.remove("on"); finish(false, "Demasiado tarde: has mirado a la cámara equivocada."); });
    });
    btn.addEventListener("click", () => {
      if (!lit) return finish(false, "Demasiado pronto: todavía no era tu cámara.");
      finish(performance.now() - lit <= win, "Perfecto: miras a cámara, directo a casa de cada votante.");
    });
  });
}

// ---------- 5. Resultat ----------
function dbFinish(G) {
  const { st, ctx, T } = G;
  const res = dbResult(st);
  const lessons = dbLessons(st, res);
  const am = dbAftermath(st, res);
  const num = (v, d = 1) => v.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
  G.plato?.dispose();
  T.remove();
  document.body.classList.remove("db-lock");
  if (res.rank === 1) {
    ctx.achieve("debat-guanya");
    if (st.format === "cara") ctx.achieve("debat-cara");
    if (st.format === "set") ctx.achieve("debat-set");
  }
  const segL = { base: "Tus votantes", indecisos: "Indecisos", rivals: "Votantes de los rivales" };
  const max = res.poll[0].pct;
  const extraHtml = `<div class="db-result">
    <h3 class="db-h3">Encuesta flash: ¿quién ha ganado el debate?</h3>
    <ul class="db-poll">${res.poll.map((p) => `<li class="${p.id === "jo" ? "me" : ""}" style="--pc:${p.color}"><span>${esc(p.cand)}<small>${esc(p.sig)}</small></span><span class="db-poll-t"><i style="width:${(p.pct / max) * 100}%"></i></span><b>${String(p.pct).replace(".", ",")} %</b></li>`).join("")}</ul>
    <p class="db-ficha">Encuesta telefónica a ${am.n.toLocaleString("es")} espectadores del debate, hecha al terminar. Margen de error: ±${num(am.moe)} puntos. Ficción.</p>
    <div class="db-after">
      <div class="db-aud"><small>Audiencia</small><b>${num(am.audience.viewers, 2)} millones</b><span>${num(am.audience.share)} % de cuota · ${esc(DB_NET[st.format])}</span></div>
      <div class="db-byseg"><small>Quién gana en cada grupo</small>${am.bySeg.map((g) => `<span><em>${segL[g.k]}</em><b>${g.top.id === "jo" ? "Tú" : esc(dbSurname(g.top.cand))}</b><i>Tú: ${num(g.me)} %</i></span>`).join("")}</div>
    </div>
    <h3 class="db-h3">Las portadas de mañana</h3>
    <div class="db-papers">${am.papers.map((p) => `<article class="db-paper"><small>${esc(p.paper)}</small><b>${esc(p.h)}</b></article>`).join("")}</div>
    ${am.facts.length ? `<h3 class="db-h3">Verificación de la noche</h3><ul class="db-facts">${am.facts.map((x) => `<li class="${x.ok ? "ok" : "ko"}"><span class="db-fact-tag">${x.ok ? "Cierto" : "Falso"}</span><span><b>${esc(x.who)}:</b> «${esc(x.t)}» <small>${esc(x.exp)} ${!x.ok && x.you === "fals" ? "Lo has corregido en directo." : !x.ok ? "No lo has corregido." : x.you === "fals" ? "Lo has dado por falso, y no lo era." : ""}</small></span></li>`).join("")}</ul>` : ""}
    <h3 class="db-h3">El minutaje</h3>
    <ul class="db-clockres">${am.clock.map((c) => `<li class="${c.id === "jo" ? "me" : ""}"><span>${esc(c.cand)}</span><b>${c.left > 0 ? `le han sobrado ${dbClock(c.left)}` : "ha agotado el tiempo"}</b></li>`).join("")}</ul>
    <div class="db-res-grid">
      <div><small>Efecto en el voto</small><b class="${res.vote >= 0 ? "up" : "down"}">${res.vote >= 0 ? "+" : ""}${String(res.vote).replace(".", ",")} puntos</b></div>
      ${Object.keys(segL).map((k) => `<div><small>${segL[k]}</small><b>${Math.round(res.seg[k])}/100</b></div>`).join("")}
    </div>
    ${res.best ? `<p class="db-moment good"><b>Tu mejor momento</b>${esc(res.best.text)}</p>` : ""}
    ${res.worst ? `<p class="db-moment bad"><b>El momento que querrías borrar</b>${esc(res.worst.text)}</p>` : ""}
    <h3 class="db-h3">Qué aprendes</h3>
    <ul class="db-lessons">${lessons.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
    <p class="db-fiction">${DB_DISCLAIMER}</p>
  </div>`;
  ctx.finish({
    score: res.score, xp: res.xp, extraHtml,
    unit: `puntos · ${DB_FORMATS[st.format].title.toLowerCase()}`,
    ratio: res.rank === 1 ? 0.8 : res.rank === 2 ? 0.55 : 0.3,
    verdict: res.rank === 1 ? "¡Has ganado el debate! La encuesta flash te da como vencedor." : res.rank === 2 ? "Segundo en la encuesta flash: has competido de tú a tú." : `Quedas ${res.rank}.º en la encuesta flash. Hay margen para mejorar.`,
  });
}
