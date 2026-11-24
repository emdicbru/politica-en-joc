// Simulador del 29N · Intel·ligència dels partits rivals. Regles senzilles i explicables, sense accés al DOM.
// Campanya: on fa actes cada rival i per què, a qui ataca i quins temes empeny. Investidura: quin acord proposa un
// candidat i què accepta del jugador. Els rivals juguen amb les mateixes regles que el jugador.

// ---------- Campanya ----------
const SIM_STYLE_WHY = {
  big: "donde se reparten más escaños",
  urban: "en las ciudades grandes, donde tiene su electorado",
  mid: "en las circunscripciones medianas y rurales",
  own: "en los territorios con identidad propia",
};
// Accions de campanya de cada rival per jornada segons la mida de l'estructura del partit
const SIM_RIVAL_ACTS = { big: 3, mid: 2, urban: 2, own: 2 };

// On es juga escons cada partit: vots que li falten per guanyar-ne un (gap) i marge amb què conserva l'últim (hold),
// en punts percentuals dels vots vàlids de la circumscripció
function simSeatStakes(r, id) {
  return r.provs.map((p) => {
    if (p.votes[id] === undefined) return null;
    const gap = simSeatGap(p, id), hold = simSeatHold(p, id);
    return { i: p.i, gap: gap === null ? null : (gap / p.valid) * 100, hold: hold === null ? null : (hold / p.valid) * 100 };
  }).filter(Boolean);
}

function simRivalsTurn(state) {
  const D = SIM_DIFF[state.diff] || SIM_DIFF.normal;
  const k = D.rival;
  const moves = [];
  const r = simElection(state); // el sondeig intern de cada partit (els grans en fan cada dia)
  const share = Object.fromEntries(Object.entries(r.totals).map(([id, t]) => [id, t.share]));
  // Els jugadors humans: el jugador i, en una partida contra amics, els altres jugadors (simPriv, sim-engine.js)
  const humans = [state.me, ...state.rivals.filter((x) => simIsHuman(state, x.id))];
  // On ha fet míting cada jugador avui
  const ralliesOf = (id) => (simPriv(state, id).log || []).filter((l) => l.day === state.day && l.type === "miting" && (l.round || 1) === (state.round || 1)).map((l) => l.arg);
  const attacksOn = {};
  humans.forEach((H) => { const P = simPriv(state, H.id); P.used.challenged = P.used.challenged || []; P.replies = P.replies || []; });
  state.rivals.forEach((R) => {
    if (simIsHuman(state, R.id)) return; // els altres jugadors fan la seva campanya
    // El jugador que competeix més pels seus votants (el més proper); si un jugador l'ha atacat avui, aquest
    const H = humans.find((x) => simPriv(state, x.id).grudge?.[R.id] === state.day) || [...humans].sort((a, b) => simDistP(R, a) - simDistP(R, b))[0];
    const P = simPriv(state, H.id);
    const rnd = () => simRand(state, `riv-${R.id}`);
    const stakes = simSeatStakes(r, R.id);
    const n = SIM_RIVAL_ACTS[R.style] || 2;
    const did = [];
    // 1. Territori: on es juga escons (a prop de guanyar-ne o de perdre'n), amb les preferències del seu estil
    const scored = stakes.map((x) => {
      const p = SIM_PROVS[x.i];
      const win = x.gap !== null ? Math.exp(-x.gap / 0.9) : 0;
      const keep = x.hold !== null ? 1.1 * Math.exp(-x.hold / 0.9) : 0;
      const style = R.style === "big" ? 0.6 + p.seats / 25 : R.style === "urban" ? 0.3 + p.urb : R.style === "mid" ? 1.2 - p.urb * 0.6 : 0.6 + p.ter;
      return { i: x.i, s: (0.25 + win + keep) * style * (0.75 + rnd() * 0.5), seat: win + keep > 0.45 };
    }).sort((a, b) => b.s - a.s);
    // El rival que competeix pels teus votants respon on fas mítings (si hi té alguna cosa en joc)
    const near = simDistP(R, H) < 3.2;
    const answer = near ? ralliesOf(H.id).find((i) => stakes.some((x) => x.i === i)) : undefined;
    const rallies = [];
    if (answer !== undefined) rallies.push({ i: answer, why: "para responder a tu mitin", seat: false });
    scored.forEach((x) => { if (rallies.length < Math.max(1, n - 1) && !rallies.some((y) => y.i === x.i)) rallies.push({ ...x, why: x.seat ? "se juega un escaño" : SIM_STYLE_WHY[R.style] }); });
    rallies.forEach((x) => {
      const p = SIM_PROVS[x.i];
      state.camp[R.id][x.i] += 0.1 * k;
      SIM_PROVS.forEach((q) => { if (q.i !== x.i && q.ccaa === p.ccaa && simStands(R, q)) state.camp[R.id][q.i] += 0.025 * k; });
      did.push("miting");
    });
    moves.push({ id: R.id, kind: "camp", msg: `${R.name} hace campaña en ${rallies.map((x) => SIM_PROVS[x.i].name).join(" i ")}`, why: rallies.map((x) => x.why), provs: rallies.map((x) => x.i) });
    const top = rallies.find((x) => x.seat) || rallies[0];
    if (top) simNews(state, { kind: "rival", icon: top.seat ? "🎯" : "📣", party: R.id, prov: top.i, t: simNewsText(top.seat ? "rivEsco" : SIM_PROVS[top.i].seats >= 10 && R.style === "big" ? "rivMitingGran" : "rivMiting", state, { sig: R.sig, prov: SIM_PROVS[top.i].name }) });

    // 2. Atac: a qui li pren votants. Si el jugador creix i competeix pels mateixos votants, el rival el té en el punt de mira.
    if (did.length < n) {
      const meThreat = near && share[H.id] > 0.03 && ((state.mom[H.id] || 0) > 0.1 || share[H.id] > share[R.id] * 0.5) ? (1 - simDistP(R, H) / 6) : 0;
      const grudge = P.grudge?.[R.id] === state.day ? 0.35 : 0; // l'has atacat avui: respon
      if ((attacksOn[H.id] || 0) < 2 && (meThreat > 0 || grudge) && rnd() < Math.min(0.85, (0.3 + meThreat * 0.5 + grudge) * k)) {
        attacksOn[H.id] = (attacksOn[H.id] || 0) + 1;
        const overlap = Math.max(0, 1 - simDistP(R, H) / 6);
        state.glob[H.id] -= (0.015 + 0.035 * overlap) * k;
        if (!P.replies.includes(R.id)) P.replies.push(R.id);
        did.push("atac");
        moves.push({ id: R.id, kind: "attack", target: H.id, msg: H.id === "jo" ? `${R.name} carga contra ti: pierdes algo de apoyo.` : `${R.name} carga contra ${H.name}.`, why: "Competís por los mismos votantes" });
        simNews(state, { kind: "rival", icon: "⚔️", party: R.id, target: H.id, tone: H.id === "jo" ? "bad" : undefined, t: simNewsText("rivAtacJo", state, { sig: R.sig, me: H.sig }) });
      } else if (rnd() < 0.18 * k) {
        // Estirada entre rivals que es disputen el mateix electorat
        const T = state.rivals.filter((x) => x.id !== R.id && simDistP(x, R) < 3 && (!R.ccaa || !x.ccaa || x.ccaa.some((c) => R.ccaa.includes(c))))
          .sort((a, b) => share[b.id] - share[a.id])[0];
        if (T) {
          state.glob[T.id] -= 0.012 * k; state.glob[R.id] -= 0.004;
          did.push("atac");
          simNews(state, { kind: "rival", icon: "⚔️", party: R.id, target: T.id, t: simNewsText("rivAtac", state, { sig: R.sig, target: T.sig }) });
        }
      }
    }
    // 3. Una acció destacada segons l'estil i la situació
    if (did.length < n) {
      const play = simRivalPlay(state, R, D, H);
      if (play) moves.push({ id: R.id, kind: "play", ...play });
    }
  });
  return moves;
}

// Accions destacades dels rivals. Són genèriques i neutres: cap no els atribueix declaracions ni fets inventats.
// H: el jugador humà a qui pot reptar (el més proper)
function simRivalPlay(state, r, D, H = state.me) {
  const P = simPriv(state, H.id);
  const rnd = () => simRand(state, `jugada-${r.id}`);
  if (rnd() > 0.6) return null;
  const mine = SIM_PROVS.filter((p) => simStands(r, p));
  const biggest = [...mine].sort((a, b) => b.seats - a.seats)[0];
  const poll = state.polls[state.polls.length - 1];
  const close = poll && Math.abs((poll.est[r.id] || 0) - (poll.est[H.id] || 0)) < 4;
  const options = [
    { k: "repte", w: close && !P.used.challenged.includes(r.id) && !(P.challenges || []).length && state.day < state.days - 1 ? 3 : 0 },
    { k: "anunci", w: r.style === "big" || r.style === "mid" ? 2 : 0.5 },
    { k: "agenda", w: 1.8 },
    { k: "fitxatge", w: 0.8 },
    { k: "ruta", w: r.style === "own" || r.style === "mid" ? 1.5 : 0.4 },
  ].filter((o) => o.w > 0);
  let x = rnd() * options.reduce((t, o) => t + o.w, 0);
  const k = options.find((o) => (x -= o.w) < 0)?.k || "anunci";
  if (k === "repte") {
    P.used.challenged.push(r.id);
    P.challenges = P.challenges || [];
    P.challenges.push(r.id);
    simNews(state, { kind: "rival", icon: "🥊", party: r.id, target: H.id, t: simNewsText("rivRepte", state, { sig: r.sig, me: H.sig }) });
    return { icon: "⚔", target: H.id, msg: H.id === "jo" ? `${r.sig} te reta a un cara a cara en televisión. Lo encontrarás mañana en la agenda.` : `${r.sig} reta a ${H.sig} a un cara a cara en televisión.`, why: "Las encuestas del juego os sitúan cerca" };
  }
  if (k === "anunci") {
    state.glob[r.id] += 0.015 * D.rival;
    simNews(state, { kind: "rival", icon: "📺", party: r.id, t: simNewsText("rivAnuncis", state, { sig: r.sig }) });
    return { icon: "📺", msg: `${r.sig} lanza una campaña de anuncios en todo el Estado`, why: "Gana visibilidad en todas partes" };
  }
  if (k === "agenda") {
    // Empeny el seu tema estrella perquè sigui el tema del dia
    const th = r.iss.map((v, t) => ({ v, t })).sort((a, b) => b.v - a.v)[Math.floor(rnd() * 2)].t;
    state.push[th] += (r.style === "big" ? 0.8 : 0.5) * D.rival;
    r.iss[th] = Math.min(1.2, r.iss[th] + 0.04);
    simNews(state, { kind: "agenda", icon: SIM_THEMES[th].icon, party: r.id, theme: th, t: simNewsText("rivAgenda", state, { sig: r.sig, theme: SIM_THEMES[th].label.toLowerCase() }) });
    return { icon: "📄", msg: `${r.sig} centra la campaña en ${SIM_THEMES[th].label.toLowerCase()}`, why: "Quiere que sea el tema del día" };
  }
  if (k === "fitxatge") {
    const opts = mine.filter((q) => q.seats >= 4);
    const p = opts[Math.floor(rnd() * opts.length)] || biggest;
    state.camp[r.id][p.i] += 0.1 * D.rival;
    simNews(state, { kind: "rival", icon: "⭐", party: r.id, prov: p.i, t: simNewsText("rivFitxatge", state, { sig: r.sig, prov: p.name }) });
    return { icon: "★", msg: `${r.sig} presenta a un candidato conocido en ${p.name}`, why: "Un nombre conocido ayuda en la circunscripción", provs: [p.i] };
  }
  // Ruta pel territori: poc a cada lloc, però a moltes circumscripcions de la mateixa comunitat
  const ccaa = mine[Math.floor(rnd() * mine.length)].ccaa;
  const route = mine.filter((p) => p.ccaa === ccaa);
  route.forEach((p) => { state.camp[r.id][p.i] += 0.05 * D.rival; });
  simNews(state, { kind: "rival", icon: "🚌", party: r.id, t: simNewsText("rivRuta", state, { sig: r.sig, ccaa }) });
  return { icon: "🚌", msg: `${r.sig} hace una ruta por ${ccaa}`, why: "Llega a las circunscripciones pequeñas", provs: route.map((p) => p.i) };
}

// ---------- Investidura ----------
const SIM_ROLE_COST = { inv: 0, leg: 2, coal: 5 };

// Acord que proposa un candidat: comença per les seves mesures i va sumant suports, del partit més proper al més llunyà.
// exclude: partits que no compten (p. ex. el jugador, que decideix el seu vot per ell mateix i s'absté per defecte).
function simAiDeal(state, cand, exclude = []) {
  const C = simPartyById(state, cand);
  const deal = { cand, measures: simWants(C).map((m) => m.id), roles: {} };
  const ids = simSeated(state).filter((id) => id !== cand && !exclude.includes(id))
    .sort((a, b) => simDistP(simPartyById(state, a), C) - simDistP(simPartyById(state, b), C));
  const tally = (d) => simInvestiture(state, d, exclude.includes("jo") ? "abs" : null);
  let cur = tally(deal);
  for (let it = 0; it < 6 && !cur.first; it++) {
    let best = null;
    ids.forEach((id) => {
      if (cur.votes[id]?.v === "si") return;
      const P = simPartyById(state, id);
      const want = simWants(P).find((m) => !deal.measures.includes(m.id) && !simCandRejects(state, cand, m));
      ["inv", "leg", "coal"].forEach((role) => {
        if (role === "coal" && simDistP(P, C) > 5) return;
        [null, want].forEach((m, k) => {
          if (k === 1 && (!m || deal.measures.length >= 4)) return;
          const d = { cand, measures: m ? [...deal.measures, m.id] : deal.measures, roles: { ...deal.roles, [id]: role } };
          const r = tally(d);
          if (r.si <= cur.si) return;
          const gain = (r.si - cur.si) - (r.no - cur.no) * 0.5 - SIM_ROLE_COST[role] - (m ? 1 : 0);
          if (!best || gain > best.gain) best = { d, r, gain };
        });
      });
    });
    if (!best) break;
    deal.measures = best.d.measures;
    deal.roles = best.d.roles;
    cur = best.r;
  }
  return { deal, result: cur };
}

// Candidats possibles entre els rivals, del més al menys viable: primer qui pot guanyar, després més sís, després més escons
function simAiCandidates(state, exclude = []) {
  return simSeated(state).filter((id) => id !== "jo" && !exclude.includes(id)).map((id) => ({ id, ...simAiDeal(state, id, ["jo"]) }))
    .sort((a, b) => (b.result.pass - a.result.pass) || (b.result.si - a.result.si) || (state.res.seats[b.id] - state.res.seats[a.id]));
}

// Resposta d'un candidat rival a les demandes del jugador: req = { measures: [ids], role }
function simAiAnswer(state, aiDeal, req) {
  const cand = aiDeal.cand, C = simPartyById(state, cand);
  const withoutMe = simInvestiture(state, aiDeal, "abs");
  const withMe = simInvestiture(state, aiDeal, "si");
  const pivotal = (!withoutMe.first && withMe.first) || (!withoutMe.pass && withMe.pass);
  const partners = Object.keys(withMe.votes).filter((id) => id !== "jo" && id !== cand && withMe.votes[id].v === "si");
  const refused = [], measures = [];
  (req.measures || []).forEach((id) => {
    const m = simMeasure(id);
    if (aiDeal.measures.includes(id)) { measures.push(id); return; }
    if (simCandRejects(state, cand, m)) return refused.push({ id, why: `${C.name} no lo puede aceptar: va contra su programa.` });
    const breaker = partners.find((pid) => simIsRedLine(simPartyById(state, pid), m));
    if (breaker) return refused.push({ id, why: `Le haría perder el apoyo de ${simPartyById(state, breaker).name}.` });
    if (!pivotal && measures.filter((x) => !aiDeal.measures.includes(x)).length >= 1) return refused.push({ id, why: "No necesita lo suficiente tus votos para aceptar más de una." });
    measures.push(id);
  });
  const d = simDistP(C, state.me);
  let role = req.role || null, roleWhy = null;
  if (role === "coal" && !(d <= 4.5 || (pivotal && d <= 6.5))) { roleWhy = pivotal ? "Estáis demasiado lejos para gobernar juntos." : "No necesita tanto tus votos como para ofrecerte ministerios."; role = d <= 7 || pivotal ? "leg" : "inv"; }
  if (role === "leg" && !(d <= 7 || pivotal)) { roleWhy = roleWhy || "Prefiere no atarse con un acuerdo estable."; role = "inv"; }
  const deal = { cand, measures: [...new Set([...aiDeal.measures, ...measures])], roles: { ...aiDeal.roles, ...(role ? { jo: role } : {}) } };
  return { deal, measures, refused, role, roleWhy, pivotal, without: withoutMe };
}

// ---------- Legislatura: què fa un Govern que no és el del jugador ----------
// Tria l'opció d'una decisió més propera al president
function simAiPick(state, card) {
  const pm = simPartyById(state, state.leg.gov.pm);
  let best = 0, bestV = -Infinity;
  card.opts.forEach((o, k) => { const v = o.pos ? simMeasureView(pm, o.pos) : 0; if (v > bestV) { bestV = v; best = k; } });
  return best;
}

// Iniciativa que porta el Govern al Congrés aquest trimestre
function simLegBill(state) {
  const L = state.leg;
  const kind = SIM_LEG_PLAN[L.q % SIM_LEG_PLAN.length];
  const pm = simPartyById(state, L.gov.pm);
  let proposer = pm, th;
  if (kind === "soci") {
    // Un soci del Govern (o el partit que l'ha investit) porta la seva proposta estrella
    const allies = Object.keys(L.sup).filter((id) => id !== L.gov.pm && (L.gov.parties.includes(id) || L.gov.support[id]))
      .sort((a, b) => (state.res.seats[b] || 0) - (state.res.seats[a] || 0));
    proposer = simPartyById(state, allies[0] || L.gov.pm);
    const m = simWants(proposer)[0];
    return { kind, th: m.th, ax: m.ax, p: m.p, by: proposer.id, title: `Propuesta de ${proposer.sig}: ${m.t.charAt(0).toLowerCase()}${m.t.slice(1)}` };
  }
  if (kind === "pressupostos") th = 1;
  else if (kind === "organica") th = [3, 4, 6, 7].sort((a, b) => pm.iss[b] - pm.iss[a])[(L.q >> 2) % 2];
  else {
    const prio = pm.iss.map((v, k) => ({ v, k })).sort((a, b) => b.v - a.v).map((x) => x.k);
    th = prio[(L.q + (kind === "decret" ? 1 : 0)) % 3];
  }
  const ax = SIM_MEASURES.find((m) => m.th === th).ax;
  const p = Math.round(pm[ax] * 10) / 10;
  return { kind, th, ax, p, by: pm.id, title: SIM_BILL_NAMES[kind](th) };
}

const SIM_BILL_NAMES = {
  pressupostos: () => "Presupuestos Generales del Estado",
  decret: (th) => `Decreto ley ${["de vivienda", "de medidas fiscales", "de pensiones", "de financiación territorial", "de inmigración", "de energía", "de sanidad", "de seguridad"][th]}`,
  llei: (th) => `Ley ${["de vivienda", "de reforma fiscal", "de pensiones", "de financiación autonómica", "de inmigración", "del cambio climático", "de educación y sanidad", "de seguridad y justicia"][th]}`,
  organica: (th) => ({ 3: "Reforma de un Estatuto de autonomía", 4: "Ley Orgánica de Extranjería", 6: "Ley Orgánica de Educación", 7: "Ley Orgánica de Seguridad Ciudadana" })[th] || "Ley orgánica",
};
