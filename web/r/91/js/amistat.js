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
      const o = f.u?.[amiOther(f)]?.name || "Algú";
      if (!old && f.status === "pendent" && f.from !== amiMe()) { toast(`👋 ${o} vol ser amic teu`); Sfx.play("pick"); }
      else if (old && old.status === "pendent" && f.status === "ok" && f.from === amiMe()) toast(`🤝 ${o} ha acceptat la teva sol·licitud`);
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
  const box = h(`<div class="ami-card-wrap" role="dialog" aria-modal="true" aria-label="Perfil"><div class="card ami-card"><button type="button" class="ami-x" aria-label="Tanca">✕</button><div data-body><p class="muted">Carregant…</p></div></div></div>`);
  document.body.appendChild(box);
  const close = () => { box.remove(); AMI.cardPaint = null; };
  $(".ami-x", box).addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  if (!window.Online?.amics) { $("[data-body]", box).innerHTML = `<p class="muted">Ara mateix no hi ha connexió.</p>`; return; }
  const u = known || await window.Online.amics.user(uid);
  if (!box.isConnected) return;
  if (!u) { $("[data-body]", box).innerHTML = `<p class="muted">No s'ha trobat aquest usuari.</p>`; return; }
  const paint = () => {
    if (!box.isConnected) return;
    const f = amiOf(u.uid);
    const lvl = LEVELS[Math.min(LEVELS.length - 1, (u.level || 1) - 1)]?.name || "";
    let act = "";
    if (!amiOn()) act = `<button class="btn primary" data-in>Entra per afegir-lo com a amic</button>`;
    else if (u.uid === amiMe()) act = `<p class="muted">Ets tu!</p>`;
    else if (!f) act = `<button class="btn primary" data-add>👋 Afegeix com a amic</button>`;
    else if (f.status === "ok") act = `<a class="btn primary" href="#amics/xat/${esc(u.uid)}" data-go>💬 Xateja</a><span class="ami-ok">✓ Sou amics</span>`;
    else if (f.from === amiMe()) act = `<span class="ami-ok">Sol·licitud enviada</span><button class="btn ghost sm" data-del>Cancel·la</button>`;
    else act = `<button class="btn primary" data-acc>Accepta la sol·licitud</button><button class="btn ghost sm" data-del>Rebutja</button>`;
    $("[data-body]", box).innerHTML = `${amiAv(u, 72)}<h3>${esc(u.name || "Jugador")}</h3><p class="muted">${esc(lvl)}${u.xp ? ` · ${fmt(u.xp)} XP` : ""}</p><div class="ami-acts">${act}</div>`;
    $("[data-in]", box)?.addEventListener("click", () => window.Online?.signIn?.());
    $("[data-go]", box)?.addEventListener("click", close);
    $("[data-add]", box)?.addEventListener("click", async (e) => { e.target.disabled = true; if (await window.Online.amics.request(u) !== null) { toast("Sol·licitud enviada"); Sfx.play("ok"); } setTimeout(paint, 600); });
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
  amiChatClose();
  const invite = parts[1] ? decodeURIComponent(parts[1]) : null;
  if (!amiOn()) {
    root.innerHTML = `<div class="card online-off">${window.Online?.pitchHtml ? window.Online.pitchHtml(invite ? "T'han convidat a ser amics" : "Afegeix els teus amics", invite ? `Entra amb Google per acceptar la invitació de @${esc(invite)} i xatejar amb els teus amics.` : "Entra amb Google per afegir amics, xatejar-hi i reptar-los.") : ""}</div>`;
    if (invite) sessionStorage.setItem("ami-invite", invite);
    return;
  }
  // Una invitació: la targeta de qui convida
  const pend = invite || sessionStorage.getItem("ami-invite");
  if (pend) {
    sessionStorage.removeItem("ami-invite");
    history.replaceState(null, "", "#amics");
    window.Online.amics.byHandle(pend).then((u) => (u ? amiCard(u.uid, u) : toast("No s'ha trobat aquest usuari")));
  }
  if (!AMI.list) { root.innerHTML = `<p class="muted">Carregant els teus amics…</p>`; return; }
  const me = amiMe();
  const handle = window.Online.profile?.handle;
  const rec = AMI.list.filter((f) => f.status === "pendent" && f.from !== me);
  const sent = AMI.list.filter((f) => f.status === "pendent" && f.from === me);
  const friends = AMI.list.filter((f) => f.status === "ok").sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0));
  const row = (f, actions) => { const o = amiOther(f), p = f.u?.[o] || {}; return `<li data-user="${esc(o)}" tabindex="0">${amiAv(p, 40)}<span class="ami-n"><b>${esc(p.name || "Jugador")}</b>${actions.sub ? `<small>${actions.sub}</small>` : ""}</span>${actions.html || ""}</li>`; };
  root.innerHTML = `
    <section class="card ami-invite">
      <h2 class="section-title sm">👋 Convida els teus amics</h2>
      ${handle ? `<p>Envia'ls el teu enllaç: en obrir-lo, et podran afegir com a amic.</p>
        <div class="ami-link"><code>${esc(amiLink(handle))}</code></div>
        <div class="row ami-share"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Fem-nos amics a Política en Joc i juguem a les eleccions del 29N! 🗳️ ${amiLink(handle)}`)}" data-wa>WhatsApp</a><button class="btn" type="button" data-copy>Copia l'enllaç</button>${navigator.share ? `<button class="btn" type="button" data-share>Comparteix</button>` : ""}</div>`
      : `<p>Per tenir un enllaç d'amistat, primer tria el teu nom d'usuari.</p><button class="btn primary" type="button" data-handle>Tria el nom d'usuari</button>`}
      <form class="ami-search" data-search><input data-q placeholder="O busca un nom d'usuari" autocomplete="off" aria-label="Busca un nom d'usuari"><button class="btn" type="submit">Busca</button></form>
    </section>
    ${rec.length ? `<section class="card"><h2 class="section-title sm">Sol·licituds rebudes</h2><ul class="ami-list">${rec.map((f) => row(f, { sub: "Vol ser amic teu", html: `<span class="ami-btns"><button class="btn primary sm" data-acc="${f.id}">Accepta</button><button class="btn ghost sm" data-del="${f.id}">Rebutja</button></span>` })).join("")}</ul></section>` : ""}
    <section class="card"><h2 class="section-title sm">Els teus amics${friends.length ? ` (${friends.length})` : ""}</h2>
      ${friends.length ? `<ul class="ami-list">${friends.map((f) => row(f, { sub: f.last ? `${f.last.from === me ? "Tu: " : ""}${esc(f.last.t)}` : "Encara no heu xatejat", html: `<a class="btn sm ${amiUnread(f) ? "primary" : ""}" href="#amics/xat/${esc(amiOther(f))}">${amiUnread(f) ? "💬 Nou" : "💬 Xat"}</a>` })).join("")}</ul>`
        : `<p class="muted">Encara no tens amics. Envia el teu enllaç per WhatsApp o toca el nom de qualsevol jugador (al rànquing, als duels…) per afegir-lo.</p>`}
    </section>
    ${sent.length ? `<section class="card"><h2 class="section-title sm">Sol·licituds enviades</h2><ul class="ami-list">${sent.map((f) => row(f, { sub: "Pendent", html: `<button class="btn ghost sm" data-del="${f.id}">Cancel·la</button>` })).join("")}</ul></section>` : ""}`;
  $("[data-copy]", root)?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(amiLink(handle)); toast("Enllaç copiat"); } catch { toast(amiLink(handle)); } });
  $("[data-share]", root)?.addEventListener("click", () => navigator.share({ title: "Política en Joc", text: "Fem-nos amics a Política en Joc i juguem a les eleccions del 29N! 🗳️", url: amiLink(handle) }).catch(() => {}));
  $("[data-handle]", root)?.addEventListener("click", () => window.Online?.editProfile?.());
  $("[data-wa]", root)?.addEventListener("click", () => window.Track?.("amics_whatsapp"));
  $("[data-search]", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("[data-q]", root).value.trim().replace(/^@/, "");
    if (q.length < 3) return toast("Escriu el nom d'usuari sencer (mínim 3 caràcters)");
    const u = await window.Online.amics.byHandle(q);
    if (u) amiCard(u.uid, u); else toast("No hi ha cap usuari amb aquest nom");
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
  if (!AMI.list) { root.innerHTML = `<p class="muted">Carregant…</p>`; setTimeout(() => location.hash.startsWith(`#amics/xat/`) && renderAmics(), 600); return; }
  const f = amiOf(uid);
  if (!f || f.status !== "ok") { root.innerHTML = `<div class="card"><p>Només pots xatejar amb els teus amics.</p><a class="btn" href="#amics">Torna als amics</a></div>`; return; }
  if (AMI.chatWith === uid && $(".ami-chat", root)) return;
  amiChatClose();
  AMI.chatWith = uid;
  const p = f.u?.[uid] || {};
  root.innerHTML = `<section class="card ami-chat">
    <header><a class="btn ghost sm" href="#amics" aria-label="Torna als amics">←</a><span data-user="${esc(uid)}" tabindex="0" class="ami-chat-who">${amiAv(p, 36)}<b>${esc(p.name || "Jugador")}</b></span><button type="button" class="linklike" data-unfriend>Deixa de ser amics</button></header>
    <div class="ami-log" data-log aria-live="polite"><p class="muted">Carregant…</p></div>
    <form class="ami-form" data-form><input data-msg maxlength="500" autocomplete="off" placeholder="Escriu un missatge…" aria-label="Missatge"><button class="btn primary" type="submit">Envia</button></form>
    <p class="ami-note">Missatges privats entre vosaltres dos. Sigues respectuós: si algú et molesta, deixa de ser-ne amic i s'esborrarà el xat.</p>
  </section>`;
  const log = $("[data-log]", root), me = amiMe();
  AMI.chatUnsub = window.Online.amics.watchChat(f.id, (msgs) => {
    if (!msgs) { log.innerHTML = `<p class="muted">No s'han pogut carregar els missatges.</p>`; return; }
    log.innerHTML = msgs.length ? msgs.map((m) => `<div class="ami-m ${m.from === me ? "me" : ""}"><p>${esc(m.t)}</p><small>${new Date(m.ts).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") : `<p class="muted">Encara no hi ha missatges. Saluda!</p>`;
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
    if (!confirm(`Deixareu de ser amics i s'esborrarà tot el xat amb ${p.name || "aquest jugador"}. Continuar?`)) return;
    amiChatClose();
    await window.Online.amics.remove(f.id);
    location.hash = "#amics";
  });
  $("[data-msg]", root).focus({ preventScroll: true });
}
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#amics/xat/")) amiChatClose();
  $(".ami-card-wrap")?.remove();
  AMI.cardPaint = null;
});
