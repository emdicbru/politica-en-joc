// Simulador del 29N · Del vot al govern i la legislatura: consultes, negociació, investidura i quatre anys de govern.
// Les regles són les de la Constitució: investidura (art. 99), qüestió de confiança (art. 112), moció de censura (art. 113),
// decrets llei (art. 86), lleis orgàniques (art. 81) i dissolució (art. 115).

const SIM_ATTEMPTS = 3;

function simGovNew(s) {
  // Les mesures del jugador: per a cada tema prioritari, la més propera a la seva posició
  const mine = s.me.prio.map((th) => SIM_MEASURES.filter((m) => m.th === th).sort((a, b) => Math.abs(a.p - s.me[a.ax]) - Math.abs(b.p - s.me[b.ax]))[0].id);
  return { attempts: [], outcome: null, mine };
}
const simAbsolute = (s) => simSeated(s).find((id) => s.res.seats[id] >= SIM_MAJ);
const simSeatedSorted = (s) => simSeated(s).sort((a, b) => s.res.seats[b] - s.res.seats[a]);
const simVoteVerb = { si: "vota sí", abs: "s'absté", no: "vota no" };

// Majories mínimes plausibles (reutilitza la funció del pactòmetre)
function simGovMajorities(s) {
  const ok = (m) => m.every((a) => m.every((b) => simDist(simById(s, a), simById(s, b)) <= 6.5));
  return minimalMajoritiesOf(simSeatedSorted(s), s.res.seats, ok, SIM_MAJ, 5);
}

// Fitxa d'un partit a la taula de negociació: escons, què vol i quines són les seves línies vermelles
function simPartyCard(s, id) {
  const p = simById(s, id);
  const wants = simWants(p), reds = simRedLines(p).filter((m) => !wants.includes(m)).slice(0, 3);
  const d = simDist(p, s.me);
  return `<div class="sim-pcard ${id === "jo" ? "me" : ""}">
    <div class="sim-pcard-h">${simLogo(p)}<b>${esc(p.name)}<small class="cand">${esc(simCand(s, id))}</small></b><span class="seats">${s.res.seats[id]}</span></div>
    ${id === "jo" ? `<p class="sim-note">El teu partit.</p>` : `
    <p><small>Vol</small>${wants.map((m) => esc(m.t)).join(" · ")}</p>
    ${reds.length ? `<p class="red"><small>Línies vermelles</small>${reds.map((m) => esc(m.t)).join(" · ")}</p>` : `<p class="red"><small>Línies vermelles</small>Cap de clara: és un partit frontissa.</p>`}
    <p class="dist">${d < 3 ? "Ideològicament proper a tu" : d < 5.5 ? "A una distància mitjana de tu" : "Lluny de tu ideològicament"}</p>`}
  </div>`;
}

// =========================================================
// Ronda de consultes
// =========================================================
function simGovConsult(G) {
  const s = G.state, g = s.gov;
  G.ctx.hud([["intent", "Intent", `${Math.min(g.attempts.length + 1, SIM_ATTEMPTS)}/${SIM_ATTEMPTS}`]]);
  const abs = simAbsolute(s);
  const tried = g.attempts.filter((a) => a.cand !== "jo").map((a) => a.cand);
  const cands = simAiCandidates(s, tried.length < simSeated(s).length - 1 ? tried : []);
  const best = abs && abs !== "jo" ? cands.find((c) => c.id === abs) : cands[0];
  const B = best ? simById(s, best.id) : null;
  const without = best ? simInvestiture(s, best.deal, "abs") : null;
  const maj = simGovMajorities(s);
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-consult">
      <p class="sim-kick">Ronda de consultes · intent ${Math.min(g.attempts.length + 1, SIM_ATTEMPTS)} de ${SIM_ATTEMPTS}</p>
      <h3 class="sim-h">${abs === "jo" ? "Tens majoria absoluta!" : abs ? `${esc(simById(s, abs).name)} té majoria absoluta` : "Ningú no té majoria absoluta"}</h3>
      ${simHemi(s, s.res.seats, `<strong>176</strong><small>per a la majoria absoluta</small>`)}
      ${g.attempts.length ? `<div class="sim-attempts">${g.attempts.map((a, k) => `<p>${simLogo(simById(s, a.cand))}<span>Intent ${k + 1}: ${esc(simById(s, a.cand).name)} no ha estat investit (${a.si} sí, ${a.no} no).</span></p>`).join("")}</div>` : ""}
      ${simExplain(abs ? "Amb 176 escons o més, un partit pot ser investit tot sol a la primera votació." : `Després de les eleccions, el Rei consulta els partits i proposa un candidat a la [[investidura]]. Si ningú no la supera en ${g.attempts.length ? "els dos mesos que van començar amb la primera votació" : "dos mesos des de la primera votació"}, es repeteixen les eleccions. ${g.attempts.length ? `Queden ${SIM_ATTEMPTS - g.attempts.length} ${SIM_ATTEMPTS - g.attempts.length === 1 ? "intent" : "intents"}.` : ""}`, "nou-govern")}
      <h4 class="sim-h4">Les opcions</h4>
      <div class="sim-choices">
        ${abs === "jo" ? `<button class="sim-choice primary" data-go="self"><b>Presenta't a la investidura</b><small>Tens prou escons per governar sol.</small></button>` : abs ? `
          <button class="sim-choice" data-go="vote-si"><b>Vota a favor de ${esc(B.name)}</b><small>No canviarà el resultat, però es valorarà la teva coherència.</small></button>
          <button class="sim-choice" data-go="vote-no"><b>Vota en contra i passa a l'oposició</b><small>${esc(B.name)} governarà igualment.</small></button>` : `
          <button class="sim-choice" data-go="self"><b>Demana ser el candidat</b><small>Construeix una majoria al teu voltant. Amb ${s.res.seats.jo} escons, necessites molts suports.</small></button>
          ${best ? `<button class="sim-choice primary" data-go="support"><b>Negocia amb ${esc(B.name)}</b><small>És qui té més opcions. Sense els teus vots: ${without.si} sí i ${without.no} no${without.first ? " (ja té majoria absoluta)" : without.second ? " (ja guanyaria a la segona votació)" : ""}.</small></button>` : ""}
          ${best ? `<button class="sim-choice" data-go="opp"><b>Passa a l'oposició</b><small>Votes no a ${esc(B.name)} i no negocies res.</small></button>` : ""}`}
      </div>
      <h4 class="sim-h4">La taula: qui vol què</h4>
      <div class="sim-pcards">${simSeatedSorted(s).map((id) => simPartyCard(s, id)).join("")}</div>
      ${maj.length ? `<h4 class="sim-h4">Majories mínimes possibles</h4>
      <div class="sim-coal">${maj.map((m) => `<div class="${m.members.includes("jo") ? "me" : ""}">${m.members.map((id) => simLogo(simById(s, id))).join("")}<b>${m.total}</b><small>${m.members.length === 1 ? "Majoria absoluta" : `${m.members.length} partits`}</small></div>`).join("")}</div>
      <p class="sim-note">Combinacions on no sobra cap partit i que no són ideològicament impossibles. Com al <a href="#apren/pactometre">pactòmetre</a> de l'Aprèn.</p>` : ""}
      <p class="sim-note">${SIM_APPROX}</p>
    </div></div>`);
  $$("[data-go]", el).forEach((b) => b.addEventListener("click", () => {
    const go = b.dataset.go;
    Sfx.play("pick");
    if (go === "self") {
      if (abs === "jo") { g.pending = { cand: "jo", deal: { cand: "jo", measures: [...g.mine], roles: {} }, playerVote: null }; s.stage = "gov-vote"; }
      else { g.draft = null; s.stage = "gov-neg"; }
    } else if (go === "support") { g.supportCand = best.id; g.req = null; s.stage = "gov-support"; }
    else { g.pending = { cand: best.id, deal: best.deal, playerVote: go === "vote-si" ? "si" : "no" }; s.stage = "gov-vote"; }
    simSave(G);
    simGo(G);
  }));
}

// =========================================================
// Negociació: el jugador és el candidat
// =========================================================
function simGovNegotiate(G) {
  const s = G.state, g = s.gov;
  G.ctx.hud([["intent", "Intent", `${g.attempts.length + 1}/${SIM_ATTEMPTS}`]]);
  const d = g.draft = g.draft || { cand: "jo", measures: g.mine.slice(0, 2), roles: {} };
  const rivals = simSeatedSorted(s).filter((id) => id !== "jo");
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-neg">
      <p class="sim-kick">Negociació · ets el candidat</p>
      <h3 class="sim-h">Construeix el teu acord</h3>
      <p class="sim-sub">Tria fins a quatre mesures i ofereix a cada partit una fórmula de suport. Cada partit decideix segons la distància ideològica, les mesures i les seves línies vermelles.</p>
      <div class="sim-neg-preview" data-preview aria-live="polite"></div>
      <h4 class="sim-h4">Les mesures de l'acord <span data-mcount></span></h4>
      <div class="sim-measures">${SIM_THEMES.map((t, th) => `<div class="sim-mgroup"><small>${t.label}</small>${SIM_MEASURES.filter((m) => m.th === th).map((m) => {
        const bad = simMeasureView(s.me, m) < -0.3;
        const reds = rivals.filter((id) => simIsRedLine(simById(s, id), m)).map((id) => simById(s, id).sig);
        const fans = rivals.filter((id) => simWants(simById(s, id)).includes(m)).map((id) => simById(s, id).sig);
        return `<button class="sim-mchip" data-m="${m.id}" ${bad ? `disabled title="Va contra el teu programa"` : ""}>${esc(m.t)}${fans.length ? `<em class="fan">Ho vol: ${fans.join(", ")}</em>` : ""}${reds.length ? `<em class="red">Línia vermella: ${reds.join(", ")}</em>` : ""}</button>`;
      }).join("")}</div>`).join("")}</div>
      <h4 class="sim-h4">Els socis</h4>
      <div class="sim-partners">${rivals.map((id) => `<div class="sim-partner" data-p="${id}">
        <div class="sim-partner-h">${simLogo(simById(s, id))}<b>${esc(simById(s, id).name)}<small class="cand">${esc(simCand(s, id))}</small></b><span class="seats">${s.res.seats[id]}</span><em class="v" data-v></em></div>
        <div class="sim-seg sm" role="group" aria-label="Fórmula de suport per a ${esc(simById(s, id).name)}">${[["", "Res"], ["inv", "Puntual"], ["leg", "Acord"], ["coal", "Coalició"]].map(([k, l]) => `<button data-role="${k}">${l}</button>`).join("")}</div>
        <small data-why></small>
      </div>`).join("")}</div>
      <p class="sim-note">${SIM_APPROX}</p>
      <p class="sim-note">Puntual: només vota la investidura. Acord: dona suport estable des del Parlament (un [[acord de legislatura]]). Coalició: entra al Govern amb ministeris.</p>
      <div class="sim-actions-row"><button class="btn ghost" data-back>Torna a les consultes</button><button class="btn primary lg" data-vote>Porta-ho a votació</button></div>
    </div></div>`);
  el.innerHTML = rich(el.innerHTML);

  function update() {
    const r = simInvestiture(s, d);
    $$("[data-m]", el).forEach((b) => { const on = d.measures.includes(b.dataset.m); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $("[data-mcount]", el).textContent = `(${d.measures.length} de 4)`;
    $$("[data-p]", el).forEach((row) => {
      const id = row.dataset.p, v = r.votes[id];
      $$("[data-role]", row).forEach((b) => { const on = (d.roles[id] || "") === b.dataset.role; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      $("[data-v]", row).className = `v ${v.v}`;
      $("[data-v]", row).textContent = SIM_VOTE_LABEL[v.v];
      $("[data-why]", row).textContent = v.why;
    });
    $("[data-preview]", el).innerHTML = `${simVoteBar(r)}<p class="sim-verdict ${r.first ? "ok" : r.second ? "mid" : "ko"}">${r.first ? "Amb aquest acord series investit a la primera votació." : r.second ? "Amb aquest acord series investit a la segona votació, per majoria simple." : `Amb aquest acord no surts investit: tens ${r.si} sís i ${r.no} nos, i a la segona votació calen més sís que nos. Busca suports o abstencions dels qui ara voten no.`}</p>`;
  }
  update();
  $$("[data-m]", el).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.m;
    if (d.measures.includes(id)) d.measures = d.measures.filter((x) => x !== id);
    else if (d.measures.length < 4) d.measures.push(id);
    else return toast("Com a màxim, quatre mesures");
    Sfx.play("pick"); simSave(G); update();
  }));
  $$("[data-p]", el).forEach((row) => $$("[data-role]", row).forEach((b) => b.addEventListener("click", () => {
    const id = row.dataset.p;
    if (b.dataset.role) d.roles[id] = b.dataset.role; else delete d.roles[id];
    Sfx.play("pick"); simSave(G); update();
  })));
  $("[data-back]", el).addEventListener("click", () => { s.stage = "gov-consult"; simSave(G); simGovConsult(G); });
  $("[data-vote]", el).addEventListener("click", () => {
    g.pending = { cand: "jo", deal: { cand: "jo", measures: [...d.measures], roles: { ...d.roles } }, playerVote: null };
    s.stage = "gov-vote"; simSave(G); Sfx.play("pick"); simGovVote(G);
  });
}

// =========================================================
// Negociació: un altre partit és el candidat
// =========================================================
function simGovSupport(G) {
  const s = G.state, g = s.gov;
  const cand = g.supportCand, C = simById(s, cand);
  const ai = simAiDeal(s, cand, ["jo"]);
  const without = simInvestiture(s, ai.deal, "abs");
  const req = g.req = g.req || { measures: [], role: "inv" };
  const offer = Object.keys(ai.deal.roles);
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-support">
      <p class="sim-kick">Negociació amb ${esc(C.name)}</p>
      <h3 class="sim-h">${esc(C.name)} busca suports</h3>
      <div class="sim-aideal">
        <div><small>Les mesures que proposa</small><ul>${ai.deal.measures.map((id) => `<li>${esc(simMeasure(id).t)}</li>`).join("")}</ul></div>
        <div><small>Els suports que ja té</small><p>${offer.length ? offer.map((id) => `${simLogo(simById(s, id))} ${SIM_ROLES[ai.deal.roles[id]].short}`).join(" ") : "Cap acord: compta amb els vots dels partits propers."}</p></div>
      </div>
      ${simVoteBar(without)}
      <p class="sim-verdict ${without.first || without.second ? "mid" : "ko"}">${without.first ? "Ja té majoria absoluta sense tu: la teva força negociadora és petita." : without.second ? "Sense tu, guanyaria a la segona votació. Pots demanar poc." : "Sense els teus vots no surt investit: tens força per negociar."}</p>
      <h4 class="sim-h4">Què li demanes? <span data-mcount></span></h4>
      <div class="sim-measures compact">${SIM_MEASURES.filter((m) => simMeasureView(s.me, m) >= 0 && !ai.deal.measures.includes(m.id)).sort((a, b) => (s.me.iss[b.th] - s.me.iss[a.th]) || (simMeasureView(s.me, b) - simMeasureView(s.me, a))).slice(0, 10).map((m) => `<button class="sim-mchip" data-m="${m.id}">${esc(m.t)}${g.mine.includes(m.id) ? `<em class="fan">Del teu programa</em>` : ""}${simCandRejects(s, cand, m) ? `<em class="red">Va contra el programa de ${esc(C.sig)}</em>` : ""}</button>`).join("")}</div>
      <h4 class="sim-h4">Quina fórmula de suport?</h4>
      <div class="sim-seg" role="group" aria-label="Fórmula de suport">${Object.entries(SIM_ROLES).map(([k, r]) => `<button data-role="${k}">${r.label}</button>`).join("")}</div>
      <div data-answer aria-live="polite"></div>
      <div class="sim-actions-row"><button class="btn ghost" data-back>Torna a les consultes</button><button class="btn primary lg" data-ask>Proposa-ho</button></div>
    </div></div>`);

  const sync = () => {
    $$("[data-m]", el).forEach((b) => { const on = req.measures.includes(b.dataset.m); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $$("[data-role]", el).forEach((b) => { const on = req.role === b.dataset.role; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $("[data-mcount]", el).textContent = `(${req.measures.length} de 2)`;
  };
  sync();
  $$("[data-m]", el).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.m;
    if (req.measures.includes(id)) req.measures = req.measures.filter((x) => x !== id);
    else if (req.measures.length < 2) req.measures.push(id);
    else return toast("Com a màxim, dues mesures");
    Sfx.play("pick"); sync(); $("[data-answer]", el).innerHTML = "";
  }));
  $$("[data-role]", el).forEach((b) => b.addEventListener("click", () => { req.role = b.dataset.role; Sfx.play("pick"); sync(); $("[data-answer]", el).innerHTML = ""; }));
  $("[data-back]", el).addEventListener("click", () => { s.stage = "gov-consult"; simSave(G); simGovConsult(G); });
  $("[data-ask]", el).addEventListener("click", () => {
    const ans = simAiAnswer(s, ai.deal, req);
    simSave(G);
    Sfx.play(ans.refused.length ? "ko" : "ok");
    $("[data-answer]", el).innerHTML = `<div class="sim-answer">
      <h4>La resposta de ${esc(C.name)}</h4>
      <ul>
        ${ans.measures.filter((id) => req.measures.includes(id)).map((id) => `<li class="ok">Accepta «${esc(simLc(simMeasure(id).t))}».</li>`).join("")}
        ${ans.refused.map((x) => `<li class="ko">No accepta «${esc(simLc(simMeasure(x.id).t))}». ${esc(x.why)}</li>`).join("")}
        <li class="${ans.roleWhy ? "ko" : "ok"}">${ans.roleWhy ? `${esc(ans.roleWhy)} T'ofereix: ${SIM_ROLES[ans.role].label.toLowerCase()}.` : `Accepta: ${SIM_ROLES[ans.role].label.toLowerCase()}.`}</li>
      </ul>
      <p class="sim-note">${ans.pivotal ? "Els teus vots són decisius: per això t'escolta." : "Els teus vots no són decisius: per això cedeix poc."}</p>
      ${(() => {
        const after = simInvestiture(s, ans.deal, "si");
        const moved = Object.keys(after.votes).filter((id) => id !== "jo" && after.votes[id].v !== without.votes[id]?.v);
        return `${simVoteBar(after)}<p class="sim-verdict ${after.first || after.second ? "ok" : "ko"}">Amb aquest acord i el teu sí: ${after.si} sís i ${after.no} nos.</p>${moved.map((id) => `<p class="sim-note">${simLogo(simById(s, id))} ${esc(simById(s, id).name)} ${simVoteVerb[after.votes[id].v]}: ${esc(after.votes[id].why)}</p>`).join("")}`;
      })()}
      <div class="sim-votebtns"><button class="btn primary" data-v="si">Accepta l'acord i vota sí</button><button class="btn" data-v="abs">Abstén-te</button><button class="btn" data-v="no">Vota no</button></div>
    </div>`;
    $$("[data-v]", el).forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.v;
      g.pending = { cand, deal: v === "si" ? ans.deal : ai.deal, playerVote: v };
      s.stage = "gov-vote"; simSave(G); Sfx.play("pick"); simGovVote(G);
    }));
  });
}

// =========================================================
// Votació d'investidura (art. 99 CE)
// =========================================================
function simGovVote(G) {
  const s = G.state, g = s.gov, P = g.pending;
  G.ctx.hud([]);
  const C = simById(s, P.cand);
  const r = simInvestiture(s, P.deal, P.playerVote);
  // El resultat es desa de seguida: si es tanca l'app, no es pot tornar a votar
  if (!g.lastVote || g.lastVote.at !== g.attempts.length) {
    g.lastVote = { at: g.attempts.length, si: r.si, no: r.no, abs: r.abs, first: r.first, second: r.second, cand: P.cand };
    if (r.pass) {
      g.final = { cand: P.cand, deal: P.deal, first: r.first, si: r.si, no: r.no, abs: r.abs, votes: Object.fromEntries(Object.entries(r.votes).map(([id, v]) => [id, { v: v.v }])) };
      g.outcome = P.cand === "jo" ? "pm" : P.playerVote === "si" ? (P.deal.roles.jo || "inv") : "opp";
      s.stage = "gov-outcome";
    } else {
      g.attempts.push({ cand: P.cand, si: r.si, no: r.no });
      if (g.attempts.length >= SIM_ATTEMPTS) { g.outcome = "rep"; s.stage = "gov-outcome"; }
      else s.stage = "gov-consult";
    }
    simSave(G);
  }
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-vote">
      <p class="sim-kick">Congrés dels Diputats · debat d'investidura</p>
      <h3 class="sim-h">${C.id === "jo" ? "La teva investidura" : `Investidura de ${esc(simCand(s, C.id))}`}</h3>
      <p class="sim-sub">Candidat de ${esc(C.name)}${C.id === "jo" ? "" : ` (${esc(C.sig)})`}.</p>
      ${P.deal.measures.length ? `<p class="sim-sub">L'acord inclou: ${P.deal.measures.map((id) => esc(simLc(simMeasure(id).t))).join(" · ")}.</p>` : ""}
      <div class="sim-vround" data-r1>
        <h4>Primera votació <small>Cal majoria absoluta: 176 sís</small></h4>
        ${simVoteBar(r)}
        <p class="sim-verdict ${r.first ? "ok" : "ko"}">${r.first ? `${esc(C.name)} obté la confiança del Congrés per majoria absoluta.` : `Només ${r.si} sís: no arriba a 176.`}</p>
      </div>
      ${r.first ? "" : `<div class="sim-vround" data-r2 hidden>
        <h4>Segona votació, 48 hores després <small>N'hi ha prou amb més sís que nos</small></h4>
        ${simVoteBar(r, false)}
        <p class="sim-verdict ${r.second ? "ok" : "ko"}">${r.second ? `${r.si} sís contra ${r.no} nos: ${esc(C.name)} és investit per majoria simple.` : `${r.si} sís contra ${r.no} nos: la investidura fracassa.`}</p>
      </div>`}
      <details class="sim-votedetail"><summary>Què ha votat cada partit i per què</summary>${simVoteRows(s, r.votes, s.res.seats)}<p class="sim-note">${SIM_APPROX}</p></details>
      <div data-after hidden>
        ${simExplain(r.pass ? (r.first ? "Amb 176 vots afirmatius, el candidat queda investit a la primera votació." : "A la segona votació n'hi ha prou amb la majoria simple: les abstencions no compten ni a favor ni en contra, i per això poden deixar passar un govern en minoria.") : g.attempts.length >= SIM_ATTEMPTS ? "Han passat dos mesos des de la primera votació i ningú no ha obtingut la confiança del Congrés. Segons l'article 99.5 de la Constitució, el Rei dissol les Corts i es convoquen eleccions noves." : `La investidura ha fracassat. Comença a comptar el termini de dos mesos: es poden fer noves propostes. Queden ${SIM_ATTEMPTS - g.attempts.length} ${SIM_ATTEMPTS - g.attempts.length === 1 ? "intent" : "intents"}.`, "nou-govern")}
        <div class="sim-actions-row"><button class="btn primary lg" data-go>${r.pass || g.attempts.length >= SIM_ATTEMPTS ? "Continua" : "Torna a la ronda de consultes"}</button></div>
      </div>
    </div></div>`);
  const r2 = $("[data-r2]", el), after = $("[data-after]", el);
  Sfx.play(r.first ? "win" : "tick");
  if (r2) G.ctx.after(1100, () => { r2.hidden = false; Sfx.play(r.second ? "win" : "lose"); G.ctx.after(500, () => { after.hidden = false; }); });
  else G.ctx.after(700, () => { after.hidden = false; });
  $("[data-go]", el).addEventListener("click", () => { Sfx.play("pick"); simGo(G); });
}

// =========================================================
// Qui governa
// =========================================================
function simGovComposition(s) {
  const f = s.gov.final;
  if (!f) return null;
  const parties = [f.cand, ...Object.keys(f.deal.roles).filter((id) => f.deal.roles[id] === "coal")];
  const support = Object.fromEntries(Object.entries(f.deal.roles).filter(([, r]) => r !== "coal"));
  return { pm: f.cand, parties, support, votes: f.votes };
}

function simGovOutcome(G) {
  const s = G.state, g = s.gov;
  G.ctx.hud([]);
  const f = g.final;
  if (g.outcome === "pm") { G.ctx.achieve("sim-president"); if (f && !f.first) G.ctx.achieve("sim-minoria"); }
  const comp = simGovComposition(s);
  const C = comp && simById(s, comp.pm);
  const legMode = s.mode === "legislatura" && comp;
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-outcome-card">
      <p class="sim-kick">${g.outcome === "rep" ? "Repetició electoral" : "Nou Govern"}</p>
      <h3 class="sim-h">${SIM_OUTCOME_VERDICT[g.outcome]}</h3>
      ${comp ? `
        <div class="sim-govbox">
          <div><small>President del Govern</small><p>${simLogoSvg(C, 40)}<b>${esc(simCand(s, C.id))}</b><em>${esc(C.name)}${C.id === "jo" ? " (tu)" : ""}</em></p></div>
          <div><small>${comp.parties.length > 1 ? "Govern de coalició" : "Govern d'un sol partit"}</small><p>${comp.parties.map((id) => simLogo(simById(s, id))).join(" ")} <b>${comp.parties.reduce((t, id) => t + s.res.seats[id], 0)} escons</b></p></div>
          ${Object.keys(comp.support).length ? `<div><small>Suports des del Parlament</small><p>${Object.entries(comp.support).map(([id, r]) => `${simLogo(simById(s, id))} ${SIM_ROLES[r].short}`).join(" ")}</p></div>` : ""}
        </div>
        ${f.deal.measures.length ? `<h4 class="sim-h4">El programa de l'acord</h4><ul class="sim-deal">${f.deal.measures.map((id) => `<li class="${g.mine.includes(id) ? "mine" : ""}">${esc(simMeasure(id).t)}${g.mine.includes(id) ? " <em>del teu programa</em>" : ""}</li>`).join("")}</ul>` : ""}
        ${simExplain(comp.parties.reduce((t, id) => t + s.res.seats[id], 0) >= SIM_MAJ ? "El Govern té majoria absoluta pròpia: podrà aprovar lleis i pressupostos amb comoditat." : "El Govern no té majoria absoluta pròpia: cada llei i cada pressupost s'haurà de negociar amb altres grups. Això és un govern en minoria.", "congres")}` : simExplain("Si en dos mesos des de la primera votació d'investidura cap candidat no obté la confiança del Congrés, el Rei dissol les Corts i es convoquen noves eleccions (article 99.5 de la Constitució).", "nou-govern")}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>${legMode ? "Comença la legislatura" : "Veure el resultat final"}</button></div>
    </div></div>`);
  $("[data-go]", el).addEventListener("click", () => {
    Sfx.play("pick");
    if (!legMode) return simFinishGame(G);
    simLegStart(s, comp);
    s.stage = "leg-card";
    simSave(G);
    simLegCardScreen(G);
  });
}

// Resum de qui governa per a l'informe final i la imatge per compartir
function simGovShort(s) {
  const g = s.gov;
  if (s.res2) return `Quatre anys després: ${s.res2.seats.jo} ${s.res2.seats.jo === 1 ? "escó" : "escons"}`;
  if (!g?.outcome) return `${simPct(simElectionShare(s))} % dels vots`;
  if (g.outcome === "rep") return "Ningú no és investit: repetició electoral";
  const comp = simGovComposition(s);
  const pm = simById(s, comp.pm);
  return comp.pm === "jo" ? "Presideixes el Govern" : `Governa ${pm.sig} (${simCand(s, comp.pm)})${comp.parties.includes("jo") ? " amb tu en coalició" : ""}`;
}
const simElectionShare = (s) => (s.res ? s.res.share.jo / 100 : 0);
function simGovLine(s) {
  const g = s.gov;
  if (!g?.outcome) return "";
  const comp = simGovComposition(s);
  const L = s.leg;
  return `<p><b>${SIM_OUTCOME[g.outcome].label}.</b> ${comp ? `President: ${esc(simCand(s, comp.pm))} (${esc(simById(s, comp.pm).sig)}).` : ""} ${L && L.q ? `Legislatura: ${L.q} de 8 trimestres${L.over ? ` · ${SIM_LEG_END[L.over]?.label || ""}` : ""}.` : ""}</p>`;
}

// =========================================================
// La legislatura
// =========================================================
const SIM_LEG_END = {
  completa: { label: "Legislatura completa", text: "Han passat quatre anys: la legislatura s'acaba i es convoquen eleccions (article 68 de la Constitució)." },
  anticipades: { label: "Eleccions anticipades", text: "El president ha dissolt les Corts abans d'hora (article 115 de la Constitució)." },
  censura: { label: "Moció de censura", text: "El Congrés ha aprovat una moció de censura: el candidat alternatiu passa a ser president (article 113)." },
  confianca: { label: "Qüestió de confiança perduda", text: "El president ha perdut la qüestió de confiança i ha de dimitir (article 114)." },
};
const SIM_KIND = {
  pressupostos: { label: "Pressupostos", rule: "Majoria simple: més sís que nos.", link: "congres" },
  decret: { label: "Convalidació d'un decret llei", rule: "El Congrés té 30 dies per convalidar-lo; n'hi ha prou amb més sís que nos (art. 86).", link: "congres" },
  llei: { label: "Llei ordinària", rule: "Majoria simple: més sís que nos.", link: "congres" },
  organica: { label: "Llei orgànica", rule: "Cal majoria absoluta, 176 sís, en una votació final sobre el conjunt (art. 81).", link: "congres" },
  soci: { label: "Proposició de llei d'un soci", rule: "Majoria simple: més sís que nos.", link: "congres" },
};
const simRoleLabel = { pm: "Presideixes el Govern", coal: "Ets al Govern de coalició", leg: "Dones suport amb un acord de legislatura", inv: "Vas donar suport a la investidura", opp: "Ets a l'oposició" };

function simIndPanel(L, delta = null) {
  return `<div class="sim-inds">${Object.entries(SIM_IND).map(([k, label]) => {
    const v = L.ind[k], d = delta?.[k] || 0;
    return `<div class="sim-ind ${v < 35 ? "low" : v > 65 ? "high" : ""}"><small>${label}</small><b>${v}${d ? `<em class="${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${d}</em>` : ""}</b><span><i style="width:${v}%"></i></span></div>`;
  }).join("")}</div>`;
}
function simLegHead(s, kicker) {
  const L = s.leg, role = simLegRole(s);
  const pm = simById(s, L.gov.pm);
  return `<div class="sim-leghead">
    <div><p class="sim-kick">${kicker}</p><h3 class="sim-h">Trimestre ${L.q + 1} de 8</h3><p class="sim-sub">${simRoleLabel[role]} · President: ${esc(simCand(s, L.gov.pm))} (${esc(pm.sig)}) · ${L.supSeats} escons hi donen suport</p></div>
    <ol class="sim-quarters" aria-label="Trimestres">${Array.from({ length: 8 }, (_, k) => `<li class="${k < L.q ? "done" : k === L.q ? "on" : ""}">${k + 1}</li>`).join("")}</ol>
  </div>${simIndPanel(L)}`;
}
const simReactLine = (s, reacts) => reacts.length ? `<p class="sim-reacts">${reacts.map((x) => `<span class="${x.d > 0 ? "up" : "down"}">${simLogo(simById(s, x.id))} ${x.d > 0 ? "hi està d'acord" : "s'hi oposa"}</span>`).join("")}</p>` : "";

// 1. La decisió del trimestre
function simLegCardScreen(G) {
  const s = G.state, L = s.leg;
  G.ctx.hud([["q", "Trimestre", `${L.q + 1}/8`], ["pop", "Popularitat", L.ind.pop]]);
  if (!L.curCard) { L.curCard = simLegPickCard(s).id; simSave(G); }
  const card = SIM_LEG_CARDS.find((c) => c.id === L.curCard);
  const role = simLegRole(s);
  const governs = role === "pm" || role === "coal";
  const aiPick = governs ? null : simAiPick(s, card);
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    ${simLegHead(s, "Decisió del trimestre")}
    <div class="card sim-card sim-legcard">
      <h3 class="sim-h">${card.title}</h3>
      <p class="sim-lead">${card.text}</p>
      ${governs ? `<p class="sim-sub">${role === "pm" ? "Decideixes tu." : "El teu ministeri porta la proposta al Consell de Ministres."}</p>
        <div class="sim-dil-opts">${card.opts.map((o, i) => `<button class="sim-opt" data-o="${i}"><i>${"ABC"[i]}</i>${o.t}</button>`).join("")}</div>`
        : `<div class="sim-govpick"><small>El Govern de ${esc(simById(s, L.gov.pm).name)} ha decidit</small><b>${card.opts[aiPick].t}</b></div>
        <p class="sim-sub">Què en dius tu?</p>
        <div class="sim-dil-opts"><button class="sim-opt" data-st="si"><i>A</i>Hi dono suport</button><button class="sim-opt" data-st="no"><i>B</i>M'hi oposo i proposo una alternativa</button></div>`}
      <div data-out></div>
    </div></div>`);
  const show = (html) => {
    $$("[data-o], [data-st]", el).forEach((x) => { x.disabled = true; });
    $("[data-out]", el).innerHTML = html;
    $("[data-go]", el).addEventListener("click", () => { Sfx.play("pick"); simLegBillScreen(G); });
  };
  $$("[data-o]", el).forEach((b) => b.addEventListener("click", () => {
    const k = Number(b.dataset.o);
    b.classList.add("picked");
    const res = simLegApplyCard(s, card, k);
    L.curCard = null; s.stage = "leg-bill"; simSave(G);
    Sfx.play("ok");
    G.ctx.setHud("pop", L.ind.pop, { bump: true });
    show(`<div class="sim-result">${simIndPanel(L, res.delta)}${simReactLine(s, res.reacts)}${simExplain(res.why)}<div class="sim-actions-row"><button class="btn primary lg" data-go>Al Congrés</button></div></div>`);
  }));
  $$("[data-st]", el).forEach((b) => b.addEventListener("click", () => {
    const sup = b.dataset.st === "si";
    b.classList.add("picked");
    const o = card.opts[aiPick];
    const res = simLegApplyCard(s, card, aiPick);
    // El teu electorat valora la coherència: donar suport al que t'agrada i oposar-te al que no
    const view = o.pos ? simMeasureView(s.me, o.pos) : 0;
    const coherent = sup ? view > 0.1 : view < -0.1;
    L.ind.pop += coherent ? 3 : -2;
    L.sup.jo = Math.max(-1, Math.min(1, (L.sup.jo || 0) + (sup ? 0.08 : -0.08)));
    simClampInd(L); simLegStability(s);
    L.curCard = null; s.stage = "leg-bill"; simSave(G);
    Sfx.play(coherent ? "ok" : "ko");
    G.ctx.setHud("pop", L.ind.pop, { bump: true });
    show(`<div class="sim-result">${simIndPanel(L, res.delta)}${simExplain(`${o.why} ${coherent ? "La teva posició és coherent amb el teu programa: el teu electorat ho valora." : "La teva posició no encaixa gaire amb el teu programa: part del teu electorat no l'entén."}`)}<div class="sim-actions-row"><button class="btn primary lg" data-go>Al Congrés</button></div></div>`);
  }));
}

// 2. La votació del trimestre
function simLegBillScreen(G) {
  const s = G.state, L = s.leg;
  G.ctx.hud([["q", "Trimestre", `${L.q + 1}/8`], ["pop", "Popularitat", L.ind.pop]]);
  if (!L.curBill) { L.curBill = simLegBill(s); simSave(G); }
  const bill = L.curBill;
  const K = SIM_KIND[bill.kind];
  const role = simLegRole(s);
  const pm = role === "pm";
  const preview = simLegVote(s, bill, pm ? null : "abs");
  const withMe = simLegVote(s, bill, "si"), againstMe = simLegVote(s, bill, "no");
  const pivotal = !pm && withMe.pass !== againstMe.pass;
  const view = simMeasureView(s.me, bill);
  const canDecree = pm && bill.kind === "llei";
  const swing = pm && !bill.deal ? simLegSwing(s, bill) : null;
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    ${simLegHead(s, "Al Congrés")}
    <div class="card sim-card sim-bill">
      <p class="sim-kick">${K.label}</p>
      <h3 class="sim-h">${esc(bill.title)}</h3>
      <p class="sim-sub">${SIM_THEMES[bill.th].label} · posició ${simAxis[bill.ax](bill.p).toLowerCase()} · ${view > 0.3 ? "encaixa amb el teu programa" : view < -0.3 ? "va contra el teu programa" : "et queda a mig camí"}</p>
      <p class="sim-rule">${rich(K.rule)}</p>
      <div data-prev>${simVoteBar(preview, bill.kind === "organica")}<p class="sim-verdict ${preview.pass ? "ok" : "ko"}">${pm ? (preview.pass ? "Ara mateix, té prou suports." : "Ara mateix, no té prou suports.") : pivotal ? "El teu vot decideix el resultat." : "El teu vot no canviarà el resultat, però sí la teva imatge."}</p></div>
      <div class="sim-choices" data-choices>
        ${pm ? `
          <button class="sim-choice primary" data-do="vote"><b>Porta-la a votació tal com és</b><small>${preview.si} sís i ${preview.no} nos previstos.</small></button>
          ${swing ? `<button class="sim-choice" data-do="neg"><b>Negocia-la amb ${esc(simById(s, swing).name)}</b><small>Hi incorpores part de les seves demandes: guanyes el seu suport, però el teu electorat ho pot veure com una cessió.</small></button>` : ""}
          <button class="sim-choice" data-do="delay"><b>Ajorna-la</b><small>${bill.kind === "pressupostos" ? "Es prorroguen els pressupostos de l'any anterior: menys inversió." : "Evites la derrota, però transmets debilitat."}</small></button>
          ${canDecree ? `<button class="sim-choice" data-do="decree"><b>Aprova-la per decret llei</b><small>Entra en vigor de seguida, però el Congrés l'ha de convalidar en 30 dies.</small></button>` : ""}`
        : `
          ${pivotal && view < 0.6 && !bill.deal ? `<button class="sim-choice" data-do="ask"><b>Demana una contrapartida</b><small>El teu vot és decisiu: pots exigir canvis abans de votar.</small></button>` : ""}
          <button class="sim-choice" data-do="si"><b>Vota sí</b></button>
          <button class="sim-choice" data-do="abs"><b>Abstén-te</b></button>
          <button class="sim-choice" data-do="no"><b>Vota no</b></button>`}
      </div>
      <div data-out></div>
    </div></div>`);
  el.innerHTML = rich(el.innerHTML);
  $$("[data-do]", el).forEach((b) => b.addEventListener("click", () => {
    const what = b.dataset.do;
    Sfx.play("pick");
    if (what === "ask") {
      bill.p = Math.round((bill.p + (s.me[bill.ax] - bill.p) * 0.5) * 10) / 10;
      bill.title += " (amb els teus canvis)";
      bill.deal = "jo";
      L.ind.pop += 2;
      simClampInd(L); simSave(G);
      toast("El Govern accepta els teus canvis");
      return simLegBillScreen(G);
    }
    if (what === "neg") {
      const P = simById(s, swing);
      bill.p = Math.round((bill.p + (P[bill.ax] - bill.p) * 0.5) * 10) / 10;
      bill.title += ` (pactada amb ${P.sig})`;
      bill.deal = swing;
      L.sup[swing] = Math.min(1, L.sup[swing] + 0.2);
      L.ind.pop -= 2;
      simClampInd(L); simLegStability(s); simSave(G);
      toast(`Acord amb ${P.name}`);
      return simLegBillScreen(G);
    }
    const res = simLegResolve(s, bill, what);
    L.curBill = null; s.stage = "leg-end"; simSave(G);
    G.ctx.setHud("pop", L.ind.pop, { bump: true });
    $$("[data-do]", el).forEach((x) => { x.disabled = true; });
    $("[data-prev]", el).hidden = true;
    Sfx.play(res.good ? "win" : "lose");
    $("[data-out]", el).innerHTML = `<div class="sim-result">
      ${res.vote ? `${simVoteBar(res.vote, bill.kind === "organica")}<details class="sim-votedetail"><summary>Què ha votat cada partit</summary>${simVoteRows(s, res.vote.votes, s.res.seats)}</details>` : ""}
      ${res.conv ? `<h4>Convalidació al Congrés</h4>${simVoteBar(res.conv, false)}` : ""}
      <p class="sim-verdict ${res.good ? "ok" : "ko"}">${res.title}</p>
      ${simIndPanel(L, res.delta)}
      ${simExplain(res.why, K.link)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Tanca el trimestre</button></div>
    </div>`;
    $("[data-go]", el).addEventListener("click", () => { Sfx.play("pick"); simLegQuarterScreen(G); });
  }));
}

// El partit amb més escons que avui no vota sí i que es podria convèncer
function simLegSwing(s, bill) {
  const r = simLegVote(s, bill);
  const ids = Object.keys(r.votes).filter((id) => id !== s.leg.gov.pm && r.votes[id] !== "si" && s.leg.sup[id] > -0.6 && !simIsRedLine(simById(s, id), bill));
  return ids.sort((a, b) => (s.res.seats[b] || 0) - (s.res.seats[a] || 0))[0] || null;
}

// Efectes d'una llei aprovada: depenen del tema i de la posició
function simLegBillEffects(L, bill, k = 1) {
  const left = bill.p < 4, right = bill.p > 6;
  if (bill.th === 3) L.ind.coh += (bill.p >= 6 ? 6 : bill.p <= 3 ? -4 : 2) * k;
  else if ([0, 1, 2, 6].includes(bill.th)) { L.ind.ben += (left ? 6 : right ? 1 : 3) * k; L.ind.eco += (left ? -1 : right ? 5 : 2) * k; }
  else { L.ind.ben += (left ? 3 : 1) * k; L.ind.coh += (right && bill.th === 4 ? -1 : 0) * k; }
  if (bill.kind === "pressupostos") { L.ind.eco += 4 * k; L.ind.ben += 3 * k; }
}

function simLegResolve(s, bill, what) {
  const L = s.leg, role = simLegRole(s), pm = role === "pm";
  const before = { ...L.ind };
  const K = SIM_KIND[bill.kind];
  let vote = null, conv = null, good = false, title = "", why = "";
  if (pm && what === "delay") {
    L.ind.est -= 5; L.ind.pop -= 2;
    if (bill.kind === "pressupostos") { L.ind.eco -= 3; L.ind.ben -= 2; L.budgetFails = (L.budgetFails || 0) + 1; }
    title = bill.kind === "pressupostos" ? "Es prorroguen els pressupostos de l'any anterior." : "La iniciativa queda ajornada.";
    why = bill.kind === "pressupostos" ? "Sense pressupostos nous, l'Estat funciona amb els de l'any anterior prorrogats: no hi ha noves inversions i el Govern es veu feble." : "Ajornar evita una derrota, però l'oposició ho presenta com un govern sense majoria.";
  } else if (pm && what === "decree") {
    // Decret llei: efecte immediat i convalidació posterior
    L.decrees++;
    simLegBillEffects(L, bill);
    conv = simLegVote(s, { ...bill, kind: "decret" });
    if (conv.pass) { good = true; L.passed++; title = "El decret llei entra en vigor i el Congrés el convalida."; why = "Un decret llei té efectes des del primer dia, però el Congrés ha de convalidar-lo en 30 dies. Abusar-ne desgasta la relació amb els socis."; Object.keys(L.sup).forEach((id) => { if (!L.gov.parties.includes(id)) L.sup[id] -= 0.04; }); }
    else { simLegBillEffects(L, bill, -1); L.ind.pop -= 4; L.ind.est -= 4; L.failed++; title = "El Congrés no convalida el decret llei: queda derogat."; why = "Si el Congrés no el convalida en 30 dies, el decret llei deixa de tenir efecte. El Govern queda en evidència."; }
  } else {
    vote = simLegVote(s, bill, pm ? null : what);
    good = vote.pass;
    if (vote.pass) {
      simLegBillEffects(L, bill);
      if (pm || role === "coal") { L.ind.pop += 2; L.passed++; }
      title = `Aprovada: ${vote.si} sís, ${vote.no} nos i ${vote.abs} abstencions.`;
    } else {
      if (pm || role === "coal") { L.ind.pop -= 3; L.ind.est -= 3; L.failed++; }
      if (bill.kind === "pressupostos") { L.budgetFails = (L.budgetFails || 0) + 1; L.ind.eco -= 3; }
      title = `Rebutjada: ${vote.si} sís, ${vote.no} nos i ${vote.abs} abstencions.`;
    }
    why = bill.kind === "organica" ? `Les lleis orgàniques necessiten 176 vots a favor. ${vote.si >= SIM_MAJ ? "N'ha tingut prou." : `N'ha tingut ${vote.si}: per això ${vote.pass ? "" : "no "}surt.`}` : K.rule;
    if (!pm) {
      // El teu vot: coherència amb el programa i relació amb el Govern
      const view = simMeasureView(s.me, bill);
      const coherent = what === "si" ? view > 0 : what === "no" ? view < 0 : Math.abs(view) < 0.4;
      L.ind.pop += coherent ? 2 : -2;
      if (what === "si") L.sup.jo = Math.min(1, (L.sup.jo || 0) + 0.06);
      if (what === "no") L.sup.jo = Math.max(-1, (L.sup.jo || 0) - (role === "coal" || role === "leg" ? 0.3 : 0.08));
      why += ` ${coherent ? "El teu vot és coherent amb el teu programa." : "El teu vot no encaixa amb el teu programa: el teu electorat no ho entén."}`;
      if (what === "no" && (role === "coal" || role === "leg")) why += " Votar contra el Govern que sostens debilita l'acord.";
    }
  }
  simClampInd(L);
  simLegStability(s);
  L.log.push({ q: L.q + 1, type: "bill", kind: bill.kind, what, good });
  const delta = Object.fromEntries(Object.keys(L.ind).map((k) => [k, L.ind[k] - before[k]]));
  return { vote, conv, good, title, why, delta };
}

// 3. Final del trimestre: crisis de govern, mocions, qüestions de confiança i dissolució
function simLegQuarterScreen(G) {
  const s = G.state, L = s.leg;
  // El tancament del trimestre es fa una sola vegada encara que es reprengui la partida
  if (!L.closing) {
    const before = { ...L.ind };
    const out = simLegQuarterEnd(s);
    L.closing = { delta: Object.fromEntries(Object.keys(L.ind).map((k) => [k, L.ind[k] - before[k]])), drift: out.drift, notes: [] };
    // Ruptura de coalició
    L.gov.parties.filter((id) => id !== L.gov.pm).forEach((id) => {
      if (L.sup[id] < -0.2) {
        L.gov.parties = L.gov.parties.filter((x) => x !== id);
        L.closing.notes.push(id === "jo" ? "Surts del Govern: la coalició s'ha trencat." : `${simById(s, id).name} surt del Govern: la coalició s'ha trencat.`);
        if (id === "jo") L.gov.support.jo = null;
      }
    });
    // Moció de censura de l'oposició quan el Govern del jugador és feble
    if (simLegRole(s) === "pm" && L.ind.est < 42 && !L.censure) {
      const cands = Object.keys(L.sup).filter((id) => !L.gov.parties.includes(id)).sort((a, b) => (s.res.seats[b] || 0) - (s.res.seats[a] || 0));
      const c = cands[0];
      if (c) {
        const r = simCensureVote(s, c);
        if (r.pass || simRand(s, "censura") < 0.5) L.censure = { cand: c, pending: true };
      }
    }
    simLegStability(s);
    s.stage = "leg-end";
    simSave(G);
  }
  const role = simLegRole(s);
  const C = L.closing;
  G.ctx.hud([["q", "Trimestre", `${L.q}/8`], ["pop", "Popularitat", L.ind.pop]]);
  const done = L.q >= 8;
  const canConfidence = role === "pm" && !L.confidence && L.q >= 2 && !done;
  const canDissolve = role === "pm" && L.q >= 4 && !done;
  const myCensure = role !== "pm" && role !== "coal" && L.q >= 2 && !done && !L.myCensure;
  const sign = myCensure ? simCensureSigners(s) : 0;
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    <div class="sim-leghead"><div><p class="sim-kick">Final del trimestre ${L.q}</p><h3 class="sim-h">${done ? "S'acaba la legislatura" : "Balanç del trimestre"}</h3><p class="sim-sub">${simRoleLabel[role]} · ${L.supSeats} escons donen suport al Govern</p></div></div>
    ${simIndPanel(L, C.delta)}
    <div class="card sim-card">
      ${simExplain(`L'economia ${C.drift > 1 ? "ha millorat una mica pel context internacional" : C.drift < -1 ? "s'ha refredat pel context internacional" : "s'ha mantingut estable"}. ${role === "pm" || role === "coal" ? "La popularitat del Govern depèn de l'economia, del benestar i del desgast de governar." : "A l'oposició, et beneficia el desgast del Govern i et perjudica que l'economia vagi bé."}`, null, "Què ha passat aquest trimestre")}
      ${C.notes.map((n) => `<p class="sim-banner">${esc(n)}</p>`).join("")}
      ${L.censure?.pending ? `<div class="sim-alert"><h4>Moció de censura</h4><p>${esc(simById(s, L.censure.cand).name)} presenta una [[moció de censura]] amb ${esc(simCand(s, L.censure.cand))} com a candidat alternatiu. Si obté 176 vots, serà el nou president.</p>
        <div class="sim-choices"><button class="sim-choice" data-do="cen-neg"><b>Negocia per evitar-la</b><small>Fas concessions a un grup que dubta. Perds popularitat.</small></button><button class="sim-choice primary" data-do="cen-vote"><b>Afronta la votació</b></button></div></div>` : ""}
      ${L.budgetFails >= 2 && role === "pm" && !done ? `<p class="sim-banner">Sense pressupostos aprovats, molts governs avancen les eleccions.</p>` : ""}
      <div data-out></div>
      <div class="sim-choices" data-next ${L.censure?.pending ? "hidden" : ""}>
        ${done ? `<button class="sim-choice primary" data-do="elect"><b>Convoca les eleccions</b><small>Han passat els quatre anys de la legislatura.</small></button>` : `
          <button class="sim-choice primary" data-do="next"><b>Comença el trimestre ${L.q + 1}</b></button>
          ${canConfidence ? `<button class="sim-choice" data-do="conf"><b>Planteja una qüestió de confiança</b><small>Si la guanyes per majoria simple, surts reforçat. Si la perds, has de dimitir.</small></button>` : ""}
          ${canDissolve ? `<button class="sim-choice" data-do="dissolve"><b>Dissol les Corts i convoca eleccions</b><small>Ja ha passat més d'un any des de les eleccions, com exigeix l'article 115.</small></button>` : ""}
          ${myCensure ? `<button class="sim-choice" data-do="mycensure" ${sign < 35 ? "disabled" : ""}><b>Presenta una moció de censura</b><small>${sign < 35 ? "Cal que la signin com a mínim 35 diputats (una desena part de la cambra) i ara no hi ha prou grups disposats." : "Ets el candidat alternatiu. Si obtens 176 vots, seràs president. Si fracassa, et passarà factura."}</small></button>` : ""}`}
      </div>
    </div></div>`);
  el.innerHTML = rich(el.innerHTML);
  const out = $("[data-out]", el);
  const nextBox = $("[data-next]", el);
  const bind = () => $$("[data-do]", el).forEach((b) => { if (!b.dataset.bound) { b.dataset.bound = 1; b.addEventListener("click", () => act(b.dataset.do)); } });
  bind();

  function act(what) {
    Sfx.play("pick");
    if (what === "next") { L.closing = null; s.stage = "leg-card"; simSave(G); return simLegCardScreen(G); }
    if (what === "elect" || what === "dissolve") { L.over = what === "elect" ? "completa" : "anticipades"; L.closing = null; s.stage = "leg-over"; simSave(G); return simLegOver(G); }
    if (what === "cen-neg") {
      const r0 = simCensureVote(s, L.censure.cand);
      const target = Object.keys(r0.votes).filter((id) => r0.votes[id] !== "no" && id !== L.censure.cand).sort((a, b) => (s.res.seats[b] || 0) - (s.res.seats[a] || 0))[0];
      if (target) { L.sup[target] = Math.min(1, L.sup[target] + 0.45); L.ind.pop -= 3; out.innerHTML = `<p class="sim-banner">Negocies amb ${esc(simById(s, target).name)}: hi fas concessions.</p>`; }
      what = "cen-vote";
    }
    if (what === "cen-vote") {
      const r = simCensureVote(s, L.censure.cand);
      L.censure.pending = false; L.censure.result = r.pass;
      $$(".sim-alert button", el).forEach((x) => { x.disabled = true; });
      if (r.pass) { L.over = "censura"; L.gov = { pm: L.censure.cand, parties: [L.censure.cand], support: {}, votes: {} }; }
      else { G.ctx.achieve("sim-mocio"); L.ind.est += 6; L.ind.pop += 3; simClampInd(L); }
      simSave(G);
      Sfx.play(r.pass ? "lose" : "win");
      out.insertAdjacentHTML("beforeend", `${simVoteBar(r)}<p class="sim-verdict ${r.pass ? "ko" : "ok"}">${r.pass ? `La moció prospera amb ${r.si} vots: ${esc(simCand(s, L.censure.cand))} (${esc(simById(s, L.censure.cand).sig)}) és el nou president.` : `La moció fracassa: ${r.si} vots a favor, en calien 176. Surts reforçat.`}</p>${simExplain("La moció de censura és constructiva: s'ha de presentar amb un candidat alternatiu i necessita la majoria absoluta, 176 vots (article 113 de la Constitució).", "congres")}`);
      if (r.pass) { out.insertAdjacentHTML("beforeend", `<div class="sim-actions-row"><button class="btn primary lg" data-do="over">Continua</button></div>`); }
      else nextBox.hidden = false;
      $("[data-do='over']", el)?.addEventListener("click", () => { L.closing = null; s.stage = "leg-over"; simSave(G); simLegOver(G); });
      return;
    }
    if (what === "conf") {
      L.confidence = true;
      const r = simConfidenceVote(s);
      if (r.pass) { G.ctx.achieve("sim-mocio"); L.ind.est += 10; L.ind.pop += 2; Object.keys(L.sup).forEach((id) => { if (r.votes[id] === "si") L.sup[id] = Math.min(1, L.sup[id] + 0.1); }); simClampInd(L); }
      else L.over = "confianca";
      simSave(G);
      Sfx.play(r.pass ? "win" : "lose");
      $("[data-do='conf']", el).disabled = true;
      out.innerHTML = `${simVoteBar(r, false)}<p class="sim-verdict ${r.pass ? "ok" : "ko"}">${r.pass ? `Guanyes la qüestió de confiança: ${r.si} sís contra ${r.no} nos.` : `Perds la qüestió de confiança: ${r.si} sís contra ${r.no} nos.`}</p>${simExplain("La qüestió de confiança la planteja el president sobre el seu programa o una decisió important. Es guanya per majoria simple; si es perd, el Govern ha de dimitir (articles 112 i 114 de la Constitució).", "congres")}`;
      if (!r.pass) { nextBox.innerHTML = `<button class="sim-choice primary" data-do="over"><b>Continua</b></button>`; $("[data-do='over']", el).addEventListener("click", () => { L.closing = null; s.stage = "leg-over"; simSave(G); simLegOver(G); }); }
      return;
    }
    if (what === "mycensure") {
      L.myCensure = true;
      const r = simCensureVote(s, "jo");
      if (r.pass) {
        L.gov = { pm: "jo", parties: ["jo"], support: {}, votes: r.votes };
        Object.keys(L.sup).forEach((id) => { L.sup[id] = r.votes[id] === "si" ? 0.5 : r.votes[id] === "abs" ? 0 : -0.5; });
        L.sup.jo = 0.8;
        simLegStability(s);
      } else { L.ind.pop -= 5; simClampInd(L); }
      simSave(G);
      Sfx.play(r.pass ? "win" : "lose");
      $("[data-do='mycensure']", el).disabled = true;
      out.innerHTML = `${simVoteBar(r)}<p class="sim-verdict ${r.pass ? "ok" : "ko"}">${r.pass ? `La moció prospera amb ${r.si} vots: ets el nou president del Govern!` : `La moció fracassa: ${r.si} vots a favor, en calien 176.`}</p>${simExplain("La moció de censura ha d'incloure un candidat alternatiu i necessita 176 vots. Si prospera, el candidat és investit automàticament.", "congres")}`;
      if (r.pass) G.ctx.achieve("sim-president");
      return;
    }
  }
}
// Diputats disposats a signar una moció de censura del jugador: el seu grup i els que estan enfrontats al Govern
function simCensureSigners(s) {
  const L = s.leg;
  return Object.keys(L.sup).filter((id) => id === "jo" || (!L.gov.parties.includes(id) && L.sup[id] < -0.15)).reduce((t, id) => t + (s.res.seats[id] || 0), 0);
}

// 4. Final de la legislatura
function simLegOver(G) {
  const s = G.state, L = s.leg;
  G.ctx.hud([]);
  if (L.over === "completa" && simLegRole(s) === "pm") G.ctx.achieve("sim-legislatura");
  const E = SIM_LEG_END[L.over];
  const goesToPolls = L.over === "completa" || L.over === "anticipades";
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    <div class="sim-leghead"><div><p class="sim-kick">Final de la legislatura</p><h3 class="sim-h">${E.label}</h3><p class="sim-sub">${L.q} ${L.q === 1 ? "trimestre" : "trimestres"} · ${L.passed} votacions guanyades · ${L.decrees} decrets llei</p></div></div>
    ${simIndPanel(L)}
    <div class="card sim-card">
      ${simExplain(E.text, "congres")}
      ${goesToPolls ? `<p class="sim-sub">Ara toca una campanya curta de tres dies. Els indicadors de la legislatura són el punt de partida: la popularitat pesa en el vot del teu partit${simLegRole(s) === "pm" || simLegRole(s) === "coal" ? ", i l'economia i el benestar també" : ""}.</p>` : `<p class="sim-sub">La partida s'acaba aquí.</p>`}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>${goesToPolls ? "Comença la campanya" : "Veure el resultat final"}</button></div>
    </div></div>`);
  $("[data-go]", el).addEventListener("click", () => {
    Sfx.play("pick");
    if (!goesToPolls) return simFinishGame(G);
    simSetupRound2(s);
    simSave(G);
    simCampaign(G);
  });
}

// Segona campanya: tres dies, amb el que ha passat a la legislatura com a punt de partida
function simSetupRound2(s) {
  const L = s.leg, role = simLegRole(s);
  s.round = 2; s.day = 1; s.days = 3; s.slot = 0; s.phase = "campaign";
  s.money = Math.round((SIM_DIFF[s.diff] || SIM_DIFF.normal).money * 0.6);
  Object.keys(s.camp).forEach((id) => { s.camp[id] = s.camp[id].map((v) => v * 0.5); s.glob[id] *= 0.5; });
  s.glob.jo += (L.ind.pop - 50) / 60;
  if (role === "pm" || role === "coal") s.glob.jo += (L.ind.eco + L.ind.ben - 100) / 250;
  if (L.gov.pm !== "jo") s.glob[L.gov.pm] += (L.ind.eco + L.ind.ben - 100) / 200;
  if (s.res.seats.jo > 0) s.awG = Math.max(s.awG, 0.7);
  s.used.events = [];
  s.used.atac = [];
  s.energy = SIM_ENERGY.max;
  s.loc = SIM_PROVS.findIndex((p) => p.code === "M");
  s.route = [s.loc];
  s.mob = SIM_PROVS.map(() => 0);
  Object.keys(s.mom).forEach((id) => { s.mom[id] = 0; });
  s.lastMoves = [];
  simDayOffers(s);
  simKickoff(s);
  s.stage = "campaign";
}

function simLegVerdict(s) {
  const L = s.leg, d = s.res2 ? s.res2.seats.jo - s.res.seats.jo : 0;
  if (!s.res2) return L?.over === "censura" ? "Una moció de censura posa fi al teu Govern." : L?.over === "confianca" ? "Perds la qüestió de confiança i la legislatura s'acaba." : SIM_OUTCOME_VERDICT[s.gov?.outcome] || "";
  return `Quatre anys després, ${s.res2.seats.jo} ${s.res2.seats.jo === 1 ? "escó" : "escons"} (${d >= 0 ? "+" : ""}${d}). ${d > 0 ? "L'electorat premia la teva legislatura." : d < 0 ? "L'electorat et passa factura." : "L'electorat et manté on eres."}`;
}
