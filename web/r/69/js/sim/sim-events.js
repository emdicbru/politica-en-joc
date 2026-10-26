// Simulador del 29N · Continguts: dilemes per definir el partit, preguntes de debat i esdeveniments de campanya.
// Tot és ficció genèrica: cap esdeveniment depèn d'un fet o d'una persona reals.

// ---------- Dilemes de programa (defineixen la ideologia) ----------
// Cada opció mou els eixos: eco (0 més Estat · 10 més mercat), ter (0 centralisme · 10 sobiranisme), val (0 progressista · 10 conservador)
const SIM_DILEMMAS = [
  { q: "Impostos", a: [{ t: "Pujar-los a les rendes altes per finançar més serveis públics", d: { eco: -1.3 } }, { t: "Abaixar-los perquè l'economia creixi i es creï ocupació", d: { eco: 1.3 } }] },
  { q: "Habitatge", a: [{ t: "Limitar el preu dels lloguers i construir habitatge públic", d: { eco: -1.1 } }, { t: "Alliberar sòl i reduir tràmits perquè es construeixi més", d: { eco: 1.1 } }] },
  { q: "Model territorial", a: [{ t: "Més autogovern i reconeixement de les nacions de l'Estat", d: { ter: 1.6 } }, { t: "Un Estat més unit, amb menys diferències entre territoris", d: { ter: -1.6 } }] },
  { q: "Dret a decidir", a: [{ t: "Acceptar un referèndum pactat si un territori el reclama", d: { ter: 1.4 } }, { t: "Cap votació que posi en qüestió la unitat de l'Estat", d: { ter: -1.4 } }] },
  { q: "Immigració", a: [{ t: "Vies legals d'arribada i regularitzar qui ja viu aquí", d: { val: -1.1 } }, { t: "Més control de fronteres i més expulsions", d: { val: 1.3 } }] },
  { q: "Drets i valors", a: [{ t: "Ampliar drets socials i garantir la igualtat i la diversitat", d: { val: -1.3 } }, { t: "Protegir la família tradicional i els valors de sempre", d: { val: 1.3 } }] },
  { q: "Clima i energia", a: [{ t: "Accelerar la transició energètica encara que costi diners", d: { eco: -0.6, val: -0.5 } }, { t: "Una transició gradual que no encareixi la factura", d: { eco: 0.6, val: 0.4 } }] },
  { q: "Seguretat", a: [{ t: "Prevenció, educació i reinserció", d: { val: -0.9 } }, { t: "Penes més dures i més policia al carrer", d: { val: 1.1 } }] },
];

// ---------- Preguntes de debat: tres respostes amb una posició ideològica ----------
const SIM_DEBATE_QS = [
  { q: "Com fareu baixar el preu del lloguer?", th: 0, a: [
    { t: "Amb topalls al preu i un gran parc públic.", p: { eco: 2, ter: 5, val: 3 } },
    { t: "Amb col·laboració publicoprivada i ajuts als joves.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Alliberant sòl i abaixant impostos a la construcció.", p: { eco: 8.5, ter: 3, val: 6 } }] },
  { q: "Les pensions són sostenibles?", th: 2, a: [
    { t: "Sí, si els ingressos pugen amb més cotitzacions de les rendes altes.", p: { eco: 2.5, ter: 4, val: 4 } },
    { t: "Sí, amb un pacte entre partits i reformes graduals.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Només si complementem el sistema amb plans privats.", p: { eco: 8, ter: 3, val: 6 } }] },
  { q: "Quin model territorial defenseu?", th: 3, a: [
    { t: "El dret a decidir dels pobles que ho demanin.", p: { eco: 4.5, ter: 9, val: 4 } },
    { t: "Un Estat federal amb més autogovern.", p: { eco: 4, ter: 6, val: 4 } },
    { t: "Un Estat fort i unit, amb menys competències autonòmiques.", p: { eco: 6.5, ter: 1, val: 7 } }] },
  { q: "Què cal fer amb la immigració?", th: 4, a: [
    { t: "Regularitzar i garantir drets a tothom qui treballa aquí.", p: { eco: 3, ter: 5, val: 2 } },
    { t: "Vies legals vinculades al mercat de treball.", p: { eco: 5.5, ter: 4, val: 5 } },
    { t: "Control estricte de fronteres i expulsions.", p: { eco: 7, ter: 1, val: 9 } }] },
  { q: "Com encarareu el canvi climàtic?", th: 5, a: [
    { t: "Transició ràpida cap a les renovables, amb inversió pública.", p: { eco: 3, ter: 5, val: 2.5 } },
    { t: "Transició gradual que no perjudiqui la indústria.", p: { eco: 6, ter: 4, val: 5 } },
    { t: "Sense imposicions que encareixin la vida.", p: { eco: 8, ter: 2.5, val: 7.5 } }] },
  { q: "Què proposeu per a la sanitat pública?", th: 6, a: [
    { t: "Més pressupost i menys concerts amb la privada.", p: { eco: 2, ter: 5, val: 3 } },
    { t: "Reduir llistes d'espera combinant pública i privada.", p: { eco: 6, ter: 4, val: 5 } },
    { t: "Llibertat d'elecció entre centres públics i privats.", p: { eco: 8, ter: 3, val: 6.5 } }] },
  { q: "Com millorareu la seguretat?", th: 7, a: [
    { t: "Amb prevenció i polítiques socials.", p: { eco: 3, ter: 5, val: 2.5 } },
    { t: "Més agents de proximitat i justícia més àgil.", p: { eco: 5, ter: 4, val: 5.5 } },
    { t: "Penes més dures i tolerància zero.", p: { eco: 7, ter: 2, val: 8.5 } }] },
  { q: "Pujareu o abaixareu els impostos?", th: 1, a: [
    { t: "Pujar-los a les grans fortunes i a la banca.", p: { eco: 1.5, ter: 5, val: 3 } },
    { t: "Mantenir-los i combatre el frau.", p: { eco: 5, ter: 4, val: 5 } },
    { t: "Abaixar-los a famílies i empreses.", p: { eco: 8.5, ter: 3, val: 6 } }] },
];

// ---------- Preguntes d'entrevista generals ----------
// v: qualitat de la resposta (0-1). ev: resposta evasiva (la periodista hi insisteix i, en una entrevista dura, costa credibilitat).
// tone: si hi és, la pregunta només surt en entrevistes d'aquest to.
const SIM_INTERVIEW_QS = [
  { q: "Per què us hauria de votar algú que encara no us coneix?", a: [
    { t: "Perquè tenim propostes concretes i les expliquem amb números.", v: 0.75 },
    { t: "Perquè els altres partits ja han fallat.", v: 0.5 },
    { t: "Que vingui als nostres actes i ho descobrirà.", v: 0.35, ev: true }] },
  { q: "Amb qui pactaríeu després de les eleccions?", a: [
    { t: "Amb qui comparteixi les nostres prioritats, i ho direm abans de votar.", v: 0.72 },
    { t: "No pactarem amb ningú.", v: 0.42 },
    { t: "Això ja ho veurem quan hi hagi resultats.", v: 0.3, ev: true }] },
  { q: "Com pagareu les vostres propostes?", a: [
    { t: "Tenim una memòria econòmica: aquí teniu les xifres.", v: 0.8 },
    { t: "Amb el creixement que generaran les mateixes propostes.", v: 0.5 },
    { t: "Ara no toca parlar de diners.", v: 0.25, ev: true }] },
  { q: "Quina seria la primera llei que aprovaríeu?", a: [
    { t: "Una sobre el nostre tema estrella, i ja la tenim redactada.", v: 0.75 },
    { t: "Una llei de transparència i bon govern.", v: 0.6 },
    { t: "Dependrà de la majoria que surti de les urnes.", v: 0.35, ev: true }] },
  { q: "Què fa el candidat en un dia de descans?", tone: "amable", a: [
    { t: "Passejar i desconnectar amb la família i els amics.", v: 0.62 },
    { t: "Llegir els programes dels altres partits!", v: 0.66 },
    { t: "En campanya no hi ha dies de descans.", v: 0.45 }] },
  { q: "Fa un mes defensàveu una altra cosa. Per què heu canviat?", tone: "dura", a: [
    { t: "No hem canviat: hem concretat la proposta.", v: 0.58 },
    { t: "Hem rectificat perquè les dades ho aconsellaven.", v: 0.7 },
    { t: "Passem a la pregunta següent.", v: 0.2, ev: true }] },
  { q: "Les enquestes us donen pocs escons. No és un vot perdut?", tone: "dura", a: [
    { t: "A les circumscripcions on tenim opcions, cada vot compta.", v: 0.72 },
    { t: "Les enquestes s'han equivocat moltes vegades.", v: 0.45 },
    { t: "No faig cas de les enquestes.", v: 0.32, ev: true }] },
  { q: "Un antic dirigent del vostre partit us critica en públic. Què li responeu?", tone: "dura", a: [
    { t: "Respecto la seva opinió, però el partit va decidir democràticament.", v: 0.66 },
    { t: "Ja no representa ningú.", v: 0.35 },
    { t: "No en tinc res a dir.", v: 0.3, ev: true }] },
];
// Reaccions de la periodista segons la resposta
const SIM_REACTIONS = {
  ev: ["La periodista hi insisteix: «No m'ha respost».", "«Ho prenc com un no», remata la periodista.", "La periodista deixa anar un silenci incòmode."],
  good: ["La periodista assenteix i passa a la pregunta següent.", "Resposta clara: la periodista no hi insisteix.", "«Queda dit», respon la periodista."],
  mid: ["La periodista pren nota i continua.", "«D'acord», diu la periodista, sense gaire convicció."],
};

// ---------- Esdeveniments de campanya ----------
// cond(state): si pot aparèixer. Cada opció: t (text), fx(state, rand) → missatge del resultat.
const simProvBest = (state) => {
  // Circumscripció on el teu partit és més a prop de guanyar un escó (i encara no en té)
  const r = simElection(state);
  let best = null;
  r.provs.forEach((p) => {
    if (p.won.jo > 0 || !p.next) return;
    const share = p.votes.jo / p.valid;
    if (!best || share > best.share) best = { i: p.i, name: p.name, share };
  });
  return best;
};

const SIM_EVENTS = [
  { id: "escandol", title: "Polèmica amb un candidat", text: "Surten a la llum uns missatges antics d'un dels teus candidats. Els mitjans en parlen tot el matí.",
    opts: [
      { t: "Apartar-lo de la llista", fx: (s) => { s.cred += 5; s.moral -= 5; return "Guanyes credibilitat, però una part de la militància s'enfada."; } },
      { t: "Defensar-lo: és una campanya contra nosaltres", fx: (s) => { s.cred -= 9; s.moral += 4; s.glob.jo -= 0.03; return "La militància t'aplaudeix, però perds credibilitat davant de l'electorat."; } },
    ] },
  { id: "aprop", title: "A tocar d'un escó", text: (s) => `L'enquesta interna diu que estàs a punt de treure un escó a ${simProvBest(s)?.name || "una circumscripció"}.`,
    cond: (s) => !!simProvBest(s),
    opts: [
      { t: "Hi fem un acte extra (6 de diners)", fx: (s) => { const b = simProvBest(s); if (!b) return "No hi ha cap circumscripció clara."; s.camp.jo[b.i] += 0.18; s.money -= 6; return `Fas un acte extra a ${b.name}. Ara tens més opcions d'escó.`; } },
      { t: "Mantenim l'agenda prevista", fx: () => "Mantens el pla. Les enquestes internes no sempre encerten." },
    ] },
  { id: "copia", title: "T'acusen de copiar el programa", text: "Un partit rival diu que la teva proposta estrella és seva.",
    opts: [
      { t: "Respondre amb dades i dates", fx: (s, r) => { if (r() < 0.35 + s.me.attrs.sol * 0.1) { s.cred += 4; s.glob.jo += 0.03; return "La resposta convenç: surts reforçat."; } s.cred -= 3; return "La resposta arriba tard i la polèmica continua."; } },
      { t: "No entrar-hi", fx: (s) => { s.glob.jo -= 0.02; return "El rival domina el relat durant un dia."; } },
    ] },
  { id: "radio", title: "Debat a una ràdio local", text: "Et conviden a un debat en una ràdio d'una comunitat petita.",
    opts: [
      { t: "Acceptar", fx: (s, r) => { const p = SIM_PROVS[Math.floor(r() * SIM_PROVS.length)]; SIM_PROVS.forEach((q) => { if (q.ccaa === p.ccaa) { s.aw[q.i] += (1 - s.aw[q.i]) * 0.15; s.camp.jo[q.i] += 0.05; } }); return `El debat se sent a ${p.ccaa}: hi guanyes notorietat.`; } },
      { t: "Declinar-ho per falta d'agenda", fx: () => "Prioritzes els grans actes." },
    ] },
  { id: "donacio", title: "Una donació generosa", text: "Una empresa vol fer una donació important a la campanya.",
    opts: [
      { t: "Acceptar-la", fx: (s) => { s.money += 20; s.cred -= 7; return "Tens més diners, però la notícia et resta credibilitat."; } },
      { t: "Rebutjar-la públicament", fx: (s) => { s.cred += 4; return "La teva coherència es valora."; } },
    ] },
  { id: "cartell", title: "Un error al cartell", text: "Un cartell electoral té una falta d'ortografia ben visible.",
    opts: [
      { t: "Demanar disculpes i retirar-lo (4 de diners)", fx: (s) => { s.money -= 4; s.cred += 1; return "Retires els cartells i el tema s'oblida aviat."; } },
      { t: "Fer-ne broma a les xarxes", fx: (s, r) => { if (r() < 0.55) { s.awG += (1 - s.awG) * 0.05; s.glob.jo += 0.02; return "La broma es fa viral: et coneix més gent."; } s.cred -= 4; return "La broma no agrada i et critiquen."; } },
    ] },
  { id: "famos", title: "Un suport inesperat", text: "Una persona molt coneguda de la televisió anuncia que et votarà.",
    opts: [
      { t: "Fer un acte junts", fx: (s) => { s.awG += (1 - s.awG) * 0.07; s.cred -= 2; return "Molta visibilitat, tot i que hi ha qui ho veu com a espectacle."; } },
      { t: "Agrair-ho amb discreció", fx: (s) => { s.awG += (1 - s.awG) * 0.03; return "Guanyes una mica de visibilitat sense riscos."; } },
    ] },
  { id: "matis", title: "Una pregunta incòmoda", text: "En una entrevista et pregunten per la teva posició més polèmica.",
    opts: [
      { t: "Matisar-la cap al centre", fx: (s) => { ["eco", "ter", "val"].forEach((k) => { s.me[k] += (5 - s.me[k]) * 0.12; }); s.cred -= 4; return "Et mous una mica cap al centre, però et retreuen incoherència."; } },
      { t: "Mantenir-la amb convicció", fx: (s) => { s.cred += 3; s.moral += 4; return "Els teus votants valoren la coherència."; } },
    ] },
  { id: "voluntaris", title: "Allau de voluntaris", text: "Centenars de persones s'apunten per ajudar a la campanya.",
    cond: (s) => s.moral >= 55,
    opts: [
      { t: "Organitzar repartiment de propaganda", fx: (s) => { s.money += 8; s.glob.jo += 0.02; return "La militància estalvia diners i fa campanya porta a porta."; } },
      { t: "Fer-los fer trucades a indecisos", fx: (s) => { s.awG += (1 - s.awG) * 0.04; return "Les trucades et donen a conèixer."; } },
    ] },
  { id: "viral", title: "Un vídeo viral", text: "Un fragment d'un míting teu circula per totes les xarxes.",
    opts: [
      { t: "Invertir-hi per amplificar-lo (5 de diners)", fx: (s) => { s.money -= 5; s.awG += (1 - s.awG) * 0.06; s.glob.jo += 0.03; return "El vídeo arriba a milions de persones."; } },
      { t: "Deixar que corri sol", fx: (s) => { s.awG += (1 - s.awG) * 0.03; return "El vídeo et dona una mica de visibilitat."; } },
    ] },
  { id: "aliat", title: "Una proposta d'aliança local", text: "Una candidatura local petita et proposa anar junts en una circumscripció.",
    opts: [
      { t: "Acceptar l'aliança", fx: (s, r) => { const i = Math.floor(r() * SIM_PROVS.length); s.camp.jo[i] += 0.25; s.aw[i] += (1 - s.aw[i]) * 0.2; s.cred -= 2; return `Aneu junts a ${SIM_PROVS[i].name}: hi sumeu forces.`; } },
      { t: "Anar sols", fx: () => "Prefereixes mantenir la teva marca." },
    ] },
  { id: "dades", title: "Dades econòmiques noves", text: "Surten dades d'atur millors del que s'esperava. Tothom intenta capitalitzar-les.",
    opts: [
      { t: "Reconèixer-les i proposar-ne més", fx: (s) => { s.cred += 3; return "El teu to constructiu es valora."; } },
      { t: "Dir que no arriben a la gent", fx: (s) => { s.glob.jo += s.me.eco < 5 ? 0.03 : -0.01; return s.me.eco < 5 ? "El missatge connecta amb una part de l'electorat." : "El missatge no encaixa amb el teu programa."; } },
    ] },
];

// ---------- Més imprevistos de campanya ----------
// Utilitats per als imprevistos
const simEvProv = (s, r, f = () => true) => { const ps = SIM_PROVS.filter(f); return ps[Math.floor(r() * ps.length)] || SIM_PROVS[0]; };
const simLastPoll = (s) => s.polls[s.polls.length - 1];
const simMyPoll = (s) => simLastPoll(s)?.est.jo ?? 0;
const simRivalNear = (s) => [...s.rivals].sort((a, b) => simDistP(a, s.me) - simDistP(b, s.me))[0];
const simRivalBig = (s) => { const p = simLastPoll(s); return [...s.rivals].sort((a, b) => (p?.est[b.id] || 0) - (p?.est[a.id] || 0))[0]; };
const simAw = (s, k) => { s.awG += (1 - s.awG) * k; };

SIM_EVENTS.push(
  // Enquestes i vot útil
  { id: "llindar", title: "A tocar del 3 %", text: (s) => `L'enquesta del joc et dona un ${simMyPoll(s).toFixed(1)} % a tot l'Estat. A les circumscripcions grans, per sota del 3 % no entres al repartiment.`,
    cond: (s) => simMyPoll(s) > 1.5 && simMyPoll(s) < 4.5,
    opts: [
      { t: "Concentrar-se a Madrid i Barcelona", fx: (s) => { s.camp.jo[0] += 0.15; s.camp.jo[1] += 0.15; s.money -= 6; return "Dediques diners als dos grans districtes, on el 3 % pesa més. (6 de diners)"; } },
      { t: "Mantenir una campanya a tot l'Estat", fx: (s) => { simAw(s, 0.03); return "Continues arreu: més gent et coneix, però no assegures cap escó."; } },
    ] },
  { id: "votutil", title: "La crida al vot útil", text: "Arriba la crida al vot útil: es demana als votants que no «llencin» el vot en un partit sense opcions d'escó.",
    cond: (s) => simMyPoll(s) < 9,
    opts: [
      { t: "Respondre amb les circumscripcions on tens opcions", fx: (s, r) => { if (r() < 0.55 + s.me.attrs.sol * 0.05) { s.glob.jo += 0.04; return "Expliques on el teu vot sí que compta i frenes la fuga."; } s.glob.jo -= 0.02; return "La resposta no convenç: alguns votants dubten."; } },
      { t: "Ignorar-ho", fx: (s) => { s.glob.jo -= 0.03; s.glob[simRivalNear(s).id] += 0.02; return "El missatge del rival cala entre els indecisos."; } },
    ] },
  { id: "sorpasso", title: "Possible sorpasso", text: (s) => `L'enquesta del joc et situa a prop de ${simRivalNear(s).name}. Els mitjans parlen de sorpasso.`,
    cond: (s) => { const p = simLastPoll(s); const n = simRivalNear(s); return p && Math.abs((p.est.jo || 0) - (p.est[n.id] || 0)) < 2.5; },
    opts: [
      { t: "Alimentar el relat", fx: (s) => { simAw(s, 0.05); s.moral += 6; s.glob[simRivalNear(s).id] += 0.02; return "La militància s'engresca i el rival es mobilitza."; } },
      { t: "Rebaixar expectatives", fx: (s) => { s.cred += 3; return "Prudència: guanyes credibilitat."; } },
    ] },
  { id: "enquestafalsa", title: "Una enquesta inventada", text: "Circula per xarxes una enquesta falsa que us dona molt malament.",
    opts: [
      { t: "Desmentir-la amb dades", fx: (s, r) => { if (r() < 0.6) { s.cred += 3; simAw(s, 0.02); return "El desmentiment funciona i la notícia es gira al teu favor."; } return "El desmentiment arriba tard, però no fa mal."; } },
      { t: "Denunciar-ho a la Junta Electoral", fx: (s) => { s.money -= 3; s.cred += 2; return "La Junta Electoral vetlla pel procés: et fan cas, però costa temps i diners. (3 de diners)"; } },
    ] },
  // Mitjans i debats
  { id: "gafe", title: "Una relliscada en directe", text: "En una entrevista confons una dada del teu propi programa.",
    opts: [
      { t: "Rectificar de seguida", fx: (s) => { s.cred -= 2; return "Rectificació ràpida: el tema dura poc."; } },
      { t: "Fer veure que no ha passat", fx: (s, r) => { if (r() < 0.5) { s.cred -= 8; s.glob.jo -= 0.03; return "El tall es fa viral i et persegueix tot el dia."; } return "Per sort, gairebé ningú se n'adona."; } },
    ] },
  { id: "tertulia", title: "Tertúlia de màxima audiència", text: "Una tertúlia de televisió et convida a defensar el programa.",
    opts: [
      { t: "Anar-hi tu", fx: (s, r) => { if (r() < 0.3 + s.me.attrs.car * 0.1) { simAw(s, 0.07); s.glob.jo += 0.03; return "Brilles al plató: tothom en parla."; } s.cred -= 4; return "El debat s'encén i no surts ben parat."; } },
      { t: "Enviar-hi una portaveu", fx: (s) => { simAw(s, 0.03); return "Una aparició correcta, sense riscos."; } },
    ] },
  { id: "entrevistallarga", title: "Una entrevista de fons", text: "Un diari de referència et proposa una entrevista llarga sobre el programa.",
    opts: [
      { t: "Acceptar-la", fx: (s) => { s.cred += 2 + s.me.attrs.sol; return "L'entrevista mostra un programa sòlid: guanyes credibilitat."; } },
      { t: "Prioritzar els actes al carrer", fx: (s) => { s.moral += 3; return "La militància agraeix tenir-te a prop."; } },
    ] },
  { id: "podcast", title: "Un pòdcast amb milions d'oients", text: "Un pòdcast molt popular entre el jovent et vol entrevistar.",
    opts: [
      { t: "Anar-hi amb to informal", fx: (s, r) => { if (r() < 0.6) { simAw(s, 0.05); s.me.iss[0] = Math.min(1.3, s.me.iss[0] + 0.1); return "Connectes amb el jovent parlant d'habitatge."; } s.cred -= 3; return "Una broma mal entesa et costa crítiques."; } },
      { t: "No hi vas", fx: () => "Perds l'oportunitat, però no t'arrisques." },
    ] },
  { id: "factcheck", title: "Verificació de dades", text: "Una agència de verificació diu que una xifra del teu míting és exagerada.",
    opts: [
      { t: "Reconèixer l'error", fx: (s) => { s.cred += 1; return "Reconèixer-ho et dona credibilitat a mitjà termini."; } },
      { t: "Mantenir la xifra", fx: (s) => { s.cred -= 6; s.moral += 2; return "La militància t'aplaudeix; la premsa no."; } },
    ] },
  { id: "debatcara", title: "Un cara a cara improvisat", text: (s) => `Una cadena et proposa un cara a cara amb el candidat de ${simRivalBig(s).sig}, el partit que va primer a l'enquesta del joc.`,
    opts: [
      { t: "Acceptar el repte", fx: (s, r) => { if (r() < 0.35 + s.me.attrs.car * 0.08) { s.glob.jo += 0.05; simAw(s, 0.06); return "Aguantes el cara a cara: et veuen com una alternativa."; } s.glob.jo -= 0.02; simAw(s, 0.04); return "El rival té més ofici, però molta gent et descobreix."; } },
      { t: "Declinar-ho", fx: (s) => { s.cred -= 2; return "Et retreuen fugir del debat."; } },
    ] },
  { id: "manipulat", title: "Un vídeo manipulat", text: "Circula un vídeo retallat on sembla que dius una cosa que no vas dir.",
    opts: [
      { t: "Publicar el vídeo sencer", fx: (s, r) => { if (r() < 0.65) { s.cred += 3; return "El vídeo complet desmunta la manipulació."; } s.cred -= 2; return "El desmentiment arriba a menys gent que el vídeo fals."; } },
      { t: "No fer-ne cas", fx: (s) => { s.cred -= 4; return "El vídeo continua circulant."; } },
    ] },
  // Partit i militància
  { id: "dimissio", title: "Dimissió a la llista", text: "Una candidata d'una circumscripció petita deixa la llista per discrepàncies.",
    opts: [
      { t: "Buscar-hi un substitut conegut", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.seats <= 5); s.camp.jo[p.i] += 0.08; s.money -= 4; return `Trobes un substitut a ${p.name}. (4 de diners)`; } },
      { t: "Restar-hi importància", fx: (s) => { s.moral -= 5; return "La militància es desanima una mica."; } },
    ] },
  { id: "primaries", title: "Soroll intern", text: "Un sector del partit critica públicament la direcció de campanya.",
    cond: (s) => s.moral < 70,
    opts: [
      { t: "Integrar-los a la campanya", fx: (s) => { s.moral += 6; s.cred -= 2; return "Pau interna, a canvi d'algunes concessions."; } },
      { t: "Imposar disciplina", fx: (s) => { s.moral -= 6; s.cred += 2; return "Imatge d'autoritat, però amb tensions."; } },
    ] },
  { id: "acte", title: "Un acte mig buit", text: "La foto d'un míting amb moltes cadires buides corre per xarxes.",
    opts: [
      { t: "Fer-ne autocrítica amb humor", fx: (s, r) => { if (r() < 0.5) { simAw(s, 0.03); return "L'humor desactiva la polèmica."; } s.moral -= 3; return "No a tothom li fa gràcia."; } },
      { t: "Mobilitzar la militància per al pròxim", fx: (s) => { s.moral += 4; s.money -= 3; return "El pròxim acte s'omple. (3 de diners)"; } },
    ] },
  { id: "jovent", title: "El jovent del partit", text: "Les joventuts del partit proposen una campanya a les universitats.",
    opts: [
      { t: "Donar-los pressupost", fx: (s) => { s.money -= 5; simAw(s, 0.04); s.moral += 4; return "La campanya universitària us dona visibilitat. (5 de diners)"; } },
      { t: "Ara no toca", fx: (s) => { s.moral -= 3; return "Les joventuts se senten poc escoltades."; } },
    ] },
  { id: "micromecenatge", title: "Una campanya de micromecenatge", text: "La militància proposa demanar petites aportacions a la ciutadania.",
    opts: [
      { t: "Endavant", fx: (s, r) => { const k = 6 + Math.floor(r() * 10); s.money += k; s.moral += 2; return `Recapteu ${k} unitats en petites donacions.`; } },
      { t: "No", fx: () => "Prefereixes no demanar diners ara." },
    ] },
  { id: "deute", title: "Factures pendents", text: "L'empresa que munta els escenaris reclama un pagament endarrerit.",
    cond: (s) => s.money > 20,
    opts: [
      { t: "Pagar-ho ara", fx: (s) => { s.money -= 10; return "Pagues i tot continua igual. (10 de diners)"; } },
      { t: "Negociar un ajornament", fx: (s, r) => { if (r() < 0.5) return "L'empresa accepta esperar."; s.cred -= 5; return "La notícia arriba a la premsa."; } },
    ] },
  { id: "auditoria", title: "Comptes de campanya", text: "Un mitjà pregunta pel detall de les despeses de la campanya.",
    opts: [
      { t: "Publicar-les totes", fx: (s) => { s.cred += 5; return "La transparència es valora."; } },
      { t: "Remetre's al Tribunal de Comptes", fx: (s) => { s.cred -= 2; return "Correcte, però sona a evasiva."; } },
    ] },
  // Rivals
  { id: "atac", title: "Un atac directe", text: "En una tertúlia es diu que el teu programa és impossible de pagar.",
    opts: [
      { t: "Respondre amb contundència", fx: (s, r) => { const n = simRivalNear(s); if (r() < 0.5) { s.glob[n.id] -= 0.03; s.moral += 3; return "La resposta contundent es fa viral."; } s.cred -= 4; return "L'enfrontament no t'afavoreix."; } },
      { t: "Explicar com es finança", fx: (s) => { s.cred += 2 + Math.floor(s.me.attrs.sol / 2); return "Expliques els números i guanyes credibilitat."; } },
    ] },
  { id: "fitxatgerival", title: "Una cara nova a la campanya", text: "Els mitjans només parlen de les cares noves de les llistes. La teva sembla massa coneguda.",
    opts: [
      { t: "Presentar també una cara nova", fx: (s) => { s.money -= 6; simAw(s, 0.04); return "Equilibres l'impacte mediàtic. (6 de diners)"; } },
      { t: "Centrar-se en el programa", fx: (s) => { s.glob[simRivalNear(s).id] += 0.03; s.cred += 1; return "Les altres llistes guanyen visibilitat aquell dia."; } },
    ] },
  { id: "pacterival", title: "Rumors de pacte", text: (s) => `Es diu que pactaràs amb ${simRivalBig(s).name} després de les eleccions.`,
    opts: [
      { t: "Negar-ho rotundament", fx: (s) => { s.moral += 3; if (simDistP(simRivalBig(s), s.me) < 3.5) s.glob.jo -= 0.02; return "Clarifiques el teu espai, però tanques portes."; } },
      { t: "No descartar res", fx: (s) => { s.cred -= 2; if (simDistP(simRivalBig(s), s.me) < 3.5) s.glob.jo += 0.02; return "Sones a partit de govern, però alguns votants dubten."; } },
    ] },
  { id: "propostacopiada", title: "Una proposta molt compartida", text: "La teva proposta estrella s'assembla a la d'altres partits i costa diferenciar-la.",
    opts: [
      { t: "Explicar què la fa diferent", fx: (s) => { s.cred += 2; return "Expliques per què la teva proposta és diferent."; } },
      { t: "Celebrar que la idea s'escampi", fx: (s) => { s.glob[simRivalBig(s).id] += 0.02; s.cred += 3; return "Quedes bé, però el partit més gran també en surt beneficiat."; } },
    ] },
  { id: "rivalescandol", title: "Debat sobre transparència", text: "Un informe sobre la transparència dels partits obre un debat sobre la corrupció.",
    opts: [
      { t: "Proposar una auditoria pública dels comptes de tots els partits", fx: (s) => { s.cred += 4; s.money -= 3; return "La proposta es valora, i dona exemple publicant els teus comptes. (3 de diners)"; } },
      { t: "Fer-ne el centre de la campanya", fx: (s, r) => { if (r() < 0.5) { s.glob.jo += 0.03; return "El missatge connecta amb el malestar."; } s.cred -= 2; return "Se't retreu fer servir el tema de manera oportunista."; } },
    ] },
  { id: "cartellsrival", title: "Cartells arrencats", text: "Apareixen cartells teus arrencats en diverses ciutats.",
    opts: [
      { t: "Denunciar-ho públicament", fx: (s) => { s.moral += 4; simAw(s, 0.02); return "La notícia et dona visibilitat."; } },
      { t: "Reposar-los sense soroll", fx: (s) => { s.money -= 3; return "Tornes a penjar els cartells. (3 de diners)"; } },
    ] },
  // Temes i crisis genèrics
  { id: "lloguers", title: "Els lloguers, a primera pàgina", text: "Un informe diu que els lloguers han pujat molt en un any.",
    opts: [
      { t: "Fer de l'habitatge el tema del dia", fx: (s) => { s.me.iss[0] = Math.min(1.3, s.me.iss[0] + 0.15); return "Situes l'habitatge al centre del teu missatge."; } },
      { t: "Mantenir el guió", fx: () => "Continues amb el pla previst." },
    ] },
  { id: "fabrica", title: "Tanca una fàbrica", text: (s) => "Una gran empresa anuncia el tancament d'una fàbrica i centenars d'acomiadaments.",
    opts: [
      { t: "Anar a la porta de la fàbrica", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.inc < 0.6); s.camp.jo[p.i] += 0.12; s.aw[p.i] += (1 - s.aw[p.i]) * 0.2; return `Fas un acte amb els treballadors a ${p.name}.`; } },
      { t: "Proposar un pla de reindustrialització", fx: (s) => { s.me.iss[1] = Math.min(1.3, s.me.iss[1] + 0.12); s.cred += 1; return "La proposta reforça el teu discurs econòmic."; } },
    ] },
  { id: "onada", title: "Onada de calor", text: "Una onada de calor rècord marca la setmana.",
    opts: [
      { t: "Parlar de canvi climàtic", fx: (s) => { s.me.iss[5] = Math.min(1.3, s.me.iss[5] + 0.15); return s.me.val < 5 ? "El missatge connecta amb el teu electorat." : "Sorprens part del teu electorat, però arribes a votants nous."; } },
      { t: "Parlar de la factura de la llum", fx: (s) => { s.me.iss[1] = Math.min(1.3, s.me.iss[1] + 0.1); return "Poses el focus en el cost de la vida."; } },
    ] },
  { id: "llistes", title: "Llistes d'espera", text: "Un informe alerta de llistes d'espera llarguíssimes a la sanitat.",
    opts: [
      { t: "Presentar un pla de xoc", fx: (s) => { s.me.iss[6] = Math.min(1.3, s.me.iss[6] + 0.15); s.cred += 1; return "El pla de xoc et dona protagonisme en sanitat."; } },
      { t: "Criticar la gestió actual", fx: (s) => { s.glob.jo += 0.02; return "La crítica connecta amb el malestar."; } },
    ] },
  { id: "pensio", title: "Les pensions, a debat", text: "Un estudi sobre la sostenibilitat de les pensions obre tots els informatius.",
    opts: [
      { t: "Garantir-les per escrit", fx: (s) => { s.me.iss[2] = Math.min(1.3, s.me.iss[2] + 0.15); s.cred -= s.me.eco > 6 ? 3 : 0; return "La gent gran t'escolta més."; } },
      { t: "Defensar una reforma", fx: (s) => { s.cred += 2; s.me.iss[2] = Math.min(1.3, s.me.iss[2] + 0.05); return "Se't veu rigorós, però no a tothom li agrada."; } },
    ] },
  { id: "seguretat", title: "Un debat sobre seguretat", text: "Unes dades de delictes obren un debat sobre seguretat.",
    opts: [
      { t: "Proposar més policia de proximitat", fx: (s) => { s.me.iss[7] = Math.min(1.3, s.me.iss[7] + 0.12); return "Entres en el debat amb una proposta concreta."; } },
      { t: "Demanar no alarmar", fx: (s) => { s.cred += 1; return s.me.val < 5 ? "El teu electorat t'hi dona suport." : "Part del teu electorat ho troba tou."; } },
    ] },
  { id: "pastera", title: "Arribada de pasteres", text: "L'arribada de diverses pasteres obre un debat sobre immigració.",
    opts: [
      { t: "Defensar vies legals i acollida", fx: (s) => { s.me.iss[4] = Math.min(1.3, s.me.iss[4] + 0.1); return s.me.val < 5 ? "Coherent amb el teu programa." : "Sorprens el teu electorat més conservador."; } },
      { t: "Demanar més control", fx: (s) => { s.me.iss[4] = Math.min(1.3, s.me.iss[4] + 0.1); return s.me.val > 5 ? "Coherent amb el teu programa." : "Sorprens el teu electorat més progressista."; } },
    ] },
  { id: "financament", title: "El finançament dels territoris", text: "Diversos governs autonòmics reclamen un nou model de finançament.",
    opts: [
      { t: "Donar-los suport", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter > 0.5) s.camp.jo[p.i] += 0.05; else s.camp.jo[p.i] -= 0.02; }); return "Guanyes suport on hi ha més identitat territorial i en perds una mica a la resta."; } },
      { t: "Defensar la igualtat entre territoris", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter < 0.3) s.camp.jo[p.i] += 0.04; else s.camp.jo[p.i] -= 0.03; }); return "Connectes on la identitat territorial és baixa."; } },
    ] },
  { id: "vaga", title: "Una vaga general", text: "Els sindicats convoquen una vaga general a mitja campanya.",
    opts: [
      { t: "Donar-hi suport", fx: (s) => { s.glob.jo += s.me.eco < 4.5 ? 0.04 : -0.03; return s.me.eco < 4.5 ? "El teu electorat ho valora." : "No encaixa amb el teu programa econòmic."; } },
      { t: "Demanar diàleg social", fx: (s) => { s.cred += 2; return "Un missatge moderat, sense gaire impacte."; } },
    ] },
  { id: "pagesia", title: "La pagesia als carrers", text: "Centenars de tractors talla carreteres per reclamar preus justos.",
    opts: [
      { t: "Anar a parlar amb la pagesia", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.urb < 0.5); s.camp.jo[p.i] += 0.12; s.aw[p.i] += (1 - s.aw[p.i]) * 0.2; return `Visites la protesta a ${p.name}: et guanyes el respecte del món rural.`; } },
      { t: "Defensar les normes ambientals", fx: (s) => { s.me.iss[5] = Math.min(1.3, s.me.iss[5] + 0.1); return "Coherència climàtica, però perds simpaties al camp."; } },
    ] },
  { id: "nevada", title: "Una gran nevada", text: "Una nevada talla carreteres i deixa pobles aïllats.",
    opts: [
      { t: "Suspendre els actes i ajudar", fx: (s) => { s.cred += 4; s.slot = Math.min(3, s.slot + 1); return "Suspens un acte d'avui: la decisió es valora. Perds una franja."; } },
      { t: "Continuar la campanya", fx: (s) => { s.cred -= 4; return "Et retreuen falta de sensibilitat."; } },
    ] },
  { id: "europa", title: "Una decisió de Brussel·les", text: "La Comissió Europea alerta sobre el dèficit públic d'Espanya.",
    opts: [
      { t: "Defensar la disciplina fiscal", fx: (s) => { s.glob.jo += s.me.eco > 5.5 ? 0.03 : -0.02; return "Missatge de rigor econòmic."; } },
      { t: "Defensar més inversió pública", fx: (s) => { s.glob.jo += s.me.eco < 4.5 ? 0.03 : -0.02; return "Missatge d'estímul econòmic."; } },
    ] },
  { id: "tren", title: "Avaria als trens", text: "Una avaria deixa milers de viatgers tirats durant hores.",
    opts: [
      { t: "Proposar un pla d'inversió", fx: (s) => { s.cred += 2; s.camp.jo[1] += 0.05; return "Parles d'infraestructures i de servei públic."; } },
      { t: "Criticar la gestió", fx: (s) => { s.glob.jo += 0.02; return "La crítica connecta amb la gent afectada."; } },
    ] },
  { id: "cibera", title: "Ciberatac a la web", text: "La web del partit queda inoperativa per un atac informàtic.",
    opts: [
      { t: "Contractar una empresa de seguretat", fx: (s) => { s.money -= 6; return "La web torna a funcionar ràpidament. (6 de diners)"; } },
      { t: "Esperar que es resolgui", fx: (s) => { simAw(s, -0.02); s.moral -= 2; return "Un dia sense web i sense formularis de voluntariat."; } },
    ] },
  // Territori i circumscripcions
  { id: "visitaprov", title: "Una província oblidada", text: (s) => "Una plataforma ciutadana d'una província petita es queixa que ningú no hi fa campanya.",
    opts: [
      { t: "Anar-hi demà", fx: (s, r) => { const p = simEvProv(s, r, (q) => q.seats <= 3); s.camp.jo[p.i] += 0.22; s.aw[p.i] += (1 - s.aw[p.i]) * 0.3; s.money -= 4; return `Vas a ${p.name}: hi ets el primer partit a anar-hi. (4 de diners)`; } },
      { t: "No hi ha temps", fx: () => "Les circumscripcions petites reparteixen pocs escons: costa molt entrar-hi." },
    ] },
  { id: "catala", title: "La llengua a debat", text: "Un debat sobre l'ús de les llengües oficials a l'administració arriba a campanya.",
    opts: [
      { t: "Defensar el plurilingüisme", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.ter > 0.3) s.camp.jo[p.i] += 0.05; }); return "Guanyes simpaties als territoris amb llengua pròpia."; } },
      { t: "Evitar el tema", fx: () => "Prefereixes no entrar-hi." },
    ] },
  { id: "illa", title: "Connexions amb les illes", text: "Les Balears i les Canàries reclamen més ajuts al transport.",
    opts: [
      { t: "Comprometre-t'hi", fx: (s) => { [8, 11, 15].forEach((i) => { s.camp.jo[i] += 0.08; }); return "La proposta es valora a les illes."; } },
      { t: "Prioritzar la península", fx: () => "Les illes reparteixen 23 escons: també compten." },
    ] },
  { id: "despoblament", title: "L'Espanya buida", text: "Un informe alerta del despoblament de moltes províncies de l'interior.",
    opts: [
      { t: "Presentar un pla contra el despoblament", fx: (s) => { SIM_PROVS.forEach((p) => { if (p.urb < 0.45) s.camp.jo[p.i] += 0.05; }); return "Guanyes suport a les províncies rurals, on un escó costa menys vots."; } },
      { t: "Centrar-se en les ciutats", fx: (s) => { s.camp.jo[0] += 0.05; s.camp.jo[1] += 0.05; return "Prioritzes on hi ha més electorat."; } },
    ] },
  // Diners i recursos
  { id: "publicitat", title: "Una oferta de publicitat", text: "Una cadena de ràdio ofereix espais publicitaris amb descompte.",
    cond: (s) => s.money >= 12,
    opts: [
      { t: "Comprar-los", fx: (s) => { s.money -= 12; simAw(s, 0.07); return "La teva falca sona a totes hores. (12 de diners)"; } },
      { t: "Estalviar", fx: () => "Guardes els diners per als últims dies." },
    ] },
  { id: "bustiada", title: "Propaganda electoral per correu", text: "Pots enviar propaganda a totes les llars d'una comunitat.",
    cond: (s) => s.money >= 10,
    opts: [
      { t: "Enviar-la on tens més opcions", fx: (s, r) => { const p = simLastPoll(s); let best = SIM_PROVS[1]; if (p?.provs) { const c = p.provs.map((x, i) => ({ x, i })).filter((o) => o.x.need !== null && o.x.need > 0).sort((a, b) => a.x.need - b.x.need)[0]; if (c) best = SIM_PROVS[c.i]; } SIM_PROVS.forEach((q) => { if (q.ccaa === best.ccaa) s.camp.jo[q.i] += 0.08; }); s.money -= 10; return `Bustiada a ${best.ccaa}. (10 de diners)`; } },
      { t: "No cal", fx: () => "Estalvies diners." },
    ] },
  { id: "subvencio", title: "Les subvencions electorals", text: "Recordes que l'Estat paga una part de la campanya segons els escons i els vots obtinguts.",
    opts: [
      { t: "Demanar un crèdit a compte", fx: (s) => { s.money += 15; s.cred -= 2; return "Tens més marge, però t'endeutes. Si no treus escons, costarà tornar-lo."; } },
      { t: "No arriscar", fx: (s) => { s.cred += 1; return "Gestió prudent."; } },
    ] },
  // Lideratge
  { id: "malaltia", title: "Afonia", text: "El candidat es queda afònic després de tants mítings.",
    opts: [
      { t: "Descansar un dia", fx: (s) => { s.slot = Math.min(3, s.slot + 1); return "Perds una franja d'avui, però recuperes la veu."; } },
      { t: "Continuar igualment", fx: (s, r) => { if (r() < 0.5) { s.cred -= 3; return "Un míting amb la veu trencada no llueix gaire."; } return "Ho aguantes."; } },
    ] },
  { id: "biografia", title: "Un llibre sobre el candidat", text: "Una editorial vol publicar una biografia del candidat.",
    opts: [
      { t: "Col·laborar-hi", fx: (s) => { simAw(s, 0.03); s.me.lead = Math.min(0.8, s.me.lead + 0.03); return "El llibre humanitza el candidat."; } },
      { t: "No és el moment", fx: () => "Prefereixes parlar de propostes." },
    ] },
  { id: "frase", title: "Una frase desafortunada", text: "Una frase del candidat sobre un col·lectiu genera indignació.",
    opts: [
      { t: "Demanar disculpes", fx: (s) => { s.cred -= 2; s.moral -= 2; return "Disculpes ràpides: el tema es refreda."; } },
      { t: "Dir que l'han tret de context", fx: (s, r) => { if (r() < 0.4) return "Mig convenç."; s.cred -= 7; return "La polèmica creix."; } },
    ] },
  { id: "carta", title: "Una carta oberta", text: "Personalitats de la cultura publiquen una carta demanant debat sobre propostes, no insults.",
    opts: [
      { t: "Signar-la i proposar un debat", fx: (s) => { s.cred += 3; simAw(s, 0.02); return "La teva imatge de diàleg millora."; } },
      { t: "No respondre", fx: () => "Passa desapercebut." },
    ] },
  // Final de campanya
  { id: "tancament", title: "L'acte de tancament", text: "On fas el gran acte de final de campanya?",
    cond: (s) => s.day >= s.days - 1,
    opts: [
      { t: "A Madrid, el districte més gran", fx: (s) => { s.camp.jo[0] += 0.12; s.moral += 4; s.money -= 6; return "Un gran acte a Madrid. (6 de diners)"; } },
      { t: "On estàs a punt d'escó", fx: (s) => { const b = simProvBest(s); if (!b) { s.moral += 2; return "No hi ha cap circumscripció clara: fas un acte a casa."; } s.camp.jo[b.i] += 0.2; s.money -= 6; return `Tanques la campanya a ${b.name}, on et falta poc per a un escó. (6 de diners)`; } },
      { t: "A la teva circumscripció més forta", fx: (s) => { s.moral += 8; return "La militància surt eufòrica."; } },
    ] },
  { id: "indecisos", title: "Un 30 % d'indecisos", text: "L'enquesta del joc diu que gairebé un terç de l'electorat encara no sap què votarà.",
    cond: (s) => s.day >= 4,
    opts: [
      { t: "Missatge en positiu", fx: (s) => { s.glob.jo += 0.03; return "Un tancament optimista per atreure indecisos."; } },
      { t: "Missatge de mobilització", fx: (s) => { s.moral += 5; s.turnBoost = Math.min(0.03, (s.turnBoost || 0) + 0.01); return "Crides a anar a votar: la participació puja una mica."; } },
    ] },
  { id: "votcorreu", title: "Rècord de vot per correu", text: "El vot per correu bat rècords i molta gent ja ha votat.",
    cond: (s) => s.day >= 3,
    opts: [
      { t: "Recordar com es vota per correu", fx: (s) => { s.cred += 2; return "Un servei públic: la gent ho agraeix."; } },
      { t: "Centrar-se en el dia de la votació", fx: (s) => { s.moral += 2; return "Prepares la mobilització del diumenge."; } },
    ] },
  { id: "observadors", title: "Interventors i apoderats", text: "Cal organitzar els interventors que representaran el partit a les meses.",
    cond: (s) => s.day >= 4,
    opts: [
      { t: "Formar la militància", fx: (s) => { s.moral += 4; s.money -= 3; return "Tindreu interventors a moltes meses. (3 de diners)"; } },
      { t: "Cobrir només les grans ciutats", fx: () => "Estalvies esforç." },
    ] },
);

function simPickEvent(state) {
  const seen = state.used.events || (state.used.events = []);
  const pool = SIM_EVENTS.filter((e) => !seen.includes(e.id) && (!e.cond || e.cond(state)));
  if (!pool.length) return null;
  const e = pool[Math.floor(simRand(state, "event") * pool.length)];
  seen.push(e.id);
  return e;
}

function simApplyEvent(state, ev, k) {
  const rng = () => simRand(state, `ev-${ev.id}`);
  const msg = ev.opts[k].fx(state, rng);
  state.cred = Math.max(0, Math.min(100, state.cred));
  state.moral = Math.max(0, Math.min(100, state.moral));
  state.money = Math.max(0, state.money);
  state.log.push({ day: state.day, type: "event", msg, good: true, round: state.round || 1 });
  simNews(state, { kind: "event", icon: "⚡", party: "jo", t: ev.title });
  return msg;
}

function simDebateQuestions(state) {
  const n = state.used.debates = (state.used.debates || 0) + 1;
  const rng = simMulberry(simHash(`${state.seed}|debat|${n}`));
  const qs = [...SIM_DEBATE_QS];
  for (let i = qs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
  return qs.slice(0, 3);
}

// ---------- Legislatura: decisions de govern de cada trimestre ----------
// Cada opció té una posició ideològica (pos: eix, posició i tema), uns efectes sobre els indicadors (fx)
// i una explicació breu de causa i efecte (why). Cap opció és la correcta: només té conseqüències diferents.
const SIM_LEG_CARDS = [
  { id: "energia", title: "El preu de la llum es dispara", text: "La factura elèctrica s'ha doblat en tres mesos.",
    opts: [
      { t: "Un topall al preu del gas", pos: { ax: "eco", p: 2, th: 1 }, fx: { eco: -2, ben: 5, pop: 2 }, why: "La factura baixa i les famílies respiren, però l'Estat assumeix part del cost." },
      { t: "Rebaixar els impostos de la llum", pos: { ax: "eco", p: 7, th: 1 }, fx: { eco: 1, ben: 3, pop: 2 }, why: "Baixa el preu per a tothom, també per a qui no ho necessita, i es recapta menys." },
      { t: "Ajuts directes a les llars vulnerables", pos: { ax: "eco", p: 4, th: 1 }, fx: { eco: -1, ben: 4 }, why: "Ajuda qui més ho necessita, però la majoria no nota cap canvi." },
    ] },
  { id: "habitatge", title: "L'habitatge, problema número u", text: "Les enquestes diuen que l'habitatge és la principal preocupació de la ciutadania.",
    opts: [
      { t: "Topall als lloguers a les zones tensionades", pos: { ax: "eco", p: 2, th: 0 }, fx: { ben: 4, eco: -2 }, why: "Els lloguers s'estabilitzen, però alguns propietaris retiren pisos del mercat." },
      { t: "Un gran pla d'habitatge públic", pos: { ax: "eco", p: 3.5, th: 0 }, fx: { ben: 3, eco: -1 }, why: "Més habitatge assequible a mitjà termini, amb molta despesa pública." },
      { t: "Incentius fiscals per construir", pos: { ax: "eco", p: 8, th: 0 }, fx: { eco: 4, ben: 1 }, why: "Es construeix més, però els preus triguen a baixar." },
    ] },
  { id: "atur", title: "L'atur repunta", text: "L'atur ha pujat dos punts en un trimestre.",
    opts: [
      { t: "Un pla d'ocupació pública", pos: { ax: "eco", p: 2.5, th: 1 }, fx: { ben: 3, eco: 1 }, why: "Crea llocs de treball ràpidament, amb càrrec al pressupost." },
      { t: "Rebaixar les cotitzacions de les empreses", pos: { ax: "eco", p: 7.5, th: 1 }, fx: { eco: 4, ben: -1 }, why: "Les empreses contracten més, però la Seguretat Social ingressa menys." },
      { t: "Una reforma laboral pactada amb sindicats i patronal", pos: { ax: "eco", p: 5, th: 1 }, fx: { eco: 2, ben: 2, pop: 1 }, why: "El pacte social dona estabilitat, amb canvis moderats." },
    ] },
  { id: "referendum", title: "Un parlament autonòmic demana un referèndum", text: "Un parlament autonòmic aprova demanar un referèndum d'autodeterminació.",
    opts: [
      { t: "Obrir una taula de diàleg", pos: { ax: "ter", p: 7, th: 3 }, fx: { coh: 6, pop: -1 }, why: "La tensió baixa als territoris, però part de l'electorat ho veu com una cessió." },
      { t: "Aplicar la Constitució amb fermesa", pos: { ax: "ter", p: 1, th: 3 }, fx: { coh: -6, pop: 1 }, why: "Missatge clar d'unitat, però el conflicte s'enquista." },
      { t: "Proposar una reforma federal", pos: { ax: "ter", p: 5.5, th: 3 }, fx: { coh: 3 }, why: "Una via intermèdia que no satisfà del tot ningú." },
    ] },
  { id: "migracio", title: "Arribades massives a les costes", text: "L'arribada de milers de persones desborda els centres d'acollida.",
    opts: [
      { t: "Repartiment entre comunitats i acollida", pos: { ax: "val", p: 2.5, th: 4 }, fx: { ben: 2, coh: 1 }, why: "Es desfà el coll d'ampolla, però algunes comunitats s'hi oposen." },
      { t: "Acords amb els països d'origen", pos: { ax: "val", p: 5, th: 4 }, fx: { coh: 1 }, why: "Menys arribades a mitjà termini, amb resultats lents." },
      { t: "Més control i retorns", pos: { ax: "val", p: 8.5, th: 4 }, fx: { ben: -1, pop: 1 }, why: "Menys arribades a curt termini i crítiques de les ONG." },
    ] },
  { id: "sanitat", title: "Vaga a la sanitat", text: "Metgesses i infermers fan vaga per les plantilles i els sous.",
    opts: [
      { t: "Pujar sous i ampliar plantilles", pos: { ax: "eco", p: 2, th: 6 }, fx: { ben: 6, eco: -3 }, why: "Es desconvoca la vaga i millora l'atenció, amb un cost alt." },
      { t: "Concertar operacions amb la privada", pos: { ax: "eco", p: 7.5, th: 6 }, fx: { ben: 2, eco: 1 }, why: "Les llistes d'espera baixen ràpid, però la vaga continua." },
      { t: "Una mediació", pos: { ax: "eco", p: 5, th: 6 }, fx: { ben: 2, eco: -1 }, why: "Un acord a mitges que compra temps." },
    ] },
  { id: "sequera", title: "Sequera extrema", text: "Els embassaments són a mínims històrics.",
    opts: [
      { t: "Restriccions i dessalinitzadores", pos: { ax: "val", p: 3, th: 5 }, fx: { eco: -2, ben: 2 }, why: "S'assegura l'aigua de boca, amb pèrdues per a l'agricultura." },
      { t: "Transvasaments entre conques", pos: { ax: "val", p: 6.5, th: 5 }, fx: { eco: 2, coh: -4 }, why: "Arriba aigua on falta, però enfronta territoris." },
      { t: "Ajuts a la pagesia", pos: { ax: "val", p: 5, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Alleuja el camp sense resoldre la falta d'aigua." },
    ] },
  { id: "inflacio", title: "La cistella de la compra", text: "Els preus dels aliments pugen molt més que els sous.",
    opts: [
      { t: "Rebaixar l'IVA dels aliments", pos: { ax: "eco", p: 6, th: 1 }, fx: { ben: 3, eco: -1, pop: 2 }, why: "Els preus baixen una mica i es recapta menys." },
      { t: "Un impost als beneficis extraordinaris", pos: { ax: "eco", p: 2, th: 1 }, fx: { ben: 3, eco: -2 }, why: "Financia ajuts, però les empreses afectades amenacen de recórrer." },
      { t: "No intervenir", pos: { ax: "eco", p: 8.5, th: 1 }, fx: { eco: 2, ben: -3, pop: -2 }, why: "El mercat s'ajusta sol, però el malestar creix." },
    ] },
  { id: "pensions", title: "Les pensions de l'any vinent", text: "Cal decidir quant pugen les pensions.",
    opts: [
      { t: "Pujar-les amb la inflació", pos: { ax: "eco", p: 3, th: 2 }, fx: { ben: 4, eco: -2, pop: 2 }, why: "Els pensionistes no perden poder adquisitiu; la despesa puja." },
      { t: "Allargar l'edat de jubilació", pos: { ax: "eco", p: 7.5, th: 2 }, fx: { eco: 3, pop: -3 }, why: "El sistema és més sostenible, però és una mesura impopular." },
      { t: "Portar-ho al Pacte de Toledo", pos: { ax: "eco", p: 5, th: 2 }, fx: { eco: 1, ben: 1 }, why: "Consens ampli, decisions més lentes." },
    ] },
  { id: "corrupcio", title: "Un cas de corrupció", text: "La policia investiga un alt càrrec d'un ministeri.",
    opts: [
      { t: "Cessar-lo i crear una comissió d'investigació", fx: { pop: 2, est: -3 }, why: "Transmet exemplaritat, però la comissió dona munició a l'oposició." },
      { t: "Esperar que actuï la justícia", fx: { pop: -4 }, why: "Respectes la presumpció d'innocència, però sembla que el protegeixes." },
    ] },
  { id: "incendis", title: "Un estiu d'incendis", text: "Els incendis forestals cremen milers d'hectàrees.",
    opts: [
      { t: "Més brigades públiques tot l'any", pos: { ax: "eco", p: 3, th: 5 }, fx: { ben: 3, eco: -1 }, why: "Més prevenció, més despesa estructural." },
      { t: "Llei de gestió forestal amb els propietaris", pos: { ax: "eco", p: 7, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Implica el sector privat; els resultats arriben a llarg termini." },
    ] },
  { id: "seguretat", title: "Debat sobre la seguretat", text: "Uns quants delictes mediàtics situen la seguretat a l'agenda.",
    opts: [
      { t: "Pla de prevenció als barris", pos: { ax: "val", p: 2.5, th: 7 }, fx: { ben: 2 }, why: "Ataca les causes, amb efectes lents." },
      { t: "Més agents de proximitat", pos: { ax: "val", p: 5.5, th: 7 }, fx: { ben: 1, eco: -1, pop: 1 }, why: "Més sensació de seguretat, amb un cost moderat." },
      { t: "Reforma del Codi Penal", pos: { ax: "val", p: 9, th: 7 }, fx: { pop: 1, coh: -1 }, why: "Penes més dures; els experts en dubten l'eficàcia." },
    ] },
  { id: "educacio", title: "La petita infància", text: "Falten places a les escoles bressol.",
    opts: [
      { t: "Gratuïtat de 0 a 3 anys", pos: { ax: "eco", p: 2, th: 6 }, fx: { ben: 5, eco: -2 }, why: "Ajuda a conciliar i reduir desigualtats, amb una gran inversió." },
      { t: "Un xec per triar centre", pos: { ax: "eco", p: 8.5, th: 6 }, fx: { ben: 2, eco: 1 }, why: "Més llibertat d'elecció; els centres públics temen perdre recursos." },
      { t: "Un pla contra l'abandonament escolar", pos: { ax: "eco", p: 4.5, th: 6 }, fx: { ben: 3, eco: -1 }, why: "Ataca un problema greu, però no resol les places de 0 a 3." },
    ] },
  { id: "financament", title: "El finançament autonòmic", text: "Les comunitats reclamen un nou sistema de finançament.",
    opts: [
      { t: "Un model singular per a cada territori", pos: { ax: "ter", p: 7.5, th: 3 }, fx: { coh: 5, pop: -1 }, why: "Satisfà els territoris amb més identitat, i en molesta d'altres." },
      { t: "Un model comú per a tothom", pos: { ax: "ter", p: 2.5, th: 3 }, fx: { coh: -3, pop: 1 }, why: "Igualtat formal, però els que aporten més se senten maltractats." },
      { t: "Un fons de compensació", pos: { ax: "ter", p: 5, th: 3 }, fx: { coh: 2, eco: -1 }, why: "Una solució intermèdia, amb un cost per a l'Estat." },
    ] },
  { id: "industria", title: "Una gran inversió industrial", text: "Una multinacional vol instal·lar una fàbrica de bateries a Espanya.",
    opts: [
      { t: "Entrar-hi amb diner públic", pos: { ax: "eco", p: 3, th: 1 }, fx: { eco: 3, ben: 1 }, why: "Assegura la fàbrica, amb risc per a les arques públiques." },
      { t: "Rebaixar l'impost de societats", pos: { ax: "eco", p: 8, th: 1 }, fx: { eco: 4, ben: -1 }, why: "Atreu la inversió, però redueix la recaptació." },
    ] },
  { id: "turisme", title: "El turisme massiu", text: "Diverses ciutats protesten pel turisme massiu.",
    opts: [
      { t: "Taxa turística i límit als pisos turístics", pos: { ax: "eco", p: 2.5, th: 0 }, fx: { ben: 3, eco: -1 }, why: "Alleuja els barris, però el sector turístic protesta." },
      { t: "Ordenar sense limitar", pos: { ax: "eco", p: 6, th: 0 }, fx: { eco: 1 }, why: "Res no canvia gaire: ni la protesta ni els ingressos." },
      { t: "Promoure més turisme", pos: { ax: "eco", p: 8, th: 0 }, fx: { eco: 3, ben: -2 }, why: "Més ingressos, més tensió als barris." },
    ] },
  { id: "llengues", title: "Les llengües cooficials", text: "Es debat si el català, el basc i el gallec s'han de poder fer servir a totes les institucions de l'Estat.",
    opts: [
      { t: "Permetre-ho a les Corts i a la UE", pos: { ax: "ter", p: 7.5, th: 3 }, fx: { coh: 4 }, why: "Reconeixement per als territoris amb llengua pròpia, amb un cost de traducció." },
      { t: "Mantenir el castellà com a llengua de treball", pos: { ax: "ter", p: 1.5, th: 3 }, fx: { coh: -4, pop: 1 }, why: "Més simple, però es percep com un menyspreu." },
    ] },
  { id: "salari", title: "El salari mínim", text: "Cal fixar el salari mínim de l'any vinent.",
    opts: [
      { t: "Pujar-lo un 8 %", pos: { ax: "eco", p: 2.5, th: 1 }, fx: { ben: 4, eco: -1, pop: 1 }, why: "Més poder adquisitiu per als sous baixos; alguns petits negocis ho noten." },
      { t: "Pujar-lo amb la inflació", pos: { ax: "eco", p: 5, th: 1 }, fx: { ben: 1, eco: 1 }, why: "Es manté el poder adquisitiu, sense sorpreses." },
      { t: "Congelar-lo", pos: { ax: "eco", p: 8, th: 1 }, fx: { eco: 2, ben: -3, pop: -2 }, why: "Alleuja les empreses i perjudica els sous més baixos." },
    ] },
  { id: "clima", title: "Les emissions no baixen", text: "Espanya no compleix els objectius europeus de reducció d'emissions.",
    opts: [
      { t: "Prohibir els vols curts amb alternativa en tren", pos: { ax: "val", p: 2.5, th: 5 }, fx: { ben: 1, eco: -1, coh: -1 }, why: "Menys emissions; les zones sense bon tren se senten excloses." },
      { t: "Ajuts a la renovació de vehicles i calefaccions", pos: { ax: "val", p: 5, th: 5 }, fx: { eco: 1, ben: 1 }, why: "Canvi gradual amb diner públic." },
      { t: "No posar noves restriccions", pos: { ax: "val", p: 8, th: 5 }, fx: { eco: 1, pop: 1 }, why: "Sense costos immediats; Europa pot imposar sancions." },
    ] },
  { id: "defensa", title: "La despesa en defensa", text: "Els aliats internacionals demanen més despesa militar.",
    opts: [
      { t: "Augmentar-la", pos: { ax: "val", p: 7, th: 7 }, fx: { eco: -1, ben: -1 }, why: "Compleixes els compromisos, però hi ha menys diners per a altres coses." },
      { t: "Prioritzar la despesa social", pos: { ax: "val", p: 3, th: 7 }, fx: { ben: 2, pop: 1 }, why: "Mantens els serveis, però els aliats et pressionen." },
    ] },
];

// Tria la decisió del trimestre: una de nova cada vegada, sempre la mateixa per a la mateixa llavor
function simLegPickCard(state) {
  const L = state.leg;
  const pool = SIM_LEG_CARDS.filter((c) => !L.cards.includes(c.id) && (!c.cond || c.cond(state)));
  const c = pool[Math.floor(simRand(state, "leg-card") * pool.length)] || SIM_LEG_CARDS[0];
  L.cards.push(c.id);
  return c;
}

// Aplica una opció d'una decisió de govern. Retorna l'explicació i els canvis.
function simLegApplyCard(state, card, k) {
  const L = state.leg, o = card.opts[k];
  const before = { ...L.ind };
  Object.entries(o.fx || {}).forEach(([key, v]) => { if (key !== "est") L.ind[key] += v * 1.5; });
  // La popularitat del jugador depèn de si la decisió encaixa amb el seu programa
  if (o.pos && (simLegRole(state) === "pm" || simLegRole(state) === "coal")) L.ind.pop += simMeasureView(state.me, o.pos) * 4;
  const reacts = o.pos ? simLegReact(state, o.pos) : [];
  if (o.fx?.est) Object.keys(L.sup).forEach((id) => { if (!L.gov.parties.includes(id)) L.sup[id] -= 0.05; });
  simClampInd(L);
  simLegStability(state);
  L.log.push({ q: L.q + 1, type: "card", id: card.id, k });
  const delta = Object.fromEntries(Object.keys(L.ind).map((key) => [key, L.ind[key] - before[key]]));
  return { why: o.why, delta, reacts };
}
