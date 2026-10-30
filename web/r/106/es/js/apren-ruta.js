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

// ---------- Visor d'històries (capítol, essencials, repàs) ----------
// Pantalla vertical a tota la pantalla: barres per pas que s'omplen al ritme de lectura, toc a la dreta per avançar
// i a l'esquerra per tornar, mantenir premut per aturar-ho. Les portades (cover) van a tota pantalla amb el color del capítol.
// cfg: { tone, steps, start, exit, who: { badge, title, sub }, auto, render(step, i) → { html, bind?(el), nav?, back?, cover?, tone?, who?, timer? },
//        next(step, i) → { label, ok }, onShow(i) }
// auto: en acabar la barra passa sol al pas següent (essencials). Si no, el botó «Continua» avisa que ja es pot passar.
let aprShellNow = null;
const APR_NOTAP = "a,button,input,select,textarea,label,summary,details,.ap-w,.term,.choice,.ls-key,[contenteditable]";
function aprShell(root, cfg) {
  const S = { ...cfg, i: -1 };
  aprShellNow = S;
  document.body.classList.add("lesson");
  root.style.setProperty("--tone", cfg.tone);
  const exit = cfg.exit || "#apren";
  const chev = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  root.innerHTML = `<div class="ls sv">
    <button class="sv-arrow" type="button" data-arrow="-1" aria-label="Paso anterior">${chev("M15 5l-7 7 7 7")}</button>
    <div class="sv-frame">
      <div class="sv-bars" aria-hidden="true">${cfg.steps.map(() => "<i><b></b></i>").join("")}</div>
      <header class="sv-top">
        <span class="sv-av" aria-hidden="true"></span>
        <span class="sv-who"><b></b><small></small></span>
        <button class="sv-btn" type="button" data-pause aria-label="Pausa">${chev("M9 6v12M15 6v12")}</button>
        <a class="sv-btn ls-x" href="${exit}" aria-label="Salir">${chev("M6 6l12 12M18 6L6 18")}</a>
      </header>
      <span class="ls-n sr-only" aria-live="polite"></span>
      <div class="ls-stage"></div>
      <footer class="ls-nav">
        <button class="btn ghost ls-prev" type="button" data-prev aria-label="Paso anterior">←</button>
        <button class="btn primary lg ls-next" type="button" data-next>Continúa</button>
      </footer>
    </div>
    <button class="sv-arrow" type="button" data-arrow="1" aria-label="Paso siguiente">${chev("M9 5l7 7-7 7")}</button>
  </div>`;
  const sv = $(".sv", root), frame = $(".sv-frame", root), stage = $(".ls-stage", root), nav = $(".ls-nav", root);
  const prev = $("[data-prev]", root), next = $("[data-next]", root), pauseBtn = $("[data-pause]", root);
  const canNext = () => !next.disabled && !nav.hidden;
  const canPrev = () => !prev.disabled;
  S.go = (i, dir = 1) => {
    if (i < 0 || i >= S.steps.length) return;
    S.i = i;
    const st = S.steps[i];
    const r = S.render(st, i);
    stage.innerHTML = `<div class="ls-step ${dir < 0 ? "back" : ""}">${r.html}</div>`;
    stage.scrollTop = 0;
    r.bind?.($(".ls-step", stage));
    frame.classList.toggle("cover", !!r.cover);
    frame.classList.remove("ready");
    frame.style.setProperty("--tone", r.tone || cfg.tone);
    const who = r.who || cfg.who || {};
    $(".sv-av", root).innerHTML = who.badge ?? "";
    $(".sv-who b", root).textContent = who.title || "";
    $(".sv-who small", root).textContent = who.sub || `${i + 1} de ${S.steps.length}`;
    // Barra: les anteriors plenes; l'actual s'omple en el temps que costa llegir el pas (o queda plena si no en té)
    const words = ($(".ls-step", stage).textContent.match(/\S+/g) || []).length;
    const secs = r.timer === false ? 0 : Math.round(Math.min(45, Math.max(cfg.auto ? 6 : 5, words / 3.2)));
    $$(".sv-bars i", root).forEach((b, k) => {
      b.className = k < i ? "done" : k === i ? (secs ? "cur" : "done") : "";
      b.style.removeProperty("--dur");
      if (k === i && secs) b.style.setProperty("--dur", `${secs}s`);
    });
    // Reinicia l'animació de la barra actual
    const curB = $(".sv-bars i.cur b", root);
    if (curB) { curB.style.animation = "none"; void curB.offsetWidth; curB.style.animation = ""; }
    $(".ls-n", root).textContent = `${i + 1}/${S.steps.length}`;
    nav.hidden = r.nav === false;
    prev.disabled = i === 0 || r.back === false;
    S.refresh();
    S.onShow?.(i);
  };
  S.refresh = () => {
    const n = S.next(S.steps[S.i], S.i);
    next.textContent = n.label;
    next.disabled = !n.ok;
    $$(".sv-arrow", root).forEach((a) => { a.disabled = a.dataset.arrow === "1" ? !canNext() : !canPrev(); });
  };
  // La barra s'ha omplert
  $(".sv-bars", root).addEventListener("animationend", () => {
    if (cfg.auto && canNext() && !sv.classList.contains("paused")) next.click();
    else frame.classList.add("ready");
  });
  next.addEventListener("click", () => { Sfx.play("pick"); S.go(S.i + 1); });
  prev.addEventListener("click", () => S.go(S.i - 1, -1));
  $$(".sv-arrow", root).forEach((a) => a.addEventListener("click", () => (a.dataset.arrow === "1" ? canNext() && next.click() : canPrev() && prev.click())));
  // Aturar i reprendre (botó, o mantenir premut)
  S.pause = (on) => {
    sv.classList.toggle("paused", on);
    pauseBtn.setAttribute("aria-label", on ? "Continúa" : "Pausa");
    pauseBtn.innerHTML = on ? chev("M8 5l11 7-11 7z") : chev("M9 6v12M15 6v12");
  };
  pauseBtn.addEventListener("click", () => S.pause(!sv.classList.contains("paused")));
  let holdT = null, held = false;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button || e.target.closest(APR_NOTAP)) return;
    held = false;
    holdT = setTimeout(() => { held = true; sv.classList.add("hold"); }, 260);
  });
  const release = () => { clearTimeout(holdT); sv.classList.remove("hold"); };
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => stage.addEventListener(ev, release));
  // Tocar: terç esquerre enrere, la resta endavant (fora dels controls, i no si s'està seleccionant text)
  stage.addEventListener("click", (e) => {
    if (held) { held = false; return; }
    if (e.target.closest(APR_NOTAP) || String(getSelection?.() || "").trim()) return;
    const r = frame.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) { if (canPrev()) prev.click(); }
    else if (canNext()) next.click();
  });
  // Lliscar amb el dit (fora de botons i controls)
  let x0 = null, y0 = 0;
  stage.addEventListener("touchstart", (e) => { if (e.target.closest("input,button,select,textarea,a,.ap-w")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
    held = true; // que el toc que acompanya el gest no torni a avançar
    if (dx < 0 && canNext()) next.click();
    if (dx > 0 && canPrev()) prev.click();
  });
  // Clicar fora del visor (al fons fosc) el tanca
  sv.addEventListener("click", (e) => { if (e.target === sv) location.hash = exit; });
  S.go(cfg.start || 0);
  return S;
}
// Pestanya amagada: s'atura la barra
document.addEventListener("visibilitychange", () => { if (document.hidden && aprShellNow && document.body.classList.contains("lesson")) aprShellNow.pause(true); });
// Teclat: fletxes per avançar i tornar enrere, espai per aturar, Esc per sortir
window.addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("lesson") || e.target.closest?.("input,textarea,select") || e.altKey || e.ctrlKey || e.metaKey) return;
  const root = $("#ap-chapter");
  if (!root || root.hidden || !$(".sv", root)) return;
  if (e.key === "Escape") { if (!$(".term-pop")) location.hash = $(".ls-x", root).getAttribute("href"); return; }
  if (e.key === " " && !e.target.closest?.("button,a")) { e.preventDefault(); aprShellNow?.pause(!$(".sv", root).classList.contains("paused")); return; }
  if (e.key === "ArrowRight") { const b = $("[data-next]", root); if (b && !b.disabled && !$(".ls-nav", root).hidden) { e.preventDefault(); b.click(); } }
  if (e.key === "ArrowLeft") { const b = $("[data-prev]", root); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
}, true);
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
const aprExplain = (q, ok) => `<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong>${ok ? "¡Correcto!" : "No del todo"}</strong><span>${rich(q.exp)}</span></div>`;
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
    who: { badge: ch.n, title: ch.title, sub: `Parte ${ch.block.n} · ${ch.block.title}` },
    render(st, i) {
      if (st.kind === "intro") return {
        cover: true, timer: false,
        html: `<div class="ls-intro">
          <div class="ls-art">${ch.art}</div>
          <p class="kicker">Capítulo ${ch.n} de ${AP_CHAPTERS.length}</p>
          <h1 class="ls-title">${esc(ch.title)}</h1>
          <p class="ls-lead">${rich(ch.lead)}</p>
          ${ch.key ? `<div class="ls-key"><p class="kicker">En 30 segundos</p><ul>${ch.key.map((k) => `<li>${rich(k)}</li>`).join("")}</ul></div>` : ""}
          <p class="ls-meta"><span>⏱ ${ch.mins} min</span><span>${firstQ - 1} pasos</span><span>${ch.quiz.length} preguntas</span>${aprState(ch) === "ok" ? `<span class="ok">✓ Superado (${learnData()[ch.slug]}/${ch.quiz.length})</span>` : ""}</p>
          ${resumable ? `<button class="btn primary lg ls-resume" type="button" data-resume>Sigue por el paso ${saved} de ${firstQ - 1} →</button>` : ""}
          <p class="ls-alt"><button class="linklike" type="button" data-skip>Ya lo sé: ve a las preguntas</button> · <a href="#apren/${ch.slug}/tot">Léelo todo seguido</a></p>
        </div>`,
        bind(el) {
          $("[data-resume]", el)?.addEventListener("click", () => aprShellNow.go(saved));
          $("[data-skip]", el).addEventListener("click", () => aprShellNow.go(firstQ));
        },
      };
      if (st.kind === "content") {
        const n = i, total = firstQ - 1;
        return {
          who: { badge: ch.n, title: ch.title, sub: `Paso ${n} de ${total} · ${ch.mins} min` },
          html: `<div class="ls-content">
            <p class="kicker">Paso ${n} de ${total}</p>
            ${st.title ? `<h2 class="ls-h">${esc(st.title)}</h2>` : ""}
            <div class="ap-body">${st.blocks.map((b, k) => renderBlock(b, `${i}-${k}`)).join("")}</div>
          </div>`,
          bind: aprMountBlocks,
        };
      }
      if (st.kind === "q") {
        const a = (ans[st.qi] ||= { order: shuffle(st.q.opts.map((_, k) => k)) });
        return {
          timer: false, who: { badge: "?", title: ch.title, sub: `Pregunta ${st.qi + 1} de ${ch.quiz.length}` },
          html: aprQuestionHtml(st.q, a, `Compruébalo · pregunta ${st.qi + 1} de ${ch.quiz.length}`),
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
        nav: false, back: false, cover: true, timer: false,
        html: `<div class="ls-end ${passed ? "ok" : "ko"}">
          <div class="ls-score"><b>${h}</b><span>/${ch.quiz.length}</span></div>
          <h2>${passed ? (h === ch.quiz.length ? "¡Capítulo superado con pleno!" : "¡Capítulo superado!") : "¡Casi!"}</h2>
          <p>${passed ? "Ya lo tienes. " : `Necesitas 2 aciertos para superarlo. Repásalo y vuelve a intentarlo. `}${st.xp ? `<b class="ls-xp">+${st.xp} XP</b>` : ""}</p>
          ${ch.key ? `<div class="ls-key"><p class="kicker">Lo que te tienes que llevar</p><ul>${ch.key.map((k) => `<li>${rich(k)}</li>`).join("")}</ul></div>` : ""}
          <div class="ls-end-btns">
            ${passed ? (nextCh ? `<a class="btn primary lg" href="#apren/${nextCh.slug}">Capítulo ${nextCh.n}: ${esc(nextCh.title)} →</a>` : `<a class="btn primary lg" href="#apren/examen">¡Has acabado la guía! Haz el examen →</a>`)
              : `<button class="btn primary lg" type="button" data-reread>Repasa el capítulo</button>`}
            <button class="btn" type="button" data-again>Vuelve a hacer las preguntas</button>
          </div>
          ${ch.practice ? `<a class="ls-practice" href="${ch.practice.href}"><span class="kicker">Ponlo en práctica</span><b>${esc(ch.practice.label)} →</b><small>${esc(ch.practice.text)}</small></a>` : ""}
          <a class="linklike ls-back" href="#apren">Volver a Aprende</a>
        </div>`,
        bind(el) {
          const again = () => { Object.keys(ans).forEach((k) => delete ans[k]); finished = false; };
          $("[data-again]", el).addEventListener("click", () => { again(); aprShellNow.go(firstQ); });
          $("[data-reread]", el)?.addEventListener("click", () => { again(); aprShellNow.go(1); });
        },
      };
    },
    next(st, i) {
      if (st.kind === "intro") return { label: resumable ? "Empieza desde el principio" : "Empieza", ok: true };
      if (st.kind === "q") return { label: i + 1 < steps.length - 1 ? "Continúa" : "Ver el resultado", ok: ans[st.qi]?.k !== undefined };
      return { label: i + 1 === firstQ ? "A las preguntas" : "Continúa", ok: true };
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
    tone: "#3554ff", steps, auto: true,
    who: { badge: "⚡", title: "Lo esencial", sub: "En 5 minutos" },
    render(st) {
      if (st.kind === "intro") return { cover: true, html: `<div class="ls-intro">
        <div class="ls-art ls-art-big" aria-hidden="true">⚡</div>
        <h1 class="ls-title">Lo esencial en 5 minutos</h1>
        <p class="ls-lead">Lo más importante de cada capítulo, en tres frases. Pasan solas: toca a la derecha para avanzar, a la izquierda para volver y mantén pulsado para pararlas.</p>
      </div>` };
      if (st.kind === "card") {
        const ch = st.ch;
        return { cover: true, tone: ch.tone, who: { badge: ch.n, title: ch.title, sub: `Lo esencial · capítulo ${ch.n} de ${AP_CHAPTERS.length}` }, html: `<article class="ls-ess" style="--tone:${ch.tone}">
          <div class="ls-ess-art">${ch.art}</div>
          <p class="kicker">Capítulo ${ch.n}</p>
          <h2 class="ls-h">${esc(ch.title)}</h2>
          <ul class="ls-ess-list">${(ch.key || [ch.short]).map((k) => `<li>${rich(k)}</li>`).join("")}</ul>
          <a class="ls-ess-more" href="#apren/${ch.slug}">Lee el capítulo (${ch.mins} min) →</a>
        </article>` };
      }
      aprSave({ ess: Date.now() });
      return { nav: false, cover: true, timer: false, html: `<div class="ls-end ok">
        <div class="ls-score ls-score-ico">✓</div>
        <h2>¡Ya tienes lo más importante!</h2>
        <p>Ahora ya sabes lo básico de las elecciones del 29N. ¿Quieres comprobarlo o profundizar más?</p>
        <div class="ls-end-btns"><a class="btn primary lg" href="#apren/examen">Haz el examen final</a><a class="btn" href="#apren/${aprNext()?.slug || AP_CHAPTERS[0].slug}">Empieza la guía</a></div>
        <a class="linklike ls-back" href="#apren">Volver a Aprende</a>
      </div>` };
    },
    next(st, i) { return { label: st.kind === "intro" ? "Empieza" : i === steps.length - 2 ? "Termina" : "Siguiente", ok: true }; },
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
      <div class="ls-score ls-score-ico">✓</div><h2>No tienes nada que repasar</h2>
      <p>Aquí saldrán las preguntas que falles en los capítulos y en el examen, hasta que las aciertes.</p>
      <div class="ls-end-btns"><a class="btn primary lg" href="#apren">Volver a Aprende</a></div></div></div>`;
    return;
  }
  const ans = {};
  const steps = [...pool.map((p) => ({ kind: "q", ...p })), { kind: "end" }];
  aprShell(root, {
    tone: "#0f9d58", steps,
    who: { badge: "↻", title: "Repaso de los errores" },
    render(st, i) {
      if (st.kind === "q") {
        const a = (ans[i] ||= { order: shuffle(st.q.opts.map((_, k) => k)) });
        return {
          timer: false,
          html: `${aprQuestionHtml(st.q, a, `Repaso · ${esc(st.ch.title)}`)}<a class="ls-ess-more" href="#apren/${st.ch.slug}">Vuelve al capítulo ${st.ch.n} →</a>`,
          bind(el) { aprBindQuestion(el, st.q, a, (ok) => { aprMissSet(st.id, !ok); aprShellNow.refresh(); }); },
        };
      }
      const h = Object.values(ans).filter((a) => a.k === 0).length, left = aprMiss().length;
      if (h === pool.length) setTimeout(() => confetti?.(), 200);
      return { nav: false, back: false, cover: true, timer: false, html: `<div class="ls-end ${h === pool.length ? "ok" : "ko"}">
        <div class="ls-score"><b>${h}</b><span>/${pool.length}</span></div>
        <h2>${h === pool.length ? "¡Repaso perfecto!" : "Buen repaso"}</h2>
        <p>${left ? `Te quedan <b>${left}</b> ${left === 1 ? "pregunta" : "preguntas"} por repasar.` : "Ya no te queda ninguna pregunta por repasar."}</p>
        <div class="ls-end-btns">${left ? `<a class="btn primary lg" href="#apren/repas" data-repas-again>Sigue repasando</a>` : ""}<a class="btn ${left ? "" : "primary lg"}" href="#apren">Volver a Aprende</a></div>
      </div>`, bind(el) { $("[data-repas-again]", el)?.addEventListener("click", (e) => { e.preventDefault(); renderRepas(); }); } };
    },
    next(st, i) { return { label: i === steps.length - 2 ? "Ver el resultado" : "Continúa", ok: ans[i]?.k !== undefined }; },
  });
}

// ---------- El meu pla per votar ----------
// Quatre preguntes i una llista personal de passos amb dates, que es pot desar al calendari del mòbil (.ics)
const APR_PLAN_Q = [
  { k: "lloc", q: "¿Dónde estarás el 29 de noviembre?", opts: [["casa", "En España, donde vivo"], ["fora", "Vivo en el extranjero"], ["temporal", "Fuera temporalmente (viaje, Erasmus…)"]] },
  { k: "com", q: "¿Cómo quieres votar?", opts: [["mesa", "En mi colegio electoral"], ["correu", "Por correo"]], when: (a) => a.lloc === "casa" },
  { k: "feina", q: "¿Trabajas el domingo 29?", opts: [["si", "Sí"], ["no", "No"]], when: (a) => a.lloc === "casa" && a.com === "mesa" },
  { k: "vista", q: "¿Tienes alguna discapacidad visual?", opts: [["no", "No"], ["si", "Sí"]] },
];
const aprD = (s) => new Date(`${s}T12:00:00+01:00`).getTime();
function aprPlanItems(a) {
  const L = [];
  const add = (id, date, title, text, link) => L.push({ id, date: date ? aprD(date) : null, title, text, link });
  if (a.lloc === "fora") {
    add("cera-correu", "2026-11-24", "Envía el voto por correo", "Si votas desde el extranjero por correo, tienes que enviarlo como muy tarde el 24 de noviembre.", "#apren/qui-vota");
    add("cera-consolat", "2026-11-26", "O deposítalo en el consulado", "Del 21 al 26 de noviembre puedes llevar el voto al consulado o la embajada donde estás inscrito.", "#apren/qui-vota");
  } else if (a.lloc === "temporal") {
    add("erta", "2026-10-31", "Solicitud para votar desde fuera", "Si estás temporalmente en el extranjero, había que pedirlo hasta el 31 de octubre. Si no lo hiciste, consulta tu situación en la Oficina del Censo Electoral (INE).", "#apren/qui-vota");
  } else {
    add("cens", "2026-10-19", "Comprueba que estás en el censo", "El plazo para consultar el censo y reclamar fue del 12 al 19 de octubre.", "#apren/qui-vota");
    if (a.com === "correu") {
      add("correu-demana", "2026-11-19", "Pide el voto por correo", "En cualquier oficina de Correos con el DNI, o por internet con certificado digital o DNI electrónico.", "#apren/qui-vota");
      add("correu-envia", "2026-11-25", "Envía el voto por correo", "Cuando recibas las papeletas en casa, mete la del Congreso y la del Senado en los sobres y envíalo por correo certificado (es gratis).", "#apren/qui-vota");
      add("correu-avis", "2026-11-25", "Ya no podrás votar en persona", "Si pides el voto por correo, el 29 no podrás hacerlo en el colegio.");
    } else {
      add("targeta", "2026-11-02", "Mira dónde te toca votar", "La tarjeta censal llega a casa a partir del 2 de noviembre y dice el colegio y la mesa. Si no la recibes, lo puedes consultar en la web del INE.", "#apren/qui-vota");
      if (a.feina === "si") add("permis", "2026-11-27", "Pide el permiso para ir a votar", "Si tu horario coincide con el de votación, tienes derecho a un permiso retribuido de hasta cuatro horas. Háblalo antes con la empresa.", "#apren/qui-vota");
      add("document", "2026-11-28", "Prepara el documento", "El original del DNI, el pasaporte o el carné de conducir, con fotografía. La tarjeta censal no hace falta.", "#apren/dia-d");
    }
  }
  if (a.vista === "si") add("braille", "2026-11-02", "Voto accesible", "El kit en braille se pedía hasta el 2 de noviembre. En la mesa también puedes votar con la ayuda de una persona de confianza.", "#apren/qui-vota");
  add("decideix", "2026-11-27", "Decide tu voto", "La campaña acaba el viernes 27 a medianoche. Compara las propuestas de los partidos tema a tema.", "#apren/partits");
  add("reflexio", "2026-11-28", "Jornada de reflexión", "El sábado 28 no se puede hacer campaña ni publicar encuestas.", "#apren/campanya");
  if (a.lloc === "casa" && a.com !== "correu") add("vota", "2026-11-29", "¡Vota!", "Domingo 29 de noviembre, de 9 a 20 h. Dos papeletas: la blanca para el Congreso y la sepia para el Senado.", "#apren/dia-d");
  add("nit", "2026-11-29", "Noche electoral", "A partir de las 20 h, sigue el escrutinio en directo en Política en Joc.", "#nit");
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
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Politica en Joc//Plan para votar//ES", "CALSCALE:GREGORIAN", ...ev, "END:VCALENDAR"].join("\r\n");
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
      <div class="ap-titlerow pla-t">${apBack()}<h1 class="ap-title">Mi plan para votar</h1></div>
      <div class="pla-q card">
        <div class="ls-bar" aria-hidden="true">${APR_PLAN_Q.map((_, k) => `<i class="${k < qi ? "done" : k === qi ? "on" : ""}"></i>`).join("")}</div>
        <p class="kicker">Pregunta ${qi + 1}</p>
        <h2 class="ls-qh">${esc(q.q)}</h2>
        <div class="pla-opts">${q.opts.map(([v, t]) => `<button type="button" class="pla-opt ${a[q.k] === v ? "on" : ""}" data-v="${v}">${esc(t)}</button>`).join("")}</div>
        <p class="muted">Solo lo guardamos en este dispositivo.</p>
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
  const rel = (t) => { const d = Math.round((t - now) / 864e5); return d === 0 ? "hoy" : d === 1 ? "mañana" : d > 1 ? `dentro de ${d} días` : d === -1 ? "ayer" : `hace ${-d} días`; };
  const nextItem = items.find((x) => x.date && x.date >= now - 432e5 && !done[x.id]);
  root.innerHTML = `<div class="pla">
    <header class="pla-head">
      <div class="ap-titlerow">${apBack()}<h1 class="ap-title">${a.lloc === "casa" && a.com !== "correu" ? "Votas en el colegio el 29N" : a.lloc === "casa" ? "Votas por correo" : a.lloc === "fora" ? "Votas desde el extranjero" : "Votas desde fuera, temporalmente"}</h1></div>
      ${nextItem ? `<p class="pla-next">Próximo paso: <b>${esc(nextItem.title)}</b>, el ${new Date(nextItem.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })} (${rel(nextItem.date)})</p>` : ""}
      <div class="row"><button class="btn primary" type="button" data-ics>📅 Guárdalo en el calendario</button><button class="btn ghost" type="button" data-edit>Cambia las respuestas</button></div>
    </header>
    <ol class="pla-list">${items.map((x) => {
      const past = x.date && x.date < now - 432e5;
      return `<li class="pla-item ${done[x.id] ? "done" : ""} ${past ? "past" : ""}">
        <label class="pla-check"><input type="checkbox" data-done="${x.id}" ${done[x.id] ? "checked" : ""}><span aria-hidden="true"></span></label>
        <div><span class="pla-date">${x.date ? `${new Date(x.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · ${past ? "pasado" : rel(x.date)}` : "Importante"}</span>
        <b>${esc(x.title)}</b><p>${esc(x.text)}</p>${x.link ? `<a href="${x.link}">Más información →</a>` : ""}</div>
      </li>`;
    }).join("")}</ol>
    <p class="muted pla-note">Fechas del calendario oficial de las elecciones generales del 29 de noviembre de 2026. En caso de duda, prevalece la información de la Junta Electoral y del INE.</p>
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
    toast("Abre el archivo para añadir las fechas al calendario");
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
  const short = (t) => new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const chState = (c) => {
    const s = aprState(c);
    return s === "ok" ? `Superado · ${learnData()[c.slug]}/3` : s === "retry" ? "Para repetir" : s === "go" ? `Empezado · paso ${aprStepAt(c)} de ${aprSteps(c).filter((x) => x.kind === "content").length}` : `${c.mins} min`;
  };
  const go = next
    ? `<a class="btn primary lg" href="#apren/${next.slug}">${passed || at ? "Continúa" : "Empieza"}: ${next.n}. ${esc(next.title)} →</a>
       <small>${aprState(next) === "go" ? `Paso ${at} de ${nSteps}` : aprState(next) === "retry" ? "Te falta superar las preguntas" : `${next.mins} min`}</small>`
    : `<a class="btn primary lg" href="#apren/examen">Has acabado la guía: haz el examen →</a>`;
  hub.innerHTML = `
    <header class="apx-head">
      <div>
        <h1 class="page-title">Aprende</h1>
        <p class="lede">Todo lo que hay que saber para votar con criterio, explicado en ${total} capítulos cortos.</p>
      </div>
      <div class="apx-prog card">
        <div class="apx-prog-top"><span><b>${passed} de ${total}</b> capítulos superados</span><span class="apx-days">${days ? `Faltan ${days} ${days === 1 ? "día" : "días"} para votar` : "Hoy se vota"}</span></div>
        <div class="apx-bar" role="progressbar" aria-valuenow="${passed}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${(passed / total) * 100}%"></i></div>
        <div class="apx-prog-go">${go}</div>
      </div>
    </header>

    <nav class="apx-stories" aria-label="Capítulos">
      <a class="apx-st" href="#apren/essencials" style="--tone:#3554ff;--p:1"><span class="apx-st-ring"><span class="apx-st-in apx-st-txt">⚡</span></span><small>Lo esencial</small></a>
      ${AP_CHAPTERS.map((c) => {
        const s = aprState(c), n = aprSteps(c).filter((x) => x.kind === "content").length;
        const p = s === "go" ? Math.max(0.08, aprStepAt(c) / n) : 1;
        return `<a class="apx-st st-${s} ${c === next ? "is-next" : ""}" href="#apren/${c.slug}" style="--tone:${c.tone};--p:${p.toFixed(3)}" aria-label="Capítulo ${c.n}: ${esc(c.title)}">
          <span class="apx-st-ring"><span class="apx-st-in">${c.art}</span>${s === "ok" ? `<i class="apx-st-ok" aria-hidden="true">✓</i>` : c === next ? `<i class="apx-st-now" aria-hidden="true">Ahora</i>` : ""}</span>
          <small>${esc(c.title)}</small></a>`;
      }).join("")}
    </nav>

    <div class="ap-search apx-search">
      <label class="dict-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Busca en la guía: voto por correo, Hondt, investidura…" aria-label="Busca en la guía"></label>
      <div class="ap-search-res" aria-live="polite"></div>
    </div>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">La guía</h2><span>${total} capítulos en ${AP_BLOCKS.length} partes · ${mins} min</span></div>
      <div class="apx-parts">${AP_BLOCKS.map((b) => {
        const ok = b.chapters.filter(chapterPassed).length;
        return `<article class="apx-part ${ok === b.chapters.length ? "done" : ""}" style="--tone:${b.tone}">
          <header>
            <span class="apx-part-n">${b.n}</span>
            <div><small>Parte ${b.n} · ${esc(b.q)}</small><h3>${esc(b.title)}</h3></div>
            <span class="apx-part-p">${ok}/${b.chapters.length}</span>
          </header>
          <ol class="apx-chs">${b.chapters.map((c) => `<li>
            <a class="apx-ch st-${aprState(c)} ${c === next ? "is-next" : ""}" href="#apren/${c.slug}">
              <span class="apx-ch-n" aria-hidden="true">${aprState(c) === "ok" ? "✓" : c.n}</span>
              <span class="apx-ch-t"><b>${esc(c.title)}</b><small>${chState(c)}</small></span>
              <span class="apx-ch-go" aria-hidden="true">${c === next ? "Ahora" : "→"}</span>
            </a></li>`).join("")}</ol>
        </article>`;
      }).join("")}</div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Para el 29N</h2></div>
      <div class="apx-two">
        <a class="apx-card apx-plan" href="#apren/pla">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/>`)}</span>
          <span class="apx-card-t"><b>Mi plan para votar</b><small>${planNext ? `Próximo paso: ${esc(planNext.title)} · ${short(planNext.date)}` : planItems ? "Tu plan está al día." : "Responde 4 preguntas y te decimos qué tienes que hacer y cuándo."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
        <a class="apx-card" href="#apren/essencials">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>`)}</span>
          <span class="apx-card-t"><b>Lo esencial en 5 minutos</b><small>Lo más importante de cada capítulo, en ${total} tarjetas.</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Herramientas</h2></div>
      <div class="apx-tools">${AP_TOOLS.map((t) => `<a class="apx-tool" href="${t.href || `#apren/${t.slug}`}" style="--tone:${t.tone}">
        <span class="ap-tool-ico">${apIcon(t.icon)}</span><span><b>${esc(t.title)}</b><small>${esc(t.text)}</small></span></a>`).join("")}</div>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Repasa</h2></div>
      <div class="apx-two">
        <a class="apx-card" href="#apren/examen">
          <span class="apx-ico apx-ico-txt" aria-hidden="true">A+</span>
          <span class="apx-card-t"><b>Examen final</b><small>${exam !== undefined ? `10 preguntas de toda la guía. Tu mejor resultado: ${exam}/10.` : "10 preguntas mezcladas de toda la guía."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
        <a class="apx-card ${miss ? "" : "off"}" href="#apren/repas">
          <span class="apx-ico" aria-hidden="true">${apIcon(`<path d="M3 12a9 9 0 0115.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>`)}</span>
          <span class="apx-card-t"><b>Repaso de los errores</b><small>${miss ? `${miss} ${miss === 1 ? "pregunta" : "preguntas"} que has fallado, para volver a intentarlo.` : "Aquí saldrán las preguntas que falles."}</small></span>
          <span class="apx-go" aria-hidden="true">→</span>
        </a>
      </div>
      <a class="apx-word" href="#apren/diccionari">
        <span class="kicker">Palabra del día</span>
        <b>${esc(apTermName(word.w))}</b>
        <span>${esc(word.d)}</span>
        <small>Todos los conceptos en el diccionario (${GLOSSARY.length}) →</small>
      </a>
    </section>

    <section class="apx-sec">
      <div class="apx-sec-head"><h2 class="section-title sm">Preguntas frecuentes</h2></div>
      <div class="apx-faq">${AP_FAQ.map(([q, a, slug], i) => `<details class="apx-faq-i" ${i >= 6 ? "hidden" : ""}>
        <summary>${esc(q)}</summary>
        <div><p>${rich(a)}</p><a href="#apren/${slug}">Lo explicamos en el capítulo ${AP_CHAPTERS.find((c) => c.slug === slug)?.n}: ${esc(AP_CHAPTERS.find((c) => c.slug === slug)?.title || "")} →</a></div>
      </details>`).join("")}</div>
      ${AP_FAQ.length > 6 ? `<button class="btn ghost apx-faq-more" type="button" data-faq-more>Muéstralas todas (${AP_FAQ.length})</button>` : ""}
    </section>`;
  mountAprenSearch($(".ap-search", hub));
  // La fila d'històries comença pel capítol que toca
  const row = $(".apx-stories", hub), cur = $(".apx-st.is-next", hub);
  if (row && cur && cur.offsetLeft - row.offsetLeft + cur.offsetWidth > row.clientWidth) row.scrollLeft = Math.max(0, cur.offsetLeft - row.offsetLeft - 90);
  $("[data-faq-more]", hub)?.addEventListener("click", (e) => { $$(".apx-faq-i[hidden]", hub).forEach((d) => { d.hidden = false; }); e.currentTarget.remove(); });
}
