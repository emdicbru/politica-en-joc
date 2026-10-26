// Simulador del 29N · Titulars del teletip i de l'informatiu del vespre.
// Són genèrics i neutres: expliquen què fan els partits a la partida (actes, anuncis, enquestes del joc), mai no els
// atribueixen declaracions, fets ni escàndols inventats. {sig}, {prov}... es substitueixen amb les dades de la partida.

const SIM_NEWS_T = {
  start: ["Comença la campanya: {n} candidatures es disputen els 350 escons", "Arrenca la campanya del 29N: quinze dies per convèncer"],
  start2: ["Comença la campanya de les eleccions següents", "Tornen les urnes: nova campanya electoral"],
  miting: ["{sig} fa un míting a {prov}", "{sig} porta la campanya a {prov}", "Acte de {sig} a {prov}"],
  mitingGran: ["{sig} omple un pavelló a {prov}", "Gran míting de {sig} a {prov}", "Ple a vessar a l'acte de {sig} a {prov}"],
  porta: ["La militància de {sig} fa porta a porta a {prov}", "{sig} busca el vot casa per casa a {prov}"],
  xarxes: ["La campanya de {sig} a les xarxes es fa notar", "{sig} omple les xarxes de vídeos de campanya"],
  xarxesKo: ["Un missatge de {sig} a les xarxes aixeca polèmica", "Polèmica a les xarxes per un vídeo de {sig}"],
  anuncis: ["{sig} omple els carrers de cartells", "{sig} llança una campanya de publicitat", "Les falques de {sig} sonen a totes les ràdios"],
  candidat: ["{sig} presenta un candidat conegut a {prov}", "Fitxatge de {sig} per a la llista de {prov}"],
  agenda: ["{sig} vol posar {theme} al centre del debat", "{sig} fa bandera de {theme}"],
  atac: ["{sig} carrega contra {target}", "Contrast dur de {sig} amb {target}"],
  atacKo: ["Els retrets de {sig} a {target} es giren en contra", "La crítica de {sig} a {target} no convenç"],
  coalicio: ["{sig} anirà en coalició amb una candidatura local a {ccaa}", "Acord electoral de {sig} a {ccaa}"],
  matisar: ["{sig} matisa la seva posició en {axis}", "Gir de {sig} cap al centre en {axis}"],
  relliscada: ["Relliscada de {who} en un acte de campanya", "El cansament juga una mala passada a {who}"],
  tema: ["Tema del dia: {theme}", "{theme}, al centre de la campanya", "La campanya parla avui de {theme}"],
  temaXoc: ["L'actualitat imposa un tema: {theme}", "Un informe sobre {theme} obre tots els informatius"],
  temaMeu: ["{sig} aconsegueix que es parli de {theme}", "La campanya parla del tema de {sig}: {theme}"],
  reflexio: ["Jornada de reflexió: avui no es pot demanar el vot", "S'acaba la campanya: arriba la jornada de reflexió"],
  veda: ["Comença la prohibició de publicar enquestes", "Des d'avui, cap enquesta publicada fins a la nit electoral"],
  enquesta: ["Enquesta {pollster}: {lead} lidera amb el {x} %", "{pollster}: {lead}, primera força amb el {x} %"],
  puja: ["{sig} s'enfila a les enquestes", "Les enquestes somriuen a {sig}"],
  baixa: ["{sig} perd pistonada a les enquestes", "Les enquestes castiguen {sig}"],
  debatMeu: ["Els analistes donen {sig} com a guanyador del debat", "{sig} surt reforçat del debat"],
  debatRival: ["Els analistes donen {sig} com a guanyador del debat", "{sig} domina el debat electoral"],
  entrevista: ["Entrevista de {who} a {outlet}: propostes clares", "{who} convenç en una entrevista a {outlet}"],
  entrevistaKo: ["Entrevista complicada de {who} a {outlet}", "{who} trontolla en una entrevista a {outlet}"],
  forum: ["{sig} parla davant {forum}", "{sig} visita {forum}"],
  caraMeu: ["{sig} guanya el cara a cara contra {rival}", "Cara a cara: {sig} supera {rival}"],
  caraRival: ["{rival} guanya el cara a cara contra {sig}", "Cara a cara: {rival} s'imposa a {sig}"],
  replica: ["{sig} replica a {rival} amb dades", "La rèplica de {sig} a {rival} té ressò"],
  replicaKo: ["L'estirada entre {sig} i {rival} acaba malament per a {sig}", "La rèplica de {sig} a {rival} no convenç"],
  rivMiting: ["{sig} fa campanya a {prov}", "Acte de {sig} a {prov}", "{sig} porta la caravana a {prov}"],
  rivMitingGran: ["Gran míting de {sig} a {prov}", "{sig} omple un pavelló a {prov}"],
  rivEsco: ["{sig} es bolca a {prov}, on es juga un escó", "{sig} s'hi juga un escó i fa campanya a {prov}"],
  rivRuta: ["{sig} fa una ruta per {ccaa}", "La caravana de {sig} recorre {ccaa}"],
  rivAnuncis: ["{sig} llança una campanya de publicitat", "{sig} reforça la campanya amb cartells i falques de ràdio"],
  rivAgenda: ["{sig} centra la campanya en {theme}", "{sig} vol que es parli de {theme}"],
  rivAtacJo: ["{sig} carrega contra {me}", "{sig} demana no votar {me}", "{sig} assenyala {me} com a vot perdut"],
  rivAtac: ["{sig} i {target} es disputen els mateixos votants", "Estirada entre {sig} i {target}"],
  rivFitxatge: ["{sig} presenta un candidat conegut a {prov}", "{sig} reforça la llista de {prov}"],
  rivRepte: ["{sig} repta {me} a un cara a cara", "{sig} vol un cara a cara amb {me}"],
  event: ["{title}"],
};

// Sigles que porten article, com les escriu la premsa (el PP, el PSOE, el PNV, el BNG); la resta, sense
const SIM_ART = { pp: "el", psoe: "el", pnv: "el", bng: "el" };
const simThe = (p) => (p && SIM_ART[p.id] ? `${SIM_ART[p.id]} ${p.sig}` : p?.sig || "");
// Territoris que, dins d'una frase, porten article
const SIM_PLACE_ART = [["País Vasco", "el País Basc"], ["C. Valenciana", "la Comunitat Valenciana"], ["Canarias", "les Canàries"], ["Islas Baleares", "les Illes Balears"], ["Baleares", "les Illes Balears"], ["La Rioja", "la Rioja"]];
const simReEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SIM_PLACE_RE = new RegExp(`(^|[^\\p{L}])(a|de|per|en|amb) (${SIM_PLACE_ART.map(([k]) => simReEsc(k)).join("|")})(?!\\p{L})`, "gu");
// Retoca una frase feta amb peces: articles dels territoris, contraccions (a el → al, de els → dels, per el → pel),
// apostrofació (de ERC → d'ERC) i majúscula inicial
function simGram(t) {
  let s = String(t).replace(SIM_PLACE_RE, (m, b, p, n) => `${b}${p} ${SIM_PLACE_ART.find(([k]) => k === n)[1]}`);
  s = s.replace(/(^|[^\p{L}'])(a|A|de|De|per|Per) (el|els) /gu, (m, b, p, a) => `${b}${p.toLowerCase() === "per" ? p.slice(0, 2) : p}${a.slice(1)} `);
  if (typeof PEJ_LANG === "undefined" || PEJ_LANG !== "es") s = s.replace(/(^|[^\p{L}'])([Dd])e (?=[aeiouàèéíòóúAEIOUÀÈÉÍÒÓÚ]|[hH][aeiouàèéíòóú])/gu, "$1$2'");
  return s.replace(/^\p{Ll}/u, (c) => c.toUpperCase());
}

// Titular: tria una de les variants (sempre la mateixa per a la mateixa partida i el mateix moment) i hi posa les dades.
// Les sigles dels partits hi van amb l'article que els toca.
function simNewsText(key, state, vars = {}) {
  const list = SIM_NEWS_T[key] || [key];
  const rng = simMulberry(simHash(`${state.seed}|n|${(state.news || []).length}|${key}`));
  const big = key === "miting" && vars.big ? SIM_NEWS_T.mitingGran : null;
  const pool = big || list;
  const t = pool[Math.floor(rng() * pool.length)];
  const parties = [state.me, ...(state.rivals || [])].filter(Boolean);
  const all = { n: (state.rivals?.length || 0) + 1, ...vars };
  ["sig", "target", "rival", "me", "lead"].forEach((k) => { const p = parties.find((x) => x.sig === all[k]); if (p) all[k] = simThe(p); });
  return simGram(t.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? String(all[k]) : m)));
}
