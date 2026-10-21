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
const fmtSecs = (ms) => `${fmtTime(ms)}${ms < 60000 ? " s" : ""}`;

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

function tfItem(rng) {
  const s = makeStatement(rng);
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
function versusItem(rng) {
  const mode = ["prov", "party", "event"][Math.floor(rng() * 3)];
  const two = (arr, ok) => {
    for (let i = 0; i < 50; i++) {
      const [x, y] = sample(arr, 2, rng);
      if (ok(x, y)) return [x, y];
    }
    return sample(arr, 2, rng);
  };
  if (mode === "event") {
    const [a, b] = two(EVENTS, (x, y) => x.y !== y.y);
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

function dailyItems(key) {
  const rng = seededRng(hashString(`daily-${key}`));
  const easy = QUESTIONS.filter((q) => !q.hard), hard = QUESTIONS.filter((q) => q.hard);
  const items = [
    questionRound(sample(easy, 1, rng)[0], rng),
    tfItem(rng),
    matchItem(rng),
    quoteRound(pickQuote(rng), rng),
    versusItem(rng),
    yearRound(sample(EVENTS, 1, rng)[0], rng),
    figureRound(sample(FIGURES, 1, rng)[0], rng),
    tfItem(rng),
    matchItem(rng),
    questionRound(sample(hard, 1, rng)[0], rng),
  ];
  return shuffle(items, rng);
}

const DAILY_PENALTY = 10000; // +10 s per error

// Resultat del repte d'avui (o null). Accepta el format antic, que era només una puntuació.
function dailyResult(key = todayKey()) {
  const r = Progress.data.daily.scores[key];
  return r && typeof r === "object" ? r : null;
}

function dailyShareText(key, r) {
  return `Política en Joc · Repte #${dailyNumber(key)}\n⏱ ${fmtTime(r.ms)} · ${r.hits}/10\n${r.grid}\n${location.origin}${location.pathname}`;
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
  desc: "10 dinàmiques dels minijocs, iguals per a tothom i noves cada dia. No hi ha límit de temps: el cronòmetre corre i guanya qui ho resol més ràpid. Cada error suma 10 segons.",
  rules: ["10 reptes", "Cronòmetre en marxa", "Error: +10 s", "Només compta el primer intent"],
  status() {
    const r = dailyResult();
    return r ? `<span class="gc-status done">Fet · ${fmtTime(r.ms)}</span>` : `<span class="gc-status new">Nou repte</span>`;
  },
  introExtra() {
    const r = dailyResult();
    const d = Progress.data.daily;
    return `<div class="daily-box">
      <div><small>Repte</small><strong>#${dailyNumber()}</strong></div>
      <div><small>Avui</small><strong>${r ? fmtTime(r.ms) : "—"}</strong></div>
      <div><small>Ratxa</small><strong>${d.streak} ${d.streak === 1 ? "dia" : "dies"}</strong></div>
    </div>${r ? `<p class="intro-note">Ja has fet el repte d'avui. Pots tornar a jugar, però no comptarà per al rànquing.</p>` : ""}`;
  },
  start(ctx) {
    const key = todayKey();
    const items = dailyItems(key);
    const N = items.length;
    let i = 0, errors = 0, hits = 0, penalty = 0, t0 = 0, ended = false;
    const results = [], recap = [];
    const elapsed = () => performance.now() - t0 + penalty;

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
      const box = choiceBox(ctx, card, { options: it.options, correctIndex: it.correctIndex, columns: it.binary ? 2 : (it.columns || 1) });
      if (it.binary) $(".choices", card).classList.add("binary");
      box.promise.then(({ correct }) => {
        if (ended) return;
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
        ctx.after(correct ? 380 : 1300, render);
      });
    }

    function end() {
      if (ended) return;
      ended = true;
      const ms = Math.round(elapsed());
      const grid = results.map((ok) => (ok ? "🟩" : "🟥")).join("");
      const d = Progress.data.daily;
      const first = !dailyResult(key);
      let xp = 0;
      if (first) {
        d.streak = d.last === dateKeyOffset(-1) ? d.streak + 1 : d.last === key ? d.streak : 1;
        d.last = key;
        d.scores[key] = { ms, hits, errors, grid };
        Progress.save();
        if (d.streak >= 3) ctx.achieve("diari3");
        xp = 40 + hits * 10 + Math.max(0, 90 - Math.round(ms / 1000));
        Progress.record("diari", hits, xp);
        window.Online?.submitDaily?.(key, { ms, hits, errors });
      }
      ctx.finish({
        score: hits, noRecord: true, xp,
        display: fmtTime(ms),
        ratio: hits / N,
        unit: `${hits}/${N} encerts · ${errors} ${errors === 1 ? "error" : "errors"} (+${errors * 10} s)`,
        verdict: !first ? "Repte repetit: no compta per al rànquing. Torna demà!"
          : errors === 0 ? "Ple perfecte. A veure qui et supera avui." : hits >= 7 ? "Molt bon temps. Comparteix-lo i repta els teus amics." : "Demà més! El rellotge no perdona.",
        extraHtml: `<div class="daily-share">
            <div class="share-grid">${grid}</div>
            <button class="btn primary" data-share-daily>Comparteix el resultat</button>
            <a class="btn" href="#ranking">Veure el rànquing</a>
          </div>
          <div id="daily-rank"></div>`,
        onShown(body) {
          $("[data-share-daily]", body)?.addEventListener("click", () => shareDaily(key));
          if (window.Online?.renderDailyMini) window.Online.renderDailyMini($("#daily-rank", body), key);
        },
        recap,
      });
    }
  },
});
