// Amics: la targeta d'usuari (en tocar qualsevol nom), la pestanya Amics de la secció Social (enllaç per convidar,
// sol·licituds, llista i cercador) i el xat privat amb cada amic. Les dades són a online.js (Online.amics).
//   #amics            la pestanya
//   #amics/<nom>      enllaç d'invitació: la targeta d'aquest usuari, per afegir-lo
//   #amics/xat/<uid>  el xat amb un amic

const AMI = { list: null, unsub: null, seen: {}, chatUnsub: null, chatWith: null };
const amiOn = () => !!window.Online?.amics?.ok();
const amiMe = () => window.Online?.amics?.uid();
const amiOther = (f) => f.users.find((u) => u !== amiMe());
const amiUnread = (f) => f.status === "ok" && f.last && f.last.from !== amiMe() && f.last.ts > (f.read?.[amiMe()] || 0);
const amiOf = (uid) => (AMI.list || []).find((f) => amiOther(f) === uid) || null;
const amiAv = (p, size) => (p?.photo ? `<img class="avatar" src="${esc(p.photo)}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer">` : `<span class="avatar ph" style="width:${size}px;height:${size}px">${esc((p?.name || "?")[0])}</span>`);
const amiLink = (handle) => `${location.origin}${location.pathname.replace(/index\.html$/, "")}#amics/${encodeURIComponent(handle)}`;

// ---------- En directe: sol·licituds, missatges nous i avisos ----------
window.amicsAuth = () => {
  AMI.unsub?.();
  AMI.unsub = null;
  AMI.list = null;
  amiBadge();
  if (!amiOn()) return;
  let first = true;
  AMI.unsub = window.Online.amics.watch((list) => {
    if (!list) return;
    // Avisos: una sol·licitud nova o un missatge nou (si no tens el xat obert)
    if (!first) list.forEach((f) => {
      const old = (AMI.list || []).find((x) => x.id === f.id);
      const o = f.u?.[amiOther(f)]?.name || "Alguien";
      if (!old && f.status === "pendent" && f.from !== amiMe()) { toast(`👋 ${o} quiere ser tu amigo`); Sfx.play("pick"); }
      else if (old && old.status === "pendent" && f.status === "ok" && f.from === amiMe()) toast(`🤝 ${o} ha aceptado tu solicitud`);
      if (amiUnread(f) && f.last.ts !== old?.last?.ts && AMI.chatWith !== amiOther(f)) { toast(`💬 ${o}: ${f.last.t}`); Sfx.play("tick"); }
    });
    first = false;
    AMI.list = list;
    amiBadge();
    AMI.cardPaint?.(); // la targeta oberta, amb l'estat nou
    if (location.hash.startsWith("#amics") && !location.hash.startsWith("#amics/xat/")) renderAmics();
  });
};
// Número a la pestanya Social: sol·licituds rebudes i xats amb missatges nous
function amiBadge() {
  const n = (AMI.list || []).filter((f) => (f.status === "pendent" && f.from !== amiMe()) || amiUnread(f)).length;
  $$('[data-nav="social"]').forEach((a) => {
    let b = $(".nav-badge", a);
    if (!n) { b?.remove(); return; }
    if (!b) { b = h(`<i class="nav-badge"></i>`); a.appendChild(b); }
    b.textContent = n > 9 ? "9+" : String(n);
  });
  const t = $("[data-ami-tab]");
  if (t) t.dataset.n = n || "";
}

// ---------- La targeta d'usuari ----------
// Qualsevol element amb data-user="<uid>" l'obre (rànquings, duels, lligues…)
document.addEventListener("click", (e) => {
  const el = e.target.closest?.("[data-user]");
  if (!el || !el.dataset.user || e.target.closest("button, a, input")) return;
  e.preventDefault();
  amiCard(el.dataset.user);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-user]")) { e.preventDefault(); amiCard(e.target.dataset.user); }
});
async function amiCard(uid, known = null) {
  $(".ami-card-wrap")?.remove();
  const box = h(`<div class="ami-card-wrap" role="dialog" aria-modal="true" aria-label="Perfil"><div class="card ami-card"><button type="button" class="ami-x" aria-label="Cierra">✕</button><div data-body><p class="muted">Cargando…</p></div></div></div>`);
  document.body.appendChild(box);
  const close = () => { box.remove(); AMI.cardPaint = null; };
  $(".ami-x", box).addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  if (!window.Online?.amics) { $("[data-body]", box).innerHTML = `<p class="muted">Ahora mismo no hay conexión.</p>`; return; }
  const u = known || await window.Online.amics.user(uid);
  if (!box.isConnected) return;
  if (!u) { $("[data-body]", box).innerHTML = `<p class="muted">No se ha encontrado este usuario.</p>`; return; }
  const paint = () => {
    if (!box.isConnected) return;
    const f = amiOf(u.uid);
    const lvl = LEVELS[Math.min(LEVELS.length - 1, (u.level || 1) - 1)]?.name || "";
    let act = "";
    if (!amiOn()) act = `<button class="btn primary" data-in>Entra para añadirlo como amigo</button>`;
    else if (u.uid === amiMe()) act = `<p class="muted">¡Eres tú!</p>`;
    else if (!f) act = `<button class="btn primary" data-add>👋 Añade como amigo</button>`;
    else if (f.status === "ok") act = `<a class="btn primary" href="#amics/xat/${esc(u.uid)}" data-go>💬 Chatea</a><span class="ami-ok">✓ Sois amigos</span>`;
    else if (f.from === amiMe()) act = `<span class="ami-ok">Solicitud enviada</span><button class="btn ghost sm" data-del>Cancela</button>`;
    else act = `<button class="btn primary" data-acc>Acepta la solicitud</button><button class="btn ghost sm" data-del>Rechaza</button>`;
    $("[data-body]", box).innerHTML = `${amiAv(u, 72)}<h3>${esc(u.name || "Jugador")}</h3><p class="muted">${esc(lvl)}${u.xp ? ` · ${fmt(u.xp)} XP` : ""}</p><div class="ami-acts">${act}</div>`;
    $("[data-in]", box)?.addEventListener("click", () => window.Online?.signIn?.());
    $("[data-go]", box)?.addEventListener("click", close);
    $("[data-add]", box)?.addEventListener("click", async (e) => { e.target.disabled = true; if (await window.Online.amics.request(u) !== null) { toast("Solicitud enviada"); Sfx.play("ok"); } setTimeout(paint, 600); });
    $("[data-acc]", box)?.addEventListener("click", async () => { await window.Online.amics.accept(amiOf(u.uid).id); Sfx.play("win"); setTimeout(paint, 600); });
    $("[data-del]", box)?.addEventListener("click", async () => { await window.Online.amics.remove(amiOf(u.uid).id); setTimeout(paint, 600); });
  };
  AMI.cardPaint = paint;
  paint();
}

// ---------- La pestanya Amics ----------
async function renderAmics() {
  const root = $("#amics-root");
  if (!root) return;
  const parts = location.hash.slice(1).split("/");
  if (parts[1] === "xat" && parts[2]) return amiChat(root, decodeURIComponent(parts[2]));
  if (parts[1] === "trucada") return amiCallRoom(root, parts[2] ? decodeURIComponent(parts[2]).toUpperCase() : null);
  amiChatClose();
  const invite = parts[1] ? decodeURIComponent(parts[1]) : null;
  if (!amiOn()) {
    root.innerHTML = `<div class="card online-off">${window.Online?.pitchHtml ? window.Online.pitchHtml(invite ? "Te han invitado a ser amigos" : "Añade a tus amigos", invite ? `Entra con Google para aceptar la invitación de @${esc(invite)} y chatear con tus amigos.` : "Entra con Google para añadir amigos, chatear con ellos y retarlos.") : ""}</div>`;
    if (invite) sessionStorage.setItem("ami-invite", invite);
    return;
  }
  // Una invitació: la targeta de qui convida
  const pend = invite || sessionStorage.getItem("ami-invite");
  if (pend) {
    sessionStorage.removeItem("ami-invite");
    history.replaceState(null, "", "#amics");
    window.Online.amics.byHandle(pend).then((u) => (u ? amiCard(u.uid, u) : toast("No se ha encontrado este usuario")));
  }
  if (!AMI.list) { root.innerHTML = `<p class="muted">Cargando tus amigos…</p>`; return; }
  const me = amiMe();
  const handle = window.Online.profile?.handle;
  const rec = AMI.list.filter((f) => f.status === "pendent" && f.from !== me);
  const sent = AMI.list.filter((f) => f.status === "pendent" && f.from === me);
  const friends = AMI.list.filter((f) => f.status === "ok").sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0));
  const row = (f, actions) => { const o = amiOther(f), p = f.u?.[o] || {}; return `<li data-user="${esc(o)}" tabindex="0">${amiAv(p, 40)}<span class="ami-n"><b>${esc(p.name || "Jugador")}</b>${actions.sub ? `<small>${actions.sub}</small>` : ""}</span>${actions.html || ""}</li>`; };
  root.innerHTML = `
    <section class="card ami-invite">
      <h2 class="section-title sm">👋 Invita a tus amigos</h2>
      ${handle ? `<p>Envíales tu enlace: al abrirlo, te podrán añadir como amigo.</p>
        <div class="ami-link"><code>${esc(amiLink(handle))}</code></div>
        <div class="row ami-share"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`¡Hagámonos amigos en Política en Joc y juguemos a las elecciones del 29N! 🗳️ ${amiLink(handle)}`)}" data-wa>WhatsApp</a><button class="btn" type="button" data-copy>Copia el enlace</button>${navigator.share ? `<button class="btn" type="button" data-share>Comparte</button>` : ""}</div>`
      : `<p>Para tener un enlace de amistad, primero elige tu nombre de usuario.</p><button class="btn primary" type="button" data-handle>Elige el nombre de usuario</button>`}
      <form class="ami-search" data-search><input data-q placeholder="O busca un nombre de usuario" autocomplete="off" aria-label="Busca un nombre de usuario"><button class="btn" type="submit">Busca</button></form>
    </section>
    ${rec.length ? `<section class="card"><h2 class="section-title sm">Solicitudes recibidas</h2><ul class="ami-list">${rec.map((f) => row(f, { sub: "Quiere ser tu amigo", html: `<span class="ami-btns"><button class="btn primary sm" data-acc="${f.id}">Acepta</button><button class="btn ghost sm" data-del="${f.id}">Rechaza</button></span>` })).join("")}</ul></section>` : ""}
    <section class="card"><h2 class="section-title sm">Tus amigos${friends.length ? ` (${friends.length})` : ""}</h2>
      ${friends.length ? `<ul class="ami-list">${friends.map((f) => row(f, { sub: f.last ? `${f.last.from === me ? "Tú: " : ""}${esc(f.last.t)}` : "Todavía no habéis chateado", html: `<a class="btn sm ${amiUnread(f) ? "primary" : ""}" href="#amics/xat/${esc(amiOther(f))}">${amiUnread(f) ? "💬 Nuevo" : "💬 Chat"}</a>` })).join("")}</ul>`
        : `<p class="muted">Todavía no tienes amigos. Envía tu enlace por WhatsApp o toca el nombre de cualquier jugador (en el ranking, en los duelos…) para añadirlo.</p>`}
    </section>
    ${sent.length ? `<section class="card"><h2 class="section-title sm">Solicitudes enviadas</h2><ul class="ami-list">${sent.map((f) => row(f, { sub: "Pendiente", html: `<button class="btn ghost sm" data-del="${f.id}">Cancela</button>` })).join("")}</ul></section>` : ""}`;
  $("[data-copy]", root)?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(amiLink(handle)); toast("Enlace copiado"); } catch { toast(amiLink(handle)); } });
  $("[data-share]", root)?.addEventListener("click", () => navigator.share({ title: "Política en Joc", text: "¡Hagámonos amigos en Política en Joc y juguemos a las elecciones del 29N! 🗳️", url: amiLink(handle) }).catch(() => {}));
  $("[data-handle]", root)?.addEventListener("click", () => window.Online?.editProfile?.());
  $("[data-wa]", root)?.addEventListener("click", () => window.Track?.("amics_whatsapp"));
  $("[data-search]", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("[data-q]", root).value.trim().replace(/^@/, "");
    if (q.length < 3) return toast("Escribe el nombre de usuario completo (mínimo 3 caracteres)");
    const u = await window.Online.amics.byHandle(q);
    if (u) amiCard(u.uid, u); else toast("No hay ningún usuario con este nombre");
  });
  $$("[data-acc]", root).forEach((b) => b.addEventListener("click", async (e) => { e.stopPropagation(); await window.Online.amics.accept(b.dataset.acc); Sfx.play("win"); }));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async (e) => { e.stopPropagation(); await window.Online.amics.remove(b.dataset.del); }));
}

// ---------- El xat privat ----------
function amiChatClose() {
  AMI.chatUnsub?.();
  AMI.chatUnsub = null;
  AMI.chatWith = null;
}
function amiChat(root, uid) {
  if (!amiOn()) { location.hash = "#amics"; return; }
  if (!AMI.list) { root.innerHTML = `<p class="muted">Cargando…</p>`; setTimeout(() => location.hash.startsWith(`#amics/xat/`) && renderAmics(), 600); return; }
  const f = amiOf(uid);
  if (!f || f.status !== "ok") { root.innerHTML = `<div class="card"><p>Solo puedes chatear con tus amigos.</p><a class="btn" href="#amics">Vuelve a los amigos</a></div>`; return; }
  if (AMI.chatWith === uid && $(".ami-chat", root)) return;
  amiChatClose();
  AMI.chatWith = uid;
  const p = f.u?.[uid] || {};
  root.innerHTML = `<section class="card ami-chat">
    <header><a class="btn ghost sm" href="#amics" aria-label="Vuelve a los amigos">←</a><span data-user="${esc(uid)}" tabindex="0" class="ami-chat-who">${amiAv(p, 36)}<b>${esc(p.name || "Jugador")}</b></span><button type="button" class="linklike" data-unfriend>Dejad de ser amigos</button></header>
    <div class="ami-log" data-log aria-live="polite"><p class="muted">Cargando…</p></div>
    <form class="ami-form" data-form><input data-msg maxlength="500" autocomplete="off" placeholder="Escribe un mensaje…" aria-label="Mensaje"><button class="btn primary" type="submit">Envía</button></form>
    <p class="ami-note">Mensajes privados entre vosotros dos. Sé respetuoso: si alguien te molesta, denuncia el mensaje con ⚑ o deja de ser su amigo y se borrará el chat.</p>
  </section>`;
  const log = $("[data-log]", root), me = amiMe();
  AMI.chatUnsub = window.Online.amics.watchChat(f.id, (msgs) => {
    if (!msgs) { log.innerHTML = `<p class="muted">No se han podido cargar los mensajes.</p>`; return; }
    log.innerHTML = msgs.length ? msgs.map((m) => `<div class="ami-m ${m.from === me ? "me" : ""}"><p>${esc(m.t)}</p>${m.from === me ? "" : amiFlagBtn(p.name, uid, m.t)}<small>${new Date(m.ts).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") : `<p class="muted">Todavía no hay mensajes. ¡Saluda!</p>`;
    log.scrollTop = log.scrollHeight;
    window.Online.amics.read(f.id);
  });
  $("[data-form]", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const i = $("[data-msg]", root), t = i.value.trim().slice(0, 500);
    if (!t) return;
    i.value = "";
    if (await window.Online.amics.send(f.id, t) === null) i.value = t;
  });
  $("[data-unfriend]", root).addEventListener("click", async () => {
    if (!confirm(`Dejaréis de ser amigos y se borrará todo el chat con ${p.name || "este jugador"}. ¿Continuar?`)) return;
    amiChatClose();
    await window.Online.amics.remove(f.id);
    location.hash = "#amics";
  });
  $("[data-msg]", root).focus({ preventScroll: true });
}
// ---------- Sala de trucada de prova (Laboratori): #amics/trucada, #amics/trucada/CODI, #amics/trucada/LOCAL ----------
// Es crea des del Laboratori; qualsevol persona amb sessió hi entra amb l'enllaç. LOCAL: entre pestanyes d'aquest navegador.
const amiCallAlive = (code) => () => location.hash.toUpperCase().startsWith(`#AMICS/TRUCADA/${code}`);
async function amiCallRoom(root, code) {
  AMI.callUnsub?.();
  AMI.callUnsub = null;
  if (code === "LOCAL") {
    root.innerHTML = `<section class="card ami-call"><p class="simmp-lab">🧪 Laboratorio: llamada entre pestañas de este navegador. No pasa nada por internet.</p>
      <h3>Prueba local de llamada</h3><p class="muted">Abre esta misma dirección en otra pestaña (o ventana) y entra en la llamada desde las dos con el botón 📞.</p>
      <a class="btn ghost" href="#amics">← Volver</a></section>`;
    window.Call?.attach({ parent: "trucades", code: "LOCAL", title: "Prueba local", lab: true, names: {}, alive: amiCallAlive("LOCAL") });
    return;
  }
  if (!amiOn()) {
    root.innerHTML = `<div class="card online-off">${window.Online?.pitchHtml ? window.Online.pitchHtml("Te han invitado a una llamada", "Entra con Google para hablar con tus amigos.") : ""}</div>`;
    return;
  }
  if (!code) {
    if (!(typeof featPreview === "function" && featPreview("trucada"))) { location.hash = "#amics"; return; }
    root.innerHTML = `<section class="card ami-call"><p class="simmp-lab">🧪 Laboratorio: sala de llamada de prueba.</p>
      <h3>Llamada de prueba</h3><p class="muted">Crea una sala y envía el enlace a un amigo: podéis estar hasta cuatro personas, cada una desde su dispositivo. También puedes probarlo entre dos pestañas de este navegador.</p>
      <div class="call-ask-btns"><button class="btn primary" data-call-new>Crea una sala</button><a class="btn" href="#amics/trucada/local">Prueba entre pestañas</a></div></section>`;
    $("[data-call-new]", root).addEventListener("click", async () => { const c = await window.Online.call.create(); if (c) location.hash = `#amics/trucada/${c}`; });
    return;
  }
  root.innerHTML = `<p class="muted">Entrando en la sala…</p>`;
  const r = await window.Online.call.join(code);
  if (r.err) { root.innerHTML = `<div class="card"><p>${esc(r.err === "connexio" ? "No se ha podido conectar. Vuelve a intentarlo." : r.err)}</p><a class="btn" href="#amics">Vuelve a los amigos</a></div>`; return; }
  const link = `${location.origin}${location.pathname.replace(/index.html$/, "")}#amics/trucada/${code}`;
  AMI.callUnsub = window.Online.call.watchRoom(code, (d) => {
    if (!amiCallAlive(code)()) return;
    if (!d || !d.players.includes(amiMe())) { root.innerHTML = `<div class="card"><p>Esta sala ya no existe.</p><a class="btn" href="#amics">Vuelve a los amigos</a></div>`; window.Call?.detach(); return; }
    root.innerHTML = `<section class="card ami-call"><p class="kicker">Llamada de prueba · sala ${esc(code)}</p>
      <h3>${d.players.length} ${d.players.length === 1 ? "persona" : "personas"} en la sala</h3>
      <ul class="ami-call-who">${d.players.map((u) => `<li>${esc(d.names?.[u] || "Jugador")}${u === amiMe() ? " (tú)" : ""}</li>`).join("")}</ul>
      <p class="muted">Entra en la llamada con el botón 📞. Invita a alguien con el enlace (hasta cuatro personas).</p>
      <div class="call-ask-btns"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`¿Hablamos en Política en Joc? 📞 ${link}`)}">WhatsApp</a><button class="btn" data-copy>Copia el enlace</button><button class="btn ghost" data-leave>Sal de la sala</button></div></section>`;
    $("[data-copy]", root).addEventListener("click", () => navigator.clipboard?.writeText(link).then(() => toast("Enlace copiado")));
    $("[data-leave]", root).addEventListener("click", async () => { window.Call?.detach(); AMI.callUnsub?.(); await window.Online.call.leaveRoom(code); location.hash = "#amics"; });
    window.Call?.attach({ parent: "trucades", code, title: "Llamada de prueba", lab: false, names: d.names || {}, alive: amiCallAlive(code) });
  });
}

// Denunciar un missatge (xat privat o de la campanya): arriba a l'equip com un avís al Centre de control
const amiFlagBtn = (name, uid, t) => `<button type="button" class="ami-flag" data-flag data-flag-who="${esc(name || "Jugador")}" data-flag-uid="${esc(uid || "")}" data-flag-t="${esc(t || "")}" aria-label="Denuncia este mensaje" title="Denuncia este mensaje">⚑</button>`;
async function amiReport(b) {
  const { flagWho: who, flagUid: uid, flagT: t } = b.dataset;
  if (!confirm(`¿Quieres denunciar este mensaje de ${who}? El equipo de Política en Joc lo revisará y, si hace falta, tomará medidas.`)) return;
  if (typeof featPreview === "function" && featPreview("amics") && String(uid).startsWith("bot-")) { toast("En el laboratorio no se envía: es un amigo ficticio."); return; }
  const c = typeof rptContext === "function" ? rptContext() : { ver: "", ua: "", scr: "" };
  const ok = await window.Online?.reportSend?.({ text: `[Missatge denunciat] De ${who} (${uid}): «${t}»`.slice(0, 2000), email: "", where: (location.hash || "").slice(0, 100), ver: c.ver, ua: c.ua, scr: c.scr, err: "" });
  toast(ok ? "Gracias. Hemos recibido la denuncia y la revisaremos." : "No se ha podido enviar la denuncia. Vuelve a intentarlo.");
}
document.addEventListener("click", (e) => { const b = e.target.closest?.("[data-flag]"); if (b) { e.preventDefault(); amiReport(b); } });
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#amics/xat/")) amiChatClose();
  $(".ami-card-wrap")?.remove();
  AMI.cardPaint = null;
});
