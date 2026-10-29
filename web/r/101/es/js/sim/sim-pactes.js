// Simulador del 29N · Campanya contra amics: el xat entre els equips de campanya i la negociació per formar govern.
// El xat (general i privat amb cada jugador) està obert tota la partida. Quan es constitueix el Congrés, des del xat
// privat es poden oferir pactes (coalició, suport o abstenció a la investidura) i l'altre els pot acceptar allà mateix.
// Les regles dels pactes i el recompte són a sim-multi.js; la sala, a sim-amics.js (en línia o la del laboratori).

const SIM_CHAT_MAX = 280;
const simMpMe = () => simMpUid();
// Nom curt d'un jugador per al xat: sigles del partit i nom de la persona
function simMpWho(G, uid) {
  if (uid === "sys") return { sig: "🏛️", color: "#17173d", party: "", name: "Congreso", hid: null, P: null, sys: true };
  if (String(uid).startsWith("ai:")) {
    const R = simMpRef(G.mp.W, uid.slice(3));
    return { sig: R?.sig || "?", color: R?.color || "#888", party: R?.name || "", name: "Equipo negociador", hid: uid.slice(3), P: R, ai: true };
  }
  const d = G.mpDoc, k = d.players.indexOf(uid);
  const P = G.mp?.W?.hum[`h${k}`]?.me || d.seats[uid]?.party;
  return { sig: P?.sig || "?", color: P?.color || "#888", party: P?.name || "", name: d.seats[uid]?.name || "Jugador", hid: `h${k}`, P };
}
const simMpUidOf = (G, hid) => G.mpDoc.players[Number(hid.slice(1))];

// ---------- El xat ----------
function simChatButton(G) {
  const d = G.mpDoc;
  if (!d || d.status === "lobby") return "";
  const n = simChatUnread(G);
  return `<button type="button" class="simmp-chatbtn" data-chat-open aria-label="Chat de los equipos${n ? `, ${n} mensajes nuevos` : ""}">💬<span>Chat</span>${n ? `<b>${n}</b>` : ""}</button>`;
}
function simChatUnread(G, tab = null) {
  const me = simMpMe(), seen = G.chatSeen || {};
  return (G.mpDoc?.chat || []).filter((m) => m.from !== me && (m.to === "all" || m.to === me)).filter((m) => {
    const t = m.to === "all" ? "all" : String(m.from).startsWith("ai:") ? "ai" : m.from;
    return (tab === null || t === tab) && m.ts > (seen[t] || 0);
  }).length;
}
function simChatToggle(G, open = !G.chatOpen) {
  G.chatOpen = open;
  if (!open) { $(".simchat")?.remove(); simMpStrip(G, G.mpDoc); return; }
  G.chatTab = G.chatTab || "all";
  simChatPaint(G);
}
// Frases ràpides segons la pestanya i el moment de la partida
function simChatChips(G, tab) {
  const d = G.mpDoc;
  if (tab === "ai") return [];
  if (tab === "all") return d.leg ? ["Buena sesión a todos 🏛️", "Votaremos a favor 👍", "Esta no la votaremos ✋", "😂"] : d.neg ? ["¿Quién quiere hablar de pactos? 🤝", "Felicidades por el resultado 👏", "😅"] : ["¡Buena campaña a todos! 🍀", "Nos vemos en las urnas 🗳️", "👏", "😂"];
  if (d.leg) return ["¿Nos apoyáis en la ley? 📜", "Contad con nuestro voto 👍", "Esta no la podemos votar ✋", "¿Qué necesitáis a cambio? 🤔"];
  if (d.neg) return ["¿Hablamos de pactos? 🤝", "¿Qué necesitáis para votarnos?", "¿Votaréis a favor de la investidura?", "De acuerdo 👍", "Tenemos que pensarlo 🤔"];
  return ["¿Hacemos piña? 😏", "¡Buena campaña! 🍀", "Ya nos veremos en las urnas 😎", "😂"];
}
function simChatPaint(G) {
  if (!G.chatOpen || !G.mpDoc) return;
  const d = G.mpDoc, me = simMpMe();
  let box = $(".simchat");
  if (!box) {
    box = h(`<section class="simchat xat" role="dialog" aria-label="Chat de los equipos de campaña">
      <header class="xat-head"><span class="simchat-ttl"><b>Equipos de campaña</b><small data-chat-sub></small></span><button type="button" class="xat-act" data-chat-close aria-label="Cierra el chat">✕</button></header>
      <nav class="simchat-tabs" role="tablist" data-tabs></nav>
      <div class="xat-log simchat-log" data-xat-log aria-live="polite"></div>
      <div data-compose></div>
      <div class="xat-foot">${xatComposer({ max: SIM_CHAT_MAX })}</div>
    </section>`);
    document.body.appendChild(box);
    $("[data-chat-close]", box).addEventListener("click", () => simChatToggle(G, false));
    xatBind(box, {
      me, who: (u) => simChatWho(G, u), msg: (id) => (G.mpDoc.chat || []).find((m) => m.id === id),
      send: (t, re) => simChatSend(G, G.chatTab, t, re ? { re } : {}),
      react: (id, e) => simMpApi().react?.(G.mp.code, id, e),
      del: (id) => simMpApi().delMsg?.(G.mp.code, id),
      canDelete: (m) => !m.pact,
      report: (m) => amiReportData(simMpWho(G, m.from).name, m.from, m.t),
    });
    $("[data-xat-log]", box).addEventListener("click", (e) => {
      const b = e.target.closest("[data-pact-ok], [data-pact-no]");
      if (b) simPactAnswer(G, b.dataset.pactOk || b.dataset.pactNo, !!b.dataset.pactOk);
    });
  }
  const tab = G.chatTab;
  const others = d.players.filter((u) => u !== me);
  const isAi = (x) => String(x).startsWith("ai:");
  const aiTab = (d.chat || []).some((m) => isAi(m.from) && m.to === me);
  $("[data-chat-sub]", box).textContent = d.leg ? "Legislatura" : d.neg ? "Negociación para formar gobierno" : d.status === "playing" ? `Campaña · día ${Math.min(d.day, 6)}` : "";
  // Pestanyes: tots i cada partit (amb el seu color i les sigles)
  $("[data-tabs]", box).innerHTML = [["all", "Todos"], ...others.map((u) => [u, simMpWho(G, u).sig]), ...(aiTab ? [["ai", "Otros partidos"]] : [])].map(([k, l]) => {
    const n = simChatUnread(G, k);
    const W = k === "all" || k === "ai" ? null : simMpWho(G, k);
    return `<button type="button" role="tab" aria-selected="${k === tab}" class="${k === tab ? "on" : ""} ${W ? "priv" : ""}" data-tab="${esc(k)}" ${W ? `style="--pc:${W.color}" title="Xat privat amb ${esc(W.name)} (${esc(W.party)})"` : ""}>${W ? `<i>${esc(W.sig.slice(0, 3))}</i>` : k === "all" ? "📣 " : ""}<span>${esc(W ? W.name : l)}</span>${n ? `<b>${n}</b>` : ""}</button>`;
  }).join("");
  $$("[data-tab]", box).forEach((b) => b.addEventListener("click", () => { G.chatTab = b.dataset.tab; G.chatCompose = false; xatReplySet(box, null); simChatPaint(G); }));
  // Missatges de la pestanya (el general, o els privats entre tu i aquest jugador)
  const msgs = (d.chat || []).filter((m) => (tab === "all" ? m.to === "all" : tab === "ai" ? (isAi(m.from) && m.to === me) || (m.from === me && isAi(m.to)) : (m.from === me && m.to === tab) || (m.from === tab && m.to === me)));
  const fresh = box.dataset.tab !== tab;
  if (fresh) { G.chatSince = (G.chatSeen || {})[tab] || 0; box.dataset.tab = tab; }
  const before = xatBefore(box);
  const W = tab !== "all" && tab !== "ai" ? simMpWho(G, tab) : null;
  $("[data-xat-log]", box).innerHTML = `${W ? `<div class="xat-intro">🔒 Chat privado con <b>${esc(W.name)}</b> (${esc(W.party)}). Nadie más puede leerlo.${d.neg && !d.neg.result ? " Desde aquí le puedes ofrecer un pacto." : ""}</div>` : ""}`
    + xatRender(msgs, {
      me, who: (u) => simChatWho(G, u), names: tab === "all", newSince: G.chatSince,
      extra: (m) => { const p = m.pact ? G.mpDoc.neg?.pacts?.[m.pact] : null; return p ? simPactCard(G, p) : ""; },
      empty: tab === "ai" ? "Aquí te escriben los partidos de la máquina cuando buscan apoyos." : tab === "all" ? "Aquí habláis todos los equipos. Para hablar en privado, elige un partido arriba." : `Todavía no habéis hablado. Saluda a ${esc(W.name)} 👋`,
    });
  xatAfter(box, before, fresh);
  xatChipsSet(box, simChatChips(G, tab));
  $("[data-xat-in]", box).placeholder = W ? `Mensaje privado a ${W.name}…` : tab === "ai" ? "Responde a los partidos…" : "Mensaje a todos los equipos…";
  // Pactes: només als xats privats i quan el Congrés ja és constituït
  const compose = $("[data-compose]", box);
  box.classList.toggle("composing", !!G.chatCompose && tab !== "all" && tab !== "ai");
  if (tab !== "all" && tab !== "ai" && d.neg && !d.neg.result) {
    compose.innerHTML = G.chatCompose ? simPactComposer(G, tab) : `<div class="simchat-pactrow"><button type="button" class="btn" data-pact-new>🤝 Ofrece un pacto a ${esc(simMpWho(G, tab).sig)}</button></div>`;
    $("[data-pact-new]", compose)?.addEventListener("click", () => { G.chatCompose = true; simChatPaint(G); });
    if (G.chatCompose) simPactComposerBind(G, compose, tab);
  } else compose.innerHTML = tab !== "all" && tab !== "ai" && !d.neg ? `<p class="simchat-note">Los pactos se abren cuando se constituya el Congreso, después de la noche electoral.</p>` : "";
  // Llegit
  G.chatSeen = { ...(G.chatSeen || {}), [tab]: Date.now() };
  simMpStrip(G, d);
}
// Qui escriu, per al xat: nom de la persona, sigles i color del partit
function simChatWho(G, u) {
  const W = simMpWho(G, u);
  return { name: W.name, sig: W.sig, color: W.color, av: `<span class="xat-sig">${esc((W.sig || "?").slice(0, 3))}</span>` };
}
async function simChatSend(G, to, t, extra = {}) {
  const msg = { id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, from: simMpMe(), to, t, ts: Date.now(), ...extra };
  await simMpApi().chat(G.mp.code, msg);
  Sfx.play("pick");
}

// ---------- Pactes ----------
const simPactKindText = (p) => SIM_MP_PACT[p.kind].label + (p.kind === "coal" && p.mins ? ` · ${p.mins} ${p.mins === 1 ? "ministerio" : "ministerios"}` : "");
function simPactCard(G, p) {
  const me = G.mp.hid;
  const C = simMpRef(G.mp.W, p.cand), S = simMpRef(G.mp.W, simMpPartner(p));
  const st = { pendent: ["Pendiente", "warn"], ok: ["✅ Pacto firmado", "ok"], no: ["Rechazado", "ko"] }[p.status];
  const canAnswer = p.status === "pendent" && p.to === me && !G.mpDoc.neg?.result;
  return `<div class="simpact ${st[1]}">
    <div class="simpact-h"><span>🤝 ${esc(simPactKindText(p))}</span><em>${st[0]}</em></div>
    <p><b>${esc(C.sig)}</b> es el candidato a la presidencia; <b>${esc(S.sig)}</b> ${SIM_MP_PACT[p.kind].text}.</p>
    ${(p.measures || []).length ? `<ul>${p.measures.map((id) => `<li>${esc(simMeasure(id)?.t || id)}</li>`).join("")}</ul>` : ""}
    ${canAnswer ? `<div class="simpact-btns"><button type="button" class="btn primary sm" data-pact-ok="${esc(p.id)}">Acepta</button><button type="button" class="btn sm" data-pact-no="${esc(p.id)}">Rechaza</button></div>` : ""}
  </div>`;
}
function simPactComposer(G, tab) {
  const me = G.mp.W.hum[G.mp.hid].me, them = simMpWho(G, tab).P;
  const draft = (G.pactDraft = G.pactDraft || { cand: "jo", kind: "inv", measures: [], mins: 2 });
  const wantsThem = simWants(them).map((m) => m.id), wantsMe = simWants(me).map((m) => m.id);
  const list = [...new Set([...wantsThem, ...wantsMe, ...draft.measures])].map(simMeasure).filter(Boolean);
  const more = SIM_MEASURES.filter((m) => !list.includes(m));
  const opt = (m) => `<label class="simpact-m"><input type="checkbox" value="${m.id}" ${draft.measures.includes(m.id) ? "checked" : ""}><span>${esc(m.t)}${wantsThem.includes(m.id) ? ` <em>la quieren ${esc(them.sig)}</em>` : ""}${wantsMe.includes(m.id) ? " <em>la quieres tú</em>" : ""}</span></label>`;
  return `<div class="simpact-new">
    <p class="simpact-q">¿Quién es el candidato a la presidencia?</p>
    <div class="simpact-seg"><button type="button" data-cand="jo" class="${draft.cand === "jo" ? "on" : ""}">${esc(me.sig)} (tú)</button><button type="button" data-cand="ells" class="${draft.cand === "ells" ? "on" : ""}">${esc(them.sig)}</button></div>
    <p class="simpact-q">¿Qué hace el otro partido?</p>
    <div class="simpact-seg">${Object.entries(SIM_MP_PACT).map(([k, x]) => `<button type="button" data-kind="${k}" class="${draft.kind === k ? "on" : ""}">${x.label}</button>`).join("")}</div>
    ${draft.kind === "coal" ? `<label class="simpact-mins">Ministerios para el socio <input type="number" min="1" max="6" value="${draft.mins}" data-mins></label>` : ""}
    <p class="simpact-q">Medidas del acuerdo (hasta 3)</p>
    <div class="simpact-ms">${list.map(opt).join("")}<details><summary>Más medidas</summary>${more.map(opt).join("")}</details></div>
    <div class="simpact-btns"><button type="button" class="btn ghost sm" data-pact-cancel>Cancela</button><button type="button" class="btn primary sm" data-pact-send>Envía la propuesta</button></div>
  </div>`;
}
function simPactComposerBind(G, el, tab) {
  const draft = G.pactDraft;
  $$("[data-cand]", el).forEach((b) => b.addEventListener("click", () => { draft.cand = b.dataset.cand; simChatPaint(G); }));
  $$("[data-kind]", el).forEach((b) => b.addEventListener("click", () => { draft.kind = b.dataset.kind; simChatPaint(G); }));
  $("[data-mins]", el)?.addEventListener("change", (e) => { draft.mins = Math.max(1, Math.min(6, Number(e.target.value) || 1)); });
  $$(".simpact-m input", el).forEach((i) => i.addEventListener("change", () => {
    const set = new Set(draft.measures);
    if (i.checked) set.add(i.value); else set.delete(i.value);
    if (set.size > 3) { i.checked = false; return toast("Como mucho, tres medidas por pacto"); }
    draft.measures = [...set];
  }));
  $("[data-pact-cancel]", el).addEventListener("click", () => { G.chatCompose = false; simChatPaint(G); });
  $("[data-pact-send]", el).addEventListener("click", async () => {
    const themHid = simMpWho(G, tab).hid, me = G.mp.hid;
    const cand = draft.cand === "jo" ? me : themHid;
    const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const pact = { id, from: me, to: themHid, cand, kind: draft.kind, measures: draft.measures, mins: draft.kind === "coal" ? draft.mins : 0, status: "pendent", ts: Date.now() };
    await simMpApi().neg(G.mp.code, { [`neg.pacts.${id}`]: pact });
    await simChatSend(G, tab, cand === me ? "Te propongo un pacto para mi investidura:" : "Te propongo un pacto: tú eres el candidato y nosotros te apoyamos.", { pact: id });
    G.chatCompose = false;
    G.pactDraft = null;
  });
}
async function simPactAnswer(G, id, ok) {
  const p = G.mpDoc.neg?.pacts?.[id];
  if (!p || p.status !== "pendent") return;
  await simMpApi().neg(G.mp.code, { [`neg.pacts.${id}.status`]: ok ? "ok" : "no" });
  await simChatSend(G, G.mp.W.hum[p.from] ? simMpUidOf(G, p.from) : `ai:${p.from}`, ok ? "¡Aceptado! Pacto firmado. 🤝" : "No lo podemos aceptar así.", { reply: id });
  Sfx.play(ok ? "win" : "ko");
}

// ---------- La negociació per formar govern ----------
// Pantalla principal després de la nit electoral: el Congrés, els suports de cada candidat i la investidura
function simMpNeg(G) {
  const s = G.state, d = G.mpDoc, neg = d?.neg;
  G.ctx.hud([]);
  if (!neg) { simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card"><p class="sim-lead">Constituyendo el Congreso…</p></div></div>`); return; }
  if (neg.result && G.negDone !== neg.result.ts) return simMpNegResult(G);
  const W = G.mp.W, me = G.mp.hid;
  const V0 = (G.mpV0 = G.mpV0 || simMpCongress(W));
  const seatOf = (hid) => V0.res.seats[hid === W.mp.ids[0] ? "jo" : hid] || 0;
  const humans = W.mp.ids;
  const pacts = simMpPacts(neg);
  // Suports compromesos de cada candidat possible
  const sup = (cand) => humans.reduce((t, h) => t + (simMpBound(neg, h, cand) === "si" ? seatOf(h) : 0), 0);
  const tries = neg.attempts.length;
  const vote = neg.vote;
  const extra = (G.negExtra = G.negExtra || []);
  const myDeal = simMpDeal(neg, me, extra);
  const preview = !vote ? simMpTally(W, myDeal, Object.fromEntries(humans.map((h) => [h, simMpBound(neg, h, me) || "abs"])), V0) : null;
  const el = simMount(G, `<div class="sim-wrap"><div class="card sim-card simmp-card simneg">
    <p class="sim-kick">Constitución del Congreso · formación de gobierno</p>
    <h3 class="sim-h">Hay que sumar 176 escaños</h3>
    <p class="sim-lead">El Congreso ya está constituido. Ahora toca negociar: abre el chat, habla con los demás equipos y ofréceles pactos. Para ser investido hace falta la mayoría absoluta (176) en la primera votación o más síes que noes en la segunda. Hay ${SIM_MP_TRIES} intentos antes de la repetición electoral.</p>
    <div class="simneg-hemi">${simHemi(s, s.res.seats, `<strong>${s.res.seats.jo}</strong><small>escaños de ${esc(s.me.sig)}</small>`)}</div>
    <h4 class="sim-h4">Los partidos de los jugadores</h4>
    <ul class="simmp-seats">${humans.map((h) => { const P = W.hum[h].me, u = simMpUidOf(G, h); return `<li class="${h === me ? "me" : ""}">${simLogoSvg(P, 36)}<span><b>${esc(P.name)} · ${seatOf(h)} ${seatOf(h) === 1 ? "escaño" : "escaños"}</b><small>${esc(d.seats[u]?.name || "")}${h === me ? " · tú" : ""} · apoyos firmados para ser presidente: ${sup(h)}</small></span>${h === me ? "" : `<button type="button" class="btn sm" data-chat-to="${esc(u)}">💬 Habla con él</button>`}</li>`; }).join("")}</ul>
    <h4 class="sim-h4">Pactos</h4>
    ${pacts.filter((p) => p.status === "ok" || p.from === me || p.to === me).length ? `<div class="simneg-pacts">${pacts.filter((p) => p.status === "ok" || p.from === me || p.to === me).map((p) => simPactCard(G, p)).join("")}</div>` : `<p class="simmp-note">Todavía no hay ningún pacto. Abre el chat privado con otro jugador y ofrécele uno.</p>`}
    ${vote ? simMpVoteHtml(G, V0) : `
      <h4 class="sim-h4">Si te presentaras ahora a la investidura</h4>
      <p class="simmp-note">${W.rivals.length ? "Los partidos de la máquina votan según la afinidad contigo, las medidas del acuerdo y el papel que tienen en él. " : ""}Los jugadores con un pacto firmado votan lo que dice el pacto; el resto decide en la votación (aquí contamos que se abstienen).</p>
      <div class="simneg-prev"><span class="si">Sí <b>${preview.si}</b></span><span class="no">No <b>${preview.no}</b></span><span class="abs">Abstención <b>${preview.abs}</b></span><em>${preview.first ? "Mayoría absoluta en la primera votación" : preview.second ? "Pasaría en la segunda votación (más síes que noes)" : "No saldría"}</em></div>
      <details class="simneg-why"><summary>Cómo votaría cada grupo</summary><ul>${Object.entries(preview.votes).sort((a, b) => b[1].n - a[1].n).map(([id, v]) => `<li>${simLogo(simById(s, id === me ? "jo" : id) || simMpPartyRef(G, id))}<span><b>${v.n} · ${{ si: "Sí", no: "No", abs: "Abstención" }[v.v]}</b><small>${esc(v.human ? (id === me ? "Es tu partido." : simMpBound(neg, id, me) ? "Tiene un pacto firmado contigo." : "Lo decidirá el jugador en la votación.") : v.why)}</small></span></li>`).join("")}</ul></details>
      ${W.rivals.length ? "" : `<p class="simmp-note">En el Congreso solo estáis vosotros: para ser investido necesitas el apoyo (o la abstención) de los demás jugadores. En la segunda votación basta con más síes que noes.</p>`}
      <details class="simneg-extra" ${W.rivals.length ? "" : "hidden"}><summary>Añade medidas para convencer a otros grupos (${extra.length}/2)</summary>${SIM_MEASURES.map((m) => `<label class="simpact-m"><input type="checkbox" value="${m.id}" ${extra.includes(m.id) ? "checked" : ""}><span>${esc(m.t)}</span></label>`).join("")}</details>
      <div class="sim-actions-row"><button type="button" class="btn primary lg" data-invest ${seatOf(me) ? "" : "disabled"}>Preséntate a la investidura${tries ? ` (intento ${tries + 1} de ${SIM_MP_TRIES})` : ""}</button></div>`}
    ${neg.ai && !vote && neg.ai.n === tries + 1 && !neg.ai.cand ? `<div class="simneg-ai">🏛️ <b>Ronda de consultas:</b> ningún partido de la máquina tiene apoyos suficientes. Si ninguno de vosotros se presenta a la investidura en unos segundos, se repetirán las elecciones.</div>` : ""}
    ${neg.ai && !vote && neg.ai.n === tries + 1 && neg.ai.cand ? `<div class="simneg-ai">🏛️ <b>Ronda de consultas:</b> ${esc(simMpRef(W, neg.ai.cand).name)} (${neg.ai.seats} escaños) intentará la investidura si ninguno de vosotros se presenta antes. Ha ofrecido pactos a algunos de vosotros: mira la pestaña «Otros partidos» del chat.</div>` : ""}
    ${neg.attempts.length ? `<h4 class="sim-h4">Votaciones hechas</h4><ul class="simneg-tries">${neg.attempts.map((a) => `<li>${esc(simMpRef(W, a.cand).sig)}: sí ${a.si} · no ${a.no} · abstención ${a.abs} — ${a.pass ? "investido" : "no ha salido"}</li>`).join("")}</ul>` : ""}
  </div></div>`);
  $$("[data-chat-to]", el).forEach((b) => b.addEventListener("click", () => { G.chatTab = b.dataset.chatTo; simChatToggle(G, true); }));
  $$(".simneg-extra input", el).forEach((i) => i.addEventListener("change", () => {
    const set = new Set(extra);
    if (i.checked) set.add(i.value); else set.delete(i.value);
    if (set.size > 2) { i.checked = false; return toast("Como mucho, dos medidas más"); }
    G.negExtra = [...set];
    simMpNeg(G);
  }));
  $("[data-invest]", el)?.addEventListener("click", async () => {
    if (!confirm("Se convocará la votación de investidura contigo como candidato. ¿Adelante?")) return;
    await simMpApi().neg(G.mp.code, { "neg.vote": { cand: me, measures: G.negExtra || [], n: tries + 1, votes: {}, ts: Date.now() } });
    await simChatSend(G, "all", `Me presento a la investidura (intento ${tries + 1}). ¡Votemos!`);
  });
  $$("[data-vote]", el).forEach((b) => b.addEventListener("click", () => simMpApi().neg(G.mp.code, { [`neg.vote.votes.${me}`]: b.dataset.vote })));
  simMpTallyMaybe(G);
  simMpAiDrive(G);
}
const simMpPartyRef = (G, id) => G.mp.W.hum[id]?.me || G.mp.W.rivals.find((r) => r.id === id);
// La votació en curs: qui ha votat i, si et toca, els teus botons
function simMpVoteHtml(G, V0) {
  const { neg } = G.mpDoc, v = neg.vote, me = G.mp.hid, W = G.mp.W;
  const C = simMpRef(W, v.cand);
  const rows = W.mp.ids.filter((h) => h !== v.cand).map((h) => {
    const bound = simMpBound(neg, h, v.cand), cast = v.votes?.[h];
    const seated = (V0.res.seats[h === W.mp.ids[0] ? "jo" : h] || 0) > 0;
    const how = !seated ? "Sin escaños: no vota" : bound ? `Pacto firmado: ${bound === "si" ? "sí" : "abstención"}` : cast ? "Ya ha votado" : "Pensándoselo…";
    return `<li class="${h === me ? "me" : ""}">${simLogoSvg(W.hum[h].me, 30)}<span><b>${esc(W.hum[h].me.name)}</b><small>${how}</small></span></li>`;
  }).join("");
  const mine = simMpVoteWaiting(W, neg, V0).includes(me);
  return `<div class="simneg-vote">
    <h4 class="sim-h4">Votación de investidura · ${esc(C.name)} (intento ${v.n} de ${SIM_MP_TRIES})</h4>
    ${W.hum[v.cand] ? "" : `<p class="simmp-note">Candidato propuesto tras la ronda de consultas. Lleva el apoyo de otros partidos de la máquina; vuestros votos pueden decidirlo.</p>`}
    ${(v.measures || []).length ? `<p class="simmp-note">Medidas del acuerdo del candidato: ${v.measures.map((id) => `«${esc(simLc(simMeasure(id).t))}»`).join(", ")}.</p>` : ""}
    <ul class="simmp-seats">${rows}</ul>
    ${mine ? `<p class="simpact-q">Tu voto:</p><div class="simpact-btns"><button type="button" class="btn primary" data-vote="si">Sí</button><button type="button" class="btn" data-vote="abs">Abstención</button><button type="button" class="btn" data-vote="no">No</button></div>` : v.cand === me ? `<p class="simmp-note">Eres el candidato. Cuando hayan votado todos los jugadores, se hace el recuento.</p>` : ""}
  </div>`;
}
// Recompte: el fa el client del candidat quan tots els jugadors sense pacte ja han votat (al laboratori, si el candidat és
// un amic fictici, el fa la sala local)
async function simMpTallyMaybe(G) {
  const d = G.mpDoc, neg = d.neg, v = neg?.vote, me = G.mp.hid;
  if (!v || v.cand !== me || G.tallying === v.ts) return;
  const out = simMpVoteClose(G.mp.W, neg);
  if (!out) return;
  G.tallying = v.ts;
  await simMpApi().neg(G.mp.code, out.patch);
  await simChatSend(G, "all", out.msg);
}
// Hi ha govern (o repetició electoral): el resultat per a tothom i la pantalla final
function simMpNegResult(G) {
  const s = G.state, R = G.mpDoc.neg.result, W = G.mp.W, me = G.mp.hid;
  G.negDone = R.ts;
  const role = simMpRole(G.mpDoc.neg, me);
  const toV = (id) => (id === me ? "jo" : id);
  s.gov = { outcome: role, final: R.pass ? { cand: toV(R.cand), deal: { cand: toV(R.cand), measures: R.deal.measures, roles: Object.fromEntries(Object.entries(R.deal.roles).map(([k, v]) => [toV(k), v])) }, votes: Object.fromEntries(Object.entries(R.votes).map(([k, v]) => [toV(k), v])), first: R.first } : null };
  simSave(G);
  Sfx.play(role === "pm" ? "win" : R.pass ? "ok" : "ko");
  // Amb govern, la legislatura (sim-legis.js); sense, repetició electoral i final
  if (R.pass) { s.stage = "mp-leg"; simSave(G); return simMpLeg(G); }
  simFinishGame(G);
}
// Resum del govern per a la pantalla final
function simMpGovHtml(G) {
  const neg = G.mpDoc?.neg, R = neg?.result, W = G.mp.W;
  if (!R) return "";
  if (!R.pass) return `<p class="simmp-gov">Nadie ha sido investido en ${SIM_MP_TRIES} intentos: <b>se repiten las elecciones</b>.</p>`;
  const C = simMpRef(W, R.cand);
  const coal = Object.entries(R.deal.roles).filter(([, r]) => r === "coal").map(([id]) => simMpRef(W, id)?.sig || id);
  const sup = Object.entries(R.deal.roles).filter(([, r]) => r !== "coal").map(([id]) => simMpRef(W, id)?.sig || id);
  return `<p class="simmp-gov">🏛️ <b>${esc(C.cand || C.leader || C.name)} (${esc(C.sig)})</b> es presidente${coal.length ? `, en un gobierno de coalición con ${esc(coal.join(", "))}` : ""}${sup.length ? `, con el apoyo de ${esc(sup.join(", "))}` : ""}. Investidura ${R.first ? "en la primera votación" : "en la segunda votación"}.</p>`;
}

// La ronda de consultes i les investidures dels partits de la màquina. Ho fa el client de l'amfitrió (una sola vegada).
const SIM_MP_AI_WAIT = 40000; // temps per negociar abans que el candidat de la màquina se sotmeti a la votació
async function simMpAiDrive(G) {
  const d = G.mpDoc, neg = d?.neg;
  if (!neg || neg.result || d.host !== simMpUid()) return;
  const W = G.mp.W, api = simMpApi(), code = G.mp.code;
  if (!W.rivals.length) return; // només hi ha els partits dels jugadors: el govern el formen ells
  const n = (neg.attempts || []).length + 1;
  // Recompte d'una votació d'un candidat de la màquina
  if (neg.vote) {
    if (W.hum[neg.vote.cand] || G.aiTally === neg.vote.ts) return;
    const out = simMpVoteClose(W, neg);
    if (!out) return;
    G.aiTally = neg.vote.ts;
    await api.neg(code, out.patch);
    await api.chat(code, { id: `m${Date.now().toString(36)}`, from: `ai:${neg.vote.cand}`, to: "all", t: out.msg, ts: Date.now() });
    return;
  }
  if (n > SIM_MP_TRIES) return;
  // Nova ronda de consultes: el candidat de la màquina i les seves ofertes als jugadors
  if (!neg.ai || neg.ai.n !== n) {
    if (G.aiPlanning === n) return;
    G.aiPlanning = n;
    const plan = simMpAiPlan(W, neg);
    const { pacts, ...ai } = plan;
    await api.neg(code, { "neg.ai": { ...ai, go: Date.now() + SIM_MP_AI_WAIT }, ...Object.fromEntries(Object.entries(pacts).map(([id, p]) => [`neg.pacts.${id}`, p])) });
    if (!plan.cand) {
      await api.chat(code, { id: `m${Date.now().toString(36)}r`, from: "sys", to: "all", t: "Ronda de consultas: ningún partido de la máquina tiene apoyos suficientes para intentar la investidura. Si ninguno de vosotros se presenta, se repetirán las elecciones.", ts: Date.now() });
      return;
    }
    const C = simMpRef(W, plan.cand);
    await api.chat(code, { id: `m${Date.now().toString(36)}r`, from: `ai:${plan.cand}`, to: "all", t: `Ronda de consultas: ${C.name} (${plan.seats} escaños) intentará la investidura. Ahora mismo cuenta con ${plan.si} síes. Buscamos apoyos.`, ts: Date.now() });
    for (const p of Object.values(pacts)) {
      await api.chat(code, { id: `m${Date.now().toString(36)}${p.id}`, from: `ai:${plan.cand}`, to: simMpUidOf(G, p.to), t: p.kind === "coal" ? "Os ofrecemos entrar en el Gobierno. ¿Qué decís?" : "Necesitamos vuestros votos en la investidura. A cambio, incluimos una de vuestras prioridades.", pact: p.id, ts: Date.now() });
    }
    return;
  }
  // Quan arriba l'hora, si cap jugador no s'hi ha presentat, el candidat de la màquina se sotmet a la votació
  const wait = neg.ai.go - Date.now();
  if (wait > 0) { clearTimeout(G.aiT); G.aiT = setTimeout(() => G.ctx.alive() && simMpAiDrive(G), wait + 200); return; }
  if (G.aiVoting === n) return;
  G.aiVoting = n;
  // Sense candidat de la màquina i sense que s'hi hagi presentat cap jugador: repetició electoral
  if (!neg.ai.cand) {
    await api.neg(code, { "neg.result": { pass: false, ts: Date.now() } });
    await api.chat(code, { id: `m${Date.now().toString(36)}f`, from: "sys", to: "all", t: "Nadie tiene apoyos suficientes para ser investido: se repiten las elecciones.", ts: Date.now() });
    return;
  }
  await api.neg(code, { "neg.vote": { cand: neg.ai.cand, measures: neg.ai.measures, roles: neg.ai.roles, n, votes: {}, ts: Date.now() } });
  await api.chat(code, { id: `m${Date.now().toString(36)}v`, from: `ai:${neg.ai.cand}`, to: "all", t: `${simMpRef(W, neg.ai.cand).name} se somete a la votación de investidura (intento ${n}). ¡Votad!`, ts: Date.now() });
}
