// Match ideològic i Repte diari contra el rellotge.

// ---------- Utilitats comunes ----------
const DAILY_EPOCH = new Date(2026, 9, 1); // 1 d'octubre de 2026 = repte #1
const hashString = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 2166136261);
function dateKeyOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const dailyNumber = (key = todayKey()) => {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - DAILY_EPOCH) / 86400000) + 1;
};
// 83400 ms → "1:23,4"
function fmtTime(ms) {
  const t = Math.max(0, ms) / 1000;
  const m = Math.floor(t / 60), s = t - m * 60;
  const ss = s.toFixed(1).replace(".", ",");
  return m ? `${m}:${s < 10 ? "0" : ""}${ss}` : ss;
}
// Temps amb la unitat: «45,2 s» o «1:23,4 min»
const fmtSecs = (ms) => `${fmtTime(ms)} ${ms < 60000 ? "s" : "min"}`;

// Lliscar una targeta a dreta (sí) o esquerra (no)
function attachSwipe(card, zone, onDecide) {
  let x0 = null, dx = 0;
  card.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.classList.add("dragging"); });
  card.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    zone.dataset.lean = dx > 40 ? "yes" : dx < -40 ? "no" : "";
  });
  const release = () => {
    if (x0 === null) return;
    x0 = null;
    card.classList.remove("dragging");
    zone.dataset.lean = "";
    if (Math.abs(dx) > 90) onDecide(dx > 0);
    else card.style.transform = "";
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
}

// Avatar d'un actor: foto de Wikimedia Commons (amb crèdit) o inicials
function actorAvatar(a, size = "") {
  if (a.photo?.src) {
    return `<figure class="actor-photo ${size}">
      <img src="${esc(a.photo.src)}" alt="${esc(a.name)}" loading="lazy">
      <figcaption>Foto: <a href="${esc(a.photo.page)}" target="_blank" rel="noopener">${esc(a.photo.author)}</a> · ${esc(a.photo.license)} · Wikimedia Commons</figcaption>
    </figure>`;
  }
  const ini = a.name.length <= 5 ? a.name : a.name.split(/\s+/).filter((w) => /^[A-ZÀ-ÚÒ]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
  return `<span class="actor-ini ${size} ${ini.length >= 4 ? "long" : ""}" style="--ac:${a.color}">${esc(ini)}</span>`;
}

// =========================================================
// MATCH IDEOLÒGIC
// =========================================================
registerGame({
  id: "match",
  cat: "parlament",
  tagline: "Partits, polítics i entitats: fes match amb el que defensen.",
  kicker: "Llisca i decideix",
  title: "Match ideològic",
  level: 2,
  meta: "5 perfils",
  icon: icon(`<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>`),
  desc: "Et presentem un partit, un polític o una entitat de la societat civil i et van sortint targetes. Si hi encaixa, MATCH. Si no, NO MATCH. Llisca a la dreta o a l'esquerra.",
  rules: ["5 perfils · 6 targetes", "→ Match · ← No match", "Perfil perfecte: +50", "Tecles ← →"],
  start(ctx) {
    const ROUNDS = 5;
    const actors = sample(MATCH_ACTORS, ROUNDS);
    let r = 0, score = 0, streak = 0, hits = 0, total = 0, decideFn = null;
    const results = [], recap = [];
    ctx.hud([["r", "Perfil", `1/${ROUNDS}`], ["pts", "Punts", "0"], ["x", "Ratxa", "0"]]);
    ctx.onKey((e) => {
      if (e.key === "ArrowRight") decideFn?.(true);
      else if (e.key === "ArrowLeft") decideFn?.(false);
    });
    next();

    function deck(a) {
      const yes = sample(a.yes, Math.min(3, a.yes.length)).map((t) => ({ t, ok: true }));
      const no = sample(a.no, Math.min(6 - yes.length, a.no.length)).map((t) => ({ t, ok: false }));
      return shuffle([...yes, ...no]);
    }

    function next() {
      if (r >= ROUNDS) {
        return ctx.finish({ score, ratio: total ? hits / total : 0, unit: `punts · ${hits}/${total} encerts`, xp: Math.round(score / 7), recap: recap.slice(0, 10) });
      }
      const actor = actors[r];
      const cards = deck(actor);
      let k = 0, roundOk = 0;
      const marks = [];
      ctx.setHud("r", `${r + 1}/${ROUNDS}`);
      ctx.body.innerHTML = "";
      const wrap = h(`<div class="match-game">
        ${progressDots(ROUNDS, results, r)}
        <div class="actor-card" style="--ac:${actor.color}">
          ${actorAvatar(actor, "lg")}
          <div class="actor-txt"><small>${actor.kind}</small><h3>${esc(actor.name)}</h3></div>
          <span class="actor-count">1/${cards.length}</span>
        </div>
        <div class="swipe-zone match-zone">
          <div class="swipe-hint left">NO MATCH</div>
          <div class="swipe-hint right">MATCH</div>
          <div class="swipe-deck"></div>
        </div>
        <div class="verif-actions">
          <button class="btn verdict-btn no" data-v="0">✕ No match</button>
          <button class="btn verdict-btn yes match-yes" data-v="1">♥ Match</button>
        </div>
        <div class="match-marks"></div>
      </div>`);
      ctx.body.appendChild(wrap);
      const zone = $(".swipe-zone", wrap);
      $$("[data-v]", wrap).forEach((b) => b.addEventListener("click", () => decideFn?.(b.dataset.v === "1")));
      deal();

      function deal() {
        const c = cards[k];
        const deckEl = $(".swipe-deck", wrap);
        deckEl.innerHTML = "";
        const el = h(`<div class="swipe-card match-card"><span class="sc-kicker">${esc(actor.name)} i…</span><p></p></div>`);
        $("p", el).textContent = c.t;
        deckEl.appendChild(el);
        $(".actor-count", wrap).textContent = `${k + 1}/${cards.length}`;
        let busy = false;
        decideFn = (said) => {
          if (busy) return;
          busy = true;
          decideFn = null;
          const ok = said === c.ok;
          total++;
          el.classList.add(said ? "fly-right" : "fly-left", ok ? "is-ok" : "is-ko");
          if (ok) {
            hits++; streak++; roundOk++;
            const pts = 20 + Math.min(streak - 1, 5) * 4;
            score += pts;
            floatPoints(zone, `+${pts}`);
            Sfx.play(streak % 5 === 0 ? "combo" : "ok");
            ctx.setHud("pts", fmt(score), { bump: true });
          } else {
            streak = 0;
            Sfx.play("ko");
            recap.push({ q: `${actor.name} · ${c.t}`, a: c.ok ? "Era MATCH" : "No era match" });
          }
          ctx.setHud("x", streak, { bump: ok && streak >= 3 });
          marks.push(`<span class="mm ${ok ? "ok" : "ko"}"><b>${c.ok ? "♥" : "✕"}</b>${esc(c.t)}</span>`);
          $(".match-marks", wrap).innerHTML = marks.join("");
          k++;
          ctx.after(ok ? 320 : 750, () => (k < cards.length ? deal() : roundEnd()));
        };
        attachSwipe(el, zone, (yes) => decideFn?.(yes));
      }

      function roundEnd() {
        const perfect = roundOk === cards.length;
        results[r] = perfect;
        if (perfect) {
          ctx.achieve("match");
          score += 50;
          ctx.setHud("pts", fmt(score), { bump: true });
          floatPoints(zone, "+50");
        }
        $(".verif-actions", wrap).remove();
        zone.remove();
        const fb = h(`<div></div>`);
        wrap.appendChild(fb);
        explain(fb, perfect, `${roundOk} de ${cards.length} targetes encertades.`, perfect ? "Match perfecte! +50" : "Perfil acabat");
        nextButton(fb, r + 1 < ROUNDS ? "Següent perfil" : "Veure el resultat").then(() => { r++; next(); });
      }
    }
  },
});

// =========================================================
// REPTE DIARI (contra el rellotge)
// =========================================================

// Una pregunta binària (dos botons grans)
const binary = (label, prompt, options, correctIndex, explainText, recapQ) =>
  ({ label, prompt, options, correctIndex, binary: true, explain: explainText, recapQ, recapA: options[correctIndex] });

function tfItem(rng, key = null) {
  const s = makeStatement(rng, key);
  return binary("Cert o fals?", `<div class="q-text">${esc(s.text)}</div>`, ["✕ Fals", "✓ Cert"], s.truth ? 1 : 0, s.exp, s.text);
}
function matchItem(rng) {
  const a = MATCH_ACTORS[Math.floor(rng() * MATCH_ACTORS.length)];
  const yes = rng() < 0.5;
  const list = yes ? a.yes : a.no;
  const t = list[Math.floor(rng() * list.length)];
  return binary("Match ideològic",
    `<div class="match-q">${actorAvatar(a, "sm")}<b>${esc(a.name)}</b><span class="mq-plus">+</span><span class="mq-concept">${esc(t)}</span></div>`,
    ["✕ No match", "♥ Match"], yes ? 1 : 0,
    yes ? `${a.name} i «${t}» fan match.` : `${a.name} i «${t}» no fan match.`, `${a.name} + ${t}`);
}
function versusItem(rng, key = null) {
  const mode = ["prov", "party", "event"][Math.floor(rng() * 3)];
  const two = (arr, ok) => {
    for (let i = 0; i < 50; i++) {
      const [x, y] = sample(arr, 2, rng);
      if (ok(x, y)) return [x, y];
    }
    return sample(arr, 2, rng);
  };
  if (mode === "event") {
    const [a, b] = two(EVENTS.filter((e) => !key || !e.since || e.since <= key), (x, y) => x.y !== y.y);
    return binary("Què va passar abans?", `<div class="q-text small">Toca el fet més antic</div>`,
      [a.t, b.t], a.y < b.y ? 0 : 1, `${a.t}: ${a.y}. ${b.t}: ${b.y}.`, `${a.t} / ${b.t}`);
  }
  if (mode === "party") {
    const [a, b] = two(CONGRESS[2023].parties, (x, y) => x.seats !== y.seats);
    return binary("Congrés del 23-J", `<div class="q-text">Quin partit va treure més escons?</div>`,
      [a.name, b.name], a.seats > b.seats ? 0 : 1, `${a.name}: ${a.seats} · ${b.name}: ${b.seats}.`, `${a.name} / ${b.name}`);
  }
  const [a, b] = two(PROVINCES, (x, y) => x.seats !== y.seats);
  return binary("Diputats per província (29N)", `<div class="q-text">Quina província elegeix més diputats?</div>`,
    [a.name, b.name], a.seats > b.seats ? 0 : 1, `${a.name}: ${a.seats} · ${b.name}: ${b.seats}.`, `${a.name} / ${b.name}`);
}

// Les 10 proves del repte. La partida 1 és la de tothom (la que compta per al rànquing); la 2a i la 3a del dia tenen
// proves noves: cap no repeteix la pregunta d'una partida anterior d'aquell dia.
function dailyItems(key, attempt = 1) {
  const avail = (arr) => arr.filter((x) => !x.since || x.since <= key);
  const Q = avail(QUESTIONS);
  const easy = Q.filter((q) => !q.hard), hard = Q.filter((q) => q.hard);
  // Des de DAILY_V2_FROM (reptes-mec.js): proves d'ordenar, de mapa i, un dia sí i un dia no, d'endevinar un número o de llei d'Hondt
  const gens = key >= DAILY_V2_FROM || featPreview("diari2") ? [
    (rng) => questionRound(sample(easy, 1, rng)[0], rng),
    (rng) => (rng() < 0.5 ? tfItem(rng, key) : versusItem(rng, key)),
    (rng) => matchItem(rng),
    (rng) => quoteRound(pickQuote(rng), rng),
    (rng) => yearRound(sample(avail(EVENTS), 1, rng)[0], rng),
    (rng) => figureRound(sample(avail(FIGURES), 1, rng)[0], rng, avail(FIGURES)),
    (rng) => orderItem(rng),
    (rng) => mapItem(rng),
    (rng) => (dailyNumber(key) % 2 ? guessItem(rng) : dhondtItem(rng)),
    (rng) => questionRound(sample(hard, 1, rng)[0], rng),
  ] : [
    (rng) => questionRound(sample(easy, 1, rng)[0], rng),
    (rng) => tfItem(rng, key),
    (rng) => matchItem(rng),
    (rng) => quoteRound(pickQuote(rng), rng),
    (rng) => versusItem(rng, key),
    (rng) => yearRound(sample(avail(EVENTS), 1, rng)[0], rng),
    (rng) => figureRound(sample(avail(FIGURES), 1, rng)[0], rng, avail(FIGURES)),
    (rng) => tfItem(rng, key),
    (rng) => matchItem(rng),
    (rng) => questionRound(sample(hard, 1, rng)[0], rng),
  ];
  const rng = seededRng(hashString(attempt === 1 ? `daily-${key}` : `daily-${key}-${attempt}`));
  if (attempt === 1) return shuffle(gens.map((g) => g(rng)), rng);
  const seen = new Set();
  for (let a = 1; a < attempt; a++) dailyItems(key, a).forEach((it) => seen.add(it.recapQ));
  const items = gens.map((g) => {
    let it = g(rng);
    for (let k = 0; k < 25 && seen.has(it.recapQ); k++) it = g(rng);
    seen.add(it.recapQ);
    return it;
  });
  return shuffle(items, rng);
}

// ---------- Partides del dia ----------
// Es compten en aquest dispositiu. Amb el límit actiu (Centre de control › Anuncis): 2 partides i una 3a si es mira
// un vídeo d'un anunciant. Sense límit, es pot jugar sempre (cada partida, amb proves noves).
const DAILY_TRIES_KEY = "r29n-diari-intents";
const DAILY_FREE = 2, DAILY_MAX = 3;
function dailyTries(key = todayKey()) {
  const t = store.get(DAILY_TRIES_KEY, {});
  return t.key === key ? t.n : dailyResult(key) ? 1 : 0;
}
function dailyTryAdd(key = todayKey()) {
  const t = store.get(DAILY_TRIES_KEY, {}), n = dailyTries(key) + 1;
  store.set(DAILY_TRIES_KEY, { key, n, ad: t.key === key && !!t.ad });
  return n;
}
function dailyIntroNote(r) {
  if (!r) return "";
  const n = dailyTries(), left = DAILY_FREE - n;
  const best = `El teu millor temps d'avui: <b>${fmtSecs(r.ms)}</b>.`;
  if (n >= DAILY_MAX) return `<p class="intro-note">${best} Ja has jugat les ${DAILY_MAX} partides que compten.</p>`;
  if (window.Ads?.limit() && left <= 0) return `<p class="intro-note">${best}</p>`;
  return `<p class="intro-note">${best} Pots tornar a jugar amb proves noves: al rànquing compta el millor de les ${DAILY_MAX} partides${window.Ads?.limit() ? ` (et ${left === 1 ? "queda 1 partida" : `queden ${left} partides`} i una 3a amb vídeo)` : ""}.</p>`;
}
function dailyPracticeVerdict(attempt, better, prev) {
  const lim = window.Ads?.limit();
  if (attempt > DAILY_MAX) return `Partida de pràctica: al rànquing compta el millor de les ${DAILY_MAX} primeres partides del dia.`;
  const more = attempt < DAILY_MAX ? (lim && attempt >= DAILY_FREE ? " Encara pots jugar-ne una altra mirant un vídeo." : " Encara pots jugar-ne una altra.") : " Demà, repte nou!";
  return better ? `Has millorat el teu temps d'avui (abans: ${fmtSecs(prev.ms)}). Ara compta aquest per al rànquing!${more}` : `No has superat el teu millor temps d'avui (${fmtSecs(prev.ms)}), que és el que compta.${more}`;
}
const dailyAdUnlocked = (key = todayKey()) => { const t = store.get(DAILY_TRIES_KEY, {}); return t.key === key && !!t.ad; };
function dailyAdUnlock(key = todayKey()) { store.set(DAILY_TRIES_KEY, { key, n: dailyTries(key), ad: true }); }

// Què pot fer ara: "free" (jugar), "ad" (cal mirar el vídeo), "out" (ja no queden partides avui)
function dailyAccess(key = todayKey()) {
  const n = dailyTries(key);
  if (!window.Ads?.limit()) return "free";
  if (n < DAILY_FREE) return "free";
  if (n < DAILY_MAX) return dailyAdUnlocked(key) ? "free" : window.Ads.ready() ? "ad" : "out";
  return "out";
}
// Pantalla d'inici del repte quan no es pot jugar directament (core.js › showIntro)
function dailyGate() {
  // La configuració dels anuncis pot haver canviat des de la darrera visita: si és així, es torna a pintar
  const before = JSON.stringify(window.Ads?.cfg?.() || {});
  window.Ads?.refresh?.().then(() => { if (JSON.stringify(window.Ads.cfg()) !== before && location.hash === "#joc/diari" && $(".card.intro")) showIntro(gameById("diari")); });
  const access = dailyAccess();
  if (access === "free") return null;
  if (access === "ad") return {
    html: `<div class="daily-ad">
      <p><b>Ja has jugat les ${DAILY_FREE} partides d'avui.</b> Mira un vídeo curt d'un anunciant i juga'n una tercera, amb proves noves.</p>
      <button class="btn primary lg" type="button" data-ad-go>▶ Mira el vídeo i juga</button>
      <p class="muted" data-ad-msg>Si hi millores el temps, també compta per al rànquing. El vídeo el serveix Google, que et pot demanar permís per a les galetes.</p>
    </div>`,
    bind(el, start) {
      const btn = $("[data-ad-go]", el), msg = $("[data-ad-msg]", el);
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Carregant el vídeo…";
        const r = await window.Ads.reward("repte-tercera");
        if (r.ok) { dailyAdUnlock(); toast("Gràcies! Ja pots jugar la 3a partida"); start(); return; }
        btn.disabled = false; btn.textContent = "▶ Torna-ho a provar";
        msg.textContent = r.why === "blocked" ? "No s'ha pogut carregar el vídeo: potser tens un bloquejador d'anuncis. Desactiva'l per a aquesta web i torna-ho a provar."
          : r.why === "dismissed" ? "El vídeo s'ha tancat abans d'acabar. Per jugar la 3a partida s'ha de veure sencer."
          : "Ara mateix no hi ha cap vídeo disponible. Torna-ho a provar d'aquí a una estona.";
      });
    },
  };
  return {
    html: `<div class="daily-ad out"><p><b>Ja has jugat totes les partides d'avui.</b> Demà hi haurà un repte nou!</p>
      <div class="row center"><a class="btn primary" href="#ranking">Veure el rànquing</a><a class="btn" href="#jocs">Altres jocs</a></div></div>`,
    bind() {},
  };
}

const DAILY_PENALTY = 10000; // +10 s per error

// Resultat del repte d'avui (o null). Accepta el format antic, que era només una puntuació.
function dailyResult(key = todayKey()) {
  const r = Progress.data.daily.scores[key];
  return r && typeof r === "object" ? r : null;
}

function dailyShareText(key, r) {
  const streak = dailyStreakNow().streak;
  return `Política en Joc · Repte #${dailyNumber(key)}\n⏱ ${fmtSecs(r.ms)} · ${r.hits}/10${streak > 1 ? ` · 🔥 ${streak}` : ""}\n${r.grid}\n${location.origin}${location.pathname}`;
}

async function shareDaily(key) {
  const r = dailyResult(key);
  if (!r) return;
  const text = dailyShareText(key, r);
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast("Resultat copiat"); }
  } catch { /* cancel·lat */ }
}

registerGame({
  id: "diari",
  cat: "daily",
  tagline: "10 reptes cada dia. Contra el rellotge.",
  kicker: "Cada dia, un de nou",
  title: "Repte diari",
  level: 2,
  meta: "10 reptes",
  icon: icon(`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>`),
  desc: "10 proves variades (preguntes, cert o fals, ordenar, el mapa, la llei d'Hondt…), iguals per a tothom i noves cada dia. No hi ha límit de temps: el cronòmetre corre i guanya qui ho resol més ràpid. Cada error suma 10 segons. Pots jugar fins a 3 partides al dia, cadascuna amb proves noves: al rànquing compta la millor.",
  rules: ["10 reptes", "Cronòmetre en marxa", "Error: +10 s", "Compta el millor de 3 partides"],
  gate: () => dailyGate(),
  status() {
    const r = dailyResult();
    return r ? `<span class="gc-status done">Fet · ${fmtSecs(r.ms)}</span>` : `<span class="gc-status new">Nou repte</span>`;
  },
  introExtra() {
    const r = dailyResult();
    return `<div class="daily-box">
      <div><small>Repte</small><strong>#${dailyNumber()}</strong></div>
      <div><small>Avui</small><strong>${r ? fmtSecs(r.ms) : "—"}</strong></div>
    </div>${dailyStreakHtml()}${dailyIntroNote(r)}<details class="dcal-wrap"><summary>📅 El teu calendari del repte</summary>${dailyCalendar(0)}</details>`;
  },
  start(ctx) {
    const key = todayKey();
    // Vista prèvia del repte nou (Laboratori del Centre de control): no compta ni com a partida, ni per a la ratxa ni per al rànquing
    const preview = featPreview("diari2") && key < DAILY_V2_FROM;
    const attempt = preview ? 1 : dailyTryAdd(key);
    if (!preview) window.Stats?.add("ad", 1, `partida${Math.min(attempt, 4)}`);
    // Mentre no s'hagi acabat la partida que compta, és la de tothom (encara que se n'hagi deixat una a mitges)
    const items = dailyItems(key, dailyResult(key) && !preview ? attempt : 1);
    const N = items.length;
    let i = 0, errors = 0, hits = 0, penalty = 0, t0 = 0, ended = false;
    const results = [], recap = [];
    // Des de DAILY_V2_FROM el rellotge s'atura mentre es veu la correcció de cada prova
    const pauseFix = key >= DAILY_V2_FROM || preview;
    let paused = 0, pauseAt = 0;
    const elapsed = () => (pauseAt || performance.now()) - t0 - paused + penalty;

    ctx.hud([["q", "Repte", `1/${N}`], ["t", "Temps", "0,0"], ["e", "Errors", "0"]]);
    ctx.countIn(() => {
      t0 = performance.now();
      ctx.every(100, () => {
        if (ended) return;
        const t = fmtTime(elapsed());
        ctx.setHud("t", t);
        const big = $(".daily-clock", ctx.body);
        if (big) big.textContent = t;
      });
      render();
    });

    function render() {
      if (pauseAt) { paused += performance.now() - pauseAt; pauseAt = 0; }
      if (i >= N) return end();
      const it = items[i];
      ctx.setHud("q", `${i + 1}/${N}`);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard daily-card">
        ${progressDots(N, results, i)}
        <div class="q-head"><div class="q-label">${it.label}</div><span class="daily-clock">${fmtTime(elapsed())}</span></div>
        ${it.prompt}
      </div>`);
      ctx.body.appendChild(card);
      // Les proves amb interacció pròpia (ordena, mapa, número, llei d'Hondt) pinten la seva interfície
      let answer;
      if (it.kind) answer = it.play(ctx, card);
      else {
        const box = choiceBox(ctx, card, { options: it.options, correctIndex: it.correctIndex, columns: it.binary ? 2 : (it.columns || 1) });
        if (it.binary) $(".choices", card).classList.add("binary");
        answer = box.promise;
      }
      answer.then(({ correct }) => {
        if (ended) return;
        if (pauseFix) pauseAt = performance.now();
        results[i] = correct;
        if (correct) {
          hits++;
          floatPoints(card, "✓");
        } else {
          errors++;
          penalty += DAILY_PENALTY;
          floatPoints(card, "+10 s", true);
          ctx.setHud("e", errors, { warn: true });
          recap.push({ q: it.recapQ, a: it.recapA, note: it.explain });
        }
        i++;
        ctx.after(correct ? (it.kind ? 700 : 380) : (it.waitKo || 1300), render);
      });
    }

    function end() {
      if (ended) return;
      ended = true;
      const ms = Math.round(elapsed());
      const grid = results.map((ok) => (ok ? "🟩" : "🟥")).join("");
      if (preview) {
        return ctx.finish({ score: hits, noRecord: true, xp: 0, display: fmtTime(ms), ratio: hits / N,
          unit: `${hits}/${N} encerts · ${errors} ${errors === 1 ? "error" : "errors"} (+${errors * 10} s)`,
          verdict: "Vista prèvia del repte nou: aquesta partida no compta per a res.",
          extraHtml: `<div class="daily-share"><div class="share-grid">${grid}</div></div>`, recap });
      }
      const d = Progress.data.daily;
      const prev = dailyResult(key), first = !prev;
      // Al rànquing compta el millor temps de les 3 primeres partides del dia (cadascuna amb proves diferents)
      const counts = attempt <= DAILY_MAX, better = counts && (!prev || ms < prev.ms);
      let xp = 0, sub = null;
      // Proves fallades de la partida de tothom (per a l'estadística de la prova més difícil del dia)
      const f1 = first ? results.map((ok, k) => (ok ? -1 : k)).filter((k) => k >= 0) : null;
      let saved = null;
      if (first) {
        const st = dailyStreakAfter(d, key);
        d.streak = st.streak;
        d.last = key;
        if (st.frozen) { d.frozen = [...(d.frozen || []), st.frozen].slice(-60); saved = st.frozen; }
        DAILY_MILESTONES.forEach(([n, id]) => { if (d.streak >= n) ctx.achieve(id); });
        if (key === DAILY_VOTE_DAY && d.streak >= 7) ctx.achieve("diari29n");
        xp = 40 + hits * 10 + Math.max(0, 90 - Math.round(ms / 1000));
      } else xp = hits * 4; // les partides següents donen una mica d'experiència
      if (better) {
        const keep = f1 || prev?.f1;
        d.scores[key] = { ms, hits, errors, grid, n: attempt, ...(keep ? { f1: keep } : {}) };
        sub = window.Online?.submitDaily?.(key, { ms, hits, errors, n: attempt, f: f1 });
      }
      Progress.save();
      Progress.record("diari", hits, xp);
      ctx.finish({
        score: hits, noRecord: true, xp,
        display: fmtTime(ms),
        ratio: hits / N,
        unit: `${hits}/${N} encerts · ${errors} ${errors === 1 ? "error" : "errors"} (+${errors * 10} s)`,
        verdict: !first ? dailyPracticeVerdict(attempt, better, prev)
          : errors === 0 ? "Ple perfecte. A veure qui et supera avui." : hits >= 7 ? "Molt bon temps. Comparteix-lo i repta els teus amics." : "Demà més! El rellotge no perdona.",
        extraHtml: `<div class="daily-share">
            <div class="share-grid">${grid}</div>
            ${first ? `<p class="daily-streak-res">🔥 <b>${d.streak} ${d.streak === 1 ? "dia" : "dies"} de ratxa</b>${saved ? " · el comodí 🧊 d'aquesta setmana l'ha salvada" : ""}</p>` : ""}
            <div class="daily-share-btns"><button class="btn primary" data-share-img>Comparteix la imatge</button><button class="btn" data-share-daily>Comparteix el text</button></div>
            <a class="btn ghost" href="#ranking">Veure el rànquing</a>
          </div>
          <div id="daily-rank"></div>
          ${dailyCalendar(0)}`,
        onShown(body) {
          $("[data-share-daily]", body)?.addEventListener("click", () => shareDaily(key));
          $("[data-share-img]", body)?.addEventListener("click", () => shareDailyImage(key));
          // El rànquing es pinta quan ja s'ha desat el temps (si ha millorat)
          if (window.Online?.renderDailyMini) Promise.resolve(sub).then(() => window.Online.renderDailyMini($("#daily-rank", body), key));
        },
        recap,
      });
    }
  },
});
