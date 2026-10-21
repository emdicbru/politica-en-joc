// Arrencada: sala de jocs, perfil, Aprèn, calendari i compte enrere.

// ---------- Sala de jocs ----------
let gameFilter = "all";

const DIFF_LABEL = ["", "Accessible", "Exigent", "Expert"];

function gameCard(g, i, featured = false) {
  const best = Progress.data.best[g.id];
  const cat = GAME_CATS[g.cat];
  const status = g.status ? g.status() : featured ? `<span class="gc-status new">${g.kicker}</span>` : "";
  return `
    <a class="game-card ${featured ? "featured" : ""}" href="#joc/${g.id}" style="--c:${g.color};--i:${i}">
      <div class="gc-art">
        <span class="gc-num">${String(GAMES.indexOf(g) + 1).padStart(2, "0")}</span>
        <span class="gc-level" title="Dificultat: ${DIFF_LABEL[g.level]}">${[1, 2, 3].map((n) => `<i class="${n <= g.level ? "on" : ""}"></i>`).join("")}</span>
        ${ART[g.id] ? ART[g.id]() : ""}
      </div>
      <div class="gc-body">
        <div class="gc-head"><span class="gc-cat">${cat.name}</span>${status}</div>
        <h3 class="gc-title">${g.title}</h3>
        <p class="gc-tag">${featured ? g.desc : g.tagline}</p>
        <div class="gc-meta">
          <span class="gc-chip">${g.meta}</span>
          <span class="gc-chip soft">${DIFF_LABEL[g.level]}</span>
          ${best !== undefined ? `<span class="gc-best">Rècord <b>${fmt(best)}</b></span>` : ""}
        </div>
      </div>
      <span class="gc-play" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg></span>
    </a>`;
}

function renderGames() {
  const grid = $("#games-grid");
  if (gameFilter !== "all") {
    const cat = GAME_CATS[gameFilter];
    grid.innerHTML = `<section class="game-group" style="--c:${cat.color}">
      <div class="group-head"><span class="group-dot"></span><h3>${cat.name}</h3><p>${cat.desc}</p></div>
      <div class="games-grid">${GAMES.filter((g) => g.cat === gameFilter).map((g, i, all) => gameCard(g, i, all.length % 2 === 1 && i === 0)).join("")}</div>
    </section>`;
    return;
  }
  renderDailyHero();
  let i = 0;
  grid.innerHTML = ["rapid", "parlament", "historia"].map((key) => {
    const cat = GAME_CATS[key];
    const games = GAMES.filter((g) => g.cat === key);
    const wide = games.length % 2 === 1; // omple la fila: el primer joc fa de destacat
    return `<section class="game-group" style="--c:${cat.color}">
      <div class="group-head"><span class="group-dot"></span><h3>${cat.name}</h3><p>${cat.desc}</p><span class="group-count">${games.length} jocs</span></div>
      <div class="games-grid">${games.map((g, k) => gameCard(g, i++, wide && k === 0)).join("")}</div>
    </section>`;
  }).join("");
}

$$(".filter").forEach((b) => b.addEventListener("click", () => {
  gameFilter = b.dataset.filter;
  $$(".filter").forEach((x) => x.classList.toggle("active", x === b));
  renderGames();
}));

$("#stage-back").addEventListener("click", () => { location.hash = "#jocs"; });

// ---------- So ----------
function renderSound() {
  const b = $("#sound-btn");
  b.innerHTML = Sfx.on
    ? `<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`;
  b.setAttribute("aria-label", Sfx.on ? "Silencia el so" : "Activa el so");
  b.classList.toggle("off", !Sfx.on);
}
$("#sound-btn").addEventListener("click", () => { Sfx.toggle(); renderSound(); Sfx.play("pick"); });

// ---------- Perfil ----------
function renderProfile() {
  const d = Progress.data;
  const i = Progress.levelIndex();
  const cur = LEVELS[i], next = LEVELS[i + 1];
  const pct = next ? ((d.xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100;
  const plays = Object.values(d.plays).reduce((a, b) => a + b, 0);
  const unlocked = ACHIEVEMENTS.filter((a) => d.ach[a.id]).length;

  $("#profile").innerHTML = `
    <div id="account-box"></div>
    <div class="profile-top">
      <div class="card level-card">
        <div class="lc-badge">${i + 1}</div>
        <div class="lc-body">
          <small>Nivell actual</small>
          <h3>${cur.name}</h3>
          <div class="xpbar"><div style="width:${pct}%"></div></div>
          <p class="muted">${next ? `${fmt(d.xp)} XP · en falten ${fmt(next.xp - d.xp)} per a <b>${next.name}</b>` : `${fmt(d.xp)} XP · nivell màxim`}</p>
        </div>
      </div>
      <div class="stat-grid">
        <div class="card stat"><strong>${fmt(plays)}</strong><small>partides</small></div>
        <div class="card stat"><strong>${unlocked}/${ACHIEVEMENTS.length}</strong><small>assoliments</small></div>
        <div class="card stat"><strong>${d.daily.streak}</strong><small>dies de ratxa</small></div>
      </div>
    </div>

    <h2 class="section-title sm">Carrera</h2>
    <div class="ladder">${LEVELS.map((l, k) => `<div class="rung ${k < i ? "done" : k === i ? "cur" : ""}"><b>${k + 1}</b><span>${l.name}</span><small>${fmt(l.xp)} XP</small></div>`).join("")}</div>

    <h2 class="section-title sm">Assoliments</h2>
    <div class="ach-grid">${ACHIEVEMENTS.map((a) => `
      <div class="ach ${d.ach[a.id] ? "on" : ""}">
        <span class="ach-ico">${d.ach[a.id] ? "★" : "?"}</span>
        <div><b>${a.name}</b><small>${a.desc}</small></div>
      </div>`).join("")}</div>

    <h2 class="section-title sm">Rècords</h2>
    <div class="records">${GAMES.map((g) => `
      <a class="record" href="#joc/${g.id}" style="--c:${g.color}">
        <span class="rc-dot"></span><span>${g.title}</span>
        <b>${d.best[g.id] !== undefined ? fmt(d.best[g.id]) : "—"}</b>
      </a>`).join("")}</div>

    <div id="leaderboard-box"></div>

    <div class="row"><button class="btn ghost" id="reset-progress">Esborra el progrés</button></div>`;
  window.Online?.renderAccountBox();

  $("#reset-progress").addEventListener("click", () => {
    if (confirm("Segur que vols esborrar tot el progrés, els rècords i els assoliments?")) {
      Progress.reset();
      renderProfile();
      toast("Progrés esborrat");
    }
  });
}

// ---------- Portada: Congrés de l'última legislatura ----------
function renderHeroHemicycle() {
  const { parties } = CONGRESS[2023];
  const seats = hemicycleSeats(350);
  let k = 0;
  const circles = parties.flatMap((p) => Array.from({ length: p.seats }, () => {
    const s = seats[k];
    const delay = Math.round((1 - s.a / Math.PI) * 900); // s'omple d'esquerra a dreta
    k++;
    return `<circle cx="${s.x.toFixed(4)}" cy="${s.y.toFixed(4)}" r="0.027" fill="${p.color}" style="--d:${delay}ms"><title>${p.name}</title></circle>`;
  }));
  $("#hero-hemi").innerHTML = `<svg viewBox="-1.04 -1.04 2.08 1.08">${circles.join("")}</svg>`;
  $("#hemi-legend").innerHTML = `
    <p class="legend-title">Congrés de la XV legislatura · eleccions del 23-J</p>
    <div class="legend-items">${[...parties].sort((a, b) => b.seats - a.seats).map((p) =>
      `<span class="legend-item"><i style="background:${p.color}"></i>${p.name} <b>${p.seats}</b></span>`).join("")}</div>`;
}

// ---------- Portada: repte diari ----------
const SLOT_LABEL = (label) =>
  /Cert o fals/.test(label) ? "Cert o fals" :
  /Match/.test(label) ? "Match" :
  /Qui ho va dir/.test(label) ? "Frase" :
  /En quin any/.test(label) ? "Any" :
  /Qui és/.test(label) ? "Qui és?" :
  /abans|Congrés del 23-J|Diputats/.test(label) ? "Duel" : "Pregunta";

function renderDailyHero() {
  const box = $("#daily-hero");
  if (!box) return;
  const key = todayKey();
  const r = dailyResult(key);
  const d = Progress.data.daily;
  const items = dailyItems(key);
  const dateRaw = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" });
  const date = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1);
  const grid = r ? [...r.grid] : [];
  box.classList.toggle("done", !!r);
  box.innerHTML = `
    <div class="dh-top">
      <span class="dh-badge">Repte diari <b>#${dailyNumber(key)}</b></span>
      <span class="dh-date">${date}</span>
      <span class="dh-next">Nou repte en <b id="dh-next">--:--:--</b></span>
    </div>
    <div class="dh-main">
      <div class="dh-left">
        ${r ? `
          <p class="dh-kicker">El teu temps d'avui</p>
          <div class="dh-time">${fmtTime(r.ms)}</div>
          <p class="dh-sub">${r.hits}/10 encerts · ${r.errors} ${r.errors === 1 ? "error" : "errors"}</p>
          <div class="row">
            <button class="btn primary" data-share-hero>Comparteix</button>
            <a class="btn" href="#ranking">Rànquing</a>
          </div>` : `
          <h2 class="dh-title">El repte d'avui</h2>
          <p class="dh-sub">10 proves. El cronòmetre corre i cada error suma <b>+10 s</b>.</p>
          <a class="btn dh-cta" href="#joc/diari"><span class="dh-play">▶</span> Comença</a>`}
      </div>
      <div class="dh-right">
        <div class="dh-dots" aria-label="Les 10 proves d'avui">${items.map((it, i) => {
          const st = r ? (grid[i] === "🟩" ? "ok" : "ko") : "";
          return `<span class="${st}" style="--i:${i}" title="${SLOT_LABEL(it.label)}">${i + 1}</span>`;
        }).join("")}</div>
        <div class="dh-chips">
          <span><small>Ratxa</small><b>${d.streak} ${d.streak === 1 ? "dia" : "dies"}</b></span>
          <span><small>Posició</small><b id="dh-rank">—</b></span>
        </div>
      </div>
    </div>`;
  $("[data-share-hero]", box)?.addEventListener("click", () => shareDaily(key));
  window.Online?.fillDailyRank?.(key);
  tickNextDaily();
}

function tickNextDaily() {
  const el = $("#dh-next");
  if (!el) return;
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const s = Math.floor((next - now) / 1000);
  el.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  // Si canvia el dia amb la pàgina oberta, es renova el repte
  if (s >= 86398 && location.hash.replace("#", "") in { "": 1, jocs: 1 }) renderDailyHero();
}

// ---------- Rànquing ----------
function renderRankingView(arg) {
  if (window.Online?.renderRanking) return window.Online.renderRanking($("#ranking-root"), arg);
  const scores = Object.entries(Progress.data.daily.scores)
    .filter(([, v]) => v && typeof v === "object")
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  $("#ranking-root").innerHTML = `
    <div class="rank-tabs"><button class="rank-tab active">Mundial</button><button class="rank-tab" disabled>Amics</button></div>
    <div class="card rank-off">
      <div class="gc-icon" style="--c:var(--blue)">${icon(`<path d="M8 21V11H3v10zM15 21V5h-5v16zM21 21v-7h-5v7z"/>`)}</div>
      <h3>El rànquing mundial s'activarà aviat</h3>
      <p>Quan l'app estigui publicada podràs comparar el teu temps amb tothom i crear lligues amb els teus amics. Mentrestant, aquí tens els teus temps.</p>
    </div>
    <h2 class="section-title sm">Els teus reptes</h2>
    ${scores.length ? `<div class="lb">${scores.map(([k, v]) => `
      <div class="lb-row"><b class="lb-pos">#${dailyNumber(k)}</b>
        <span class="lb-name">${new Date(k + "T12:00").toLocaleDateString("ca-ES", { day: "numeric", month: "short" })}<small>${v.grid}</small></span>
        <strong>${fmtTime(v.ms)}</strong></div>`).join("")}</div>`
      : `<p class="muted">Encara no has fet cap repte diari. <a href="#joc/diari">Fes el d'avui!</a></p>`}`;
}


// ---------- Barra inferior de vidre líquid ----------
// L'indicador és una gota de vidre que segueix el dit: es pot arrossegar d'una pestanya a l'altra.
const tabbar = $(".tabbar");
const tabInd = $(".tab-indicator");

function setIndicator(x, w, { instant = false } = {}) {
  tabInd.classList.toggle("instant", instant);
  tabInd.style.setProperty("--x", `${x}px`);
  tabInd.style.setProperty("--w", `${w}px`);
}

function updateTabIndicator() {
  if (!tabbar || !tabInd) return;
  const active = $(".tabbar a.active");
  if (!active) { tabInd.style.opacity = 0; return; }
  tabInd.style.opacity = 1;
  setIndicator(active.offsetLeft, active.offsetWidth);
}
window.addEventListener("resize", updateTabIndicator);

(() => {
  if (!tabbar) return;
  const links = $$(".tabbar a");
  let drag = null;

  const linkAt = (clientX) => {
    const r = tabbar.getBoundingClientRect();
    const x = clientX - r.left;
    return links.reduce((best, a) => (Math.abs(a.offsetLeft + a.offsetWidth / 2 - x) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - x) ? a : best), links[0]);
  };

  tabbar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const r = tabbar.getBoundingClientRect();
    drag = { id: e.pointerId, x0: e.clientX, lastX: e.clientX, lastT: performance.now(), moved: false, left: r.left, w: links[0].offsetWidth };
    tabbar.setPointerCapture(e.pointerId);
    tabbar.classList.add("pressing");
    follow(e.clientX, 0);
  });

  tabbar.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (Math.abs(e.clientX - drag.x0) > 6 && !drag.moved) { drag.moved = true; tabbar.classList.add("dragging"); }
    const now = performance.now();
    const v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT); // px/ms
    drag.lastX = e.clientX;
    drag.lastT = now;
    follow(e.clientX, v);
  });

  function follow(clientX, v) {
    const r = tabbar.getBoundingClientRect();
    const w = drag.w;
    const x = Math.min(r.width - w - 6, Math.max(6, clientX - r.left - w / 2));
    setIndicator(x, w, { instant: true });
    // Estirament de gota segons la velocitat
    const stretch = Math.min(0.35, Math.abs(v) * 0.25);
    tabInd.style.setProperty("--sx", 1 + stretch);
    tabInd.style.setProperty("--sy", 1 - stretch * 0.45);
    tabbar.style.setProperty("--lx", `${((clientX - r.left) / r.width) * 100}%`);
    const hover = linkAt(clientX);
    links.forEach((a) => a.classList.toggle("hover", a === hover));
  }

  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const target = linkAt(e.clientX);
    drag = null;
    tabbar.classList.remove("pressing", "dragging");
    links.forEach((a) => a.classList.remove("hover"));
    tabInd.style.setProperty("--sx", 1);
    tabInd.style.setProperty("--sy", 1);
    if (navigator.vibrate) navigator.vibrate(8);
    const href = target.getAttribute("href");
    if (location.hash !== href) location.hash = href;
    else updateTabIndicator();
  };
  tabbar.addEventListener("pointerup", release);
  tabbar.addEventListener("pointercancel", (e) => { if (drag && e.pointerId === drag.id) { drag = null; tabbar.classList.remove("pressing", "dragging"); updateTabIndicator(); } });
  // La navegació la fa el pointerup; el clic només es deixa passar si ve del teclat
  links.forEach((a) => a.addEventListener("click", (e) => { if (e.detail !== 0) e.preventDefault(); }));
})();

// ---------- Comptes i duels (es delega a online.js si està disponible) ----------
function renderDuelView(code) {
  if (window.Online) return window.Online.renderDuel(code);
  $("#duel-root").innerHTML = `
    <div class="card online-off">
      <div class="gc-icon" style="--c:var(--blue)">${icon(`<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5L18 3h3v3l-3.5 8.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>`)}</div>
      <h3>Els duels necessiten connexió</h3>
      <p>Per reptar amics cal obrir l'app des de la seva adreça web (no fent doble clic a l'arxiu) i tenir connexió a internet.</p>
    </div>`;
}
$("#account-btn").addEventListener("click", () => {
  if (window.Online) return window.Online.accountClick();
  toast("Inicia sessió només funciona amb l'app publicada a internet");
});

// ---------- Compte enrere ----------
function tickCountdown() {
  const diff = ELECTION_DATE - Date.now();
  if (diff <= 0) {
    $(".cd-grid").innerHTML = `<div style="grid-column:1/-1"><span>Avui es vota!</span></div>`;
    return;
  }
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  $("#cd-d").textContent = days;
  if ($("#hero-days")) $("#hero-days").textContent = `falten ${days} dies`;
  $("#cd-h").textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  $("#cd-m").textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  $("#cd-s").textContent = String(s % 60).padStart(2, "0");
  tickNextDaily();
  setTimeout(tickCountdown, 1000);
}

// ---------- Aprèn: guia visual ----------
const LI = "#17173d", LC = "#fffaf0", LY = "#ffcf3d", LR = "#ff4b2b", LB = "#3554ff", LG = "#0f9d58", LS = "#e2bf8c";
const lsvg = (body, vb = "0 0 160 110") => `<svg viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const LEARN_NUMBERS = [
  { n: 350, label: "diputats al Congrés", c: LR },
  { n: 208, label: "senadors elegits a les urnes", c: "#c39a5f" },
  { n: 176, label: "escons per tenir majoria absoluta", c: LB },
  { n: 52, label: "circumscripcions: 50 províncies, Ceuta i Melilla", c: "#f2b600" },
  { n: 3, suffix: " %", label: "dels vots vàlids per entrar al repartiment", c: "#00a37a" },
  { n: 38.7, dec: 1, suffix: " M", label: "persones cridades a votar", c: "#7b3fe4" },
];

const VOTE_STEPS = [
  { t: "Mira on et toca", d: "La targeta censal t'indica el col·legi i la mesa. També ho pots consultar al web de l'INE.",
    art: lsvg(`<rect x="22" y="30" width="96" height="62" rx="8" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M36 50h40M36 64h56M36 78h30" stroke="${LI}" stroke-width="4"/>
      <path d="M118 12c-12 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-8-20-20-20z" fill="${LR}" stroke="${LI}" stroke-width="4"/><circle cx="118" cy="32" r="7" fill="${LC}" stroke="${LI}" stroke-width="3"/>`) },
  { t: "Porta un document", d: "DNI, passaport o carnet de conduir originals i amb foto. El resguard del DNI no serveix.",
    art: lsvg(`<rect x="20" y="20" width="120" height="74" rx="10" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="32" y="34" width="34" height="42" rx="6" fill="${LC}" stroke="${LI}" stroke-width="4"/>
      <circle cx="49" cy="50" r="7" fill="${LI}"/><path d="M38 72c2-8 20-8 22 0" stroke="${LI}" stroke-width="4"/><path d="M78 42h48M78 56h36M78 70h44" stroke="${LI}" stroke-width="4"/>`) },
  { t: "Papereta blanca: Congrés", d: "Tries una llista sencera, tancada i bloquejada. No hi pots tatxar ni afegir noms.",
    art: lsvg(`<g transform="rotate(-4 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><rect x="48" y="16" width="64" height="14" rx="3" fill="${LR}"/>
      <path d="M52 44h56M52 56h56M52 68h56M52 80h40M52 92h48" stroke="${LI}" stroke-width="3.5"/></g>`) },
  { t: "Papereta sèpia: Senat", d: "Llista oberta: marques fins a 3 candidats (de qualsevol partit) a les províncies que n'elegeixen 4.",
    art: lsvg(`<g transform="rotate(3 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="${LS}" stroke="${LI}" stroke-width="4"/>
      ${[24, 42, 60, 78].map((y, i) => `<rect x="50" y="${y}" width="12" height="12" rx="2" fill="#fff" stroke="${LI}" stroke-width="3"/><path d="M70 ${y + 6}h38" stroke="${LI}" stroke-width="3.5"/>${i !== 2 ? `<path d="M52 ${y + 6}l3 4 6-8" stroke="${LR}" stroke-width="3.5"/>` : ""}`).join("")}</g>`) },
  { t: "A l'urna", d: "Es vota de 9 a 20 h. Si a les 20 h encara hi ha gent a la cua dins del local, pot votar.",
    art: lsvg(`<g transform="rotate(-8 80 30)"><rect x="60" y="4" width="40" height="44" rx="3" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M68 18h24M68 28h18" stroke="${LI}" stroke-width="3.5"/></g>
      <rect x="24" y="46" width="112" height="58" rx="8" fill="${LI}"/><rect x="56" y="40" width="48" height="10" rx="3" fill="${LC}" stroke="${LI}" stroke-width="3"/><path d="M48 76h64" stroke="${LY}" stroke-width="5"/>`) },
];

const VOTE_TYPES = [
  { t: "Vot en blanc", d: "El sobre buit o una papereta en blanc oficial.", c: "#fff",
    facts: [[true, "És un vot vàlid"], [true, "Compta per calcular el 3 %"], [false, "No dona escons a ningú"]],
    art: lsvg(`<rect x="30" y="30" width="100" height="62" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M30 34l50 34 50-34" stroke="${LI}" stroke-width="4"/>`) },
  { t: "Vot nul", d: "Papereta ratllada, de més d'un partit, amb objectes o no oficial.", c: "#ffd5cb",
    facts: [[false, "No és un vot vàlid"], [false, "No compta per al 3 %"], [false, "No dona escons a ningú"]],
    art: lsvg(`<rect x="44" y="10" width="72" height="92" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M54 30h52M54 44h52M54 58h40" stroke="${LI}" stroke-width="3.5"/>
      <path d="M50 24l60 64M110 24l-60 64" stroke="${LR}" stroke-width="7"/>`) },
  { t: "Abstenció", d: "No anar a votar.", c: "#e6d9bf",
    facts: [[false, "No es compta enlloc"], [false, "No afecta el càlcul del 3 %"], [false, "Els escons es reparteixen igualment"]],
    art: lsvg(`<rect x="46" y="12" width="68" height="90" rx="4" fill="${LS}" stroke="${LI}" stroke-width="4"/><circle cx="100" cy="60" r="4" fill="${LI}"/>
      <path d="M20 102h120" stroke="${LI}" stroke-width="4"/><path d="M122 30l10-10M126 44h14M122 58l10 10" stroke="${LI}" stroke-width="4"/>`) },
];

const HONDT_STEPS = [
  { t: "1 · Llindar", d: "Fora les candidatures que no arriben al 3 % dels vots vàlids de la província.",
    art: lsvg(`<path d="M16 96h128" stroke="${LI}" stroke-width="4"/>${[[24, 70, LR], [52, 52, LB], [80, 34, LY], [108, 10, "#c9c2b0"]].map(([x, hgt, f]) => `<rect x="${x}" y="${96 - hgt}" width="22" height="${hgt}" rx="3" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}
      <path d="M12 80h136" stroke="${LR}" stroke-width="3" stroke-dasharray="6 6"/>`) },
  { t: "2 · Divideix", d: "Els vots de cada partit es divideixen entre 1, 2, 3… fins al nombre d'escons.",
    art: lsvg(`${["÷1", "÷2", "÷3"].map((h2, i) => `<rect x="${20 + i * 42}" y="14" width="36" height="22" rx="4" fill="${LI}"/><text x="${38 + i * 42}" y="30" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="12" fill="${LC}">${h2}</text>`).join("")}
      ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 42}" y="${44 + r * 28}" width="36" height="22" rx="4" fill="${(r === 0 && c < 2) || (r === 1 && c === 0) ? LY : "#fff"}" stroke="${LI}" stroke-width="3"/>`).join("")).join("")}`) },
  { t: "3 · Reparteix", d: "Els escons van als quocients més alts. Afavoreix els partits grans a les províncies petites.",
    art: lsvg(`${[LR, LR, LR, LB, LB, LY, LR].map((f, i) => `<rect x="${18 + (i % 4) * 32}" y="${18 + Math.floor(i / 4) * 40}" width="26" height="30" rx="6" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}`) },
];

const AFTER_FLOW = [
  { k: "29 nov", t: "Votació i recompte", d: "La nit electoral ja dona el resultat provisional." },
  { k: "4-7 des", t: "Escrutini oficial", d: "Les juntes electorals proclamen els resultats." },
  { k: "23 des", t: "Es constitueixen les Corts", d: "Congrés i Senat elegeixen les seves presidències." },
  { k: "Consultes", t: "El Rei proposa un candidat", d: "Després de parlar amb tots els grups." },
  { k: "Investidura", t: "176 o més sís que nos", d: "1a votació: majoria absoluta. 2a, 48 hores després: majoria simple." },
  { k: "2 mesos", t: "O noves eleccions", d: "Si en dos mesos ningú no és investit, les Corts es dissolen.", warn: true },
];

function renderLearn() {
  // 01 Xifres
  $("#learn-numbers").innerHTML = LEARN_NUMBERS.map((x, i) => `
    <div class="num-tile" style="--nc:${x.c};--i:${i}">
      <strong data-count="${x.n}" data-dec="${x.dec || 0}" data-suffix="${x.suffix || ""}">0${x.suffix || ""}</strong>
      <span>${x.label}</span>
    </div>`).join("");
  // 03 Com es vota
  $("#vote-steps").innerHTML = VOTE_STEPS.map((s, i) => `
    <li class="vote-step" style="--i:${i}">
      <div class="vs-art">${s.art}</div>
      <b class="vs-n">${i + 1}</b>
      <h3>${s.t}</h3><p>${s.d}</p>
    </li>`).join("");
  // 04 Blanc, nul o abstenció
  $("#vote-types").innerHTML = VOTE_TYPES.map((v) => `
    <article class="vtype" style="--vc:${v.c}">
      <div class="vt-art">${v.art}</div>
      <h3>${v.t}</h3><p>${v.d}</p>
      <ul>${v.facts.map(([ok, f]) => `<li class="${ok ? "yes" : "no"}"><i>${ok ? "✓" : "✕"}</i>${f}</li>`).join("")}</ul>
    </article>`).join("");
  // 05 Vots i escons
  $("#hondt-steps").innerHTML = HONDT_STEPS.map((s) => `
    <div class="hstep"><div class="hs-art">${s.art}</div><h3>${s.t}</h3><p>${s.d}</p></div>`).join("");
  // 06 Després
  $("#after-flow").innerHTML = AFTER_FLOW.map((s, i) => `
    <li class="af ${s.warn ? "warn" : ""}" style="--i:${i}">
      <span class="af-k">${s.k}</span><b>${s.t}</b><p>${s.d}</p>
    </li>`).join("");
  // 07 Diccionari
  const tones = [LR, LB, LY, "#00a37a", "#7b3fe4", "#e0306f"];
  $("#dict-grid").innerHTML = [...WORDS].sort((a, b) => a.w.localeCompare(b.w, "ca")).map((w, i) => `
    <button class="flip" style="--fc:${tones[i % tones.length]}" aria-label="${esc(w.w)}">
      <span class="flip-in">
        <span class="flip-front"><b class="${Math.max(...w.w.split(" ").map((x) => x.length)) > 10 ? "long" : ""}">${esc(w.w)}</b><small>Toca per veure-ho</small></span>
        <span class="flip-back"><b>${esc(w.w)}</b><span>${esc(w.d)}</span></span>
      </span>
    </button>`).join("");
  $$(".flip").forEach((b) => b.addEventListener("click", () => { b.classList.toggle("on"); Sfx.play("pick"); }));

  // Navegació interna
  $$(".learn-nav a").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById(a.dataset.go)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  // Animacions en entrar a la vista: comptadors i hemicicle que es desplega
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    if (en.target.id === "hero-hemi") en.target.classList.add("play");
    else countUp(en.target);
  }), { threshold: 0.35 });
  io.observe($("#hero-hemi"));
  $$("[data-count]").forEach((el) => io.observe(el));
}

function countUp(el) {
  const target = Number(el.dataset.count), dec = Number(el.dataset.dec), suf = el.dataset.suffix;
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 1100);
    const v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = v.toLocaleString("ca-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}


// ---------- Aprèn: partits cara a cara ----------
const cmpSel = { a: "psoe", b: "pp", next: "b" };
const partyById = (id) => PARTIES.find((p) => p.id === id);

// Foto de Commons (amb crèdit) o inicials
function personPhoto(name, color, size = "md") {
  const ph = PHOTOS[name];
  if (ph) {
    return `<figure class="pphoto ${size}" style="--pc:${color}">
      <img src="${esc(ph.src)}" alt="${esc(name)}" loading="lazy">
      <figcaption><a href="${esc(ph.page)}" target="_blank" rel="noopener">Foto: ${esc(ph.author)} · ${esc(ph.license)}</a></figcaption>
    </figure>`;
  }
  const ini = name.split(/\s+/).filter((w) => /^[A-ZÀ-ÚÒ]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  return `<figure class="pphoto ${size} ini" style="--pc:${color}"><span>${esc(ini)}</span></figure>`;
}

function renderPartyMap() {
  const W = 640, H = 430, L = 54, R = 20, T = 26, B = 46;
  const M = 30; // marge intern perquè les bombolles no surtin del requadre
  const px = (x) => L + M + (x / 10) * (W - L - R - 2 * M);
  const py = (y) => H - B - M - (y / 10) * (H - T - B - 2 * M);
  const rad = (s) => Math.max(13, 8 + Math.sqrt(s) * 2.6);
  const sorted = [...PARTIES].sort((p, q) => q.seats - p.seats); // els grans a sota
  $("#party-map").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa ideològic orientatiu dels partits">
      <rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>
      <rect x="${L}" y="${T}" width="${(W - L - R) / 2}" height="${(H - T - B) / 2}" rx="14" fill="rgba(255,75,43,.06)"/>
      <rect x="${L + (W - L - R) / 2}" y="${T}" width="${(W - L - R) / 2}" height="${(H - T - B) / 2}" fill="rgba(53,84,255,.05)"/>
      <path d="M${px(5)} ${T}V${H - B}M${L} ${py(5)}H${W - R}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 6" opacity=".5"/>
      <text x="${L + 10}" y="${H - B + 30}" class="ax">← Esquerra</text>
      <text x="${W - R - 10}" y="${H - B + 30}" class="ax" text-anchor="end">Dreta →</text>
      <text x="${L - 14}" y="${T + 14}" class="ax" transform="rotate(-90 ${L - 14} ${T + 14})" text-anchor="end">Sobiranisme ↑</text>
      <text x="${L - 14}" y="${H - B - 4}" class="ax" transform="rotate(-90 ${L - 14} ${H - B - 4})" text-anchor="start">Centralisme</text>
      ${sorted.map((p) => {
        const sel = p.id === cmpSel.a ? "A" : p.id === cmpSel.b ? "B" : "";
        return `<g class="pm-dot ${sel ? "sel" : ""}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.sig}">
          <circle cx="${px(p.x)}" cy="${py(p.y)}" r="${rad(p.seats)}" fill="${p.color}" stroke="var(--ink)" stroke-width="${sel ? 4 : 2.5}"/>
          <text x="${px(p.x)}" y="${py(p.y) + 4}" text-anchor="middle" class="pm-lbl ${p.seats < 20 ? "out" : ""}" ${p.seats < 20 ? `dy="${rad(p.seats) + 12}"` : ""}>${p.sig}</text>
          ${sel ? `<circle cx="${px(p.x) + rad(p.seats) * .72}" cy="${py(p.y) - rad(p.seats) * .72}" r="10" fill="var(--ink)"/><text x="${px(p.x) + rad(p.seats) * .72}" y="${py(p.y) - rad(p.seats) * .72 + 4}" text-anchor="middle" class="pm-sel">${sel}</text>` : ""}
        </g>`;
      }).join("")}
    </svg>
    <p class="pm-cap">La mida de cada bombolla és proporcional als escons del 2023. Toca un partit per afegir-lo al comparador.</p>`;
  $$(".pm-dot").forEach((g) => {
    const go = () => pickParty(g.dataset.id);
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

function pickParty(id) {
  if (id === cmpSel.a || id === cmpSel.b) return;
  cmpSel[cmpSel.next] = id;
  cmpSel.next = cmpSel.next === "a" ? "b" : "a";
  Sfx.play("pick");
  renderParties();
}

const voteBadge = (v) => `<span class="vbadge ${v === "sí" ? "yes" : v === "no" ? "no" : "na"}">${v === "sí" ? "✓ Sí" : v === "no" ? "✕ No" : "—"}</span>`;

function renderCompare() {
  const A = partyById(cmpSel.a), B = partyById(cmpSel.b);
  $("#cmp-pick").innerHTML = PARTIES.map((p) => {
    const sel = p.id === cmpSel.a ? "A" : p.id === cmpSel.b ? "B" : "";
    return `<button class="pchip ${sel ? "on" : ""}" data-id="${p.id}" style="--pc:${p.color}"><i></i>${p.sig}${sel ? `<b>${sel}</b>` : ""}</button>`;
  }).join("");
  $$(".pchip").forEach((b) => b.addEventListener("click", () => pickParty(b.dataset.id)));

  const col = (p, side) => `
    <article class="cmp-col" style="--pc:${p.color}">
      <header class="cmp-head"><span class="cmp-side">${side}</span><b>${p.sig}</b><small>${p.name}</small></header>
      <div class="cmp-cand">
        ${personPhoto(p.cand.name, p.color, "lg")}
        <div><small>Cap de llista al 29N</small><h4>${p.cand.name}</h4><p>${p.cand.info}</p></div>
      </div>
      ${PARTY_ARGS[p.id] ? `<div class="cmp-core"><small>Idea central</small><q>${PARTY_ARGS[p.id].core}</q><p>${PARTY_ARGS[p.id].about}</p></div>` : ""}
      <dl class="cmp-rows">
        <div><dt>Líder del partit</dt><dd>${p.leader ? `${p.leader.name} <span class="muted">· ${p.leader.role}</span>` : `<span class="muted">Coalició sense un líder únic</span>`}</dd></div>
        <div><dt>Escons el 2023</dt><dd><span class="big">${p.seats}</span><span class="seatbar"><i style="width:${(p.seats / 350) * 100}%"></i><em></em></span></dd></div>
        <div><dt>Vots el 2023</dt><dd>${p.votes != null ? `<span class="big">${String(p.votes).replace(".", ",")} %</span>` : `<span class="muted">No es va presentar sol</span>`}</dd></div>
        <div><dt>Ideari</dt><dd class="chips">${p.ideas.map((x) => `<span>${x}</span>`).join("")}</dd></div>
        <div><dt>Model territorial</dt><dd>${p.territory || `<span class="muted">Sense posició destacada</span>`}</dd></div>
        <div><dt>Investidura de Sánchez (2023)</dt><dd>${voteBadge(p.inv)}</dd></div>
        <div><dt>Llei d'amnistia (2024)</dt><dd>${voteBadge(p.amn)}</dd></div>
        <div><dt>Grup europeu</dt><dd>${p.euro}</dd></div>
        <div><dt>Fundació</dt><dd>${p.founded}</dd></div>
        ${p.note ? `<div><dt>A tenir en compte</dt><dd class="muted">${p.note}</dd></div>` : ""}
        ${PARTY_EXTRA[p.id] ? `
        <div><dt>Història</dt><dd>${PARTY_EXTRA[p.id].hist}</dd></div>
        <div><dt>On governa</dt><dd>${PARTY_EXTRA[p.id].gov}</dd></div>
        <div><dt>On és més fort</dt><dd>${PARTY_EXTRA[p.id].strong}</dd></div>
        <div><dt>Propostes estrella</dt><dd><ul class="stars">${PARTY_EXTRA[p.id].stars.map((x) => `<li>${x}</li>`).join("")}</ul></dd></div>
        <div><dt>Aliances</dt><dd>${PARTY_EXTRA[p.id].allies}</dd></div>
        <div><dt>Competeix amb</dt><dd>${PARTY_EXTRA[p.id].vs}</dd></div>` : ""}
      </dl>
    </article>`;
  $("#cmp").innerHTML = col(A, "A") + `<span class="cmp-vs">VS</span>` + col(B, "B");
  renderFace(A, B);
  const argA = PARTY_ARGS[A.id] || {}, argB = PARTY_ARGS[B.id] || {};
  const cell = (p, txt) => `<div class="args-cell" style="--pc:${p.color}"><b>${p.sig}</b>${txt ? `<p>${txt}</p>` : `<p class="muted">Sense proposta destacada en aquest tema.</p>`}</div>`;
  $("#args").innerHTML = `
    <div class="args-head"><h3>Què proposen, tema a tema</h3><p><span style="--pc:${A.color}">${A.sig}</span> vs <span style="--pc:${B.color}">${B.sig}</span></p></div>
    ${ARG_AREAS.map((ar) => `
      <div class="args-row">
        <div class="args-label"><svg viewBox="0 0 24 24">${ar.icon}</svg><span>${ar.label}</span></div>
        ${cell(A, argA[ar.k])}${cell(B, argB[ar.k])}
      </div>`).join("")}
    <p class="src-note">Resum a partir dels programes electorals del 2023 i de les posicions públiques de cada partit. Els programes del 29N poden introduir canvis.</p>`;
}

// Cara a cara: distància ideològica, evolució d'escons i coincidències
const SEATS_2019 = { pp: 89, psoe: 120, vox: 52, erc: 13, junts: 8, bildu: 5, pnv: 6, bng: 1, cc: 1 };
function renderFace(A, B) {
  const el = $("#face");
  if (!el) return;
  const axis = (label, lo, hi, a, b) => `<div class="fx">
    <small>${label}</small>
    <div class="fx-track"><span class="lo">${lo}</span><span class="hi">${hi}</span>
      <i class="fx-dot" style="--v:${a * 10}%;--pc:${A.color}">A</i><i class="fx-dot" style="--v:${b * 10}%;--pc:${B.color}">B</i></div></div>`;
  const dist = Math.min(100, Math.round(Math.hypot(Math.abs(A.x - B.x), Math.abs(A.y - B.y)) * 10));
  const same = [];
  if (A.inv !== "—" && B.inv !== "—") same.push(A.inv === B.inv ? `Van votar igual la investidura de Sánchez (${A.inv})` : "Van votar diferent la investidura de Sánchez");
  if (A.amn !== "—" && B.amn !== "—") same.push(A.amn === B.amn ? `Van votar igual la llei d'amnistia (${A.amn})` : "Van votar diferent la llei d'amnistia");
  if (A.euro === B.euro && !["—", "No inscrits"].includes(A.euro)) same.push(`Comparteixen grup europeu (${A.euro})`);
  const common = A.ideas.filter((x) => B.ideas.includes(x));
  if (common.length) same.push(`Ideari en comú: ${common.join(", ")}`);
  const evo = (p) => {
    const s19 = SEATS_2019[p.id];
    if (s19 == null) return `<span class="muted">Sense dades comparables</span>`;
    const d = p.seats - s19;
    return `<b>${s19} → ${p.seats}</b> <span class="delta ${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "+" : ""}${d}</span>`;
  };
  const both = ARG_AREAS.filter((ar) => (PARTY_ARGS[A.id] || {})[ar.k] && (PARTY_ARGS[B.id] || {})[ar.k]).length;
  el.innerHTML = `
    <div class="face-head"><h3>Cara a cara</h3><p><span style="--pc:${A.color}">${A.sig}</span> vs <span style="--pc:${B.color}">${B.sig}</span></p></div>
    <div class="face-grid">
      <div class="face-card">
        <h4>Distància ideològica</h4>
        <div class="dist"><div class="dist-bar"><i style="width:${dist}%"></i></div><b>${dist}/100</b></div>
        <p class="muted">${dist < 25 ? "Molt a prop en el mapa ideològic." : dist < 55 ? "Posicions diferents però amb punts de contacte." : "Posicions molt allunyades."}</p>
        ${axis("Eix esquerra–dreta", "Esquerra", "Dreta", A.x, B.x)}
        ${axis("Eix territorial", "Centralisme", "Sobiranisme", 10 - A.y, 10 - B.y)}
      </div>
      <div class="face-card">
        <h4>Escons 2019 → 2023</h4>
        <div class="evo"><span style="--pc:${A.color}"><em>${A.sig}</em>${evo(A)}</span><span style="--pc:${B.color}"><em>${B.sig}</em>${evo(B)}</span></div>
        <h4>Coincidències i diferències</h4>
        <ul class="same">${same.length ? same.map((x) => `<li>${x}</li>`).join("") : "<li>No hi ha dades de votacions comparables.</li>"}</ul>
        <p class="muted">Tots dos tenen proposta en ${both} de ${ARG_AREAS.length} àrees (taula de sota).</p>
      </div>
    </div>`;
}

function renderCandidates() {
  $("#cand-grid").innerHTML = PARTIES.map((p, i) => `
    <article class="cand" style="--pc:${p.color};--i:${i}">
      ${personPhoto(p.cand.name, p.color)}
      <span class="cand-sig">${p.sig}</span>
      <h4>${p.cand.name}</h4>
      <p>${p.cand.info}</p>
      <button class="btn ghost cand-cmp" data-id="${p.id}">Compara</button>
    </article>`).join("");
  $$(".cand-cmp").forEach((b) => b.addEventListener("click", () => {
    pickParty(b.dataset.id);
    $("#party-map").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function renderParties() {
  renderPartyMap();
  renderCompare();
  if (!$("#cand-grid").children.length) renderCandidates();
}

// ---------- Aprèn: simulador lliure ----------
const SIM_EXAMPLE = [["Partit A", 120000], ["Partit B", 95000], ["Partit C", 40000], ["Partit D", 22000], ["Partit E", 7500]];

function addSimParty(name = "", votes = "") {
  const row = h(`<div class="h-party">
    <input type="text" class="p-name" placeholder="Nom de la candidatura" value="${esc(name)}">
    <input type="number" class="p-votes" min="0" placeholder="Vots" value="${votes}">
    <button class="del" aria-label="Elimina">×</button>
  </div>`);
  $(".del", row).addEventListener("click", () => row.remove());
  $("#h-parties").appendChild(row);
}

function loadSimExample() {
  $("#h-parties").innerHTML = "";
  SIM_EXAMPLE.forEach(([n, v]) => addSimParty(n, v));
  $("#h-seats").value = 7;
  $("#h-blank").value = 2000;
  $("#h-threshold").value = 3;
  $("#h-result").hidden = true;
}

function calcSim() {
  const seats = Math.min(60, Math.max(1, parseInt($("#h-seats").value, 10) || 1));
  const blank = Math.max(0, parseInt($("#h-blank").value, 10) || 0);
  const threshold = Math.max(0, parseFloat($("#h-threshold").value) || 0);
  const parties = $$("#h-parties .h-party")
    .map((row, i) => ({
      name: $(".p-name", row).value.trim() || `Candidatura ${i + 1}`,
      votes: Math.max(0, parseInt($(".p-votes", row).value, 10) || 0),
    }))
    .filter((p) => p.votes > 0)
    .sort((a, b) => b.votes - a.votes);

  const res = $("#h-result");
  res.hidden = false;
  if (!parties.length) {
    res.innerHTML = `<p class="sim-note">Afegeix almenys una candidatura amb vots.</p>`;
    return;
  }
  const valid = parties.reduce((s, p) => s + p.votes, 0) + blank;
  const min = (valid * threshold) / 100;
  const elig = parties.filter((p) => p.votes >= min);
  const { won, winners } = dhondt(elig.map((p) => p.votes), seats);
  const maxV = parties[0].votes;
  const SIM_COLORS = ["#ff4b2b", "#3554ff", "#f2b600", "#00a37a", "#7b3fe4", "#e0306f", "#17173d"];
  const colorOf = (p) => SIM_COLORS[parties.indexOf(p) % SIM_COLORS.length];
  const seatSquares = winners.map((w) => `<i style="background:${colorOf(elig[w.pi])}" title="${esc(elig[w.pi].name)}"></i>`).join("");

  res.innerHTML = `
    <div class="sim-seats" aria-label="Escons repartits">${seatSquares}</div>
    <div class="sim-bars">${parties.map((p) => {
      const k = elig.indexOf(p);
      return `<div class="sim-bar ${k < 0 ? "out" : ""}" title="${fmt(p.votes)} vots (${((p.votes / valid) * 100).toFixed(2)} %)">
        <span>${esc(p.name)}</span>
        <div class="track"><div style="width:${Math.max(2, (p.votes / maxV) * 100)}%;background:${k < 0 ? "" : colorOf(p)}"></div></div>
        <strong>${k < 0 ? 0 : won[k]}</strong>
      </div>`;
    }).join("")}</div>
    <p class="sim-note">Vots vàlids: ${fmt(valid)} (${fmt(blank)} en blanc) · Llindar del ${threshold} %: ${fmt(Math.ceil(min))} vots${
      elig.length < parties.length ? ` · Queden fora: ${parties.filter((p) => !elig.includes(p)).map((p) => esc(p.name)).join(", ")}` : ""}</p>
    ${elig.length ? quotientTable(elig.map((p) => p.name), elig.map((p) => p.votes), seats, winners) : ""}`;
}

$("#h-add").addEventListener("click", () => addSimParty());
$("#h-example").addEventListener("click", loadSimExample);
$("#h-calc").addEventListener("click", calcSim);

// ---------- Calendari ----------
function renderCalendar() {
  const today = new Date().toISOString().slice(0, 10);
  let nextMarked = false;
  $("#timeline").innerHTML = CALENDAR.map((e, i) => {
    let cls = e.key ? "key" : "";
    if (e.date < today) cls += " done";
    else if (!nextMarked) { cls += " next"; nextMarked = true; }
    const day = Number(e.date.slice(8, 10));
    return `<li class="tl ${cls}" style="--i:${i}">
      <span class="tl-dot">${day}</span>
      <div class="tl-body"><div class="tl-date">${e.label}</div><div class="tl-text">${e.text}</div></div>
    </li>`;
  }).join("");
}

// ---------- Arrencada ----------
renderLevel();
renderSound();
renderHeroHemicycle();
renderLearn();
renderParties();
renderPacte();
loadNews();
renderCalendar();
loadSimExample();
tickCountdown();
window.addEventListener("hashchange", route);
route();

// Sense zoom amb dos dits (Safari iOS ignora user-scalable=no) ni menú contextual als enllaços
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("contextmenu", (e) => { if (e.target.closest("a, button, .tabbar, .game-card")) e.preventDefault(); });
