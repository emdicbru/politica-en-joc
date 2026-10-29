// Arrencada: sala de jocs, perfil, Aprèn, calendari i compte enrere.

// ---------- Sala de jocs ----------
let gameFilter = "all";

const DIFF_LABEL = ["", "Accesible", "Exigente", "Experto"];

function gameCard(g, i, featured = false, hero = false) {
  const best = Progress.data.best[g.id];
  const cat = GAME_CATS[g.cat];
  const status = g.status ? g.status() : featured ? `<span class="gc-status new">${g.kicker}</span>` : "";
  return `
    <a class="game-card ${featured ? "featured" : ""} ${hero ? "gc-hero" : ""}" href="#joc/${g.id}" style="--c:${g.color};--i:${i}">
      <div class="gc-art">
        <span class="gc-num">${String(GAMES.indexOf(g) + 1).padStart(2, "0")}</span>
        <span class="gc-level" title="Dificultad: ${DIFF_LABEL[g.level]}">${[1, 2, 3].map((n) => `<i class="${n <= g.level ? "on" : ""}"></i>`).join("")}</span>
        ${ART[g.id] ? ART[g.id]() : ""}
      </div>
      <div class="gc-body">
        <div class="gc-head"><span class="gc-cat">${cat.name}</span>${status}</div>
        <h3 class="gc-title">${g.title}</h3>
        <p class="gc-tag">${featured ? g.desc : g.tagline}</p>
        <div class="gc-meta">
          <span class="gc-chip">${g.meta}</span>
          <span class="gc-chip soft">${DIFF_LABEL[g.level]}</span>
          ${best !== undefined ? `<span class="gc-best">Récord <b>${fmt(best)}</b></span>` : ""}
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
      <div class="games-grid">${groupCards(GAMES.filter((g) => g.cat === gameFilter && !g.hidden), 0)}</div>
    </section>`;
    return;
  }
  let i = 0;
  grid.innerHTML = ["rapid", "parlament", "historia"].map((key) => {
    const cat = GAME_CATS[key];
    const games = GAMES.filter((g) => g.cat === key && !g.hidden);
    const html = groupCards(games, i);
    i += games.length;
    return `<section class="game-group" style="--c:${cat.color}">
      <div class="group-head"><span class="group-dot"></span><h3>${cat.name}</h3><p>${cat.desc}</p><span class="group-count">${games.length} juegos</span></div>
      <div class="games-grid">${html}</div>
    </section>`;
  }).join("");
}

// ---------- Inici: el repte d'avui, el simulador, una mostra de minijocs i accessos a la resta ----------
function renderHome() {
  if (typeof renderHomeEspecial === "function") renderHomeEspecial();
  renderDailyHero();
  renderInstall();
  renderNewsTicker();
  const sim = $("#home-sim");
  if (sim && typeof simDuoHtml === "function") {
    sim.innerHTML = `<section class="home-simduo"><div class="section-head"><h2 class="section-title">Simuladores</h2><a class="home-more" href="#simulador">Verlos</a></div>${simDuoHtml("home")}</section>`;
    simDuoBind(sim);
  }
  const games = $("#home-games");
  if (games) {
    const list = GAMES.filter((g) => !g.hidden && g.cat !== "daily");
    games.innerHTML = `<div class="section-head"><h2 class="section-title">Minijuegos</h2><a class="home-more" href="#jocs">Todos los minijuegos (${list.length})</a></div>
      <div class="home-games-row">${list.slice(0, 6).map((g, k) => gameCard(g, k)).join("")}</div>`;
  }
  if (typeof renderHomeApren === "function") renderHomeApren();
  // Qui encara no té usuari: per què val la pena crear-lo
  const guest = $("#home-guest");
  if (guest) guest.innerHTML = window.Online?.isGuest?.() ? `<section class="card home-pitch">${window.Online.pitchHtml("Crea tu usuario", window.Online.guestLeft() ? `Puedes jugar ${window.Online.guestLeft() === 1 ? "1 partida más" : `${window.Online.guestLeft()} partidas más`} sin usuario.` : "Ya has gastado las partidas de prueba.")}</section>` : "";
}

// Els jocs marcats amb «hero» van primer i ocupen tota la fila; si la resta queda senar, el primer fa de destacat
function groupCards(games, i0) {
  const feat = games.filter((g) => g.hero), rest = games.filter((g) => !g.hero);
  const wide = rest.length % 2 === 1;
  return [...feat, ...rest].map((g, k) => gameCard(g, i0 + k, g.hero || (wide && g === rest[0]), g.hero)).join("");
}

$$(".filter").forEach((b) => b.addEventListener("click", () => {
  gameFilter = b.dataset.filter;
  $$(".filter").forEach((x) => x.classList.toggle("active", x === b));
  renderGames();
}));

$("#stage-back").addEventListener("click", () => { location.hash = (session && session.game.backHref) || "#jocs"; });

// ---------- So ----------
function renderSound() {
  const b = $("#sound-btn");
  b.innerHTML = Sfx.on
    ? `<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`;
  b.setAttribute("aria-label", Sfx.on ? "Silencia el sonido" : "Activa el sonido");
  b.classList.toggle("off", !Sfx.on);
}
$("#sound-btn").addEventListener("click", () => { Sfx.toggle(); renderSound(); Sfx.play("pick"); });

// ---------- Perfil ----------
// Capçalera amb la targeta del jugador i quatre pestanyes: Resum (el dia a dia), Assoliments, Rècords i Ajustos
// (compte, app, privadesa i el que es toca poc). La pestanya oberta es recorda durant la sessió.
const PF_TABS = [["resum", "Resumen"], ["assoliments", "Logros"], ["records", "Récords"], ["ajustos", "Ajustes"]];
let pfTab = (() => { try { return sessionStorage.getItem("pf-tab") || "resum"; } catch { return "resum"; } })();
let pfAchFilter = "tots";

function pfHero(d) {
  const i = Progress.levelIndex();
  const cur = LEVELS[i], next = LEVELS[i + 1];
  const pct = next ? ((d.xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100;
  const plays = Object.values(d.plays).reduce((a, b) => a + b, 0);
  const unlocked = ACHIEVEMENTS.filter((a) => d.ach[a.id]).length;
  const me = window.Online?.meInfo?.();
  const guest = window.Online?.isGuest?.();
  const frame = typeof Coins !== "undefined" ? Coins.eq("fr") : null;
  const title = typeof shopTitle === "function" && typeof Coins !== "undefined" ? shopTitle(Coins.eq("ti")) : "";
  const pic = me?.photo
    ? `<img class="avatar pf-av${frame ? ` fr-${frame.slice(3)}` : ""}" src="${esc(me.photo)}" alt="" referrerpolicy="no-referrer">`
    : `<span class="pf-av pf-lv${frame ? ` avatar fr-${frame.slice(3)}` : ""}">${i + 1}</span>`;
  const coins = typeof Coins !== "undefined" ? Coins.balance() : 0;
  return `<section class="card pf-hero">
    <div class="pf-id">${pic}
      <div class="pf-who">
        <h2>${esc(me?.name || "Jugador invitado")}</h2>
        ${title ? `<span class="shop-ti">${esc(title)}</span>` : ""}
        <p class="pf-lvl"><b>Nivel ${i + 1} · ${cur.name}</b><span>${next ? `${fmt(d.xp)} XP · te faltan ${fmt(next.xp - d.xp)} para ${next.name}` : `${fmt(d.xp)} XP · nivel máximo`}</span></p>
        <div class="xpbar"><div style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="pf-stats">
      <a href="#botiga"><b>${fmt(coins)}</b><small>🪙 monedas</small></a>
      <div><b>${dailyStreakNow(d.daily).streak}</b><small>🔥 días de racha</small></div>
      <div><b>${fmt(plays)}</b><small>🎮 partidas</small></div>
      <button type="button" data-pftab="assoliments"><b>${unlocked}/${ACHIEVEMENTS.length}</b><small>★ logros</small></button>
    </div>
    <div class="pf-actions">
      ${me ? `<button class="btn" type="button" data-pfedit>Edita el perfil</button>` : guest ? `<button class="btn google-btn" type="button" data-signin-cta>${typeof googleIconSvg === "function" ? googleIconSvg() : ""} Crea el usuario</button>` : ""}
      <a class="btn primary" href="#botiga">🪙 Tienda</a>
    </div>
    ${guest ? `<p class="muted pf-guest">Sin usuario, el progreso solo se guarda en este dispositivo. Con el usuario lo tienes en todas partes y puedes jugar en el ranking, en las ligas y en los duelos.</p>` : ""}
  </section>`;
}

function pfResum(d) {
  const today = typeof dailyResult === "function" ? dailyResult() : null;
  const i = Progress.levelIndex(), next = LEVELS[i + 1];
  const pending = ACHIEVEMENTS.filter((a) => !d.ach[a.id]).slice(0, 3);
  const recent = ACHIEVEMENTS.filter((a) => d.ach[a.id]).sort((a, b) => (d.ach[b.id] || 0) - (d.ach[a.id] || 0)).slice(0, 3);
  const top = GAMES.filter((g) => d.plays[g.id]).sort((a, b) => d.plays[b.id] - d.plays[a.id]).slice(0, 3);
  return `
    <section class="card pf-today ${today ? "done" : ""}">
      <span class="pf-today-i" aria-hidden="true">${today ? "✅" : "🗳️"}</span>
      <div><b>${today ? "Reto de hoy hecho" : "Aún no has hecho el reto de hoy"}</b>
        <p>${today ? `${today.hits}/10 aciertos · ${typeof fmtSecs === "function" ? fmtSecs(today.ms) : ""}. Mañana habrá uno nuevo.` : d.daily.streak ? `Hazlo para mantener la racha de ${d.daily.streak} ${d.daily.streak === 1 ? "día" : "días"}.` : "10 pruebas contra el reloj. ¡Empieza una racha!"}</p></div>
      ${today ? `<a class="btn" href="#ranking">Ranking</a>` : `<a class="btn primary" href="#joc/diari">Juega</a>`}
    </section>
    <div class="pf-grid">
      <section class="card pf-box">
        <h3>🎯 Próximos logros</h3>
        ${pending.length ? `<ul class="pf-list">${pending.map((a) => `<li><b>${a.name}</b><small>${a.desc}</small></li>`).join("")}</ul><button class="linklike" type="button" data-pftab="assoliments">Todos los logros →</button>` : `<p class="muted">Los tienes todos. Eres una leyenda.</p>`}
      </section>
      <section class="card pf-box">
        <h3>⭐ Últimos conseguidos</h3>
        ${recent.length ? `<ul class="pf-list">${recent.map((a) => `<li class="on"><b>${a.name}</b><small>${a.desc}</small></li>`).join("")}</ul>` : `<p class="muted">Juega la primera partida y conseguirás el primero.</p>`}
      </section>
      <section class="card pf-box">
        <h3>🎮 Tus juegos</h3>
        ${top.length ? `<ul class="pf-list">${top.map((g) => `<li><a href="#joc/${g.id}"><b>${g.title}</b></a><small>${fmt(d.plays[g.id])} ${d.plays[g.id] === 1 ? "partida" : "partidas"}${d.best[g.id] !== undefined ? ` · récord ${fmt(d.best[g.id])}` : ""}</small></li>`).join("")}</ul><button class="linklike" type="button" data-pftab="records">Todos los récords →</button>` : `<p class="muted">Aún no has jugado ninguna partida. <a href="#jocs">Elige un juego</a></p>`}
      </section>
      <section class="card pf-box" id="pf-rank">
        <h3>🏆 Ranking</h3>
        ${window.Online?.meInfo?.() ? `<p class="muted">Calculando tu posición…</p>` : `<p class="muted">Crea el usuario para entrar en el ranking de experiencia y competir cada día en el reto.</p>`}
        <a class="linklike" href="#ranking">Abre el ranking →</a>
      </section>
    </div>
    ${next ? "" : ""}`;
}

function pfAssoliments(d) {
  const got = ACHIEVEMENTS.filter((a) => d.ach[a.id]).length;
  const list = ACHIEVEMENTS.filter((a) => (pfAchFilter === "fets" ? d.ach[a.id] : pfAchFilter === "pendents" ? !d.ach[a.id] : true));
  const i = Progress.levelIndex();
  return `
    <div class="pf-filter">${[["tots", `Todos (${ACHIEVEMENTS.length})`], ["fets", `Conseguidos (${got})`], ["pendents", `Pendientes (${ACHIEVEMENTS.length - got})`]].map(([k, t]) => `<button type="button" class="${pfAchFilter === k ? "on" : ""}" data-pfach="${k}">${t}</button>`).join("")}</div>
    <p class="muted">Cada logro te da 50 monedas.</p>
    <div class="ach-grid">${list.map((a) => `
      <div class="ach ${d.ach[a.id] ? "on" : ""}">
        <span class="ach-ico">${d.ach[a.id] ? "★" : "?"}</span>
        <div><b>${a.name}</b><small>${a.desc}</small></div>
      </div>`).join("") || `<p class="muted">No hay ninguno.</p>`}</div>
    <h2 class="section-title sm">Carrera</h2>
    <div class="ladder">${LEVELS.map((l, k) => `<div class="rung ${k < i ? "done" : k === i ? "cur" : ""}"><b>${k + 1}</b><span>${l.name}</span><small>${fmt(l.xp)} XP</small></div>`).join("")}</div>`;
}

function pfRecords(d) {
  const row = (g) => `
      <a class="record" href="#joc/${g.id}" style="--c:${g.color}">
        <span class="rc-dot"></span><span>${g.title}</span>
        <b>${d.best[g.id] !== undefined ? fmt(d.best[g.id]) : "—"}</b>
      </a>${g.recordRows ? g.recordRows().map((r) => `
      <a class="record sub" href="#joc/${g.id}" style="--c:${g.color}">
        <span class="rc-dot"></span><span>${r.label}</span>
        <b>${r.value !== undefined ? fmt(r.value) : "—"}</b>
      </a>`).join("") : ""}`;
  const played = (g) => d.plays[g.id] || d.best[g.id] !== undefined;
  const cats = Object.entries(GAME_CATS).map(([k, c]) => [c.name, GAMES.filter((g) => g.cat === k && !g.hidden)]);
  const other = GAMES.filter((g) => !GAME_CATS[g.cat] && !g.hidden);
  if (other.length) cats.push(["Otros", other]);
  return cats.filter(([, gs]) => gs.length).map(([name, gs]) => {
    const yes = gs.filter(played), no = gs.filter((g) => !played(g));
    return `<section class="pf-rec">
      <h2 class="section-title sm">${name}</h2>
      ${yes.length ? `<div class="records">${yes.map(row).join("")}</div>` : ""}
      ${no.length ? `<details class="pf-unplayed"${yes.length ? "" : " open"}><summary>${no.length} ${no.length === 1 ? "joc" : "juegos"} todavía sin jugar</summary><div class="records">${no.map(row).join("")}</div></details>` : ""}
    </section>`;
  }).join("");
}

function pfAjustos() {
  const statsOff = typeof Stats !== "undefined" && Stats.off();
  const admin = typeof ctlIsAdmin === "function" && ctlIsAdmin();
  return `
    <section class="pf-set">
      <h2 class="section-title sm">Atención</h2>
      <div id="account-box"></div>
    </section>
    <section class="pf-set">
      <h2 class="section-title sm">La app</h2>
      <div id="notif-card"></div>
      <div id="install-card"></div>
      <div class="card pf-row"><span aria-hidden="true">🌐</span><div><b>Idioma</b><p>La app en catalán o en castellano. El progreso es el mismo.</p></div>${langLinks("lang-sw lang-sw-lg")}</div>
      <div class="card pf-row"><span aria-hidden="true">🔊</span><div><b>Sonido</b><p>Efectos de sonido de los juegos.</p></div><button class="btn" type="button" data-pfsound>${Sfx.on ? "Silencia" : "Activa"}</button></div>
      <div class="card pf-row"><span aria-hidden="true">🐞</span><div><b>¿Algo no funciona?</b><p>Explícanos qué ha pasado y lo arreglaremos.</p></div><button class="btn" type="button" data-report>Avisa de un error</button></div>
    </section>
    <section class="pf-set">
      <h2 class="section-title sm">Privacidad</h2>
      <div class="card pf-row"><span aria-hidden="true">📊</span><div><b>Estadística anónima</b><p>Tus visitas suman a unos contadores anónimos que nos ayudan a mejorar la app. ${statsOff ? "Ahora no se cuentan." : ""}</p></div><button class="btn" type="button" data-stats-toggle>${statsOff ? "Vuelve a contar mis visitas" : "No cuentes mis visitas"}</button></div>
      <p class="muted">Más información en la <a href="#legal/privacitat">política de privacidad</a> y en la <a href="#legal/cookies">de cookies</a>.</p>
    </section>
    ${typeof COFFEE_URL !== "undefined" && COFFEE_URL ? `<section class="pf-set">
      <h2 class="section-title sm">Apoya el proyecto</h2>
      <div class="card coffee-card"><span class="coffee-cup" aria-hidden="true">☕</span><div><b>¿Te gusta Política en Joc?</b><p>Es gratuita. Si quieres echar una mano, puedes invitarme a un café.</p></div>${coffeeLink("Invítame a un café", "btn")}</div>
    </section>` : ""}
    ${admin ? `<section class="pf-set"><h2 class="section-title sm">Equipo</h2><a class="card pf-row" href="#control"><span aria-hidden="true">🎛️</span><div><b>Centro de control</b><p>Usuarios, notificaciones y el especial del 29N.</p></div><span class="btn">Abre</span></a></section>` : ""}
    <section class="pf-set pf-danger">
      <h2 class="section-title sm">Zona peligrosa</h2>
      <div class="card pf-row"><span aria-hidden="true">🗑️</span><div><b>Borra el progreso</b><p>Borra la XP, los récords y los logros de este dispositivo.${window.Online?.meInfo?.() ? " Con usuario, el progreso guardado en la nube se volvería a recuperar." : ""}</p></div><button class="btn ghost danger" type="button" id="reset-progress">Borra</button></div>
    </section>`;
}

function renderProfile() {
  const d = Progress.data;
  if (!PF_TABS.some(([k]) => k === pfTab)) pfTab = "resum";
  const body = pfTab === "assoliments" ? pfAssoliments(d) : pfTab === "records" ? pfRecords(d) : pfTab === "ajustos" ? pfAjustos() : pfResum(d);
  $("#profile").innerHTML = `
    ${pfHero(d)}
    <nav class="pf-tabs" role="tablist">${PF_TABS.map(([k, t]) => `<button type="button" role="tab" aria-selected="${pfTab === k}" class="${pfTab === k ? "on" : ""}" data-pftab="${k}">${t}</button>`).join("")}</nav>
    <div class="pf-panel">${body}</div>`;

  $$("[data-pftab]", $("#profile")).forEach((b) => b.addEventListener("click", () => {
    pfTab = b.dataset.pftab;
    try { sessionStorage.setItem("pf-tab", pfTab); } catch { /* sense emmagatzematge */ }
    Sfx.play("pick");
    renderProfile();
    $(".pf-tabs")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }));
  $("[data-pfedit]")?.addEventListener("click", () => window.Online?.editProfile?.());
  $$("[data-pfach]").forEach((b) => b.addEventListener("click", () => { pfAchFilter = b.dataset.pfach; renderProfile(); }));

  if (pfTab === "ajustos") {
    window.Online?.renderAccountBox();
    renderInstall();
    if (typeof renderNotif === "function") renderNotif();
    $("[data-pfsound]")?.addEventListener("click", () => { Sfx.toggle(); renderSound(); Sfx.play("pick"); renderProfile(); });
    $("#reset-progress").addEventListener("click", () => {
      if (confirm("¿Seguro que quieres borrar todo el progreso, los récords y los logros?")) {
        Progress.reset();
        renderProfile();
        toast("Progreso borrado");
      }
    });
  }
  if (pfTab === "resum" && window.Online?.myRank && window.Online.meInfo?.()) {
    window.Online.myRank().then((r) => {
      const box = $("#pf-rank p");
      if (!box) return;
      box.innerHTML = r ? `Eres el número <b>${fmt(r.pos)}</b> de ${fmt(r.total)} en experiencia.` : "No se ha podido calcular tu posición.";
    });
  }
}

// ---------- Portada: Congrés de l'última legislatura ----------
function renderHeroHemicycle() {
  if (!$("#hero-hemi")) return;
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
    <p class="legend-title">Congreso de la XV legislatura · elecciones del 23-J</p>
    <div class="legend-items">${[...parties].sort((a, b) => b.seats - a.seats).map((p) =>
      `<span class="legend-item"><i style="background:${p.color}"></i>${p.name} <b>${p.seats}</b></span>`).join("")}</div>`;
}

// ---------- Portada: repte diari ----------
const SLOT_LABEL = (label) =>
  /Cert o fals|Verdadero o falso|Cierto o falso/.test(label) ? "Verdadero o falso" :
  /Match/.test(label) ? "Match" :
  /Qui ho va dir|Quién lo dijo/.test(label) ? "Frase" :
  /En quin any|En qué año/.test(label) ? "Año" :
  /Qui és|Quién es/.test(label) ? "¿Quién es?" :
  /Ordena/.test(label) ? "Ordena" :
  /On és|Dónde está/.test(label) ? "Mapa" :
  /Endevina el número|Adivina el número/.test(label) ? "Número" :
  /Dibuixa|Dibuja/.test(label) ? "Dibuja" :
  /abans|antes|Congrés del 23-J|Congreso del 23-J|Diputats|Diputados/.test(label) ? "Duelo" : "Pregunta";

function renderDailyHero() {
  const box = $("#daily-hero");
  if (!box) return;
  const key = todayKey();
  const r = dailyResult(key);
  const d = Progress.data.daily;
  const items = dailyItems(key);
  const dateRaw = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const date = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1);
  const grid = r ? [...r.grid] : [];
  box.classList.toggle("done", !!r);
  box.innerHTML = `
    <div class="dh-top">
      <span class="dh-badge">Reto diario <b>#${dailyNumber(key)}</b></span>
      <span class="dh-date">${date}</span>
      <span class="dh-next">Nuevo reto en <b id="dh-next">--:--:--</b></span>
    </div>
    <div class="dh-main">
      <div class="dh-left">
        ${r ? `
          <p class="dh-kicker">Tu tiempo de hoy</p>
          <div class="dh-time">${fmtSecs(r.ms)}</div>
          <p class="dh-sub">${r.hits}/10 aciertos · ${r.errors} ${r.errors === 1 ? "error" : "errores"}</p>
          <div class="row">
            <button class="btn primary" data-share-hero>Comparte</button>
            <a class="btn" href="#ranking">Ranking</a>
          </div>` : `
          <h2 class="dh-title">El reto de hoy</h2>
          <p class="dh-sub">10 pruebas. El cronómetro corre y cada error suma <b>+10 s</b>.</p>
          <a class="btn dh-cta" href="#joc/diari"><span class="dh-play">▶</span> Empieza</a>`}
      </div>
      <div class="dh-right">
        <div class="dh-dots" aria-label="Las 10 pruebas de hoy">${items.map((it, i) => {
          const st = r ? (grid[i] === "🟩" ? "ok" : "ko") : "";
          return `<span class="${st}" style="--i:${i}" title="${SLOT_LABEL(it.label)}">${i + 1}</span>`;
        }).join("")}</div>
        <div class="dh-chips">
          <span><small>Racha</small><b>${dailyStreakNow(d).streak} ${dailyStreakNow(d).streak === 1 ? "día" : "días"}</b></span>
          <span><small>Posición</small><b id="dh-rank">—</b></span>
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
  if (s >= 86398 && location.hash.replace("#", "") in { "": 1, inici: 1 }) renderDailyHero();
}

// ---------- Rànquing ----------
function renderRankingView(arg) {
  if (window.Online?.renderRanking) return window.Online.renderRanking($("#ranking-root"), arg);
  const scores = Object.entries(Progress.data.daily.scores)
    .filter(([, v]) => v && typeof v === "object")
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  $("#ranking-root").innerHTML = `
    <div class="rank-tabs"><button class="rank-tab active">Mundial</button><button class="rank-tab" disabled>Amigos</button></div>
    <div class="card rank-off">
      <div class="gc-icon" style="--c:var(--blue)">${icon(`<path d="M8 21V11H3v10zM15 21V5h-5v16zM21 21v-7h-5v7z"/>`)}</div>
      <h3>El ranking mundial se activará pronto</h3>
      <p>Cuando la app esté publicada podrás comparar tu tiempo con todo el mundo y crear ligas con tus amigos. Mientras tanto, aquí tienes tus tiempos.</p>
    </div>
    <h2 class="section-title sm">Tus retos</h2>
    ${scores.length ? `<div class="lb">${scores.map(([k, v]) => `
      <div class="lb-row"><b class="lb-pos">#${dailyNumber(k)}</b>
        <span class="lb-name">${new Date(k + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}<small>${v.grid}</small></span>
        <strong>${fmtSecs(v.ms)}</strong></div>`).join("")}</div>`
      : `<p class="muted">Aún no has hecho ningún reto diario. <a href="#joc/diari">¡Haz el de hoy!</a></p>`}`;
}


// ---------- Barra inferior de vidre líquid ----------
// Una càpsula de vidre que flota sobre el contingut, a l'estil del vidre líquid d'iOS:
// · El vidre: difuminat i saturat a tot arreu. A Chrome/Android, a més, refracta de debò: un filtre SVG de desplaçament
//   (mapa generat aquí, a la mida de la barra) corba el contingut de sota a les vores, com una lent.
// · La gota de la pestanya activa es mou amb física de molla: s'estira amb la velocitat, rebota en arribar i, en prémer,
//   s'infla i fa de lupa. Es pot arrossegar d'una pestanya a l'altra.
// · S'adapta al que té sota (es torna fosca sobre zones fosques) i s'encongeix en baixar la pàgina.
const tabbar = $(".tabbar");
const tabInd = $(".tab-indicator");
const lgReduce = matchMedia("(prefers-reduced-motion: reduce)");

// Refracció amb filtre SVG: només als navegadors Chromium (Safari no accepta url() a backdrop-filter)
const lgSvg = !!navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand)) && CSS.supports("backdrop-filter", "url(#a)");
if (tabbar && lgSvg) document.documentElement.classList.add("lg-svg");
// Mapa de desplaçament d'una càpsula de w×h: a la franja de la vora (band) mostra el contingut de més enfora, cada cop
// més com més a prop de la vora (R: x, G: y; 128 = sense desplaçament). mode "lens": a més, amplia el centre.
function lgMap(w, h, band, mode) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  const x = c.getContext("2d"), img = x.createImageData(c.width, c.height), d = img.data;
  const r = c.height / 2, cx = c.width / 2, cy = c.height / 2;
  for (let j = 0; j < c.height; j++) {
    for (let i = 0; i < c.width; i++) {
      // Distància a la vora de la càpsula i direcció cap enfora
      const px = i + 0.5, py = j + 0.5;
      const qx = Math.min(Math.max(px, r), c.width - r);
      let nx = px - qx, ny = py - cy;
      const len = Math.hypot(nx, ny) || 1;
      const dist = r - len;
      nx /= len; ny /= len;
      let t = dist < band ? 1 - Math.max(0, dist) / band : 0;
      t = t * t * (3 - 2 * t);
      let dx = nx * t, dy = ny * t;
      if (mode === "lens") { dx = dx * 0.7 - ((px - cx) / cx) * 0.3; dy = dy * 0.7 - ((py - cy) / cy) * 0.3; }
      const k = (j * c.width + i) * 4;
      d[k] = 128 + dx * 127; d[k + 1] = 128 + dy * 127; d[k + 2] = 128; d[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c.toDataURL();
}
function lgFilters() {
  if (!lgSvg || !tabbar) return;
  let svg = $("#lg-filters");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "lg-filters"; svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    svg.innerHTML = ["lg-refract", "lg-lens"].map((id) => `<filter id="${id}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage result="map" preserveAspectRatio="none" x="0" y="0"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${id === "lg-lens" ? 0.3 : 3.2}" result="soft"/>
      <feDisplacementMap in="soft" in2="map" scale="${id === "lg-lens" ? 24 : 20}" xChannelSelector="R" yChannelSelector="G" result="bent"/>
      <feColorMatrix in="bent" type="saturate" values="${id === "lg-lens" ? 1.5 : 1.9}"/>
    </filter>`).join("");
    document.body.appendChild(svg);
  }
  const fit = (id, w, h, band, mode) => {
    const f = $(`#${id}`, svg), im = $("feImage", f);
    [f, im].forEach((el) => { el.setAttribute("width", w); el.setAttribute("height", h); });
    f.setAttribute("x", 0); f.setAttribute("y", 0);
    im.setAttribute("href", lgMap(w, h, band, mode));
  };
  const r = tabbar.getBoundingClientRect(), a = $(".tabbar a");
  if (!r.width) return;
  fit("lg-refract", r.width, r.height, Math.min(13, r.height * 0.24));
  if (a) fit("lg-lens", a.offsetWidth, r.height - 12, 14, "lens");
}

// ---------- La gota: molla amortida (posició, amplada i elevació) ----------
const Sp = { x: 0, w: 0, vx: 0, vw: 0, tx: 0, tw: 0, lift: 1, vl: 0, tl: 1, raf: 0, last: 0, ready: false };
function spPaint() {
  const st = Math.min(0.32, Math.abs(Sp.vx) / 2800);
  tabInd.style.setProperty("--w", `${Sp.w.toFixed(2)}px`);
  tabInd.style.transform = `translate3d(${Sp.x.toFixed(2)}px, 0, 0) scale(${((1 + st) * Sp.lift).toFixed(4)}, ${((1 - st * 0.5) * Sp.lift).toFixed(4)})`;
}
function spFrame(t) {
  const dt = Math.min(1 / 30, (t - (Sp.last || t)) / 1000 || 1 / 60);
  Sp.last = t;
  const spring = (p, v, target, k, c) => { const a = k * (target - p) - c * v; v += a * dt; return [p + v * dt, v]; };
  [Sp.x, Sp.vx] = spring(Sp.x, Sp.vx, Sp.tx, 430, 30);
  [Sp.w, Sp.vw] = spring(Sp.w, Sp.vw, Sp.tw, 430, 30);
  [Sp.lift, Sp.vl] = spring(Sp.lift, Sp.vl, Sp.tl, 520, 22);
  spPaint();
  const rest = Math.abs(Sp.tx - Sp.x) < 0.2 && Math.abs(Sp.vx) < 2 && Math.abs(Sp.tw - Sp.w) < 0.2 && Math.abs(Sp.vw) < 2 && Math.abs(Sp.tl - Sp.lift) < 0.002 && Math.abs(Sp.vl) < 0.02;
  if (rest) { Sp.x = Sp.tx; Sp.w = Sp.tw; Sp.lift = Sp.tl; Sp.vx = Sp.vw = Sp.vl = 0; spPaint(); Sp.raf = 0; Sp.last = 0; return; }
  Sp.raf = requestAnimationFrame(spFrame);
}
function spTo(x, w, { instant = false, lift } = {}) {
  Sp.tx = x; Sp.tw = w;
  if (lift !== undefined) Sp.tl = lift;
  if (instant || !Sp.ready || lgReduce.matches) {
    Sp.x = x; Sp.w = w; Sp.vx = Sp.vw = 0;
    if (lift !== undefined && (lgReduce.matches || !Sp.ready)) { Sp.lift = lift; Sp.vl = 0; }
    Sp.ready = true; spPaint();
    if (lift === undefined || lgReduce.matches) return;
  }
  if (!Sp.raf) Sp.raf = requestAnimationFrame(spFrame);
}

let tabActiveNow = null;
function updateTabIndicator() {
  if (!tabbar || !tabInd) return;
  const active = $(".tabbar a.active");
  if (active !== tabActiveNow) {
    // La icona de la pestanya nova fa un petit salt
    tabActiveNow = active;
    if (active && !lgReduce.matches) { active.classList.remove("pop"); void active.offsetWidth; active.classList.add("pop"); }
  }
  // Inici té el seu disc: la gota en repòs només acompanya les altres pestanyes
  tabbar.classList.toggle("on-home", !!active?.classList.contains("tab-home"));
  if (!active) { tabInd.style.opacity = 0; return; }
  tabInd.style.opacity = "";
  spTo(active.offsetLeft, active.offsetWidth);
}
window.addEventListener("resize", () => { updateTabIndicator(); lgFilters(); });

(() => {
  if (!tabbar) return;
  const links = $$(".tabbar a");
  let drag = null;

  const linkAt = (clientX) => {
    const x = clientX - tabbar.getBoundingClientRect().left;
    return links.reduce((best, a) => (Math.abs(a.offsetLeft + a.offsetWidth / 2 - x) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - x) ? a : best), links[0]);
  };
  const follow = (clientX) => {
    const r = tabbar.getBoundingClientRect(), w = links[0].offsetWidth;
    spTo(Math.min(r.width - w - 4, Math.max(4, clientX - r.left - w / 2)), w);
    tabbar.style.setProperty("--lx", `${(((clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    const hover = linkAt(clientX);
    if (hover !== drag.hover) {
      links.forEach((a) => a.classList.toggle("hover", a === hover));
      // Un toc de vibració cada cop que la gota passa a una altra pestanya (Android)
      if (drag.hover && navigator.vibrate) navigator.vibrate(5);
      drag.hover = hover;
    }
  };

  tabbar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x0: e.clientX, moved: false, hover: null };
    try { tabbar.setPointerCapture(e.pointerId); } catch {}
    tabbar.classList.add("pressing");
    tabbar.classList.remove("min");
    Sp.tl = 1.32;
    follow(e.clientX);
  });
  tabbar.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) > 6) { drag.moved = true; tabbar.classList.add("dragging"); }
    follow(e.clientX);
  });
  const end = (e, go) => {
    if (!drag || e.pointerId !== drag.id) return;
    const target = linkAt(e.clientX);
    drag = null;
    tabbar.classList.remove("pressing", "dragging");
    links.forEach((a) => a.classList.remove("hover"));
    Sp.tl = 1;
    if (!go) { updateTabIndicator(); return; }
    if (navigator.vibrate) navigator.vibrate(8);
    const href = target.getAttribute("href");
    if (location.hash !== href) { spTo(target.offsetLeft, target.offsetWidth); location.hash = href; }
    else updateTabIndicator();
  };
  tabbar.addEventListener("pointerup", (e) => end(e, true));
  tabbar.addEventListener("pointercancel", (e) => end(e, false));
  // La navegació la fa el pointerup; el clic només es deixa passar si ve del teclat
  links.forEach((a) => a.addEventListener("click", (e) => { if (e.detail !== 0) e.preventDefault(); }));

  // ---------- En baixar la pàgina s'encongeix; en pujar, torna ----------
  let lastY = scrollY, acc = 0, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, dy = y - lastY;
    lastY = y;
    // El reflex especular gira una mica amb el desplaçament
    tabbar.style.setProperty("--la", `${(y * 0.06) % 360}deg`);
    if (drag) return;
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 80 || acc < -18) tabbar.classList.remove("min");
    else if (acc > 42) tabbar.classList.add("min");
    lgTone();
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("hashchange", () => { tabbar.classList.remove("min"); setTimeout(lgTone, 450); });
  // En encongir-se o créixer, el mapa de refracció s'ha d'ajustar a la mida nova
  tabbar.addEventListener("transitionend", (e) => { if (e.target === tabbar && e.propertyName === "height") { lgFilters(); updateTabIndicator(); } });

  // ---------- Vidre clar o fosc segons el que hi ha a sota ----------
  let toneT = 0;
  function lgTone() {
    const now = performance.now();
    if (now - toneT < 140) return;
    toneT = now;
    const r = tabbar.getBoundingClientRect();
    if (!r.width) return;
    let dark = 0, seen = 0;
    for (const fx of [0.15, 0.5, 0.85]) {
      const els = document.elementsFromPoint(r.left + r.width * fx, r.top + r.height / 2);
      for (const el of els) {
        if (el === tabbar || tabbar.contains(el)) continue;
        // Els elements petits (etiquetes, botons) no decideixen el to
        const box = el.getBoundingClientRect();
        if (box.width < 100 || box.height < 30) continue;
        // rgb(a) va de 0 a 255; color(srgb …), que surt de color-mix(), de 0 a 1
        const bg = getComputedStyle(el).backgroundColor, m = bg.match(/[\d.]+/g);
        if (!m) continue;
        const fn = bg.startsWith("color(");
        const alpha = fn ? (bg.includes("/") ? Number(m[m.length - 1]) : 1) : m[3] !== undefined ? Number(m[3]) : 1;
        if (alpha < 0.5) continue;
        const [R, G, B] = m.slice(0, 3).map((v) => Number(v) * (fn ? 255 : 1));
        seen++;
        if (0.2126 * R + 0.7152 * G + 0.0722 * B < 110) dark++;
        break;
      }
    }
    tabbar.classList.toggle("on-dark", seen > 0 && dark * 2 > seen);
  }
  setTimeout(() => { lgFilters(); updateTabIndicator(); lgTone(); }, 60);
  // El contingut de sota canvia sense desplaçar (pàgines que es pinten més tard, desplegables…): es torna a mirar sovint
  addEventListener("load", () => setTimeout(lgTone, 200));
  setInterval(() => { if (!document.hidden && !drag) lgTone(); }, 1000);
  if (document.fonts?.ready) document.fonts.ready.then(() => { lgFilters(); updateTabIndicator(); });
})();

// ---------- Comptes i duels (es delega a online.js si està disponible) ----------
function renderDuelView(code) {
  if (window.Online) return window.Online.renderDuel(code);
  $("#duel-root").innerHTML = `
    <div class="card online-off">
      <div class="gc-icon" style="--c:var(--blue)">${icon(`<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5L18 3h3v3l-3.5 8.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>`)}</div>
      <h3>Los duelos necesitan conexión</h3>
      <p>Para retar a amigos hay que abrir la app desde su dirección web (no haciendo doble clic en el archivo) y tener conexión a internet.</p>
    </div>`;
}
$("#account-btn").addEventListener("click", () => {
  if (window.Online) return window.Online.accountClick();
  toast("Iniciar sesión solo funciona con la app publicada en internet");
});

// ---------- Compte enrere ----------
function tickCountdown() {
  const diff = ELECTION_DATE - Date.now();
  const set = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
  if (diff <= 0) {
    const c = $(".ap-count");
    if (c) c.innerHTML = "<b>¡Hoy se vota!</b> Los colegios están abiertos de 9 a 20 h.";
    set("#hero-days", "hoy se vota");
    return;
  }
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  set("#cd-d", days);
  set("#hero-days", `faltan ${days} días`);
  set("#cd-h", String(Math.floor((s % 86400) / 3600)).padStart(2, "0"));
  set("#cd-m", String(Math.floor((s % 3600) / 60)).padStart(2, "0"));
  set("#cd-s", String(s % 60).padStart(2, "0"));
  tickNextDaily();
  setTimeout(tickCountdown, 1000);
}

// ---------- Aprèn: comptadors animats (els fa servir apren.js) ----------
function countUp(el) {
  const target = Number(el.dataset.count), dec = Number(el.dataset.dec), suf = el.dataset.suffix;
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / 1100);
    const v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
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
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa ideológico orientativo de los partidos">
      <rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>
      <rect x="${L}" y="${T}" width="${(W - L - R) / 2}" height="${(H - T - B) / 2}" rx="14" fill="rgba(255,75,43,.06)"/>
      <rect x="${L + (W - L - R) / 2}" y="${T}" width="${(W - L - R) / 2}" height="${(H - T - B) / 2}" fill="rgba(53,84,255,.05)"/>
      <path d="M${px(5)} ${T}V${H - B}M${L} ${py(5)}H${W - R}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 6" opacity=".5"/>
      <text x="${L + 10}" y="${H - B + 30}" class="ax">← Izquierda</text>
      <text x="${W - R - 10}" y="${H - B + 30}" class="ax" text-anchor="end">Derecha →</text>
      <text x="${L - 14}" y="${T + 14}" class="ax" transform="rotate(-90 ${L - 14} ${T + 14})" text-anchor="end">Soberanismo ↑</text>
      <text x="${L - 14}" y="${H - B - 4}" class="ax" transform="rotate(-90 ${L - 14} ${H - B - 4})" text-anchor="start">Centralismo</text>
      ${sorted.map((p) => {
        const sel = p.id === cmpSel.a ? "A" : p.id === cmpSel.b ? "B" : "";
        return `<g class="pm-dot ${sel ? "sel" : ""}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.sig}">
          <circle cx="${px(p.x)}" cy="${py(p.y)}" r="${rad(p.seats)}" fill="${p.color}" stroke="var(--ink)" stroke-width="${sel ? 4 : 2.5}"/>
          <text x="${px(p.x)}" y="${py(p.y) + 4}" text-anchor="middle" class="pm-lbl ${p.seats < 20 ? "out" : ""}" ${p.seats < 20 ? `dy="${rad(p.seats) + 12}"` : ""}>${p.sig}</text>
          ${sel ? `<circle cx="${px(p.x) + rad(p.seats) * .72}" cy="${py(p.y) - rad(p.seats) * .72}" r="10" fill="var(--ink)"/><text x="${px(p.x) + rad(p.seats) * .72}" y="${py(p.y) - rad(p.seats) * .72 + 4}" text-anchor="middle" class="pm-sel">${sel}</text>` : ""}
        </g>`;
      }).join("")}
    </svg>
    <p class="pm-cap">El tamaño de cada burbuja es proporcional a los escaños de 2023. Toca un partido para añadirlo al comparador.</p>`;
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
        <div><small>Cabeza de lista el 29N</small><h4>${p.cand.name}</h4><p>${p.cand.info}</p></div>
      </div>
      ${PARTY_ARGS[p.id] ? `<div class="cmp-core"><small>Idea central</small><q>${PARTY_ARGS[p.id].core}</q><p>${PARTY_ARGS[p.id].about}</p></div>` : ""}
      <dl class="cmp-rows">
        <div><dt>Líder del partido</dt><dd>${p.leader ? `${p.leader.name} <span class="muted">· ${p.leader.role}</span>` : `<span class="muted">Coalición sin un líder único</span>`}</dd></div>
        <div><dt>Escaños en 2023</dt><dd><span class="big">${p.seats}</span><span class="seatbar"><i style="width:${(p.seats / 350) * 100}%"></i><em></em></span></dd></div>
        <div><dt>Votos en 2023</dt><dd>${p.votes != null ? `<span class="big">${String(p.votes).replace(".", ",")} %</span>` : `<span class="muted">No se presentó solo</span>`}</dd></div>
        <div><dt>Ideario</dt><dd class="chips">${p.ideas.map((x) => `<span>${x}</span>`).join("")}</dd></div>
        <div><dt>Modelo territorial</dt><dd>${p.territory || `<span class="muted">Sin posición destacada</span>`}</dd></div>
        ${PARTY_EXTRA[p.id] ? `<div><dt>Propuestas estrella</dt><dd><ul class="stars">${PARTY_EXTRA[p.id].stars.map((x) => `<li>${x}</li>`).join("")}</ul></dd></div>` : ""}
        <div><dt>Investidura de Sánchez (2023)</dt><dd>${voteBadge(p.inv)}</dd></div>
        <div><dt>Ley de amnistía (2024)</dt><dd>${voteBadge(p.amn)}</dd></div>
        ${p.note ? `<div><dt>A tener en cuenta</dt><dd class="muted">${p.note}</dd></div>` : ""}
      </dl>
      <details class="cmp-more">
        <summary>Más datos del partido</summary>
        <dl class="cmp-rows">
          ${PARTY_EXTRA[p.id] ? `
          <div><dt>Historia</dt><dd>${PARTY_EXTRA[p.id].hist}</dd></div>
          <div><dt>Dónde gobierna</dt><dd>${PARTY_EXTRA[p.id].gov}</dd></div>
          <div><dt>Dónde es más fuerte</dt><dd>${PARTY_EXTRA[p.id].strong}</dd></div>
          <div><dt>Alianzas</dt><dd>${PARTY_EXTRA[p.id].allies}</dd></div>
          <div><dt>Compite con</dt><dd>${PARTY_EXTRA[p.id].vs}</dd></div>` : ""}
          <div><dt>Grupo europeo</dt><dd>${p.euro}</dd></div>
          <div><dt>Fundación</dt><dd>${p.founded}</dd></div>
        </dl>
      </details>
      <div class="cmp-news" data-party="${p.id}" style="--pc:${p.color}"></div>
    </article>`;
  $("#cmp").innerHTML = col(A, "A") + `<span class="cmp-vs">VS</span>` + col(B, "B");
  const seg = $("#cmp-seg");
  if (seg) {
    const show = seg.dataset.show || "A";
    $("#cmp").dataset.show = show;
    seg.innerHTML = [["A", A], ["B", B]].map(([k, p]) => `<button type="button" class="${k === show ? "on" : ""}" data-show="${k}" style="--pc:${p.color}"><i>${k}</i>${p.sig}</button>`).join("");
    $$("button", seg).forEach((b) => b.addEventListener("click", () => {
      seg.dataset.show = b.dataset.show;
      $("#cmp").dataset.show = b.dataset.show;
      $$("button", seg).forEach((x) => x.classList.toggle("on", x === b));
    }));
  }
  renderFace(A, B);
  if (typeof fillPartyNews === "function") fillPartyNews();
  const argA = PARTY_ARGS[A.id] || {}, argB = PARTY_ARGS[B.id] || {};
  const cell = (p, txt) => `<div class="args-cell" style="--pc:${p.color}"><b>${p.sig}</b>${txt ? `<p>${txt}</p>` : `<p class="muted">Sin propuesta destacada en este tema.</p>`}</div>`;
  $("#args").innerHTML = `
    <div class="args-head"><h3>Qué proponen, tema a tema</h3><p><span style="--pc:${A.color}">${A.sig}</span> vs <span style="--pc:${B.color}">${B.sig}</span></p></div>
    ${ARG_AREAS.map((ar) => `
      <div class="args-row">
        <div class="args-label"><svg viewBox="0 0 24 24">${ar.icon}</svg><span>${ar.label}</span></div>
        ${cell(A, argA[ar.k])}${cell(B, argB[ar.k])}
      </div>`).join("")}
    <p class="src-note">Resumen a partir de los programas electorales de 2023 y de las posiciones públicas de cada partido. Los programas del 29N pueden introducir cambios.</p>`;
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
  if (A.inv !== "—" && B.inv !== "—") same.push(A.inv === B.inv ? `Votaron igual en la investidura de Sánchez (${A.inv})` : "Votaron distinto en la investidura de Sánchez");
  if (A.amn !== "—" && B.amn !== "—") same.push(A.amn === B.amn ? `Votaron igual en la ley de amnistía (${A.amn})` : "Votaron distinto en la ley de amnistía");
  if (A.euro === B.euro && !["—", "No inscritos"].includes(A.euro)) same.push(`Comparten grupo europeo (${A.euro})`);
  const common = A.ideas.filter((x) => B.ideas.includes(x));
  if (common.length) same.push(`Ideario en común: ${common.join(", ")}`);
  const evo = (p) => {
    const s19 = SEATS_2019[p.id];
    if (s19 == null) return `<span class="muted">Sin datos comparables</span>`;
    const d = p.seats - s19;
    return `<b>${s19} → ${p.seats}</b> <span class="delta ${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "+" : ""}${d}</span>`;
  };
  const both = ARG_AREAS.filter((ar) => (PARTY_ARGS[A.id] || {})[ar.k] && (PARTY_ARGS[B.id] || {})[ar.k]).length;
  el.innerHTML = `
    <div class="face-head"><h3>Cara a cara</h3><p><span style="--pc:${A.color}">${A.sig}</span> vs <span style="--pc:${B.color}">${B.sig}</span></p></div>
    <div class="face-grid">
      <div class="face-card">
        <h4>Distancia ideológica</h4>
        <div class="dist"><div class="dist-bar"><i style="width:${dist}%"></i></div><b>${dist}/100</b></div>
        <p class="muted">${dist < 25 ? "Muy cerca en el mapa ideológico." : dist < 55 ? "Posiciones distintas pero con puntos de contacto." : "Posiciones muy alejadas."}</p>
        ${axis("Eje izquierda–derecha", "Izquierda", "Derecha", A.x, B.x)}
        ${axis("Eje territorial", "Centralismo", "Soberanismo", A.y, B.y)}
      </div>
      <div class="face-card">
        <h4>Escaños 2019 → 2023</h4>
        <div class="evo"><span style="--pc:${A.color}"><em>${A.sig}</em>${evo(A)}</span><span style="--pc:${B.color}"><em>${B.sig}</em>${evo(B)}</span></div>
        <h4>Coincidencias y diferencias</h4>
        <ul class="same">${same.length ? same.map((x) => `<li>${x}</li>`).join("") : "<li>No hay datos de votaciones comparables.</li>"}</ul>
        <p class="muted">Ambos tienen propuesta en ${both} de ${ARG_AREAS.length} áreas (tabla de abajo).</p>
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
    cmpShowTab("fitxes");
    $("#party-map").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

// Pestanyes del comparador: fitxes, cara a cara, tema a tema i caps de llista
function cmpShowTab(k) {
  $$("[data-cmptab]").forEach((b) => { const on = b.dataset.cmptab === k; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  $$("[data-cmppanel]").forEach((p) => { p.hidden = p.dataset.cmppanel !== k; });
}
$$("[data-cmptab]").forEach((b) => b.addEventListener("click", () => { Sfx.play("pick"); cmpShowTab(b.dataset.cmptab); }));

function renderParties() {
  renderPartyMap();
  renderCompare();
  if (!$("#cand-grid").children.length) renderCandidates();
}

// ---------- Aprèn: simulador lliure ----------
const SIM_EXAMPLE = [["Partido A", 120000], ["Partido B", 95000], ["Partido C", 40000], ["Partido D", 22000], ["Partido E", 7500]];

function addSimParty(name = "", votes = "") {
  const row = h(`<div class="h-party">
    <input type="text" class="p-name" placeholder="Nombre de la candidatura" value="${esc(name)}">
    <input type="number" class="p-votes" min="0" placeholder="Votos" value="${votes}">
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
    res.innerHTML = `<p class="sim-note">Añade al menos una candidatura con votos.</p>`;
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
    <div class="sim-seats" aria-label="Escaños repartidos">${seatSquares}</div>
    <div class="sim-bars">${parties.map((p) => {
      const k = elig.indexOf(p);
      return `<div class="sim-bar ${k < 0 ? "out" : ""}" title="${fmt(p.votes)} votos (${((p.votes / valid) * 100).toFixed(2)} %)">
        <span>${esc(p.name)}</span>
        <div class="track"><div style="width:${Math.max(2, (p.votes / maxV) * 100)}%;background:${k < 0 ? "" : colorOf(p)}"></div></div>
        <strong>${k < 0 ? 0 : won[k]}</strong>
      </div>`;
    }).join("")}</div>
    <p class="sim-note">Votos válidos: ${fmt(valid)} (${fmt(blank)} en blanco) · Umbral del ${threshold} %: ${fmt(Math.ceil(min))} votos${
      elig.length < parties.length ? ` · Se quedan fuera: ${parties.filter((p) => !elig.includes(p)).map((p) => esc(p.name)).join(", ")}` : ""}</p>
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

// ---------- Primera visita: què hi ha a l'app ----------
const ONBOARD_KEY = "r29n-onboard";
const ONBOARD = [
  { t: "Bienvenido/a a Política en Joc", d: "Aprende cómo funcionan las elecciones del 29N jugando. Te presentamos lo que encontrarás en un minuto.", art: "simulador" },
  { t: "Inicio y reto diario", d: "Cada día, un reto nuevo de 10 pruebas con cronómetro: preguntas, ordenar, encontrar provincias en el mapa, dibujar territorios como los Países Catalanes o Euskal Herria… Haz racha (tienes un comodín por semana) y compárate con todo el mundo.", art: "diari" },
  { t: "Noticias", d: "Los titulares de política de los principales medios, al minuto: el día en 1 minuto, la misma noticia explicada por varios medios, el termómetro de campaña y un quiz cada semana.", art: "verificador" },
  { t: "Minijuegos", d: "Contrarreloj, Verificador, Haz mayoría, Adivina el año… Partidas rápidas que dan XP para subir de nivel, de Votante a Presidente.", art: "contrarellotge" },
  { t: "Simuladores", d: "Funda tu partido y gana unas elecciones con las reglas de verdad, o plántales cara a los candidatos en un debate electoral en 3D.", art: "simulador" },
  { t: "Social", d: "Reta a tus amigos a duelos 1 vs 1 de preguntas o de campaña, y compárate con todo el mundo en el ranking del reto diario y en las ligas.", art: "majoria" },
  { t: "Aprende", d: "La guía del 29N en capítulos cortos que se leen paso a paso, a pantalla completa: cómo se vota, qué está en juego, las ideologías… Y el comparador de partidos, el pactómetro y el diccionario.", art: "paraula" },
];
function showOnboarding() {
  // Mentre hi hagi l'avís de la Lliga de pronòstics (o estigui oberta), en surt una diapositiva abans de l'última
  const slides = [...ONBOARD];
  const lliga = typeof espAvisSlide === "function" ? espAvisSlide() : null;
  if (lliga) slides.push(lliga);
  let k = 0;
  const box = h(`<div class="onb" role="dialog" aria-modal="true" aria-label="Qué hay en Política en Joc"><div class="onb-card card">
    <div class="onb-art" data-art></div>
    <div class="onb-body"><p class="kicker" data-n></p><h3 data-t></h3><p data-d></p><div data-extra></div>
      <div class="onb-dots" data-dots></div>
      <div class="row"><button class="btn ghost" data-skip>Saltar</button><button class="btn primary" data-next>Siguiente</button></div></div>
  </div></div>`);
  document.body.appendChild(box);
  const N = slides.length + 1;
  const close = () => { box.remove(); store.set(ONBOARD_KEY, 1); store.set(NOVETATS_KEY, NOVETATS_ID); if (lliga && typeof espAvisSeen === "function") espAvisSeen(); };
  const draw = () => {
    const last = k === N - 1, s = slides[k];
    $("[data-art]", box).innerHTML = ART[last ? "match" : s.art] ? ART[last ? "match" : s.art]() : "";
    $("[data-n]", box).textContent = `${k + 1} de ${N}`;
    $("[data-t]", box).textContent = last ? "Tu usuario" : s.t;
    $("[data-d]", box).textContent = last ? "Puedes empezar a jugar ahora mismo. Cuando te crees el usuario con Google, lo tendrás todo guardado y podrás jugar con los demás." : s.d;
    $("[data-extra]", box).innerHTML = !last && s.steps ? `<ol class="esp-avis-steps">${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : last && window.Online?.isGuest?.() ? `<ul class="pitch-list compact">${["Progreso y logros guardados en todos los dispositivos", "Ranking, ligas y duelos con amigos", "Nombre de usuario y foto de perfil"].map((x) => `<li><span aria-hidden="true">✓</span><div><b>${x}</b></div></li>`).join("")}</ul><button class="btn google-btn" data-signin-cta>${googleIconSvg()} Crea el usuario con Google</button><small class="onb-note">Sin usuario puedes hacer 3 partidas de prueba.</small>` : "";
    $("[data-dots]", box).innerHTML = Array.from({ length: N }, (_, i) => `<i class="${i === k ? "on" : ""}"></i>`).join("");
    $("[data-next]", box).textContent = last ? "Empieza a jugar" : "Siguiente";
  };
  draw();
  $("[data-next]", box).focus();
  $("[data-skip]", box).addEventListener("click", close);
  $("[data-next]", box).addEventListener("click", () => { Sfx.play("pick"); if (++k >= N) close(); else draw(); });
  box.addEventListener("click", (e) => { if (e.target.closest("[data-signin-cta]")) close(); });
}
// Icona de Google per als botons fora del mòdul en línia
const googleIconSvg = () => `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
if (!store.get(ONBOARD_KEY, null)) {
  const t0 = Date.now();
  const wait = () => (typeof Esp === "undefined" || Esp.ready || Date.now() - t0 > 2500 ? showOnboarding() : setTimeout(wait, 150));
  setTimeout(wait, 600);
}

// ---------- Novetats (només per a qui ja havia entrat abans) ----------
// Un sol cop per tanda (NOVETATS_ID). Qui entra per primer cop fa el tutorial, que ja ho explica, i no les veu.
// No surten enmig d'una partida ni a les pàgines de control i avís legal: s'esperen a la pàgina següent.
var NOVETATS_KEY = "r29n-novetats", NOVETATS_ID = "2026-10-29";
const NOVETATS_HEAD = { t: "Un debate electoral más real", art: "simulador", cta: "Entra en el plató", href: "#joc/debat" };
const NOVETATS = [
  { ico: "🎙️", t: "Relojes, orden sorteado y réplicas", d: "Relojes de todos los candidatos, orden sorteado, rivales que te contestan, medidor en directo y las portadas del día siguiente." },
  { ico: "✏️", t: "Dibuja el mapa", d: "Un minijuego nuevo: repasa los límites de los territorios y descubre la precisión de tu dibujo." },
];
const NOVETATS_APP = [
  { ico: "🗺️", t: "Reto diario más exigente", d: "En la prueba de dibujar, ahora hace falta más de un 85 % de precisión para aprobar." },
  { ico: "🔥", t: "Racha con comodín", d: "Si un día no juegas, un comodín por semana te guarda la racha." },
];
function novetatsMaybe() {
  if (store.get(NOVETATS_KEY, null) === NOVETATS_ID) return;
  if (!store.get(ONBOARD_KEY, null) && !(Progress.data.xp > 0)) return; // primera visita: ja hi ha el tutorial
  const v = location.hash.slice(1).split("/")[0];
  if (["joc", "control", "legal", "nit"].includes(v) || document.body.classList.contains("lesson") || document.querySelector(".onb, .esp-avis, .db-theater")) return;
  store.set(NOVETATS_KEY, NOVETATS_ID);
  const li = (x) => `<li><span class="nov-ico" aria-hidden="true">${x.ico}</span><div><b>${esc(x.t)}</b><span>${esc(x.d)}</span></div></li>`;
  const box = h(`<div class="onb nov" role="dialog" aria-modal="true" aria-label="Novedades"><div class="card nov-card">
    <header class="nov-head"><div class="nov-art" aria-hidden="true">${ART[NOVETATS_HEAD.art] ? ART[NOVETATS_HEAD.art]() : ""}</div><div><p class="kicker">Novedades</p><h3>${NOVETATS_HEAD.t}</h3></div></header>
    <ul class="nov-list">${NOVETATS.map(li).join("")}</ul>
    <p class="nov-sub">Y en el resto de la app</p>
    <ul class="nov-list sm">${NOVETATS_APP.map(li).join("")}</ul>
    <div class="row nov-btns"><button class="btn ghost" type="button" data-later>Más tarde</button><a class="btn primary" href="${NOVETATS_HEAD.href}" data-go>${NOVETATS_HEAD.cta}</a></div>
  </div></div>`);
  document.body.appendChild(box);
  const close = (go) => { box.remove(); window.Track?.("novetats", { id: NOVETATS_ID, go: go ? 1 : 0 }); };
  $("[data-later]", box).addEventListener("click", () => close(false));
  $("[data-go]", box).addEventListener("click", () => close(true));
  box.addEventListener("click", (e) => { if (e.target === box) close(false); });
  document.addEventListener("keydown", function onEsc(e) { if (e.key === "Escape") { document.removeEventListener("keydown", onEsc); if (box.isConnected) close(false); } });
  $("[data-go]", box).focus({ preventScroll: true });
}
setTimeout(novetatsMaybe, 900);
window.addEventListener("hashchange", () => setTimeout(novetatsMaybe, 400));

// ---------- App instal·lable (PWA) ----------
// Android i Chrome: es desa l'avís d'instal·lació del navegador i s'ofereix amb un botó.
// iPhone i iPad (Safari): no hi ha avís; s'explica com afegir-la a la pantalla d'inici.
// (var i funcions: renderInstall es pot cridar des de renderHome abans que s'arribi a aquest punt del fitxer)
var INSTALL_KEY = "r29n-install";
var installEvt = null;
function isStandalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function canInstall() { return !isStandalone() && (!!installEvt || isIOS()); }
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("../sw.js").catch(() => {}));
}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; renderInstall(); });
window.addEventListener("appinstalled", () => { window.Stats?.add("inst"); installEvt = null; store.set(INSTALL_KEY, { done: 1 }); renderInstall(); toast("Ya tienes Política en Joc instalada"); });
async function doInstall() {
  if (installEvt) {
    installEvt.prompt();
    const r = await installEvt.userChoice.catch(() => null);
    installEvt = null;
    if (r?.outcome === "accepted") store.set(INSTALL_KEY, { done: 1 });
    renderInstall();
    return;
  }
  const box = h(`<div class="onb" role="dialog" aria-modal="true" aria-label="Instala la app"><div class="card install-ios">
    <h3>Instala Política en Joc</h3>
    <ol><li>Toca el botón <b>Comparte</b> <span class="ios-share" aria-hidden="true">⬆︎</span> de Safari.</li><li>Elige <b>Añadir a pantalla de inicio</b>.</li><li>Pulsa <b>Añadir</b>. ¡Ya la tendrás como una app!</li></ol>
    <p class="muted">Tiene que ser con Safari. Funciona igual que la app: a pantalla completa y con el icono en la pantalla de inicio.</p>
    <button class="btn primary" type="button" data-ok>Entendido</button></div></div>`);
  document.body.appendChild(box);
  $("[data-ok]", box).addEventListener("click", () => box.remove());
  box.addEventListener("click", (e) => { if (e.target === box) box.remove(); });
}
// Targeta a Perfil i franja discreta a l'inici (només a partir de la segona visita, i fins que es tanca)
function renderInstall() {
  if (!INSTALL_KEY) return;
  const st = store.get(INSTALL_KEY, {});
  const card = $("#install-card");
  if (card) card.innerHTML = canInstall() ? `<div class="card install-card"><span aria-hidden="true">📲</span><div><b>Instala Política en Joc</b><p>Tendrás la app en la pantalla de inicio, a pantalla completa y más rápida.</p></div><button class="btn primary" type="button" data-install>Instala</button></div>` : "";
  const bar = $("#install-bar");
  if (bar) bar.innerHTML = canInstall() && !st.no && !st.done && (st.visits || 0) >= 2 ? `<div class="install-bar"><span aria-hidden="true">📲</span><p><b>¿Tienes Política en Joc a mano?</b> Instálala en el móvil.</p><button class="btn primary" type="button" data-install>Instala</button><button class="install-x" type="button" data-install-no aria-label="Ahora no">✕</button></div>` : "";
  $$("[data-install]").forEach((b) => { b.onclick = doInstall; });
  $$("[data-install-no]").forEach((b) => { b.onclick = () => { store.set(INSTALL_KEY, { ...store.get(INSTALL_KEY, {}), no: 1 }); renderInstall(); }; });
}
{
  const st = store.get(INSTALL_KEY, {});
  const today = new Date().toDateString();
  if (st.day !== today) store.set(INSTALL_KEY, { ...st, day: today, visits: (st.visits || 0) + 1 });
}
