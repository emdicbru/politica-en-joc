// Simulador del 29N · Intel·ligència dels partits rivals. Regles senzilles i explicables, sense accés al DOM.
// Campanya: on fa actes cada rival i per què. Investidura: quin acord proposa un candidat i què accepta del jugador.

// ---------- Campanya ----------
const SIM_STYLE_WHY = {
  big: "donde se reparten más escaños",
  urban: "en las ciudades grandes, donde tiene su electorado",
  mid: "en las circunscripciones medianas y rurales",
  own: "en los territorios con identidad propia",
};

function simRivalsTurn(state) {
  const D = SIM_DIFF[state.diff] || SIM_DIFF.normal;
  const moves = [];
  // On ha fet míting el jugador avui: el rival més proper ideològicament hi respon
  const myRallies = state.log.filter((l) => l.day === state.day && l.type === "miting").map((l) => l.arg);
  const closest = [...state.rivals].sort((a, b) => simDistP(a, state.me) - simDistP(b, state.me))[0];
  state.rivals.forEach((r) => {
    // Regla 1: tria 2 circumscripcions segons el seu estil, amb una mica d'atzar
    let cands = SIM_PROVS.filter((p) => simStands(r, p)).map((p) => {
      let score = r.style === "big" ? p.seats : r.style === "urban" ? p.seats * p.urb : r.style === "mid" ? Math.min(p.seats, 8) * (1 - p.urb + 0.5) : p.seats * p.ter;
      score *= 0.6 + simRand(state, `riv-${r.id}`) * 0.8;
      return { p, score, why: SIM_STYLE_WHY[r.style] };
    }).sort((a, b) => b.score - a.score).slice(0, 2);
    // Regla 2: el rival que competeix pels teus votants respon on has fet míting
    const answer = r === closest ? myRallies.find((i) => simStands(r, SIM_PROVS[i]) && !cands.some((c) => c.p.i === i)) : undefined;
    if (answer !== undefined) cands = [cands[0], { p: SIM_PROVS[answer], why: "para responder a tu mitin" }];
    cands.forEach(({ p }) => { state.camp[r.id][p.i] += 0.08 * D.rival; });
    // Regla 3: si el jugador creix, el rival que competeix pels mateixos votants li disputa el suport
    if (simDistP(r, state.me) < 3.5 && state.glob.jo > 0.15 && simRand(state, `atac-${r.id}`) < 0.35 * D.rival) {
      state.glob.jo -= 0.04;
      moves.push({ id: r.id, kind: "attack", msg: `${r.name} se dirige a los mismos votantes que tú: pierdes un poco de apoyo.` });
    }
    moves.push({ id: r.id, kind: "camp", msg: `${r.name} hace campaña en ${cands.map((c) => c.p.name).join(" i ")}`, why: cands.map((c) => c.why), provs: cands.map((c) => c.p.i) });
    // Regla 4: una acció destacada del dia, segons l'estil del partit i la situació
    const play = simRivalPlay(state, r, D);
    if (play) moves.push({ id: r.id, kind: "play", ...play });
  });
  return moves;
}

// Accions destacades dels rivals. Són genèriques i neutres: cap no els atribueix declaracions ni fets inventats.
function simRivalPlay(state, r, D) {
  const rnd = () => simRand(state, `jugada-${r.id}`);
  if (rnd() > 0.5) return null;
  const mine = SIM_PROVS.filter((p) => simStands(r, p));
  const biggest = [...mine].sort((a, b) => b.seats - a.seats)[0];
  const poll = state.polls[state.polls.length - 1];
  const close = poll && Math.abs((poll.est[r.id] || 0) - (poll.est.jo || 0)) < 4;
  state.used.challenged = state.used.challenged || [];
  const options = [
    { k: "repte", w: close && !state.used.challenged.includes(r.id) && !(state.challenges || []).length && state.day < state.days - 1 ? 3 : 0 },
    { k: "anunci", w: r.style === "big" || r.style === "mid" ? 2 : 0.5 },
    { k: "macro", w: 1.5 },
    { k: "proposta", w: 1.5 },
    { k: "fitxatge", w: 1 },
    { k: "ruta", w: r.style === "own" || r.style === "mid" ? 1.5 : 0.4 },
  ].filter((o) => o.w > 0);
  let x = rnd() * options.reduce((t, o) => t + o.w, 0);
  const k = options.find((o) => (x -= o.w) < 0)?.k || "macro";
  if (k === "repte") {
    state.used.challenged.push(r.id);
    state.challenges = state.challenges || [];
    state.challenges.push(r.id);
    return { icon: "⚔", msg: `${r.sig} te reta a un cara a cara en televisión. Lo encontrarás mañana en la agenda.`, why: "Las encuestas del juego os sitúan cerca" };
  }
  if (k === "anunci") { state.glob[r.id] += 0.015 * D.rival; return { icon: "📺", msg: `${r.sig} lanza una campaña de anuncios en todo el Estado`, why: "Gana visibilidad en todas partes" }; }
  if (k === "macro") { state.camp[r.id][biggest.i] += 0.12 * D.rival; return { icon: "🏟", msg: `${r.sig} hace un gran mitin en ${biggest.name}`, why: "Concentra fuerzas donde se reparten más escaños", provs: [biggest.i] }; }
  if (k === "proposta") {
    const th = r.iss.map((v, t) => ({ v, t })).sort((a, b) => b.v - a.v)[Math.floor(rnd() * 2)].t;
    r.iss[th] = Math.min(1.2, r.iss[th] + 0.05);
    state.glob[r.id] += 0.01 * D.rival;
    return { icon: "📄", msg: `${r.sig} presenta nuevas propuestas de ${SIM_THEMES[th].label.toLowerCase()}`, why: "Refuerza uno de sus temas estrella" };
  }
  if (k === "fitxatge") {
    const p = mine.filter((q) => q.seats >= 4)[Math.floor(rnd() * mine.filter((q) => q.seats >= 4).length)] || biggest;
    state.camp[r.id][p.i] += 0.1 * D.rival;
    return { icon: "★", msg: `${r.sig} presenta a un candidato conocido en ${p.name}`, why: "Un nombre conocido ayuda en la circunscripción", provs: [p.i] };
  }
  // Ruta pel territori: poc a cada lloc, però a moltes circumscripcions de la mateixa comunitat
  const ccaa = mine[Math.floor(rnd() * mine.length)].ccaa;
  const route = mine.filter((p) => p.ccaa === ccaa);
  route.forEach((p) => { state.camp[r.id][p.i] += 0.05 * D.rival; });
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
