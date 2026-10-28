// Simulador del 29N · Dades: circumscripcions, temes, tipus de votant i partits ficticis.
// Les 52 circumscripcions tenen els escons reals del 29N (PROVINCES) i la població de l'INE (1-4-2026).
// La resta d'atributs (urbanització, envelliment, renda i identitat territorial) són aproximacions
// simplificades per al joc: serveixen per donar personalitat a cada província, no per predir res.

// Versió de l'esquema de la partida desada: si canvia, les partides antigues es descarten amb un avís
const SIM_VERSION = 4;

// Temes del programa (els mateixos noms que l'argumentari de l'Aprèn). «icon»: per a l'agenda i el teletip.
const SIM_THEMES = [
  { k: "hab", label: "Habitatge", icon: "🏠" },
  { k: "eco", label: "Economia i impostos", icon: "💶" },
  { k: "pen", label: "Pensions", icon: "👵" },
  { k: "ter", label: "Model territorial", icon: "🗺️" },
  { k: "imm", label: "Immigració", icon: "🛂" },
  { k: "clima", label: "Clima i energia", icon: "🌍" },
  { k: "serv", label: "Sanitat i educació", icon: "🏥" },
  { k: "seg", label: "Seguretat i justícia", icon: "🚔" },
];

// ---------- Calendari de la campanya ----------
// Els sis dies del joc resumeixen els quinze de la campanya real (del 13 al 27 de novembre). La llei prohibeix publicar
// enquestes els cinc dies anteriors a la votació (art. 69.7 de la LOREG): des del dia 5 (24 de novembre) només n'hi ha
// d'internes, que el partit encarrega i no es poden difondre.
const SIM_DATES = [
  { d: "13 de novembre", w: "Divendres" },
  { d: "16 de novembre", w: "Dilluns" },
  { d: "19 de novembre", w: "Dijous" },
  { d: "22 de novembre", w: "Diumenge" },
  { d: "24 de novembre", w: "Dimarts" },
  { d: "27 de novembre", w: "Divendres" },
];
const SIM_BAN_DAY = 5; // primer dia sense enquestes publicades
const SIM_SLOTS = [
  { k: "mati", label: "Matí", icon: "☀️" },
  { k: "tarda", label: "Tarda", icon: "🌤️" },
  { k: "vespre", label: "Vespre", icon: "🌙" },
];

// Instituts d'enquestes (inventats). Cada un té el seu biaix («efecte de la casa»), que es fixa a cada partida.
const SIM_POLLSTERS = [
  { k: "agora", name: "Àgora Dades", sample: 1200 },
  { k: "nord", name: "Baròmetre Nord", sample: 1800 },
  { k: "plural", name: "Mostra Plural", sample: 1000 },
  { k: "i360", name: "Indicador 360", sample: 2400 },
];

// Energia del candidat (0-100). Cansat, rendeix menys i té més risc de relliscar.
const SIM_ENERGY = { max: 100, night: 34, rest: 26, tired: 35, exhausted: 18 };

// [nom (com a PROVINCES), codi, comunitat, població, identitat territorial, urbanització, envelliment, renda] (0-1)
const SIM_PROV_RAW = [
  ["Madrid", "M", "Madrid", 7201554, 0.02, 0.95, 0.35, 0.9],
  ["Barcelona", "B", "Catalunya", 6028373, 0.65, 0.9, 0.4, 0.8],
  ["València", "V", "C. Valenciana", 2827263, 0.2, 0.8, 0.45, 0.55],
  ["Alacant", "A", "C. Valenciana", 2099866, 0.1, 0.75, 0.5, 0.45],
  ["Sevilla", "SE", "Andalusia", 2004487, 0.08, 0.75, 0.4, 0.4],
  ["Màlaga", "MA", "Andalusia", 1820507, 0.06, 0.8, 0.4, 0.4],
  ["Múrcia", "MU", "Múrcia", 1616189, 0.05, 0.7, 0.3, 0.4],
  ["Cadis", "CA", "Andalusia", 1267916, 0.08, 0.75, 0.4, 0.3],
  ["Illes Balears", "PM", "Balears", 1266279, 0.35, 0.7, 0.3, 0.7],
  ["Biscaia", "BI", "País Basc", 1174948, 0.75, 0.85, 0.6, 0.8],
  ["la Corunya", "C", "Galícia", 1146768, 0.4, 0.6, 0.65, 0.55],
  ["Las Palmas", "GC", "Canàries", 1182281, 0.35, 0.8, 0.35, 0.35],
  ["Astúries", "O", "Astúries", 1026726, 0.12, 0.65, 0.85, 0.55],
  ["Granada", "GR", "Andalusia", 959738, 0.08, 0.55, 0.45, 0.35],
  ["Pontevedra", "PO", "Galícia", 952060, 0.4, 0.6, 0.6, 0.5],
  ["Santa Cruz de Tenerife", "TF", "Canàries", 1095424, 0.35, 0.7, 0.4, 0.35],
  ["Saragossa", "Z", "Aragó", 1017449, 0.12, 0.75, 0.5, 0.65],
  ["Almeria", "AL", "Andalusia", 788934, 0.05, 0.55, 0.25, 0.35],
  ["Còrdova", "CO", "Andalusia", 772913, 0.08, 0.55, 0.5, 0.3],
  ["Girona", "GI", "Catalunya", 840086, 0.85, 0.5, 0.35, 0.7],
  ["Guipúscoa", "SS", "País Basc", 736532, 0.85, 0.7, 0.55, 0.85],
  ["Tarragona", "T", "Catalunya", 897391, 0.6, 0.6, 0.4, 0.65],
  ["Toledo", "TO", "Castella-la Manxa", 779103, 0.03, 0.4, 0.4, 0.45],
  ["Badajoz", "BA", "Extremadura", 667584, 0.05, 0.4, 0.55, 0.25],
  ["Cantàbria", "S", "Cantàbria", 599056, 0.1, 0.55, 0.6, 0.55],
  ["Castelló", "CS", "C. Valenciana", 647819, 0.2, 0.55, 0.45, 0.55],
  ["Ciudad Real", "CR", "Castella-la Manxa", 500441, 0.03, 0.4, 0.5, 0.35],
  ["Huelva", "H", "Andalusia", 543302, 0.06, 0.5, 0.4, 0.3],
  ["Jaén", "J", "Andalusia", 620254, 0.06, 0.4, 0.55, 0.25],
  ["Navarra", "NA", "Navarra", 692026, 0.45, 0.55, 0.45, 0.8],
  ["Valladolid", "VA", "Castella i Lleó", 536425, 0.05, 0.65, 0.6, 0.6],
  ["Àlaba", "VI", "País Basc", 345912, 0.55, 0.7, 0.5, 0.85],
  ["Albacete", "AB", "Castella-la Manxa", 394702, 0.03, 0.5, 0.45, 0.4],
  ["Burgos", "BU", "Castella i Lleó", 367864, 0.05, 0.5, 0.65, 0.6],
  ["Càceres", "CC", "Extremadura", 388265, 0.05, 0.35, 0.7, 0.3],
  ["Lleó", "LE", "Castella i Lleó", 450910, 0.2, 0.45, 0.8, 0.45],
  ["Lleida", "L", "Catalunya", 467938, 0.75, 0.4, 0.45, 0.6],
  ["Lugo", "LU", "Galícia", 328547, 0.35, 0.3, 0.9, 0.45],
  ["Ourense", "OR", "Galícia", 307119, 0.3, 0.35, 0.95, 0.4],
  ["La Rioja", "LO", "La Rioja", 330756, 0.05, 0.5, 0.5, 0.65],
  ["Salamanca", "SA", "Castella i Lleó", 331264, 0.05, 0.45, 0.7, 0.45],
  ["Àvila", "AV", "Castella i Lleó", 162743, 0.03, 0.3, 0.75, 0.4],
  ["Conca", "CU", "Castella-la Manxa", 201233, 0.03, 0.25, 0.7, 0.35],
  ["Guadalajara", "GU", "Castella-la Manxa", 293762, 0.03, 0.45, 0.3, 0.6],
  ["Osca", "HU", "Aragó", 234361, 0.15, 0.3, 0.6, 0.6],
  ["Palència", "P", "Castella i Lleó", 160620, 0.05, 0.35, 0.75, 0.5],
  ["Segòvia", "SG", "Castella i Lleó", 161261, 0.05, 0.35, 0.6, 0.55],
  ["Terol", "TE", "Aragó", 137488, 0.15, 0.2, 0.75, 0.5],
  ["Zamora", "ZA", "Castella i Lleó", 165510, 0.05, 0.25, 0.95, 0.4],
  ["Sòria", "SO", "Castella i Lleó", 90559, 0.05, 0.25, 0.85, 0.55],
  ["Ceuta", "CE", "Ceuta", 84435, 0.02, 0.9, 0.2, 0.3],
  ["Melilla", "ML", "Melilla", 86616, 0.02, 0.9, 0.15, 0.3],
];

const SIM_PROVS = SIM_PROV_RAW.map(([name, code, ccaa, pop, ter, urb, age, inc], i) => ({
  i, name, code, ccaa, pop, ter, urb, age, inc,
  seats: (typeof PROVINCES !== "undefined" ? PROVINCES.find((p) => p.name === name)?.seats : null) ?? null,
}));

// Tipus de votant. Posició als 3 eixos (0-10): eco (0 més Estat · 10 més mercat), ter (0 centralisme · 10 sobiranisme),
// val (0 progressista · 10 conservador). «sal»: pes de cada tema (ordre de SIM_THEMES). «turn»: participació base.
const SIM_SEGMENTS = [
  { k: "urb", label: "Urbà progressista", eco: 3, val: 2.5, sal: [0.8, 0.3, 0.2, 0.3, 0.2, 0.9, 0.6, 0.1], turn: 0.75 },
  { k: "ind", label: "Treballador industrial", eco: 3.5, val: 5, sal: [0.6, 0.7, 0.5, 0.2, 0.4, 0.2, 0.6, 0.3], turn: 0.65 },
  { k: "mid", label: "Classe mitjana moderada", eco: 6, val: 5, sal: [0.4, 0.9, 0.4, 0.3, 0.3, 0.3, 0.5, 0.4], turn: 0.78 },
  { k: "rur", label: "Món rural", eco: 6.5, val: 8, sal: [0.2, 0.6, 0.6, 0.4, 0.6, 0.2, 0.5, 0.6], turn: 0.72 },
  { k: "jov", label: "Jovent", eco: 3, val: 3, sal: [1, 0.5, 0.1, 0.2, 0.3, 0.6, 0.4, 0.2], turn: 0.55 },
  { k: "jub", label: "Gent gran", eco: 4.5, val: 6.5, sal: [0.2, 0.4, 1, 0.3, 0.4, 0.2, 0.8, 0.5], turn: 0.82 },
  { k: "act", label: "Esquerra activista", eco: 1.5, ter: 5, val: 1.5, sal: [1, 0.3, 0.3, 0.3, 0.4, 1, 0.7, 0.1], turn: 0.72 },
  { k: "dre", label: "Dreta identitària", eco: 7.5, ter: 0.5, val: 9, sal: [0.3, 0.5, 0.4, 0.8, 1, 0.1, 0.3, 1], turn: 0.72 },
  { k: "sob", label: "Sobiranista", eco: 4.5, ter: 9, val: 4, sal: [0.4, 0.5, 0.3, 1, 0.2, 0.4, 0.5, 0.2], turn: 0.78 },
];

// Pes de cada tipus de votant a una província, segons els seus atributs
function simSegmentWeights(p) {
  const w = {
    urb: p.urb * (1 - p.age) * 0.9 + p.inc * 0.25,
    ind: (1 - p.inc) * p.urb * 0.8,
    mid: 0.55 + p.inc * 0.3,
    rur: (1 - p.urb) * 1.2,
    jov: (1 - p.age) * p.urb * 0.7,
    jub: p.age * 1.1,
    act: 0.06 + p.urb * (1 - p.age) * 0.25,
    dre: 0.1 + (1 - p.ter) * 0.12 + p.age * 0.05,
    sob: p.ter >= 0.3 ? p.ter * 1.2 : 0,
  };
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => { w[k] /= sum; });
  return w;
}

// Partits rivals: els partits reals que es presenten al 29N (PARTIES, a js/partits.js), amb el seu candidat.
// Posició: eix econòmic = esquerra-dreta del comparador (x) i eix territorial = el del comparador (y).
// L'eix de valors i el pes de cada tema són aproximacions a partir de les idees de cada partit.
// Tots els candidats tenen la mateixa valoració de líder: el joc no jutja ningú.
// «base»: arrelament ajustat perquè, sense campanya, la partida comenci amb els resultats de les generals del 2023
// (Frente Amplio i Podemos es reparteixen el resultat de Sumar segons els escons de cada grup; SALF, que no s'hi va
// presentar, parteix del resultat de les europees del 2024). El que fan durant la partida és ficció.
// «rural»: correcció d'implantació (positiva, més forts a les províncies rurals; negativa, a les urbanes), ajustada
// juntament amb «base» perquè el punt de partida reprodueixi també els escons del 2023 dels quatre grans partits estatals.
// «ccaa»: comunitats on es presenta (si no hi és, a tot l'Estat).
const SIM_REAL_PROFILE = {
  pp: { val: 6.8, iss: [0.6, 0.9, 0.6, 0.7, 0.6, 0.3, 0.6, 0.7], style: "big", base: 0.11, rural: -1.79 },
  psoe: { val: 3.2, iss: [0.8, 0.6, 0.8, 0.5, 0.4, 0.6, 0.9, 0.3], style: "big", base: 0.03, rural: 0.28 },
  vox: { val: 9.2, iss: [0.4, 0.6, 0.5, 0.9, 1, 0.1, 0.3, 1], style: "mid", base: 1.02, rural: -3 },
  fa: { val: 2, iss: [1, 0.5, 0.6, 0.5, 0.4, 0.9, 0.8, 0.1], style: "urban", base: -0.07, rural: 1.86 },
  podemos: { val: 1.5, iss: [1, 0.6, 0.6, 0.6, 0.5, 0.8, 0.7, 0.1], style: "urban", base: -1.16 },
  erc: { val: 2.8, iss: [0.6, 0.5, 0.5, 1, 0.3, 0.5, 0.6, 0.2], style: "own", ccaa: ["Catalunya"], base: -1.74 },
  junts: { val: 5.5, iss: [0.4, 0.7, 0.4, 1, 0.6, 0.3, 0.4, 0.4], style: "own", ccaa: ["Catalunya"], base: -1.42 },
  bildu: { val: 2.5, iss: [0.7, 0.4, 0.6, 1, 0.3, 0.5, 0.6, 0.2], style: "own", ccaa: ["País Basc", "Navarra"], base: 2.44 },
  pnv: { val: 5, iss: [0.4, 0.8, 0.6, 1, 0.3, 0.4, 0.6, 0.4], style: "own", ccaa: ["País Basc"], base: -0.05 },
  bng: { val: 2.5, iss: [0.6, 0.4, 0.6, 1, 0.3, 0.6, 0.6, 0.2], style: "own", ccaa: ["Galícia"], base: -1.11 },
  cc: { val: 5, iss: [0.5, 0.7, 0.5, 1, 0.6, 0.3, 0.6, 0.3], style: "own", ccaa: ["Canàries"], base: -0.88 },
  salf: { val: 8.5, iss: [0.3, 0.6, 0.3, 0.4, 0.8, 0.1, 0.3, 1], style: "mid", base: -0.12 },
};
// Punt de partida de cada partit (% dels vots vàlids a tot l'Estat): vegeu el comentari de dalt
// Vot fidel: els partits reals tenen un electorat que ja els coneix i els vota. Afegeix el mateix arrelament a tots,
// de manera que no canvia el punt de partida entre ells, però fa que a un partit nou li costi créixer.
const SIM_LOYALTY = 0.8;
const SIM_START_SHARE = { pp: 33.1, psoe: 31.7, vox: 12.4, fa: 10.7, podemos: 1.6, erc: 1.9, junts: 1.6, bildu: 1.4, pnv: 1.1, bng: 0.6, cc: 0.5, salf: 4.6 };
// Escons del 2023, per comparar-hi a la nit electoral (Sumar es reparteix entre Frente Amplio i Podemos segons els diputats de cada grup)
const SIM_SEATS_2023 = { pp: 137, psoe: 121, vox: 33, fa: 27, podemos: 4, erc: 7, junts: 7, bildu: 6, pnv: 5, bng: 1, cc: 1, salf: 0 };
const SIM_RIVALS = (typeof PARTIES !== "undefined" ? PARTIES : []).filter((p) => SIM_REAL_PROFILE[p.id]).map((p) => {
  const R = SIM_REAL_PROFILE[p.id];
  return {
    id: p.id, name: p.name, sig: p.sig, color: p.color, cand: p.cand?.name || null,
    eco: p.x, ter: p.y, val: R.val, iss: R.iss, lead: 0.55, style: R.style, base: R.base + SIM_LOYALTY, rural: R.rural || 0, ...(R.ccaa ? { ccaa: R.ccaa } : {}),
    desc: p.ideas.slice(0, 2).join(" · "),
  };
});

// Partits que pot triar el jugador (noms inventats) i colors: cap no es confon amb el d'un partit real
const SIM_PARTY_NAMES = ["Nova Plaça", "Gent Endavant", "Força Comuna", "Acord Ciutadà", "Veus Lliures", "Horitzó", "Partit del Futur", "Pont", "Moviment Obert", "Aliança Verda", "Raó Pública", "Arrels"];
const SIM_COLORS = ["#17173d", "#ff8a65", "#b39ddb", "#8d8f2c", "#5c6b7a", "#c39a5f", "#8fe3c8"];

// Dificultats
const SIM_DIFF = {
  facil: { label: "Fàcil", money: 130, aw: 0.45, rival: 0.7, noise: 0.1 },
  normal: { label: "Normal", money: 100, aw: 0.32, rival: 1, noise: 0.15 },
  dificil: { label: "Difícil", money: 80, aw: 0.24, rival: 1.3, noise: 0.2 },
};

// ---------- Del vot al govern: mesures que es poden posar sobre la taula ----------
// Cada mesura té un tema (índex de SIM_THEMES), l'eix on es nota i la seva posició (0-10).
// Un partit la valora segons la distància a la seva posició; si és molt lluny en un tema que li importa, és una línia vermella.
const SIM_MEASURES = [
  { id: "hab1", th: 0, ax: "eco", p: 2, t: "Topall als lloguers i un gran parc d'habitatge públic" },
  { id: "hab2", th: 0, ax: "eco", p: 5, t: "Ajuts al lloguer per al jovent" },
  { id: "hab3", th: 0, ax: "eco", p: 8.5, t: "Alliberar sòl i abaixar impostos a la construcció" },
  { id: "eco1", th: 1, ax: "eco", p: 1.5, t: "Un impost a les grans fortunes" },
  { id: "eco2", th: 1, ax: "eco", p: 5, t: "Un pla contra el frau fiscal" },
  { id: "eco3", th: 1, ax: "eco", p: 8.5, t: "Una rebaixa general de l'IRPF" },
  { id: "pen1", th: 2, ax: "eco", p: 2.5, t: "Pujar les pensions amb més cotitzacions de les rendes altes" },
  { id: "pen2", th: 2, ax: "eco", p: 5, t: "Una reforma de pensions pactada al Pacte de Toledo" },
  { id: "pen3", th: 2, ax: "eco", p: 8, t: "Incentius als plans de pensions privats" },
  { id: "ter1", th: 3, ax: "ter", p: 9.5, t: "Un referèndum pactat d'autodeterminació" },
  { id: "ter2", th: 3, ax: "ter", p: 7, t: "Un finançament singular i més autogovern" },
  { id: "ter3", th: 3, ax: "ter", p: 1, t: "Recuperar competències per a l'Estat" },
  { id: "imm1", th: 4, ax: "val", p: 2, t: "Una regularització extraordinària d'immigrants" },
  { id: "imm2", th: 4, ax: "val", p: 5, t: "Vies legals d'immigració lligades al treball" },
  { id: "imm3", th: 4, ax: "val", p: 9, t: "Més control de fronteres i més expulsions" },
  { id: "cli1", th: 5, ax: "val", p: 2, t: "Tancar abans les centrals de combustibles fòssils" },
  { id: "cli2", th: 5, ax: "val", p: 5, t: "Una transició energètica gradual amb ajuts a la indústria" },
  { id: "cli3", th: 5, ax: "val", p: 8.5, t: "Una moratòria a les noves normes ambientals" },
  { id: "ser1", th: 6, ax: "eco", p: 2, t: "Blindar la sanitat pública i reduir els concerts privats" },
  { id: "ser2", th: 6, ax: "eco", p: 5, t: "Un pla de xoc contra les llistes d'espera" },
  { id: "ser3", th: 6, ax: "eco", p: 8.5, t: "El xec escolar i la lliure elecció de centre" },
  { id: "seg1", th: 7, ax: "val", p: 2.5, t: "Més prevenció i programes de reinserció" },
  { id: "seg2", th: 7, ax: "val", p: 5.5, t: "Més policia de proximitat i una justícia més àgil" },
  { id: "seg3", th: 7, ax: "val", p: 9, t: "Enduriment del Codi Penal" },
];

// Fórmules de suport a un govern (de més a menys compromís)
const SIM_ROLES = {
  coal: { label: "Govern de coalició", short: "Coalició", bonus: 0.5, text: "Entra al Govern amb ministeris." },
  leg: { label: "Acord de legislatura", short: "Acord", bonus: 0.3, text: "Suport estable des del Parlament." },
  inv: { label: "Només la investidura", short: "Puntual", bonus: 0.1, text: "Vota la investidura i prou." },
};

// Modes del simulador
const SIM_MODE_INFO = {
  express: { label: "Campanya exprés", mins: 10 },
  govern: { label: "Del vot al govern", mins: 25 },
  legislatura: { label: "Legislatura", mins: 40 },
  duel: { label: "Duel de campanya", mins: 10 },
};

// Partit del duel de campanya: el mateix per als dos jugadors, generat a partir de la llavor
function simDailyParty(seed) {
  const rng = simMulberry(simHash(`${seed}|partit`));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const name = pick(SIM_PARTY_NAMES);
  const sig = name.split(/\s+/).filter((w) => /^[A-ZÀ-ÚÇ]/.test(w)).map((w) => w[0]).join("").toUpperCase().slice(0, 4);
  const prio = [];
  while (prio.length < 3) { const t = Math.floor(rng() * SIM_THEMES.length); if (!prio.includes(t)) prio.push(t); }
  // Atributs del líder entre 1 i 5 que sumen 9
  const car = 1 + Math.floor(rng() * 5), lo = Math.max(1, 4 - car), hi = Math.min(5, 8 - car);
  const sol = lo + Math.floor(rng() * (hi - lo + 1));
  const r1 = (a, b) => Math.round((a + rng() * (b - a)) * 10) / 10;
  return {
    name, sig: sig.length >= 2 ? sig : name.slice(0, 3).toUpperCase(), color: pick(SIM_COLORS),
    eco: r1(2, 8), ter: r1(1, 8.5), val: r1(2, 8), prio, attrs: { car, sol, prox: 9 - car - sol },
  };
}
