// =========================================================
// TEST D'AFINITAT POLÍTICA (29N)
// =========================================================
// 1. Primer, on votes: només hi entren els partits que s'hi presenten, i les preguntes parlen del teu territori
//    (Catalunya, Euskadi, Galícia…) i de la seva llengua.
// 2. Unes 40 afirmacions, barrejades (mai per blocs). Cadascuna mesura un sol eix:
//    · x: d'esquerra (0) a dreta (10)
//    · y: de centralisme (0) a independentisme (10)
//    s: +1 si estar-hi d'acord porta cap a la dreta (x) o cap a l'independentisme (y); −1, al contrari.
// 3. Posició dels partits a cada afirmació, de −2 (molt en contra) a +2 (molt a favor), segons el programa, el que ha
//    votat al Congrés i les seves posicions públiques. On no és clara: null, i aquella afirmació no compta per al partit.
// És orientatiu: no és cap recomanació de vot. La CUP i Aliança Catalana no es presenten el 29N.
//
// Mètode (també s'explica a la pantalla del resultat):
//  · Afinitat: per a cada afirmació, 1 − |tu − partit| / 4 (100 % si responeu igual, 0 % als extrems oposats); les
//    marcades amb ☆ compten el doble. Mitjana de totes les que has respost i en què el partit té posició.
//  · Eixos: mitjana de s × resposta a les afirmacions de cada eix (de −2 a +2), passada a 0–10: 5 + 2,5 × mitjana.
//    Els partits es col·loquen amb el mateix càlcul a partir de les seves posicions.
const ASSEMBLA_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc", "salf"];

// On votes. name: com surt al selector · label: dins d'una frase · sub: «de …» · note: «a …» · text: la llengua
// pròpia (amb l'article) · short: la llengua sense article. (Noms de camp que l'eina de traducció reconeix com a text.)
const ASSEMBLA_TERR = {
  cat: { name: "Cataluña", label: "Cataluña", sub: "de Cataluña", note: "en Cataluña", text: "el catalán", short: "catalán", police: "Los Mossos d'Esquadra", parties: ["psoe", "pp", "vox", "fa", "podemos", "erc", "junts", "salf"] },
  eus: { name: "País Vasco", label: "Euskadi", sub: "de Euskadi", note: "en Euskadi", text: "el euskera", short: "euskera", police: "La Ertzaintza", parties: ["psoe", "pp", "vox", "fa", "podemos", "bildu", "pnv", "salf"] },
  nav: { name: "Navarra", label: "Navarra", sub: "de Navarra", note: "en Navarra", text: "el euskera", short: "euskera", police: "La Policía Foral", parties: ["psoe", "pp", "vox", "fa", "podemos", "bildu", "pnv", "salf"] },
  gal: { name: "Galicia", label: "Galicia", sub: "de Galicia", note: "en Galicia", text: "el gallego", short: "gallego", parties: ["psoe", "pp", "vox", "fa", "podemos", "bng", "salf"] },
  pv: { name: "Comunitat Valenciana", label: "la Comunitat Valenciana", sub: "de la Comunitat Valenciana", note: "en la Comunitat Valenciana", text: "el valenciano", short: "valenciano", parties: ["psoe", "pp", "vox", "fa", "podemos", "salf"] },
  ib: { name: "Islas Baleares", label: "las Islas Baleares", sub: "de las Islas Baleares", note: "en las Islas Baleares", text: "el catalán", short: "catalán", parties: ["psoe", "pp", "vox", "fa", "podemos", "salf"] },
  can: { name: "Canarias", label: "Canarias", sub: "de Canarias", note: "en Canarias", parties: ["psoe", "pp", "vox", "fa", "podemos", "cc", "salf"] },
  resta: { name: "Resto del Estado", parties: ["psoe", "pp", "vox", "fa", "podemos", "salf"] },
};
const ASSEMBLA_TERR_KEY = "r29n-terr";
const ASSEMBLA_LANG = ["cat", "eus", "nav", "gal", "pv", "ib"]; // territoris amb llengua pròpia oficial

// b: bloc (només per barrejar-les bé) · t: tema · q: el text, amb {T} {deT} {aT} {L} {Lb} · v: textos per territori
// (null: no surt en aquell territori) · o: opcions pròpies, de −2 a +2 · p: posició de cada partit (ASSEMBLA_PARTIES)
//                                                                  pp  psoe  vox   fa  pod  erc junts bildu pnv  bng   cc  salf
const ASSEMBLA_ITEMS = [
  // ---- Nació i autogovern (eix y)
  { id: "relacio", b: "nac", t: "Modelo territorial", ax: "y", s: 1, q: "¿Qué relación debería tener {T} con España?",
    o: ["Menos autogobierno o un Estado centralizado", "Como ahora", "Más autogobierno dentro del Estado de las autonomías", "Un Estado federal o confederal", "Un Estado independiente"],
    v: { resta: "¿Cómo debería organizarse territorialmente el Estado?" },
    ov: { resta: ["Un Estado centralizado, sin autonomías o con menos competencias", "Como ahora", "Autonomías con más competencias", "Un Estado federal", "Que Cataluña, Euskadi o Galicia puedan decidir si quieren ser independientes"] },
    p: [-1, 1, -2, 1, 1, 2, 2, 2, 1, 2, 0, -1] },
  { id: "referendum", b: "nac", t: "Modelo territorial", ax: "y", s: 1, q: "Debería poder hacerse un referéndum de autodeterminación {aT}.",
    v: { resta: "Cataluña, Euskadi o Galicia deberían poder votar en un referéndum de autodeterminación." },
    p: [-2, -2, -2, 1, 2, 2, 2, 2, 1, 2, -1, -2] },
  { id: "indepe", b: "nac", t: "Modelo territorial", ax: "y", s: 1, q: "Si mañana hubiera un referéndum de independencia {aT}, votaría que sí.",
    v: { resta: null },
    p: [-2, -2, -2, -1, -1, 2, 2, 2, null, 1, -2, -2] },
  { id: "hisenda", b: "nac", t: "Financiación", ax: "y", s: 1, q: "La hacienda {deT} debería recaudar y gestionar todos los impuestos, como hacen el País Vasco y Navarra.",
    v: { eus: "Euskadi debe mantener y ampliar el concierto económico, que le permite recaudar y gestionar todos sus impuestos.", nav: "Navarra debe mantener y ampliar el convenio económico, que le permite recaudar y gestionar todos sus impuestos.", resta: "Todas las comunidades deberían poder recaudar y gestionar todos sus impuestos, como el País Vasco y Navarra." },
    p: [-2, 0, -2, 1, null, 2, 2, 2, 2, 2, 1, -2] },
  { id: "amnistia", b: "nac", t: "Modelo territorial", ax: "y", s: 1, q: "La ley de amnistía fue una buena decisión.",
    p: [-2, 2, -2, 2, 2, 2, 2, 2, 2, 2, -1, -2] },
  { id: "155", b: "nac", t: "Modelo territorial", ax: "y", s: -1, q: "El Estado debe poder intervenir una autonomía (con el artículo 155) si su gobierno desobedece la Constitución.",
    p: [2, 1, 2, -1, -2, -2, -2, -2, -1, -2, null, 2] },
  { id: "immicomp", b: "nac", t: "Inmigración", ax: "y", s: 1, q: "El gobierno {deT} debería tener todas las competencias de inmigración.",
    v: { resta: "Las comunidades autónomas deberían tener las competencias de inmigración." },
    p: [-2, 1, -2, null, -2, null, 2, null, 2, null, 1, -2] },
  { id: "policia", b: "nac", t: "Seguridad", ax: "y", s: 1, q: "Haría falta una policía propia {deT} que hiciera todas las funciones de la Policía Nacional y la Guardia Civil.",
    v: { cat: "Los Mossos d'Esquadra deberían asumir todas las funciones de la Policía Nacional y la Guardia Civil en Cataluña.", eus: "La Ertzaintza debería asumir todas las funciones de la Policía Nacional y la Guardia Civil en Euskadi.", nav: "La Policía Foral debería asumir todas las funciones de la Policía Nacional y la Guardia Civil en Navarra.", resta: null },
    p: [-2, -1, -2, null, null, 2, 2, 2, 2, 2, null, -2] },
  { id: "seleccio", b: "nac", t: "Deporte", ax: "y", s: 1, q: "Debería haber una selección deportiva {deT} en las competiciones oficiales.",
    v: { resta: null, can: null },
    p: [-2, -1, -2, 1, null, 2, 2, 2, 2, 2, null, -2] },
  // ---- Llengua i escola (eix y)
  { id: "immersio", b: "llengua", t: "Lengua", ax: "y", s: 1, q: "En la escuela, {L} debe ser la lengua vehicular principal.", only: ASSEMBLA_LANG,
    p: [-2, 1, -2, 2, 1, 2, 2, 2, 1, 2, null, -2] },
  { id: "triar", b: "llengua", t: "Lengua", ax: "y", s: -1, q: "Las familias deberían poder elegir que sus hijos estudien en castellano.", only: ASSEMBLA_LANG,
    p: [2, -1, 2, -2, -1, -2, -2, -1, null, -1, null, 2] },
  { id: "requisit", b: "llengua", t: "Lengua", ax: "y", s: 1, q: "Para trabajar en la administración {deT} se debería exigir saber {Lb}.", only: ASSEMBLA_LANG,
    p: [-2, 1, -2, 2, 1, 2, 2, 2, 1, 2, null, -2] },
  { id: "ue", b: "llengua", t: "Lengua", ax: "y", s: 1, q: "El catalán, el euskera y el gallego deben ser lenguas oficiales en la Unión Europea.",
    p: [-1, 2, -2, 2, 2, 2, 2, 2, 2, 2, null, -2] },
  // ---- Economia i privatitzacions (eix x)
  { id: "menysimpostos", b: "eco", t: "Impuestos", ax: "x", s: 1, q: "En conjunto, hay que recaudar menos impuestos y gastar menos, aunque los servicios públicos tengan menos dinero.",
    p: [1, -2, 2, -2, -2, -1, 1, -2, 0, -2, 0, 2] },
  { id: "rics", b: "eco", t: "Impuestos", ax: "x", s: -1, q: "Las rentas más altas, las grandes fortunas, la banca y las energéticas deben pagar más impuestos.",
    p: [-2, 2, -1, 2, 2, 1, -1, 2, -1, 2, null, -2] },
  { id: "baixos", b: "eco", t: "Impuestos", ax: "x", s: -1, q: "Hay que bajar los impuestos a los trabajadores con sueldos bajos y a los autónomos que ingresan poco, y compensarlo haciendo pagar más a las rentas altas.",
    p: [-1, 2, -1, 2, 2, 2, 0, 2, 0, 2, null, null] },
  { id: "successions", b: "eco", t: "Impuestos", ax: "x", s: 1, q: "Hay que suprimir los impuestos de sucesiones y de patrimonio.",
    p: [2, -2, 2, -2, -2, -2, 1, -2, -1, -2, null, 2] },
  { id: "smi", b: "eco", t: "Trabajo", ax: "x", s: -1, q: "El salario mínimo debe seguir subiendo cada año.",
    p: [-1, 2, -1, 2, 2, 2, -1, 2, 0, 2, null, null] },
  { id: "jornada", b: "eco", t: "Trabajo", ax: "x", s: -1, q: "Hay que reducir la jornada laboral a 37,5 horas semanales sin bajar el sueldo.",
    p: [-2, 2, -2, 2, 2, 2, -2, 2, null, 2, null, null] },
  { id: "gestioprivada", b: "eco", t: "Privatizaciones", ax: "x", s: 1, q: "Hay que permitir que empresas privadas gestionen hospitales, el agua o el transporte público si lo hacen más barato.",
    p: [2, -1, 2, -2, -2, -1, 1, -2, 1, -2, 1, null] },
  { id: "publicitzar", b: "eco", t: "Privatizaciones", ax: "x", s: -1, q: "Hay que recuperar para el sector público servicios privatizados, como el agua o las autopistas, y crear una empresa pública de energía.",
    p: [-2, 0, -2, 2, 2, 1, -1, 2, -1, 2, null, null] },
  { id: "pensions", b: "eco", t: "Pensiones", ax: "x", s: -1, q: "Las pensiones deben subir cada año como mínimo como el IPC, aunque haya que subir las cotizaciones.",
    p: [null, 2, null, 2, 2, 2, 0, 2, 1, 2, null, null] },
  // ---- Habitatge (eix x)
  { id: "lloguer", b: "hab", t: "Vivienda", ax: "x", s: -1, q: "Hay que limitar por ley el precio del alquiler en las zonas donde es más caro.",
    p: [-2, 2, -2, 2, 2, 2, -1, 2, null, 2, null, null] },
  { id: "turistics", b: "hab", t: "Vivienda", ax: "x", s: -1, q: "Hay que limitar mucho o prohibir los pisos turísticos en las zonas donde falta vivienda.",
    p: [-1, 1, -2, 2, 2, 2, 0, 2, 1, 2, 0, null] },
  { id: "okupes", b: "hab", t: "Seguridad", ax: "x", s: 1, q: "Los pisos ocupados ilegalmente deben poder desalojarse en pocos días.",
    p: [2, null, 2, -1, -2, null, 2, null, null, null, null, 2] },
  { id: "construir", b: "hab", t: "Vivienda", ax: "x", s: 1, q: "La mejor manera de bajar el precio de la vivienda es construir más, con menos regulación y menos impuestos.",
    p: [2, -1, 2, -2, -2, -1, 1, -2, 0, -2, 1, 2] },
  // ---- Serveis públics (eix x)
  { id: "concertada", b: "serv", t: "Educación", ax: "x", s: 1, q: "La escuela concertada debe recibir la misma financiación pública que la pública.",
    p: [2, -1, 2, -2, -2, -1, 1, -2, 1, -2, null, null] },
  { id: "derivar", b: "serv", t: "Sanidad", ax: "x", s: 1, q: "Para reducir las listas de espera, la sanidad pública debe derivar más pacientes a la privada.",
    p: [2, -1, 2, -2, -2, -1, 1, -2, 0, -2, null, null] },
  { id: "dentista", b: "serv", t: "Sanidad", ax: "x", s: -1, q: "La sanidad pública debe cubrir el dentista y la salud mental.",
    p: [null, 1, null, 2, 2, 2, null, 2, null, null, null, null] },
  // ---- Immigració i fronteres (eix x)
  { id: "fronteres", b: "imm", t: "Inmigración", ax: "x", s: 1, q: "Hay que reforzar el control de las fronteras y expulsar más rápido a quien entra de manera irregular.",
    p: [2, 0, 2, -2, -2, -1, 1, -2, 0, -2, 1, 2] },
  { id: "regularitzar", b: "imm", t: "Inmigración", ax: "x", s: -1, q: "Hay que regularizar a los inmigrantes que ya viven y trabajan en España.",
    p: [-1, 1, -2, 2, 2, 1, null, 2, 1, 1, null, -2] },
  { id: "prioritat", b: "imm", t: "Inmigración", ax: "x", s: 1, q: "Las ayudas sociales deben dar prioridad a las personas de nacionalidad española.",
    p: [null, -2, 2, -2, -2, -2, null, -2, -2, -2, null, 2] },
  // ---- Drets i societat (eix x)
  { id: "avortament", b: "drets", t: "Derechos", ax: "x", s: -1, q: "El aborto debe ser un derecho garantizado en la sanidad pública.",
    p: [0, 2, -2, 2, 2, 2, 1, 2, 1, 2, null, null] },
  { id: "vg", b: "drets", t: "Derechos", ax: "x", s: 1, q: "Hay que derogar la ley de violencia de género.",
    p: [-2, -2, 2, -2, -2, -2, -2, -2, -2, -2, null, null] },
  { id: "eutanasia", b: "drets", t: "Derechos", ax: "x", s: -1, q: "La eutanasia debe seguir siendo legal.",
    p: [-1, 2, -2, 2, 2, 2, 1, 2, 2, 2, null, null] },
  { id: "trans", b: "drets", t: "Derechos", ax: "x", s: -1, q: "Las personas trans deben poder cambiar el sexo en el registro sin informes médicos.",
    p: [-2, 1, -2, 2, 2, 2, null, 2, 1, 2, null, null] },
  { id: "memoria", b: "drets", t: "Memoria", ax: "x", s: -1, q: "El Estado debe exhumar las fosas del franquismo y resignificar el Valle de Cuelgamuros.",
    p: [-1, 2, -2, 2, 2, 2, 1, 2, 1, 2, null, null] },
  { id: "toros", b: "drets", t: "Cultura", ax: "x", s: -1, q: "Las corridas de toros deberían prohibirse.",
    p: [-2, null, -2, 2, 2, 2, 1, 1, null, 1, 1, null] },
  { id: "republica", b: "drets", t: "Instituciones", ax: "x", s: -1, q: "España debería ser una república.",
    p: [-2, -1, -2, 1, 2, 2, null, 2, null, 2, null, null] },
  // ---- Clima i món (eix x)
  { id: "nuclears", b: "mon", t: "Energía", ax: "x", s: 1, q: "Hay que alargar la vida de las centrales nucleares.",
    p: [2, -1, 2, -2, -2, null, 1, -2, null, null, null, null] },
  { id: "defensa", b: "mon", t: "Defensa", ax: "x", s: 1, q: "España debe aumentar el gasto en defensa hasta lo que pide la OTAN.",
    p: [1, 0, 1, -2, -2, null, null, -2, null, -2, null, null] },
  { id: "cotxes", b: "mon", t: "Clima", ax: "x", s: -1, q: "Hay que mantener la prohibición de vender coches nuevos de gasolina y diésel a partir de 2035.",
    p: [-1, 2, -2, 2, 2, 1, null, 2, null, 1, null, null] },
  { id: "israel", b: "mon", t: "Mundo", ax: "x", s: -1, q: "España debe romper las relaciones comerciales y militares con Israel.",
    p: [-2, 1, -2, 2, 2, 2, null, 2, null, 2, null, null] },
];
const ASSEMBLA_ANS = [[2, "Muy de acuerdo"], [1, "De acuerdo"], [0, "Neutral"], [-1, "En desacuerdo"], [-2, "Muy en desacuerdo"]];
const ASSEMBLA_KEY = "r29n-assembla";
const ASSEMBLA_MIN = 6; // afirmacions en comú perquè un partit surti al resultat
const ASSEMBLA_AX_MIN = { x: 6, y: 3 }; // respostes mínimes en un eix per situar-t'hi

// ---------- El test de cada territori ----------
function assemblaText(it, terr) {
  const T = ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta;
  const raw = it.v && terr in it.v ? it.v[terr] : it.q;
  if (raw === null) return null;
  return raw.split("{T}").join(T.label || "").split("{deT}").join(T.sub || "").split("{aT}").join(T.note || "").split("{L}").join(T.text || "").split("{Lb}").join(T.short || "");
}
const assemblaOpts = (it, terr) => (it.ov && it.ov[terr]) || it.o || null;
// Les afirmacions d'un territori, barrejades sempre igual per a tothom (mai dues seguides del mateix bloc)
function assemblaDeck(terr) {
  const list = ASSEMBLA_ITEMS.filter((it) => (!it.only || it.only.includes(terr)) && assemblaText(it, terr) !== null);
  let seed = 0;
  for (const ch of `afinitat-${terr}`) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // A cada pas, un bloc diferent de l'anterior, a l'atzar però amb més probabilitat per als que en queden més
  const pool = {};
  list.forEach((it) => (pool[it.b] ||= []).push(it));
  Object.values(pool).forEach((l) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } });
  // La primera, sempre la de la relació amb Espanya (és la que situa millor l'eix territorial)
  const out = [];
  let prev = null;
  const r0 = (pool.nac || []).findIndex((it) => it.id === "relacio");
  if (r0 >= 0) { out.push(pool.nac.splice(r0, 1)[0]); prev = "nac"; }
  while (out.length < list.length) {
    const left = list.length - out.length;
    const ok = Object.keys(pool).filter((b) => pool[b].length && b !== prev);
    if (!ok.length) { const b = Object.keys(pool).find((k) => pool[k].length); out.push(pool[b].pop()); prev = b; continue; }
    const must = ok.find((b) => pool[b].length * 2 > left); // si un bloc no hi cabria després, ara
    let b = must;
    if (!b) { let r = rnd() * ok.reduce((n, k) => n + pool[k].length, 0); b = ok.find((k) => (r -= pool[k].length) < 0) || ok[0]; }
    out.push(pool[b].pop()); prev = b;
  }
  return out;
}
const assemblaParties = (terr) => (ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta).parties;
const assemblaPv = (it, id) => { const j = ASSEMBLA_PARTIES.indexOf(id); return j < 0 ? null : it.p[j]; };

// ---------- Afinitat ----------
// ans: { id de l'afirmació: { v: −2…2 o null, imp } }
function assemblaScores(ans, terr = "resta") {
  return assemblaParties(terr).map((id) => {
    let num = 0, den = 0, n = 0;
    ASSEMBLA_ITEMS.forEach((it) => {
      const a = ans[it.id], p = assemblaPv(it, id);
      if (!a || a.v === null || a.v === undefined || p === null || p === undefined) return;
      const w = a.imp ? 2 : 1;
      num += w * (4 - Math.abs(a.v - p)) / 4; den += w; n++;
    });
    const party = PARTIES.find((x) => x.id === id) || { sig: id, name: id, color: "#888" };
    return { id, sig: party.sig, name: party.name, color: party.color, n, pct: den ? Math.round((num / den) * 100) : 0 };
  }).filter((r) => r.n >= ASSEMBLA_MIN).sort((a, b) => b.pct - a.pct || a.sig.localeCompare(b.sig));
}

// ---------- Eixos: el mateix càlcul per a tu i per als partits ----------
function assemblaAxis(ax, val) {
  let sum = 0, n = 0;
  ASSEMBLA_ITEMS.forEach((it) => {
    if (it.ax !== ax) return;
    const v = val(it);
    if (v === null || v === undefined) return;
    sum += it.s * v; n++;
  });
  return n ? { v: Math.round((5 + 2.5 * (sum / n)) * 10) / 10, n } : null;
}
function assemblaPos(ans) {
  const out = {};
  for (const ax of ["x", "y"]) {
    const r = assemblaAxis(ax, (it) => (ans[it.id] ? ans[it.id].v : null));
    out[ax] = r && r.n >= ASSEMBLA_AX_MIN[ax] ? r.v : null;
  }
  return out.x === null && out.y === null ? null : out;
}
const ASSEMBLA_PPOS = {};
function assemblaPartyPos(id) {
  if (!(id in ASSEMBLA_PPOS)) {
    const x = assemblaAxis("x", (it) => assemblaPv(it, id)), y = assemblaAxis("y", (it) => assemblaPv(it, id));
    ASSEMBLA_PPOS[id] = x && y && x.n >= 4 && y.n >= 3 ? { x: x.v, y: y.v } : null;
  }
  return ASSEMBLA_PPOS[id];
}
const assemblaXLabel = (x) => x < 2 ? "Izquierda" : x < 4 ? "Centroizquierda" : x <= 6 ? "Centro" : x <= 8 ? "Centroderecha" : "Derecha";
const assemblaYLabel = (y) => y < 2 ? "Centralismo" : y < 4 ? "Autonomismo" : y <= 6 ? "Federalismo" : y <= 8 ? "Soberanismo" : "Independentismo";
const fmtAx = (v) => v.toFixed(1).replace(".", ",");
const assemblaPosLabel = (pos) => pos ? [pos.x !== null ? assemblaXLabel(pos.x) : null, pos.y !== null ? assemblaYLabel(pos.y) : null].filter(Boolean).join(" · ") : "";

// Els partits d'un territori al mapa, amb la seva posició calculada. Si n'hi ha dos gairebé al mateix lloc, se
// separen una mica en cercle perquè es vegin tots.
function assemblaPartyPts(terr) {
  const list = assemblaParties(terr).map((id) => {
    const p = PARTIES.find((q) => q.id === id), q = assemblaPartyPos(id);
    return p && q ? { p, x: q.x, y: q.y } : null;
  }).filter(Boolean);
  const groups = [];
  list.forEach((d) => { const g = groups.find((q) => Math.hypot(q[0].x - d.x, q[0].y - d.y) < 0.9); g ? g.push(d) : groups.push([d]); });
  groups.forEach((g) => {
    if (g.length < 2) return;
    const cx = Math.min(9.3, Math.max(0.7, g[0].x)), cy = Math.min(9.3, Math.max(0.7, g[0].y));
    g.forEach((d, k) => { const a = (k / g.length) * Math.PI * 2 + Math.PI / 4; d.x = cx + Math.cos(a) * 0.7; d.y = cy - Math.sin(a) * 0.7; });
  });
  return list.sort((a, b) => b.p.seats - a.p.seats);
}
// On va cada etiqueta: a sota, a sobre, a la dreta o a l'esquerra, la que xoca menys
function assemblaLabels(pts, { px, py, rad, tw, lh, box }) {
  const circles = pts.map((d) => { const r = rad(d.p); return [px(d.x) - r, py(d.y) - r, px(d.x) + r, py(d.y) + r]; });
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const placed = [];
  return pts.map((d, k) => {
    const r = rad(d.p), cx = px(d.x), cy = py(d.y), w = tw(d.p.sig);
    const cands = [[cx, cy + r + lh, "center"], [cx, cy - r - lh * 0.35, "center"], [cx + r + 4, cy + lh * 0.35, "left"], [cx - r - 4, cy + lh * 0.35, "right"], [cx + r, cy + r + lh * 0.9, "left"], [cx - r, cy + r + lh * 0.9, "right"], [cx, cy + r + lh * 2, "center"]];
    const bx = ([tx, ty, an]) => { const x0 = an === "center" ? tx - w / 2 : an === "left" ? tx : tx - w; return [x0, ty - lh * 0.85, x0 + w, ty + lh * 0.15]; };
    const cost = (c) => { const b = bx(c); return (b[0] < box[0] || b[2] > box[2] || b[1] < box[1] || b[3] > box[3] ? 5 : 0) + placed.filter((q) => hit(q, b)).length * 2 + circles.filter((q, j) => j !== k && hit(q, b)).length; };
    const c = cands.reduce((best, q) => (cost(q) < cost(best) ? q : best), cands[0]);
    placed.push(bx(c));
    return c;
  });
}

// ---------- El mapa (SVG) ----------
function assemblaYouMark(px, py, pos, r = 15) {
  if (!pos) return "";
  const x = px(pos.x ?? 5), y = py(pos.y ?? 5);
  return `<g class="pm-you" aria-label="Tu posición"><circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="#17173d" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#17173d" stroke="#ffcf3d" stroke-width="4"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">TÚ</text></g>`;
}
function assemblaMapSvg(pos, hi, terr) {
  const W = 400, H = 400, L = 26, R = 8, T = 8, B = 28, M = 22;
  const px = (x) => L + M + (x / 10) * (W - L - R - 2 * M), py = (y) => H - B - M - (y / 10) * (H - T - B - 2 * M);
  const rad = (p) => Math.max(7, 4 + Math.sqrt(p.seats) * 1.35);
  const ps = assemblaPartyPts(terr), bw = W - L - R, bh = H - T - B;
  const ux = px(pos?.x ?? 5), uy = py(pos?.y ?? 5);
  const lines = pos ? hi.map((id, k) => { const d = ps.find((q) => q.p.id === id); return d ? `<line x1="${ux}" y1="${uy}" x2="${px(d.x)}" y2="${py(d.y)}" stroke="${d.p.color}" stroke-width="${[4, 3, 2.4][k]}" stroke-linecap="round" stroke-dasharray="${k ? "2 6" : "0"}" opacity=".9"/>` : ""; }).join("") : "";
  const lbl = assemblaLabels(ps, { px, py, rad, tw: (s) => s.length * 6.6 + 4, lh: 11, box: [L, T, W - R, H - B] });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tu posición en el mapa ideológico, con los partidos">
    <rect x="${L}" y="${T}" width="${bw}" height="${bh}" rx="14" fill="#fffaf0" stroke="#17173d" stroke-width="2.5"/>
    <rect x="${L}" y="${T}" width="${bw / 2}" height="${bh / 2}" rx="14" fill="rgba(255,75,43,.07)"/><rect x="${L + bw / 2}" y="${T}" width="${bw / 2}" height="${bh / 2}" fill="rgba(53,84,255,.06)"/>
    <rect x="${L}" y="${T + bh / 2}" width="${bw / 2}" height="${bh / 2}" fill="rgba(255,207,61,.1)"/><rect x="${L + bw / 2}" y="${T + bh / 2}" width="${bw / 2}" height="${bh / 2}" rx="14" fill="rgba(23,23,61,.04)"/>
    <path d="M${px(5)} ${T}V${H - B}M${L} ${py(5)}H${W - R}" stroke="#17173d" stroke-width="1.5" stroke-dasharray="4 6" opacity=".45"/>
    <text x="${L + 4}" y="${H - B + 19}" class="ax">← Izquierda</text><text x="${W - R - 4}" y="${H - B + 19}" class="ax" text-anchor="end">Derecha →</text>
    <text x="${L - 9}" y="${T + 6}" class="ax" transform="rotate(-90 ${L - 9} ${T + 6})" text-anchor="end">Independentismo ↑</text>
    <text x="${L - 9}" y="${H - B - 4}" class="ax" transform="rotate(-90 ${L - 9} ${H - B - 4})">Centralismo</text>
    ${lines}
    ${ps.map(({ p, x, y }, k) => {
      const big = hi.includes(p.id), c = lbl[k];
      return `<g class="pm-p ${big ? "hi" : ""}"><circle cx="${px(x)}" cy="${py(y)}" r="${rad(p)}" fill="${p.color}" stroke="#17173d" stroke-width="${big ? 3.5 : 2}"/>
        <text x="${c[0]}" y="${c[1]}" text-anchor="${{ center: "middle", left: "start", right: "end" }[c[2]]}" class="pm-lbl out">${esc(p.sig)}</text></g>`;
    }).join("")}
    ${assemblaYouMark(px, py, pos, 13)}
  </svg>`;
}
function assemblaAxesHtml(pos) {
  const row = (lo, hi, v, lab, grad) => v === null
    ? `<div class="asb-ax off"><div class="asb-ax-h"><span>${lo}</span><span>${hi}</span></div><em>Has respondido muy pocas afirmaciones de este eje.</em></div>`
    : `<div class="asb-ax"><div class="asb-ax-h"><span>${lo}</span><b>${esc(lab)} · ${fmtAx(v)}</b><span>${hi}</span></div>
      <div class="asb-ax-t" style="background:${grad}"><i style="left:${v * 10}%"></i></div></div>`;
  return row("Izquierda", "Derecha", pos.x, pos.x === null ? "" : assemblaXLabel(pos.x), "linear-gradient(90deg,#d2331a,#e9e2d0,#3554ff)")
    + row("Centralismo", "Independentismo", pos.y, pos.y === null ? "" : assemblaYLabel(pos.y), "linear-gradient(90deg,#17173d,#e9e2d0,#ffcf3d)");
}

// ---------- Imatges per descarregar o compartir (1080 × 1350) ----------
function assemblaCanvasBase(title, sub) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d";
  const display = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#ffcf3d"; c.fillRect(0, 0, W, 18);
  c.textAlign = "center"; c.fillStyle = INK;
  c.font = sans(32, 700); c.fillText(sub, W / 2, 90);
  c.font = display(60); c.fillText(title, W / 2, 168);
  const foot = (line) => {
    c.textAlign = "center"; c.fillStyle = INK; c.font = sans(32, 700); if (line) c.fillText(line, W / 2, 1236);
    c.font = display(34); c.fillText("Política en Joc", W / 2, 1288);
    c.font = sans(26, 600); c.fillStyle = "#4a4766"; c.fillText(`${location.host || "politicaenjoc.cat"}/#joc/assembla · orientativo, no es ninguna recomendación de voto`, W / 2, 1328);
  };
  return { cv, c, W, H, INK, display, sans, round, foot };
}
// La teva posició: el mapa amb els partits del teu territori
function assemblaMapCanvas(pos, rows, terr) {
  const T = ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta;
  const { cv, c, W, INK, display, sans, round, foot } = assemblaCanvasBase("Mi posición política", `Test de afinidad política · 29N · ${T.name}`);
  c.textAlign = "center"; c.font = sans(36, 800); c.fillStyle = "#3554ff"; c.fillText(assemblaPosLabel(pos), W / 2, 226);
  const X0 = 120, Y0 = 268, S = 870, M = 54;
  const px = (x) => X0 + M + (x / 10) * (S - 2 * M), py = (y) => Y0 + S - M - (y / 10) * (S - 2 * M);
  round(X0, Y0, S, S, 28); c.fillStyle = "#ffffff"; c.fill();
  c.save(); round(X0, Y0, S, S, 28); c.clip();
  c.fillStyle = "rgba(255,75,43,.08)"; c.fillRect(X0, Y0, S / 2, S / 2);
  c.fillStyle = "rgba(53,84,255,.07)"; c.fillRect(X0 + S / 2, Y0, S / 2, S / 2);
  c.fillStyle = "rgba(255,207,61,.13)"; c.fillRect(X0, Y0 + S / 2, S / 2, S / 2);
  c.fillStyle = "rgba(23,23,61,.05)"; c.fillRect(X0 + S / 2, Y0 + S / 2, S / 2, S / 2);
  c.restore();
  round(X0, Y0, S, S, 28); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  c.setLineDash([8, 12]); c.lineWidth = 2.5; c.globalAlpha = .45;
  c.beginPath(); c.moveTo(px(5), Y0); c.lineTo(px(5), Y0 + S); c.moveTo(X0, py(5)); c.lineTo(X0 + S, py(5)); c.stroke();
  c.setLineDash([]); c.globalAlpha = 1;
  c.fillStyle = "#4a4766"; c.font = sans(26, 800);
  c.textAlign = "left"; c.fillText("← IZQUIERDA", X0 + 6, Y0 + S + 40);
  c.textAlign = "right"; c.fillText("DERECHA →", X0 + S - 6, Y0 + S + 40);
  c.save(); c.translate(X0 - 22, Y0 + 8); c.rotate(-Math.PI / 2); c.textAlign = "right"; c.fillText("INDEPENDENTISMO ↑", 0, 0); c.restore();
  c.save(); c.translate(X0 - 22, Y0 + S - 8); c.rotate(-Math.PI / 2); c.textAlign = "left"; c.fillText("CENTRALISMO", 0, 0); c.restore();
  const ps = assemblaPartyPts(terr), top = (rows || []).slice(0, 3).map((r) => r.id);
  const rad = (p) => Math.max(18, 12 + Math.sqrt(p.seats) * 3.4);
  const ux = px(pos.x ?? 5), uy = py(pos.y ?? 5);
  top.forEach((id, k) => {
    const d = ps.find((q) => q.p.id === id);
    if (!d) return;
    c.beginPath(); c.moveTo(ux, uy); c.lineTo(px(d.x), py(d.y)); c.strokeStyle = d.p.color; c.lineWidth = [9, 7, 5][k]; c.lineCap = "round";
    c.setLineDash(k ? [4, 14] : []); c.stroke(); c.setLineDash([]);
  });
  ps.forEach((d) => {
    c.beginPath(); c.arc(px(d.x), py(d.y), rad(d.p), 0, Math.PI * 2); c.fillStyle = d.p.color; c.fill();
    c.lineWidth = top.includes(d.p.id) ? 7 : 4; c.strokeStyle = INK; c.stroke();
  });
  c.font = display(24); c.lineJoin = "round";
  const lbl = assemblaLabels(ps, { px, py, rad, tw: (s) => c.measureText(s).width + 8, lh: 30, box: [X0, Y0, X0 + S, Y0 + S] });
  ps.forEach((d, k) => {
    const [x, y, an] = lbl[k];
    c.textAlign = an; c.lineWidth = 8; c.strokeStyle = "#ffffff"; c.strokeText(d.p.sig, x, y); c.fillStyle = INK; c.fillText(d.p.sig, x, y);
  });
  c.textAlign = "center";
  c.beginPath(); c.arc(ux, uy, 58, 0, Math.PI * 2); c.setLineDash([6, 8]); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.setLineDash([]);
  c.beginPath(); c.arc(ux, uy, 40, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); c.lineWidth = 8; c.strokeStyle = "#ffcf3d"; c.stroke();
  c.fillStyle = "#ffcf3d"; c.font = display(30); c.fillText("YO", ux, uy + 11);
  foot(`Izquierda–derecha: ${pos.x !== null ? fmtAx(pos.x) : "—"} · Centralismo–independentismo: ${pos.y !== null ? fmtAx(pos.y) : "—"} (de 0 a 10)`);
  return cv;
}
// La teva afinitat amb cada partit
function assemblaCanvas(rows, terr) {
  const T = ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta;
  const { cv, c, W, INK, display, sans, round, foot } = assemblaCanvasBase("Mi afinidad política", `Test de afinidad política · 29N · ${T.name}`);
  const top = rows[0];
  c.textAlign = "center"; c.font = sans(40, 700); c.fillStyle = "#3a3a63"; c.fillText("Coincido más con", W / 2, 270);
  c.font = display(100); c.fillStyle = top.color; c.fillText(top.sig, W / 2, 395);
  c.font = display(58); c.fillStyle = INK; c.fillText(`${top.pct} %`, W / 2, 475);
  const list = rows.slice(0, 8), x0 = 120, bw = W - 240, step = Math.min(96, 640 / list.length);
  list.forEach((r, i) => {
    const y = 545 + i * step;
    c.textAlign = "left"; c.font = display(32); c.fillStyle = INK; c.fillText(r.sig, x0, y + 30);
    c.textAlign = "right"; c.fillText(`${r.pct} %`, x0 + bw, y + 30);
    round(x0, y + 44, bw, 26, 13); c.fillStyle = "#ece4d2"; c.fill();
    round(x0, y + 44, Math.max(26, (bw * r.pct) / 100), 26, 13); c.fillStyle = r.color; c.fill();
  });
  foot("¿Y tú, con quién coincides?");
  return cv;
}
async function assemblaOut(cv, file, text, share) {
  const url = `${location.origin}${location.pathname}#joc/assembla`;
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  if (share) {
    const f = blob && new File([blob], file, { type: "image/png" });
    try {
      if (f && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text: `${text} ${url}` }); return; }
      if (navigator.share) { await navigator.share({ text, url }); return; }
    } catch (e) { if (e?.name === "AbortError") return; }
  }
  if (!blob) { toast("No se ha podido hacer la imagen"); return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  if (share) { try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Imagen descargada y texto copiado"); return; } catch { /* sense porta-retalls */ } }
  toast("Imagen descargada");
}

// ---------- El resultat ----------
const assemblaLabel = (v, it, terr) => {
  if (v === null || v === undefined) return "—";
  const o = it && assemblaOpts(it, terr);
  return o ? o[v + 2] : (ASSEMBLA_ANS.find((a) => a[0] === v) || [0, ""])[1];
};
const ASSEMBLA_VSYM = { 2: "++", 1: "+", 0: "=", "-1": "−", "-2": "−−" };

function assemblaMethodHtml(terr) {
  const T = ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta, ps = assemblaParties(terr).map((id) => PARTIES.find((p) => p.id === id)).filter(Boolean);
  const deck = assemblaDeck(terr);
  const axTxt = (it) => it.ax === "x" ? (it.s > 0 ? "Izquierda–derecha: estar de acuerdo te lleva hacia la derecha" : "Izquierda–derecha: estar de acuerdo te lleva hacia la izquierda")
    : (it.s > 0 ? "Centralismo–independentismo: estar de acuerdo te lleva hacia el independentismo" : "Centralismo–independentismo: estar de acuerdo te lleva hacia el centralismo");
  return `<details class="asb-met" open><summary>Cómo te situamos: el método</summary>
      <ol>
        <li><b>Afinidad con cada partido.</b> En cada afirmación que has respondido y en la que conocemos la posición del partido, coincidís un 100 % si respondéis lo mismo, un 75 % si os separa un paso (por ejemplo, «Muy de acuerdo» y «De acuerdo»), un 50 % si son dos, un 25 % si son tres y un 0 % si estáis en los extremos opuestos. Las afirmaciones marcadas con ☆ cuentan el doble. El porcentaje es la media. Solo aparecen los partidos que se presentan ${esc(T.note || "en el resto del Estado")} y que tienen posición en al menos ${ASSEMBLA_MIN} de tus respuestas.</li>
        <li><b>Posición en los ejes.</b> Cada afirmación mide un solo eje (izquierda–derecha o centralismo–independentismo) en una dirección. «Muy de acuerdo» cuenta +2; «De acuerdo», +1; «Neutral», 0; «En desacuerdo», −1, y «Muy en desacuerdo», −2, y el signo se invierte cuando la afirmación va en la dirección contraria. Tu posición es la media de cada eje pasada a una escala de 0 a 10 (−2 → 0, 0 → 5, +2 → 10). Aquí las ☆ no cuentan.</li>
        <li><b>Los partidos</b> se sitúan en el mapa con exactamente el mismo cálculo, a partir de sus posiciones.</li>
        <li><b>Las posiciones de los partidos</b> salen de los programas electorales, de lo que han votado en el Congreso y de sus declaraciones públicas. Si no son claras, esa afirmación no cuenta para ese partido (—).</li>
      </ol>
    </details>
    <details class="asb-met"><summary>Todas las afirmaciones, el eje que miden y la posición de cada partido</summary>
      <p class="asb-met-leg"><span class="v2">++</span> Muy de acuerdo <span class="v1">+</span> De acuerdo <span class="v0">=</span> Neutral <span class="v-1">−</span> En desacuerdo <span class="v-2">−−</span> Muy en desacuerdo <span class="vn">—</span> Sin posición clara</p>
      <ol class="asb-met-l">${deck.map((it) => `<li><b>${esc(assemblaText(it, terr))}</b><small>${axTxt(it)}</small>
        <span class="asb-pvs">${ps.map((p) => { const v = assemblaPv(it, p.id); return `<span class="v${v === null ? "n" : v}" title="${esc(assemblaLabel(v, it, terr))}">${esc(p.sig)} ${v === null ? "—" : ASSEMBLA_VSYM[v]}</span>`; }).join("")}</span></li>`).join("")}</ol>
    </details>`;
}

function assemblaResult(ctx, ans, terr, restart) {
  const rows = assemblaScores(ans, terr), pos = assemblaPos(ans), T = ASSEMBLA_TERR[terr] || ASSEMBLA_TERR.resta;
  // Comptadors anònims per al Centre de control (stats.js): territori, partit més afí, casella del mapa i cada resposta.
  // Cap identificador: només sumen 1. Si la persona ha demanat no comptar les seves visites, Stats no envia res.
  if (typeof Stats !== "undefined") {
    try {
      Stats.add("at", 1, terr);
      if (rows[0]) Stats.add("ap", 1, rows[0].id);
      if (pos && pos.x !== null && pos.y !== null) Stats.add("ag", 1, `${Math.round(pos.x)}_${Math.round(pos.y)}`);
      for (const [id, a] of Object.entries(ans)) {
        if (!a) continue;
        Stats.add("aq", 1, `${id}_${a.v === null || a.v === undefined ? "s" : a.v}`);
        if (a.imp && a.v !== null) Stats.add("ai", 1, id);
      }
    } catch { /* sense comptadors */ }
  }
  try { store.set(ASSEMBLA_KEY, { at: Date.now(), terr, top: rows.slice(0, 3).map((r) => [r.id, r.pct]), all: rows.map((r) => [r.id, r.pct]), pos }); } catch { /* sense memòria */ }
  if (!rows.length) {
    return ctx.finish({ score: 0, display: "—", noRecord: true, xp: 10, verdict: "Te has saltado demasiadas afirmaciones para compararte con los partidos.", extraHtml: `<p class="muted">Vuelve a intentarlo y responde al menos ${ASSEMBLA_MIN}.</p>` });
  }
  const deck = assemblaDeck(terr);
  const answered = deck.map((it) => ({ it, a: ans[it.id] })).filter((x) => x.a && x.a.v !== null && x.a.v !== undefined);
  const detail = (r) => `<ul class="asb-dl">${answered.filter((x) => assemblaPv(x.it, r.id) !== null).map((x) => {
    const pv = assemblaPv(x.it, r.id), d = Math.abs(x.a.v - pv), cls = d <= 1 ? "ok" : d >= 3 ? "ko" : "mid";
    return `<li class="asb-d ${cls}"><b>${esc(assemblaText(x.it, terr))}</b><span>Tú: ${esc(assemblaLabel(x.a.v, x.it, terr))} · ${esc(r.sig)}: ${esc(assemblaLabel(pv, x.it, terr))}</span></li>`;
  }).join("")}</ul>`;
  // Podi i, per al primer, els temes on hi coincideixes i on no (mitjana per tema: un tema no surt mai a les dues llistes)
  const top = rows.slice(0, 3), byT = {};
  answered.forEach((x) => { const pv = assemblaPv(x.it, rows[0].id); if (pv === null) return; (byT[x.it.t] ||= []).push(Math.abs(x.a.v - pv)); });
  const temes = Object.entries(byT).map(([t, l]) => [t, l.reduce((a, b) => a + b, 0) / l.length]);
  const pick = (fn, ord) => temes.filter(([, d]) => fn(d)).sort((a, b) => ord * (a[1] - b[1])).slice(0, 4).map(([t]) => t).join(", ");
  const yes = pick((d) => d <= 1.25, 1), no = pick((d) => d >= 2.5, -1);
  const hi = top.map((r) => r.id);
  const extraHtml = `<div class="asb-res">
      ${pos ? `<section class="asb-eix"><h3>📍 Tu posición</h3>
        <p>Calculada con tus respuestas, en dos ejes: de izquierda a derecha y de centralismo a independentismo. Los partidos que se presentan ${esc(T.note || "en el resto del Estado")}, con el mismo cálculo.</p>
        <div class="asb-map">${assemblaMapSvg(pos, hi, terr)}</div>
        <div class="asb-axes">${assemblaAxesHtml(pos)}</div>
        <p class="asb-lines">${top.map((r, k) => `<span style="--pc:${r.color}"><i class="l${k}"></i>${k + 1}. ${esc(r.sig)} · ${r.pct} %</span>`).join("")}</p>
        <p class="asb-mapnote">Las líneas te unen con los tres partidos con los que tienes más afinidad. El partido más cercano en el mapa no siempre es el de más afinidad: el mapa resume las respuestas en dos medias; la afinidad las compara una por una.</p>
        <div class="asb-acts2"><button class="btn primary" type="button" data-asb-out="pos-share">Comparte tu posición</button><button class="btn asb-dl-btn" type="button" data-asb-out="pos-dl">⬇ Descarga la imagen</button></div>
      </section>` : ""}
      <section class="asb-af"><h3>🗳️ Tu afinidad con los partidos</h3>
        <div class="asb-pod">${[top[1], top[0], top[2]].map((r, k) => r ? `<div class="asb-pc p${[2, 1, 3][k]}" style="--pc:${r.color}"><b>${esc(r.sig)}</b><div class="asb-pb"><strong>${r.pct} %</strong><span>${["2n", "1r", "3r"][k]}</span></div></div>` : "<div></div>").join("")}</div>
        ${yes || no ? `<div class="asb-why"><small>Dónde coincides con ${esc(rows[0].sig)}</small>
          ${yes ? `<p><i class="ok"></i>${esc(yes)}</p>` : ""}${no ? `<p><i class="ko"></i>Discrepas en: ${esc(no)}</p>` : ""}</div>` : ""}
        <p class="asb-all">Todos los partidos que se presentan ${esc(T.note || "en el resto del Estado")}</p>
        <div class="asb-bars">${rows.map((r) => `<details class="asb-row" style="--pc:${r.color}"><summary><b>${esc(r.sig)}</b><span class="asb-bar"><i style="width:${r.pct}%"></i></span><em>${r.pct} %</em></summary>${detail(r)}</details>`).join("")}</div>
        <p class="muted asb-note">Toca un partido para ver en qué coincides y en qué no. Es orientativo: no es ninguna recomendación de voto.</p>
        <div class="asb-acts2"><button class="btn primary" type="button" data-asb-out="af-share">Comparte la afinidad</button><button class="btn asb-dl-btn" type="button" data-asb-out="af-dl">⬇ Descarga la imagen</button></div>
      </section>
      ${assemblaMethodHtml(terr)}
      <p class="asb-terr">Has hecho el test como votante ${esc(T.sub || "del resto del Estado")}. <button class="linklike" type="button" data-asb-terr>Cambia el territorio</button></p>
      <a class="asb-cmp" href="#apren/partits"><span><small>Comparador de partidos</small><b>Compárate con ${esc(rows[0].sig)}${rows[1] ? ` i ${esc(rows[1].sig)}` : ""}</b><em>Propuestas tema a tema, cara a cara y cabezas de lista</em></span><i>→</i></a>
    </div>`;
  ctx.finish({
    score: rows[0].pct, display: `${rows[0].pct} %`, noRecord: true, xp: 40,
    verdict: pos ? `📍 ${assemblaPosLabel(pos)}` : `Coincides más con ${rows[0].sig}.`,
    extraHtml,
    onShown(body) {
      const lab = assemblaPosLabel(pos);
      const out = {
        "pos-share": () => assemblaOut(assemblaMapCanvas(pos, rows, terr), "la-meva-posicio-politica.png", `📍 En el test de afinidad política de Política en Joc salgo ${lab}. ¿Y tú?`, true),
        "pos-dl": () => assemblaOut(assemblaMapCanvas(pos, rows, terr), "la-meva-posicio-politica.png", "", false),
        "af-share": () => assemblaOut(assemblaCanvas(rows, terr), "la-meva-afinitat-politica.png", `🗳️ En el test de afinidad política de Política en Joc coincido un ${rows[0].pct} % con ${rows[0].sig}. ¿Y tú?`, true),
        "af-dl": () => assemblaOut(assemblaCanvas(rows, terr), "la-meva-afinitat-politica.png", "", false),
      };
      $$("[data-asb-out]", body).forEach((b) => b.addEventListener("click", () => out[b.dataset.asbOut]?.()));
      $("[data-asb-terr]", body)?.addEventListener("click", () => restart?.());
      // Al comparador, amb els dos partits més propers ja triats
      $(".asb-cmp", body)?.addEventListener("click", () => { if (typeof cmpSel !== "undefined" && rows[1]) { cmpSel.a = rows[0].id; cmpSel.b = rows[1].id; cmpSel.next = "b"; } });
    },
  });
}

registerGame({
  id: "assembla",
  cat: "parlament",
  autostart: true,
  backHref: "#inici",
  tagline: "Unos 40 temas de la campaña: ¿dónde te sitúas y con qué partido coincides más?",
  kicker: "Especial 29N",
  title: "Test de afinidad política",
  level: 1,
  meta: "Unas 40 afirmaciones",
  icon: icon(`<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20a5 5 0 0110 0M11 20a5 5 0 0110 0"/>`),
  desc: "Elige dónde votas y di si estás de acuerdo o no en unos 40 temas de la campaña (impuestos, vivienda, modelo territorial, lengua, inmigración…). Te situamos en los ejes izquierda–derecha y centralismo–independentismo y te decimos con qué partidos coincides más. Sin tiempo y sin respuestas correctas.",
  rules: ["Unas 40 afirmaciones · sin tiempo", "☆ Marca los temas que más te importan: cuentan el doble", "Puedes saltarte alguna", "Tu posición y tu afinidad, en imágenes para compartir"],
  start(ctx) {
    let terr = null, deck = [], ans = {}, i = 0, star = null; // star: si l'afirmació d'ara està marcada com a important
    const pickTerr = () => {
      let last = null;
      try { last = store.get(ASSEMBLA_TERR_KEY, null); } catch { /* sense memòria */ }
      ctx.hud([["n", "Afirmación", "—"]]);
      ctx.body.innerHTML = `<div class="asb asb-pick">
          <p class="asb-pick-k">Paso 1 de 2</p>
          <h3 class="asb-pick-h">¿Dónde votas el 29N?</h3>
          <p class="asb-pick-p">Solo entrarán los partidos que se presentan allí, y algunas preguntas hablarán de tu territorio y de su lengua.</p>
          <div class="asb-terrs">${Object.entries(ASSEMBLA_TERR).map(([k, t]) => `<button type="button" class="asb-tb${k === last ? " on" : ""}" data-terr="${k}"><b>${esc(t.name)}</b><small>${t.parties.length} partidos</small></button>`).join("")}</div>
          <p class="asb-pick-p">Después, unas 40 afirmaciones mezcladas. ☆ Marca las que más te importan: cuentan el doble.</p>
        </div>`;
      $$("[data-terr]", ctx.body).forEach((b) => b.addEventListener("click", () => {
        terr = b.dataset.terr;
        try { store.set(ASSEMBLA_TERR_KEY, terr); } catch { /* sense memòria */ }
        deck = assemblaDeck(terr); ans = {}; i = 0; star = null;
        if (typeof Sfx !== "undefined") Sfx.play("pick");
        draw();
      }));
    };
    const draw = () => {
      const it = deck[i], cur = ans[it.id] || { v: undefined, imp: false }, N = deck.length;
      if (star === null) star = !!cur.imp;
      const nImp = Object.entries(ans).filter(([id, a]) => id !== it.id && a && a.imp && a.v !== null).length + (star ? 1 : 0);
      const opts = assemblaOpts(it, terr), list = opts ? opts.map((l, k) => [k - 2, l]) : ASSEMBLA_ANS;
      ctx.hud([["n", "Afirmación", `${i + 1}/${N}`]]);
      ctx.body.innerHTML = `<div class="asb">
          <div class="asb-prog"><i style="width:${(i / N) * 100}%"></i></div>
          <div class="asb-top"><span class="asb-t">${esc(it.t)}</span>
            <button class="asb-star${star ? " on" : ""}" type="button" data-imp aria-pressed="${star}"><i>${star ? "★" : "☆"}</i><span>${star ? "Es importante para mí" : "Me importa mucho"}</span></button></div>
          <p class="asb-q">${esc(assemblaText(it, terr))}</p>
          <div class="asb-opts${opts ? " scale" : ""}">${list.map(([v, l]) => `<button class="asb-o${cur.v === v ? " on" : ""}" data-v="${v}" type="button">${esc(l)}</button>`).join("")}</div>
          <p class="asb-hint">${nImp ? `★ Temas importantes: ${nImp}. Cuentan el doble en la afinidad.` : "Toca ☆ antes de responder si este tema te parece especialmente importante: contará el doble."}</p>
          <div class="asb-nav"><button class="btn ghost sm" data-prev type="button">← Anterior</button><button class="btn ghost sm" data-skip type="button">Saltar</button></div>
        </div>`;
      ctx.body.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => { ans[it.id] = { v: Number(b.dataset.v), imp: star }; next(); }));
      $("[data-imp]", ctx.body).addEventListener("click", () => { star = !star; if (ans[it.id]) ans[it.id].imp = star; if (typeof Sfx !== "undefined") Sfx.play("pick"); draw(); });
      $("[data-skip]", ctx.body).addEventListener("click", () => { ans[it.id] = { v: null, imp: false }; next(); });
      $("[data-prev]", ctx.body).addEventListener("click", () => { star = null; if (i) { i--; draw(); } else pickTerr(); });
    };
    const next = () => { star = null; if (i < deck.length - 1) { i++; draw(); } else assemblaResult(ctx, ans, terr, () => { const g = typeof GAMES !== "undefined" && (Array.isArray(GAMES) ? GAMES.find((x) => x.id === "assembla") : GAMES.assembla); if (g && typeof startGame === "function") startGame(g); }); };
    ctx.onKey((e) => { const k = Number(e.key); if (terr && k >= 1 && k <= 5) { const b = ctx.body.querySelectorAll("[data-v]")[k - 1]; b?.click(); } });
    pickTerr();
  },
});
