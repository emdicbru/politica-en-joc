// Els minijocs. Cada joc es registra amb registerGame() i rep un `ctx` (vegeu core.js).

const icon = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Llei d'Hondt (compartida amb el simulador) ----------
function dhondt(votes, seats) {
  const qs = [];
  votes.forEach((v, pi) => { for (let d = 1; d <= seats; d++) qs.push({ pi, d, q: v / d }); });
  // En cas d'empat guanya la candidatura amb més vots totals (art. 163.1 LOREG)
  qs.sort((a, b) => b.q - a.q || votes[b.pi] - votes[a.pi]);
  const winners = qs.slice(0, seats);
  const won = votes.map(() => 0);
  winners.forEach((w) => won[w.pi]++);
  return { won, winners, next: qs[seats] };
}

function quotientTable(names, votes, seats, winners) {
  const rank = new Map(winners.map((w, i) => [`${w.pi}-${w.d}`, i + 1]));
  const cols = Math.min(seats, 12);
  const head = `<tr><th>Candidatura</th>${Array.from({ length: cols }, (_, i) => `<th>÷${i + 1}</th>`).join("")}</tr>`;
  const rows = names.map((n, pi) => `<tr><td>${esc(n)}</td>${Array.from({ length: cols }, (_, i) => {
    const r = rank.get(`${pi}-${i + 1}`);
    return `<td class="${r ? "win" : ""}">${fmt(votes[pi] / (i + 1))}${r ? `<span class="rank">#${r}</span>` : ""}</td>`;
  }).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table class="q-table">${head}${rows}</table></div>`;
}

// ---------- Geometria de l'hemicicle ----------
function hemicycleSeats(total, rows = 12, r0 = 0.36) {
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((1 - r0) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sumR));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  for (let k = rows - 1; diff !== 0; k = (k - 1 + rows) % rows) {
    counts[k] += Math.sign(diff);
    diff -= Math.sign(diff);
  }
  const seats = [];
  radii.forEach((r, i) => {
    const n = counts[i];
    for (let j = 0; j < n; j++) {
      const a = Math.PI * (1 - j / (n - 1));
      seats.push({ x: Math.cos(a) * r, y: -Math.sin(a) * r, a, r });
    }
  });
  return seats.sort((p, q) => q.a - p.a || p.r - q.r);
}

function hemicycleSVG(parties) {
  const seats = hemicycleSeats(parties.reduce((s, p) => s + p.seats, 0));
  let k = 0;
  const circles = parties.flatMap((p) => Array.from({ length: p.seats }, () => {
    const s = seats[k++];
    return `<circle cx="${s.x.toFixed(4)}" cy="${s.y.toFixed(4)}" r="0.025" fill="${p.color}" data-p="${p.id}"/>`;
  }));
  return `<svg class="hemicycle" viewBox="-1.04 -1.04 2.08 1.08" role="img" aria-label="Hemicicle del Congrés">${circles.join("")}</svg>`;
}

// ---------- Executor de rondes tipus test (amb temps, ratxa i comodins) ----------
async function runChoiceRounds(ctx, rounds, { timer = 20, lifelines = true, onFinish, onAnswer, extraHud = [], points } = {}) {
  const n = rounds.length;
  let score = 0, streak = 0, hits = 0;
  const results = [], recap = [];
  const used = { half: false, poll: false };
  ctx.hud([["q", "Pregunta", `1/${n}`], ["pts", "Punts", "0"], ...(extraHud.length ? [] : [["x", "Ratxa", "0"]]), ...extraHud]);

  for (let i = 0; i < n; i++) {
    if (!ctx.alive()) return;
    const r = rounds[i];
    ctx.setHud("q", `${i + 1}/${n}`);
    ctx.body.innerHTML = "";
    const card = h(`<div class="card qcard">
      ${progressDots(n, results, i)}
      <div class="q-head"><div class="q-label">${r.label}</div></div>
      ${r.prompt}
      ${lifelines ? `<div class="lifelines">
        <button class="lifeline" data-l="half" ${used.half ? "disabled" : ""}>50:50</button>
        <button class="lifeline" data-l="poll" ${used.poll ? "disabled" : ""}>Enquesta</button>
      </div>` : ""}
    </div>`);
    ctx.body.appendChild(card);
    const box = choiceBox(ctx, card, { options: r.options, correctIndex: r.correctIndex, columns: r.columns || 1 });
    const t = timer ? questionTimer(ctx, $(".q-head", card), timer, () => box.timeout()) : null;
    $$(".lifeline", card).forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.l;
      if (box.done || used[k]) return;
      used[k] = true;
      b.disabled = true;
      b.classList.add("spent");
      Sfx.play("pick");
      k === "half" ? box.eliminate(2) : box.poll();
    }));

    const { correct, timeout } = await box.promise;
    t?.stop();
    $$(".lifeline", card).forEach((b) => { b.disabled = true; });
    results[i] = correct;
    if (correct) {
      hits++;
      streak++;
      const left = t ? Math.max(0, t.left) : timer / 2;
      const pts = points ? points(left, timer, streak) : Math.round((60 + Math.round((40 * left) / timer)) * (1 + 0.1 * Math.min(streak - 1, 5)));
      score += pts;
      ctx.setHud("pts", fmt(score), { bump: true });
      floatPoints(card, `+${pts}`);
      if (streak >= 3) Sfx.play("combo");
    } else {
      streak = 0;
      recap.push({ q: r.recapQ, a: r.recapA });
    }
    ctx.setHud("x", streak, { bump: correct && streak >= 3 });
    onAnswer?.({ index: i, correct, score, hits, total: n });
    explain(card, correct, r.explain, timeout ? "Temps esgotat." : undefined);
    if (r.link) card.lastElementChild.insertAdjacentHTML("beforeend", `<a class="src-link" href="${esc(r.link)}" target="_blank" rel="noopener">Font ↗</a>`);
    await nextButton(card, i + 1 < n ? "Següent" : "Veure el resultat");
  }
  if (lifelines && !used.half && !used.poll && hits >= 8) ctx.achieve("comodins");
  const res = { score, xp: hits * 12 + Math.round(score / 60), ratio: hits / n, unit: `punts · ${hits}/${n} encerts`, recap };
  onFinish ? onFinish(res) : ctx.finish(res);
}

const fitsTwoCols = (options) => options.every((o) => o.length <= 38);

// Constructors de rondes reutilitzables
function questionRound(q, rng) {
  const { options, correctIndex } = prepOptions(q.opts, rng);
  return {
    label: `${CATEGORIES[q.cat]}${q.hard ? " · expert" : ""}`,
    prompt: `<div class="q-text">${esc(q.q)}</div>`,
    options, correctIndex, columns: fitsTwoCols(options) ? 2 : 1,
    explain: q.exp, recapQ: q.q, recapA: q.opts[0],
  };
}
function acronymRound(a, rng) {
  const { options, correctIndex } = prepOptions([a.a, ...a.f], rng);
  return {
    label: "Què volen dir aquestes sigles?",
    prompt: `<div class="q-big">${esc(a.s)}</div>`,
    options, correctIndex,
    explain: `${a.s}: ${a.a}.`, recapQ: a.s, recapA: a.a,
  };
}
function articleRound(art, reverse, rng = Math.random) {
  const others = shuffle(ARTICLES.filter((x) => x !== art), rng).sort((x, y) => Math.abs(x.n - art.n) - Math.abs(y.n - art.n));
  const distract = [...others.slice(0, 2), ...sample(others.slice(2), 1, rng)];
  const { options, correctIndex } = prepOptions(
    reverse ? [art, ...distract].map((a) => a.t) : [art, ...distract].map((a) => `Article ${a.n}`), rng);
  return {
    label: reverse ? "Què regula aquest article?" : "Quin article ho estableix?",
    prompt: reverse ? `<div class="q-big">Art. ${art.n}</div>` : `<div class="q-text">${esc(art.t)}</div>`,
    options, correctIndex, columns: reverse ? 1 : 2,
    explain: `Article ${art.n}: ${art.t}.`, recapQ: art.t, recapA: `Article ${art.n}`,
  };
}
// Frases: triem primer l'autor (perquè els més citats no ho acaparin) i els distractors són del mateix partit
function pickQuote(rng = Math.random) {
  const a = QUOTE_AUTHORS[Math.floor(rng() * QUOTE_AUTHORS.length)];
  const list = QUOTES.filter((q) => q.a === a);
  return list[Math.floor(rng() * list.length)];
}
const partyKey = (p) => (p || "").split(/[ (/]/)[0].toUpperCase();
function quoteRound(q, rng = Math.random) {
  const same = QUOTE_AUTHORS.filter((a) => a !== q.a && QUOTES.some((x) => x.a === a && partyKey(x.p) === partyKey(q.p)));
  const near = shuffle(same, rng).slice(0, 2);
  const rest = sample(QUOTE_AUTHORS.filter((a) => a !== q.a && !near.includes(a)), 3 - near.length, rng);
  const { options, correctIndex } = prepOptions([q.a, ...near, ...rest], rng);
  return {
    label: "Qui ho va dir?",
    prompt: `<blockquote class="q-quote">${esc(q.q)}</blockquote>`,
    options, correctIndex, columns: 2,
    explain: `${q.a} (${q.p}${q.y ? ", " + q.y : ""}). ${q.c}`, link: q.src,
    recapQ: q.q, recapA: q.a,
  };
}
function yearRound(ev, rng) {
  const deltas = sample([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6], 3, rng);
  const { options, correctIndex } = prepOptions([ev.y, ...deltas.map((d) => ev.y + d)].map(String), rng);
  return {
    label: "En quin any?",
    prompt: `<div class="q-text">${esc(ev.t)}</div>`,
    options, correctIndex, columns: 2,
    explain: ev.d, recapQ: ev.t, recapA: String(ev.y),
  };
}
function figureRound(f, rng) {
  const others = sample(FIGURES.filter((x) => x !== f), 3, rng);
  const { options, correctIndex } = prepOptions([f, ...others].map((x) => x.name), rng);
  return {
    label: "Qui és?",
    prompt: `<div class="clues compact">${f.clues.slice(1, 3).map((c, i) => `<div class="clue shown"><b>${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>`,
    options, correctIndex, columns: 2,
    explain: `${f.name} (${f.role}).`, recapQ: f.clues[2], recapA: f.name,
  };
}

// Rondes d'un duel: mateixa llavor → mateixes preguntes i mateix ordre d'opcions per als dos jugadors.
function duelRounds(seed) {
  const rng = seededRng(seed);
  const easy = QUESTIONS.filter((q) => !q.hard), hard = QUESTIONS.filter((q) => q.hard);
  const qs = sample(easy, 3, rng);
  return shuffle([
    ...qs.map((q) => questionRound(q, rng)),
    questionRound(sample(hard, 1, rng)[0], rng),
    yearRound(sample(EVENTS, 1, rng)[0], rng),
    acronymRound(sample(ACRONYMS, 1, rng)[0], rng),
    articleRound(sample(ARTICLES, 1, rng)[0], rng() < 0.5, rng),
    quoteRound(pickQuote(rng), rng),
    figureRound(sample(FIGURES, 1, rng)[0], rng),
    yearRound(sample(EVENTS, 1, rng)[0], rng),
  ], rng);
}

// 10 parelles de preguntes per al duel d'elecció (5 per a l'amfitrió, 5 per al convidat):
// de cada parella n'esculls una per a tu i l'altra s'envia al rival.
function duelPairs(seed) {
  const rng = seededRng(seed);
  const easy = sample(QUESTIONS.filter((q) => !q.hard), 6, rng).map((q) => ({
    ...questionRound(q, rng),
    catBadge: CATEGORIES[q.cat],
    preview: q.q,
  }));
  const hard = sample(QUESTIONS.filter((q) => q.hard), 2, rng).map((q) => ({
    ...questionRound(q, rng),
    catBadge: `${CATEGORIES[q.cat]} · Expert`,
    preview: q.q,
  }));
  const years = sample(EVENTS, 3, rng).map((ev) => ({
    ...yearRound(ev, rng),
    catBadge: "En quin any?",
    preview: ev.t,
  }));
  const acronyms = sample(ACRONYMS, 3, rng).map((ac) => ({
    ...acronymRound(ac, rng),
    catBadge: "Sigles",
    preview: `Què volen dir les sigles «${ac.s}»?`,
  }));
  const articles = sample(ARTICLES, 2, rng).map((art) => {
    const rev = rng() < 0.5;
    return {
      ...articleRound(art, rev, rng),
      catBadge: "Constitució",
      preview: rev ? `Què regula l'Article ${art.n} de la Constitució?` : `Quin article estableix: «${art.t}»?`,
    };
  });
  const quotes = [];
  while (quotes.length < 2) {
    const qu = pickQuote(rng);
    if (!quotes.includes(qu)) quotes.push(qu);
  }
  const quoteItems = quotes.map((qu) => ({
    ...quoteRound(qu, rng),
    catBadge: "Qui ho va dir?",
    preview: `«${qu.q}»`,
  }));
  const figures = sample(FIGURES, 2, rng).map((f) => ({
    ...figureRound(f, rng),
    catBadge: "Qui és?",
    preview: `${f.clues[1]} ${f.clues[2]}`,
  }));
  const pool = shuffle([...easy, ...hard, ...years, ...acronyms, ...articles, ...quoteItems, ...figures], rng);
  return Array.from({ length: 10 }, (_, i) => [pool[i * 2], pool[i * 2 + 1]]);
}

// =========================================================
// 1. CONTRARELLOTGE
// =========================================================
registerGame({
  id: "contrarellotge",
  cat: "rapid",
  tagline: "60 segons, ratxes que multipliquen i cap pietat.",
  featured: true,
  kicker: "Mode estrella",
  title: "Contrarellotge",
  color: "#ff4b2b",
  level: 2,
  meta: "60 segons",
  icon: icon(`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6M19 6l1.5-1.5"/>`),
  desc: "60 segons per encadenar tantes respostes correctes com puguis. Les ratxes multipliquen els punts, cada error et resta 5 segons i la dificultat va pujant.",
  rules: ["60 segons", "Ratxa de 3: ×2, ×3, ×4", "Error: −5 s", "Tecles A–D"],
  start(ctx) {
    const easy = shuffle(QUESTIONS.filter((q) => !q.hard));
    const hard = shuffle(QUESTIONS.filter((q) => q.hard));
    const queue = easy.splice(0, 4);
    while (easy.length || hard.length) {
      if (hard.length) queue.push(hard.shift());
      if (easy.length) queue.push(easy.shift());
    }

    const TOTAL = 600; // dècimes de segon
    let time = TOTAL, score = 0, streak = 0, best = 0, hits = 0, answered = 0, idx = 0, ended = false;
    const recap = [];
    const mult = () => Math.min(4, 1 + Math.floor(streak / 3));

    ctx.hud([["t", "Temps", "60"], ["pts", "Punts", "0"], ["x", "Multiplicador", "×1"]]);
    ctx.countIn(() => { render(); ctx.every(100, tick); });

    function tick() {
      time--;
      if (time <= 50 && time > 0 && time % 10 === 0) Sfx.play("tick");
      updateTime();
      if (time <= 0) end();
    }
    function updateTime() {
      ctx.setHud("t", Math.max(0, Math.ceil(time / 10)), { warn: time <= 100 });
      const bar = $(".timebar", ctx.body);
      if (bar) {
        bar.firstElementChild.style.width = `${Math.max(0, (time / TOTAL) * 100)}%`;
        bar.classList.toggle("low", time <= 100);
      }
    }
    function end() {
      if (ended) return;
      ended = true;
      const rate = answered ? Math.round((hits / answered) * 100) : 0;
      ctx.finish({
        score,
        xp: hits * 10,
        unit: `punts · ${hits} encerts de ${answered} (${rate} %) · millor ratxa ${best}`,
        verdict:
          hits >= 18 ? "Velocitat de portaveu en un debat a cinc." :
          hits >= 12 ? "Molt ràpid i molt precís." :
          hits >= 7 ? "Bon ritme. Ara cal mantenir la ratxa." :
          "Les preses no són bones conselleres. Torna-ho a provar!",
        recap: recap.slice(0, 10),
      });
    }
    function render() {
      if (ended) return;
      if (idx >= queue.length) queue.push(...shuffle(QUESTIONS));
      const q = queue[idx++];
      const { options, correctIndex } = prepOptions(q.opts);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard ${streak >= 3 ? "on-fire" : ""}">
        <div class="timebar ${time <= 100 ? "low" : ""}"><div style="width:${(time / TOTAL) * 100}%"></div></div>
        <div class="q-head"><div class="q-label">${CATEGORIES[q.cat]}${q.hard ? " · expert" : ""}</div>${streak >= 3 ? `<span class="streak-chip">Ratxa ${streak}</span>` : ""}</div>
        <div class="q-text"></div>
      </div>`);
      $(".q-text", card).textContent = q.q;
      ctx.body.appendChild(card);
      askChoice(ctx, card, { options, correctIndex, columns: fitsTwoCols(options) ? 2 : 1 }).then(({ correct }) => {
        if (ended) return;
        answered++;
        if (correct) {
          const pts = 100 * mult();
          score += pts;
          streak++;
          best = Math.max(best, streak);
          hits++;
          if (streak === 10) ctx.achieve("ratxa10");
          if (streak % 3 === 0) Sfx.play("combo");
          floatPoints(card, `+${pts}`);
          ctx.setHud("pts", fmt(score), { bump: true });
          ctx.after(420, render);
        } else {
          streak = 0;
          time -= 50;
          floatPoints(card, "−5 s", true);
          recap.push({ q: q.q, a: q.opts[0] });
          updateTime();
          if (time <= 0) return end();
          ctx.after(1300, render);
        }
        ctx.setHud("x", `×${mult()}`, { bump: correct && streak % 3 === 0 });
      });
    }
  },
});

// =========================================================
// 3. FES MAJORIA
// =========================================================
registerGame({
  id: "majoria",
  cat: "parlament",
  tagline: "Arriba a 176 amb els escons reals del Congrés.",
  kicker: "Aritmètica parlamentària",
  title: "Fes majoria",
  color: "#17173d",
  level: 3,
  meta: "7 missions",
  icon: icon(`<path d="M3 19a9 9 0 0118 0M7 19a5 5 0 0110 0"/><circle cx="12" cy="19" r="1"/>`),
  desc: "Dos congressos reals, el del 2019 i el del 2023. Reconstrueix investidures, troba les abstencions decisives i resol trencaclosques de pactes escó a escó.",
  rules: ["2 legislatures", "7 missions", "2 intents per missió", "Majoria: 176"],
  start(ctx) {
    let m = 0, score = 0, firstTry = 0;
    const results = [];
    const N = MAJORITY_MISSIONS.length;
    ctx.hud([["m", "Missió", `1/${N}`], ["pts", "Punts", "0"]]);
    run();

    function run() {
      if (m >= N) {
        if (firstTry === N) ctx.achieve("majoria");
        return ctx.finish({ score, max: N * 100, xp: Math.round(score / 6) });
      }
      const mission = MAJORITY_MISSIONS[m];
      const congress = CONGRESS[mission.congress];
      const parties = congress.parties;
      const sel = new Set();
      let attempts = 0, locked = false;
      ctx.setHud("m", `${m + 1}/${N}`);
      ctx.body.innerHTML = "";
      const wrap = h(`<div class="majority">
        <div class="mission">
          <div class="mission-top"><small>Missió ${m + 1} de ${N}</small><span class="mission-tag">${congress.label}</span></div>
          <h3>${mission.title}</h3>
          <p>${mission.text}</p>
        </div>
        <div class="card qcard">
          ${progressDots(N, results, m)}
          <div class="hemi-wrap">
            ${hemicycleSVG(parties)}
            <div class="hemi-center"><strong data-sum>0</strong><small>escons de 176</small></div>
          </div>
          <div class="seat-meter"><div class="fill" style="width:0"></div><span class="mark"></span></div>
          <div class="party-chips">${parties.map((p) =>
            `<button class="party-chip" data-id="${p.id}" style="--pc:${p.color}"><i></i>${p.name} <span>${p.seats}</span></button>`).join("")}</div>
          <div class="row">
            <button class="btn ghost" data-clear>Neteja</button>
            <button class="btn ghost" data-impossible>És impossible</button>
            <button class="btn primary" data-check style="margin-left:auto">Comprova</button>
          </div>
          <div data-fb></div>
        </div>
      </div>`);
      ctx.body.appendChild(wrap);
      const fb = $("[data-fb]", wrap);
      const card = $(".card", wrap);

      function update() {
        const sum = parties.filter((p) => sel.has(p.id)).reduce((s, p) => s + p.seats, 0);
        $$("circle", wrap).forEach((c) => { c.style.opacity = sel.has(c.dataset.p) ? 1 : 0.16; });
        $$(".party-chip", wrap).forEach((c) => c.classList.toggle("on", sel.has(c.dataset.id)));
        $("[data-sum]", wrap).textContent = sum;
        $(".hemi-center", wrap).classList.toggle("win", sum >= 176);
        const fill = $(".seat-meter .fill", wrap);
        fill.style.width = `${(sum / 350) * 100}%`;
        fill.classList.toggle("win", sum >= 176);
        return sum;
      }
      update();

      $$(".party-chip", wrap).forEach((c) => c.addEventListener("click", () => {
        if (locked) return;
        const id = c.dataset.id;
        sel.has(id) ? sel.delete(id) : sel.add(id);
        Sfx.play("pick");
        update();
      }));
      $("[data-clear]", wrap).addEventListener("click", () => { if (!locked) { sel.clear(); update(); } });
      $("[data-check]", wrap).addEventListener("click", () => check("submit"));
      $("[data-impossible]", wrap).addEventListener("click", () => check("impossible"));

      function check(kind) {
        if (locked) return;
        const sum = update();
        let ok;
        if (mission.type === "impossible") ok = kind === "impossible";
        else if (kind === "impossible") ok = false;
        else if (mission.type === "set") ok = sel.size === mission.answer.length && mission.answer.every((id) => sel.has(id));
        else ok = sum >= 176 && sel.size === mission.min;

        attempts++;
        fb.innerHTML = "";
        if (ok) {
          locked = true;
          const pts = attempts === 1 ? 100 : 50;
          if (attempts === 1) firstTry++;
          score += pts;
          results[m] = true;
          ctx.setHud("pts", fmt(score), { bump: true });
          floatPoints(card, `+${pts}`);
          Sfx.play("ok");
          explain(fb, true, mission.exp, attempts === 1 ? "A la primera!" : "Correcte!");
          return finishMission();
        }
        Sfx.play("ko");
        if (attempts < 2) {
          let hint;
          if (kind === "impossible") hint = "Sí que és possible. Torna-hi.";
          else if (mission.type === "set") {
            const target = parties.filter((p) => mission.answer.includes(p.id)).reduce((s, p) => s + p.seats, 0);
            hint = `Pista: hi havia ${target} vots. Tu en tens ${sum} amb ${sel.size} partits; ells eren ${mission.answer.length}.`;
          } else if (mission.type === "min") hint = sum < 176 ? "No arribes a 176. Pensa en coalicions grans." : `Hi arribes, però amb ${sel.size} partits. Se'n pot fer amb menys.`;
          else hint = "Abans de buscar combinacions, calcula el màxim possible amb els partits permesos.";
          explain(fb, false, hint, "Encara no. Et queda un intent.");
          return;
        }
        locked = true;
        results[m] = false;
        sel.clear();
        if (mission.type === "set") mission.answer.forEach((id) => sel.add(id));
        else if (mission.type === "min") mission.solution.forEach((id) => sel.add(id));
        else {
          const forbidden = mission.forbidden || ["psoe", "pp"];
          parties.filter((p) => !forbidden.includes(p.id)).forEach((p) => sel.add(p.id));
        }
        update();
        explain(fb, false, mission.exp, "Solució:");
        finishMission();
      }

      function finishMission() {
        $$(".party-chip, [data-clear], [data-impossible], [data-check]", wrap).forEach((b) => { b.disabled = true; });
        nextButton(fb, m + 1 < N ? "Missió següent" : "Veure el resultat").then(() => { m++; run(); });
      }
    }
  },
});

// =========================================================
// 4. QUI ÉS QUI
// =========================================================
const initials = (name) => name.split(/\s+/).filter((w) => /^[A-ZÀ-Ú]/.test(w)).slice(0, 2).map((w) => w[0]).join("");

registerGame({
  id: "quiesqui",
  cat: "historia",
  tagline: "Endevina el personatge amb el mínim de pistes.",
  kicker: "Pistes progressives",
  title: "Qui és qui?",
  color: "#7b3fe4",
  level: 2,
  meta: "8 personatges",
  icon: icon(`<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>`),
  desc: "Presidents, reis, líders i figures històriques. Endevina qui és amb el mínim de pistes entre vuit candidats. Cada pista o error et costa punts.",
  rules: ["8 rondes", "25 personatges", "100 · 70 · 40 · 20 punts", "Error = una pista més"],
  start(ctx) {
    const PTS = [100, 70, 40, 20];
    const rounds = sample(FIGURES, 8);
    let r = 0, score = 0;
    const results = [], recap = [];
    ctx.hud([["r", "Ronda", `1/${rounds.length}`], ["pts", "Punts", "0"]]);
    next();

    function next() {
      if (r >= rounds.length) return ctx.finish({ score, max: rounds.length * 100, xp: Math.round(score / 9), recap });
      const target = rounds[r];
      const candidates = shuffle([target, ...sample(FIGURES.filter((f) => f !== target), 7)]);
      let shown = 1, done = false;
      ctx.setHud("r", `${r + 1}/${rounds.length}`);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard">
        ${progressDots(rounds.length, results, r)}
        <div class="q-head"><div class="q-label">Qui és qui?</div></div>
        <div class="q-text">Qui és aquest personatge?</div>
        <div class="clues"></div>
        <p class="clue-pts"></p>
        <div class="people">${candidates.map((p) => `
          <button class="person" data-id="${p.id}">
            <span class="av" style="background:${p.color}">${initials(p.name)}</span>
            <span>${p.name}<small>${p.role}</small></span>
          </button>`).join("")}</div>
        <div class="row"><button class="btn ghost" data-more>Una altra pista</button></div>
        <div data-fb></div>
      </div>`);
      ctx.body.appendChild(card);
      const fb = $("[data-fb]", card);

      function renderClues() {
        $(".clues", card).innerHTML = target.clues.map((c, i) =>
          i < shown ? `<div class="clue shown"><b>${i + 1}</b><span>${esc(c)}</span></div>`
                    : `<div class="clue"><b>${i + 1}</b><span>Pista bloquejada</span></div>`).join("");
        $(".clue-pts", card).innerHTML = done ? "" : `Si l'encertes ara, guanyes <b>${PTS[shown - 1]}</b> punts`;
        $("[data-more]", card).disabled = done || shown >= 4;
      }
      renderClues();

      $("[data-more]", card).addEventListener("click", () => { if (!done && shown < 4) { shown++; Sfx.play("pick"); renderClues(); } });
      $$(".person", card).forEach((b) => b.addEventListener("click", () => guess(b)));

      function guess(btn) {
        if (done) return;
        if (btn.dataset.id === target.id) {
          const pts = PTS[shown - 1];
          score += pts;
          results[r] = true;
          if (shown === 1) ctx.achieve("detectiu");
          ctx.setHud("pts", fmt(score), { bump: true });
          floatPoints(card, `+${pts}`);
          Sfx.play("ok");
          btn.classList.add("correct");
          return close(true, `${target.name}: ${target.role} (${target.tag}).`, `Correcte amb ${shown} ${shown === 1 ? "pista" : "pistes"}!`);
        }
        Sfx.play("ko");
        btn.classList.add("wrong");
        btn.disabled = true;
        if (shown < 4) { shown++; renderClues(); return; }
        results[r] = false;
        recap.push({ q: target.clues[0], a: target.name });
        $(`.person[data-id="${target.id}"]`, card).classList.add("correct");
        close(false, `Era ${target.name}: ${target.role} (${target.tag}).`, "Se t'han acabat les pistes.");
      }

      function close(ok, text, prefix) {
        done = true;
        shown = 4;
        renderClues();
        $$(".person", card).forEach((b) => { b.disabled = true; });
        explain(fb, ok, text, prefix);
        nextButton(fb, r + 1 < rounds.length ? "Següent" : "Veure el resultat").then(() => { r++; next(); });
      }
    }
  },
});

// =========================================================
// 5. VERIFICADOR (fet o fals)
// =========================================================
function makeStatement(rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const t = rng() < 0.5;
  const gens = [
    () => {
      const p = pick(PROVINCES);
      let n = p.seats;
      if (!t) { n = p.seats + pick([-2, -1, 1, 2, 3]); if (n < 1) n = p.seats + 1; }
      return { text: `${p.name} elegeix ${n} ${n === 1 ? "diputat" : "diputats"} el 29N.`, truth: n === p.seats, exp: `${p.name} n'elegeix ${p.seats}.` };
    },
    () => {
      const e = pick(EVENTS);
      const y = t ? e.y : e.y + pick([-5, -3, -2, -1, 1, 2, 3, 5]);
      return { text: `${e.t}: l'any ${y}.`, truth: y === e.y, exp: `Va ser el ${e.y}. ${e.d}` };
    },
    () => {
      const a = pick(ARTICLES);
      const other = pick(ARTICLES.filter((x) => x !== a));
      return { text: `L'article ${a.n} de la Constitució tracta sobre: «${(t ? a : other).t}».`, truth: t, exp: `L'article ${a.n} tracta sobre: «${a.t}».` };
    },
    () => {
      const p = pick(CONGRESS[2023].parties);
      let n = p.seats;
      if (!t) { n = p.seats + pick([-6, -3, -2, -1, 1, 2, 4, 7]); if (n < 1) n = p.seats + 2; }
      return { text: `${p.name} va obtenir ${n} ${n === 1 ? "escó" : "escons"} al Congrés el 23-J.`, truth: n === p.seats, exp: `${p.name} en va obtenir ${p.seats}.` };
    },
    () => {
      const a = pick(ACRONYMS);
      return { text: `${a.s} vol dir «${t ? a.a : pick(a.f)}».`, truth: t, exp: `${a.s}: ${a.a}.` };
    },
    () => {
      const c = pick(AUTONOMIES);
      const key = rng() < 0.5 ? "parl" : "gov";
      const other = pick(AUTONOMIES.filter((x) => x !== c));
      const what = key === "parl" ? "El parlament" : "El govern";
      return { text: `${what} de ${c.ca} s'anomena «${(t ? c : other)[key]}».`, truth: t, exp: `${what} de ${c.ca} és «${c[key]}».` };
    },
    () => {
      const q = pick(QUOTES);
      const author = t ? q.a : pick(QUOTE_AUTHORS.filter((x) => x !== q.a));
      return { text: `«${q.q}» és una frase de ${author}.`, truth: t, exp: `És de ${q.a}. ${q.c}` };
    },
    () => {
      const f = pick(FIGURES);
      const other = pick(FIGURES.filter((x) => x !== f && x.id !== f.id));
      const clue = t ? f.clues[3] : other.clues[3];
      return { text: `Sobre ${f.name}: «${clue}»`, truth: t, exp: t ? `Cert: ${f.clues[3]}` : `Fals. Això correspon a ${other.name}.` };
    },
    () => {
      const q = pick(QUESTIONS);
      const ans = t ? q.opts[0] : pick(q.opts.slice(1));
      return { text: `${q.q} → ${ans}`, truth: t, exp: q.exp };
    },
  ];
  return pick(gens)();
}

registerGame({
  id: "verificador",
  cat: "rapid",
  tagline: "Cert o fake? Arrossega i decideix en un segon.",
  kicker: "Fact-checking exprés",
  title: "Verificador",
  color: "#00a37a",
  level: 2,
  meta: "45 segons",
  icon: icon(`<path d="M9 12l2 2 4-4"/><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>`),
  desc: "Arriben afirmacions a tota velocitat: escons, anys, articles, sigles i frases. Arrossega la targeta o fes servir les fletxes. És cert o és una fake?",
  rules: ["45 segons", "← Fals · Cert →", "Error: −3 s", "Ratxes ×2, ×3, ×4"],
  start(ctx) {
    const TOTAL = 450;
    let time = TOTAL, score = 0, streak = 0, hits = 0, answered = 0, ended = false, busy = false, current;
    const recap = [];
    const mult = () => Math.min(4, 1 + Math.floor(streak / 4));
    ctx.hud([["t", "Temps", "45"], ["pts", "Punts", "0"], ["x", "Multiplicador", "×1"]]);

    ctx.countIn(() => {
      ctx.body.innerHTML = "";
      ctx.body.appendChild(h(`<div class="verif">
        <div class="timebar"><div style="width:100%"></div></div>
        <div class="swipe-zone">
          <div class="swipe-hint left">FALS</div>
          <div class="swipe-hint right">CERT</div>
          <div class="swipe-deck"></div>
        </div>
        <div class="verif-actions">
          <button class="btn verdict-btn no" data-v="0">← Fals</button>
          <button class="btn verdict-btn yes" data-v="1">Cert →</button>
        </div>
        <div class="verif-log" aria-live="polite"></div>
      </div>`));
      $$("[data-v]", ctx.body).forEach((b) => b.addEventListener("click", () => decide(b.dataset.v === "1")));
      ctx.onKey((e) => {
        if (e.key === "ArrowLeft") decide(false);
        else if (e.key === "ArrowRight") decide(true);
      });
      deal();
      ctx.every(100, tick);
    });

    function tick() {
      time--;
      if (time <= 50 && time > 0 && time % 10 === 0) Sfx.play("tick");
      ctx.setHud("t", Math.max(0, Math.ceil(time / 10)), { warn: time <= 100 });
      const bar = $(".timebar", ctx.body);
      if (bar) { bar.firstElementChild.style.width = `${Math.max(0, (time / TOTAL) * 100)}%`; bar.classList.toggle("low", time <= 100); }
      if (time <= 0) end();
    }

    function deal() {
      current = makeStatement();
      const deck = $(".swipe-deck", ctx.body);
      deck.innerHTML = "";
      const card = h(`<div class="swipe-card"><span class="sc-kicker">Afirmació #${answered + 1}</span><p></p></div>`);
      $("p", card).textContent = current.text;
      deck.appendChild(card);
      enableDrag(card);
      busy = false;
    }

    function enableDrag(card) {
      let x0 = null, dx = 0;
      const zone = $(".swipe-zone", ctx.body);
      card.addEventListener("pointerdown", (e) => { x0 = e.clientX; card.setPointerCapture(e.pointerId); card.classList.add("dragging"); });
      card.addEventListener("pointermove", (e) => {
        if (x0 === null) return;
        dx = e.clientX - x0;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        if (zone) zone.dataset.lean = dx > 40 ? "yes" : dx < -40 ? "no" : "";
      });
      const release = () => {
        if (x0 === null) return;
        x0 = null;
        card.classList.remove("dragging");
        if (zone) zone.dataset.lean = "";
        if (Math.abs(dx) > 90) decide(dx > 0);
        else card.style.transform = "";
        dx = 0;
      };
      card.addEventListener("pointerup", release);
      card.addEventListener("pointercancel", release);
    }

    function decide(said) {
      if (busy || ended || !current) return;
      busy = true;
      answered++;
      const ok = said === current.truth;
      const card = $(".swipe-card", ctx.body);
      card.classList.add(said ? "fly-right" : "fly-left", ok ? "is-ok" : "is-ko");
      if (ok) {
        streak++;
        hits++;
        const pts = 100 * mult();
        score += pts;
        if (hits === 20) ctx.achieve("verificador");
        Sfx.play(streak % 4 === 0 ? "combo" : "ok");
        floatPoints($(".swipe-zone", ctx.body), `+${pts}`);
        ctx.setHud("pts", fmt(score), { bump: true });
      } else {
        streak = 0;
        time -= 30;
        Sfx.play("ko");
        floatPoints($(".swipe-zone", ctx.body), "−3 s", true);
        recap.push({ q: current.text, a: current.truth ? "Era cert" : "Era fals", note: current.exp });
      }
      ctx.setHud("x", `×${mult()}`, { bump: ok && streak % 4 === 0 });
      const log = $(".verif-log", ctx.body);
      log.innerHTML = `<div class="log-item ${ok ? "ok" : "ko"}"><b>${ok ? "Encertat" : "Error"} · ${current.truth ? "CERT" : "FALS"}</b><span></span></div>`;
      $("span", log).textContent = current.exp;
      if (time <= 0) return end();
      ctx.after(ok ? 280 : 700, deal);
    }

    function end() {
      if (ended) return;
      ended = true;
      ctx.finish({
        score, xp: hits * 8,
        unit: `punts · ${hits} encerts de ${answered}`,
        verdict: hits >= 20 ? "Cap fake news se t'escapa." : hits >= 12 ? "Bon olfacte periodístic." : "Compte, que t'han colat unes quantes fakes.",
        recap: recap.slice(0, 8),
      });
    }
  },
});

// =========================================================
// 7. ENDEVINA L'ANY
// =========================================================
registerGame({
  id: "any",
  cat: "historia",
  tagline: "De Cadis al 29N: clava l'any exacte.",
  kicker: "Memòria històrica",
  title: "Endevina l'any",
  color: "#f2b600",
  level: 2,
  meta: "8 esdeveniments",
  icon: icon(`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>`),
  desc: "De la Constitució de Cadis al 29N. Situa cada fet en l'any exacte. Com més a prop, més punts, i encertar-lo de ple té premi.",
  rules: ["8 rondes", "Any exacte: 150 punts", "Els punts baixen per cada any d'error", "Fletxes ← →"],
  start(ctx) {
    const ROUNDS = 8;
    const rounds = sample(EVENTS, ROUNDS);
    let r = 0, score = 0, onKeyRound = null;
    const results = [], recap = [];
    ctx.hud([["r", "Ronda", `1/${ROUNDS}`], ["pts", "Punts", "0"]]);
    ctx.onKey((e) => onKeyRound?.(e));
    next();

    function next() {
      if (r >= ROUNDS) return ctx.finish({ score, max: ROUNDS * 150, xp: Math.round(score / 12), recap });
      const ev = rounds[r];
      const old = ev.y < 1931;
      const MIN = old ? 1800 : 1925, MAX = old ? 1940 : 2026;
      const PEN = old ? 5 : 8;
      let year = Math.round((MIN + MAX) / 2), locked = false;
      const ticks = Array.from({ length: 5 }, (_, i) => Math.round(MIN + ((MAX - MIN) * i) / 4));
      ctx.setHud("r", `${r + 1}/${ROUNDS}`);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard">
        ${progressDots(ROUNDS, results, r)}
        <div class="q-head"><div class="q-label">En quin any va passar? · ${old ? "segles XIX i XX" : "del 1925 ençà"}</div></div>
        <div class="q-text"></div>
        <div class="year-out"><div class="q-big" data-year>${year}</div></div>
        <input type="range" class="year-range" min="${MIN}" max="${MAX}" value="${year}" aria-label="Any">
        <div class="year-scale">${ticks.map((t) => `<span>${t}</span>`).join("")}</div>
        <div class="nudge">
          <button class="btn" data-d="-1" aria-label="Un any menys">−1</button>
          <button class="btn primary" data-ok>Confirma</button>
          <button class="btn" data-d="1" aria-label="Un any més">+1</button>
        </div>
        <div data-fb></div>
      </div>`);
      $(".q-text", card).textContent = ev.t;
      ctx.body.appendChild(card);
      const range = $(".year-range", card);
      const out = $("[data-year]", card);
      const set = (y) => {
        if (locked) return;
        year = Math.min(MAX, Math.max(MIN, y));
        range.value = year;
        out.textContent = year;
      };
      range.addEventListener("input", () => set(Number(range.value)));
      $$("[data-d]", card).forEach((b) => b.addEventListener("click", () => set(year + Number(b.dataset.d))));
      $("[data-ok]", card).addEventListener("click", confirm);
      onKeyRound = (e) => {
        if (locked) return;
        if (e.key === "ArrowLeft" && document.activeElement !== range) { e.preventDefault(); set(year - 1); }
        else if (e.key === "ArrowRight" && document.activeElement !== range) { e.preventDefault(); set(year + 1); }
        else if (e.key === "Enter") { e.preventDefault(); confirm(); }
      };
      range.focus({ preventScroll: true });

      function confirm() {
        if (locked) return;
        locked = true;
        range.disabled = true;
        const diff = Math.abs(year - ev.y);
        const pts = diff === 0 ? 150 : Math.max(0, 100 - diff * PEN);
        score += pts;
        results[r] = diff <= 2;
        if (diff === 0) ctx.achieve("historiador");
        Sfx.play(diff <= 3 ? "ok" : "ko");
        ctx.setHud("pts", fmt(score), { bump: pts > 0 });
        if (pts) floatPoints(card, `+${pts}`);
        if (diff > 3) recap.push({ q: ev.t, a: String(ev.y), note: `vas dir ${year}` });
        $(".nudge", card).remove();
        out.textContent = ev.y;
        out.classList.add(diff === 0 ? "exact" : diff <= 3 ? "near" : "far");
        $(".year-out", card).insertAdjacentHTML("beforeend", `
          <div class="year-reveal">
            <div><small>La teva resposta</small><strong>${year}</strong></div>
            <div><small>Diferència</small><strong>${diff === 0 ? "0" : `${diff} ${diff === 1 ? "any" : "anys"}`}</strong></div>
          </div>`);
        const fb = $("[data-fb]", card);
        explain(fb, diff <= 3, ev.d, diff === 0 ? "Exacte! +150" : diff <= 3 ? "Molt a prop!" : "Lluny.");
        nextButton(fb, r + 1 < ROUNDS ? "Següent" : "Veure el resultat").then(() => { r++; next(); });
      }
    }
  },
});

// =========================================================
// 8. CRONOLOGIA
// =========================================================
registerGame({
  id: "cronologia",
  cat: "historia",
  tagline: "Ordena la història fet a fet.",
  kicker: "Ordena la història",
  title: "Cronologia",
  color: "#7b3fe4",
  level: 3,
  meta: "4 rondes",
  icon: icon(`<path d="M10 6h11M10 12h11M10 18h11"/><path d="M4 5.5l1.5-1V9M3.5 15.5a1.5 1.5 0 113 0c0 1-3 2.5-3 3.5h3"/>`),
  desc: "Fets propers en el temps i un sol ordre correcte. Toca'ls del més antic al més recent. A cada ronda n'hi ha més.",
  rules: ["Rondes de 4, 5, 5 i 6 fets", "Fets d'una mateixa època", "20 punts per posició", "Ordre perfecte: +30"],
  start(ctx) {
    const SIZES = [4, 5, 5, 6];
    const sorted = [...EVENTS].sort((a, b) => a.y - b.y);
    const used = new Set();
    let r = 0, score = 0, perfects = 0;
    const results = [];
    const MAX = SIZES.reduce((s, n) => s + n * 20 + 30, 0);
    ctx.hud([["r", "Ronda", `1/${SIZES.length}`], ["pts", "Punts", "0"]]);
    next();

    function pickSet(size) {
      for (let tries = 0; tries < 80; tries++) {
        const s = rand(0, sorted.length - (size + 3));
        const win = sorted.slice(s, s + size + 3).filter((e) => !used.has(e));
        const set = sample(win, size);
        if (set.length === size && new Set(set.map((e) => e.y)).size === size) {
          set.forEach((e) => used.add(e));
          return set;
        }
      }
      const rest = shuffle(sorted.filter((e) => !used.has(e)));
      const byYear = [...new Map(rest.map((e) => [e.y, e])).values()];
      return byYear.slice(0, size);
    }

    function next() {
      if (r >= SIZES.length) return ctx.finish({ score, max: MAX, xp: Math.round(score / 8), verdict: perfects === SIZES.length ? "Totes les rondes perfectes. Ets una hemeroteca amb potes." : undefined });
      const items = pickSet(SIZES[r]);
      const order = [];
      let locked = false;
      ctx.setHud("r", `${r + 1}/${SIZES.length}`);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard">
        ${progressDots(SIZES.length, results, r)}
        <div class="q-head"><div class="q-label">Del més antic al més recent · ${items.length} fets</div></div>
        <div class="q-text">Toca els fets en ordre cronològic</div>
        <div class="chrono">${items.map((e, i) => `
          <button class="chrono-item" data-i="${i}"><span class="slot"></span><span class="ct">${esc(e.t)}</span><span class="yr"></span></button>`).join("")}</div>
        <div class="row">
          <button class="btn ghost" data-reset>Reinicia</button>
          <button class="btn primary" data-check disabled style="margin-left:auto">Comprova</button>
        </div>
        <div data-fb></div>
      </div>`);
      ctx.body.appendChild(card);

      function refresh() {
        $$(".chrono-item", card).forEach((b) => {
          const pos = order.indexOf(Number(b.dataset.i));
          b.classList.toggle("picked", pos >= 0);
          $(".slot", b).textContent = pos >= 0 ? pos + 1 : "";
        });
        $("[data-check]", card).disabled = locked || order.length !== items.length;
      }
      $$(".chrono-item", card).forEach((b) => b.addEventListener("click", () => {
        if (locked) return;
        const i = Number(b.dataset.i);
        const pos = order.indexOf(i);
        pos >= 0 ? order.splice(pos, 1) : order.push(i);
        Sfx.play("pick");
        refresh();
      }));
      $("[data-reset]", card).addEventListener("click", () => { if (!locked) { order.length = 0; refresh(); } });

      $("[data-check]", card).addEventListener("click", () => {
        locked = true;
        const truth = items.map((e, i) => i).sort((a, b) => items[a].y - items[b].y);
        let right = 0;
        $$(".chrono-item", card).forEach((b) => {
          const i = Number(b.dataset.i);
          const ok = order.indexOf(i) === truth.indexOf(i);
          if (ok) right++;
          b.classList.add(ok ? "correct" : "wrong");
          b.disabled = true;
          $(".yr", b).textContent = items[i].y;
        });
        const list = $(".chrono", card);
        truth.forEach((i) => list.appendChild($(`.chrono-item[data-i="${i}"]`, card)));
        const perfect = right === items.length;
        const pts = right * 20 + (perfect ? 30 : 0);
        if (perfect) perfects++;
        score += pts;
        results[r] = perfect;
        Sfx.play(perfect ? "ok" : "ko");
        ctx.setHud("pts", fmt(score), { bump: pts > 0 });
        if (pts) floatPoints(card, `+${pts}`);
        $("[data-reset]", card).disabled = true;
        const fb = $("[data-fb]", card);
        explain(fb, perfect,
          perfect ? "Ordre perfecte: +30 de bonus." : "Ara la llista està en l'ordre correcte, amb l'any de cada fet. El número indica la posició que hi havies posat.",
          `${right} de ${items.length} posicions correctes.`);
        nextButton(fb, r + 1 < SIZES.length ? "Següent" : "Veure el resultat").then(() => { r++; next(); });
      });
      refresh();
    }
  },
});

// =========================================================
// 10. PARAULA CLAU (penjat)
// =========================================================
const norm = (c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
const isLetter = (c) => /[A-ZÀ-ÜÇ]/i.test(c);

registerGame({
  id: "paraula",
  cat: "parlament",
  tagline: "Endevina el terme abans de quedar-te sense vots.",
  kicker: "Vocabulari parlamentari",
  title: "Paraula clau",
  color: "#e0306f",
  level: 1,
  meta: "5 paraules",
  icon: icon(`<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>`),
  desc: "Una definició i una paraula amagada del vocabulari polític. Tens sis vots per descobrir-la lletra a lletra abans que se t'acabin.",
  rules: ["5 paraules", "6 vots per paraula", "Pista: −1 vot", "Teclat físic o en pantalla"],
  start(ctx) {
    const words = sample(WORDS, 5);
    let r = 0, score = 0, solved = 0, flawless = true;
    const results = [], recap = [];
    ctx.hud([["r", "Paraula", "1/5"], ["pts", "Punts", "0"]]);
    let onLetter = null;
    ctx.onKey((e) => {
      if (!onLetter) return;
      const k = norm(e.key);
      if (/^[A-Z]$/.test(k)) onLetter(k);
    });
    next();

    function next() {
      if (r >= words.length) {
        if (solved === words.length && flawless) ctx.achieve("lexic");
        return ctx.finish({ score, ratio: solved / words.length, unit: `punts · ${solved}/${words.length} paraules`, xp: Math.round(score / 7), recap });
      }
      const { w, d } = words[r];
      const target = new Set([...w].filter(isLetter).map(norm));
      const guessed = new Set();
      let lives = 6, over = false;
      ctx.setHud("r", `${r + 1}/${words.length}`);
      ctx.body.innerHTML = "";
      // La Ç i les vocals accentuades compten com a C i vocal simple
      const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
      const card = h(`<div class="card qcard">
        ${progressDots(words.length, results, r)}
        <div class="q-head"><div class="q-label">Definició</div></div>
        <div class="q-text definition"></div>
        <div class="word"></div>
        <div class="votes" aria-label="Vots restants"></div>
        <div class="keyboard">${rows.map((row) => `<div class="krow">${[...row].map((k) => `<button class="key" data-k="${k}">${k}</button>`).join("")}</div>`).join("")}</div>
        <div class="row"><button class="btn ghost" data-hint>Pista (−1 vot)</button></div>
        <div data-fb></div>
      </div>`);
      $(".definition", card).textContent = d;
      ctx.body.appendChild(card);

      function render() {
        $(".word", card).innerHTML = w.split(" ").map((part) =>
          `<span class="wpart">${[...part].map((c) => isLetter(c)
            ? `<span class="tile ${guessed.has(norm(c)) || over ? "open" : ""} ${over && !guessed.has(norm(c)) ? "missed" : ""}">${guessed.has(norm(c)) || over ? c : ""}</span>`
            : `<span class="tile sym">${c}</span>`).join("")}</span>`).join("");
        $(".votes", card).innerHTML = Array.from({ length: 6 }, (_, i) => `<i class="${i < lives ? "" : "lost"}"></i>`).join("");
        $("[data-hint]", card).disabled = over || lives <= 1;
      }
      render();

      function guess(k) {
        if (over || guessed.has(k)) return;
        guessed.add(k);
        const btn = $(`.key[data-k="${k}"]`, card);
        if (target.has(k)) { btn.classList.add("hit"); Sfx.play("pick"); }
        else { btn.classList.add("miss"); lives--; flawless = false; Sfx.play("ko"); }
        btn.disabled = true;
        const win = [...target].every((c) => guessed.has(c));
        if (win || lives <= 0) finishWord(win);
        render();
      }
      onLetter = guess;
      $$(".key", card).forEach((b) => b.addEventListener("click", () => guess(b.dataset.k)));
      $("[data-hint]", card).addEventListener("click", () => {
        if (over || lives <= 1) return;
        const missing = [...target].filter((c) => !guessed.has(c));
        lives--;
        flawless = false;
        guess(pick(missing));
      });

      function finishWord(win) {
        over = true;
        onLetter = null;
        $$(".key", card).forEach((b) => { b.disabled = true; });
        results[r] = win;
        let pts = 0;
        if (win) { solved++; pts = 100 + lives * 15; score += pts; Sfx.play("ok"); floatPoints(card, `+${pts}`); ctx.setHud("pts", fmt(score), { bump: true }); }
        else recap.push({ q: d, a: w });
        const fb = $("[data-fb]", card);
        explain(fb, win, win ? `Amb ${lives} ${lives === 1 ? "vot" : "vots"} de marge.` : `La paraula era «${w}».`, win ? `Resolta! +${pts}` : "T'has quedat sense vots.");
        nextButton(fb, r + 1 < words.length ? "Següent paraula" : "Veure el resultat").then(() => { r++; next(); });
      }
    }
  },
});

// =========================================================
// 11. MÉS O MENYS
// =========================================================
registerGame({
  id: "mesomenys",
  cat: "rapid",
  tagline: "Quin en té més? Duels de dades amb tres vides.",
  kicker: "Supervivència",
  title: "Més o menys",
  color: "#f07a00",
  level: 1,
  meta: "3 vides",
  icon: icon(`<path d="M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4"/>`),
  desc: "Quina província elegeix més diputats? Quin partit va treure més escons? Què va passar abans? Encadena encerts fins que perdis les tres vides.",
  rules: ["3 vides", "3 tipus de duel", "Opció d'empat", "Tecles ← ↓ →"],
  start(ctx) {
    let lives = 3, hits = 0, streak = 0, bestStreak = 0, busy = false, pickFn = null;
    const recap = [];
    const livesHtml = () => `<span class="lives">${[0, 1, 2].map((i) => `<i class="${i < lives ? "" : "lost"}"></i>`).join("")}</span>`;
    ctx.hud([["ok", "Encerts", "0"], ["v", "Vides", livesHtml()]]);
    ctx.onKey((e) => {
      if (!pickFn) return;
      if (e.key === "ArrowLeft") pickFn("a");
      else if (e.key === "ArrowRight") pickFn("b");
      else if (e.key === "ArrowDown") pickFn("tie");
    });
    next();

    function duel() {
      const mode = pick(["prov", "prov", "party", "event"]);
      if (mode === "event") {
        const [a, b] = sample(EVENTS.filter((e, i, arr) => arr.findIndex((x) => x.y === e.y) === i), 2);
        return { mode, label: "Història", q: "Què va passar abans?", a: { name: a.t, v: a.y, show: a.y }, b: { name: b.t, v: b.y, show: b.y }, lowerWins: true, tie: false, unit: "" };
      }
      if (mode === "party") {
        const ps = CONGRESS[2023].parties;
        const [a, b] = sample(ps, 2);
        return { mode, label: "Congrés del 2023", q: "Quin partit va treure més escons el 23-J?", a: { name: a.name, v: a.seats, show: a.seats }, b: { name: b.name, v: b.seats, show: b.seats }, tie: true, unit: "escons" };
      }
      const a = pick(PROVINCES);
      const tie = Math.random() < 0.2;
      const cands = PROVINCES.filter((p) => p !== a && (tie ? p.seats === a.seats : p.seats !== a.seats));
      const b = cands.length ? pick(cands) : PROVINCES.find((p) => p !== a);
      return { mode, label: "Diputats per província · 29N", q: "Quina província elegeix més diputats?", a: { name: a.name, v: a.seats, show: a.seats }, b: { name: b.name, v: b.seats, show: b.seats }, tie: true, unit: "diputats" };
    }

    function next() {
      if (lives <= 0) {
        return ctx.finish({
          score: hits, xp: hits * 8, unit: `encerts · millor ratxa: ${bestStreak}`,
          verdict: hits >= 25 ? "Coneixes el país com un director de campanya." : hits >= 12 ? "Molt bé. Tens bon ull per a les dades." : "Les dades tenen trampa. Torna-hi!",
          recap: recap.slice(-6),
        });
      }
      busy = false;
      const D = duel();
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard">
        <div class="q-head"><div class="q-label">${D.label}</div>${streak >= 3 ? `<span class="streak-chip">Ratxa ${streak}</span>` : ""}</div>
        <div class="q-text">${D.q}</div>
        <div class="versus ${D.mode === "event" ? "long" : ""}">
          <button class="vs-card" data-k="a"><span class="nm"></span><span class="num"></span></button>
          <div class="vs-mid"><span class="vs-badge">VS</span>${D.tie ? `<button class="btn ghost" data-k="tie">Empat</button>` : ""}</div>
          <button class="vs-card" data-k="b"><span class="nm"></span><span class="num"></span></button>
        </div>
      </div>`);
      $('[data-k="a"] .nm', card).textContent = D.a.name;
      $('[data-k="b"] .nm', card).textContent = D.b.name;
      ctx.body.appendChild(card);
      $$("[data-k]", card).forEach((el) => el.addEventListener("click", () => pickFn?.(el.dataset.k)));

      pickFn = (k) => {
        if (busy || (k === "tie" && !D.tie)) return;
        busy = true;
        pickFn = null;
        const better = D.lowerWins ? (x, y) => x < y : (x, y) => x > y;
        const truth = better(D.a.v, D.b.v) ? "a" : better(D.b.v, D.a.v) ? "b" : "tie";
        const ok = k === truth;
        $$("[data-k]", card).forEach((el) => { el.disabled = true; });
        $$(".vs-card", card).forEach((el) => {
          const p = el.dataset.k === "a" ? D.a : D.b;
          $(".num", el).innerHTML = `${p.show}${D.unit ? `<small>${D.unit}</small>` : ""}`;
          if (truth === "tie" || el.dataset.k === truth) el.classList.add("correct");
          else if (el.dataset.k === k) el.classList.add("wrong");
        });
        if (ok) {
          hits++;
          streak++;
          bestStreak = Math.max(bestStreak, streak);
          Sfx.play(streak % 5 === 0 ? "combo" : "ok");
          ctx.setHud("ok", hits, { bump: true });
        } else {
          lives--;
          streak = 0;
          Sfx.play("ko");
          ctx.setHud("v", livesHtml(), { warn: lives === 1 });
          recap.push({ q: `${D.a.name} / ${D.b.name}`, a: `${D.a.show} – ${D.b.show}` });
          if (k === "tie") $('[data-k="tie"]', card).classList.add("wrong");
        }
        ctx.after(ok ? 1000 : 1900, next);
      };
    }
  },
});

// =========================================================
// 13. SIGLES
// =========================================================
registerGame({
  id: "sigles",
  cat: "rapid",
  tagline: "CGPJ, AIReF, LOREG: desxifra les inicials.",
  kicker: "Sopa de lletres",
  title: "Sigles",
  color: "#00a37a",
  level: 2,
  meta: "10 preguntes",
  icon: icon(`<path d="M3 18L8 6l5 12M5 14h6"/><path d="M15 10h5M15 14h4M15 18h5"/>`),
  desc: "LOREG, CGPJ, AIReF, ERTE, CNMV... Totes les opcions encaixen amb les inicials, però només una és la correcta.",
  rules: ["10 preguntes · 15 s", "Opcions trampa", "Comodins: 50:50 i enquesta"],
  start(ctx) {
    runChoiceRounds(ctx, sample(ACRONYMS, 10).map((a) => acronymRound(a)), { timer: 15 });
  },
});

// =========================================================
// 14. QUI HO VA DIR?
// =========================================================
registerGame({
  id: "frases",
  cat: "historia",
  tagline: "«Puedo prometer y prometo»… però qui ho va dir?",
  kicker: "Hemeroteca",
  title: "Qui ho va dir?",
  color: "#e0306f",
  level: 1,
  meta: "10 frases",
  icon: icon(`<path d="M6 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>`),
  desc: "255 frases, de «Puedo prometer y prometo» a «Me gusta la fruta». Les opcions falses solen ser del mateix partit. Saps qui les va dir?",
  rules: ["10 frases · 20 s", "Rivals del mateix partit", "Comodins: 50:50 i enquesta", "Amb font i context"],
  start(ctx) {
    const picked = [];
    while (picked.length < 10) {
      const q = pickQuote();
      if (!picked.includes(q)) picked.push(q);
    }
    runChoiceRounds(ctx, picked.map((q) => quoteRound(q)));
  },
});
