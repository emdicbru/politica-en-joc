// Aprèn: la portada (#apren), els capítols pas a pas (#apren/<capítol>), els essencials en 5 minuts (#apren/essencials),
// el repàs de les errades (#apren/repas) i el pla per votar (#apren/pla). Els continguts són els de sempre (apren.js i
// apren-context.js): aquí hi ha com es llegeixen.
// La lectura de tot el capítol seguit continua a #apren/<capítol>/tot (renderChapter).

const APR_KEY = "r29n-apren";
const aprLocal = () => store.get(APR_KEY, {}) || {};
const aprSave = (patch) => store.set(APR_KEY, { ...aprLocal(), ...patch });

// ---------- Passos d'un capítol ----------
// Introducció, una pantalla per apartat (cada títol del capítol), les 3 preguntes i el resultat
function aprSteps(ch) {
  const steps = [{ kind: "intro" }];
  let cur = null;
  for (const b of ch.blocks) {
    if (b.t === "h") { cur = { kind: "content", title: b.h, blocks: [] }; steps.push(cur); }
    else { if (!cur) { cur = { kind: "content", title: "", blocks: [] }; steps.push(cur); } cur.blocks.push(b); }
  }
  ch.quiz.forEach((q, qi) => steps.push({ kind: "q", q, qi }));
  steps.push({ kind: "end" });
  return steps;
}
const aprStepKey = (ch) => `p:${ch.slug}`;
const aprStepAt = (ch) => learnData()[aprStepKey(ch)] || 0;
// Estat d'un capítol: "ok" superat, "retry" fet però sense aprovar, "go" començat, "new" per començar
function aprState(ch) {
  const s = learnData()[ch.slug];
  if (s !== undefined) return s >= 2 ? "ok" : "retry";
  return aprStepAt(ch) > 0 ? "go" : "new";
}
const aprNext = () => AP_CHAPTERS.find((c) => aprState(c) === "go") || AP_CHAPTERS.find((c) => aprState(c) !== "ok");

// ---------- Preguntes fallades (per al repàs) ----------
const aprMiss = () => aprLocal().miss || [];
function aprMissSet(id, wrong) {
  const m = new Set(aprMiss());
  wrong ? m.add(id) : m.delete(id);
  aprSave({ miss: [...m].slice(-60) });
}
const aprQuestion = (id) => { const [slug, qi] = id.split("#"); const ch = AP_CHAPTERS.find((c) => c.slug === slug); return ch?.quiz[Number(qi)] ? { ch, q: ch.quiz[Number(qi)], id } : null; };

// ---------- Carcassa de les pantalles pas a pas (capítol, essencials, repàs) ----------
// cfg: { tone, steps, start, exit, render(step, i) → { html, bind?(el), nav? }, next(step, i) → { label, ok }, onShow(i) }
let aprShellNow = null;
function aprShell(root, cfg) {
  const S = { ...cfg, i: -1 };
  aprShellNow = S;
  document.body.classList.add("lesson");
  root.style.setProperty("--tone", cfg.tone);
  root.innerHTML = `<div class="ls">
    <header class="ls-top">
      <a class="ls-x" href="${cfg.exit || "#apren"}" aria-label="Surt">✕</a>
      <div class="ls-bar" aria-hidden="true">${cfg.steps.map(() => "<i></i>").join("")}</div>
      <span class="ls-n" aria-live="polite"></span>
    </header>
    <div class="ls-stage"></div>
    <footer class="ls-nav">
      <button class="btn ghost ls-prev" type="button" data-prev aria-label="Pas anterior">←</button>
      <button class="btn primary lg ls-next" type="button" data-next>Continua</button>
    </footer>
  </div>`;
  const stage = $(".ls-stage", root), nav = $(".ls-nav", root), prev = $("[data-prev]", root), next = $("[data-next]", root);
  S.go = (i, dir = 1) => {
    if (i < 0 || i >= S.steps.length) return;
    S.i = i;
    const st = S.steps[i];
    const r = S.render(st, i);
    stage.innerHTML = `<div class="ls-step ${dir < 0 ? "back" : ""}">${r.html}</div>`;
    r.bind?.($(".ls-step", stage));
    $$(".ls-bar i", root).forEach((b, k) => { b.className = k < i ? "done" : k === i ? "on" : ""; });
    $(".ls-n", root).textContent = `${i + 1}/${S.steps.length}`;
    nav.hidden = r.nav === false;
    prev.disabled = i === 0 || r.back === false;
    S.refresh();
    S.onShow?.(i);
    // Cada pas comença a dalt de tot
    const top = root.getBoundingClientRect().top + scrollY - 70;
    if (scrollY > top) scrollTo(0, Math.max(0, top));
  };
  S.refresh = () => {
    const n = S.next(S.steps[S.i], S.i);
    next.textContent = n.label;
    next.disabled = !n.ok;
  };
  next.addEventListener("click", () => { Sfx.play("pick"); S.go(S.i + 1); });
  prev.addEventListener("click", () => S.go(S.i - 1, -1));
  // Lliscar amb el dit (fora de botons i controls)
  let x0 = null, y0 = 0;
  stage.addEventListener("touchstart", (e) => { if (e.target.closest("input,button,select,textarea,a,.ap-w")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && !next.disabled && !nav.hidden) next.click();
    if (dx > 0 && !prev.disabled && !nav.hidden) prev.click();
  });
  S.go(cfg.start || 0);
  return S;
}
// Teclat: fletxes per avançar i tornar enrere
document.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("lesson") || e.target.closest?.("input,textarea,select") || e.altKey || e.ctrlKey || e.metaKey) return;
  const root = $("#ap-chapter");
  if (!root || root.hidden) return;
  if (e.key === "ArrowRight") { const b = $("[data-next]", root); if (b && !b.disabled && !$(".ls-nav", root).hidden) { e.preventDefault(); b.click(); } }
  if (e.key === "ArrowLeft") { const b = $("[data-prev]", root); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
});
// Fora de l'Aprèn no hi ha pas a pas (dins, renderApren ho decideix a cada pàgina)
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#apren")) document.body.classList.remove("lesson"); });

// Una pregunta amb les opcions barrejades; onAnswer(ok) quan es respon. ans: { order, k } per recordar la resposta
function aprQuestionHtml(q, ans, kicker) {
  const done = ans.k !== undefined;
  return `<div class="ls-q">
    <p class="kicker">${kicker}</p>
    <h2 class="ls-qh">${esc(q.q)}</h2>
    <div class="choices">${ans.order.map((k, n) => `<button class="choice ${done ? (k === 0 ? "correct" : k === ans.k ? "wrong" : "dim") : ""}" type="button" data-k="${k}" ${done ? "disabled" : ""}><span class="key">${"ABCD"[n]}</span><span class="ctext">${esc(q.opts[k])}</span></button>`).join("")}</div>
    <div class="ls-exp">${done ? aprExplain(q, ans.k === 0) : ""}</div>
  </div>`;
}
const aprExplain = (q, ok) => `<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong>${ok ? "Correcte!" : "No ben bé"}</strong><span>${rich(q.exp)}</span></div>`;
function aprBindQuestion(el, q, ans, onAnswer) {
  $$(".choice", el).forEach((b) => b.addEventListener("click", () => {
    if (ans.k !== undefined) return;
    ans.k = Number(b.dataset.k);
    const ok = ans.k === 0;
    Sfx.play(ok ? "ok" : "ko");
    $$(".choice", el).forEach((x) => { x.disabled = true; const k = Number(x.dataset.k); x.classList.add(k === 0 ? "correct" : k === ans.k ? "wrong" : "dim"); });
    $(".ls-exp", el).innerHTML = aprExplain(q, ok);
    onAnswer(ok);
  }));
}

// Exemples interactius i xifres animades d'un tros de capítol
function aprMountBlocks(el) {
  $$(".ap-w", el).forEach((w) => AP_WIDGETS[w.dataset.w]?.mount(w));
  $$("[data-count]", el).forEach((x) => setTimeout(() => countUp(x), 150));
  const hemi = $("#hero-hemi", el);
  if (hemi) setTimeout(() => hemi.classList.add("play"), 150);
}

// ---------- Un capítol, pas a pas ----------
function renderLesson(ch) {
  const root = $("#ap-chapter");
  const steps = aprSteps(ch);
  const firstQ = steps.findIndex((s) => s.kind === "q");
  const ans = {};
  const saved = aprStepAt(ch);
  const resumable = saved > 0 && saved < firstQ && aprState(ch) === "go";
  const nextCh = AP_CHAPTERS[ch.n];
  const hits = () => Object.values(ans).filter((a) => a.k === 0).length;
  let finished = false;
  aprShell(root, {
    tone: ch.tone, steps,
    render(st, i) {
      if (st.kind === "intro") return {
        html: `<div class="ls-intro">
          <div class="ls-art">${ch.art}</div>
          <p class="kicker">Part ${ch.block.n} · ${esc(ch.block.title)} · Capítol ${ch.n} de ${AP_CHAPTERS.length}</p>
          <h1 class="ls-title">${esc(ch.title)}</h1>
          <p class="ls-lead">${rich(ch.lead)}</p>
          ${ch.key ? `<div class="ls-key"><p class="kicker">En 30 segons</p><ul>${ch.key.map((k) => `<li>${rich(k)}</li>`).join("")}</ul></div>` : ""}
          <p class="ls-meta"><span>⏱ ${ch.mins} min</span><span>${firstQ - 1} passos</span><span>${ch.quiz.length} preguntes</span>${aprState(ch) === "ok" ? `<span class="ok">✓ Superada (${learnData()[ch.slug]}/${ch.quiz.length})</span>` : ""}</p>
          ${resumable ? `<button class="btn primary lg ls-resume" type="button" data-resume>Continua pel pas ${saved} de ${firstQ - 1} →</button>` : ""}
          <p class="ls-alt"><button class="linklike" type="button" data-skip>Ja ho sé: vés a les preguntes</button> · <a href="#apren/${ch.slug}/tot">Llegeix-ho tot seguit</a></p>
        </div>`,
        bind(el) {
          $("[data-resume]", el)?.addEventListener("click", () => aprShellNow.go(saved));
          $("[data-skip]", el).addEventListener("click", () => aprShellNow.go(firstQ));
        },
      };
      if (st.kind === "content") {
        const n = i, total = firstQ - 1;
        return {
          html: `<div class="ls-content">
            <p class="kicker">Pas ${n} de ${total} · ${esc(ch.title)}</p>
            ${st.title ? `<h2 class="ls-h">${esc(st.title)}</h2>` : ""}
            <div class="ap-body">${st.blocks.map((b, k) => renderBlock(b, `${i}-${k}`)).join("")}</div>
          </div>`,
          bind: aprMountBlocks,
        };
      }
      if (st.kind === "q") {
        const a = (ans[st.qi] ||= { order: shuffle(st.q.opts.map((_, k) => k)) });
        return {
          html: aprQuestionHtml(st.q, a, `Comprova-ho · pregunta ${st.qi + 1} de ${ch.quiz.length}`),
          bind(el) { aprBindQuestion(el, st.q, a, (ok) => { aprMissSet(`${ch.slug}#${st.qi}`, !ok); aprShellNow.refresh(); }); },
        };
      }
      // Resultat
      const h = hits(), passed = h >= 2;
      if (!finished) {
        finished = true;
        const ld = learnData(), first = ld[ch.slug] === undefined;
        ld[ch.slug] = Math.max(ld[ch.slug] ?? -1, h);
        const xp = first ? 10 + 5 * h : 0;
        if (xp) awardLearnXp(xp); else Progress.save();
        st.xp = xp;
        window.Track?.("chapter_complete", { chapter: ch.slug, score: h });
        if (AP_CHAPTERS.every(chapterPassed)) Progress.unlock("informat");
        if (passed) setTimeout(() => confetti?.(), 200);
      }
      return {
        nav: false, back: false,
        html: `<div class="ls-end ${passed ? "ok" : "ko"}">
          <div class="ls-score"><b>${h}</b><span>/${ch.quiz.length}</span></div>
          <h2>${passed ? (h === ch.quiz.length ? "Capítol superat amb un ple!" : "Capítol superat!") : "Gairebé!"}</h2>
          <p>${passed ? "Ja ho tens. " : `Necessites 2 encerts per superar-lo. Repassa'l i torna-ho a provar. `}${st.xp ? `<b class="ls-xp">+${st.xp} XP</b>` : ""}</p>
          ${ch.key ? `<div class="ls-key"><p class="kicker">El que t'has d'endur</p><ul>${ch.key.map((k) => `<li>${rich(k)}</li>`).join("")}</ul></div>` : ""}
          <div class="ls-end-btns">
            ${passed ? (nextCh ? `<a class="btn primary lg" href="#apren/${nextCh.slug}">Capítol ${nextCh.n}: ${esc(nextCh.title)} →</a>` : `<a class="btn primary lg" href="#apren/examen">Has acabat la guia! Fes l'examen →</a>`)
              : `<button class="btn primary lg" type="button" data-reread>Repassa el capítol</button>`}
            <button class="btn" type="button" data-again>Torna a fer les preguntes</button>
          </div>
          ${ch.practice ? `<a class="ls-practice" href="${ch.practice.href}"><span class="kicker">Posa-ho en pràctica</span><b>${esc(ch.practice.label)} →</b><small>${esc(ch.practice.text)}</small></a>` : ""}
          <a class="linklike ls-back" href="#apren">Tornar a l'Aprèn</a>
        </div>`,
        bind(el) {
          const again = () => { Object.keys(ans).forEach((k) => delete ans[k]); finished = false; };
          $("[data-again]", el).addEventListener("click", () => { again(); aprShellNow.go(firstQ); });
          $("[data-reread]", el)?.addEventListener("click", () => { again(); aprShellNow.go(1); });
        },
      };
    },
    next(st, i) {
      if (st.kind === "intro") return { label: resumable ? "Comença des del principi" : "Comença", ok: true };
      if (st.kind === "q") return { label: i + 1 < steps.length - 1 ? "Continua" : "Veure el resultat", ok: ans[st.qi]?.k !== undefined };
      return { label: i + 1 === firstQ ? "A les preguntes" : "Continua", ok: true };
    },
    onShow(i) {
      // Es recorda fins on s'ha llegit, per continuar-hi
      if (steps[i].kind === "content" && i > aprStepAt(ch)) { learnData()[aprStepKey(ch)] = i; Progress.save(); }
    },
  });
}

// ---------- Els essencials en 5 minuts ----------
function renderEssencials() {
  const root = $("#ap-chapter");
  const steps = [{ kind: "intro" }, ...AP_CHAPTERS.map((ch) => ({ kind: "card", ch })), { kind: "end" }];
  aprShell(root, {
    tone: "#3554ff", steps,
    render(st) {
      if (st.kind === "intro") return { html: `<div class="ls-intro">
        <div class="ls-art ls-art-big" aria-hidden="true">⚡</div>
        <p class="kicker">Guia del 29N · ${AP_CHAPTERS.length} targetes</p>
        <h1 class="ls-title">Els essencials en 5 minuts</h1>
        <p class="ls-lead">El més important de cada capítol, en tres frases. Llisca o prem «Següent». Si alguna cosa t'interessa, entra al capítol sencer.</p>
      </div>` };
      if (st.kind === "card") {
        const ch = st.ch;
        return { html: `<article class="ls-ess" style="--tone:${ch.tone}">
          <div class="ls-ess-art">${ch.art}</div>
          <p class="kicker">Capítol ${ch.n} · Part ${ch.block.n}: ${esc(ch.block.title)}</p>
          <h2 class="ls-h">${esc(ch.title)}</h2>
          <ul class="ls-ess-list">${(ch.key || [ch.short]).map((k) => `<li>${rich(k)}</li>`).join("")}</ul>
          <a class="ls-ess-more" href="#apren/${ch.slug}">Llegeix el capítol (${ch.mins} min) →</a>
        </article>` };
      }
      aprSave({ ess: Date.now() });
      return { nav: false, html: `<div class="ls-end ok">
        <div class="ls-score ls-score-ico">✓</div>
        <h2>Ja tens el més important!</h2>
        <p>Ara ja saps el bàsic de les eleccions del 29N. Vols comprovar-ho o anar més a fons?</p>
        <div class="ls-end-btns"><a class="btn primary lg" href="#apren/examen">Fes l'examen final</a><a class="btn" href="#apren/${aprNext()?.slug || AP_CHAPTERS[0].slug}">Comença la guia</a></div>
        <a class="linklike ls-back" href="#apren">Tornar a l'Aprèn</a>
      </div>` };
    },
    next(st, i) { return { label: st.kind === "intro" ? "Comença" : i === steps.length - 2 ? "Acaba" : "Següent", ok: true }; },
  });
}

// ---------- Repàs: les preguntes que has fallat, fins que les encertis ----------
function renderRepas() {
  const root = $("#ap-chapter");
  const pool = shuffle(aprMiss().map(aprQuestion).filter(Boolean)).slice(0, 6);
  if (!pool.length) {
    document.body.classList.remove("lesson");
    root.style.setProperty("--tone", "#0f9d58");
    root.innerHTML = `<div class="ls"><div class="ls-end ok">
      <div class="ls-score ls-score-ico">✓</div><h2>No tens res per repassar</h2>
      <p>Aquí hi sortiran les preguntes que fallis als capítols i a l'examen, fins que les encertis.</p>
      <div class="ls-end-btns"><a class="btn primary lg" href="#apren">Tornar a l'Aprèn</a></div></div></div>`;
    return;
  }
  const ans = {};
  const steps = [...pool.map((p) => ({ kind: "q", ...p })), { kind: "end" }];
  aprShell(root, {
    tone: "#0f9d58", steps,
    render(st, i) {
      if (st.kind === "q") {
        const a = (ans[i] ||= { order: shuffle(st.q.opts.map((_, k) => k)) });
        return {
          html: `${aprQuestionHtml(st.q, a, `Repàs · ${esc(st.ch.title)}`)}<a class="ls-ess-more" href="#apren/${st.ch.slug}">Torna al capítol ${st.ch.n} →</a>`,
          bind(el) { aprBindQuestion(el, st.q, a, (ok) => { aprMissSet(st.id, !ok); aprShellNow.refresh(); }); },
        };
      }
      const h = Object.values(ans).filter((a) => a.k === 0).length, left = aprMiss().length;
      if (h === pool.length) setTimeout(() => confetti?.(), 200);
      return { nav: false, back: false, html: `<div class="ls-end ${h === pool.length ? "ok" : "ko"}">
        <div class="ls-score"><b>${h}</b><span>/${pool.length}</span></div>
        <h2>${h === pool.length ? "Repàs perfecte!" : "Bon repàs"}</h2>
        <p>${left ? `Et queden <b>${left}</b> ${left === 1 ? "pregunta" : "preguntes"} per repassar.` : "Ja no et queda cap pregunta per repassar."}</p>
        <div class="ls-end-btns">${left ? `<a class="btn primary lg" href="#apren/repas" data-repas-again>Continua repassant</a>` : ""}<a class="btn ${left ? "" : "primary lg"}" href="#apren">Tornar a l'Aprèn</a></div>
      </div>`, bind(el) { $("[data-repas-again]", el)?.addEventListener("click", (e) => { e.preventDefault(); renderRepas(); }); } };
    },
    next(st, i) { return { label: i === steps.length - 2 ? "Veure el resultat" : "Continua", ok: ans[i]?.k !== undefined }; },
  });
}

// ---------- El meu pla per votar ----------
// Quatre preguntes i una llista personal de passos amb dates, que es pot desar al calendari del mòbil (.ics)
const APR_PLAN_Q = [
  { k: "lloc", q: "On seràs el 29 de novembre?", opts: [["casa", "A Espanya, on visc"], ["fora", "Visc a l'estranger"], ["temporal", "Fora temporalment (viatge, Erasmus…)"]] },
  { k: "com", q: "Com vols votar?", opts: [["mesa", "Al meu col·legi electoral"], ["correu", "Per correu"]], when: (a) => a.lloc === "casa" },
  { k: "feina", q: "Treballes el diumenge 29?", opts: [["si", "Sí"], ["no", "No"]], when: (a) => a.lloc === "casa" && a.com === "mesa" },
  { k: "vista", q: "Tens alguna discapacitat visual?", opts: [["no", "No"], ["si", "Sí"]] },
];
const aprD = (s) => new Date(`${s}T12:00:00+01:00`).getTime();
function aprPlanItems(a) {
  const L = [];
  const add = (id, date, title, text, link) => L.push({ id, date: date ? aprD(date) : null, title, text, link });
  if (a.lloc === "fora") {
    add("cera-correu", "2026-11-24", "Envia el vot per correu", "Si votes des de l'estranger per correu, l'has d'enviar com a molt tard el 24 de novembre.", "#apren/qui-vota");
    add("cera-consolat", "2026-11-26", "O diposita'l al consolat", "Del 21 al 26 de novembre pots portar el vot al consolat o l'ambaixada on estàs inscrit.", "#apren/qui-vota");
  } else if (a.lloc === "temporal") {
    add("erta", "2026-10-31", "Sol·licitud per votar des de fora", "Si ets temporalment a l'estranger, calia demanar-ho fins al 31 d'octubre. Si no ho vas fer, consulta la teva situació a l'Oficina del Cens Electoral (INE).", "#apren/qui-vota");
  } else {
    add("cens", "2026-10-19", "Comprova que ets al cens", "El termini per consultar el cens i reclamar va ser del 12 al 19 d'octubre.", "#apren/qui-vota");
    if (a.com === "correu") {
      add("correu-demana", "2026-11-19", "Demana el vot per correu", "A qualsevol oficina de Correus amb el DNI, o per internet amb certificat digital o DNI electrònic.", "#apren/qui-vota");
      add("correu-envia", "2026-11-25", "Envia el vot per correu", "Quan rebis les paperetes a casa, posa la del Congrés i la del Senat als sobres i envia-ho per correu certificat (és gratuït).", "#apren/qui-vota");
      add("correu-avis", "2026-11-25", "Ja no podràs votar en persona", "Si demanes el vot per correu, el 29 no el podràs fer al col·legi.");
    } else {
      add("targeta", "2026-11-02", "Mira on et toca votar", "La targeta censal arriba a casa a partir del 2 de novembre i diu el col·legi i la mesa. Si no la reps, ho pots consultar al web de l'INE.", "#apren/qui-vota");
      if (a.feina === "si") add("permis", "2026-11-27", "Demana el permís per anar a votar", "Si el teu horari coincideix amb el de votació, tens dret a un permís retribuït de fins a quatre hores. Parla-ho amb l'empresa abans.", "#apren/qui-vota");
      add("document", "2026-11-28", "Prepara el document", "L'original del DNI, el passaport o el carnet de conduir, amb fotografia. La targeta censal no cal.", "#apren/dia-d");
    }
  }
  if (a.vista === "si") add("braille", "2026-11-02", "Vot accessible", "El kit en braille es demanava fins al 2 de novembre. A la mesa també pots votar amb l'ajuda d'una persona de confiança.", "#apren/qui-vota");
  add("decideix", "2026-11-27", "Decideix el teu vot", "La campanya acaba el divendres 27 a mitjanit. Compara les propostes dels partits tema a tema.", "#apren/partits");
  add("reflexio", "2026-11-28", "Jornada de reflexió", "Dissabte 28 no es pot fer campanya ni publicar enquestes.", "#apren/campanya");
  if (a.lloc === "casa" && a.com !== "correu") add("vota", "2026-11-29", "Vota!", "Diumenge 29 de novembre, de 9 a 20 h. Dues paperetes: la blanca per al Congrés i la sèpia per al Senat.", "#apren/dia-d");
  add("nit", "2026-11-29", "Nit electoral", "A partir de les 20 h, segueix l'escrutini en directe a Política en Joc.", "#nit");
  return L.sort((x, y) => (x.date ?? 0) - (y.date ?? 0));
}
function aprIcs(items) {
  const z = (n) => String(n).padStart(2, "0");
  const day = (t) => { const d = new Date(t); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}`; };
  const txt = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ev = items.filter((x) => x.date && x.date > Date.now() - 864e5).map((x) => {
    const d = day(x.date);
    const timed = x.id === "vota" ? ["DTSTART:20261129T080000Z", "DTEND:20261129T190000Z"] : x.id === "nit" ? ["DTSTART:20261129T190000Z", "DTEND:20261129T230000Z"] : [`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${day(x.date + 864e5)}`];
    return ["BEGIN:VEVENT", `UID:${x.id}-29n@politicaenjoc.cat`, `DTSTAMP:${now}`, ...timed, `SUMMARY:${txt(`29N · ${x.title}`)}`, `DESCRIPTION:${txt(x.text)}`, "BEGIN:VALARM", "TRIGGER:-PT12H", "ACTION:DISPLAY", `DESCRIPTION:${txt(x.title)}`, "END:VALARM", "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Politica en Joc//Pla per votar//CA", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
}
function renderPla() {
  const root = $("#ap-chapter");
  document.body.classList.remove("lesson");
  root.style.setProperty("--tone", "#ff4b2b");
  const P = aprLocal().plan || {};
  const a = P.a || {};
  const qs = APR_PLAN_Q.filter((q) => !q.when || q.when(a));
  const pending = qs.find((q) => !a[q.k]);
  if (pending || P.edit) {
    const q = P.edit ? qs[0] : pending;
    const qi = qs.indexOf(q);
    root.innerHTML = `<div class="pla">
      <nav class="ap-crumb"><a href="#apren">← Aprèn</a><span>El meu pla per votar</span></nav>
      <div class="pla-q card">
        <div class="ls-bar" aria-hidden="true">${APR_PLAN_Q.map((_, k) => `<i class="${k < qi ? "done" : k === qi ? "on" : ""}"></i>`).join("")}</div>
        <p class="kicker">El meu pla per votar · pregunta ${qi + 1}</p>
        <h1 class="ls-qh">${esc(q.q)}</h1>
        <div class="pla-opts">${q.opts.map(([v, t]) => `<button type="button" class="pla-opt ${a[q.k] === v ? "on" : ""}" data-v="${v}">${esc(t)}</button>`).join("")}</div>
        <p class="muted">Només ho guardem en aquest dispositiu.</p>
      </div>
    </div>`;
    $$("[data-v]", root).forEach((b) => b.addEventListener("click", () => {
      Sfx.play("pick");
      const na = { ...a, [q.k]: b.dataset.v };
      // Si canvia una resposta, les que en depenen es tornen a preguntar
      APR_PLAN_Q.slice(APR_PLAN_Q.indexOf(q) + 1).forEach((x) => { if (x.when && !x.when(na)) delete na[x.k]; else if (P.edit) delete na[x.k]; });
      aprSave({ plan: { ...P, a: na, edit: false } });
      renderPla();
    }));
    return;
  }
  const items = aprPlanItems(a);
  const done = P.done || {};
  const now = Date.now();
  const rel = (t) => { const d = Math.round((t - now) / 864e5); return d === 0 ? "avui" : d === 1 ? "demà" : d > 1 ? `d'aquí ${d} dies` : d === -1 ? "ahir" : `fa ${-d} dies`; };
  const nextItem = items.find((x) => x.date && x.date >= now - 432e5 && !done[x.id]);
  root.innerHTML = `<div class="pla">
    <nav class="ap-crumb"><a href="#apren">← Aprèn</a><span>El meu pla per votar</span></nav>
    <header class="pla-head">
      <p class="kicker">El meu pla per votar</p>
      <h1 class="ap-title">${a.lloc === "casa" && a.com !== "correu" ? "Votes al col·legi el 29N" : a.lloc === "casa" ? "Votes per correu" : a.lloc === "fora" ? "Votes des de l'estranger" : "Votes des de fora, temporalment"}</h1>
      ${nextItem ? `<p class="pla-next">Proper pas: <b>${esc(nextItem.title)}</b> · ${new Date(nextItem.date).toLocaleDateString("ca-ES", { day: "numeric", month: "long" })} (${rel(nextItem.date)})</p>` : ""}
      <div class="row"><button class="btn primary" type="button" data-ics>📅 Desa-ho al calendari</button><button class="btn ghost" type="button" data-edit>Canvia les respostes</button></div>
    </header>
    <ol class="pla-list">${items.map((x) => {
      const past = x.date && x.date < now - 432e5;
      return `<li class="pla-item ${done[x.id] ? "done" : ""} ${past ? "past" : ""}">
        <label class="pla-check"><input type="checkbox" data-done="${x.id}" ${done[x.id] ? "checked" : ""}><span aria-hidden="true"></span></label>
        <div><span class="pla-date">${x.date ? `${new Date(x.date).toLocaleDateString("ca-ES", { weekday: "short", day: "numeric", month: "short" })} · ${past ? "passat" : rel(x.date)}` : "Important"}</span>
        <b>${esc(x.title)}</b><p>${esc(x.text)}</p>${x.link ? `<a href="${x.link}">Més informació →</a>` : ""}</div>
      </li>`;
    }).join("")}</ol>
    <p class="muted pla-note">Dates del calendari oficial de les eleccions generals del 29 de novembre del 2026. En cas de dubte, mana la informació de la Junta Electoral i de l'INE.</p>
  </div>`;
  $$("[data-done]", root).forEach((c) => c.addEventListener("change", () => { aprSave({ plan: { ...P, done: { ...done, [c.dataset.done]: c.checked } } }); renderPla(); }));
  $("[data-edit]", root).addEventListener("click", () => { aprSave({ plan: { ...P, edit: true } }); renderPla(); });
  $("[data-ics]", root).addEventListener("click", () => {
    const blob = new Blob([aprIcs(items)], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pla-per-votar-29n.ics";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    toast("Obre el fitxer per afegir les dates al calendari");
  });
}


// ---------- Portada de l'Aprèn ----------
// Ordre fix: capçalera amb el progrés · cercador · la guia (4 parts) · per al 29N · eines · repassa · preguntes freqüents
function renderAprenRoute() {
  document.body.classList.remove("lesson");
  const hub = $("#ap-hub");
  const total = AP_CHAPTERS.length, passed = AP_CHAPTERS.filter(chapterPassed).length;
  const mins = AP_CHAPTERS.reduce((t, c) => t + c.mins, 0);
  const next = aprNext();
  const at = next ? aprStepAt(next) : 0;
  const nSteps = next ? aprSteps(next).filter((s) => s.kind === "content").length : 0;
  const days = Math.max(0, Math.ceil((ELECTION_DATE - Date.now()) / 864e5));
  const plan = aprLocal().plan;
  const planItems = plan?.a?.lloc ? aprPlanItems(plan.a) : null;
  const planNext = planItems?.find((x) => x.date && x.date >= Date.now() - 432e5 && !plan.done?.[x.id]);
  const miss = aprMiss().length;
  const exam = learnData()._exam;
  const word = GLOSSARY[hashString(todayKey()) % GLOSSARY.length];
  const short = (t) => new Date(t).toLocaleDateString("ca-ES", { day: "numeric", month: "short" });
  const chState = (c) => {
    const s = aprState(c);
    return s === "ok" ? `Superat · ${learnData()[c.slug]}/3` : s === "retry" ? "Per repetir" : s === "go" ? `Començat · pas ${aprStepAt(c)} de ${aprSteps(c).filter((x) => x.kind === "content").length}` : `${c.mins} min`;
  };
  const go = next
    ? `<a class="btn primary lg" href="#apren/${next.slug}">${passed || at ? "Continua" : "Comença"}: ${next.n}. ${esc(next.title)} →</a>
       <small>${aprState(next) === "go" ? `Pas ${at} de ${nSteps}` : aprState(next) === "retry" ? "Et falta superar les preguntes" : `${next.mins} min`}</small>`
    : `<a class="btn primary lg" href="#apren/examen">Has acabat la guia: fes l'examen →</a>`;
  hub.innerHTML = `
    <header class="apx-head">
      <div>
        <p class="kicker">Guia del 29N</p>
        <h1 class="page-title">Aprèn</h1>
        <p class="lede">Tot el que cal saber per votar amb criteri, explicat en ${total} capítols curts.</p>
      </div>
      <div class="apx-prog card">
        <div class="apx-prog-top"><span><b>${passed} de ${total}</b> capítols superats</span><span class="apx-days">${days ? `Falten ${days} ${days === 1 ? "dia" : "dies"} per votar` : "Avui es vota"}</span></div>
        <div class="apx-bar" role="progressbar" aria-valuenow="${passed}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${(passed / total) * 100}%"></i></div>
        <div class="apx-prog-go">${go}</div>
      </div>
    </header>

    <div class="ap-search apx-search">
      <label class="dict-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Cerca a la guia: vot per correu, Hondt, investidura…" aria-label="Cerca a la guia"></label>
      <div class="ap-search-res" aria-live="polite"></div>
    </div>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">La guia</h2><span>${total} capítols en ${AP_BLOCKS.length} parts · ${mins} min</span></div>
      <div class="apx-parts">${AP_BLOCKS.map((b) => {
        const ok = b.chapters.filter(chapterPassed).length;
        return `<article class="apx-part ${ok === b.chapters.length ? "done" : ""}" style="--tone:${b.tone}">
          <header>
            <span class="apx-part-n">${b.n}</span>
            <div><small>Part ${b.n} · ${esc(b.q)}</small><h3>${esc(b.title)}</h3></div>
            <span class="apx-part-p">${ok}/${b.chapters.length}</span>
          </header>
          <ol class="apx-chs">${b.chapters.map((c) => `<li>
            <a class="apx-ch st-${aprState(c)} ${c === next ? "is-next" : ""}" href="#apren/${c.slug}">
              <span class="apx-ch-n" aria-hidden="true">${aprState(c) === "ok" ? "✓" : c.n}</span>
              <span class="apx-ch-t"><b>${esc(c.title)}</b><small>${chState(c)}</small></span>
              <span class="apx-ch-go" aria-hidden="true">${c === next ? "Ara" : "→"}</span>
            </a></li>`).join("")}</ol>
        </article>`;
      }).join("")}</div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Per al 29N</h2></div>
      <div class="apx-two">
        <a class="apx-card apx-plan" href="#apren/pla">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/>`)}</span>
          <span class="apx-card-t"><b>El meu pla per votar</b><small>${planNext ? `Proper pas: ${esc(planNext.title)} · ${short(planNext.date)}` : planItems ? "El teu pla està al dia." : "Respon 4 preguntes i et diem què has de fer i quan."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
        <a class="apx-card" href="#apren/essencials">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`)}</span>
          <span class="apx-card-t"><b>Els essencials en 5 minuts</b><small>El més important de cada capítol, en ${total} targetes.</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Eines</h2></div>
      <div class="apx-tools">${AP_TOOLS.map((t) => `<a class="apx-tool" href="${t.href || `#apren/${t.slug}`}" style="--tone:${t.tone}">
        <span class="ap-tool-ico">${apIcon(t.icon)}</span><span><b>${esc(t.title)}</b><small>${esc(t.text)}</small></span></a>`).join("")}</div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Repassa</h2></div>
      <div class="apx-two">
        <a class="apx-card" href="#apren/examen">
          <span class="apx-ico apx-ico-txt" aria-hidden="true">A+</span>
          <span class="apx-card-t"><b>Examen final</b><small>${exam !== undefined ? `10 preguntes de tota la guia. El teu millor resultat: ${exam}/10.` : "10 preguntes barrejades de tota la guia."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
        <a class="apx-card ${miss ? "" : "off"}" href="#apren/repas">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M3 12a9 9 0 0115.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>`)}</span>
          <span class="apx-card-t"><b>Repàs de les errades</b><small>${miss ? `${miss} ${miss === 1 ? "pregunta" : "preguntes"} que has fallat, per tornar-hi.` : "Aquí hi sortiran les preguntes que fallis."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
      </div>
      <a class="apx-word" href="#apren/diccionari">
        <span class="kicker">Paraula del dia</span>
        <b>${esc(apTermName(word.w))}</b>
        <span>${esc(word.d)}</span>
        <small>Tots els conceptes al diccionari (${GLOSSARY.length}) →</small>
      </a>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Preguntes freqüents</h2></div>
      <div class="apx-faq">${AP_FAQ.map(([q, a, slug], i) => `<details class="apx-faq-i" ${i >= 6 ? "hidden" : ""}>
        <summary>${esc(q)}</summary>
        <div><p>${rich(a)}</p><a href="#apren/${slug}">Ho expliquem al capítol ${AP_CHAPTERS.find((c) => c.slug === slug)?.n}: ${esc(AP_CHAPTERS.find((c) => c.slug === slug)?.title || "")} →</a></div>
      </details>`).join("")}</div>
      ${AP_FAQ.length > 6 ? `<button class="btn ghost apx-faq-more" type="button" data-faq-more>Mostra-les totes (${AP_FAQ.length})</button>` : ""}
    </section>`;
  mountAprenSearch($(".ap-search", hub));
  $("[data-faq-more]", hub)?.addEventListener("click", (e) => { $$(".apx-faq-i[hidden]", hub).forEach((d) => { d.hidden = false; }); e.currentTarget.remove(); });
}
