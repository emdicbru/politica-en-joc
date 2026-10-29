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
  // Si aquest dispositiu ja té les notificacions, es lliga a l'usuari (perquè hi arribin missatges i trucades)
  if (typeof notifState === "function" && notifState() === "on") window.Online.pushSubscribe(store.get(NOTIF_KEY, {}).topics || NOTIF_ALL).catch(() => {});
  let first = true;
  AMI.unsub = window.Online.amics.watch((list) => {
    if (!list) return;
    // Avisos: una sol·licitud nova o un missatge nou (si no tens el xat obert)
    if (!first) list.forEach((f) => {
      const old = (AMI.list || []).find((x) => x.id === f.id);
      const o = f.u?.[amiOther(f)]?.name || "Algú";
      if (!old && f.status === "pendent" && f.from !== amiMe()) { toast(`👋 ${o} vol ser amic teu`); Sfx.play("pick"); }
      else if (old && old.status === "pendent" && f.status === "ok" && f.from === amiMe()) toast(`🤝 ${o} ha acceptat la teva sol·licitud`);
      if (amiUnread(f) && f.last.ts !== old?.last?.ts && (AMI.chatWith !== amiOther(f) || document.hidden)) {
        if (AMI.chatWith !== amiOther(f)) { toast(`💬 ${o}: ${f.last.t}`); Sfx.play("tick"); }
        // Amb l'app en segon pla, també una notificació del sistema
        if (document.hidden) amiSysNotif(o, f.last.t, `xat-${f.id}`, `#amics/xat/${encodeURIComponent(amiOther(f))}`);
      }
    });
    first = false;
    AMI.list = list;
    amiCalls(list);
    amiBadge();
    AMI.cardPaint?.(); // la targeta oberta, amb l'estat nou
    AMI.chatPaint?.(); // el xat obert: «escrivint…» i «Vist»
    if (location.hash.startsWith("#amics") && !location.hash.startsWith("#amics/xat/")) renderAmics();
    else if (location.hash.startsWith("#amics/xat/") && !AMI.chatWith) renderAmics(); // el xat esperava la llista
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
  if (parts[1] === "trucada") return amiCallRoom(root, parts[2] ? decodeURIComponent(parts[2]).toUpperCase() : null);
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
  const ns = typeof notifState === "function" ? notifState() : "unsupported";
  root.innerHTML = `
    ${ns === "off" ? `<section class="card ami-notif"><span aria-hidden="true">🔔</span><div><b>Que no se t'escapi res</b><small>Activa els avisos per saber quan un amic t'escriu o et truca, encara que tinguis l'app tancada.</small></div><button class="btn primary sm" data-ami-notif>Activa-ho</button></section>`
      : ns === "ios-install" ? `<section class="card ami-notif"><span aria-hidden="true">🔔</span><div><b>Avisos de missatges i trucades</b><small>A l'iPhone, afegeix l'app a la pantalla d'inici (Comparteix → Afegeix a la pantalla d'inici) per rebre'ls.</small></div></section>` : ""}
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
  $("[data-ami-notif]", root)?.addEventListener("click", async () => { await notifEnable(); renderAmics(); });
  $$("[data-acc]", root).forEach((b) => b.addEventListener("click", async (e) => { e.stopPropagation(); await window.Online.amics.accept(b.dataset.acc); Sfx.play("win"); }));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async (e) => { e.stopPropagation(); await window.Online.amics.remove(b.dataset.del); }));
}

// ---------- El xat privat ----------
// Les peces del xat (missatges, quadre d'escriure, reaccions, respostes) són a xat.js. Aquí: les dades, «escrivint…»,
// «Vist» i les invitacions (trucada, duel, campanya), que arriben a l'altre com una targeta amb un botó.
const AMI_CARD = {
  call: { ico: "📞", t: "Trucada", mine: "Has trucat", other: "Et truca", go: "Entra", again: "Torna-hi", ttl: 3 * 3600e3 },
  camp: { ico: "👥", t: "Campanya contra amics", mine: "Has creat una campanya", other: "Et convida a una campanya", go: "Uneix-t'hi", again: "Obre-la" },
  duel: { ico: "⚔️", t: "Duel 1 contra 1", mine: "Has creat un duel", other: "Et repta a un duel", go: "Accepta el repte", again: "Obre'l" },
};
function amiChatClose() {
  AMI.chatUnsub?.();
  AMI.chatUnsub = null;
  AMI.chatWith = null;
  AMI.chatPaint = null;
  clearInterval(AMI.chatTimer);
  $(".xat-menu")?.remove();
}
// Entra a una trucada amb un amic (sala trucades/{code}): video null = pregunta si amb veu o amb vídeo
async function amiCallGo(code, p, uid, video, fid = null) {
  const r = await window.Online.call.join(code);
  if (r.err) { toast(r.err === "connexio" ? "No s'ha pogut connectar. Torna-ho a provar." : r.err); return; }
  const names = { [amiMe()]: window.Online.profile?.handle || "Tu", [uid]: p.name || "Jugador" };
  // Si qui truca penja mentre encara sona, la trucada queda com a «penjada» (l'altre deixa de sentir-la)
  const onEnd = () => { if (fid && AMI.ringOut?.fid === fid) { amiRingOutStop(); window.Online.amics.callState(fid, "fi"); } };
  window.Call?.attach({ parent: "trucades", code, title: `Trucada amb ${p.name || "un amic"}`, names, quiet: true, onEnd, alive: () => location.hash === `#amics/xat/${encodeURIComponent(uid)}` });
  if (video === null) window.Call?.ask(); else window.Call?.join(video);
}
function amiChat(root, uid) {
  // Mentre s'inicia la sessió (en obrir l'enllaç o recarregar) s'espera; sense sessió, a la pestanya Amics
  if (!amiOn()) {
    if (window.Online?.isGuest?.()) { location.hash = "#amics"; return; }
    root.innerHTML = `<p class="muted">Carregant…</p>`;
    return;
  }
  if (!AMI.list) { root.innerHTML = `<p class="muted">Carregant…</p>`; setTimeout(() => location.hash.startsWith(`#amics/xat/`) && renderAmics(), 600); return; }
  const f = amiOf(uid);
  if (!f || f.status !== "ok") { root.innerHTML = `<div class="card"><p>Només pots xatejar amb els teus amics.</p><a class="btn" href="#amics">Torna als amics</a></div>`; return; }
  if (AMI.chatWith === uid && $(".ami-chat", root)) return;
  amiChatClose();
  AMI.chatWith = uid;
  const p = f.u?.[uid] || {}, me = amiMe(), name = p.name || "Jugador";
  AMI.chatSince = f.read?.[me] || 0; // la línia de «missatges nous»: el que ha arribat des de l'última vegada
  root.innerHTML = `<section class="card ami-chat xat">
    <header class="xat-head">
      <a class="xat-back" href="#amics" aria-label="Torna als amics">←</a>
      <span data-user="${esc(uid)}" tabindex="0" class="ami-chat-who">${amiAv(p, 40)}<span><b>${esc(name)}</b><small data-status>Amics</small></span></span>
      <div class="xat-acts">
        <button type="button" class="xat-act" data-inv="call" aria-label="Trucada de veu" title="Trucada de veu">📞</button>
        <button type="button" class="xat-act" data-inv="video" aria-label="Videotrucada" title="Videotrucada">📹</button>
        <button type="button" class="xat-act" data-more aria-label="Més opcions" aria-haspopup="menu">⋯</button>
      </div>
    </header>
    <div class="xat-log" data-xat-log aria-live="polite"><p class="muted">Carregant…</p></div>
    <div class="xat-foot">${xatComposer({ max: 500, placeholder: `Escriu a ${name}…` })}</div>
  </section>`;
  const sec = $(".ami-chat", root), log = $("[data-xat-log]", sec);
  let msgs = [], first = true;
  const who = (u) => (u === me ? { name: "Tu", color: "#17173d" } : { name, color: "#6c4cff", av: p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer">` : null });
  const card = (m) => {
    const C = m.card && AMI_CARD[m.card.k];
    if (!C) return "";
    const mine = m.from === me, cur = (amiOf(uid) || f).call, live = m.card.k === "call" && cur?.code === m.card.code ? cur.st : null;
    // L'estat de la trucada (la darrera): sonant, rebutjada, perduda o penjada
    const st = { ring: mine ? "Trucant…" : "Et truca", no: mine ? "No ha pogut contestar" : "L'has rebutjada", perduda: mine ? "No ha contestat" : "Trucada perduda", fi: mine ? "Has penjat" : "Trucada perduda" }[live];
    const old = (C.ttl && Date.now() - m.ts > C.ttl) || ["no", "perduda", "fi"].includes(live) || (m.card.k === "call" && cur?.code && cur.code !== m.card.code);
    return `<div class="xat-card k-${m.card.k} ${live ? `st-${live}` : ""}"><span class="xat-card-i" aria-hidden="true">${C.ico}</span><span><b>${C.t}</b><small>${st || (mine ? C.mine : C.other)}</small></span>
      ${old ? `<em>${live === "ring" ? "" : "Ja ha acabat"}</em>` : `<button type="button" class="btn sm ${mine ? "" : "primary"}" data-card="${m.card.k}:${esc(m.card.code)}">${mine ? C.again : C.go}</button>`}</div>`;
  };
  const paint = () => {
    const f2 = amiOf(uid) || f;
    const before = xatBefore(sec);
    log.innerHTML = `<div class="xat-intro">🔒 Xat privat entre vosaltres dos. Mantén premut un missatge (o fes-hi clic amb el botó dret) per respondre'l, reaccionar-hi o denunciar-lo.</div>`
      + xatRender(msgs, { me, who, readTs: f2.read?.[uid] || 0, newSince: AMI.chatSince, extra: card, empty: `Encara no us heu escrit. Saluda ${esc(name)} 👋` });
    xatAfter(sec, before, first);
    first = false;
    const typing = (f2.typing?.[uid] || 0) > Date.now() - 7000;
    $("[data-status]", sec).innerHTML = typing ? `<span class="xat-typing">escrivint<i></i><i></i><i></i></span>` : "Amics";
  };
  AMI.chatPaint = paint;
  AMI.chatTimer = setInterval(() => { if ($("[data-status] .xat-typing", sec)) paint(); }, 3000);
  AMI.chatUnsub = window.Online.amics.watchChat(f.id, (list) => {
    if (!list) { log.innerHTML = `<p class="muted">No s'han pogut carregar els missatges.</p>`; return; }
    const fresh = !first && list.length > msgs.length && list[list.length - 1]?.from !== me;
    msgs = list;
    paint();
    if (fresh) Sfx.play("tick");
    window.Online.amics.read(f.id);
  });
  xatBind(sec, {
    me, who, msg: (id) => msgs.find((m) => m.id === id),
    send: (t, re) => window.Online.amics.send(f.id, t, re ? { re } : {}),
    react: (id, e) => window.Online.amics.react(f.id, id, e),
    del: (id) => window.Online.amics.delMsg(f.id, id),
    report: (m) => amiReportData(name, uid, m.t),
    typing: () => window.Online.amics.typing(f.id),
  });
  // Invitacions: trucada, videotrucada, duel i campanya
  const invite = async (k) => {
    $(".xat-menu")?.remove();
    if (k === "call" || k === "video") {
      const code = await window.Online.call.create();
      if (!code) return;
      await window.Online.amics.send(f.id, k === "video" ? "📹 T'he fet una videotrucada" : "📞 T'he trucat", { card: { k: "call", code } });
      await window.Online.amics.ring(f.id, code, k === "video");
      amiRingOut(f.id, name);
      return amiCallGo(code, p, uid, k === "video", f.id);
    }
    if (k === "duel") {
      const code = await window.Online.amics.newDuel();
      if (!code) return;
      await window.Online.amics.send(f.id, "⚔️ Et repto a un duel!", { card: { k: "duel", code } });
      location.hash = `#duel/${code}`;
    }
    if (k === "camp") {
      const code = await window.Online.camp.create();
      if (!code) return;
      await window.Online.amics.send(f.id, "👥 Juguem una campanya electoral?", { card: { k: "camp", code } });
      location.hash = `#simulador/amics-${code}`;
    }
  };
  $$("[data-inv]", sec).forEach((b) => b.addEventListener("click", () => invite(b.dataset.inv)));
  $("[data-more]", sec).addEventListener("click", (e) => {
    if ($(".xat-menu")) { $(".xat-menu").remove(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const menu = h(`<div class="xat-menu" role="menu" style="top:${Math.round(r.bottom + 6)}px;right:${Math.round(innerWidth - r.right)}px">
      <button type="button" role="menuitem" data-mi="duel">⚔️ Repta'l a un duel</button>
      ${typeof simAmicsOn === "function" && simAmicsOn() ? `<button type="button" role="menuitem" data-mi="camp">👥 Campanya contra amics</button>` : ""}
      <button type="button" role="menuitem" data-mi="profile">👤 Perfil de ${esc(name)}</button>
      <button type="button" role="menuitem" data-mi="unfriend" class="danger">Deixa de ser amics</button>
    </div>`);
    document.body.appendChild(menu);
    menu.addEventListener("click", async (ev) => {
      const k = ev.target.closest("[data-mi]")?.dataset.mi;
      if (!k) return;
      menu.remove();
      if (k === "profile") amiCard(uid);
      else if (k === "unfriend") {
        if (!confirm(`Deixareu de ser amics i s'esborrarà tot el xat amb ${name}. Continuar?`)) return;
        amiChatClose();
        await window.Online.amics.remove(f.id);
        location.hash = "#amics";
      } else invite(k);
    });
    setTimeout(() => document.addEventListener("click", function off(ev) { if (!ev.target.closest(".xat-menu, [data-more]")) { $(".xat-menu")?.remove(); document.removeEventListener("click", off); } }), 0);
  });
  log.addEventListener("click", (e) => {
    const b = e.target.closest("[data-card]");
    if (!b) return;
    const [k, code] = b.dataset.card.split(":");
    if (k === "call") {
      const c = (amiOf(uid) || f).call;
      // Si la trucada encara sona per a tu, contestar-la (l'altre deixa de sentir el to)
      if (c?.code === code && c.st === "ring" && c.from !== me) { amiRingClose(f.id); amiAnswer(amiOf(uid) || f, false); }
      else amiCallGo(code, p, uid, null, f.id);
    }
    else if (k === "camp") location.hash = `#simulador/amics-${code}`;
    else if (k === "duel") location.hash = `#duel/${code}`;
  });
  if (!xatCoarse()) $("[data-xat-in]", sec).focus({ preventScroll: true });
}
// ---------- Sala de trucada de prova (Laboratori): #amics/trucada, #amics/trucada/CODI, #amics/trucada/LOCAL ----------
// Es crea des del Laboratori; qualsevol persona amb sessió hi entra amb l'enllaç. LOCAL: entre pestanyes d'aquest navegador.
const amiCallAlive = (code) => () => location.hash.toUpperCase().startsWith(`#AMICS/TRUCADA/${code}`);
async function amiCallRoom(root, code) {
  AMI.callUnsub?.();
  AMI.callUnsub = null;
  if (code === "LOCAL") {
    root.innerHTML = `<section class="card ami-call"><p class="simmp-lab">🧪 Laboratori: trucada entre pestanyes d'aquest navegador. No passa res per internet.</p>
      <h3>Prova local de trucada</h3><p class="muted">Obre aquesta mateixa adreça en una altra pestanya (o finestra) i entra a la trucada des de les dues amb el botó 📞.</p>
      <a class="btn ghost" href="#amics">← Torna</a></section>`;
    window.Call?.attach({ parent: "trucades", code: "LOCAL", title: "Prova local", lab: true, names: {}, alive: amiCallAlive("LOCAL") });
    return;
  }
  if (!amiOn()) {
    root.innerHTML = `<div class="card online-off">${window.Online?.pitchHtml ? window.Online.pitchHtml("T'han convidat a una trucada", "Entra amb Google per parlar amb els teus amics.") : ""}</div>`;
    return;
  }
  if (!code) {
    if (!(typeof featPreview === "function" && featPreview("trucada"))) { location.hash = "#amics"; return; }
    root.innerHTML = `<section class="card ami-call"><p class="simmp-lab">🧪 Laboratori: sala de trucada de prova.</p>
      <h3>Trucada de prova</h3><p class="muted">Crea una sala i envia l'enllaç a un amic: hi podeu ser fins a quatre persones, cadascú des del seu dispositiu. També ho pots provar entre dues pestanyes d'aquest navegador.</p>
      <div class="call-ask-btns"><button class="btn primary" data-call-new>Crea una sala</button><a class="btn" href="#amics/trucada/local">Prova entre pestanyes</a></div></section>`;
    $("[data-call-new]", root).addEventListener("click", async () => { const c = await window.Online.call.create(); if (c) location.hash = `#amics/trucada/${c}`; });
    return;
  }
  root.innerHTML = `<p class="muted">Entrant a la sala…</p>`;
  const r = await window.Online.call.join(code);
  if (r.err) { root.innerHTML = `<div class="card"><p>${esc(r.err === "connexio" ? "No s'ha pogut connectar. Torna-ho a provar." : r.err)}</p><a class="btn" href="#amics">Torna als amics</a></div>`; return; }
  const link = `${location.origin}${location.pathname.replace(/index.html$/, "")}#amics/trucada/${code}`;
  AMI.callUnsub = window.Online.call.watchRoom(code, (d) => {
    if (!amiCallAlive(code)()) return;
    if (!d || !d.players.includes(amiMe())) { root.innerHTML = `<div class="card"><p>Aquesta sala ja no existeix.</p><a class="btn" href="#amics">Torna als amics</a></div>`; window.Call?.detach(); return; }
    root.innerHTML = `<section class="card ami-call"><p class="kicker">Trucada de prova · sala ${esc(code)}</p>
      <h3>${d.players.length} ${d.players.length === 1 ? "persona" : "persones"} a la sala</h3>
      <ul class="ami-call-who">${d.players.map((u) => `<li>${esc(d.names?.[u] || "Jugador")}${u === amiMe() ? " (tu)" : ""}</li>`).join("")}</ul>
      <p class="muted">Entra a la trucada amb el botó 📞. Convida-hi algú amb l'enllaç (fins a quatre persones).</p>
      <div class="call-ask-btns"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Parlem a Política en Joc? 📞 ${link}`)}">WhatsApp</a><button class="btn" data-copy>Copia l'enllaç</button><button class="btn ghost" data-leave>Surt de la sala</button></div></section>`;
    $("[data-copy]", root).addEventListener("click", () => navigator.clipboard?.writeText(link).then(() => toast("Enllaç copiat")));
    $("[data-leave]", root).addEventListener("click", async () => { window.Call?.detach(); AMI.callUnsub?.(); await window.Online.call.leaveRoom(code); location.hash = "#amics"; });
    window.Call?.attach({ parent: "trucades", code, title: "Trucada de prova", lab: false, names: d.names || {}, alive: amiCallAlive(code) });
  });
}

// Denunciar un missatge (xat privat o de la campanya): arriba a l'equip com un avís al Centre de control
const amiFlagBtn = (name, uid, t) => `<button type="button" class="ami-flag" data-flag data-flag-who="${esc(name || "Jugador")}" data-flag-uid="${esc(uid || "")}" data-flag-t="${esc(t || "")}" aria-label="Denuncia aquest missatge" title="Denuncia aquest missatge">⚑</button>`;
function amiReport(b) { return amiReportData(b.dataset.flagWho, b.dataset.flagUid, b.dataset.flagT); }
async function amiReportData(who, uid, t) {
  if (!confirm(`Vols denunciar aquest missatge de ${who}? L'equip de Política en Joc el revisarà i, si cal, prendrà mesures.`)) return;
  if (typeof featPreview === "function" && featPreview("amics") && String(uid).startsWith("bot-")) { toast("Al laboratori no s'envia: és un amic fictici."); return; }
  const c = typeof rptContext === "function" ? rptContext() : { ver: "", ua: "", scr: "" };
  const ok = await window.Online?.reportSend?.({ text: `[Missatge denunciat] De ${who} (${uid}): «${t}»`.slice(0, 2000), email: "", where: (location.hash || "").slice(0, 100), ver: c.ver, ua: c.ua, scr: c.scr, err: "" });
  toast(ok ? "Gràcies. Hem rebut la denúncia i la revisarem." : "No s'ha pogut enviar la denúncia. Torna-ho a provar.");
}
document.addEventListener("click", (e) => { const b = e.target.closest?.("[data-flag]"); if (b) { e.preventDefault(); amiReport(b); } });
window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#amics/xat/")) amiChatClose();
  $(".ami-card-wrap")?.remove();
  AMI.cardPaint = null;
});

// ---------- Trucades entre amics: la que sona (qui la rep) i «Trucant…» (qui truca) ----------
// L'estat és a amistats/{id}.call (online.js). Tots dos ho veuen en directe per la llista d'amics.
const AMI_RING_MS = 40000; // si en 40 s ningú no contesta, «no contesta» (trucada perduda)
AMI.calls = {};
function amiCalls(list) {
  const me = amiMe();
  list.forEach((f) => {
    const c = f.call;
    if (!c || f.status !== "ok") return;
    const prev = AMI.calls[f.id];
    AMI.calls[f.id] = c;
    if (prev && prev.ts === c.ts && prev.st === c.st) return;
    const name = f.u?.[amiOther(f)]?.name || "Un amic", same = prev && prev.ts === c.ts;
    if (c.from !== me) {
      if (c.st === "ring" && Date.now() - c.ts < AMI_RING_MS) amiRingIn(f);
      else {
        amiRingClose(f.id);
        if (same && prev.st === "ring" && c.st === "perduda") { toast(`📞 Trucada perduda de ${name}`); if (document.hidden) amiSysNotif(`📞 Trucada perduda de ${name}`, "Toca per tornar-li la trucada", `call-${f.id}`, `#amics/xat/${encodeURIComponent(amiOther(f))}`); }
      }
    } else if (same && prev.st === "ring" && AMI.ringOut?.fid === f.id) {
      if (c.st === "no") { amiRingOutStop(); toast(`📵 ${name} no pot contestar ara`); window.Call?.hangup(); }
      else if (c.st === "ok") amiRingOutStop();
    }
  });
}
// Qui truca: to de trucada fins que contesten, rebutgen o passen 40 s
function amiRingOut(fid, name) {
  amiRingOutStop();
  amiTone("out");
  AMI.ringOut = { fid, t: setTimeout(async () => {
    if (AMI.calls[fid]?.st !== "ring") return;
    amiRingOutStop();
    toast(`📞 ${name} no contesta`);
    await window.Online.amics.callState(fid, "perduda");
    window.Call?.hangup();
  }, AMI_RING_MS) };
}
function amiRingOutStop() { if (AMI.ringOut) clearTimeout(AMI.ringOut.t); AMI.ringOut = null; amiToneStop(); }
// Qui la rep: la pantalla de trucada entrant, amb so i vibració
function amiRingIn(f) {
  const uid = amiOther(f), p = f.u?.[uid] || {}, c = f.call, name = p.name || "Un amic";
  if (window.Call?.state?.joined) { toast(`📞 ${name} et truca, però ja ets en una trucada`); return; }
  // Des de la notificació («Respon»): contesta directament
  if (AMI.answer === f.id) { AMI.answer = null; amiAnswer(f, false); return; }
  amiRingClose(f.id);
  const el = h(`<div class="ring" role="alertdialog" aria-modal="true" aria-label="Trucada entrant de ${esc(name)}" data-ring="${esc(f.id)}">
    <div class="ring-in">
      <p class="ring-k">${c.video ? "📹 Videotrucada" : "📞 Trucada de veu"} · Política en Joc</p>
      <div class="ring-av">${amiAv(p, 128)}</div>
      <h2>${esc(name)}</h2>
      <p class="ring-s">et truca<i></i><i></i><i></i></p>
      <div class="ring-btns">
        <button type="button" class="ring-b no" data-ring-no><span aria-hidden="true">📵</span>Rebutja</button>
        ${c.video ? `<button type="button" class="ring-b vid" data-ring-ok="1"><span aria-hidden="true">📹</span>Amb vídeo</button>` : ""}
        <button type="button" class="ring-b ok" data-ring-ok="0"><span aria-hidden="true">📞</span>Respon</button>
      </div>
    </div>
  </div>`);
  document.body.appendChild(el);
  if (!xatCoarse()) $("[data-ring-ok]", el).focus({ preventScroll: true });
  amiTone("in");
  navigator.vibrate?.([700, 400, 700, 400, 700, 400, 700, 400, 700, 400, 700]);
  if (document.hidden) amiSysNotif(`📞 ${name} et truca`, c.video ? "Videotrucada · Política en Joc" : "Trucada de veu · Política en Joc", `call-${f.id}`, `#amics/xat/${encodeURIComponent(uid)}`, true);
  AMI.ringTimer = setTimeout(() => amiRingClose(f.id), Math.max(3000, AMI_RING_MS - (Date.now() - c.ts)));
  el.addEventListener("click", async (e) => {
    if (e.target.closest("[data-ring-no]")) { amiRingClose(f.id); await window.Online.amics.callState(f.id, "no"); }
    const ok = e.target.closest("[data-ring-ok]");
    if (ok) { amiRingClose(f.id); await amiAnswer(f, ok.dataset.ringOk === "1"); }
  });
}
async function amiAnswer(f, video) {
  const uid = amiOther(f);
  await window.Online.amics.callState(f.id, "ok");
  location.hash = `#amics/xat/${encodeURIComponent(uid)}`;
  amiCallGo(f.call.code, f.u?.[uid] || {}, uid, video, f.id);
}
function amiRingClose(fid) {
  const el = $(`.ring[data-ring="${CSS.escape(fid)}"]`);
  if (!el && !AMI.ringTimer) return;
  el?.remove();
  clearTimeout(AMI.ringTimer);
  AMI.ringTimer = null;
  amiToneStop();
  navigator.vibrate?.(0);
  navigator.serviceWorker?.ready.then((r) => r.getNotifications({ tag: `call-${fid}` })).then((ns) => ns?.forEach((n) => n.close())).catch(() => {});
}
// Tons: el de trucada entrant (dues notes, com un mòbil) i el de «trucant» (425 Hz, el to espanyol)
let amiCtx = null, amiToneT = null;
function amiTone(kind) {
  amiToneStop();
  try {
    amiCtx = amiCtx || new (window.AudioContext || window.webkitAudioContext)();
    amiCtx.resume?.().catch(() => {});
    const beep = (freqs, dur, vol = 0.16) => {
      const t = amiCtx.currentTime, g = amiCtx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.setValueAtTime(vol, t + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, t + dur);
      g.connect(amiCtx.destination);
      freqs.forEach((fr) => { const o = amiCtx.createOscillator(); o.type = "sine"; o.frequency.value = fr; o.connect(g); o.start(t); o.stop(t + dur); });
    };
    const play = kind === "in" ? () => { beep([880, 1320], 0.32); setTimeout(() => beep([988, 1480], 0.32), 420); } : () => beep([425], 1.3, 0.1);
    play();
    amiToneT = setInterval(play, kind === "in" ? 2000 : 4300);
  } catch { /* sense àudio */ }
}
function amiToneStop() { clearInterval(amiToneT); amiToneT = null; }
// Notificació del sistema (amb l'app oberta en segon pla). Fa servir el service worker, com les push.
function amiSysNotif(title, body, tag, hash, call = false) {
  if (!("Notification" in window) || Notification.permission !== "granted" || !navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then((r) => r.showNotification(title, {
    body, tag, renotify: true, icon: "img/icon-192.png", badge: "img/badge-96.png",
    requireInteraction: call, vibrate: call ? [700, 400, 700, 400, 700] : [120, 60, 120],
    data: { url: `./${hash}`, fid: tag.replace(/^(call|xat)-/, ""), call },
    ...(call ? { actions: [{ action: "answer", title: "📞 Respon" }, { action: "decline", title: "📵 Rebutja" }] } : {}),
  })).catch(() => {});
}
// Respostes des de la notificació (service worker): «Respon» obre l'app amb ?respon=<amistat>; «Rebutja», si l'app és
// oberta, li arriba com a missatge
navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.type === "call-decline" && e.data.fid) { amiRingClose(e.data.fid); window.Online?.amics?.callState(e.data.fid, "no"); }
});
(() => {
  const q = new URLSearchParams(location.search).get("respon");
  if (!q) return;
  AMI.answer = q;
  const u = new URL(location.href);
  u.searchParams.delete("respon");
  history.replaceState(null, "", u.pathname + u.search + u.hash);
})();
