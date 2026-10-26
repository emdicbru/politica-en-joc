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
const simVoteVerb = { si: "vota sí", abs: "se abstiene", no: "vota no" };

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
    ${id === "jo" ? `<p class="sim-note">Tu partido.</p>` : `
    <p><small>Quiere</small>${wants.map((m) => esc(m.t)).join(" · ")}</p>
    ${reds.length ? `<p class="red"><small>Líneas rojas</small>${reds.map((m) => esc(m.t)).join(" · ")}</p>` : `<p class="red"><small>Líneas rojas</small>Ninguna clara: es un partido bisagra.</p>`}
    <p class="dist">${d < 3 ? "Ideológicamente cercano a ti" : d < 5.5 ? "A una distancia media de ti" : "Lejos de ti ideológicamente"}</p>`}
  </div>`;
}

// =========================================================
// Ronda de consultes
// =========================================================
function simGovConsult(G) {
  const s = G.state, g = s.gov;
  G.ctx.hud([["intent", "Intento", `${Math.min(g.attempts.length + 1, SIM_ATTEMPTS)}/${SIM_ATTEMPTS}`]]);
  const abs = simAbsolute(s);
  const tried = g.attempts.filter((a) => a.cand !== "jo").map((a) => a.cand);
  const cands = simAiCandidates(s, tried.length < simSeated(s).length - 1 ? tried : []);
  const best = abs && abs !== "jo" ? cands.find((c) => c.id === abs) : cands[0];
  const B = best ? simById(s, best.id) : null;
  const without = best ? simInvestiture(s, best.deal, "abs") : null;
  const maj = simGovMajorities(s);
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-consult">
      <p class="sim-kick">Ronda de consultas · intento ${Math.min(g.attempts.length + 1, SIM_ATTEMPTS)} de ${SIM_ATTEMPTS}</p>
      <h3 class="sim-h">${abs === "jo" ? "¡Tienes mayoría absoluta!" : abs ? `${esc(simById(s, abs).name)} tiene mayoría absoluta` : "Nadie tiene mayoría absoluta"}</h3>
      ${simHemi(s, s.res.seats, `<strong>176</strong><small>para la mayoría absoluta</small>`)}
      ${g.attempts.length ? `<div class="sim-attempts">${g.attempts.map((a, k) => `<p>${simLogo(simById(s, a.cand))}<span>Intento ${k + 1}: ${esc(simById(s, a.cand).name)} no ha sido investido (${a.si} sí, ${a.no} no).</span></p>`).join("")}</div>` : ""}
      ${simExplain(abs ? "Con 176 escaños o más, un partido puede ser investido solo en la primera votación." : `Después de las elecciones, el Rey consulta a los partidos y propone un candidato a la [[investidura]]. Si nadie la supera en ${g.attempts.length ? "los dos meses que empezaron con la primera votación" : "dos meses desde la primera votación"}, se repiten las elecciones. ${g.attempts.length ? `Quedan ${SIM_ATTEMPTS - g.attempts.length} ${SIM_ATTEMPTS - g.attempts.length === 1 ? "intento" : "intentos"}.` : ""}`, "nou-govern")}
      <h4 class="sim-h4">Las opciones</h4>
      <div class="sim-choices">
        ${abs === "jo" ? `<button class="sim-choice primary" data-go="self"><b>Preséntate a la investidura</b><small>Tienes suficientes escaños para gobernar solo.</small></button>` : abs ? `
          <button class="sim-choice" data-go="vote-si"><b>Vota a favor de ${esc(B.name)}</b><small>No cambiará el resultado, pero se valorará tu coherencia.</small></button>
          <button class="sim-choice" data-go="vote-no"><b>Vota en contra y pasa a la oposición</b><small>${esc(B.name)} gobernará igualmente.</small></button>` : `
          <button class="sim-choice" data-go="self"><b>Pide ser el candidato</b><small>Construye una mayoría a tu alrededor. Con ${s.res.seats.jo} escaños, necesitas muchos apoyos.</small></button>
          ${best ? `<button class="sim-choice primary" data-go="support"><b>Negocia con ${esc(B.name)}</b><small>Es quien tiene más opciones. Sin tus votos: ${without.si} sí y ${without.no} no${without.first ? " (ya tiene mayoría absoluta)" : without.second ? " (ya ganaría en la segunda votación)" : ""}.</small></button>` : ""}
          ${best ? `<button class="sim-choice" data-go="opp"><b>Pasa a la oposición</b><small>Votas no a ${esc(B.name)} y no negocias nada.</small></button>` : ""}`}
      </div>
      <h4 class="sim-h4">La mesa: quién quiere qué</h4>
      <div class="sim-pcards">${simSeatedSorted(s).map((id) => simPartyCard(s, id)).join("")}</div>
      ${maj.length ? `<h4 class="sim-h4">Mayorías mínimas posibles</h4>
      <div class="sim-coal">${maj.map((m) => `<div class="${m.members.includes("jo") ? "me" : ""}">${m.members.map((id) => simLogo(simById(s, id))).join("")}<b>${m.total}</b><small>${m.members.length === 1 ? "Mayoría absoluta" : `${m.members.length} partidos`}</small></div>`).join("")}</div>
      <p class="sim-note">Combinaciones en las que no sobra ningún partido y que no son ideológicamente imposibles. Como en el <a href="#apren/pactometre">pactómetro</a> de Aprende.</p>` : ""}
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
  G.ctx.hud([["intent", "Intento", `${g.attempts.length + 1}/${SIM_ATTEMPTS}`]]);
  const d = g.draft = g.draft || { cand: "jo", measures: g.mine.slice(0, 2), roles: {} };
  const rivals = simSeatedSorted(s).filter((id) => id !== "jo");
  const el = simMount(G, `<div class="sim-wrap">
    <div class="card sim-card sim-neg">
      <p class="sim-kick">Negociación · eres el candidato</p>
      <h3 class="sim-h">Construye tu acuerdo</h3>
      <p class="sim-sub">Elige hasta cuatro medidas y ofrece a cada partido una fórmula de apoyo. Cada partido decide según la distancia ideológica, las medidas y sus líneas rojas.</p>
      <div class="sim-neg-preview" data-preview aria-live="polite"></div>
      <h4 class="sim-h4">Las medidas del acuerdo <span data-mcount></span></h4>
      <div class="sim-measures">${SIM_THEMES.map((t, th) => `<div class="sim-mgroup"><small>${t.label}</small>${SIM_MEASURES.filter((m) => m.th === th).map((m) => {
        const bad = simMeasureView(s.me, m) < -0.3;
        const reds = rivals.filter((id) => simIsRedLine(simById(s, id), m)).map((id) => simById(s, id).sig);
        const fans = rivals.filter((id) => simWants(simById(s, id)).includes(m)).map((id) => simById(s, id).sig);
        return `<button class="sim-mchip" data-m="${m.id}" ${bad ? `disabled title="Va contra tu programa"` : ""}>${esc(m.t)}${fans.length ? `<em class="fan">Lo quiere: ${fans.join(", ")}</em>` : ""}${reds.length ? `<em class="red">Línea roja: ${reds.join(", ")}</em>` : ""}</button>`;
      }).join("")}</div>`).join("")}</div>
      <h4 class="sim-h4">Los socios</h4>
      <div class="sim-partners">${rivals.map((id) => `<div class="sim-partner" data-p="${id}">
        <div class="sim-partner-h">${simLogo(simById(s, id))}<b>${esc(simById(s, id).name)}<small class="cand">${esc(simCand(s, id))}</small></b><span class="seats">${s.res.seats[id]}</span><em class="v" data-v></em></div>
        <div class="sim-seg sm" role="group" aria-label="Fórmula de apoyo para ${esc(simById(s, id).name)}">${[["", "Nada"], ["inv", "Puntual"], ["leg", "Acuerdo"], ["coal", "Coalición"]].map(([k, l]) => `<button data-role="${k}">${l}</button>`).join("")}</div>
        <small data-why></small>
      </div>`).join("")}</div>
      <p class="sim-note">${SIM_APPROX}</p>
      <p class="sim-note">Puntual: solo vota la investidura. Acuerdo: da apoyo estable desde el Parlamento (un [[acuerdo de legislatura]]). Coalición: entra en el Gobierno con ministerios.</p>
      <div class="sim-actions-row"><button class="btn ghost" data-back>Vuelve a las consultas</button><button class="btn primary lg" data-vote>Llévalo a votación</button></div>
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
    $("[data-preview]", el).innerHTML = `${simVoteBar(r)}<p class="sim-verdict ${r.first ? "ok" : r.second ? "mid" : "ko"}">${r.first ? "Con este acuerdo serías investido en la primera votación." : r.second ? "Con este acuerdo serías investido en la segunda votación, por mayoría simple." : `Con este acuerdo no sales investido: tienes ${r.si} síes y ${r.no} noes, y en la segunda votación hacen falta más síes que noes. Busca apoyos o abstenciones de quienes ahora votan no.`}</p>`;
  }
  update();
  $$("[data-m]", el).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.m;
    if (d.measures.includes(id)) d.measures = d.measures.filter((x) => x !== id);
    else if (d.measures.length < 4) d.measures.push(id);
    else return toast("Como máximo, cuatro medidas");
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
      <p class="sim-kick">Negociación con ${esc(C.name)}</p>
      <h3 class="sim-h">${esc(C.name)} busca apoyos</h3>
      <div class="sim-aideal">
        <div><small>Las medidas que propone</small><ul>${ai.deal.measures.map((id) => `<li>${esc(simMeasure(id).t)}</li>`).join("")}</ul></div>
        <div><small>Los apoyos que ya tiene</small><p>${offer.length ? offer.map((id) => `${simLogo(simById(s, id))} ${SIM_ROLES[ai.deal.roles[id]].short}`).join(" ") : "Ningún acuerdo: cuenta con los votos de los partidos cercanos."}</p></div>
      </div>
      ${simVoteBar(without)}
      <p class="sim-verdict ${without.first || without.second ? "mid" : "ko"}">${without.first ? "Ya tiene mayoría absoluta sin ti: tu fuerza negociadora es pequeña." : without.second ? "Sin ti, ganaría en la segunda votación. Puedes pedir poco." : "Sin tus votos no sale investido: tienes fuerza para negociar."}</p>
      <h4 class="sim-h4">¿Qué le pides? <span data-mcount></span></h4>
      <div class="sim-measures compact">${SIM_MEASURES.filter((m) => simMeasureView(s.me, m) >= 0 && !ai.deal.measures.includes(m.id)).sort((a, b) => (s.me.iss[b.th] - s.me.iss[a.th]) || (simMeasureView(s.me, b) - simMeasureView(s.me, a))).slice(0, 10).map((m) => `<button class="sim-mchip" data-m="${m.id}">${esc(m.t)}${g.mine.includes(m.id) ? `<em class="fan">De tu programa</em>` : ""}${simCandRejects(s, cand, m) ? `<em class="red">Va contra el programa de ${esc(C.sig)}</em>` : ""}</button>`).join("")}</div>
      <h4 class="sim-h4">¿Qué fórmula de apoyo?</h4>
      <div class="sim-seg" role="group" aria-label="Fórmula de apoyo">${Object.entries(SIM_ROLES).map(([k, r]) => `<button data-role="${k}">${r.label}</button>`).join("")}</div>
      <div data-answer aria-live="polite"></div>
      <div class="sim-actions-row"><button class="btn ghost" data-back>Vuelve a las consultas</button><button class="btn primary lg" data-ask>Propónselo</button></div>
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
    else return toast("Como máximo, dos medidas");
    Sfx.play("pick"); sync(); $("[data-answer]", el).innerHTML = "";
  }));
  $$("[data-role]", el).forEach((b) => b.addEventListener("click", () => { req.role = b.dataset.role; Sfx.play("pick"); sync(); $("[data-answer]", el).innerHTML = ""; }));
  $("[data-back]", el).addEventListener("click", () => { s.stage = "gov-consult"; simSave(G); simGovConsult(G); });
  $("[data-ask]", el).addEventListener("click", () => {
    const ans = simAiAnswer(s, ai.deal, req);
    simSave(G);
    Sfx.play(ans.refused.length ? "ko" : "ok");
    $("[data-answer]", el).innerHTML = `<div class="sim-answer">
      <h4>La respuesta de ${esc(C.name)}</h4>
      <ul>
        ${ans.measures.filter((id) => req.measures.includes(id)).map((id) => `<li class="ok">Acepta «${esc(simLc(simMeasure(id).t))}».</li>`).join("")}
        ${ans.refused.map((x) => `<li class="ko">No acepta «${esc(simLc(simMeasure(x.id).t))}». ${esc(x.why)}</li>`).join("")}
        <li class="${ans.roleWhy ? "ko" : "ok"}">${ans.roleWhy ? `${esc(ans.roleWhy)} Te ofrece: ${SIM_ROLES[ans.role].label.toLowerCase()}.` : `Acepta: ${SIM_ROLES[ans.role].label.toLowerCase()}.`}</li>
      </ul>
      <p class="sim-note">${ans.pivotal ? "Tus votos son decisivos: por eso te escucha." : "Tus votos no son decisivos: por eso cede poco."}</p>
      ${(() => {
        const after = simInvestiture(s, ans.deal, "si");
        const moved = Object.keys(after.votes).filter((id) => id !== "jo" && after.votes[id].v !== without.votes[id]?.v);
        return `${simVoteBar(after)}<p class="sim-verdict ${after.first || after.second ? "ok" : "ko"}">Con este acuerdo y tu sí: ${after.si} síes y ${after.no} noes.</p>${moved.map((id) => `<p class="sim-note">${simLogo(simById(s, id))} ${esc(simById(s, id).name)} ${simVoteVerb[after.votes[id].v]}: ${esc(after.votes[id].why)}</p>`).join("")}`;
      })()}
      <div class="sim-votebtns"><button class="btn primary" data-v="si">Acepta el acuerdo y vota sí</button><button class="btn" data-v="abs">Abstente</button><button class="btn" data-v="no">Vota no</button></div>
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
      <p class="sim-kick">Congreso de los Diputados · debate de investidura</p>
      <h3 class="sim-h">${C.id === "jo" ? "Tu investidura" : `Investidura de ${esc(simCand(s, C.id))}`}</h3>
      <p class="sim-sub">Candidato de ${esc(C.name)}${C.id === "jo" ? "" : ` (${esc(C.sig)})`}.</p>
      ${P.deal.measures.length ? `<p class="sim-sub">El acuerdo incluye: ${P.deal.measures.map((id) => esc(simLc(simMeasure(id).t))).join(" · ")}.</p>` : ""}
      <div class="sim-vround" data-r1>
        <h4>Primera votación <small>Hace falta mayoría absoluta: 176 síes</small></h4>
        ${simVoteBar(r)}
        <p class="sim-verdict ${r.first ? "ok" : "ko"}">${r.first ? `${esc(C.name)} obtiene la confianza del Congreso por mayoría absoluta.` : `Solo ${r.si} síes: no llega a 176.`}</p>
      </div>
      ${r.first ? "" : `<div class="sim-vround" data-r2 hidden>
        <h4>Segunda votación, 48 horas después <small>Basta con más síes que noes</small></h4>
        ${simVoteBar(r, false)}
        <p class="sim-verdict ${r.second ? "ok" : "ko"}">${r.second ? `${r.si} síes contra ${r.no} noes: ${esc(C.name)} es investido por mayoría simple.` : `${r.si} síes contra ${r.no} noes: la investidura fracasa.`}</p>
      </div>`}
      <details class="sim-votedetail"><summary>Qué ha votado cada partido y por qué</summary>${simVoteRows(s, r.votes, s.res.seats)}<p class="sim-note">${SIM_APPROX}</p></details>
      <div data-after hidden>
        ${simExplain(r.pass ? (r.first ? "Con 176 votos afirmativos, el candidato queda investido en la primera votación." : "En la segunda votación basta con la mayoría simple: las abstenciones no cuentan ni a favor ni en contra, y por eso pueden dejar pasar a un gobierno en minoría.") : g.attempts.length >= SIM_ATTEMPTS ? "Han pasado dos meses desde la primera votación y nadie ha obtenido la confianza del Congreso. Según el artículo 99.5 de la Constitución, el Rey disuelve las Cortes y se convocan elecciones nuevas." : `La investidura ha fracasado. Empieza a contar el plazo de dos meses: se pueden hacer nuevas propuestas. Quedan ${SIM_ATTEMPTS - g.attempts.length} ${SIM_ATTEMPTS - g.attempts.length === 1 ? "intento" : "intentos"}.`, "nou-govern")}
        <div class="sim-actions-row"><button class="btn primary lg" data-go>${r.pass || g.attempts.length >= SIM_ATTEMPTS ? "Continúa" : "Vuelve a la ronda de consultas"}</button></div>
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
      <p class="sim-kick">${g.outcome === "rep" ? "Repetición electoral" : "Nuevo Gobierno"}</p>
      <h3 class="sim-h">${SIM_OUTCOME_VERDICT[g.outcome]}</h3>
      ${comp ? `
        <div class="sim-govbox">
          <div><small>Presidente del Gobierno</small><p>${simLogoSvg(C, 40)}<b>${esc(simCand(s, C.id))}</b><em>${esc(C.name)}${C.id === "jo" ? " (tú)" : ""}</em></p></div>
          <div><small>${comp.parties.length > 1 ? "Gobierno de coalición" : "Gobierno de un solo partido"}</small><p>${comp.parties.map((id) => simLogo(simById(s, id))).join(" ")} <b>${comp.parties.reduce((t, id) => t + s.res.seats[id], 0)} escaños</b></p></div>
          ${Object.keys(comp.support).length ? `<div><small>Apoyos desde el Parlamento</small><p>${Object.entries(comp.support).map(([id, r]) => `${simLogo(simById(s, id))} ${SIM_ROLES[r].short}`).join(" ")}</p></div>` : ""}
        </div>
        ${f.deal.measures.length ? `<h4 class="sim-h4">El programa del acuerdo</h4><ul class="sim-deal">${f.deal.measures.map((id) => `<li class="${g.mine.includes(id) ? "mine" : ""}">${esc(simMeasure(id).t)}${g.mine.includes(id) ? " <em>de tu programa</em>" : ""}</li>`).join("")}</ul>` : ""}
        ${simExplain(comp.parties.reduce((t, id) => t + s.res.seats[id], 0) >= SIM_MAJ ? "El Gobierno tiene mayoría absoluta propia: podrá aprobar leyes y presupuestos con comodidad." : "El Gobierno no tiene mayoría absoluta propia: cada ley y cada presupuesto se tendrá que negociar con otros grupos. Esto es un gobierno en minoría.", "congres")}` : simExplain("Si en dos meses desde la primera votación de investidura ningún candidato obtiene la confianza del Congreso, el Rey disuelve las Cortes y se convocan nuevas elecciones (artículo 99.5 de la Constitución).", "nou-govern")}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>${legMode ? "Empieza la legislatura" : "Ver el resultado final"}</button></div>
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
  if (s.res2) return `Cuatro años después: ${s.res2.seats.jo} ${s.res2.seats.jo === 1 ? "escaño" : "escaños"}`;
  if (!g?.outcome) return `${simPct(simElectionShare(s))} % de los votos`;
  if (g.outcome === "rep") return "Nadie es investido: repetición electoral";
  const comp = simGovComposition(s);
  const pm = simById(s, comp.pm);
  return comp.pm === "jo" ? "Presides el Gobierno" : `Gobierna ${pm.sig} (${simCand(s, comp.pm)})${comp.parties.includes("jo") ? " contigo en coalición" : ""}`;
}
const simElectionShare = (s) => (s.res ? s.res.share.jo / 100 : 0);
function simGovLine(s) {
  const g = s.gov;
  if (!g?.outcome) return "";
  const comp = simGovComposition(s);
  const L = s.leg;
  return `<p><b>${SIM_OUTCOME[g.outcome].label}.</b> ${comp ? `Presidente: ${esc(simCand(s, comp.pm))} (${esc(simById(s, comp.pm).sig)}).` : ""} ${L && L.q ? `Legislatura: ${L.q} de 8 trimestres${L.over ? ` · ${SIM_LEG_END[L.over]?.label || ""}` : ""}.` : ""}</p>`;
}

// =========================================================
// La legislatura
// =========================================================
const SIM_LEG_END = {
  completa: { label: "Legislatura completa", text: "Han pasado cuatro años: la legislatura se acaba y se convocan elecciones (artículo 68 de la Constitución)." },
  anticipades: { label: "Elecciones anticipadas", text: "El presidente ha disuelto las Cortes antes de tiempo (artículo 115 de la Constitución)." },
  censura: { label: "Moción de censura", text: "El Congreso ha aprobado una moción de censura: el candidato alternativo pasa a ser presidente (artículo 113)." },
  confianca: { label: "Cuestión de confianza perdida", text: "El presidente ha perdido la cuestión de confianza y debe dimitir (artículo 114)." },
};
const SIM_KIND = {
  pressupostos: { label: "Presupuestos", rule: "Mayoría simple: más síes que noes.", link: "congres" },
  decret: { label: "Convalidación de un decreto ley", rule: "El Congreso tiene 30 días para convalidarlo; basta con más síes que noes (art. 86).", link: "congres" },
  llei: { label: "Ley ordinaria", rule: "Mayoría simple: más síes que noes.", link: "congres" },
  organica: { label: "Ley orgánica", rule: "Hace falta mayoría absoluta, 176 síes, en una votación final sobre el conjunto (art. 81).", link: "congres" },
  soci: { label: "Proposición de ley de un socio", rule: "Mayoría simple: más síes que noes.", link: "congres" },
};
const simRoleLabel = { pm: "Presides el Gobierno", coal: "Estás en el Gobierno de coalición", leg: "Das apoyo con un acuerdo de legislatura", inv: "Apoyaste la investidura", opp: "Estás en la oposición" };

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
    <div><p class="sim-kick">${kicker}</p><h3 class="sim-h">Trimestre ${L.q + 1} de 8</h3><p class="sim-sub">${simRoleLabel[role]} · Presidente: ${esc(simCand(s, L.gov.pm))} (${esc(pm.sig)}) · ${L.supSeats} escaños lo apoyan</p></div>
    <ol class="sim-quarters" aria-label="Trimestres">${Array.from({ length: 8 }, (_, k) => `<li class="${k < L.q ? "done" : k === L.q ? "on" : ""}">${k + 1}</li>`).join("")}</ol>
  </div>${simIndPanel(L)}`;
}
const simReactLine = (s, reacts) => reacts.length ? `<p class="sim-reacts">${reacts.map((x) => `<span class="${x.d > 0 ? "up" : "down"}">${simLogo(simById(s, x.id))} ${x.d > 0 ? "está de acuerdo" : "se opone"}</span>`).join("")}</p>` : "";

// 1. La decisió del trimestre
function simLegCardScreen(G) {
  const s = G.state, L = s.leg;
  G.ctx.hud([["q", "Trimestre", `${L.q + 1}/8`], ["pop", "Popularidad", L.ind.pop]]);
  if (!L.curCard) { L.curCard = simLegPickCard(s).id; simSave(G); }
  const card = SIM_LEG_CARDS.find((c) => c.id === L.curCard);
  const role = simLegRole(s);
  const governs = role === "pm" || role === "coal";
  const aiPick = governs ? null : simAiPick(s, card);
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    ${simLegHead(s, "Decisión del trimestre")}
    <div class="card sim-card sim-legcard">
      <h3 class="sim-h">${card.title}</h3>
      <p class="sim-lead">${card.text}</p>
      ${governs ? `<p class="sim-sub">${role === "pm" ? "Decides tú." : "Tu ministerio lleva la propuesta al Consejo de Ministros."}</p>
        <div class="sim-dil-opts">${card.opts.map((o, i) => `<button class="sim-opt" data-o="${i}"><i>${"ABC"[i]}</i>${o.t}</button>`).join("")}</div>`
        : `<div class="sim-govpick"><small>El Gobierno de ${esc(simById(s, L.gov.pm).name)} ha decidido</small><b>${card.opts[aiPick].t}</b></div>
        <p class="sim-sub">¿Qué dices tú?</p>
        <div class="sim-dil-opts"><button class="sim-opt" data-st="si"><i>A</i>Lo apoyo</button><button class="sim-opt" data-st="no"><i>B</i>Me opongo y propongo una alternativa</button></div>`}
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
    show(`<div class="sim-result">${simIndPanel(L, res.delta)}${simReactLine(s, res.reacts)}${simExplain(res.why)}<div class="sim-actions-row"><button class="btn primary lg" data-go>En el Congreso</button></div></div>`);
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
    show(`<div class="sim-result">${simIndPanel(L, res.delta)}${simExplain(`${o.why} ${coherent ? "Tu posición es coherente con tu programa: tu electorado lo valora." : "Tu posición no encaja mucho con tu programa: parte de tu electorado no la entiende."}`)}<div class="sim-actions-row"><button class="btn primary lg" data-go>En el Congreso</button></div></div>`);
  }));
}

// 2. La votació del trimestre
function simLegBillScreen(G) {
  const s = G.state, L = s.leg;
  G.ctx.hud([["q", "Trimestre", `${L.q + 1}/8`], ["pop", "Popularidad", L.ind.pop]]);
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
    ${simLegHead(s, "En el Congreso")}
    <div class="card sim-card sim-bill">
      <p class="sim-kick">${K.label}</p>
      <h3 class="sim-h">${esc(bill.title)}</h3>
      <p class="sim-sub">${SIM_THEMES[bill.th].label} · posición ${simAxis[bill.ax](bill.p).toLowerCase()} · ${view > 0.3 ? "encaja con tu programa" : view < -0.3 ? "va contra tu programa" : "se queda a medio camino"}</p>
      <p class="sim-rule">${rich(K.rule)}</p>
      <div data-prev>${simVoteBar(preview, bill.kind === "organica")}<p class="sim-verdict ${preview.pass ? "ok" : "ko"}">${pm ? (preview.pass ? "Ahora mismo, tiene suficientes apoyos." : "Ahora mismo, no tiene suficientes apoyos.") : pivotal ? "Tu voto decide el resultado." : "Tu voto no cambiará el resultado, pero sí tu imagen."}</p></div>
      <div class="sim-choices" data-choices>
        ${pm ? `
          <button class="sim-choice primary" data-do="vote"><b>Llévala a votación tal como está</b><small>${preview.si} síes y ${preview.no} noes previstos.</small></button>
          ${swing ? `<button class="sim-choice" data-do="neg"><b>Negóciala con ${esc(simById(s, swing).name)}</b><small>Incorporas parte de sus demandas: ganas su apoyo, pero tu electorado lo puede ver como una cesión.</small></button>` : ""}
          <button class="sim-choice" data-do="delay"><b>Aplázala</b><small>${bill.kind === "pressupostos" ? "Se prorrogan los presupuestos del año anterior: menos inversión." : "Evitas la derrota, pero transmites debilidad."}</small></button>
          ${canDecree ? `<button class="sim-choice" data-do="decree"><b>Apruébala por decreto ley</b><small>Entra en vigor enseguida, pero el Congreso la tiene que convalidar en 30 días.</small></button>` : ""}`
        : `
          ${pivotal && view < 0.6 && !bill.deal ? `<button class="sim-choice" data-do="ask"><b>Pide una contrapartida</b><small>Tu voto es decisivo: puedes exigir cambios antes de votar.</small></button>` : ""}
          <button class="sim-choice" data-do="si"><b>Vota sí</b></button>
          <button class="sim-choice" data-do="abs"><b>Abstente</b></button>
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
      bill.title += " (con tus cambios)";
      bill.deal = "jo";
      L.ind.pop += 2;
      simClampInd(L); simSave(G);
      toast("El Gobierno acepta tus cambios");
      return simLegBillScreen(G);
    }
    if (what === "neg") {
      const P = simById(s, swing);
      bill.p = Math.round((bill.p + (P[bill.ax] - bill.p) * 0.5) * 10) / 10;
      bill.title += ` (pactada con ${P.sig})`;
      bill.deal = swing;
      L.sup[swing] = Math.min(1, L.sup[swing] + 0.2);
      L.ind.pop -= 2;
      simClampInd(L); simLegStability(s); simSave(G);
      toast(`Acuerdo con ${P.name}`);
      return simLegBillScreen(G);
    }
    const res = simLegResolve(s, bill, what);
    L.curBill = null; s.stage = "leg-end"; simSave(G);
    G.ctx.setHud("pop", L.ind.pop, { bump: true });
    $$("[data-do]", el).forEach((x) => { x.disabled = true; });
    $("[data-prev]", el).hidden = true;
    Sfx.play(res.good ? "win" : "lose");
    $("[data-out]", el).innerHTML = `<div class="sim-result">
      ${res.vote ? `${simVoteBar(res.vote, bill.kind === "organica")}<details class="sim-votedetail"><summary>Qué ha votado cada partido</summary>${simVoteRows(s, res.vote.votes, s.res.seats)}</details>` : ""}
      ${res.conv ? `<h4>Convalidación en el Congreso</h4>${simVoteBar(res.conv, false)}` : ""}
      <p class="sim-verdict ${res.good ? "ok" : "ko"}">${res.title}</p>
      ${simIndPanel(L, res.delta)}
      ${simExplain(res.why, K.link)}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>Cierra el trimestre</button></div>
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
    title = bill.kind === "pressupostos" ? "Se prorrogan los presupuestos del año anterior." : "La iniciativa queda aplazada.";
    why = bill.kind === "pressupostos" ? "Sin presupuestos nuevos, el Estado funciona con los del año anterior prorrogados: no hay nuevas inversiones y el Gobierno se ve débil." : "Aplazar evita una derrota, pero la oposición lo presenta como un gobierno sin mayoría.";
  } else if (pm && what === "decree") {
    // Decret llei: efecte immediat i convalidació posterior
    L.decrees++;
    simLegBillEffects(L, bill);
    conv = simLegVote(s, { ...bill, kind: "decret" });
    if (conv.pass) { good = true; L.passed++; title = "El decreto ley entra en vigor y el Congreso lo convalida."; why = "Un decreto ley tiene efectos desde el primer día, pero el Congreso debe convalidarlo en 30 días. Abusar de ellos desgasta la relación con los socios."; Object.keys(L.sup).forEach((id) => { if (!L.gov.parties.includes(id)) L.sup[id] -= 0.04; }); }
    else { simLegBillEffects(L, bill, -1); L.ind.pop -= 4; L.ind.est -= 4; L.failed++; title = "El Congreso no convalida el decreto ley: queda derogado."; why = "Si el Congreso no lo convalida en 30 días, el decreto ley deja de tener efecto. El Gobierno queda en evidencia."; }
  } else {
    vote = simLegVote(s, bill, pm ? null : what);
    good = vote.pass;
    if (vote.pass) {
      simLegBillEffects(L, bill);
      if (pm || role === "coal") { L.ind.pop += 2; L.passed++; }
      title = `Aprobada: ${vote.si} síes, ${vote.no} noes y ${vote.abs} abstenciones.`;
    } else {
      if (pm || role === "coal") { L.ind.pop -= 3; L.ind.est -= 3; L.failed++; }
      if (bill.kind === "pressupostos") { L.budgetFails = (L.budgetFails || 0) + 1; L.ind.eco -= 3; }
      title = `Rechazada: ${vote.si} síes, ${vote.no} noes y ${vote.abs} abstenciones.`;
    }
    why = bill.kind === "organica" ? `Las leyes orgánicas necesitan 176 votos a favor. ${vote.si >= SIM_MAJ ? "Ha tenido suficientes." : `Ha tenido ${vote.si}: por eso ${vote.pass ? "" : "no "}sale.`}` : K.rule;
    if (!pm) {
      // El teu vot: coherència amb el programa i relació amb el Govern
      const view = simMeasureView(s.me, bill);
      const coherent = what === "si" ? view > 0 : what === "no" ? view < 0 : Math.abs(view) < 0.4;
      L.ind.pop += coherent ? 2 : -2;
      if (what === "si") L.sup.jo = Math.min(1, (L.sup.jo || 0) + 0.06);
      if (what === "no") L.sup.jo = Math.max(-1, (L.sup.jo || 0) - (role === "coal" || role === "leg" ? 0.3 : 0.08));
      why += ` ${coherent ? "Tu voto es coherente con tu programa." : "Tu voto no encaja con tu programa: tu electorado no lo entiende."}`;
      if (what === "no" && (role === "coal" || role === "leg")) why += " Votar contra el Gobierno que sostienes debilita el acuerdo.";
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
        L.closing.notes.push(id === "jo" ? "Sales del Gobierno: la coalición se ha roto." : `${simById(s, id).name} sale del Gobierno: la coalición se ha roto.`);
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
  G.ctx.hud([["q", "Trimestre", `${L.q}/8`], ["pop", "Popularidad", L.ind.pop]]);
  const done = L.q >= 8;
  const canConfidence = role === "pm" && !L.confidence && L.q >= 2 && !done;
  const canDissolve = role === "pm" && L.q >= 4 && !done;
  const myCensure = role !== "pm" && role !== "coal" && L.q >= 2 && !done && !L.myCensure;
  const sign = myCensure ? simCensureSigners(s) : 0;
  const el = simMount(G, `<div class="sim-wrap sim-leg">
    <div class="sim-leghead"><div><p class="sim-kick">Final del trimestre ${L.q}</p><h3 class="sim-h">${done ? "Se acaba la legislatura" : "Balance del trimestre"}</h3><p class="sim-sub">${simRoleLabel[role]} · ${L.supSeats} escaños apoyan al Gobierno</p></div></div>
    ${simIndPanel(L, C.delta)}
    <div class="card sim-card">
      ${simExplain(`La economía ${C.drift > 1 ? "ha mejorado un poco por el contexto internacional" : C.drift < -1 ? "se ha enfriado por el contexto internacional" : "se ha mantenido estable"}. ${role === "pm" || role === "coal" ? "La popularidad del Gobierno depende de la economía, del bienestar y del desgaste de gobernar." : "En la oposición, te beneficia el desgaste del Gobierno y te perjudica que la economía vaya bien."}`, null, "Qué ha pasado este trimestre")}
      ${C.notes.map((n) => `<p class="sim-banner">${esc(n)}</p>`).join("")}
      ${L.censure?.pending ? `<div class="sim-alert"><h4>Moción de censura</h4><p>${esc(simById(s, L.censure.cand).name)} presenta una [[moción de censura]] con ${esc(simCand(s, L.censure.cand))} como candidato alternativo. Si obtiene 176 votos, será el nuevo presidente.</p>
        <div class="sim-choices"><button class="sim-choice" data-do="cen-neg"><b>Negocia para evitarla</b><small>Haces concesiones a un grupo que duda. Pierdes popularidad.</small></button><button class="sim-choice primary" data-do="cen-vote"><b>Afronta la votación</b></button></div></div>` : ""}
      ${L.budgetFails >= 2 && role === "pm" && !done ? `<p class="sim-banner">Sin presupuestos aprobados, muchos gobiernos adelantan las elecciones.</p>` : ""}
      <div data-out></div>
      <div class="sim-choices" data-next ${L.censure?.pending ? "hidden" : ""}>
        ${done ? `<button class="sim-choice primary" data-do="elect"><b>Convoca las elecciones</b><small>Han pasado los cuatro años de la legislatura.</small></button>` : `
          <button class="sim-choice primary" data-do="next"><b>Empieza el trimestre ${L.q + 1}</b></button>
          ${canConfidence ? `<button class="sim-choice" data-do="conf"><b>Plantea una cuestión de confianza</b><small>Si la ganas por mayoría simple, sales reforzado. Si la pierdes, tienes que dimitir.</small></button>` : ""}
          ${canDissolve ? `<button class="sim-choice" data-do="dissolve"><b>Disuelve las Cortes y convoca elecciones</b><small>Ya ha pasado más de un año desde las elecciones, como exige el artículo 115.</small></button>` : ""}
          ${myCensure ? `<button class="sim-choice" data-do="mycensure" ${sign < 35 ? "disabled" : ""}><b>Presenta una moción de censura</b><small>${sign < 35 ? "Hace falta que la firmen como mínimo 35 diputados (una décima parte de la cámara) y ahora no hay suficientes grupos dispuestos." : "Eres el candidato alternativo. Si obtienes 176 votos, serás presidente. Si fracasa, te pasará factura."}</small></button>` : ""}`}
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
      if (target) { L.sup[target] = Math.min(1, L.sup[target] + 0.45); L.ind.pop -= 3; out.innerHTML = `<p class="sim-banner">Negocias con ${esc(simById(s, target).name)}: haces concesiones.</p>`; }
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
      out.insertAdjacentHTML("beforeend", `${simVoteBar(r)}<p class="sim-verdict ${r.pass ? "ko" : "ok"}">${r.pass ? `La moción prospera con ${r.si} votos: ${esc(simCand(s, L.censure.cand))} (${esc(simById(s, L.censure.cand).sig)}) es el nuevo presidente.` : `La moción fracasa: ${r.si} votos a favor, hacían falta 176. Sales reforzado.`}</p>${simExplain("La moción de censura es constructiva: se debe presentar con un candidato alternativo y necesita la mayoría absoluta, 176 votos (artículo 113 de la Constitución).", "congres")}`);
      if (r.pass) { out.insertAdjacentHTML("beforeend", `<div class="sim-actions-row"><button class="btn primary lg" data-do="over">Continúa</button></div>`); }
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
      out.innerHTML = `${simVoteBar(r, false)}<p class="sim-verdict ${r.pass ? "ok" : "ko"}">${r.pass ? `Ganas la cuestión de confianza: ${r.si} síes contra ${r.no} noes.` : `Pierdes la cuestión de confianza: ${r.si} síes contra ${r.no} noes.`}</p>${simExplain("La cuestión de confianza la plantea el presidente sobre su programa o una decisión importante. Se gana por mayoría simple; si se pierde, el Gobierno debe dimitir (artículos 112 y 114 de la Constitución).", "congres")}`;
      if (!r.pass) { nextBox.innerHTML = `<button class="sim-choice primary" data-do="over"><b>Continúa</b></button>`; $("[data-do='over']", el).addEventListener("click", () => { L.closing = null; s.stage = "leg-over"; simSave(G); simLegOver(G); }); }
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
      out.innerHTML = `${simVoteBar(r)}<p class="sim-verdict ${r.pass ? "ok" : "ko"}">${r.pass ? `La moción prospera con ${r.si} votos: ¡eres el nuevo presidente del Gobierno!` : `La moción fracasa: ${r.si} votos a favor, hacían falta 176.`}</p>${simExplain("La moción de censura debe incluir un candidato alternativo y necesita 176 votos. Si prospera, el candidato es investido automáticamente.", "congres")}`;
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
    <div class="sim-leghead"><div><p class="sim-kick">Final de la legislatura</p><h3 class="sim-h">${E.label}</h3><p class="sim-sub">${L.q} ${L.q === 1 ? "trimestre" : "trimestres"} · ${L.passed} votaciones ganadas · ${L.decrees} decretos ley</p></div></div>
    ${simIndPanel(L)}
    <div class="card sim-card">
      ${simExplain(E.text, "congres")}
      ${goesToPolls ? `<p class="sim-sub">Ahora toca una campaña corta de tres días. Los indicadores de la legislatura son el punto de partida: la popularidad pesa en el voto de tu partido${simLegRole(s) === "pm" || simLegRole(s) === "coal" ? ", y la economía y el bienestar también" : ""}.</p>` : `<p class="sim-sub">La partida se acaba aquí.</p>`}
      <div class="sim-actions-row"><button class="btn primary lg" data-go>${goesToPolls ? "Empieza la campaña" : "Ver el resultado final"}</button></div>
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
  simDayOffers(s);
  const poll = simPoll(s);
  s.polls.push({ ...poll, day: 0 });
  s.stage = "campaign";
}

function simLegVerdict(s) {
  const L = s.leg, d = s.res2 ? s.res2.seats.jo - s.res.seats.jo : 0;
  if (!s.res2) return L?.over === "censura" ? "Una moción de censura pone fin a tu Gobierno." : L?.over === "confianca" ? "Pierdes la cuestión de confianza y la legislatura se acaba." : SIM_OUTCOME_VERDICT[s.gov?.outcome] || "";
  return `Cuatro años después, ${s.res2.seats.jo} ${s.res2.seats.jo === 1 ? "escaño" : "escaños"} (${d >= 0 ? "+" : ""}${d}). ${d > 0 ? "El electorado premia tu legislatura." : d < 0 ? "El electorado te pasa factura." : "El electorado te mantiene donde estabas."}`;
}
