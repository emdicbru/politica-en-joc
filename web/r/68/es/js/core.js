// Nucli: utilitats, so, progrés i assoliments, navegació i marc comú de les partides.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => Math.round(n).toLocaleString("es-ES");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sample = (arr, n, rng) => shuffle(arr, rng).slice(0, n);

// Generador pseudoaleatori amb llavor (per al repte diari)
function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- Idioma ----------
// L'app s'escriu en català (/) i tools/tradueix.js en genera la versió en castellà (/es/). Totes dues comparteixen el
// progrés (és el mateix domini). La tria es desa a r29n-lang; sense tria, un navegador en castellà va a /es/ (index.html).
const PEJ_LANG = document.documentElement.lang === "es" ? "es" : "ca";
window.PEJ_LANG = PEJ_LANG;
const LANG_KEY = "r29n-lang";
const LANG_NAMES = [["ca", "Català"], ["es", "Castellano"]];
const langHref = (to) => new URL(to === PEJ_LANG ? "./" : to === "es" ? "es/" : "../", location.href).pathname + location.search + location.hash;
const langLinks = (cls = "lang-sw") => `<span class="${cls}" role="group" aria-label="Idioma">${LANG_NAMES.map(([k, n]) =>
  `<a href="${langHref(k)}" data-lang="${k}" lang="${k}" hreflang="${k}"${k === PEJ_LANG ? ' aria-current="true"' : ""}>${n}</a>`).join("")}</span>`;
// Botó de la capçalera: porta a l'altre idioma (el text, en aquell idioma, perquè l'entengui qui el busca)
{
  const to = PEJ_LANG === "es" ? "ca" : "es";
  const name = to === "es" ? ["ES", "Versión en castellano"] : ["CA", "Versió en català"];
  document.querySelector(".top-actions")?.insertAdjacentHTML("afterbegin", `<a class="lang-btn" href="${langHref(to)}" data-lang="${to}" lang="${to}" hreflang="${to}" title="${name[1]}" aria-label="${name[1]}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg><b>${name[0]}</b></a>`);
}
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("[data-lang]");
  if (!a) return;
  e.preventDefault();
  try { localStorage.setItem(LANG_KEY, a.dataset.lang); } catch { /* sense emmagatzematge */ }
  if (a.dataset.lang !== PEJ_LANG) location.href = langHref(a.dataset.lang);
});

// ---------- Emmagatzematge ----------
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sense emmagatzematge */ }
  },
};

// ---------- So ----------
const Sfx = {
  on: store.get("r29n-sound", true),
  ac: null,
  toggle() { this.on = !this.on; store.set("r29n-sound", this.on); return this.on; },
  tone(freq, dur, { type = "sine", vol = 0.12, at = 0, slide } = {}) {
    const ac = this.ac, t = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.on) return;
    try {
      this.ac ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state === "suspended") this.ac.resume();
      const T = (f, d, o) => this.tone(f, d, o);
      switch (name) {
        case "ok": T(660, 0.09, { type: "triangle" }); T(990, 0.16, { type: "triangle", at: 0.08 }); break;
        case "ko": T(220, 0.28, { type: "sawtooth", vol: 0.06, slide: 110 }); break;
        case "tick": T(1400, 0.035, { type: "square", vol: 0.03 }); break;
        case "pick": T(520, 0.05, { type: "triangle", vol: 0.07 }); break;
        case "combo": [660, 880, 1100].forEach((f, i) => T(f, 0.08, { type: "square", vol: 0.04, at: i * 0.05 })); break;
        case "win": [523, 659, 784, 1046].forEach((f, i) => T(f, 0.18, { type: "triangle", at: i * 0.1 })); break;
        case "lose": [392, 330, 262].forEach((f, i) => T(f, 0.22, { type: "triangle", vol: 0.08, at: i * 0.12 })); break;
        case "unlock": [784, 1046, 1318].forEach((f, i) => T(f, 0.14, { type: "sine", at: i * 0.07 })); break;
      }
    } catch { /* sense àudio */ }
  },
};

// ---------- Progrés i assoliments ----------
const LEVELS = [
  { xp: 0, name: "Votante" },
  { xp: 150, name: "Interventor" },
  { xp: 400, name: "Apoderado" },
  { xp: 800, name: "Concejal" },
  { xp: 1400, name: "Diputado" },
  { xp: 2200, name: "Portavoz" },
  { xp: 3300, name: "Ministro" },
  { xp: 5000, name: "Presidente" },
];

const ACHIEVEMENTS = [
  { id: "primer", name: "Primer voto", desc: "Juega tu primera partida." },
  { id: "explorador", name: "Campaña completa", desc: "Juega a todos los minijuegos al menos una vez." },
  { id: "perfecte", name: "Pleno al 100 %", desc: "Haz una partida perfecta en cualquier juego." },
  { id: "ratxa10", name: "Imparable", desc: "Encadena 10 aciertos seguidos en Contrarreloj." },
  { id: "majoria", name: "Arquitecto de pactos", desc: "Resuelve todas las misiones de Haz mayoría a la primera." },
  { id: "historiador", name: "Historiador", desc: "Acierta un año exacto en Adivina el año." },
  { id: "detectiu", name: "Detective", desc: "Acierta un personaje con una sola pista." },
  { id: "verificador", name: "Fact-checker", desc: "Haz 20 aciertos en una partida del Verificador." },
  { id: "lexic", name: "Diccionario parlamentario", desc: "Resuelve todas las palabras de Palabra clave sin errores." },
  { id: "match", name: "Alma gemela", desc: "Haz un perfil perfecto en el Match ideológico." },
  { id: "comodins", name: "Sin chuleta", desc: "Acaba un juego de preguntas con 8 aciertos o más sin usar comodines." },
  { id: "diari3", name: "Constancia", desc: "Haz el reto diario tres días seguidos." },
  { id: "duelista", name: "Duelista", desc: "Gana un duelo 1 vs 1 contra un amigo." },
  { id: "diputat", name: "Escaño propio", desc: "Llega al nivel Diputado." },
  { id: "president", name: "La Moncloa", desc: "Llega al nivel Presidente." },
  { id: "informat", name: "Votante informado", desc: "Supera todos los capítulos de la guía de Aprende." },
];

const Progress = {
  data: Object.assign({ xp: 0, best: {}, plays: {}, ach: {}, learn: {}, daily: { last: null, streak: 0, scores: {} } }, store.get("r29n", {})),
  onSave: null, // ganxo per sincronitzar amb el núvol (online.js)
  save() { store.set("r29n", this.data); this.onSave?.(); },
  levelIndex(xp = this.data.xp) {
    let i = 0;
    while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
    return i;
  },
  unlock(id) {
    if (this.data.ach[id]) return false;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return false;
    this.data.ach[id] = Date.now();
    this.save();
    Sfx.play("unlock");
    toast(`Logro: ${a.name}`, "ach");
    return true;
  },
  record(gameId, score, xp) {
    const prevLevel = this.levelIndex();
    const prevBest = this.data.best[gameId];
    const isRecord = prevBest === undefined || score > prevBest;
    if (isRecord) this.data.best[gameId] = score;
    this.data.plays[gameId] = (this.data.plays[gameId] || 0) + 1;
    this.data.xp += xp;
    this.save();
    renderLevel();
    const newLevel = this.levelIndex();
    this.unlock("primer");
    if (GAMES.filter((g) => g.cat !== "daily" && !g.hidden).every((g) => this.data.plays[g.id])) this.unlock("explorador");
    if (newLevel >= 4) this.unlock("diputat");
    if (newLevel >= 7) this.unlock("president");
    return { isRecord: isRecord && score > 0, prevBest, levelUp: newLevel > prevLevel ? LEVELS[newLevel].name : null };
  },
  reset() {
    this.data = { xp: 0, best: {}, plays: {}, ach: {}, learn: {}, daily: { last: null, streak: 0, scores: {} } };
    try { ["r29n-sim-save", "r29n-sim-prefs", "r29n-news", "r29n-debat"].forEach((k) => localStorage.removeItem(k)); } catch { /* sense emmagatzematge */ }
    this.save();
    renderLevel();
  },
};

function renderLevel() {
  const xp = Progress.data.xp;
  const i = Progress.levelIndex(xp);
  const cur = LEVELS[i], next = LEVELS[i + 1];
  const pct = next ? ((xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100;
  const ring = $("#level-ring");
  ring.style.setProperty("--p", pct.toFixed(1));
  ring.innerHTML = `<span>${i + 1}</span>`;
  $("#level-name").textContent = cur.name;
  $("#level-xp").textContent = `${fmt(xp)} XP`;
  $("#level-chip").title = next ? `${cur.name} · ${fmt(next.xp - xp)} XP para ${next.name}` : `${cur.name} · nivel máximo`;
  if (typeof renderCoins === "function") renderCoins();
}

// ---------- Toasts i confeti ----------
const toastQueue = [];
let toastBusy = false;
function toast(msg, kind = "") {
  toastQueue.push([msg, kind]);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const item = toastQueue.shift();
  if (!item) { toastBusy = false; return; }
  toastBusy = true;
  const t = $("#toast");
  t.textContent = item[0];
  t.className = `toast show ${item[1]}`;
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(nextToast, 350);
  }, 2300);
}

function confetti(amount = 150, style = typeof shopConfetti === "function" ? shopConfetti() : null) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti");
  const ctx = cv.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = style?.colors || ["#ff4b2b", "#ffcf3d", "#3554ff", "#17173d", "#fffaf0"];
  const shape = style?.shape || "";
  const parts = Array.from({ length: amount }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 240,
    y: innerHeight * .35,
    vx: (Math.random() - .5) * 17,
    vy: -Math.random() * 15 - 4,
    w: 7 + Math.random() * 7,
    h: 9 + Math.random() * 11,
    r: Math.random() * Math.PI,
    vr: (Math.random() - .5) * .3,
    c: colors[rand(0, colors.length - 1)],
  }));
  let frame = 0;
  (function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.strokeStyle = "#17173d";
      ctx.lineWidth = 1.5;
      if (shape === "star") {
        ctx.beginPath();
        for (let k = 0; k < 10; k++) { const rr = k % 2 ? p.w * 0.45 : p.w; const a = (k * Math.PI) / 5; ctx.lineTo(Math.sin(a) * rr, -Math.cos(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (shape === "ballot") {
        ctx.fillRect(-p.w * 0.7, -p.h * 0.7, p.w * 1.4, p.h * 1.4);
        ctx.strokeRect(-p.w * 0.7, -p.h * 0.7, p.w * 1.4, p.h * 1.4);
        ctx.beginPath(); ctx.moveTo(-p.w * 0.4, -p.h * 0.3); ctx.lineTo(p.w * 0.4, -p.h * 0.3); ctx.moveTo(-p.w * 0.4, p.h * 0.1); ctx.lineTo(p.w * 0.2, p.h * 0.1); ctx.stroke();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    if (++frame < 170) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

// ---------- Registre de jocs ----------
const GAMES = [];
// El color de cada joc el marca la seva categoria (vegeu art.js)
function registerGame(def) {
  if (GAME_CATS[def.cat]) def.color = GAME_CATS[def.cat].color;
  GAMES.push(def);
}
// Partides creades al vol (p. ex. un duel concret), fora de la graella de jocs
const DYNAMIC_GAMES = new Map();
const gameById = (id) => GAMES.find((g) => g.id === id) || DYNAMIC_GAMES.get(id);

// ---------- Navegació ----------
const VIEWS = ["inici", "noticies", "jocs", "joc", "ranking", "duel", "simulador", "apren", "calendari", "perfil", "legal", "nit", "control", "pronostics", "botiga", "premsa", "baixa"];
let session = null; // partida en curs

function route() {
  const [view, arg] = location.hash.slice(1).split("/");
  // L'antiga pàgina d'Actualitat d'Aprèn ara és la secció Notícies
  if (view === "apren" && arg === "actualitat") { location.replace("#noticies"); return; }
  const v = VIEWS.includes(view) ? view : "inici";
  if (v !== "joc" || session?.game.id !== arg) endSession();

  VIEWS.forEach((name) => { $(`#view-${name}`).hidden = name !== v; });
  const navKey = v === "joc" ? (arg?.startsWith("duel-") ? "social" : arg === "simulador" || arg === "debat" ? "simulador" : arg === "noticies-quiz" ? "noticies" : "jocs") : v === "calendari" ? "apren" : v === "duel" || v === "ranking" ? "social" : v === "nit" ? "inici" : v === "control" || v === "botiga" ? "perfil" : v === "pronostics" ? "social" : v;
  $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === navKey));
  document.body.classList.toggle("playing", v === "joc");

  if (v === "joc") {
    const game = gameById(arg);
    if (!game) { location.hash = "#jocs"; return; }
    if (!session) openGame(game);
  }
  if (v === "inici") renderHome();
  if (v === "noticies") renderNoticies(arg);
  if (v === "jocs") renderGames();
  if (v === "perfil") renderProfile();
  if (v === "apren") renderApren(arg);
  if (v === "simulador") renderSimHome(arg);
  if (v === "legal") renderLegal(arg);
  if (v === "duel") renderDuelView(arg);
  if (v === "ranking") renderRankingView(arg);
  if (v === "nit") renderNit(arg);
  if (v === "control") renderControl();
  if (v === "pronostics") renderPronostics(arg);
  if (v === "botiga") renderBotiga();
  if (v === "premsa") renderPremsa(arg);
  if (v === "baixa") renderBaixa(arg);
  updateTabIndicator();
  window.scrollTo({ top: 0 });
}

// ---------- Sessió de joc ----------
function endSession() {
  if (!session) return;
  session.cleanup.forEach((fn) => fn());
  session = null;
}

function openGame(game) {
  $("#view-joc").style.setProperty("--c", game.color);
  $("#stage-kicker").textContent = game.kicker;
  $("#stage-title").textContent = game.title;
  // Sense usuari només es poden jugar unes quantes partides de prova (online.js)
  if (window.Online?.gate?.()) {
    endSession();
    $("#hud").innerHTML = "";
    $("#stage-body").innerHTML = window.Online.gateHtml();
    return;
  }
  game.autostart ? startGame(game) : showIntro(game);
}

function showIntro(game) {
  endSession();
  session = { game, cleanup: [] };
  $("#hud").innerHTML = "";
  const best = Progress.data.best[game.id];
  const extra = game.introExtra ? game.introExtra() : "";
  const body = $("#stage-body");
  body.innerHTML = "";
  const el = h(`
    <div class="card intro">
      <div class="gc-icon" style="--c:${game.color}">${game.icon}</div>
      <p class="intro-kicker">${game.kicker}</p>
      <h3>${game.title}</h3>
      <p>${game.desc}</p>
      <div class="rules">${game.rules.map((r) => `<span>${r}</span>`).join("")}</div>
      ${extra}
      <button class="btn primary lg" data-start>Empieza</button>
      ${best !== undefined ? `<p class="intro-best">Tu récord: <b>${fmt(best)}</b></p>` : ""}
    </div>`);
  body.appendChild(el);
  const startBtn = $("[data-start]", el);
  // Un joc pot condicionar si es pot començar (p. ex. el repte diari, amb el límit de partides del dia)
  const gate = game.gate?.();
  if (gate) {
    startBtn.replaceWith(h(gate.html));
    gate.bind(el, () => startGame(game));
    return;
  }
  startBtn.focus();
  startBtn.addEventListener("click", () => { Sfx.play("pick"); startGame(game); });
}

function startGame(game) {
  endSession();
  window.Stats?.add("g", 1, game.id.startsWith("duel-") ? "duel" : game.id);
  const s = { game, cleanup: [] };
  session = s;
  const body = $("#stage-body");
  body.innerHTML = "";
  $("#hud").innerHTML = "";

  const ctx = {
    body,
    game,
    alive: () => session === s,
    after(ms, fn) {
      const id = setTimeout(() => { if (ctx.alive()) fn(); }, ms);
      s.cleanup.push(() => clearTimeout(id));
      return id;
    },
    every(ms, fn) {
      const id = setInterval(() => { if (ctx.alive()) fn(); }, ms);
      s.cleanup.push(() => clearInterval(id));
      return () => clearInterval(id);
    },
    onKey(fn) {
      const handler = (e) => { if (ctx.alive() && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target?.closest?.("input, textarea, select, [contenteditable]")) fn(e); };
      document.addEventListener("keydown", handler);
      const off = () => document.removeEventListener("keydown", handler);
      s.cleanup.push(off);
      return off;
    },
    hud(items) {
      $("#hud").innerHTML = items.map(([key, label, value]) =>
        `<div class="hud-item" data-hud="${key}"><small>${label}</small><strong>${value}</strong></div>`).join("");
    },
    setHud(key, value, { bump = false, warn = false } = {}) {
      const item = $(`[data-hud="${key}"]`);
      if (!item) return;
      $("strong", item).innerHTML = value;
      item.classList.toggle("warn", warn);
      if (bump) { item.classList.remove("bump"); void item.offsetWidth; item.classList.add("bump"); }
    },
    achieve: (id) => Progress.unlock(id),
    onCleanup(fn) { s.cleanup.push(fn); },
    countIn(then) {
      const targetBody = this.body || body;
      const show = (n) => { targetBody.innerHTML = `<div class="count-in"><span>${n}</span></div>`; Sfx.play("tick"); };
      show(3);
      ctx.after(700, () => show(2));
      ctx.after(1400, () => show(1));
      ctx.after(2100, then);
    },
    finish(result) { if (ctx.alive()) showResult(game, result); },
  };
  game.start(ctx);
}

// result: { score, max?, ratio?, xp, unit?, verdict?, recap?: [{q, a, note}], noRecord?, record?,
//           display? (text en lloc del número), extraHtml?, onShown?(body) }
function showResult(game, result) {
  const coins0 = typeof Coins !== "undefined" ? Coins.earned() : 0;
  // «record»: el joc ja ha desat el resultat pel seu compte (p. ex. un rècord per mode)
  const { isRecord, prevBest, levelUp } = result.record ? result.record : result.noRecord
    ? { isRecord: false, prevBest: Progress.data.best[game.id], levelUp: null }
    : Progress.record(game.id, result.score, result.xp);
  endSession();
  session = { game, cleanup: [] };
  $("#hud").innerHTML = "";

  window.Track?.("game_complete", { game: game.id.startsWith("duel-") ? "duel" : game.id, score: Math.round(result.score || 0) });
  const ratio = result.ratio ?? (result.max ? result.score / result.max : null);
  if (ratio === 1) Progress.unlock("perfecte");
  // Els jocs que desen el resultat pel seu compte (repte diari, duels, simulador) ja han sumat l'XP abans d'arribar aquí
  const coinsWon = typeof Coins !== "undefined" ? Math.max(0, Coins.earned() - coins0) + (result.noRecord || result.record ? Math.floor((result.xp || 0) / COIN_XP) : 0) : 0;
  if (window.Stats) {
    Stats.add("f", 1, game.id.startsWith("duel-") ? "duel" : game.id);
    Stats.add("xp", result.xp || 0);
    Stats.add("mon", coinsWon);
    if (game.id === "diari") { Stats.add("diari"); Stats.add("diariPts", Math.round(result.hits ?? result.score ?? 0)); }
  }
  const verdict = result.verdict ?? (
    ratio === null ? "" :
    ratio >= 1 ? "Pleno absoluto. Nadie te tose." :
    ratio >= .75 ? "Brillante. Dominas la materia." :
    ratio >= .5 ? "Aprobado con nota. Aún hay margen." :
    ratio >= .25 ? "Hay que estudiar un poco más antes del 29N." :
    "Toca pasar por la sección Aprende.");

  const recap = result.recap?.length ? `
    <div class="recap">
      <h4>Para repasar</h4>
      ${result.recap.map((r) => `<div class="recap-item"><b>${esc(r.q)}</b><span class="ans">${esc(r.a)}</span>${r.note ? ` · <span class="muted">${esc(r.note)}</span>` : ""}</div>`).join("")}
    </div>` : "";

  const body = $("#stage-body");
  body.innerHTML = "";
  body.appendChild(h(`
    <div class="card result">
      <div class="stamp-result" aria-hidden="true">${ratio === null ? "29N" : ratio >= .75 ? "APROBADO" : ratio >= .5 ? "ESCRUTADO" : "RECUENTO"}</div>
      <p class="kicker">Resultado final</p>
      <div class="result-score">${result.display ? esc(result.display) : "0"}</div>
      <p class="result-sub">${result.max ? `de ${fmt(result.max)} puntos posibles` : result.unit || "puntos"}</p>
      <p class="result-verdict">${verdict}</p>
      <div class="result-badges">
        ${result.xp ? `<span class="rbadge xp">+${fmt(result.xp)} XP</span>` : ""}
        ${coinsWon ? `<a class="rbadge coin" href="#botiga">+${fmt(coinsWon)} monedas</a>` : ""}
        ${result.display ? "" : isRecord ? `<span class="rbadge record">${prevBest === undefined ? "Primer récord" : "¡Nuevo récord!"}</span>` : prevBest !== undefined ? `<span class="rbadge">Récord: ${fmt(Math.max(prevBest, result.score))}</span>` : ""}
        ${levelUp ? `<span class="rbadge level">Nuevo nivel: ${levelUp}</span>` : ""}
      </div>
      <div class="row center">
        ${game.noReplay ? "" : `<button class="btn primary lg" data-again>Otra vez</button>`}
        <a class="btn lg ${game.noReplay ? "primary" : ""}" href="${game.backHref || "#jocs"}">${game.backLabel || "Otros juegos"}</a>
      </div>
      ${window.Online?.guestNote?.() || ""}
      ${result.extraHtml || ""}
      ${typeof notifResultNote === "function" ? notifResultNote(game) : ""}
      ${typeof coffeeResultNote === "function" ? coffeeResultNote(isRecord || (ratio !== null && ratio >= 0.6)) : ""}
      ${recap}
    </div>`));

  const out = $(".result-score", body);
  if (!result.display) {
    const target = result.score;
    const t0 = performance.now();
    (function anim(t) {
      const k = Math.min(1, (t - t0) / 900);
      out.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(anim);
    })(t0);
  }
  result.onShown?.(body);

  $("[data-again]", body)?.addEventListener("click", () => (game.gate?.() ? showIntro(game) : startGame(game)));
  const great = levelUp || (ratio !== null ? ratio >= .75 : isRecord && prevBest !== undefined);
  Sfx.play(great || (ratio !== null && ratio >= .5) ? "win" : "lose");
  if (great) confetti();
  if (levelUp) toast(`Has subido de nivel: ${levelUp}`, "level");
}

// ---------- Components compartits ----------

// Opcions de resposta. Retorna un controlador amb `promise` → { correct, picked, timeout }.
function choiceBox(ctx, container, { options, correctIndex, columns = 1, keyboard = true }) {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const wrap = h(`<div class="choices ${columns === 2 ? "two" : ""}"></div>`);
  let done = false;
  const buttons = options.map((text, i) => {
    const b = h(`<button class="choice"><span class="key">${"ABCD"[i] ?? i + 1}</span><span class="ctext"></span></button>`);
    $(".ctext", b).textContent = text;
    b.addEventListener("click", () => pick(i));
    wrap.appendChild(b);
    return b;
  });
  function pick(i) {
    if (done || !ctx.alive() || (i >= 0 && buttons[i].disabled)) return;
    done = true;
    offKey?.();
    const correct = i === correctIndex;
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === correctIndex) b.classList.add("correct");
      else if (j === i) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    Sfx.play(correct ? "ok" : "ko");
    resolve({ correct, picked: i, timeout: i < 0 });
  }
  const offKey = keyboard ? ctx.onKey((e) => {
    const k = e.key.toLowerCase();
    const idx = k.length === 1 ? Math.max("abcd".indexOf(k), "1234".indexOf(k)) : -1;
    if (idx >= 0 && idx < options.length) pick(idx);
  }) : null;
  container.appendChild(wrap);
  return {
    promise,
    get done() { return done; },
    timeout: () => pick(-1),
    // Comodí 50:50
    eliminate(n = 2) {
      const wrong = buttons.map((_, i) => i).filter((i) => i !== correctIndex && !buttons[i].disabled);
      sample(wrong, n).forEach((i) => { buttons[i].disabled = true; buttons[i].classList.add("gone"); });
    },
    // Comodí d'enquesta: percentatges orientatius, no infal·libles
    poll() {
      const alive = buttons.map((b, i) => (b.disabled ? null : i)).filter((i) => i !== null);
      const trust = Math.random() < 0.85;
      const weights = alive.map((i) => (i === correctIndex ? (trust ? rand(45, 75) : rand(15, 30)) : rand(5, trust ? 25 : 45)));
      const sum = weights.reduce((a, b) => a + b, 0);
      alive.forEach((i, k) => {
        const pct = Math.round((weights[k] / sum) * 100);
        buttons[i].insertAdjacentHTML("beforeend", `<span class="poll"><i style="width:${pct}%"></i><b>${pct}%</b></span>`);
      });
    },
  };
}
const askChoice = (ctx, container, opts) => choiceBox(ctx, container, opts).promise;

// Prepara les opcions d'una pregunta on la primera és la correcta.
function prepOptions(opts, rng) {
  const order = shuffle(opts.map((text, i) => ({ text, ok: i === 0 })), rng);
  return { options: order.map((o) => o.text), correctIndex: order.findIndex((o) => o.ok) };
}

function progressDots(total, results, current) {
  return `<div class="progress-dots">${Array.from({ length: total }, (_, i) =>
    `<i class="${results[i] === true ? "ok" : results[i] === false ? "ko" : i === current ? "cur" : ""}"></i>`).join("")}</div>`;
}

function nextButton(container, label = "Siguiente") {
  return new Promise((resolve) => {
    const row = h(`<div class="next-row"><button class="btn primary">${label} →</button></div>`);
    const btn = $("button", row);
    btn.addEventListener("click", () => resolve(), { once: true });
    container.appendChild(row);
    btn.focus({ preventScroll: true });
  });
}

function explain(container, ok, text, prefix) {
  const el = h(`<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong></strong><span></span></div>`);
  el.firstChild.textContent = prefix ?? (ok ? "¡Correcto!" : "No es correcto.");
  el.lastChild.textContent = text;
  container.appendChild(el);
}

function floatPoints(container, text, neg = false) {
  const el = h(`<div class="float-pts ${neg ? "neg" : ""}">${text}</div>`);
  container.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// Anell de temps per pregunta. Retorna { stop, left }.
function questionTimer(ctx, container, seconds, onEnd) {
  const el = h(`<div class="qtimer" style="--p:100"><span>${seconds}</span></div>`);
  container.appendChild(el);
  let left = seconds * 10, stopped = false;
  const stopTick = ctx.every(100, () => {
    if (stopped) return;
    left--;
    el.style.setProperty("--p", (left / (seconds * 10)) * 100);
    $("span", el).textContent = Math.ceil(left / 10);
    el.classList.toggle("low", left <= 50);
    if (left <= 50 && left > 0 && left % 10 === 0) Sfx.play("tick");
    if (left <= 0) { stop(); onEnd(); }
  });
  function stop() { stopped = true; stopTick(); }
  return { stop, get left() { return left / 10; } };
}
