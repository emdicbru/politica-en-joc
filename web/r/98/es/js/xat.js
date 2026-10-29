// Xat: les peces comunes dels xats de l'app (el privat entre amics, amistat.js, i el dels equips de campanya,
// sim-pactes.js). Cada xat hi posa les seves dades i aquí es pinten els missatges i el quadre d'escriure.
//   xatRender(msgs, o)   els missatges: agrupats per persona, separadors de dia i de «missatges nous», respostes
//                        citades, reaccions, enllaços, emojis grans i «Vist»
//   xatComposer(o)       el quadre d'escriure: text que creix, emojis, frases ràpides i la resposta que preparés
//   xatBind(root, h)     les accions: enviar, respondre, reaccionar (doble toc = ❤️), copiar, esborrar, denunciar,
//                        anar al missatge citat i el botó per baixar al final
//   xatScroll(root)      després de pintar: segueix al final o compta els missatges nous que no has vist
// Missatge: { id, from, t, ts, re?: { id, t, from }, r?: { uid: emoji }, pending? }

const XAT_REACT = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
const XAT_EMOJI = "😀 😂 🤣 😊 😍 😘 😎 🤔 🙄 😅 😬 😱 😡 🥳 😴 😇 🤡 🫡 🤫 🤝 👍 👎 👏 🙌 🙏 💪 👀 🔥 ✨ 💯 ❤️ 💔 🎉 🍀 🗳️ 🏛️ 📢 📊 ⚖️ 🌹".split(" ");
const XAT_GROUP = 5 * 60 * 1000; // missatges seguits de la mateixa persona dins de 5 minuts: un sol grup
const xatLoc = () => (document.documentElement.lang === "es" ? "es-ES" : "es-ES");
const xatCoarse = () => matchMedia("(pointer: coarse)").matches;

const xatDayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
function xatDay(ts) {
  const k = xatDayKey(ts), now = Date.now();
  if (k === xatDayKey(now)) return "Hoy";
  if (k === xatDayKey(now - 864e5)) return "Ayer";
  return new Date(ts).toLocaleDateString(xatLoc(), { weekday: "long", day: "numeric", month: "short" });
}
const xatTime = (ts) => new Date(ts).toLocaleTimeString(xatLoc(), { hour: "2-digit", minute: "2-digit" });
// Text segur amb els enllaços clicables (només http i https)
const xatLinks = (t) => esc(t).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]»"']/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${u.replace(/^https?:\/\//, "").slice(0, 48)}${u.length > 56 ? "…" : ""}</a>`);
// Només emojis (fins a 3): es pinten grans i sense bombolla
const xatBig = (t) => { const s = (t || "").trim(); return s.length <= 12 && /^(\p{Extended_Pictographic}|‍|️|\s)+$/u.test(s) && [...new Intl.Segmenter().segment(s.replace(/\s/g, ""))].length <= 3; };
const xatInitial = (n) => esc((n || "?").replace(/^@/, "").trim().charAt(0).toUpperCase() || "?");

// o: { me, who(uid) → { name, sig?, color, av? }, names (mostrar qui escriu), readTs (fins on ha llegit l'altre),
//      newSince (missatges nous des de…), extra(m) → html (targetes: pactes, invitacions), empty }
function xatRender(msgs, o) {
  if (!msgs.length) return `<div class="xat-empty">${o.empty || "Todavía no hay mensajes."}</div>`;
  const out = [];
  let prev = null, day = null, newDone = false;
  msgs.forEach((m, i) => {
    const dk = xatDayKey(m.ts);
    if (dk !== day) { out.push(`<div class="xat-day"><span>${esc(xatDay(m.ts))}</span></div>`); day = dk; prev = null; }
    if (o.newSince && !newDone && m.ts > o.newSince && m.from !== o.me && m.from !== "sys") { out.push(`<div class="xat-new" data-xat-new><span>Mensajes nuevos</span></div>`); newDone = true; prev = null; }
    if (m.from === "sys") { out.push(`<div class="xat-sys" data-mid="${esc(m.id)}">${xatLinks(m.t)}</div>`); prev = null; return; }
    const next = msgs[i + 1];
    const first = !prev || prev.from !== m.from || m.ts - prev.ts > XAT_GROUP;
    const last = !next || next.from !== m.from || next.ts - m.ts > XAT_GROUP || xatDayKey(next.ts) !== dk || next.from === "sys";
    const mine = m.from === o.me, W = o.who(m.from) || { name: "?", color: "#888" };
    const big = !m.re && xatBig(m.t) && !o.extra?.(m);
    const counts = {};
    Object.values(m.r || {}).forEach((e) => { counts[e] = (counts[e] || 0) + 1; });
    const myR = m.r?.[o.me];
    const extra = o.extra?.(m) || "";
    out.push(`<div class="xat-m ${mine ? "me" : ""} ${first ? "first" : ""} ${last ? "last" : ""} ${big ? "big" : ""} ${m.pending ? "pending" : ""}" data-mid="${esc(m.id)}" style="--pc:${W.color || "#888"}">
      ${mine ? "" : `<span class="xat-av ${last ? "" : "sp"}" aria-hidden="true">${last ? W.av || xatInitial(W.name) : ""}</span>`}
      <div class="xat-b" tabindex="0">
        ${!mine && first && o.names ? `<b class="xat-who">${W.sig ? `<i>${esc(W.sig)}</i>` : ""}${esc(W.name)}</b>` : ""}
        ${m.re ? `<button type="button" class="xat-quote" data-goto="${esc(m.re.id)}"><b>${esc(m.re.from === o.me ? "Tú" : o.who(m.re.from)?.name || "?")}</b><span>${esc(m.re.t)}</span></button>` : ""}
        ${m.t && !(extra && m.card) ? `<p>${xatLinks(m.t)}</p>` : ""}
        ${extra}
        ${Object.keys(counts).length ? `<div class="xat-reacts">${Object.entries(counts).map(([e, n]) => `<button type="button" class="${myR === e ? "on" : ""}" data-react-t="${e}" aria-label="${e} ${n}">${e}${n > 1 ? `<small>${n}</small>` : ""}</button>`).join("")}</div>` : ""}
      </div>
      ${last ? `<small class="xat-meta">${m.pending ? "Enviando…" : xatTime(m.ts)}</small>` : ""}
    </div>`);
    prev = m;
  });
  // «Vist»: sota el meu últim missatge, si l'altre ja l'ha llegit
  const lastMine = [...msgs].reverse().find((m) => m.from === o.me);
  if (o.readTs && lastMine && !lastMine.pending && o.readTs >= lastMine.ts && msgs[msgs.length - 1] === lastMine) out.push(`<div class="xat-seen">Visto ✓✓</div>`);
  return out.join("");
}

// Frases ràpides (es poden canviar després: xatChipsSet)
const xatChips = (c = []) => c.map((x) => `<button type="button" data-chip="${esc(x)}">${esc(x)}</button>`).join("");
function xatChipsSet(root, chips) { const el = $("[data-xat-chips]", root); if (!el) return; const html = xatChips(chips); if (el.innerHTML !== html) el.innerHTML = html; el.hidden = !chips?.length; }
// o: { max, placeholder, chips: [text], id }
function xatComposer(o = {}) {
  return `<div class="xat-reply" data-xat-reply hidden></div>
    <div class="xat-chips" data-xat-chips ${o.chips?.length ? "" : "hidden"}>${xatChips(o.chips)}</div>
    <div class="xat-emo" data-xat-emo-panel hidden>${XAT_EMOJI.map((e) => `<button type="button" data-emo="${e}">${e}</button>`).join("")}</div>
    <form class="xat-form" data-xat-form>
      <button type="button" class="xat-emo-btn" data-xat-emo aria-label="Emojis">😊</button>
      <textarea data-xat-in rows="1" maxlength="${o.max || 500}" placeholder="${esc(o.placeholder || "Escribe un mensaje…")}" aria-label="Mensaje"></textarea>
      <button type="submit" class="xat-send" aria-label="Envía" disabled><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16 12 3.4 13.9z"/></svg></button>
    </form>`;
}

// h: { me, msg(id) → missatge, who(uid), send(t, re), react(id, emoji|null), del?(id), report?(m), typing?(), canDelete?(m) }
function xatBind(root, h) {
  const st = (root._xat = { reply: null, h, unseen: 0 });
  const log = $("[data-xat-log]", root), input = $("[data-xat-in]", root), form = $("[data-xat-form]", root);
  const sendBtn = $(".xat-send", root), replyBar = $("[data-xat-reply]", root), emo = $("[data-xat-emo-panel]", root);
  const grow = () => { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 132)}px`; sendBtn.disabled = !input.value.trim(); };
  let lastTyping = 0;
  input.addEventListener("input", () => {
    grow();
    if (h.typing && input.value && Date.now() - lastTyping > 4000) { lastTyping = Date.now(); h.typing(); }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !xatCoarse()) { e.preventDefault(); form.requestSubmit(); }
    if (e.key === "Escape") xatReplySet(root, null);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    const re = st.reply;
    input.value = "";
    grow();
    xatReplySet(root, null);
    emo.hidden = true;
    h.send(t, re);
    if (!xatCoarse()) input.focus();
  });
  $("[data-xat-emo]", root).addEventListener("click", () => { emo.hidden = !emo.hidden; });
  emo.addEventListener("click", (e) => {
    const b = e.target.closest("[data-emo]");
    if (!b) return;
    const s = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, s) + b.dataset.emo + input.value.slice(input.selectionEnd ?? s);
    input.selectionStart = input.selectionEnd = s + b.dataset.emo.length;
    grow();
    if (!xatCoarse()) input.focus();
  });
  $("[data-xat-chips]", root)?.addEventListener("click", (e) => { const b = e.target.closest("[data-chip]"); if (b) { h.send(b.dataset.chip, st.reply); xatReplySet(root, null); } });
  replyBar.addEventListener("click", (e) => { if (e.target.closest("[data-reply-x]")) xatReplySet(root, null); });

  // Al registre: cites, reaccions, menú (passant per sobre, clic dret o mantenint premut) i doble toc = ❤️
  const mOf = (el) => { const id = el?.closest("[data-mid]")?.dataset.mid; return id ? h.msg(id) : null; };
  const toggle = (m, e) => h.react(m.id, m.r?.[h.me] === e ? null : e);
  log.addEventListener("click", (e) => {
    const q = e.target.closest("[data-goto]");
    if (q) { const t = $(`[data-mid="${CSS.escape(q.dataset.goto)}"]`, log); if (t) { t.scrollIntoView({ block: "center", behavior: "smooth" }); t.classList.add("flash"); setTimeout(() => t.classList.remove("flash"), 1400); } return; }
    const r = e.target.closest("[data-react-t]");
    if (r) { const m = mOf(r); if (m) toggle(m, r.dataset.reactT); return; }
    const tool = e.target.closest("[data-tool]");
    if (tool) {
      const m = mOf(tool);
      if (!m) return;
      if (tool.dataset.tool === "reply") xatReplySet(root, m);
      else if (tool.dataset.tool === "react") xatSheet(root, m, true);
      else xatSheet(root, m);
    }
  });
  log.addEventListener("dblclick", (e) => { const b = e.target.closest(".xat-b"); const m = mOf(b); if (b && m && !e.target.closest("a, button")) { toggle(m, "❤️"); xatBurst(b); } });
  log.addEventListener("contextmenu", (e) => { const m = mOf(e.target); if (m && !e.target.closest("a")) { e.preventDefault(); xatSheet(root, m); } });
  let hold = null;
  log.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const m = mOf(e.target);
    if (!m || e.target.closest("a, button")) return;
    const x = e.clientX, y = e.clientY;
    hold = { x, y, t: setTimeout(() => { hold = null; navigator.vibrate?.(12); xatSheet(root, m); }, 450) };
  });
  const cancel = (e) => { if (hold && (!e || e.type !== "pointermove" || Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10)) { clearTimeout(hold.t); hold = null; } };
  ["pointerup", "pointercancel", "pointermove"].forEach((ev) => log.addEventListener(ev, cancel));
  // Eines en passar per sobre (ordinador)
  log.addEventListener("mouseover", (e) => {
    const row = e.target.closest(".xat-m");
    if (!row || $(".xat-tools", row) || xatCoarse() || row.classList.contains("pending")) return;
    $$(".xat-tools", log).forEach((x) => x.remove());
    row.insertAdjacentHTML("beforeend", `<span class="xat-tools"><button type="button" data-tool="react" aria-label="Reacciona">😊</button><button type="button" data-tool="reply" aria-label="Responde">↩</button><button type="button" data-tool="more" aria-label="Más opciones">⋯</button></span>`);
  });
  // Baixar al final
  log.addEventListener("scroll", () => { if (xatAtEnd(log)) { st.unseen = 0; xatDownPaint(root); } });
  root.insertAdjacentHTML("beforeend", `<button type="button" class="xat-down" data-xat-down hidden aria-label="Baja al final">↓<b></b></button>`);
  $("[data-xat-down]", root).addEventListener("click", () => { log.scrollTo({ top: log.scrollHeight, behavior: "smooth" }); st.unseen = 0; xatDownPaint(root); });
  grow();
}
const xatAtEnd = (log) => log.scrollHeight - log.scrollTop - log.clientHeight < 60;
function xatDownPaint(root) {
  const b = $("[data-xat-down]", root), log = $("[data-xat-log]", root);
  if (!b) return;
  b.hidden = xatAtEnd(log);
  $("b", b).textContent = root._xat.unseen ? String(root._xat.unseen) : "";
}
// Abans de pintar: on era l'scroll. Després: al final si hi eres (o és la primera vegada), o compta els nous
function xatBefore(root) { const log = $("[data-xat-log]", root); return { end: !log.childElementCount || xatAtEnd(log), top: log.scrollTop, n: $$(".xat-m", log).length }; }
function xatAfter(root, before, first = false) {
  const log = $("[data-xat-log]", root);
  const n = $$(".xat-m", log).length;
  if (first) { const nw = $("[data-xat-new]", log); if (nw) nw.scrollIntoView({ block: "center" }); else log.scrollTop = log.scrollHeight; }
  else if (before.end) log.scrollTop = log.scrollHeight;
  else { log.scrollTop = before.top; root._xat.unseen += Math.max(0, n - before.n); }
  xatDownPaint(root);
}
function xatReplySet(root, m) {
  const st = root._xat, bar = $("[data-xat-reply]", root);
  st.reply = m ? { id: m.id, t: (m.t || "").slice(0, 140), from: m.from } : null;
  bar.hidden = !m;
  bar.innerHTML = m ? `<span><b>Respondiendo a ${esc(m.from === st.h.me ? "ti" : st.h.who(m.from)?.name || "?")}</b>${esc((m.t || "").slice(0, 90))}</span><button type="button" data-reply-x aria-label="No respondas">✕</button>` : "";
  if (m) $("[data-xat-in]", root).focus();
}
// Menú d'un missatge: reaccions i accions
function xatSheet(root, m, reactOnly = false) {
  const h = root._xat.h, mine = m.from === h.me;
  $(".xat-sheet-bg")?.remove();
  const bg = document.createElement("div");
  bg.className = "xat-sheet-bg";
  bg.innerHTML = `<div class="xat-sheet" role="dialog" aria-label="Opciones del mensaje">
    <p class="xat-sheet-t">${esc((m.t || "").slice(0, 120))}</p>
    <div class="xat-sheet-r">${XAT_REACT.map((e) => `<button type="button" class="${m.r?.[h.me] === e ? "on" : ""}" data-sr="${e}">${e}</button>`).join("")}</div>
    ${reactOnly ? "" : `<div class="xat-sheet-a">
      <button type="button" data-sa="reply">↩ Responde</button>
      <button type="button" data-sa="copy">📋 Copia el texto</button>
      ${mine && h.del && (!h.canDelete || h.canDelete(m)) ? `<button type="button" data-sa="del" class="danger">🗑️ Bórralo para todos</button>` : ""}
      ${!mine && h.report ? `<button type="button" data-sa="report" class="danger">⚑ Denuncia el mensaje</button>` : ""}
    </div>`}
  </div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.addEventListener("click", async (e) => {
    if (e.target === bg) return close();
    const r = e.target.closest("[data-sr]");
    if (r) { h.react(m.id, m.r?.[h.me] === r.dataset.sr ? null : r.dataset.sr); return close(); }
    const a = e.target.closest("[data-sa]")?.dataset.sa;
    if (!a) return;
    close();
    if (a === "reply") xatReplySet(root, m);
    else if (a === "copy") navigator.clipboard?.writeText(m.t || "").then(() => toast("Texto copiado"));
    else if (a === "del" && confirm("Se borrará el mensaje para todos. ¿Continuar?")) h.del(m.id);
    else if (a === "report") h.report(m);
  });
  bg.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  $("button", bg)?.focus({ preventScroll: true });
}
function xatBurst(el) {
  const s = document.createElement("span");
  s.className = "xat-burst";
  s.textContent = "❤️";
  el.appendChild(s);
  setTimeout(() => s.remove(), 700);
}
