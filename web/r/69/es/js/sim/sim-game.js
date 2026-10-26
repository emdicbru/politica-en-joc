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
  state.goal = Math.max(3, Math.round(simPotential(state) * 0.85));
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
    simKickoff(state);
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

// Fi de la jornada: torn dels rivals, enquesta i imprevist de l'endemà
const SIM_EVENT_DAYS = [2, 3, 5, 6];
function simAfterDay(G, debate) {
  const s = G.state;
  const dayDone = s.day;
  const out = simEndDay(s);
  s.lastMoves = out.moves.map((m) => ({ id: m.id, kind: m.kind, provs: m.provs || [] }));
  if (s.phase === "reflection") s.stage = "reflection";
  else if (SIM_EVENT_DAYS.includes(s.day)) {
    const ev = simPickEvent(s);
    if (ev) { s.stage = "event"; s.pendingEvent = ev.id; } else s.stage = "campaign";
  } else s.stage = "campaign";
  simSave(G);
  if (s.duel) window.Online?.reportSimDuel?.(s.duel, { i: dayDone });
  simHud(G, "dia");
  if (debate) simDebateResult(G, debate, () => simNewscast(G, dayDone, out));
  else simNewscast(G, dayDone, out);
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
    <div class="card sim-card sim-event studio">
      <div class="sim-event-stamp" aria-hidden="true">!</div>
      <div class="sim-deb-top"><span class="sim-onair">Última hora</span><p class="sim-kick">Imprevisto · día ${s.day}</p></div>
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
      <div class="card sim-card sim-debate studio">
        <div class="sim-deb-top"><span class="sim-onair">En directo</span><p class="sim-kick">${final ? "Debate final" : "Debate a siete"} · pregunta ${k + 1} de ${qs.length}</p></div>
        <div class="sim-deb-stage">${[s.me, ...s.rivals.filter((r) => !r.ccaa).slice(0, 4)].map((p) => `<span class="sim-podium ${p.id === "jo" ? "me" : ""}" style="--pc:${p.color};color:${simInk(p.color)}">${esc(p.sig)}</span>`).join("")}</div>
        <blockquote class="sim-q">${q.q}</blockquote>
        <div class="sim-dil-opts">${order.map((i, j) => `<button class="sim-opt" data-o="${i}"><i>${"ABC"[j]}</i>${q.a[i].t}</button>`).join("")}</div>
        <div data-react></div>
        <p class="sim-note">Pesa la coherencia con tu programa, pero también llegar al electorado del centro. El carisma del candidato ayuda.</p>
      </div></div>`);
    $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
      const a = { ...q.a[Number(b.dataset.o)].p };
      answers.push(a);
      $$("[data-o]", el).forEach((x) => { x.disabled = true; x.classList.toggle("picked", x === b); });
      // Reacció del plató a la resposta i nota provisional del debat
      const r = simDebateAnswer(s, a);
      const sc = simDebateScore(s, answers).score;
      Sfx.play(r.coh + r.appeal >= 1.3 ? "ok" : r.coh + r.appeal < 0.95 ? "ko" : "tick");
      const line = r.coh >= 0.7 && r.appeal >= 0.6 ? "Resposta rodona: els teus aplaudeixen i els indecisos assenteixen."
        : r.coh >= 0.7 ? "Els teus votants aplaudeixen, però a l'electorat del mig no el convences."
          : r.appeal >= 0.6 ? "Agrada als indecisos, però als teus votants els sona estranya."
            : "La resposta no acaba d'arribar a ningú.";
      const [lo, hi] = SIM_DEBATE_RIVALS;
      $("[data-react]", el).innerHTML = `<div class="sim-dmeter">
        <p>${line}</p>
        <div class="sim-dmeter-row"><small>Tus votantes</small><span><i style="--v:${Math.round(r.coh * 100)}%"></i></span><b>${Math.round(r.coh * 100)}</b></div>
        <div class="sim-dmeter-row"><small>Electorat del mig</small><span><i style="--v:${Math.round(r.appeal * 100)}%"></i></span><b>${Math.round(r.appeal * 100)}</b></div>
        <div class="sim-deb-score"><small>Nota del debat fins ara</small><b>${simNum(Math.max(0, Math.min(1, sc)) * 10)}</b>
          <span class="sim-deb-scale" aria-hidden="true"><u style="left:${lo * 100}%;width:${(hi - lo) * 100}%"></u><i style="left:${Math.max(0, Math.min(1, sc)) * 100}%"></i></span>
          <small class="sim-deb-l">La franja grisa és on solen quedar els rivals</small></div>
        <button class="btn primary" data-next>${k + 1 < qs.length ? "Siguiente pregunta" : "Veredicte dels analistes"}</button>
      </div>`;
      $("[data-next]", el).focus();
      $("[data-next]", el).addEventListener("click", () => { Sfx.play("pick"); ask(k + 1); });
    }));
  }
}

function simDebateResult(G, res, then) {
  const best = res.best ? simById(G.state, res.best) : null;
  const verdict = res.won ? ["Has ganado el debate", "Los analistas te dan como ganador."] : res.delta > -0.02 ? ["Debate sin sorpresas", simGram(`Els analistes donen la victòria a ${best ? simThe(best) : "un rival"}, però tu aguantes bé.`)] : ["El debate se te ha hecho largo", simGram(`Les respostes no han convençut i els analistes donen la victòria a ${best ? simThe(best) : "un rival"}.`)];
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-debres studio">
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
  Sfx.play(res.won ? "win" : res.delta > -0.02 ? "ok" : "ko");
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
    <div class="card sim-card sim-reflect studio">
      <p class="sim-kick">Sábado · Jornada de reflexión</p>
      <h3 class="sim-h">Hoy no se puede hacer campaña</h3>
      <p class="sim-lead">La ley electoral prohíbe pedir el voto el día antes de las elecciones. También prohíbe difundir encuestas los cinco días previos a la votación (artículo 69.7 de la LOREG): la que ves aquí es del juego y es ficción.</p>
      <div class="sim-stats">
        <div><b>${count("miting")}</b><small>mítines</small></div>
        <div><b>${visited.size}</b><small>circunscripciones visitadas</small></div>
        <div><b>${count("porta")}</b><small>porta a porta</small></div>
        <div><b>${count("media") + count("cara")}</b><small>entrevistes i cara a cara</small></div>
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
      <div class="card sim-card sim-media studio ${o.type}">
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
        ? simGram(qual >= 0.62 ? `Respuesta sólida: el candidato de ${simThe(R)} no encuentra por dónde atacarte.` : `El candidato de ${simThe(R)} aprovecha la respuesta para contraatacar.`)
        : pool[(k + picks.length) % pool.length];
      $("[data-react]", el).innerHTML = `<div class="sim-react ${a.ev || qual < 0.5 ? "ko" : qual >= 0.62 ? "ok" : ""}"><div class="sim-react-m"><p>${esc(line)}</p><span class="sim-react-q" title="Qualitat de la resposta"><i style="--v:${Math.round(qual * 100)}%"></i></span></div><button class="btn primary" data-next>${k + 1 < qs.length ? "Siguiente pregunta" : "Final"}</button></div>`;
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
    const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media-res studio">
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
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media studio forum">
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
    const r = simMount(G, `<div class="sim-wrap"><div class="card sim-card sim-media-res studio">
      <p class="sim-kick">Foro · resultado</p>
      <h3 class="sim-h">${res.segD > 0.1 ? "Muy buena acogida" : res.segD > 0 ? "Buena acogida" : "Una acogida fría"}</h3>
      <p class="sim-lead">${esc(res.msg)}</p>
      ${simExplain(`Cada tipo de votante da importancia a cosas diferentes. Este foro habla sobre todo al grupo «${res.label}»: lo que digas cambia cómo te ven estos votantes en todas las circunscripciones. Decir a cada público lo contrario de tu programa te hace ganar aplausos, pero te cuesta credibilidad.`)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Vuelve a la campaña</button></div>
    </div></div>`);
    $("[data-go]", r).addEventListener("click", () => simCampaign(G));
  }));
}
