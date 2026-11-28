// Simulador del 29N · Titulars del teletip i de l'informatiu del vespre.
// Són genèrics i neutres: expliquen què fan els partits a la partida (actes, anuncis, enquestes del joc), mai no els
// atribueixen declaracions, fets ni escàndols inventats. {sig}, {prov}... es substitueixen amb les dades de la partida.

const SIM_NEWS_T = {
  start: ["Empieza la campaña: {n} candidaturas se disputan los 350 escaños", "Arranca la campaña del 29N: quince días para convencer"],
  start2: ["Empieza la campaña de las siguientes elecciones", "Vuelven las urnas: nueva campaña electoral"],
  miting: ["{sig} da un mitin en {prov}", "{sig} lleva la campaña a {prov}", "Acto de {sig} en {prov}"],
  mitingGran: ["{sig} llena un pabellón en {prov}", "Gran mitin de {sig} en {prov}", "Lleno total en el acto de {sig} en {prov}"],
  porta: ["La militancia de {sig} hace puerta a puerta en {prov}", "{sig} busca el voto casa por casa en {prov}"],
  xarxes: ["La campaña de {sig} en las redes se hace notar", "{sig} llena las redes de vídeos de campaña"],
  xarxesKo: ["Un mensaje de {sig} en las redes levanta polémica", "Polémica en las redes por un vídeo de {sig}"],
  anuncis: ["{sig} llena las calles de carteles", "{sig} lanza una campaña de publicidad", "Las cuñas de {sig} suenan en todas las radios"],
  candidat: ["{sig} presenta a un candidato conocido en {prov}", "Fichaje de {sig} para la lista de {prov}"],
  agenda: ["{sig} quiere poner {theme} en el centro del debate", "{sig} hace bandera de {theme}"],
  atac: ["{sig} carga contra {target}", "Duro choque de {sig} con {target}"],
  atacKo: ["Los reproches de {sig} a {target} se vuelven en su contra", "La crítica de {sig} a {target} no convence"],
  coalicio: ["{sig} irá en coalición con una candidatura local en {ccaa}", "Acuerdo electoral de {sig} en {ccaa}"],
  matisar: ["{sig} matiza su posición en {axis}", "Giro de {sig} hacia el centro en {axis}"],
  relliscada: ["Resbalón de {who} en un acto de campaña", "El cansancio le juega una mala pasada a {who}"],
  tema: ["Tema del día: {theme}", "{theme}, en el centro de la campaña", "La campaña habla hoy de {theme}"],
  temaXoc: ["La actualidad impone un tema: {theme}", "Un informe sobre {theme} abre todos los informativos"],
  temaMeu: ["{sig} consigue que se hable de {theme}", "La campaña habla del tema de {sig}: {theme}"],
  reflexio: ["Jornada de reflexión: hoy no se puede pedir el voto", "Se acaba la campaña: llega la jornada de reflexión"],
  veda: ["Empieza la prohibición de publicar encuestas", "Desde hoy, ninguna encuesta publicada hasta la noche electoral"],
  enquesta: ["Encuesta {pollster}: {lead} lidera con el {x} %", "{pollster}: {lead}, primera fuerza con el {x} %"],
  puja: ["{sig} sube en las encuestas", "Las encuestas sonríen a {sig}"],
  baixa: ["{sig} pierde fuelle en las encuestas", "Las encuestas castigan a {sig}"],
  debatMeu: ["Los analistas dan a {sig} como ganador del debate", "{sig} sale reforzado del debate"],
  debatRival: ["Los analistas dan a {sig} como ganador del debate", "{sig} domina el debate electoral"],
  entrevista: ["Entrevista de {who} en {outlet}: propuestas claras", "{who} convence en una entrevista en {outlet}"],
  entrevistaKo: ["Entrevista complicada de {who} en {outlet}", "{who} titubea en una entrevista en {outlet}"],
  forum: ["{sig} habla ante {forum}", "{sig} visita {forum}"],
  caraMeu: ["{sig} gana el cara a cara contra {rival}", "Cara a cara: {sig} supera a {rival}"],
  caraRival: ["{rival} gana el cara a cara contra {sig}", "Cara a cara: {rival} se impone a {sig}"],
  replica: ["{sig} replica a {rival} con datos", "La réplica de {sig} a {rival} tiene eco"],
  replicaKo: ["El rifirrafe entre {sig} y {rival} acaba mal para {sig}", "La réplica de {sig} a {rival} no convence"],
  rivMiting: ["{sig} hace campaña en {prov}", "Acto de {sig} en {prov}", "{sig} lleva la caravana a {prov}"],
  rivMitingGran: ["Gran mitin de {sig} en {prov}", "{sig} llena un pabellón en {prov}"],
  rivEsco: ["{sig} se vuelca en {prov}, donde se juega un escaño", "{sig} se juega un escaño y hace campaña en {prov}"],
  rivRuta: ["{sig} hace una ruta por {ccaa}", "La caravana de {sig} recorre {ccaa}"],
  rivAnuncis: ["{sig} lanza una campaña de publicidad", "{sig} refuerza la campaña con carteles y cuñas de radio"],
  rivAgenda: ["{sig} centra la campaña en {theme}", "{sig} quiere que se hable de {theme}"],
  rivAtacJo: ["{sig} carga contra {me}", "{sig} pide no votar a {me}", "{sig} señala a {me} como voto perdido"],
  rivAtac: ["{sig} y {target} se disputan los mismos votantes", "Rifirrafe entre {sig} y {target}"],
  rivFitxatge: ["{sig} presenta a un candidato conocido en {prov}", "{sig} refuerza la lista de {prov}"],
  rivRepte: ["{sig} reta a {me} a un cara a cara", "{sig} quiere un cara a cara con {me}"],
  event: ["{title}"],
};

// Sigles que porten article, com les escriu la premsa (el PP, el PSOE, el PNV, el BNG); la resta, sense
const SIM_ART = { pp: "el", psoe: "el", pnv: "el", bng: "el" };
const simThe = (p) => (p && SIM_ART[p.id] ? `${SIM_ART[p.id]} ${p.sig}` : p?.sig || "");
// Territoris que, dins d'una frase, porten article
const SIM_PLACE_ART = [["País Vasco", "el País Vasco"], ["C. Valenciana", "la Comunidad Valenciana"], ["Canarias", "Canarias"], ["Islas Baleares", "las Islas Baleares"], ["Baleares", "las Islas Baleares"], ["La Rioja", "La Rioja"]];
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
