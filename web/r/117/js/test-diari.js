// ---------- Test d'actualitat del dia ----------
// Un joc diari a part del repte: 8-10 preguntes iguals per a tothom, noves cada dia, sobre els temes de l'actualitat dels
// últims dies i de cultura general lligada a les notícies. Les genera cada matí tools/update-test.js (data/test.json).
// Guanya qui n'encerta més i, amb els mateixos encerts, qui ho fa més ràpid (el rellotge s'atura mentre es llegeix
// l'explicació). Només compta la primera partida: el rànquing és Online.submitTest (tests/{dia}/entries/{uid}).
// Les preguntes són en català: a la versió en castellà el test no es mostra.
const TEST_KEY = "r29n-test";
let testData = null, testLoading = null;
const testOn = () => PEJ_LANG !== "es";
function testLoad() {
  if (testData) return Promise.resolve(testData);
  if (!testOn()) return Promise.resolve((testData = { days: {} }));
  return (testLoading ||= (async () => {
    try {
      const r = await fetch(`${window.PEJ_DATA || "data/"}test.json?t=${Math.floor(Date.now() / 600000)}`, { cache: "no-cache" });
      testData = r.ok ? await r.json() : { days: {} };
    } catch { testData = { days: {} }; }
    testLoading = null;
    return testData;
  })());
}
// Només els tests de la versió 2 del generador o posteriors (la primera no comprovava les respostes amb els titulars)
const TEST_MIN_V = 2;
const testDay = (key = todayKey()) => { const d = testData?.days?.[key]; return d && (d.v || 1) >= TEST_MIN_V ? d : null; };
const testStore = () => store.get(TEST_KEY, { scores: {} });
const testResult = (key = todayKey()) => testStore().scores[key] || null;
// Ratxa: dies seguits amb el test fet (si avui encara no s'ha fet, compta fins ahir)
function testStreak() {
  const s = testStore().scores;
  let n = 0, d = new Date();
  if (!s[todayKey()]) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!s[k]) return n;
    n++; d.setDate(d.getDate() - 1);
  }
}
const TEST_TOPIC = {
  campanya: "Campanya", parlament: "Parlament", politica: "Política", economia: "Economia", habitatge: "Habitatge", justicia: "Justícia",
  internacional: "Internacional", energia: "Energia", territori: "Territori", immigracio: "Immigració", societat: "Societat",
  cultura: "Cultura", historia: "Història", geografia: "Geografia", ciencia: "Ciència",
};
const testKind = (q) => (q.k === "cultura" ? { ico: "🎓", t: "Cultura general" } : { ico: "📰", t: "Actualitat" });

// Targeta de l'Inici, sota la del repte diari
function renderTestHero() {
  const box = $("#test-hero");
  if (!box) return;
  if (!testOn()) { box.hidden = true; if (typeof renderHjFoot === "function") renderHjFoot(); return; }
  box.hidden = false;
  const key = todayKey(), day = testDay(key), r = testResult(key);
  if (!testData) { box.innerHTML = `<div class="jc-load">Carregant el test d'actualitat…</div>`; testLoad().then(renderTestHero); return; }
  box.classList.toggle("done", !!r);
  const qs = day ? day.questions : [];
  const chips = [...new Set(qs.map((q) => TEST_TOPIC[q.t] || "Actualitat"))].slice(0, 5);
  const streak = testStreak();
  const dd = new Date(key + "T12:00:00").toLocaleDateString("ca-ES", { day: "numeric", month: "long" });
  box.innerHTML = `
    <div class="jc-top">
      <span class="jc-badge"><i class="jc-live" aria-hidden="true"></i>${esc(dd)}</span>
      <span class="jc-meta">Nou cada matí a les <b>6:00</b></span>
    </div>
    <h2 class="jc-name">Test d'actualitat</h2>
    <p class="jc-sub">${r ? `Fet! <b>${r.hits}/${r.n}</b> encerts · ${fmtSecs(r.ms)}` : day ? `${qs.length} preguntes sobre el que ha passat aquests dies. Quant en saps, de l'actualitat?` : `El test d'avui encara no és a punt: es prepara cada matí amb les notícies dels últims dies.`}</p>
    <div class="jc-row">${r ? `<div class="jc-grid" aria-label="Resultat">${[...r.grid].map((c) => `<i class="${c === "🟩" ? "ok" : "ko"}"></i>`).join("")}</div>`
      : chips.length ? `<div class="jc-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` : ""}</div>
    <div class="jc-stats">
      <span><small>La teva ratxa</small><b>${streak} ${streak === 1 ? "dia" : "dies"}</b></span>
      <span><small>Posició</small><b id="th-rank">—</b></span>
      <span><small>Encerts</small><b>${r ? `${r.hits}/${r.n}` : "—"}</b></span>
    </div>
    <div class="jc-foot">
      ${r ? `<button type="button" class="jc-play" data-test-share>Comparteix</button>` : day ? `<a class="jc-play" href="#joc/actualitat"><span aria-hidden="true">▶</span> Juga</a>` : `<span class="jc-play off">Aviat</span>`}
      <a class="jc-link" href="#ranking" data-test-rank>Rànquing d'avui →</a>
    </div>`;
  $("[data-test-share]", box)?.addEventListener("click", () => testShare(key));
  // Des de l'Inici, el rànquing s'obre directament al del test
  $("[data-test-rank]", box)?.addEventListener("click", () => { window.__rankGame = "test"; });
  if (r) window.Online?.fillTestRank?.(key);
  if (typeof renderHjFoot === "function") renderHjFoot();
}

async function testShare(key) {
  const r = testResult(key);
  if (!r) return;
  const text = `Política en Joc · Test d'actualitat\n📰 ${r.hits}/${r.n} · ⏱ ${fmtSecs(r.ms)}\n${r.grid}\n${location.origin}${location.pathname}#joc/actualitat`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast("Resultat copiat"); }
  } catch { /* cancel·lat */ }
}

registerGame({
  id: "actualitat",
  cat: "daily",
  hidden: true, // s'hi arriba des de l'Inici
  backHref: "#inici",
  tagline: "Has seguit les notícies d'aquests dies?",
  kicker: "Cada dia, preguntes noves",
  title: "Test d'actualitat",
  color: "#3554ff",
  level: 1,
  meta: "10 preguntes",
  icon: icon(`<path d="M4 5h13v14H6a2 2 0 01-2-2z"/><path d="M17 9h3v8a2 2 0 01-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>`),
  desc: "Preguntes sobre els temes de l'actualitat dels últims dies i de cultura general relacionada amb les notícies, iguals per a tothom i noves cada dia. Després de cada resposta, l'explicació. Guanya qui n'encerta més; si hi ha empat, qui ho fa més ràpid. Només compta la primera partida.",
  rules: ["Fins a 10 preguntes", "Actualitat i cultura general", "Amb l'explicació de cada resposta", "Compta la primera partida"],
  gate() {
    if (!testOn()) return { html: `<p class="muted">El test d'actualitat només és en català.</p>`, bind() {} };
    if (!testData) { testLoad().then(() => { if (location.hash === "#joc/actualitat" && $(".card.intro")) showIntro(GAMES.find((g) => g.id === "actualitat")); }); return { html: `<p class="muted">Carregant el test…</p>`, bind() {} }; }
    if (!testDay()) return { html: `<p class="muted">El test d'avui encara no és a punt: es prepara cada matí. Torna-hi d'aquí a una estona.</p>`, bind() {} };
    return null;
  },
  status() {
    const r = testResult();
    return r ? `<span class="gc-status done">Fet · ${r.hits}/${r.n}</span>` : `<span class="gc-status new">Nou test</span>`;
  },
  introExtra() {
    const r = testResult(), day = testDay();
    return `<div class="daily-box">
      <div><small>Preguntes</small><strong>${day ? day.questions.length : "—"}</strong></div>
      <div><small>Avui</small><strong>${r ? `${r.hits}/${r.n}` : "—"}</strong></div>
    </div>${r ? `<p class="muted">Ja l'has fet avui: pots tornar-lo a fer, però al rànquing compta la primera partida.</p>` : ""}`;
  },
  start(ctx) {
    const key = todayKey(), day = testDay(key);
    if (!day) { ctx.body.innerHTML = `<div class="card"><p>El test d'avui encara no és a punt.</p></div>`; return; }
    const first = !testResult(key);
    // L'ordre de les opcions és el mateix per a tothom
    const rng = seededRng(hashString(`test-${key}`));
    const items = day.questions.map((q) => ({ q, ...prepOptions(q.a, rng) }));
    const N = items.length;
    let i = 0, hits = 0, t0 = 0, paused = 0, pauseAt = 0, ended = false;
    const results = [], recap = [];
    const elapsed = () => (pauseAt || performance.now()) - t0 - paused;
    ctx.hud([["q", "Pregunta", `1/${N}`], ["t", "Temps", "0,0"], ["e", "Encerts", "0"]]);
    ctx.countIn(() => {
      t0 = performance.now();
      ctx.every(100, () => { if (!ended) ctx.setHud("t", fmtTime(elapsed())); });
      render();
    });
    function render() {
      if (pauseAt) { paused += performance.now() - pauseAt; pauseAt = 0; }
      if (i >= N) return end();
      const { q, options, correctIndex } = items[i], kind = testKind(q);
      ctx.setHud("q", `${i + 1}/${N}`);
      ctx.body.innerHTML = "";
      const card = h(`<div class="card qcard test-card ${q.k === "cultura" ? "cul" : "act"}">
        ${progressDots(N, results, i)}
        <div class="q-head"><div class="q-label"><span class="tq-kind">${kind.ico} ${kind.t}</span> · ${esc(TEST_TOPIC[q.t] || "Actualitat")}</div></div>
        <div class="q-text">${esc(q.q)}</div>
      </div>`);
      ctx.body.appendChild(card);
      choiceBox(ctx, card, { options, correctIndex, columns: options.every((o) => o.length <= 18) ? 2 : 1 }).promise.then(({ correct }) => {
        if (ended) return;
        pauseAt = performance.now();
        results[i] = correct;
        if (correct) { hits++; ctx.setHud("e", hits); floatPoints(card, "✓"); }
        else recap.push({ q: q.q, a: q.a[0], note: q.exp });
        // L'explicació, amb l'enllaç a la notícia si n'hi ha
        const exp = h(`<div class="tq-exp ${correct ? "ok" : "ko"}">
          <b>${correct ? "Correcte!" : `La resposta és: ${esc(q.a[0])}`}</b>
          <p>${esc(q.exp)}</p>
          <div class="tq-foot">${q.u ? `<a href="${esc(q.u)}" target="_blank" rel="noopener">Llegeix la notícia ↗</a>${q.s?.length ? `<small>${q.s.map(esc).join(" · ")}</small>` : ""}` : ""}
            <button class="btn primary" type="button" data-next>${i + 1 < N ? "Següent" : "Veure el resultat"}</button></div>
          <button class="linklike tq-rpt" type="button" data-rpt-q>Hi ha un error en aquesta pregunta?</button>
        </div>`);
        card.appendChild(exp);
        const next = () => { off?.(); i++; render(); };
        const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
        $("[data-next]", exp).addEventListener("click", next);
        // Avís d'error amb la pregunta ja escrita (js/report.js)
        $("[data-rpt-q]", exp).addEventListener("click", () => { if (typeof openReport !== "function") return; openReport(); const ta = $("[data-rpt-text]"); if (ta) { ta.value = `Test d'actualitat del ${key} · «${q.q}» (resposta donada per bona: ${q.a[0]})
`; ta.setSelectionRange(ta.value.length, ta.value.length); } });
        $("[data-next]", exp).focus({ preventScroll: true });
        exp.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
    function end() {
      if (ended) return;
      ended = true;
      const ms = Math.round(elapsed()), grid = results.map((ok) => (ok ? "🟩" : "🟥")).join("");
      let sub = null, xp = hits * 4;
      if (first) {
        const st = testStore();
        st.scores[key] = { hits, n: N, ms, grid };
        // Només els últims 120 dies
        Object.keys(st.scores).sort().slice(0, -120).forEach((k) => delete st.scores[k]);
        store.set(TEST_KEY, st);
        xp = 30 + hits * 10;
        sub = window.Online?.submitTest?.(key, { hits, n: N, ms });
      }
      Progress.record("actualitat", hits, xp);
      ctx.finish({
        score: hits, noRecord: true, xp,
        display: `${hits}/${N}`,
        ratio: hits / N,
        unit: `${fmtSecs(ms)}${first ? "" : " · aquesta partida ja no compta per al rànquing"}`,
        verdict: hits === N ? "Ple! Estàs al dia de tot." : hits >= N * 0.7 ? "Molt bé: segueixes l'actualitat de prop." : hits >= N * 0.4 ? "No està malament. Demà, més!" : "Avui costava. Llegeix les explicacions i demà hi tornes.",
        extraHtml: `<div class="daily-share"><div class="share-grid">${grid}</div>
            <div class="daily-share-btns"><button class="btn primary" data-test-share>Comparteix el resultat</button><a class="btn ghost" href="#ranking" data-test-rank>Veure el rànquing</a></div></div>
          <div id="test-rank"></div>`,
        onShown(body) {
          $("[data-test-share]", body)?.addEventListener("click", () => testShare(key));
          $("[data-test-rank]", body)?.addEventListener("click", () => { window.__rankGame = "test"; });
          if (window.Online?.renderTestMini) Promise.resolve(sub).then(() => window.Online.renderTestMini($("#test-rank", body), key));
        },
        recap,
      });
    }
  },
});
testLoad().then(() => renderTestHero());
