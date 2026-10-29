// Simulador del 29N · Partida contra amics (de 2 a 4 jugadors). No toca el DOM: es pot provar amb Node.
// Només hi ha els partits dels jugadors: tot l'electorat tria entre ells i els 350 escons es reparteixen entre ells.
//
// El «món» és l'estat compartit de la partida. Cada jugador humà hi té un identificador (h0, h1…) i les seves dades
// pròpies (diners, energia, caravana, notorietat…) a W.hum[id]. Per jugar, cada jugador fa servir una «vista» del món
// (simMpView): un estat normal del simulador on ell és «jo» i els altres jugadors són rivals. Així, tot el motor i
// totes les pantalles funcionen igual que a la partida individual.
//
// Torns simultanis: el dia d comença amb el mateix món per a tothom. Cada jugador fa les seves accions sobre la seva
// vista; en acabar, la vista es torna a convertir en món (simMpUnview) i es puja. Quan tothom ha acabat, el dia es tanca
// (simMpEndDay): es fusionen els canvis de tots (simMpMerge), juguen els rivals, es publica l'enquesta i comença el dia
// següent. Tot és determinista: qualsevol jugador pot tancar el dia i tothom obté el mateix món.

// Dades de cada jugador (a l'arrel de l'estat a la vista; a W.hum[id] al món)
const SIM_MP_PRIV = ["me", "money", "cred", "moral", "media", "energy", "awG", "aw", "mob", "seg", "used", "offers", "challenges", "replies", "grudge",
  "slot", "loc", "route", "log", "stage", "pendingEvent", "lastMoves", "goal", "lessons", "finished", "closeCalls"];
const SIM_MP_MAX = 4;
const simMpClone = (x) => JSON.parse(JSON.stringify(x));

// Canvia un identificador per un altre a tot l'estat (claus i valors): «jo» ↔ h0…
function simMpRename(x, from, to) {
  if (Array.isArray(x)) return x.map((v) => simMpRename(v, from, to));
  if (x && typeof x === "object") {
    const o = {};
    Object.keys(x).forEach((k) => { o[k === from ? to : k] = simMpRename(x[k], from, to); });
    return o;
  }
  return x === from ? to : x;
}

// Partida nova. players: [{ party, name }] en l'ordre de la sala (el primer és h0).
function simMpNew({ seed, diff = "normal", players }) {
  const ids = players.map((_, k) => `h${k}`);
  const D = SIM_DIFF[diff] || SIM_DIFF.normal;
  // Cada jugador surt d'una partida individual amb el seu partit i la mateixa llavor
  const solo = players.map((p) => simNewGame({ seed, mode: "amics", diff, party: p.party }));
  const W = solo[0];
  W.hum = {};
  ids.forEach((id, k) => {
    const S = solo[k];
    const P = {};
    SIM_MP_PRIV.forEach((key) => { if (S[key] !== undefined) P[key] = S[key]; });
    P.me = { ...S.me, id, player: players[k].name || "" };
    P.offers = [];
    W.hum[id] = P;
    W.camp[id] = SIM_PROVS.map(() => 0);
    W.glob[id] = 0;
    W.mom[id] = 0;
    const rng = simMulberry(simHash(`${W.seed}|noise|${id}`));
    W.noise[id] = SIM_PROVS.map(() => simGauss(rng) * D.noise);
  });
  SIM_MP_PRIV.forEach((key) => { delete W[key]; });
  // Sense els partits reals: només competeixen els partits dels jugadors
  W.rivals = [];
  ["camp", "glob", "mom", "noise"].forEach((k) => { Object.keys(W[k]).forEach((id) => { if (!ids.includes(id)) delete W[k][id]; }); });
  W.house = simHouseEffects(W.seed, ids);
  W.mp = { ids, names: players.map((p) => p.name || ""), done: false };
  W.mode = "amics";
  W.round = 1;
  // El primer dia: enquesta de sortida, tema del dia i propostes de mitjans per a cadascú
  simMpWith(W, ids[0], (V) => simKickoff(V));
  ids.forEach((id) => {
    simMpWith(W, id, (V) => { V.stage = "campaign"; V.goal = Math.max(3, Math.round(simPotential(V) * 0.85)); simDayOffers(V); });
  });
  return W;
}

// La vista d'un jugador: ell és «jo»; els altres jugadors, rivals amb les seves dades a state.hum
function simMpView(W, id) {
  const V = simMpClone(W);
  const P = V.hum[id];
  delete V.hum[id];
  SIM_MP_PRIV.forEach((key) => { if (P[key] !== undefined) V[key] = P[key]; });
  V.rivals = [...V.rivals, ...V.mp.ids.filter((x) => x !== id).map((x) => V.hum[x].me)];
  // Les enquestes internes dels altres no es veuen; de les publicades, el detall propi
  V.polls = V.polls.filter((p) => !(p.internal && p.owner && p.owner !== id));
  V.polls.forEach((p) => { if (p.pv) p.provs = p.pv[id]; });
  const R = simMpRename(V, id, "jo");
  R.mp.me = id;
  return R;
}

// De la vista al món
function simMpUnview(V, id) {
  const W = simMpRename(simMpClone(V), "jo", id);
  const P = {};
  SIM_MP_PRIV.forEach((key) => { if (W[key] !== undefined) { P[key] = W[key]; delete W[key]; } });
  W.rivals = W.rivals.filter((r) => !W.mp.ids.includes(r.id));
  W.hum[id] = P;
  W.polls.forEach((p) => {
    if (p.internal && !p.owner) p.owner = id;
    if (!p.internal) delete p.provs;
  });
  delete W.mp.me;
  return W;
}

// Fa alguna cosa des de la vista d'un jugador i ho torna al món
function simMpWith(W, id, fn) {
  const V = simMpView(W, id);
  const out = fn(V);
  const N = simMpUnview(V, id);
  Object.keys(W).forEach((k) => { delete W[k]; });
  Object.assign(W, N);
  return out;
}

// ---------- Fusió dels canvis de tots els jugadors ----------
// base: el món al principi del dia; worlds: el món de cada jugador en acabar (en l'ordre de la sala).
// Si només un jugador ha canviat una dada, es queda el seu valor. Si n'hi ha més d'un: els números se sumen (efectes de
// campanya, temes empesos…), les llistes conserven els elements de tots i els textos es queden amb l'últim canvi.
const simMpEq = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const simMpKey = (x) => JSON.stringify(x && typeof x === "object" && !Array.isArray(x) ? { ...x, provs: 0, range: 0, pv: 0 } : x);
function simMpMergeVal(b, vals) {
  const changed = vals.filter((v) => !simMpEq(v, b));
  if (!changed.length) return b;
  if (changed.length === 1) return changed[0];
  if (typeof b === "number" && changed.every((v) => typeof v === "number")) return b + changed.reduce((t, v) => t + (v - b), 0);
  if (b === undefined && changed.every((v) => typeof v === "number")) return changed.reduce((t, v) => t + v, 0);
  const arrs = changed.every(Array.isArray);
  if (arrs && (Array.isArray(b) || b === undefined)) {
    const base = b || [];
    // Llistes de números de la mateixa mida (efecte a cada circumscripció…): element a element
    if (base.length && base.every((v) => typeof v === "number") && changed.every((v) => v.length === base.length)) {
      return base.map((v, i) => simMpMergeVal(v, changed.map((c) => c[i])));
    }
    // Altres llistes: es queden els elements que no ha tret ningú i s'hi afegeixen els nous de cadascú
    const keyed = (a) => a.map(simMpKey);
    const kept = base.filter((x, i) => changed.every((c) => keyed(c).includes(simMpKey(base[i]))));
    const out = kept.map((x) => { const k = simMpKey(x); return simMpMergeVal(x, changed.map((c) => c[keyed(c).indexOf(k)])); });
    const seen = new Set(base.map(simMpKey));
    changed.forEach((c) => c.forEach((x) => { const k = simMpKey(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }));
    return out;
  }
  const objs = changed.every((v) => v && typeof v === "object" && !Array.isArray(v));
  if (objs && (b === undefined || (b && typeof b === "object"))) {
    const base = b || {};
    const keys = new Set([...Object.keys(base), ...changed.flatMap((v) => Object.keys(v))]);
    const o = {};
    keys.forEach((k) => {
      // Una clau que algú ha esborrat (i ningú no ha canviat) desapareix
      if (k in base && changed.some((v) => !(k in v)) && changed.every((v) => !(k in v) || simMpEq(v[k], base[k]))) return;
      const v = simMpMergeVal(base[k], changed.map((c) => (k in c ? c[k] : base[k])));
      if (v !== undefined) o[k] = v;
    });
    return o;
  }
  return changed[changed.length - 1];
}
function simMpMerge(base, worlds) {
  const W = simMpMergeVal(base, worlds);
  if (W.news?.length > 90) W.news.splice(0, W.news.length - 90);
  return W;
}

// ---------- Fi del dia per a tothom ----------
// Mateixos passos que simEndDay (sim-engine.js), però amb diversos jugadors humans
function simMpEndDay(base, worlds) {
  const W = simMpMerge(base, worlds);
  const ids = W.mp.ids;
  // Els rivals juguen (veuen tots els jugadors; la vista del primer és només una manera de calcular-ho)
  const moves = simMpWith(W, ids[0], (V) => simRivalsTurn(V));
  const renamed = simMpRename(moves, "jo", ids[0]);
  // La nit: els efectes de campanya es dilueixen
  Object.keys(W.camp).forEach((id) => { W.camp[id] = W.camp[id].map((v) => v * SIM_K.decay); W.glob[id] *= SIM_K.decay; });
  ids.forEach((id) => {
    const P = W.hum[id];
    Object.keys(P.seg).forEach((k) => { P.seg[k] *= 0.94; });
    P.mob = P.mob.map((v) => v * 0.88);
    P.energy = Math.min(SIM_ENERGY.max, P.energy + SIM_ENERGY.night);
    P.slot = 0;
    P.route = [P.loc];
    P.money += 6 + (P.moral >= 70 ? 2 : 0);
  });
  const dayDone = W.day;
  W.day++;
  let poll = null;
  if (W.day > W.days) {
    W.phase = "reflection";
    simMpWith(W, ids[0], (V) => simNews(V, { kind: "reflexio", icon: "🤫", t: simNewsText("reflexio", V) }));
  } else {
    simMpWith(W, ids[0], (V) => {
      simNextAgenda(V);
      if (!simPollsBanned(V)) poll = simPublishPoll(V);
      else {
        Object.keys(V.mom).forEach((id) => { V.mom[id] *= 0.7; });
        if (V.day === simBanDay(V)) simNews(V, { kind: "veda", icon: "🚫", t: simNewsText("veda", V) });
      }
    });
    ids.forEach((id) => simMpWith(W, id, (V) => simDayOffers(V)));
  }
  // La nit que acaba de passar: el que han fet els rivals (cada jugador ho veu des del seu partit)
  W.mp.night = { day: dayDone, moves: renamed };
  ids.forEach((id) => { W.hum[id].lastMoves = renamed.map((m) => ({ id: m.id, kind: m.kind, provs: m.provs || [] })); });
  return W;
}

// Moviments de la nit, vistos des d'un jugador (els atacs i els reptes diuen «tu» només a qui toca)
function simMpMoves(W, id) {
  const name = (x) => (W.hum[x] ? W.hum[x].me.name : W.rivals.find((r) => r.id === x)?.name || x);
  const sig = (x) => (W.hum[x] ? W.hum[x].me.sig : W.rivals.find((r) => r.id === x)?.sig || x);
  return (W.mp.night?.moves || []).map((m) => {
    let msg = m.msg;
    if (m.kind === "attack") msg = m.target === id ? `${name(m.id)} carga contra ti: pierdes algo de apoyo.` : `${name(m.id)} carga contra ${name(m.target)}.`;
    if (m.kind === "play" && m.target && m.icon === "⚔") msg = m.target === id ? `${sig(m.id)} te reta a un cara a cara en televisión. Lo encontrarás mañana en la agenda.` : `${sig(m.id)} reta a ${sig(m.target)} a un cara a cara en televisión.`;
    return simMpRename({ ...m, msg }, id, "jo");
  });
}

// Classificació final entre els jugadors (escons, vots i objectiu de cadascú)
function simMpStandings(W, r) {
  return W.mp.ids.map((id, k) => {
    const t = r.totals[id];
    return { id, name: W.mp.names[k], sig: W.hum[id].me.sig, party: W.hum[id].me.name, color: W.hum[id].me.color, seats: t.seats, share: t.share, votes: t.votes, goal: W.hum[id].goal };
  }).sort((a, b) => b.seats - a.seats || b.votes - a.votes);
}

// Resultat oficial de les eleccions, vist des d'un jugador. Sempre es calcula des de la vista del primer jugador perquè
// tothom tingui exactament els mateixos números (l'ordre de les sumes pot canviar algun decimal).
function simMpElection(W, id) {
  const r = simMpRename(simElection(simMpView(W, W.mp.ids[0])), "jo", W.mp.ids[0]);
  return simMpRename(r, id, "jo");
}

// Resultat de les eleccions d'una partida: contra amics, l'oficial (simMpElection); si no, el de sempre
function simResultOf(s) {
  return s.mp?.me ? simMpElection(simMpUnview(s, s.mp.me), s.mp.me) : simElection(s);
}

// ---------- Després de les eleccions: pactes entre els jugadors i investidura ----------
// A la sala, neg: { pacts: { id: Pacte }, vote: Votació | null, attempts: [Resultat], result: Resultat | null }
// Pacte: { id, from, to, cand, kind, measures: [ids], mins, status: "pendent" | "ok" | "no", ts } (from, to i cand: h0…)
//   kind: coal (govern de coalició: entra al govern del candidat), inv (vota sí a la investidura), abs (s'absté)
// Votació: { cand, measures (les que el candidat hi afegeix), n (intent), votes: { h0: "si" | "no" | "abs" } }
const SIM_MP_PACT = {
  coal: { label: "Gobierno de coalición", vote: "si", text: "entra en el Gobierno con ministerios y vota sí a la investidura" },
  inv: { label: "Apoyo a la investidura", vote: "si", text: "vota sí a la investidura" },
  abs: { label: "Abstención", vote: "abs", text: "se abstiene en la investidura" },
};
const SIM_MP_TRIES = 3; // tres intents d'investidura (els dos mesos de l'article 99.5) i, si no, repetició electoral
const simMpNegInit = () => ({ pacts: {}, vote: null, attempts: [], result: null });
const simMpPacts = (neg) => Object.values(neg?.pacts || {}).sort((a, b) => a.ts - b.ts);
// El soci d'un pacte (qui no és el candidat)
const simMpPartner = (p) => (p.from === p.cand ? p.to : p.from);
// L'acord amb què es presenta un candidat: les mesures i els papers dels pactes acceptats, més les que hi afegeix
// roles: els suports que el candidat ja porta d'altres partits (la màquina: vegeu simMpAiPlan)
function simMpDeal(neg, cand, extra = [], aiRoles = {}) {
  const ok = simMpPacts(neg).filter((p) => p.status === "ok" && p.cand === cand);
  const measures = [...new Set([...ok.flatMap((p) => p.measures || []), ...extra])];
  const roles = { ...aiRoles };
  ok.forEach((p) => { if (p.kind !== "abs") roles[simMpPartner(p)] = p.kind === "coal" ? "coal" : "inv"; });
  return { cand, measures, roles };
}
// Vot compromès d'un jugador en la investidura d'un candidat (si té un pacte acceptat amb ell)
function simMpBound(neg, hid, cand) {
  if (hid === cand) return "si";
  const p = simMpPacts(neg).find((x) => x.status === "ok" && x.cand === cand && simMpPartner(x) === hid);
  return p ? SIM_MP_PACT[p.kind].vote : null;
}
// El Congrés vist des del primer jugador (la mateixa referència per a tothom)
function simMpCongress(W) {
  const V = simMpView(W, W.mp.ids[0]);
  simStoreResult(V, simElection(V));
  return V;
}
// Vot d'un partit (de la màquina) a la investidura amb un acord (ids del món)
function simMpPartyVote(W, pid, deal, V0 = simMpCongress(W)) {
  const h0 = W.mp.ids[0];
  const to = (x) => (x === h0 ? "jo" : x);
  const d = { cand: to(deal.cand), measures: deal.measures, roles: Object.fromEntries(Object.entries(deal.roles).map(([k, v]) => [to(k), v])) };
  return simPartyVote(V0, to(pid), d);
}
// Recompte d'una votació d'investidura. humanVotes: { h0: "si" | "no" | "abs" }
function simMpTally(W, deal, humanVotes, V0 = simMpCongress(W)) {
  const h0 = W.mp.ids[0];
  const from = (x) => (x === "jo" ? h0 : x);
  const votes = {};
  let si = 0, no = 0, abs = 0;
  simSeated(V0).forEach((vid) => {
    const id = from(vid), n = V0.res.seats[vid];
    const r = W.hum[id] ? { v: humanVotes[id] || "abs", why: "Voto del jugador.", human: true } : simMpPartyVote(W, id, deal, V0);
    votes[id] = { v: r.v, why: r.why, human: !!r.human, n };
    if (r.v === "si") si += n; else if (r.v === "no") no += n; else abs += n;
  });
  const first = si >= SIM_MAJ, second = si > no;
  return { cand: deal.cand, votes, si, no, abs, first, second, pass: first || second };
}
// El paper de cada jugador amb el govern que ha sortit (per a la pantalla final)
function simMpRole(neg, hid) {
  const R = neg?.result;
  if (!R) return null;
  if (!R.pass) return "rep";
  if (R.cand === hid) return "pm";
  const role = R.deal.roles[hid];
  return role === "coal" ? "coal" : role ? "inv" : "opp";
}
// Tanca una votació d'investidura quan ja han votat tots els jugadors sense pacte. Torna null si encara falten vots, o
// { patch, msg }: el canvi per a la sala (neg.*) i el missatge per al xat general.
function simMpVoteClose(W, neg) {
  const v = neg?.vote;
  if (!v) return null;
  if (simMpVoteWaiting(W, neg).length) return null;
  const deal = simMpDeal(neg, v.cand, v.measures || [], v.roles || {});
  const humanVotes = Object.fromEntries(W.mp.ids.map((h) => [h, simMpBound(neg, h, v.cand) || v.votes[h] || "abs"]));
  const t = simMpTally(W, deal, humanVotes);
  const at = { cand: v.cand, si: t.si, no: t.no, abs: t.abs, first: t.first, pass: t.pass, n: v.n };
  const last = !t.pass && v.n >= SIM_MP_TRIES;
  const result = t.pass ? { pass: true, cand: v.cand, deal, votes: t.votes, first: t.first, ts: Date.now() } : last ? { pass: false, ts: Date.now() } : null;
  const C = simMpRef(W, v.cand);
  const msg = t.pass ? `Investidura superada: ${C.sig} tiene ${t.si} síes${t.first ? " en la primera votación" : " en la segunda votación"}.` : `La investidura de ${C.sig} no ha salido (sí ${t.si}, no ${t.no}, abstención ${t.abs}).${last ? " Se repiten las elecciones." : ""}`;
  return { patch: { "neg.vote": null, "neg.attempts": [...(neg.attempts || []), at], ...(result ? { "neg.result": result } : {}) }, msg };
}
// Jugadors que encara han de votar: tenen escons, no són el candidat i no tenen cap pacte que els fixi el vot
function simMpVoteWaiting(W, neg, V0 = simMpCongress(W)) {
  const v = neg?.vote;
  if (!v) return [];
  const h0 = W.mp.ids[0];
  return W.mp.ids.filter((h) => h !== v.cand && !simMpBound(neg, h, v.cand) && (V0.res.seats[h === h0 ? "jo" : h] || 0) > 0 && !v.votes?.[h]);
}

// Un partit qualsevol del món (jugador o de la màquina)
const simMpRef = (W, id) => W.hum[id]?.me || W.rivals.find((r) => r.id === id);

// Ronda de consultes: el partit de la màquina amb més suports possibles (simAiDeal) que encara no ho ha provat intenta la
// investidura, i ofereix pactes als jugadors que li poden fer falta. Si cap no arriba a SIM_MP_AI_MIN sís, no se'n
// proposa cap (torna { cand: null }): si cap jugador no s'hi presenta, es repeteixen les eleccions.
const SIM_MP_AI_MIN = 150;
function simMpAiPlan(W, neg, now = Date.now()) {
  const V0 = simMpCongress(W);
  const h0 = W.mp.ids[0];
  const toW = (id) => (id === "jo" ? h0 : id);
  const humansV = ["jo", ...W.mp.ids.slice(1)];
  const tried = (neg.attempts || []).map((a) => a.cand);
  const n0 = (neg.attempts || []).length + 1;
  const best = simSeated(V0).filter((id) => !humansV.includes(id) && !tried.includes(id) && V0.res.seats[id] >= 10)
    .map((id) => ({ id, ...simAiDeal(V0, id, humansV) }))
    .sort((a, b) => b.result.si - a.result.si || V0.res.seats[b.id] - V0.res.seats[a.id])[0];
  if (!best || best.result.si < SIM_MP_AI_MIN) return { n: n0, cand: null, pacts: {}, at: now };
  const { id: cand, deal, result } = best;
  const C = simPartyById(V0, cand);
  const n = (neg.attempts || []).length + 1;
  // Pactes que ofereix als jugadors amb escons, del més proper al més llunyà (com a molt tres)
  const pacts = {};
  W.mp.ids.map((h) => ({ h, P: W.hum[h].me, seats: V0.res.seats[h === h0 ? "jo" : h] || 0 }))
    .filter((x) => x.seats > 0 && simDistP(C, x.P) < 6.5)
    .sort((a, b) => simDistP(C, a.P) - simDistP(C, b.P)).slice(0, 3)
    .forEach((x, k) => {
      const want = simWants(x.P).find((m) => !simCandRejects(V0, cand, m));
      const id = `ai${n}${cand}${k}`;
      pacts[id] = { id, from: cand, to: x.h, cand, kind: simDistP(C, x.P) < 2.5 ? "coal" : "inv", measures: want ? [want.id] : [], mins: simDistP(C, x.P) < 2.5 ? 1 : 0, status: "pendent", ts: now + k };
    });
  const roles = Object.fromEntries(Object.entries(deal.roles || {}).map(([k, v]) => [toW(k), v]));
  return { n, cand, seats: V0.res.seats[cand], measures: deal.measures || [], roles, si: result.si, pacts, at: now };
}
