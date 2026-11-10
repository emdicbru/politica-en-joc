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
      const r = await fetch(`${window.PEJ_DATA || "../data/"}test.json?t=${Math.floor(Date.now() / 600000)}`, { cache: "no-cache" });
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
  campanya: "Campaña", parlament: "Parlamento", politica: "Política", economia: "Economía", habitatge: "Vivienda", justicia: "Justicia",
  internacional: "Internacional", energia: "Energía", territori: "Territorio", immigracio: "Inmigración", societat: "Sociedad",
  cultura: "Cultura", historia: "Historia", geografia: "Geografía", ciencia: "Ciencia",
};
const testKind = (q) => (q.k === "cultura" ? { ico: "🎓", t: "Cultura general" } : { ico: "📰", t: "Actualidad" });

// Targeta de l'Inici, sota la del repte diari
function renderTestHero() {
  const box = $("#test-hero");
  if (!box) return;
  if (!testOn()) { box.hidden = true; if (typeof renderHjFoot === "function") renderHjFoot(); return; }
  box.hidden = false;
  const key = todayKey(), day = testDay(key), r = testResult(key);
  if (!testData) { box.innerHTML = `<div class="jc-load">Cargando el test de actualidad…</div>`; testLoad().then(renderTestHero); return; }
  box.classList.toggle("done", !!r);
  const qs = day ? day.questions : [];
  const chips = [...new Set(qs.map((q) => TEST_TOPIC[q.t] || "Actualidad"))].slice(0, 5);
  const streak = testStreak();
  const dd = new Date(key + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  box.innerHTML = `
    <div class="jc-top">
      <span class="jc-badge"><i class="jc-live" aria-hidden="true"></i>${esc(dd)}</span>
      <span class="jc-meta">Nuevo cada mañana a las <b>6:00</b></span>
    </div>
    <h2 class="jc-name">Test de actualidad</h2>
    <p class="jc-sub">${r ? `¡Hecho! <b>${r.hits}/${r.n}</b> aciertos · ${fmtSecs(r.ms)}` : day ? `${qs.length} preguntas sobre lo que ha pasado estos días. ¿Cuánto sabes de la actualidad?` : `El test de hoy aún no está listo: se prepara cada mañana con las noticias de los últimos días.`}</p>
    <div class="jc-row">${r ? `<div class="jc-grid" aria-label="Resultado">${[...r.grid].map((c) => `<i class="${c === "🟩" ? "ok" : "ko"}"></i>`).join("")}</div>`
      : chips.length ? `<div class="jc-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` : ""}</div>
    <div class="jc-stats">
      <span><small>Tu racha</small><b>${streak} ${streak === 1 ? "día" : "días"}</b></span>
      <span><small>Posición</small><b id="th-rank">—</b></span>
      <span><small>Aciertos</small><b>${r ? `${r.hits}/${r.n}` : "—"}</b></span>
    </div>
    <div class="jc-foot">
      ${r ? `<button type="button" class="jc-play" data-test-share>Comparte</button>` : day ? `<a class="jc-play" href="#joc/actualitat"><span aria-hidden="true">▶</span> Juega</a>` : `<span class="jc-play off">Pronto</span>`}
      <a class="jc-link" href="#ranking" data-test-rank>Ranking de hoy →</a>
    </div>`;
  $("[data-test-share]", box)?.addEventListener("click", () => testShare(key));
  // Des de l'Inici, el rànquing s'obre directament al del test
  $("[data-test-rank]", box)?.addEventListener("click", () => { window.__rankGame = "test"; });
  if (r) window.Online?.fillTestRank?.(key);
  if (typeof renderHjFoot === "function") renderHjFoot();
}

// Imatge del resultat (1080 × 1350, la mida que millor es veu a WhatsApp, Instagram i X), amb el mateix estil que la del
// repte diari: encerts, temps i la graella
function testShareCanvas(key, r) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d", PAPER = "#f1e9d8", CARD = "#fffaf0", BLUE = "#3554ff";
  const display = (size) => `900 ${size}px Unbounded, "Arial Black", sans-serif`, sans = (size, w = 600) => `${w} ${size}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, hh, rr) => { c.beginPath(); c.moveTo(x + rr, y); c.arcTo(x + w, y, x + w, y + hh, rr); c.arcTo(x + w, y + hh, x, y + hh, rr); c.arcTo(x, y + hh, x, y, rr); c.arcTo(x, y, x + w, y, rr); c.closePath(); };
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(23,23,61,.08)";
  for (let x = 6; x < W; x += 18) for (let y = 6; y < H; y += 18) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = BLUE; c.fillRect(0, 0, W, 150);
  c.fillStyle = CARD; c.font = display(46); c.textAlign = "left"; c.fillText("TEST DE ACTUALIDAD", 60, 95);
  const [y, m, dd] = key.split("-").map(Number);
  c.font = sans(30, 700); c.textAlign = "right";
  c.fillText(new Date(y, m - 1, dd).toLocaleDateString(typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es-ES" : "es-ES", { day: "numeric", month: "long" }), W - 60, 93);
  c.fillStyle = INK; round(72, 222, W - 132, 900, 40); c.fill();
  c.fillStyle = CARD; round(60, 210, W - 132, 900, 40); c.fill(); c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
  c.textAlign = "center"; c.fillStyle = "#6e6a82"; c.font = sans(34, 700); c.fillText("Aciertos", W / 2 - 6, 320);
  c.fillStyle = INK; c.font = display(190); c.fillText(`${r.hits}/${r.n}`, W / 2 - 6, 510);
  c.font = sans(40, 700); c.fillStyle = "#3a3a63"; c.fillText(`⏱ ${fmtSecs(r.ms)}`, W / 2 - 6, 590);
  const cells = (r.grid || "").match(/🟩|🟥|⬜/g) || [], sz = 70, gap = 14, x0 = W / 2 - 6 - (cells.length * (sz + gap) - gap) / 2;
  cells.forEach((g, i) => { c.fillStyle = g === "🟩" ? "#45d483" : g === "🟥" ? "#ff6b4a" : "#d9d2c0"; round(x0 + i * (sz + gap), 650, sz, sz, 14); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); });
  c.font = display(48); c.fillStyle = INK; c.fillText("¿Has seguido las noticias?", W / 2 - 6, 860);
  c.font = sans(34, 600); c.fillStyle = "#6e6a82"; c.fillText("Preguntas nuevas cada mañana a las 6:00", W / 2 - 6, 930);
  c.fillStyle = INK; c.font = display(40); c.fillText("Política en Joc", W / 2, 1230);
  c.font = sans(30, 600); c.fillStyle = "#3a3a63"; c.fillText(location.host || "politicaenjoc.cat", W / 2, 1280);
  return cv;
}
// Comparteix una imatge amb text: al mòbil, amb el menú del sistema (WhatsApp, Instagram…); a l'ordinador, es baixa la
// imatge i es copia el text
async function shareCanvas(cv, name, text) {
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  const file = blob && new File([blob], name, { type: "image/png" });
  try {
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  if (blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  try { await navigator.clipboard.writeText(text); toast("Imagen descargada y texto copiado"); } catch { toast("Imagen descargada"); }
}
const testShareText = (r) => `Política en Joc · Test de actualidad
📰 ${r.hits}/${r.n} · ⏱ ${fmtSecs(r.ms)}\n${r.grid}\n${location.origin}${location.pathname}#joc/actualitat`;
async function testShare(key) {
  const r = testResult(key);
  if (!r) return;
  await shareCanvas(testShareCanvas(key, r), `test-${key}.png`, testShareText(r));
}

registerGame({
  id: "actualitat",
  cat: "daily",
  hidden: true, // s'hi arriba des de l'Inici
  backHref: "#inici",
  tagline: "¿Has seguido las noticias de estos días?",
  kicker: "Cada día, preguntas nuevas",
  title: "Test de actualidad",
  color: "#3554ff",
  level: 1,
  meta: "10 preguntas",
  icon: icon(`<path d="M4 5h13v14H6a2 2 0 01-2-2z"/><path d="M17 9h3v8a2 2 0 01-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>`),
  desc: "Preguntas sobre los temas de actualidad de los últimos días y de cultura general relacionada con las noticias, iguales para todos y nuevas cada día. Después de cada respuesta, la explicación. Gana quien acierta más; si hay empate, quien lo hace más rápido. Solo cuenta la primera partida.",
  rules: ["Hasta 10 preguntas", "Actualidad y cultura general", "Con la explicación de cada respuesta", "Cuenta la primera partida"],
  gate() {
    if (!testOn()) return { html: `<p class="muted">El test de actualidad solo está en catalán.</p>`, bind() {} };
    if (!testData) { testLoad().then(() => { if (location.hash === "#joc/actualitat" && $(".card.intro")) showIntro(GAMES.find((g) => g.id === "actualitat")); }); return { html: `<p class="muted">Cargando el test…</p>`, bind() {} }; }
    if (!testDay()) return { html: `<p class="muted">El test de hoy aún no está listo: se prepara cada mañana. Vuelve dentro de un rato.</p>`, bind() {} };
    return null;
  },
  status() {
    const r = testResult();
    return r ? `<span class="gc-status done">Hecho · ${r.hits}/${r.n}</span>` : `<span class="gc-status new">Test nuevo</span>`;
  },
  introExtra() {
    const r = testResult(), day = testDay();
    return `<div class="daily-box">
      <div><small>Preguntas</small><strong>${day ? day.questions.length : "—"}</strong></div>
      <div><small>Hoy</small><strong>${r ? `${r.hits}/${r.n}` : "—"}</strong></div>
    </div>${r ? `<p class="muted">Ya lo has hecho hoy: puedes repetirlo, pero en el ranking cuenta la primera partida.</p>` : ""}`;
  },
  start(ctx) {
    const key = todayKey(), day = testDay(key);
    if (!day) { ctx.body.innerHTML = `<div class="card"><p>El test de hoy aún no está listo.</p></div>`; return; }
    const first = !testResult(key);
    // L'ordre de les opcions és el mateix per a tothom
    const rng = seededRng(hashString(`test-${key}`));
    const items = day.questions.map((q) => ({ q, ...prepOptions(q.a, rng) }));
    const N = items.length;
    let i = 0, hits = 0, t0 = 0, paused = 0, pauseAt = 0, ended = false;
    const results = [], recap = [];
    const elapsed = () => (pauseAt || performance.now()) - t0 - paused;
    ctx.hud([["q", "Pregunta", `1/${N}`], ["t", "Tiempo", "0,0"], ["e", "Aciertos", "0"]]);
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
        <div class="q-head"><div class="q-label"><span class="tq-kind">${kind.ico} ${kind.t}</span> · ${esc(TEST_TOPIC[q.t] || "Actualidad")}</div></div>
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
          <b>${correct ? "¡Correcto!" : `La respuesta es: ${esc(q.a[0])}`}</b>
          <p>${esc(q.exp)}</p>
          <div class="tq-foot">${q.u ? `<a href="${esc(q.u)}" target="_blank" rel="noopener">Lee la noticia ↗</a>${q.s?.length ? `<small>${q.s.map(esc).join(" · ")}</small>` : ""}` : ""}
            <button class="btn primary" type="button" data-next>${i + 1 < N ? "Siguiente" : "Ver el resultado"}</button></div>
          <button class="linklike tq-rpt" type="button" data-rpt-q>¿Hay un error en esta pregunta?</button>
        </div>`);
        card.appendChild(exp);
        const next = () => { off?.(); i++; render(); };
        const off = ctx.onKey((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
        $("[data-next]", exp).addEventListener("click", next);
        // Avís d'error amb la pregunta ja escrita (js/report.js)
        $("[data-rpt-q]", exp).addEventListener("click", () => { if (typeof openReport !== "function") return; openReport(); const ta = $("[data-rpt-text]"); if (ta) { ta.value = `Test de actualidad del ${key} · «${q.q}» (respuesta dada por buena: ${q.a[0]})
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
        unit: `${fmtSecs(ms)}${first ? "" : " · esta partida ya no cuenta para el ranking"}`,
        verdict: hits === N ? "¡Pleno! Estás al día de todo." : hits >= N * 0.7 ? "Muy bien: sigues la actualidad de cerca." : hits >= N * 0.4 ? "No está mal. ¡Mañana, más!" : "Hoy costaba. Lee las explicaciones y mañana vuelves.",
        extraHtml: `<div class="daily-share"><div class="share-grid">${grid}</div>
            <div class="daily-share-btns"><button class="btn primary" data-test-share>Comparte el resultado</button><a class="btn ghost" href="#ranking" data-test-rank>Ver el ranking</a></div></div>
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
