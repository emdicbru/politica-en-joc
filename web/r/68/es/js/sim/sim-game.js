// Simulador del 29N · El joc dins de l'app: registre, creació del partit, campanya, debats, jornada de reflexió,
// nit electoral i resultat final. La negociació, la investidura i la legislatura són a sim-gov.js.
// El motor (sim-engine.js) fa tots els càlculs; aquí només es dibuixen les pantalles i s'encadenen les fases.

// Cada idioma té la seva partida: els textos de la partida (diari, propostes…) es desen en l'idioma en què es juga
const SIM_SAVE_KEY = PEJ_LANG === "es" ? "r29n-sim-save-es" : "r29n-sim-save";
const SIM_PREFS_KEY = "r29n-sim-prefs";

// Partida desada al dispositiu: només una, amb versió d'esquema. Si l'esquema ha canviat, es descarta amb un avís.
const SimSave = {
  get() {
    const s = store.get(SIM_SAVE_KEY, null);
    if (!s) return null;
    if (s.v !== SIM_VERSION || !s.state?.me) {
      this.clear();
      toast("La partida guardada era de una versión anterior del simulador y se ha descartado");
      return null;
    }
    return s;
  },
  peek() { const s = store.get(SIM_SAVE_KEY, null); return s && s.v === SIM_VERSION && s.state?.me ? s : null; },
  set(state) { store.set(SIM_SAVE_KEY, { v: SIM_VERSION, at: Date.now(), state }); },
  clear() { try { localStorage.removeItem(SIM_SAVE_KEY); } catch { /* sense emmagatzematge */ } },
};
const SimPrefs = { get: () => store.get(SIM_PREFS_KEY, {}), set(k, v) { store.set(SIM_PREFS_KEY, { ...this.get(), [k]: v }); } };
// Opcions triades a la portada del joc
const SimOpts = { mode: "express", diff: "normal", resume: false, duel: null };
const SIM_MODES = [
  { k: "express", title: "Campaña exprés", text: "Funda un partido, haz seis días de campaña y vive la noche electoral.", mins: "10 min" },
  { k: "govern", title: "Del voto al gobierno", text: "Campaña, noche electoral, negociación de pactos e investidura.", mins: "25 min" },
  { k: "legislatura", title: "Legislatura", text: "Todo lo anterior y cuatro años de gobierno o de oposición, hasta las elecciones siguientes.", mins: "40 min" },
];
document.addEventListener("change", (e) => {
  if (e.target.name === "sim-mode") SimOpts.mode = e.target.value;
  if (e.target.name === "sim-diff") SimOpts.diff = e.target.value;
});
// Si es surt del joc sense començar el duel, la propera partida ja no és de duel
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#joc/simulador")) SimOpts.duel = null; });
// Enllaços que obren el simulador amb un mode triat (p. ex. des de l'Aprèn)
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("[data-sim-mode]");
  if (a && SIM_MODE_INFO[a.dataset.simMode]) { SimOpts.mode = a.dataset.simMode; SimOpts.duel = null; }
});


// Noms de partits reals i paraules ofensives: el simulador només admet partits inventats
const SIM_REAL = new Set(["frente amplio", "fa", "se acabo la fiesta", "bloque nacionalista galego", "euskal herria bildu", "partido nacionalista vasco", "psoe", "pp", "vox", "sumar", "podemos", "erc", "junts", "pnv", "eajpnv", "eaj pnv", "bildu", "eh bildu", "bng", "cc", "upn", "cup", "comuns", "psc", "cs", "ciudadanos", "ciutadans", "ac", "alianca catalana", "salf", "compromis", "mes", "iu", "izquierda unida", "mas pais", "partido popular", "partit popular", "partido socialista", "partit socialista", "esquerra republicana", "junts per catalunya", "coalicion canaria", "teruel existe", "upyd", "cdc", "ciu", "pdecat"]);
const SIM_BAD = ["puta", "puto", "merda", "cabron", "cabro", "fill de", "nazi", "polla", "cony", "cono", "subnormal", "maricon", "marica", "negrata", "mierda", "gilipolles", "gilipollas", "idiota"];
const simNorm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const simBadWord = (s) => { const n = ` ${simNorm(s)} `; return SIM_BAD.some((w) => n.includes(` ${w} `) || n.includes(` ${w}`)); };
const SIM_MOTTOS = ["Ahora toca", "Hagámoslo posible", "La gente primero", "Adelante, juntos", "Un país que funcione", "Sin miedo", "Con los pies en el suelo", "El futuro es hoy"];

// =========================================================
// Registre del joc
// =========================================================
registerGame({
  id: "simulador",
  cat: "parlament",
  hidden: true, // té la seva pròpia secció (#simulador) a la barra de navegació
  autostart: true,
  backHref: "#simulador",
  backLabel: "Vuelve a los simuladores",
  tagline: "Funda un partido, haz campaña, negocia pactos y gobierna.",
  kicker: "De la calle a la Moncloa",
  title: "Simulador del 29N",
  level: 3,
  meta: "De 10 a 40 minutos",
  icon: icon(`<path d="M3 11l14-6v14L3 13z"/><path d="M17 8a4 4 0 010 8"/><path d="M6 13l1.5 6h3L9 14"/>`),
  desc: "Funda tu partido y compite con los partidos reales. Haz campaña en las 52 circunscripciones, vive la noche electoral, negocia una mayoría, supera la investidura y gobierna cuatro años. Las reglas son las reales: ley D'Hondt, umbral del 3 %, mayoría de 176.",
  rules: ["Partidos reales", "Reglas reales", "4 modos", "Se guarda solo"],
  recordRows() {
    return SIM_MODES.map((m) => ({ label: m.title, value: Progress.data.best[`simulador-${m.k}`] }));
  },
  start(ctx) {
    // En un duel, si hi ha una campanya a mitges del mateix duel, es reprèn
    const dsave = SimOpts.duel ? SimSave.get() : null;
    const save = SimOpts.resume ? SimSave.get() : dsave?.state.duel === SimOpts.duel?.code ? dsave : null;
    SimOpts.resume = false;
    const G = { ctx, state: save ? save.state : null, sel: null, map: "aw" };
    if (G.state) return simGo(G);
    if (SimOpts.duel) return simDuelIntro(G);
    simCreate(G);
  },
});

const simSave = (G) => SimSave.set(G.state);
// Modes que acaben a la nit electoral
const simShortMode = (s) => ["express", "duel"].includes(s.mode);
function simStageLabel(s) {
  const st = s.stage || "";
  if (st.startsWith("leg")) return `legislatura, trimestre ${Math.min(8, (s.leg?.q || 0) + 1)} de 8`;
  if (st.startsWith("gov") || st === "report") return "negociación de investidura";
  if (st === "night") return "noche electoral";
  if (st === "reflection") return "jornada de reflexión";
  return `${s.round === 2 ? "segunda campaña, " : ""}día ${Math.min(s.day, s.days)} de ${s.days}`;
}

// Cada pantalla es pot reprendre a partir de l'estat desat
function simGo(G) {
  const st = G.state.stage;
  const screens = {
    debate: simDebateScreen, event: simEventScreen, media: simMediaScreen, reflection: simReflection, night: simNight, report: simElectionReportScreen,
    "gov-consult": simGovConsult, "gov-neg": simGovNegotiate, "gov-support": simGovSupport, "gov-vote": simGovVote, "gov-outcome": simGovOutcome,
    "leg-card": simLegCardScreen, "leg-bill": simLegBillScreen, "leg-end": simLegQuarterScreen, "leg-over": simLegOver,
  };
  return (screens[st] || simCampaign)(G);
}

// =========================================================
// 1. Creació del partit
// =========================================================
function simCreate(G) {
  const { ctx } = G;
  const rnd = Math.floor(Math.random() * SIM_PARTY_NAMES.length);
  const P = {
    name: SIM_PARTY_NAMES[rnd], sig: "", color: SIM_COLORS[rnd % SIM_COLORS.length], shape: "cercle", motto: SIM_MOTTOS[rnd % SIM_MOTTOS.length],
    eco: 5, ter: 4.5, val: 5, prio: [], attrs: { car: 3, sol: 3, prox: 3 },
  };
  let sigTouched = false;
  const autoSig = (n) => {
    const caps = n.split(/\s+/).filter((w) => /^[A-ZÀ-ÚÇ]/.test(w)).map((w) => w[0]).join("");
    return (caps.length >= 2 ? caps : n.replace(/\s+/g, "").slice(0, 3)).toUpperCase().slice(0, 6);
  };
  P.sig = autoSig(P.name);
  const STEPS = ["Identidad", "Programa", "Prioridades", "Liderazgo", "Lista"];
  ctx.hud([["pas", "Paso", `1/${STEPS.length}`]]);
  const shell = (k, inner) => `<div class="sim-wrap">
    <ol class="sim-steps">${STEPS.map((s, i) => `<li class="${i < k ? "done" : i === k ? "on" : ""}"><i>${i + 1}</i><span>${s}</span></li>`).join("")}</ol>
    ${inner}</div>`;

  step1();

  function step1() {
    ctx.setHud("pas", `1/${STEPS.length}`);
    const el = simMount(G, shell(0, `<div class="card sim-card sim-create">
      <div class="sim-create-main">
        <p class="sim-kick">Paso 1 · Identidad</p>
        <h3 class="sim-h">Funda tu partido</h3>
        <label class="sim-field"><span>Nombre del partido</span><input data-name maxlength="28" autocomplete="off" value="${esc(P.name)}"></label>
        <div class="sim-names">${SIM_PARTY_NAMES.slice(0, 12).map((n) => `<button type="button" class="sim-chipbtn" data-pick="${esc(n)}">${esc(n)}</button>`).join("")}</div>
        <div class="sim-field-row">
          <label class="sim-field sim-field-s"><span>Siglas</span><input data-sig maxlength="6" autocomplete="off" value="${esc(P.sig)}"></label>
          <label class="sim-field"><span>Lema</span><input data-motto maxlength="40" autocomplete="off" value="${esc(P.motto)}"></label>
        </div>
        <div class="sim-field"><span>Color</span><div class="sim-swatches">${SIM_COLORS.map((c) => `<button type="button" class="sim-sw ${c === P.color ? "on" : ""}" style="--pc:${c}" data-c="${c}" aria-label="Color ${c}" aria-pressed="${c === P.color}"></button>`).join("")}</div></div>
        <div class="sim-field"><span>Forma del logo</span><div class="sim-shapes">${Object.entries(SIM_SHAPES).map(([k, l]) => `<button type="button" class="sim-shape ${k === P.shape ? "on" : ""}" data-shape="${k}" aria-label="${l}" aria-pressed="${k === P.shape}"><svg viewBox="0 0 100 100"><g fill="currentColor">${simShapePath(k)}</g></svg></button>`).join("")}</div></div>
        <p class="sim-err" data-err role="alert"></p>
      </div>
      <div class="sim-create-prev"><div class="sim-poster" data-poster></div></div>
      <div class="sim-actions-row"><button class="btn primary lg" data-next>Siguiente: el programa</button></div>
    </div>`));
    const nameI = $("[data-name]", el), sigI = $("[data-sig]", el), mottoI = $("[data-motto]", el), err = $("[data-err]", el);
    const poster = () => {
      $("[data-poster]", el).innerHTML = `${simLogoSvg(P, 92)}<b>${esc(P.name || "…")}</b><i>${esc(P.motto ? `«${P.motto}»` : "")}</i><small>${esc(P.sig)} · Elecciones generales · 29N</small>`;
      $("[data-poster]", el).style.setProperty("--pc", P.color);
    };
    poster();
    const setName = (v) => { P.name = v; err.textContent = ""; if (!sigTouched) { P.sig = autoSig(P.name.trim()); sigI.value = P.sig; } poster(); };
    nameI.addEventListener("input", () => setName(nameI.value));
    $$("[data-pick]", el).forEach((b) => b.addEventListener("click", () => { nameI.value = b.dataset.pick; setName(b.dataset.pick); Sfx.play("pick"); }));
    sigI.addEventListener("input", () => { sigTouched = true; P.sig = sigI.value.toUpperCase().replace(/[^A-ZÀ-ÚÇ0-9]/g, ""); sigI.value = P.sig; err.textContent = ""; poster(); });
    mottoI.addEventListener("input", () => { P.motto = mottoI.value; err.textContent = ""; poster(); });
    $$(".sim-sw", el).forEach((b) => b.addEventListener("click", () => {
      P.color = b.dataset.c; Sfx.play("pick");
      $$(".sim-sw", el).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); poster();
    }));
    $$(".sim-shape", el).forEach((b) => b.addEventListener("click", () => {
      P.shape = b.dataset.shape; Sfx.play("pick");
      $$(".sim-shape", el).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); poster();
    }));
    $("[data-next]", el).addEventListener("click", () => {
      P.name = P.name.trim().replace(/\s+/g, " "); P.sig = P.sig.trim(); P.motto = P.motto.trim().replace(/\s+/g, " ");
      if (P.name.length < 3) { err.textContent = "El nombre debe tener como mínimo tres letras."; return nameI.focus(); }
      if (P.sig.length < 2) { err.textContent = "Las siglas deben tener de 2 a 6 letras."; return sigI.focus(); }
      if (SIM_REAL.has(simNorm(P.name)) || SIM_REAL.has(simNorm(P.sig))) { err.textContent = "Elige un nombre inventado: en el simulador solo hay partidos ficticios."; return nameI.focus(); }
      if (simBadWord(P.name) || simBadWord(P.sig) || simBadWord(P.motto)) { err.textContent = "Elige un nombre y un lema sin palabras ofensivas."; return nameI.focus(); }
      Sfx.play("pick");
      step2(0);
    });
  }

  function step2(k) {
    ctx.setHud("pas", `2/${STEPS.length}`);
    if (k === 0) { P.eco = 5; P.ter = 4.5; P.val = 5; }
    if (k >= SIM_DILEMMAS.length) return step2Done();
    const d = SIM_DILEMMAS[k];
    const el = simMount(G, shell(1, `<div class="card sim-card sim-dil">
      <div class="sim-dil-main">
        <p class="sim-kick">Paso 2 · Programa · dilema ${k + 1} de ${SIM_DILEMMAS.length}</p>
        <h3 class="sim-h">${d.q}</h3>
        <p class="sim-sub">¿Qué defenderá tu partido?</p>
        <div class="sim-dil-opts">${d.a.map((a, i) => `<button class="sim-opt" data-o="${i}"><i>${"AB"[i]}</i>${a.t}</button>`).join("")}</div>
        <button class="btn ghost sim-dil-skip" data-o="-1">Ninguna de las dos: posición intermedia</button>
      </div>
      <div class="sim-dil-side">${simCompass({ ...P })}${simTerBar({ ...P })}</div>
    </div>`));
    $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
      const o = Number(b.dataset.o);
      if (o >= 0) Object.entries(d.a[o].d).forEach(([ax, v]) => { P[ax] = Math.max(0.5, Math.min(9.5, P[ax] + v)); });
      Sfx.play("pick");
      step2(k + 1);
    }));
  }

  function step2Done() {
    const near = [...SIM_RIVALS].sort((a, b) => simDist(a, P) - simDist(b, P))[0];
    const el = simMount(G, shell(1, `<div class="card sim-card sim-dil">
      <div class="sim-dil-main">
        <p class="sim-kick">Paso 2 · Programa</p>
        <h3 class="sim-h">Este es tu espacio</h3>
        <div class="sim-ideo">
          <div><small>Economía</small><b>${simAxis.eco(P.eco)}</b></div>
          <div><small>Modelo territorial</small><b>${simAxis.ter(P.ter)}</b></div>
          <div><small>Valores</small><b>${simAxis.val(P.val)}</b></div>
        </div>
        <p class="sim-sub">El partido más cercano es <b style="color:${near.color}">${near.name}</b>. ${simDist(near, P) < 2 ? "Competiréis por los mismos votantes: habrá que diferenciarse." : "Tenéis suficiente distancia para no pisaros demasiado."}</p>
        <p class="sim-note">Son los mismos tres ejes que usa el <a href="#apren/partits">comparador de partidos</a> de Aprende.</p>
        <div class="sim-actions-row"><button class="btn ghost" data-redo>Vuelve a hacer el programa</button><button class="btn primary lg" data-next>Siguiente: prioridades</button></div>
      </div>
      <div class="sim-dil-side">${simCompass({ ...P })}${simTerBar({ ...P })}</div>
    </div>`));
    $("[data-redo]", el).addEventListener("click", () => step2(0));
    $("[data-next]", el).addEventListener("click", () => { Sfx.play("pick"); step3(); });
  }

  function step3() {
    ctx.setHud("pas", `3/${STEPS.length}`);
    const el = simMount(G, shell(2, `<div class="card sim-card">
      <p class="sim-kick">Paso 3 · Prioridades</p>
      <h3 class="sim-h">Elige tres temas estrella</h3>
      <p class="sim-sub">Serán el centro de tu programa. Cada tipo de votante da importancia a temas diferentes: los jóvenes miran la vivienda, las personas mayores las pensiones…</p>
      <div class="sim-themes">${SIM_THEMES.map((t, i) => `<button class="sim-theme ${P.prio.includes(i) ? "on" : ""}" data-t="${i}" aria-pressed="${P.prio.includes(i)}">${t.label}</button>`).join("")}</div>
      <div class="sim-actions-row"><span class="sim-count" data-count></span><button class="btn primary lg" data-next>Siguiente: liderazgo</button></div>
    </div>`));
    const sync = () => {
      $$(".sim-theme", el).forEach((b) => { const on = P.prio.includes(Number(b.dataset.t)); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      $("[data-count]", el).textContent = `${P.prio.length} de 3`;
      $("[data-next]", el).disabled = P.prio.length !== 3;
    };
    sync();
    $$(".sim-theme", el).forEach((b) => b.addEventListener("click", () => {
      const t = Number(b.dataset.t);
      if (P.prio.includes(t)) P.prio = P.prio.filter((x) => x !== t);
      else if (P.prio.length < 3) P.prio.push(t);
      else { P.prio.shift(); P.prio.push(t); }
      Sfx.play("pick"); sync();
    }));
    $("[data-next]", el).addEventListener("click", () => { Sfx.play("pick"); step4(); });
  }

  function step4() {
    ctx.setHud("pas", `4/${STEPS.length}`);
    const ATTRS = [
      { k: "car", t: "Carisma", d: "Pesa en los debates y en la imagen del líder." },
      { k: "sol", t: "Solvencia", d: "Hace que las entrevistas salgan bien más a menudo." },
      { k: "prox", t: "Proximidad", d: "Hace más efectivos los mítines en las circunscripciones." },
    ];
    const el = simMount(G, shell(3, `<div class="card sim-card">
      <p class="sim-kick">Paso 4 · Liderazgo</p>
      <h3 class="sim-h">¿Cómo es tu candidato?</h3>
      <label class="sim-field"><span>Nombre del candidato o la candidata (opcional)</span><input data-leader maxlength="32" autocomplete="off" placeholder="Un nombre inventado" value="${esc(P.leader || "")}"></label>
      <p class="sim-err" data-lerr role="alert"></p>
      <p class="sim-sub">Reparte 9 puntos. Nadie lo hace todo bien: hay que elegir.</p>
      <div class="sim-attrs">${ATTRS.map((a) => `<div class="sim-attr" data-a="${a.k}">
        <div><b>${a.t}</b><small>${a.d}</small></div>
        <div class="sim-attr-ctl"><button class="sim-pm" data-d="-1" aria-label="Menos ${a.t}">−</button><span class="sim-pips" aria-live="polite"></span><button class="sim-pm" data-d="1" aria-label="Más ${a.t}">+</button></div>
      </div>`).join("")}</div>
      <div class="sim-actions-row"><span class="sim-count" data-left></span><button class="btn primary lg" data-next>Siguiente: resumen</button></div>
    </div>`));
    const sync = () => {
      const left = 9 - P.attrs.car - P.attrs.sol - P.attrs.prox;
      $$(".sim-attr", el).forEach((row) => {
        const v = P.attrs[row.dataset.a];
        $(".sim-pips", row).innerHTML = [1, 2, 3, 4, 5].map((n) => `<i class="${n <= v ? "on" : ""}"></i>`).join("") + `<span class="sr-only">${v} de 5</span>`;
        $("[data-d='-1']", row).disabled = v <= 1;
        $("[data-d='1']", row).disabled = v >= 5 || left <= 0;
      });
      $("[data-left]", el).textContent = left ? `Te quedan ${left} ${left === 1 ? "punto" : "puntos"}` : "Todos los puntos repartidos";
      $("[data-next]", el).disabled = left !== 0;
    };
    sync();
    $$(".sim-pm", el).forEach((b) => b.addEventListener("click", () => {
      const k = b.closest(".sim-attr").dataset.a;
      P.attrs[k] += Number(b.dataset.d);
      Sfx.play("tick"); sync();
    }));
    $("[data-next]", el).addEventListener("click", () => {
      P.leader = $("[data-leader]", el).value.trim().replace(/s+/g, " ");
      const realNames = PARTIES.flatMap((p) => [p.cand?.name, p.leader?.name]).filter(Boolean).map(simNorm);
      if (P.leader && (realNames.includes(simNorm(P.leader)) || simBadWord(P.leader))) { $("[data-lerr]", el).textContent = "Tu candidato debe tener un nombre inventado."; return; }
      Sfx.play("pick"); step5();
    });
  }

  function step5() {
    ctx.setHud("pas", `5/${STEPS.length}`);
    const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const state = simNewGame({ seed, mode: SimOpts.mode, diff: SimOpts.diff, party: P });
    simSummary(G, state, shell(4, ""), () => step1());
  }
}

// Resum abans de començar (creació pròpia o partit del dia)
function simSummary(G, state, head, back) {
  state.me.shape = state.me.shape || "cercle";
  state.goal = Math.max(3, Math.round(simPotential(state) * 0.95));
  const P = state.me, D = SIM_DIFF[state.diff];
  const el = simMount(G, `${head.replace(/<\/div>$/, "")}<div class="card sim-card sim-summary">
      <div class="sim-poster big" style="--pc:${P.color}">${simLogoSvg(P, 96)}<b>${esc(P.name)}</b><i>${esc(P.motto ? `«${P.motto}»` : "")}</i><small>${simAxis.eco(P.eco)} · ${simAxis.ter(P.ter)} · ${simAxis.val(P.val)}</small></div>
      <div class="sim-sum-body">
        <p class="sim-kick">${state.mode === "duel" ? "Duelo de campaña" : "Paso 5 · La lista está lista"}</p>
        <h3 class="sim-h">Objetivo: ${state.goal} escaños</h3>
        <p class="sim-sub">Es lo que la dirección del partido cree que puedes sacar si te das a conocer en todas partes. Ahora casi nadie os conoce: solo un ${Math.round(D.aw * 100)} % del electorado sabe quiénes sois.</p>
        <ul class="sim-sum-list">
          <li><b>Modo</b><span>${SIM_MODE_INFO[state.mode].label} · unos ${SIM_MODE_INFO[state.mode].mins} minutos</span></li>
          <li><b>Temas estrella</b><span>${P.prio.map((i) => SIM_THEMES[i].label).join(" · ")}</span></li>
          <li><b>Candidato</b><span>${P.leader ? `${esc(P.leader)} · ` : ""}Carisma ${P.attrs.car} · Solvencia ${P.attrs.sol} · Proximidad ${P.attrs.prox}</span></li>
          <li><b>Rivales</b><span>${SIM_RIVALS.length} partidos reales con sus candidatos</span></li>
          <li><b>Presupuesto</b><span>${D.money} unidades + 6 por día de aportaciones</span></li>
          <li><b>Dificultad</b><span>${D.label}</span></li>
        </ul>
        <div class="sim-actions-row">${back ? `<button class="btn ghost" data-back>Cambia el partido</button>` : ""}<button class="btn primary lg" data-go>Empieza la campaña</button></div>
      </div>
    </div></div>`);
  $("[data-back]", el)?.addEventListener("click", back);
  $("[data-go]", el).addEventListener("click", () => {
    if (SimSave.peek() && !confirm("Tienes una partida a medias. Si empiezas una nueva, se perderá. ¿Quieres continuar?")) return;
    const first = simPoll(state);
    state.polls.push({ ...first, day: 0 });
    state.stage = "campaign";
    state.round = 1;
    G.state = state;
    simSave(G);
    Sfx.play("win");
    simCampaign(G);
  });
}

// Duel de campanya: la sala de duels (online.js) hi entra amb el codi i la llavor del duel
function simStartDuel(code, d, rival) {
  SimOpts.duel = { code, seed: `duel-${d.seed}`, rival: rival || null };
  simLaunch();
}
// Obre el joc (des de la secció del simulador, d'un duel o d'un enllaç)
function simLaunch() {
  if (location.hash === "#joc/simulador") { endSession(); openGame(gameById("simulador")); }
  else location.hash = "#joc/simulador";
}

// =========================================================
// La secció del simulador a la barra de navegació
// =========================================================
// Els dos simuladors, amb el mateix pes: a la secció Simuladors i a l'inici
function simDuoHtml(where) {
  const save = SimSave.peek();
  const recs = SIM_MODES.map((m) => Progress.data.best[`simulador-${m.k}`]).filter((x) => x !== undefined);
  const elBest = recs.length ? Math.max(...recs) : undefined;
  const dbBest = Progress.data.best.debat;
  const rec = (b) => `<span class="simcard-rec">${b !== undefined ? `Récord: ${fmt(b)} puntos` : "Sin récord"}</span>`;
  const elGo = where === "home"
    ? `${save ? `<button class="btn primary" type="button" data-sim-cont>Continúa la partida</button>` : ""}<a class="btn ${save ? "" : "primary"}" href="#simulador">${save ? "Otros modos" : "Juega"}</a>`
    : `${save ? `<button class="btn primary" type="button" data-sim-cont>Continúa la partida</button>` : ""}<button class="btn ${save ? "" : "primary"}" type="button" data-sim-scroll>Elige el modo ↓</button>`;
  return `<div class="simduo">
    <article class="simcard simcard-el">
      <div class="simcard-art" aria-hidden="true">${ART.simulador ? ART.simulador() : ""}</div>
      <div class="simcard-b">
        <p class="simcard-k">Simulador electoral</p>
        <h3>De la calle a la Moncloa</h3>
        <p>Funda tu partido y compite con los partidos reales: campaña en las 52 circunscripciones, noche electoral, pactos y gobierno.</p>
        <ul class="simcard-facts"><li>Ley D'Hondt real</li><li>4 modos</li><li>15–40 min</li></ul>
        ${save ? `<p class="simcard-save">${simLogoSvg(save.state.me, 24)}<span>Partida a medias con <b>${esc(save.state.me.name)}</b></span></p>` : rec(elBest)}
        <div class="simcard-go">${elGo}</div>
      </div>
    </article>
    <article class="simcard simcard-db">
      <div class="simcard-art" aria-hidden="true"><span class="db-pod a"></span><span class="db-pod b"></span><span class="db-pod c"></span><span class="db-promo-led">DEBATE 29N</span></div>
      <div class="simcard-b">
        <p class="simcard-k">Simulador de debate</p>
        <h3>Planta cara a los candidatos</h3>
        <p>Crea tu candidato y debate en un plató de televisión en 3D: interrupciones, datos falsos, preguntas trampa y el minuto de oro.</p>
        <ul class="simcard-facts"><li>Plató en 3D</li><li>4 formatos</li><li>10 min</li></ul>
        ${rec(dbBest)}
        <div class="simcard-go"><a class="btn primary" href="#joc/debat">Entra en el plató 🎬</a></div>
      </div>
    </article>
  </div>`;
}
function simDuoBind(root) {
  $("[data-sim-cont]", root)?.addEventListener("click", () => { SimOpts.resume = true; SimOpts.duel = null; Sfx.play("pick"); simLaunch(); });
  $("[data-sim-scroll]", root)?.addEventListener("click", () => $("#sim-config")?.scrollIntoView({ behavior: "smooth", block: "start" }));
}
// La pestanya Simuladors: el primer que es veu són els dos simuladors, cadascun amb el seu botó per jugar.
// A sota, les opcions del simulador electoral (mode i dificultat) i com funcionen, plegats.
function renderSimHome(arg) {
  const root = $("#sim-home");
  if (!root) return;
  const save = SimSave.get();
  const best = (k) => Progress.data.best[`simulador-${k}`];
  const recs = SIM_MODES.map((m) => best(m.k)).filter((x) => x !== undefined);
  const elBest = recs.length ? Math.max(...recs) : undefined;
  const dbBest = Progress.data.best.debat;
  const rec = (b) => (b !== undefined ? `<span class="simcard-rec">Récord: ${fmt(b)} puntos</span>` : "");
  const modeName = () => SIM_MODES.find((m) => m.k === SimOpts.mode)?.title || "";
  const diffName = () => SIM_DIFF[SimOpts.diff]?.label || "";

  root.innerHTML = `<div class="sim-home sh2">
    <header class="sh2-head">
      <h1 class="page-title">Simuladores</h1>
      <p>Vive las elecciones desde dentro, con las reglas de verdad.</p>
    </header>
    <div class="sh2-cards">
      <article class="sh2-card sh2-el">
        <div class="sh2-art" aria-hidden="true">${ART.simulador ? ART.simulador() : ""}</div>
        <div class="sh2-b">
          <p class="simcard-k">Simulador electoral</p>
          <h2>Gana las elecciones</h2>
          <p class="sh2-d">Funda un partido y compite con los reales: campaña, noche electoral, pactos y gobierno.</p>
          ${save ? `<button class="btn primary lg sh2-play" type="button" data-sim-cont>▶ Continúa la partida</button>
            <p class="sh2-meta">${simLogoSvg(save.state.me, 20)} ${esc(save.state.me.name)} · ${simStageLabel(save.state)} · <button class="linklike" type="button" data-sim-go>o empieza una nueva</button></p>`
            : `<button class="btn primary lg sh2-play" type="button" data-sim-go>▶ Juega ahora</button>
            <p class="sh2-meta"><span data-sim-sel>${modeName()} · ${diffName()}</span> · <button class="linklike" type="button" data-sim-opts>cámbialo</button></p>`}
          ${rec(elBest)}
        </div>
      </article>
      <article class="sh2-card sh2-db">
        <div class="sh2-art" aria-hidden="true"><span class="db-pod a"></span><span class="db-pod b"></span><span class="db-pod c"></span><span class="db-promo-led">DEBATE 29N</span></div>
        <div class="sh2-b">
          <p class="simcard-k">Simulador de debate</p>
          <h2>Gana el debate</h2>
          <p class="sh2-d">Crea tu candidato y planta cara a los demás en un plató de televisión en 3D.</p>
          <a class="btn primary lg sh2-play" href="#joc/debat">🎬 Entra en el plató</a>
          <p class="sh2-meta">4 formatos de debate · unos 10 minutos</p>
          ${rec(dbBest)}
        </div>
      </article>
    </div>

    <section class="sh2-opts" id="sim-config">
      <h2 class="section-title sm">Opciones del simulador electoral</h2>
      <div class="sim-modecards" role="radiogroup" aria-label="Modo de juego">${SIM_MODES.map((m) => `
        <button type="button" class="sim-modecard ${m.k === SimOpts.mode ? "on" : ""}" role="radio" aria-checked="${m.k === SimOpts.mode}" data-mode="${m.k}">
          <span class="sim-mc-top"><b>${m.title}</b><em>${m.mins}</em></span>
          <small>${m.text}</small>
          <span class="sim-mc-rec">${best(m.k) !== undefined ? `Récord: ${fmt(best(m.k))} puntos` : "Sin récord"}</span>
        </button>`).join("")}</div>
      <div class="sh-go">
        <div class="sim-diffs" role="radiogroup" aria-label="Dificultad"><span>Dificultad</span>${Object.entries(SIM_DIFF).map(([k, d]) => `
          <label><input type="radio" name="sim-diff" value="${k}" ${k === SimOpts.diff ? "checked" : ""}><span>${d.label}</span></label>`).join("")}</div>
        <button class="btn primary" type="button" data-sim-go>${save ? "Empieza una partida nueva" : "▶ Juega con estas opciones"}</button>
      </div>
      <p class="sim-diffnote">También puedes jugar un duelo de campaña contra un amigo, desde <a href="#duel">Social</a>.</p>
    </section>

    <details class="sh-how">
      <summary>Cómo funciona el simulador electoral</summary>
      <ol class="sim-howto">
        <li><b>Funda el partido</b><span>Nombre, color, logo, programa a partir de ocho dilemas, tres prioridades y un candidato.</span></li>
        <li><b>Haz campaña</b><span>Mítines, redes, entrevistas, debates e imprevistos durante seis días, con encuestas del juego.</span></li>
        <li><b>Noche electoral</b><span>El escrutinio por circunscripciones y la ley D'Hondt reparten los 350 escaños.</span></li>
        <li><b>Pactos y gobierno</b><span>Negocia la investidura y, en el modo Legislatura, gobierna ocho trimestres.</span></li>
      </ol>
    </details>
    <details class="sh-how">
      <summary>Cómo funciona el simulador de debate</summary>
      <ol class="sim-howto">
        <li><b>Crea el candidato</b><span>Nombre, partido, aspecto, ideología, tamaño del partido y estilo ante la cámara.</span></li>
        <li><b>Elige el debate</b><span>Cara a cara, a cuatro, a siete o de los partidos pequeños: las invitaciones dependen del tamaño de tu partido.</span></li>
        <li><b>Prepárate</b><span>Reparte tres horas de ensayo entre datos, réplicas y cámara, y elige la estrategia.</span></li>
        <li><b>En el plató</b><span>Responde, replica, detecta datos falsos y aprovecha el minuto de oro. Al final, encuesta flash.</span></li>
      </ol>
    </details>
    <p class="sim-fiction">${SIM_DISCLAIMER}</p>
  </div>`;

  const sel = () => { const s = $("[data-sim-sel]", root); if (s) s.textContent = `${modeName()} · ${diffName()}`; };
  $("[data-sim-cont]", root)?.addEventListener("click", () => { SimOpts.resume = true; SimOpts.duel = null; Sfx.play("pick"); simLaunch(); });
  $("[data-sim-opts]", root)?.addEventListener("click", () => $("#sim-config")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  $$("[data-mode]", root).forEach((b) => b.addEventListener("click", () => {
    SimOpts.mode = b.dataset.mode; Sfx.play("pick");
    $$("[data-mode]", root).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    sel();
  }));
  $$("input[name=sim-diff]", root).forEach((i) => i.addEventListener("change", () => setTimeout(sel)));
  $$("[data-sim-go]", root).forEach((b) => b.addEventListener("click", () => {
    if (save && !confirm("Empezar una partida nueva borrará la que tienes a medias. ¿Continuar?")) return;
    SimOpts.resume = false; SimOpts.duel = null; Sfx.play("pick"); simLaunch();
  }));
  if (arg === "opcions") setTimeout(() => $("#sim-config")?.scrollIntoView({ block: "start" }), 50);
}
function simDuelIntro(G) {
  const D = SimOpts.duel;
  const party = simDailyParty(D.seed);
  const rng = simMulberry(simHash(`${D.seed}|logo`));
  party.shape = Object.keys(SIM_SHAPES)[Math.floor(rng() * 4)];
  party.motto = SIM_MOTTOS[Math.floor(rng() * SIM_MOTTOS.length)];
  const state = simNewGame({ seed: D.seed, mode: "duel", diff: "normal", party });
  state.duel = D.code;
  G.ctx.hud([]);
  simSummary(G, state, `<div class="sim-wrap"><div class="sim-banner">Duelo de campaña${D.rival ? ` contra ${esc(D.rival)}` : ""}: tenéis el mismo partido y el mismo país. Gana quien saque más escaños.</div></div>`, null);
}

// =========================================================
// 2. Campanya
// =========================================================
function simHud(G, bump = "") {
  const s = G.state;
  if (!$("[data-hud='dia']")) G.ctx.hud([["dia", "Día", ""], ["diners", "Dinero", ""], ["cred", "Credibilidad", ""]]);
  G.ctx.setHud("dia", `${Math.min(s.day, s.days)}/${s.days}`, { bump: bump === "dia" });
  G.ctx.setHud("diners", fmt(s.money), { bump: bump === "diners", warn: s.money < 8 });
  G.ctx.setHud("cred", fmt(s.cred), { bump: bump === "cred", warn: s.cred < 40 });
}

function simCampaign(G) {
  const s = G.state;
  if (simPollsHidden()) G.map = "aw";
  simHud(G);
  const el = simMount(G, `<div class="sim-wrap sim-camp">
    <div class="sim-daybar">
      ${simLogoSvg(s.me, 40)}
      <div class="sim-day"><small>${s.round === 2 ? "Campaña de las elecciones siguientes" : `Objetivo: ${s.goal} escaños`}</small><b>Día ${s.day} <span>de ${s.days}</span></b></div>
      <div class="sim-slots" data-slots></div>
      <button class="btn primary" data-endday></button>
    </div>
    <div class="sim-meters" data-meters></div>
    <div class="sim-grid">
      <section class="card sim-mapcard">
        <div class="sim-cardhead sim-maphead"><div><h4>Mapa de campaña</h4><small data-maphelp></small></div>
          ${simPollsHidden() ? "" : `<div class="sim-seg" role="tablist" aria-label="Qué muestra el mapa"><button role="tab" data-map="aw">Notoriedad</button><button role="tab" data-map="poll">Encuesta</button></div>`}</div>
        <div class="sim-mapbox" data-mapbox>${simSpainMap()}</div>
        <label class="sim-provselect"><span>O elígela de la lista</span><select data-provsel><option value="">Circunscripción…</option>${[...SIM_PROVS].sort((a, b) => a.name.localeCompare(b.name, "es")).map((p) => `<option value="${p.i}">${esc(p.name)} · ${p.seats}</option>`).join("")}</select></label>
        <div class="sim-legend" data-legend></div>
      </section>
      <div class="sim-side">
        <section class="card sim-agenda" data-agenda></section>
        <section class="card sim-prov" data-prov aria-live="polite"></section>
        <section class="card sim-acts">
          <h4>Acciones en todo el Estado</h4>
          <div class="sim-act-list" data-acts></div>
          <div class="sim-themepick" data-themes hidden></div>
        </section>
      </div>
    </div>
    <div class="sim-grid2">
      <section class="card sim-pollcard"><div class="sim-cardhead"><h4>Última encuesta del juego</h4><small data-polldate></small></div><div data-poll></div></section>
      <section class="card sim-feed"><div class="sim-cardhead"><h4>Diario de campaña</h4></div><ol data-feed></ol></section>
    </div>
  </div>`);

  const map = $(".sim-map", el);
  const pickProv = (i) => { G.sel = i; Sfx.play("pick"); refresh(); $("[data-prov]", el).scrollIntoView?.({ block: "nearest", behavior: "smooth" }); };
  simMapPick(map, pickProv);
  $("[data-provsel]", el).addEventListener("change", (e) => { if (e.target.value !== "") pickProv(Number(e.target.value)); });
  $$("[data-map]", el).forEach((b) => b.addEventListener("click", () => { G.map = b.dataset.map; Sfx.play("pick"); refresh(); }));

  let armed = false, armTimer = null;
  const endBtn = $("[data-endday]", el);
  endBtn.addEventListener("click", () => {
    const left = 3 - s.slot;
    if (left > 0 && !armed && s.money >= 3) {
      armed = true;
      endBtn.textContent = `¿Seguro? ${left === 1 ? "Queda 1 franja" : `Quedan ${left} franjas`}`;
      endBtn.classList.add("armed");
      armTimer = G.ctx.after(3500, () => { armed = false; refresh(); });
      return;
    }
    clearTimeout(armTimer);
    Sfx.play("pick");
    if ((s.day === 4 && s.days >= 6) || s.day === s.days) { s.stage = "debate"; simSave(G); simDebateScreen(G); }
    else simAfterDay(G, null);
  });

  function act(type, arg = null) {
    const r = simAct(s, type, arg);
    if (!r.ok) { toast(r.msg); Sfx.play("ko"); return; }
    Sfx.play(r.good ? "ok" : "ko");
    if (type === "enquesta") G.map = "poll";
    simSave(G);
    simHud(G, "diners");
    refresh(true);
  }

  function refresh(fresh = false) {
    $("[data-slots]", el).innerHTML = `<small>Franjas de hoy</small><span aria-label="${3 - s.slot} franjas libres">${["Mañana", "Tarde", "Noche"].map((n, k) => `<i class="${k < s.slot ? "used" : ""}" title="${n}"></i>`).join("")}</span>`;
    const meter = (label, val, max, txt, warn) => `<div class="sim-meter ${warn ? "warn" : ""}"><small>${label}</small><b>${txt}</b><span><i style="width:${Math.max(0, Math.min(100, (val / max) * 100))}%"></i></span></div>`;
    $("[data-meters]", el).innerHTML =
      meter("Dinero", s.money, 130, fmt(s.money), s.money < 8) +
      meter("Credibilidad", s.cred, 100, fmt(s.cred), s.cred < 40) +
      meter("Militancia", s.moral, 100, fmt(s.moral), s.moral < 40) +
      meter("Notoriedad", s.awG, 1, `${Math.round(s.awG * 100)} %`, false);

    const poll = s.polls[s.polls.length - 1];
    const est = poll.provs;
    $$("[data-map]", el).forEach((b) => { b.classList.toggle("on", b.dataset.map === G.map); b.setAttribute("aria-selected", b.dataset.map === G.map); });
    $("[data-maphelp]", el).textContent = G.map === "aw" ? "Cuanto más intenso es el color, más gente os conoce. Toca una circunscripción." : `Partido que va primero según la encuesta del ${poll.day === 0 ? "inicio" : `día ${poll.day}`}. Encima, tu posición.`;
    $("[data-legend]", el).innerHTML = G.map === "aw"
      ? `<span>Poco conocidos</span><i class="grad" style="--pc:${s.me.color}"></i><span>Muy conocidos</span><em>★ candidato local · ● mitin · ◆ coalición</em>`
      : [s.me, ...s.rivals].map((p) => `<span class="sim-lg">${simLogo(p)}</span>`).join("") + `<em>El número de arriba: tu posición</em>`;
    const rallies = {};
    s.log.forEach((l) => { if (l.type === "miting") rallies[l.arg] = (rallies[l.arg] || 0) + 1; });
    const coal = s.used.coal || [];
    const ord = (n) => `${n}${n === 1 ? "r" : n === 2 ? "n" : n === 3 ? "r" : "è"}`;
    simPaintMap(map, (i) => {
      const p = SIM_PROVS[i], e = est?.[i];
      const aware = Math.round(simAware(s, i) * 100);
      const label = `${p.name}, ${p.seats} escaños. Os conoce el ${aware} %${e?.rank ? `. Vas ${ord(e.rank)} según la encuesta` : ""}.`;
      if (G.map === "aw") {
        const k = Math.round(simAware(s, i) * 88);
        return { fill: `color-mix(in srgb, ${s.me.color} ${k}%, var(--card))`, ink: k > 52 ? simInk(s.me.color) : "var(--ink)", sel: G.sel === i, label,
          mark: `${s.used.cand.includes(i) ? "★" : ""}${"●".repeat(Math.min(3, rallies[i] || 0))}${coal.includes(p.ccaa) ? "◆" : ""}` };
      }
      const lead = e ? simById(s, e.lead) : null;
      return { fill: lead ? lead.color : SIM_GREY, ink: lead ? simInk(lead.color) : "var(--ink)", sel: G.sel === i, label, mark: e?.rank ? ord(e.rank) : "" };
    });
    $("[data-provsel]", el).value = G.sel === null ? "" : String(G.sel);

    // Agenda d'avui: propostes de mitjans, d'entitats i de rivals
    const offers = s.offers || [];
    $("[data-agenda]", el).innerHTML = `<div class="sim-cardhead"><h4>Agenda de hoy</h4><small>Propuestas que te han llegado. Aceptar una gasta una franja.</small></div>
      ${offers.length ? `<ul class="sim-offers">${offers.map((o) => simOfferRow(s, o)).join("")}</ul>` : `<p class="sim-note">Hoy no te ha llegado ninguna propuesta.</p>`}`;
    $$("[data-acc]", el).forEach((b) => b.addEventListener("click", () => {
      if (s.slot >= 3) { toast("Hoy ya no te quedan franjas"); Sfx.play("ko"); return; }
      Sfx.play("pick");
      s.stage = "media"; s.media = { id: b.dataset.acc };
      simSave(G); simMediaScreen(G);
    }));
    $$("[data-dec]", el).forEach((b) => b.addEventListener("click", () => {
      const r = simDecline(s, b.dataset.dec);
      if (r) { Sfx.play(b.closest("[data-type='cara']") ? "ko" : "pick"); simSave(G); simHud(G, "cred"); refresh(true); }
    }));

    const pv = $("[data-prov]", el);
    if (G.sel === null) {
      pv.innerHTML = `<p class="sim-kick">Circunscripción</p><p class="sim-sub">Elige una circunscripción en el mapa para hacer un mitin, fichar a un candidato local o pactar una coalición. Recuerda: en las provincias pequeñas se reparten pocos escaños y cuesta más entrar.</p>`;
    } else {
      const p = SIM_PROVS[G.sel];
      const w = simSegmentWeights(p);
      const top = SIM_SEGMENTS.map((g) => ({ g, v: w[g.k] })).sort((a, b) => b.v - a.v).slice(0, 3);
      const tag = (v, lo, mid, hi) => (v < 0.35 ? lo : v < 0.65 ? mid : hi);
      const e = est?.[G.sel];
      const errM = simCanAct(s, "miting", G.sel), errC = simCanAct(s, "candidat", G.sel), errK = simCanAct(s, "coalicio", G.sel);
      const pill = !e ? "" : e.won ? `<span class="sim-pill ok">Según la encuesta, sacas ${e.won} ${e.won === 1 ? "escaño" : "escaños"}${e.need === 0 ? " (el último, por pocos votos)" : ""}</span>`
        : `<span class="sim-pill">Vas ${e.rank}${e.rank === 1 ? "r" : e.rank === 2 ? "n" : e.rank === 3 ? "r" : "è"}${e.need !== null ? ` · te faltan ${simNum(e.need)} puntos para un escaño` : ""}</span>`;
      pv.innerHTML = `<div class="sim-prov-head"><div><p class="sim-kick">${esc(p.ccaa)}</p><h4>${esc(p.name)}</h4></div><div class="sim-prov-seats"><b>${p.seats}</b><small>${p.seats === 1 ? "escaño" : "escaños"}</small></div></div>
        ${pill}
        <div class="sim-prov-tags"><span>${tag(p.urb, "Rural", "Mixta", "Urbana")}</span><span>Identidad propia ${tag(p.ter, "baixa", "mitjana", "alta")}</span><span>${tag(p.age, "Población joven", "Edad media", "Población envejecida")}</span></div>
        <p class="sim-prov-aw">Os conoce el <b>${Math.round(simAware(s, G.sel) * 100)} %</b> del electorado · ${fmt(p.pop * SIM_K.census)} electores · ${fmt((p.pop * SIM_K.census) / p.seats)} por escaño</p>
        <p class="sim-prov-seg"><small>Predominan</small>${top.map(({ g, v }) => `<span>${g.label} <b>${Math.round(v * 100)} %</b></span>`).join("")}</p>
        <div class="sim-prov-btns">
          ${simActBtn("miting", errM)}
          ${simActBtn("candidat", errC, s.used.cand.includes(G.sel) ? "Ya tienes uno en esta circunscripción." : null)}
          ${simActBtn("coalicio", errK)}
        </div>`;
      $$("[data-a]", pv).forEach((b) => b.addEventListener("click", () => act(b.dataset.a, G.sel)));
    }

    const acts = $("[data-acts]", el);
    acts.innerHTML = ["xarxes", "tema", "matisar", ...(simPollsHidden() ? [] : ["enquesta"])].map((k) => {
      const err = k === "tema" ? simCanAct(s, "tema", 0) : k === "matisar" ? (["eco", "ter", "val"].every((ax) => simCanAct(s, "matisar", ax)) ? simCanAct(s, "matisar", "eco") : null) : simCanAct(s, k);
      return simActBtn(k, err);
    }).join("");
    $$("[data-a]", acts).forEach((b) => b.addEventListener("click", () => {
      const a = b.dataset.a;
      const box = $("[data-themes]", el);
      if (a === "tema") {
        box.hidden = box.dataset.for === "tema" ? !box.hidden : false;
        box.dataset.for = "tema";
        box.innerHTML = `<small>¿Qué tema quieres reforzar?</small>${SIM_THEMES.map((t, i) => `<button class="sim-theme ${s.me.prio.includes(i) ? "prio" : ""}" data-t="${i}">${t.label}<i style="width:${(s.me.iss[i] / 1.3) * 100}%"></i></button>`).join("")}`;
        $$("[data-t]", box).forEach((x) => x.addEventListener("click", () => { box.hidden = true; act("tema", Number(x.dataset.t)); }));
        return;
      }
      if (a === "matisar") {
        box.hidden = box.dataset.for === "matisar" ? !box.hidden : false;
        box.dataset.for = "matisar";
        box.innerHTML = `<small>¿Qué posición quieres acercar al centro? Cuesta 5 puntos de credibilidad.</small>${Object.entries(SIM_AXES).map(([ax, l]) => `<button class="sim-theme" data-ax="${ax}" ${simCanAct(s, "matisar", ax) ? "disabled" : ""}>${l.charAt(0).toUpperCase() + l.slice(1)} <small>${simAxis[ax](s.me[ax])}</small></button>`).join("")}`;
        $$("[data-ax]", box).forEach((x) => x.addEventListener("click", () => { box.hidden = true; act("matisar", x.dataset.ax); }));
        return;
      }
      box.hidden = true;
      act(a);
    }));

    const polls = s.polls, last = polls[polls.length - 1], prev = polls[polls.length - 2];
    $("[data-polldate]", el).textContent = last.day === 0 ? "Antes de empezar" : `Día ${last.day}`;
    $("[data-poll]", el).innerHTML = simPollBars(s, last, prev);

    const feed = s.log.slice(-7).reverse();
    $("[data-feed]", el).innerHTML = feed.length
      ? feed.map((l, k) => `<li class="${l.good === false ? "bad" : ""} ${fresh && k === 0 ? "fresh" : ""}"><small>Día ${l.day}</small>${esc(l.msg)}</li>`).join("")
      : `<li class="empty">Todavía no has hecho ninguna acción. Tienes 3 franjas cada día: mañana, tarde y noche.</li>`;

    if (!armed) {
      endBtn.classList.remove("armed");
      endBtn.textContent = s.day === s.days ? "Cierra la campaña" : "Termina el día";
    }
    endBtn.classList.toggle("pulse", s.slot >= 3);
  }
  refresh();
  if (!SimPrefs.get().tuto) simTutorial(G);
}

function simActBtn(k, err, desc = null) {
  const a = SIM_ACTIONS[k];
  return `<button class="sim-act" data-a="${k}" ${err ? `disabled title="${esc(err)}"` : ""}><b>${a.label}</b><small>${desc || (err && err !== "No te queda suficiente dinero." ? err : a.desc)}</small><em aria-label="Coste: ${a.cost}">${a.cost}</em></button>`;
}

// Tutorial de tres passos, la primera vegada
function simTutorial(G) {
  const steps = [
    { t: "El mapa", d: "Cada provincia es una circunscripción, con el número de escaños que reparte. Toca una para hacer campaña. En las pequeñas, entrar cuesta muchos votos." },
    { t: "Tu agenda", d: "Cada día tienes tres franjas (mañana, tarde y noche) y un dinero limitado. A la agenda te llegan entrevistas, foros y retos de debate: tú decides si los aceptas." },
    { t: "La encuesta y el final del día", d: "Cada tres días llega una encuesta del juego, y puedes encargar más. Cuando acabes las acciones, pulsa «Termina el día» y verás qué hacen los rivales." },
  ];
  let k = 0;
  const box = h(`<div class="sim-tuto" role="dialog" aria-modal="true" aria-label="Cómo se juega"><div class="sim-tuto-card card"><p class="sim-kick" data-n></p><h3 class="sim-h" data-t></h3><p data-d></p>
    <div class="sim-actions-row"><button class="btn ghost" data-skip>Saltar</button><button class="btn primary" data-next>Siguiente</button></div></div></div>`);
  document.body.appendChild(box);
  const draw = () => {
    $("[data-n]", box).textContent = `Cómo se juega · ${k + 1} de ${steps.length}`;
    $("[data-t]", box).textContent = steps[k].t;
    $("[data-d]", box).textContent = steps[k].d;
    $("[data-next]", box).textContent = k === steps.length - 1 ? "Vamos" : "Siguiente";
  };
  const close = () => { box.remove(); SimPrefs.set("tuto", true); };
  draw();
  $("[data-next]", box).focus();
  $("[data-skip]", box).addEventListener("click", close);
  $("[data-next]", box).addEventListener("click", () => { Sfx.play("pick"); if (++k >= steps.length) close(); else draw(); });
  G.ctx.onCleanup(() => box.remove());
}

// Fi de la jornada: torn dels rivals, enquesta i imprevist de l'endemà
const SIM_EVENT_DAYS = [2, 3, 5, 6];
function simAfterDay(G, debate) {
  const s = G.state;
  const dayDone = s.day;
  const out = simEndDay(s);
  if (s.phase === "reflection") s.stage = "reflection";
  else if (SIM_EVENT_DAYS.includes(s.day)) {
    const ev = simPickEvent(s);
    if (ev) { s.stage = "event"; s.pendingEvent = ev.id; } else s.stage = "campaign";
  } else s.stage = "campaign";
  simSave(G);
  if (s.duel) window.Online?.reportSimDuel?.(s.duel, { i: dayDone });
  simHud(G, "dia");
  if (debate) simDebateResult(G, debate, () => simDaySummary(G, dayDone, out));
  else simDaySummary(G, dayDone, out);
}

function simDaySummary(G, dayDone, out) {
  const s = G.state;
  const poll = out.poll;
  const prev = poll ? s.polls[s.polls.length - 2] : null;
  const plays = out.moves.filter((m) => m.kind === "play" || m.kind === "attack");
  const camp = out.moves.filter((m) => m.kind === "camp");
  // Mapa dels rivals: on ha fet campanya cadascun avui
  const where = {};
  camp.concat(plays).forEach((m) => (m.provs || []).forEach((i) => { (where[i] = where[i] || []).push(m.id); }));
  const offersTomorrow = s.phase === "campaign" ? (s.offers || []).length : 0;
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-sumday">
      <p class="sim-kick">Final del día ${dayDone}</p>
      <h3 class="sim-h">${s.phase === "reflection" ? "Se ha acabado la campaña" : "Qué han hecho los rivales"}</h3>
      ${plays.length ? `<h4 class="sim-h4">Las jugadas del día</h4><ul class="sim-plays">${plays.map((m) => `<li class="${m.kind}"><span class="sim-play-ico" aria-hidden="true">${m.kind === "attack" ? "↯" : m.icon}</span>${simLogo(simById(s, m.id))}<span>${esc(m.msg)}${m.why ? `<small>${esc(m.why)}</small>` : ""}</span></li>`).join("")}</ul>` : ""}
      <div class="sim-sum-map">
        <div class="sim-mapbox mini">${simSpainMap("mini")}</div>
        <div><h4 class="sim-h4">Dónde han hecho campaña</h4><ul class="sim-moves">${camp.map((m) => `<li>${simLogo(simById(s, m.id))}<span>${esc(m.msg.replace(/^.*? fa campanya a /, ""))}<small>${esc([...new Set(m.why)].join(" · "))}</small></span></li>`).join("")}</ul></div>
      </div>
      ${poll ? `<div class="sim-newpoll"><h4>Nueva encuesta del juego</h4>${simPollBars(s, poll, prev)}</div>` : ""}
      ${offersTomorrow ? `<p class="sim-banner">Mañana en la agenda: ${offersTomorrow === 1 ? "1 propuesta" : `${offersTomorrow} propuestas`}${(s.offers || []).some((o) => o.type === "cara") ? ", entre ellas un reto a cara a cara" : ""}.</p>` : ""}
      <p class="sim-note">Los rivales siguen reglas fijas: cada uno tiene un estilo de campaña, el que compite por tus votantes responde donde haces mítines y, si las encuestas os sitúan cerca, te retará a un debate. La militancia aporta 6 unidades de dinero cada día.</p>
      <div class="sim-actions-row"><button class="btn primary lg" data-go>${s.phase === "reflection" ? "Llega la jornada de reflexión" : `Empieza el día ${s.day}`}</button></div>
    </div></div>`);
  // Cada circumscripció amb el color del rival que hi ha fet campanya (si n'hi ha més d'un, el primer)
  simPaintMap($(".sim-map", el), (i) => { const ids = where[i]; if (!ids) return {}; const p = simById(s, ids[0]); return { fill: p.color, ink: simInk(p.color), mark: ids.length > 1 ? `+${ids.length - 1}` : "" }; });
  $("[data-go]", el).addEventListener("click", () => { Sfx.play("pick"); simGo(G); });
}

// =========================================================
// 3. Imprevistos
// =========================================================
function simEventScreen(G) {
  const s = G.state;
  simHud(G);
  const ev = SIM_EVENTS.find((e) => e.id === s.pendingEvent);
  if (!ev) { s.stage = "campaign"; simSave(G); return simCampaign(G); }
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-event">
      <div class="sim-event-stamp" aria-hidden="true">!</div>
      <p class="sim-kick">Imprevisto · día ${s.day}</p>
      <h3 class="sim-h">${ev.title}</h3>
      <p class="sim-lead">${typeof ev.text === "function" ? ev.text(s) : ev.text}</p>
      <div class="sim-dil-opts" data-opts>${ev.opts.map((o, i) => `<button class="sim-opt" data-o="${i}"><i>${"ABC"[i]}</i>${o.t}</button>`).join("")}</div>
      <div data-out></div>
    </div></div>`);
  $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
    const msg = simApplyEvent(s, ev, Number(b.dataset.o));
    delete s.pendingEvent;
    s.stage = "campaign";
    simSave(G);
    Sfx.play("ok");
    simHud(G, "cred");
    $$("[data-o]", el).forEach((x) => { x.disabled = true; x.classList.toggle("picked", x === b); });
    $("[data-out]", el).innerHTML = `<div class="sim-outcome"><p>${esc(msg)}</p><button class="btn primary lg" data-go>Sigue la campaña</button></div>`;
    $("[data-go]", el).focus();
    $("[data-go]", el).addEventListener("click", () => simCampaign(G));
  }));
}

// =========================================================
// 4. Debats
// =========================================================
function simDebateScreen(G) {
  const s = G.state;
  simHud(G);
  // Les preguntes depenen només de la llavor i del número de debat: si es reprèn la partida, són les mateixes
  const n = (s.used.debates || 0) + 1;
  const qs = simDebateQuestions({ seed: s.seed, used: { debates: n - 1 } });
  const final = s.day === s.days;
  const answers = [];
  ask(0);

  function ask(k) {
    if (k >= qs.length) {
      s.used.debates = n;
      const res = simDebate(s, answers);
      return simAfterDay(G, res);
    }
    const q = qs[k];
    const rng = simMulberry(simHash(`${s.seed}|debq|${n}|${k}`));
    const order = shuffle([0, 1, 2], rng);
    const el = simMount(G, `<div class="sim-wrap">
      <div class="card sim-card sim-debate">
        <div class="sim-deb-top"><span class="sim-onair">En directo</span><p class="sim-kick">${final ? "Debate final" : "Debate a siete"} · pregunta ${k + 1} de ${qs.length}</p></div>
        <div class="sim-deb-stage">${[s.me, ...s.rivals.filter((r) => !r.ccaa).slice(0, 4)].map((p) => `<span class="sim-podium ${p.id === "jo" ? "me" : ""}" style="--pc:${p.color};color:${simInk(p.color)}">${esc(p.sig)}</span>`).join("")}</div>
        <blockquote class="sim-q">${q.q}</blockquote>
        <div class="sim-dil-opts">${order.map((i, j) => `<button class="sim-opt" data-o="${i}"><i>${"ABC"[j]}</i>${q.a[i].t}</button>`).join("")}</div>
        <p class="sim-note">Pesa la coherencia con tu programa, pero también llegar al electorado del centro. El carisma del candidato ayuda.</p>
      </div></div>`);
    $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
      answers.push({ ...q.a[Number(b.dataset.o)].p });
      Sfx.play("pick");
      ask(k + 1);
    }));
  }
}

function simDebateResult(G, res, then) {
  const verdict = res.delta > 0.025 ? ["Has ganado el debate", "Los analistas te dan como ganador."] : res.delta > -0.02 ? ["Debate sin sorpresas", "Ni ganas ni pierdes mucho."] : ["El debate se te ha hecho largo", "Las respuestas no han convencido."];
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-debres">
      <p class="sim-kick">Después del debate</p>
      <h3 class="sim-h">${verdict[0]}</h3>
      <p class="sim-lead">${verdict[1]}</p>
      <div class="sim-scores">
        <div><small>Coherencia con el programa</small><b>${Math.round(res.coh * 100)} %</b><span><i style="width:${res.coh * 100}%"></i></span></div>
        <div><small>Atractivo para el electorado</small><b>${Math.round(res.appeal * 100)} %</b><span><i style="width:${res.appeal * 100}%"></i></span></div>
      </div>
      ${simExplain("Las respuestas coherentes con tu programa mantienen la credibilidad; las más moderadas atraen a votantes del centro. Todos los que han visto el debate ahora os conocen un poco más.", null)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Continúa</button></div>
    </div></div>`);
  Sfx.play(res.delta > 0.025 ? "win" : res.delta > -0.02 ? "ok" : "ko");
  $("[data-go]", el).addEventListener("click", then);
}

// =========================================================
// 5. Jornada de reflexió
// =========================================================
function simReflection(G) {
  const s = G.state;
  simHud(G);
  const count = (t) => s.log.filter((l) => l.type === t && (l.round || 1) === (s.round || 1)).length;
  const visited = new Set(s.log.filter((l) => (l.type === "miting" || l.type === "candidat") && (l.round || 1) === (s.round || 1)).map((l) => l.arg));
  const last = s.polls[s.polls.length - 1], prev = s.polls[s.polls.length - 2];
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-reflect">
      <p class="sim-kick">Sábado · Jornada de reflexión</p>
      <h3 class="sim-h">Hoy no se puede hacer campaña</h3>
      <p class="sim-lead">La ley electoral prohíbe pedir el voto el día antes de las elecciones. También prohíbe difundir encuestas los cinco días previos a la votación (artículo 69.7 de la LOREG): la que ves aquí es del juego y es ficción.</p>
      <div class="sim-stats">
        <div><b>${count("miting")}</b><small>mítines</small></div>
        <div><b>${visited.size}</b><small>circunscripciones visitadas</small></div>
        <div><b>${count("xarxes")}</b><small>campañas en las redes</small></div>
        <div><b>${count("entrevista")}</b><small>entrevistas</small></div>
        <div><b>${Math.round(s.awG * 100)} %</b><small>os conoce en todo el Estado</small></div>
      </div>
      <div class="sim-newpoll"><h4>La última encuesta del juego</h4>${simPollBars(s, last, prev)}</div>
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Abren los colegios electorales</button></div>
    </div></div>`);
  $("[data-go]", el).addEventListener("click", () => { s.stage = "night"; simSave(G); Sfx.play("pick"); simNight(G); });
}

// =========================================================
// 6. Nit electoral
// =========================================================
function simNight(G) {
  const s = G.state, { ctx } = G;
  ctx.hud([]);
  const r = simElection(s);
  const parties = [s.me, ...s.rivals];
  const order = simHemiOrder(s);
  const finalHemi = order.map((p) => ({ id: p.id, color: p.color, seats: r.totals[p.id].seats }));
  const provs = [...r.provs].sort((a, b) => a.electors - b.electors);
  const cur = Object.fromEntries(parties.map((p) => [p.id, { seats: 0, votes: 0 }]));
  const firstPoll = s.polls.find((p) => p.day === 0) || s.polls[0];
  let counted = 0, validSoFar = 0, done = false;

  const el = simMount(G, `<div class="sim-wrap sim-night">
    <div class="sim-night-head">
      <div><p class="sim-kick">Domingo · 20.00 h</p><h3 class="sim-h">${s.round === 2 ? "Noche electoral, cuatro años después" : "Noche electoral"}</h3></div>
      <div class="sim-esc"><small>Escrutado</small><b data-pct>0 %</b><span><i data-bar></i></span></div>
    </div>
    <div class="sim-grid">
      <section class="card sim-hemicard">
        <div class="hemi-wrap">${hemicycleSVG(finalHemi)}<div class="hemi-center"><strong data-me>0</strong><small>escaños de ${esc(s.me.sig)}</small></div></div>
        <div class="sim-tally" data-tally></div>
      </section>
      <div class="sim-side">
        <section class="card sim-mapcard"><div class="sim-cardhead"><h4>Ganador en cada circunscripción</h4><small>El recuento avanza de las circunscripciones pequeñas a las grandes.</small></div><div class="sim-mapbox night" data-tiles>${simSpainMap("night")}</div></section>
        <section class="card sim-ticker"><ol data-ticker aria-live="polite"></ol></section>
      </div>
    </div>
    <div class="sim-endbar"><button class="btn ghost" data-skip>Salta al resultado</button></div>
  </div>`);
  const circles = {};
  $$(".hemicycle circle", el).forEach((c) => { (circles[c.dataset.p] = circles[c.dataset.p] || []).push(c); c.setAttribute("fill", SIM_GREY); });
  const ticker = $("[data-ticker]", el);

  const paint = () => {
    order.forEach((p) => (circles[p.id] || []).forEach((c, k) => c.setAttribute("fill", k < cur[p.id].seats ? p.color : SIM_GREY)));
    const pct = validSoFar / r.valid;
    $("[data-pct]", el).textContent = `${simPct(pct, 1)} %`;
    $("[data-bar]", el).style.width = `${pct * 100}%`;
    $("[data-me]", el).textContent = cur.jo.seats;
    const rows = [...parties].sort((a, b) => cur[b.id].seats - cur[a.id].seats || cur[b.id].votes - cur[a.id].votes);
    $("[data-tally]", el).innerHTML = rows.map((p) => `<div class="sim-trow ${p.id === "jo" ? "me" : ""}">${simLogo(p)}<span>${esc(p.name)}</span><small>${validSoFar ? simPct(cur[p.id].votes / validSoFar) : "0,0"} %</small><b>${cur[p.id].seats}</b></div>`).join("");
  };

  const step = () => {
    if (counted >= provs.length) return finish();
    const p = provs[counted++];
    validSoFar += p.valid;
    Object.keys(p.votes).forEach((id) => { cur[id].votes += p.votes[id]; cur[id].seats += p.won[id]; });
    const win = Object.keys(p.won).sort((a, b) => p.won[b] - p.won[a] || p.votes[b] - p.votes[a])[0];
    const t = $(`.sim-pg[data-i="${p.i}"]`, el);
    t.style.setProperty("--f", simById(s, win).color);
    t.style.setProperty("--t", simInk(simById(s, win).color));
    t.classList.add("in");
    t.setAttribute("aria-label", `${p.name}: gana ${simById(s, win).name}`);
    const mine = p.won.jo;
    if (mine || counted % 4 === 0 || p.seats >= 10) {
      const li = document.createElement("li");
      li.className = mine ? "me" : "";
      li.innerHTML = mine ? `<b>${esc(p.name)}</b>: ${esc(s.me.sig)} saca ${mine === 1 ? "1 escaño" : `${mine} escaños`}`
        : `<b>${esc(p.name)}</b>: ${Object.keys(p.won).filter((id) => p.won[id]).map((id) => `${esc(simById(s, id).sig)} ${p.won[id]}`).join(" · ")}`;
      ticker.prepend(li);
      while (ticker.children.length > 6) ticker.lastChild.remove();
      if (mine) Sfx.play("ok");
    }
    paint();
  };

  const timer = ctx.every(170, step);
  $("[data-skip]", el).addEventListener("click", () => { while (counted < provs.length) step(); });
  paint();

  function finish() {
    if (done) return;
    done = true;
    timer();
    const btn = $("[data-skip]", el);
    const est = firstPoll?.est.jo;
    btn.insertAdjacentHTML("beforebegin", `<p class="sim-night-sum">${esc(s.me.sig)}: <b>${r.totals.jo.seats} ${r.totals.jo.seats === 1 ? "escaño" : "escaños"}</b> y el ${simPct(r.totals.jo.share)} % de los votos${est !== undefined && s.round !== 2 && !simPollsHidden() ? ` (la primera encuesta te daba un ${simNum(est)} %)` : ""}.</p>`);
    btn.textContent = simShortMode(s) || s.round === 2 ? "Ver el resultado" : "Ver el informe electoral";
    btn.classList.replace("ghost", "primary");
    btn.classList.add("pulse");
    btn.onclick = () => simAfterNight(G, r);
    Sfx.play(r.totals.jo.seats >= s.goal ? "win" : "tick");
  }
}

// Després de l'escrutini: el mode exprés acaba; els altres passen a l'informe i a la negociació
function simAfterNight(G, r) {
  const s = G.state;
  if (s.round === 2) {
    const first = s.res;
    simStoreResult(s, r);
    s.res2 = s.res;
    s.res = first;
    s.r2 = { lessons: simLessons(s, r) };
    return simFinishGame(G, r);
  }
  simStoreResult(s, r);
  simElectionAchievements(G, r);
  if (simShortMode(s)) return simFinishGame(G, r);
  s.stage = "report";
  s.lessons = simLessons(s, r);
  s.closeCalls = simCloseCalls(s, r);
  simSave(G);
  simElectionReportScreen(G);
}

// Assoliments del resultat electoral
function simElectionAchievements(G, r) {
  const s = G.state, seats = r.totals.jo.seats;
  if (seats > 0) G.ctx.achieve("sim-escons");
  if (seats >= 15) G.ctx.achieve("sim-grup");
  if (seats >= SIM_MAJ) G.ctx.achieve("sim-majoria");
  if (seats >= s.goal) G.ctx.achieve("sim-objectiu");
  if (seats >= s.goal && s.diff === "dificil") G.ctx.achieve("sim-dificil");
  if (r.provs.some((p) => p.votes.jo && Object.keys(p.votes).every((id) => p.votes[id] <= p.votes.jo) && p.votes.jo / p.valid < 0.3)) G.ctx.achieve("sim-votutil");
  if (r.provs.some((p) => p.winners[p.winners.length - 1]?.id === "jo")) G.ctx.achieve("sim-hondt");
  if (r.provs.filter((p) => p.won.jo).length >= 26) G.ctx.achieve("sim-arreu");
}

// Escons per un pèl: vots que calien per guanyar-ne un altre (o que sobraven abans de perdre'n un)
function simCloseCalls(s, r) {
  const out = [];
  r.provs.forEach((p) => {
    const v = p.votes.jo || 0, won = p.won.jo || 0;
    const last = p.winners[p.winners.length - 1];
    if (!last || p.votes.jo === undefined) return;
    if (last.id !== "jo") out.push({ i: p.i, kind: "gain", n: simSeatGap(p), share: simSeatGap(p) / p.valid });
    if (won > 0 && p.next && p.next.id !== "jo") {
      const lastMine = p.winners.filter((w) => w.id === "jo").pop();
      if (lastMine === last) out.push({ i: p.i, kind: "hold", n: Math.ceil((v / won - p.next.q) * won) });
    }
  });
  return {
    gain: out.filter((x) => x.kind === "gain").sort((a, b) => a.share - b.share).slice(0, 4),
    hold: out.filter((x) => x.kind === "hold").sort((a, b) => a.n - b.n).slice(0, 1),
  };
}

// Informe electoral: resultats, escons per un pèl, preu de cada escó i vots perduts
function simElectionReport(s, r, compact = false) {
  const me = r.totals.jo, seats = me.seats, ok = seats >= s.goal;
  const parties = [s.me, ...s.rivals];
  const rows = [...parties].sort((a, b) => r.totals[b.id].seats - r.totals[a.id].seats || r.totals[b.id].votes - r.totals[a.id].votes);
  const maxSeats = Math.max(...rows.map((p) => r.totals[p.id].seats), 1);
  let lost = 0, lostMine = 0, provsWon = 0;
  r.provs.forEach((p) => {
    Object.keys(p.votes).forEach((id) => { if (!p.won[id]) { lost += p.votes[id]; if (id === "jo") lostMine += p.votes[id]; } });
    if (p.won.jo) provsWon++;
  });
  const cc = simCloseCalls(s, r);
  const tableFor = (p) => {
    const ids = p.elig;
    const res = simDhondt(ids.map((id) => p.votes[id]), p.seats);
    return quotientTable(ids.map((id) => simById(s, id).sig), ids.map((id) => p.votes[id]), p.seats, res.winners);
  };
  const keyProvs = [...cc.gain, ...cc.hold].map((x) => r.provs[x.i]);
  const firstTable = keyProvs.find((p) => p.elig.includes("jo") && p.seats <= 12) || keyProvs.find((p) => p.seats <= 12);
  const perSeat = (id) => (r.totals[id].seats ? r.totals[id].votes / r.totals[id].seats : null);
  return `<div class="sim-report">
    <div class="sim-rep-head" style="--pc:${s.me.color}">${simLogoSvg(s.me, 64)}
      <div><b>${esc(s.me.name)}</b><span>${fmt(me.votes)} votos · ${simPct(me.share)} % · ${seats} ${seats === 1 ? "escaño" : "escaños"}</span></div>
      <em class="${ok ? "ok" : "ko"}">${ok ? "Objetivo cumplido" : "Objetivo no alcanzado"} · ${s.goal}</em>
    </div>
    ${simHemi(s, Object.fromEntries(parties.map((p) => [p.id, r.totals[p.id].seats])), `<strong>176</strong><small>mayoría absoluta</small>`)}
    <div class="sim-restable">${rows.map((p) => `<div class="sim-rrow ${p.id === "jo" ? "me" : ""}">${simLogo(p)}<span class="n">${esc(p.name)}</span><span class="v">${fmt(r.totals[p.id].votes)}</span><span class="pc">${simPct(r.totals[p.id].share)} %</span><span class="bar"><i style="width:${(r.totals[p.id].seats / maxSeats) * 100}%;--pc:${p.color}"></i></span><b>${r.totals[p.id].seats}</b></div>`).join("")}</div>
    <p class="sim-note">Participación: ${simPct(r.turnout)} % · ${fmt(r.cast)} votantes de ${fmt(r.electors)} electores.</p>
    ${compact ? "" : `
    <h4>Dónde has ganado y dónde has perdido</h4>
    ${cc.gain.length || cc.hold.length ? `<ul class="sim-close">
      ${cc.gain.map((x) => { const p = r.provs[x.i]; return `<li><b>${esc(p.name)}</b> · Te han faltado <b>${fmt(x.n)}</b> votos para ${p.won.jo ? "otro escaño" : "el primer escaño"}${p.elig.includes("jo") ? "" : " (primero había que superar el 3 % de los votos válidos)"}.</li>`; }).join("")}
      ${cc.hold.map((x) => { const p = r.provs[x.i]; return `<li class="hold"><b>${esc(p.name)}</b> · Has salvado el último escaño por solo <b>${fmt(x.n)}</b> votos.</li>`; }).join("")}
    </ul>` : ""}
    ${firstTable ? `<p class="sim-sub">Así se han repartido los ${firstTable.seats} escaños de ${esc(firstTable.name)} con la [[ley D'Hondt]]: se dividen los votos de cada candidatura entre 1, 2, 3… y los escaños van a los cocientes más altos.</p>${tableFor(firstTable)}` : ""}
    <h4>El precio de cada escaño</h4>
    <div class="sim-stats">
      ${rows.filter((p) => r.totals[p.id].seats).slice(0, 4).map((p) => `<div class="${p.id === "jo" ? "me" : ""}"><b>${fmt(perSeat(p.id))}</b><small>votos por escaño de ${esc(p.sig)}</small></div>`).join("")}
      ${!seats ? `<div class="me"><b>—</b><small>${esc(s.me.sig)} no ha sacado ningún escaño</small></div>` : ""}
    </div>
    <h4>Votos perdidos</h4>
    <div class="sim-stats">
      <div><b>${simPct(lost / r.valid, 0)} %</b><small>de los votos válidos han ido a partidos sin escaño en su circunscripción</small></div>
      <div class="me"><b>${simPct(lostMine / Math.max(1, me.votes), 0)} %</b><small>de tus votos no han elegido a ningún diputado</small></div>
      <div><b>${provsWon}</b><small>circunscripciones con escaño de ${esc(s.me.sig)}</small></div>
    </div>`}
  </div>`;
}

function simElectionReportScreen(G) {
  const s = G.state;
  G.ctx.hud([]);
  const r = simElection(s);
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card">
      <p class="sim-kick">Informe electoral</p>
      <h3 class="sim-h">${s.res.seats.jo} ${s.res.seats.jo === 1 ? "escaño" : "escaños"} para ${esc(s.me.name)}</h3>
      ${rich(simElectionReport(s, r))}
      <h4 class="sim-h4">Lo que deja esta noche</h4>
      <ul class="sim-lessons">${(s.lessons || []).map((l) => `<li>${rich(l.t)} <a href="#apren/${l.link}">Aprende más</a></li>`).join("")}</ul>
      ${simExplain(Object.values(s.res.seats).some((n) => n >= SIM_MAJ) ? "Un partido tiene mayoría absoluta: la investidura será un trámite." : "Nadie tiene los 176 escaños de la [[mayoría absoluta]]. El Rey abrirá una ronda de consultas con todos los partidos y propondrá un candidato a la [[investidura]].", "nou-govern")}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Empieza la ronda de consultas</button></div>
    </div></div>`);
  $("[data-go]", el).addEventListener("click", () => {
    s.stage = "gov-consult";
    s.gov = s.gov || simGovNew(s);
    simSave(G);
    Sfx.play("pick");
    simGovConsult(G);
  });
}

// =========================================================
// 7. Resultat final, rècords i compartir
// =========================================================
function simFinishGame(G) {
  const s = G.state, { ctx } = G;
  if (!ctx.alive() || s.finished) return;
  s.finished = true;
  SimSave.clear();
  const r = simElection(s);
  const sc = simScore(s);
  const pts = sc.pts, xp = simXp(s, pts);
  const seats = s.res.seats.jo;

  // Rècord per mode (simulador-express, simulador-govern...) i rècord general del joc
  const key = `simulador-${s.mode}`;
  const prevMode = Progress.data.best[key];
  const isRec = prevMode === undefined || pts > prevMode;
  if (isRec) Progress.data.best[key] = pts;
  if (s.duel) window.Online?.reportSimDuel?.(s.duel, { done: true, score: seats, hits: seats, i: 6 });
  const rec = Progress.record("simulador", pts, xp);

  const gov = s.gov;
  const L = s.leg;
  const govLine = simGovLine(s);
  const lessons = [...(s.lessons || simLessons(s, r)), ...(s.r2?.lessons || [])].slice(0, 5);
  const verdict = s.mode === "legislatura" && L ? simLegVerdict(s) : gov?.outcome ? SIM_OUTCOME_VERDICT[gov.outcome] : seats >= s.goal
    ? seats >= s.goal * 1.3 ? "Resultado histórico: superas de largo el objetivo de la dirección." : "Objetivo cumplido. En la sede del partido hay fiesta."
    : seats > 0 ? `Te han faltado ${s.goal - seats} ${s.goal - seats === 1 ? "escaño" : "escaños"} para llegar al objetivo.` : "Sin representación esta vez. Prueba a concentrar esfuerzos donde tienes más opciones.";

  const extraHtml = `<div class="sim-final">
    ${s.duel ? `<div class="sim-banner ok">Resultado enviado al duelo: ${seats} ${seats === 1 ? "escaño" : "escaños"}. <a href="#duel/${esc(s.duel)}">Vuelve al duelo</a></div>` : ""}
    <div class="sim-scorebox"><h4>Cómo se ha calculado</h4><ul>${sc.parts.map((p) => `<li><span>${esc(p.label)}</span><b>${p.pts >= 0 ? "+" : ""}${fmt(p.pts)}</b></li>`).join("")}${sc.mult !== 1 ? `<li><span>Dificultad ${SIM_DIFF[s.diff].label.toLowerCase()}</span><b>×${simNum(sc.mult)}</b></li>` : ""}</ul></div>
    ${govLine ? `<div class="sim-govline">${govLine}</div>` : ""}
    ${s.res2 ? `<div class="sim-reelect"><h4>Las elecciones de cuatro años después</h4>${simHemi(s, s.res2.seats, `<strong>${s.res2.seats.jo}</strong><small>escaños de ${esc(s.me.sig)} (antes ${seats})</small>`)}</div>` : rich(simElectionReport(s, r, !simShortMode(s)))}
    <h4 class="sim-h4">Informe de la partida: qué has aprendido</h4>
    <ul class="sim-lessons">${lessons.map((l) => `<li>${rich(l.t)} <a href="#apren/${l.link}">Aprende más</a></li>`).join("")}</ul>
    <div class="sim-quiz"><h4>¿Sabrías explicarlo?</h4><ol>${SIM_QUIZ.map((q) => `<li><details><summary>${q.q}</summary><p>${rich(q.a)}</p></details></li>`).join("")}</ol></div>
    <div class="sim-sharebox"><button class="btn primary" data-share>Comparte el resultado</button><small>Se genera una imagen en tu dispositivo. No se envía nada a ningún servidor.</small></div>
    <div class="sim-learn">
      <a href="#apren/vots-escons">Cómo se pasa de votos a escaños</a>
      <a href="#apren/nou-govern">Del recuento al nuevo Gobierno</a>
      <a href="#apren/congres">El Congreso por dentro</a>
    </div>
  </div>`;

  const shareInfo = {
    seats: s.res2 ? s.res2.seats.jo : seats,
    seatMap: s.res2 ? s.res2.seats : s.res.seats,
    sub: `${fmt(pts)} puntos · ${SIM_MODE_INFO[s.mode].label}`,
    line: simGovShort(s),
    line2: `Objetivo de la dirección: ${s.goal} escaños`,
  };
  ctx.finish({
    score: pts, xp, verdict, extraHtml,
    unit: `puntos · ${SIM_MODE_INFO[s.mode].label.toLowerCase()}`,
    ratio: seats >= s.goal ? 0.8 : seats > 0 ? 0.5 : 0.1,
    record: { isRecord: isRec && pts > 0, prevBest: prevMode, levelUp: rec.levelUp },
    onShown(body) {
      $("[data-share]", body)?.addEventListener("click", () => simShare(s, shareInfo));
    },
  });
}

const SIM_OUTCOME_VERDICT = {
  pm: "Investidura superada: eres presidente del Gobierno.",
  coal: "Entras en el Gobierno de coalición con ministerios propios.",
  leg: "Un acuerdo de legislatura: gobierna otro partido, pero con tus medidas.",
  inv: "Has hecho posible la investidura a cambio de algunas medidas.",
  opp: "Te toca la oposición. Desde allí también se hace política.",
  rep: "Nadie ha sido investido en dos meses: se repiten las elecciones.",
};

// Preguntes de comprensió: es poden respondre amb l'informe de qualsevol partida
const SIM_QUIZ = [
  { q: "¿Qué es el voto útil?", a: "Votar a un partido con opciones de escaño en tu circunscripción en lugar del preferido, porque en las provincias pequeñas solo entran los primeros. En el juego, los partidos sin opciones pierden votantes en la segunda pasada del modelo." },
  { q: "¿Para qué sirve el umbral del 3 %?", a: "Una candidatura necesita el 3 % de los votos válidos (blancos incluidos) de la circunscripción para entrar en el reparto de escaños. Solo se nota en las circunscripciones grandes: en las pequeñas hace falta mucho más para sacar escaño." },
  { q: "¿Por qué el precio de un escaño no es igual para todos?", a: "La [[ley D'Hondt]] y las circunscripciones pequeñas favorecen a los partidos más votados en cada provincia: los grandes necesitan menos votos por escaño que los pequeños repartidos por todo el Estado." },
  { q: "¿Por qué a menudo hay que pactar?", a: "Para ser investido presidente hace falta la [[mayoría absoluta]] (176 síes) en la primera votación, o más síes que noes en la segunda. Si ningún partido tiene suficientes escaños, hay que sumar apoyos, y cada partido tiene sus líneas rojas." },
  { q: "¿Cómo funciona la investidura?", a: "El Rey propone un candidato después de consultar a los partidos. Si no obtiene 176 síes, 48 horas después se vota de nuevo y basta con más síes que noes. Si en dos meses nadie es investido, se repiten las elecciones." },
];

// Assoliments propis del simulador
ACHIEVEMENTS.push(
  { id: "sim-escons", name: "Primer escaño", desc: "Saca al menos un diputado en el Simulador del 29N." },
  { id: "sim-objectiu", name: "Misión cumplida", desc: "Llega al objetivo de la dirección en el simulador." },
  { id: "sim-grup", name: "Grupo propio", desc: "Saca 15 diputados o más en el simulador: suficiente para tener grupo parlamentario." },
  { id: "sim-dificil", name: "Contra pronóstico", desc: "Llega al objetivo del simulador en dificultad difícil." },
  { id: "sim-majoria", name: "Mayoría absoluta", desc: "Saca 176 escaños o más en el simulador." },
  { id: "sim-votutil", name: "Voto útil", desc: "Gana una circunscripción con menos del 30 % de los votos." },
  { id: "sim-hondt", name: "Hondt a favor", desc: "Llévate el último escaño que se reparte en una circunscripción." },
  { id: "sim-arreu", name: "Por todo el mapa", desc: "Saca escaño en 26 circunscripciones o más." },
  { id: "sim-president", name: "De la calle a la Moncloa", desc: "Supera una investidura como candidato en el simulador." },
  { id: "sim-minoria", name: "Gobierno en minoría", desc: "Sé investido en la segunda votación, sin mayoría absoluta." },
  { id: "sim-mocio", name: "Moción superada", desc: "Supera una moción de censura o gana una cuestión de confianza." },
  { id: "sim-legislatura", name: "Legislatura completa", desc: "Gobierna los ocho trimestres de una legislatura." },
);

// =========================================================
// Agenda de campanya: entrevistes, fòrums i cara a cara
// =========================================================
const SIM_MEDIA_ICON = { entrevista: "🎙", forum: "🏛", cara: "⚔" };
function simOfferInfo(s, o) {
  if (o.type === "entrevista") {
    const m = SIM_OUTLETS.find((x) => x.k === o.outlet);
    const where = m.reach === "estatal" ? "Audiencia en todo el Estado" : m.reach === "ccaa" ? `Audiencia en ${SIM_PROVS[o.prov].ccaa}` : `Audiencia en ${SIM_PROVS[o.prov].name}`;
    return { title: `${m.name} te quiere entrevistar`, sub: `${where} · tema principal: ${SIM_THEMES[o.th].label.toLowerCase()}`, tag: o.tone === "dura" ? "Entrevista dura" : "Entrevista amable", hard: o.tone === "dura" };
  }
  if (o.type === "forum") {
    const f = SIM_FORUMS.find((x) => x.k === o.forum);
    return { title: `${f.name} te invita a hablar`, sub: `Público: ${SIM_SEGMENTS.find((g) => g.k === f.seg).label.toLowerCase()}`, tag: "Foro" };
  }
  const R = simById(s, o.rival);
  return { title: `${R.cand || "El candidato"} (${R.sig}) te reta a un cara a cara`, sub: "Televisión en directo. Si lo declinas, te reprocharán que rehúyes el debate.", tag: "Reto", hard: true };
}
function simOfferRow(s, o) {
  const i = simOfferInfo(s, o);
  const done = o.status !== "nova";
  return `<li class="sim-offer ${done ? "done" : ""}" data-type="${o.type}">
    <span class="sim-offer-ico" aria-hidden="true">${SIM_MEDIA_ICON[o.type]}</span>
    <div><em class="${i.hard ? "hard" : ""}">${i.tag}</em><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></div>
    ${done ? `<span class="sim-offer-st">${o.status === "feta" ? "Hecho" : "Declinado"}</span>` : `<div class="sim-offer-btns"><button class="btn primary" data-acc="${o.id}">Acepta</button><button class="btn ghost" data-dec="${o.id}">Declina</button></div>`}
  </li>`;
}

function simMediaScreen(G) {
  const s = G.state;
  simHud(G);
  const o = simOffer(s, s.media?.id);
  const back = () => { s.stage = "campaign"; delete s.media; simSave(G); simCampaign(G); };
  if (!o || o.status !== "nova") return back();
  if (o.type === "forum") return simForumScreen(G, o, back);
  const info = simOfferInfo(s, o);
  const qs = simMediaQuestions(s, o);
  const picks = [];
  const R = o.type === "cara" ? simById(s, o.rival) : null;
  const order = (k) => shuffle(qs[k].a.map((_, j) => j), simMulberry(simHash(`${s.seed}|ordre|${o.id}|${k}`)));
  ask(0);

  function ask(k) {
    if (k >= qs.length) return finish();
    const q = qs[k];
    const el = simMount(G, `<div class="sim-wrap">
      <div class="card sim-card sim-media ${o.type}">
        <div class="sim-media-top"><span class="sim-onair">${o.type === "cara" ? "En directo" : "Grabando"}</span><p class="sim-kick">${esc(info.tag)} · pregunta ${k + 1} de ${qs.length}</p></div>
        <div class="sim-media-set">${o.type === "cara"
          ? `<span class="sim-podium me" style="--pc:${s.me.color};color:${simInk(s.me.color)}">${esc(s.me.sig)}</span><span class="sim-media-vs">VS</span><span class="sim-podium" style="--pc:${R.color};color:${simInk(R.color)}">${esc(R.sig)}</span>`
          : `<span class="sim-mic" aria-hidden="true">🎙</span><div><b>${esc(SIM_OUTLETS.find((x) => x.k === o.outlet).short)}</b><small>${o.tone === "dura" ? "Una periodista conocida por las preguntas incómodas" : "Una conversación tranquila"}</small></div>`}</div>
        <blockquote class="sim-q">${o.type === "cara" ? "Moderadora: " : ""}${q.q}</blockquote>
        <div class="sim-dil-opts">${order(k).map((j, n) => `<button class="sim-opt" data-o="${j}"><i>${"ABC"[n]}</i>${q.a[j].t}</button>`).join("")}</div>
        <div data-react></div>
      </div></div>`);
    $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
      const j = Number(b.dataset.o), a = q.a[j];
      picks[k] = j;
      $$("[data-o]", el).forEach((x) => { x.disabled = true; x.classList.toggle("picked", x === b); });
      const qual = simAnswerQuality(s, a);
      Sfx.play(a.ev ? "ko" : qual >= 0.6 ? "ok" : "tick");
      const pool = a.ev ? SIM_REACTIONS.ev : qual >= 0.62 ? SIM_REACTIONS.good : SIM_REACTIONS.mid;
      const line = o.type === "cara"
        ? (qual >= 0.62 ? `Respuesta sólida: el candidato de ${R.sig} no encuentra por dónde atacarte.` : `El candidato de ${R.sig} aprovecha la respuesta para contraatacar.`)
        : pool[(k + picks.length) % pool.length];
      $("[data-react]", el).innerHTML = `<div class="sim-react ${a.ev || qual < 0.5 ? "ko" : qual >= 0.62 ? "ok" : ""}"><p>${esc(line)}</p><button class="btn primary" data-next>${k + 1 < qs.length ? "Siguiente pregunta" : "Final"}</button></div>`;
      $("[data-next]", el).focus();
      $("[data-next]", el).addEventListener("click", () => ask(k + 1));
    }));
  }

  function finish() {
    const res = o.type === "cara" ? simDoCara(s, o.id, picks) : simDoInterview(s, o.id, picks);
    s.stage = "campaign"; delete s.media; simSave(G);
    simHud(G, "cred");
    const good = o.type === "cara" ? res.won : res.good;
    Sfx.play(good ? "win" : "lose");
    const why = o.type === "cara"
      ? `Las respuestas coherentes con tu programa y que llegan al electorado del centro suman; el carisma del candidato también pesa. ${res.won ? "Ganar un cara a cara te da visibilidad y resta apoyo al rival." : "Perderlo te resta un poco de apoyo, pero todos los que lo han visto ahora te conocen más."}`
      : `Una entrevista sale bien cuando las respuestas son claras y coherentes con el programa. ${res.evasive ? `Has esquivado ${res.evasive === 1 ? "una pregunta" : `${res.evasive} preguntas`}: ${o.tone === "dura" ? "en una entrevista dura, esquivar cuesta credibilidad." : "la periodista lo ha dejado pasar, pero no suma."} ` : ""}La solvencia del candidato también ayuda.`;
    const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media-res">
      <p class="sim-kick">${esc(info.tag)} · resultado</p>
      <h3 class="sim-h">${good ? (o.type === "cara" ? "Has ganado el cara a cara" : "La entrevista ha salido bien") : (o.type === "cara" ? "El rival ha salido mejor parado" : "La entrevista no ha ido muy bien")}</h3>
      <p class="sim-lead">${esc(res.msg)}</p>
      <div class="sim-scores"><div><small>Calidad de las respuestas</small><b>${Math.round((o.type === "cara" ? res.mine : res.quality) * 100)} %</b><span><i style="width:${Math.min(100, (o.type === "cara" ? res.mine : res.quality) * 100)}%"></i></span></div></div>
      ${simExplain(why)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Vuelve a la campaña</button></div>
    </div></div>`);
    $("[data-go]", el).addEventListener("click", () => simCampaign(G));
  }
}

function simForumScreen(G, o, back) {
  const s = G.state;
  const f = SIM_FORUMS.find((x) => x.k === o.forum);
  const seg = SIM_SEGMENTS.find((g) => g.k === f.seg);
  const view = Math.max(-1, Math.min(1, 1 - Math.abs(f.pos.p - s.me[f.pos.ax]) / 3));
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media forum">
    <p class="sim-kick">Foro · ${esc(seg.label.toLowerCase())}</p>
    <h3 class="sim-h">${esc(f.name)}</h3>
    <p class="sim-lead">Tienes diez minutos para hablar. ${view > 0.3 ? "Es un público afín." : view < -0.3 ? "Es un público que no comparte mucho tus ideas." : "Es un público que puede ir hacia cualquier lado."}</p>
    <div class="sim-dil-opts">
      <button class="sim-opt" data-k="0"><i>A</i><span><b>Un discurso a medida</b><small>Dices lo que este público quiere oír. Muchos aplausos${view < 0 ? ", pero es lo contrario de tu programa" : ""}.</small></span></button>
      <button class="sim-opt" data-k="1"><i>B</i><span><b>Defender tu programa</b><small>Aunque no guste a todo el mundo. Ganas credibilidad.</small></span></button>
      <button class="sim-opt" data-k="2"><i>C</i><span><b>Un discurso general</b><small>Sin riesgos, pero sin mucho impacto.</small></span></button>
    </div>
    <div class="sim-actions-row"><button class="btn ghost" data-back>Vuelve sin ir</button></div>
  </div></div>`);
  $("[data-back]", el).addEventListener("click", back);
  $$("[data-k]", el).forEach((b) => b.addEventListener("click", () => {
    const res = simDoForum(s, o.id, Number(b.dataset.k));
    s.stage = "campaign"; delete s.media; simSave(G);
    simHud(G, "cred");
    Sfx.play(res.segD > 0 && res.cred >= 0 ? "ok" : "ko");
    const r = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media-res">
      <p class="sim-kick">Foro · resultado</p>
      <h3 class="sim-h">${res.segD > 0.1 ? "Muy buena acogida" : res.segD > 0 ? "Buena acogida" : "Una acogida fría"}</h3>
      <p class="sim-lead">${esc(res.msg)}</p>
      ${simExplain(`Cada tipo de votante da importancia a cosas diferentes. Este foro habla sobre todo al grupo «${res.label}»: lo que digas cambia cómo te ven estos votantes en todas las circunscripciones. Decir a cada público lo contrario de tu programa te hace ganar aplausos, pero te cuesta credibilidad.`)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Vuelve a la campaña</button></div>
    </div></div>`);
    $("[data-go]", r).addEventListener("click", () => simCampaign(G));
  }));
}
