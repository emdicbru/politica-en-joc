// Aprèn · Part 1: el context polític (d'on venim, la legislatura 2023-2026, què hi ha en joc i les ideologies).
// Fets contrastats amb la Viquipèdia (XV legislatura i eleccions generals del 2026), el Ministeri de l'Interior i premsa.
// Redacció neutral: es descriuen fets i posicions, sense valorar-les.

const LO = "#2e9d5b";

// ---------- Il·lustracions ----------
Object.assign(AP_ART, {
  history: lsvg(`<path d="M14 80h132" stroke="${LI}" stroke-width="4"/>
    ${[[28, LO, "77"], [62, LR, "82"], [96, LB, "96"], [130, LY, "15"]].map(([x, c, y]) => `<circle cx="${x}" cy="80" r="11" fill="${c}" stroke="${LI}" stroke-width="3.5"/>
      <rect x="${x - 15}" y="36" width="30" height="20" rx="4" fill="${LC}" stroke="${LI}" stroke-width="3"/><text x="${x}" y="51" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="11" fill="${LI}">${y}</text>
      <path d="M${x} 56v13" stroke="${LI}" stroke-width="3"/>`).join("")}`),
  calendar: lsvg(`<rect x="30" y="18" width="100" height="80" rx="8" fill="#fff" stroke="${LI}" stroke-width="4"/><rect x="30" y="18" width="100" height="22" rx="8" fill="${LR}" stroke="${LI}" stroke-width="4"/>
    <path d="M52 10v16M108 10v16" stroke="${LI}" stroke-width="5"/><text x="80" y="80" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="30" fill="${LI}">XV</text>
    <text x="80" y="35" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">2023-2026</text>`),
  scale: lsvg(`<path d="M80 18v74M50 96h60" stroke="${LI}" stroke-width="5"/><path d="M30 34h100" stroke="${LI}" stroke-width="5"/><circle cx="80" cy="18" r="6" fill="${LY}" stroke="${LI}" stroke-width="3"/>
    <path d="M30 34l-14 30h28zM130 34l-14 30h28z" fill="none" stroke="${LI}" stroke-width="3"/><path d="M14 64a16 9 0 0032 0zM114 64a16 9 0 0032 0z" fill="${LY}" stroke="${LI}" stroke-width="3"/>
    <path d="M22 56l8-7 8 7v6H22z" fill="${LR}" stroke="${LI}" stroke-width="2.5"/><text x="130" y="61" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="12" fill="${LI}">€</text>`),
  compass: lsvg(`<path d="M80 12v88M24 56h112" stroke="${LI}" stroke-width="4"/><path d="M80 12l-6 9h12zM80 100l-6-9h12zM24 56l9-6v12zM136 56l-9-6v12z" fill="${LI}"/>
    <circle cx="50" cy="36" r="8" fill="${LR}" stroke="${LI}" stroke-width="3"/><circle cx="112" cy="40" r="8" fill="${LB}" stroke="${LI}" stroke-width="3"/>
    <circle cx="58" cy="78" r="8" fill="${LG}" stroke="${LI}" stroke-width="3"/><circle cx="104" cy="80" r="8" fill="${LY}" stroke="${LI}" stroke-width="3"/>`),
});

// ---------- Glossari: conceptes del context polític ----------
GLOSSARY.push(
  { w: "TRANSICIÓN", d: "Periodo, entre 1975 y 1982, en el que España pasó de la dictadura franquista a la democracia." },
  { w: "AMNISTÍA", d: "Medida que extingue la responsabilidad penal o administrativa por unos hechos determinados. La ley de 2024 se aplica a los hechos vinculados al procés independentista catalán." },
  { w: "PLURINACIONALIDAD", d: "Idea de que el Estado está formado por varias naciones, como Cataluña, el País Vasco o Galicia, y no por una sola." },
  { w: "SOBERANISMO", d: "Posición que defiende que un territorio pueda decidir su futuro político, incluida la independencia." },
  { w: "SOCIALDEMOCRACIA", d: "Ideología que combina la economía de mercado con un estado del bienestar fuerte e impuestos progresivos." },
  { w: "LIBERALISMO", d: "Ideología que prioriza la libertad individual, la economía de mercado y un Estado limitado." },
  { w: "CONSERVADURISMO", d: "Ideología que defiende la tradición, el orden social y los cambios graduales." },
  { w: "POPULISMO", d: "Estilo político que presenta la sociedad dividida entre «el pueblo» y «las élites». Puede ser de izquierdas o de derechas." },
  { w: "PRÓRROGA PRESUPUESTARIA", d: "Situación en la que, si no se aprueban presupuestos nuevos, se siguen aplicando los del año anterior." },
  { w: "FISCAL GENERAL DEL ESTADO", d: "Jefe del Ministerio Fiscal. Lo nombra el Rey a propuesta del Gobierno." },
  { w: "15-M", d: "Movimiento de protesta iniciado el 15 de mayo de 2011 contra la gestión de la crisis económica y la corrupción." },
  { w: "PRESUNCIÓN DE INOCENCIA", d: "Derecho de toda persona a ser considerada inocente mientras una sentencia firme no la declare culpable." },
);
{
  const uniq = [...new Map(GLOSSARY.map((g) => [apNorm(g.w), g])).values()];
  GLOSSARY.length = 0;
  GLOSSARY.push(...uniq);
}
GLOSSARY.sort((a, b) => a.w.localeCompare(b.w, "es"));
AP_TOOLS.find((t) => t.slug === "diccionari").text = `${GLOSSARY.length} conceptos, explicados fácil.`;

// ---------- Capítols de la part 1 ----------
const AP_CONTEXT_CHAPTERS = [
  {
    slug: "don-venim", part: 1, title: "De dónde venimos", short: "Cincuenta años de democracia, del bipartidismo a la fragmentación.", mins: 4, tone: LO, art: AP_ART.history,
    lead: "La democracia actual nació hace casi cincuenta años. Conocer sus etapas ayuda a entender qué se vota hoy y por qué cuesta tanto formar gobierno.",
    key: ["La democracia actual nace con las elecciones de 1977 y la Constitución de 1978.", "Durante treinta años, el PSOE y el PP se alternaron en el Gobierno, a menudo con el apoyo de partidos nacionalistas.", "Desde 2015 hay más partidos en el Congreso: cuesta más formar gobierno y ha habido repeticiones electorales."],
    blocks: [
      { t: "h", h: "De la dictadura a la democracia" },
      { t: "p", h: "Después de la muerte de Franco, en 1975, la [[Transición]] trajo las primeras elecciones libres (15 de junio de 1977) y la Constitución de 1978, aprobada en referéndum. En 1979 se aprobaron los primeros estatutos de autonomía, y en 1981 fracasó el golpe de Estado del 23-F." },
      { t: "h", h: "Los presidentes del Gobierno" },
      { t: "widget", w: "presidents" },
      { t: "h", h: "Treinta años de bipartidismo" },
      { t: "p", h: "Desde 1982, el PSOE y el PP (Alianza Popular hasta 1989) se alternaron en el Gobierno. Cuando no tenían mayoría absoluta, pactaban con partidos nacionalistas como CiU, el PNV o Coalición Canaria. Entre los dos llegaban a sumar más de tres de cada cuatro votos." },
      { t: "widget", w: "bipartisan" },
      { t: "callout", tone: "info", title: "Solo cuatro mayorías absolutas", h: "Un solo partido ha tenido mayoría absoluta en el Congreso solo cuatro veces: el PSOE en 1982 y 1986, y el PP en 2000 y 2011." },
      { t: "h", h: "La crisis que lo cambió todo" },
      { t: "p", h: "La crisis económica de 2008, los recortes y los casos de corrupción hicieron crecer el descontento. En 2011 estalló el movimiento del [[15-M]] y, entre 2014 y 2015, Podemos y Ciudadanos rompieron el [[bipartidismo]]: en las elecciones de diciembre de 2015, cuatro partidos superaron el 13 % de los votos." },
      { t: "steps", items: [
        { title: "2016 · Primera repetición electoral", text: "Ningún candidato consigue la investidura y, por primera vez, hay que repetir las elecciones." },
        { title: "2017 · El procés catalán", text: "Referéndum del 1 de octubre, declaración de independencia en el Parlament y aplicación del artículo 155 de la Constitución." },
        { title: "2018 · Primera moción de censura que prospera", text: "Pedro Sánchez sustituye a Mariano Rajoy después de una sentencia del caso Gürtel." },
        { title: "2019 · Dos elecciones generales el mismo año", text: "Vox entra en el Congreso y el sistema de partidos se fragmenta todavía más." },
        { title: "2020 · El primer gobierno de coalición", text: "PSOE y Unidas Podemos forman el primer gobierno de coalición desde la Segunda República. Poco después llega la pandemia de la covid-19." },
        { title: "2023 · Elecciones del 23-J", text: "El PP gana las elecciones, pero Pedro Sánchez es investido con el apoyo de Sumar y de partidos nacionalistas e independentistas." },
      ] },
    ],
    quiz: [
      { q: "¿En qué año se celebraron las primeras elecciones democráticas después del franquismo?", opts: ["En 1977", "En 1975", "En 1978", "En 1982"], exp: "Se celebraron el 15 de junio de 1977. La Constitución se aprobó al año siguiente." },
      { q: "¿Qué presidente llegó al Gobierno con la primera moción de censura que prosperó?", opts: ["Pedro Sánchez", "Felipe González", "Mariano Rajoy", "José María Aznar"], exp: "Fue en junio de 2018: Pedro Sánchez sustituyó a Mariano Rajoy." },
      { q: "¿Qué dos partidos se alternaron en el Gobierno entre 1982 y 2018?", opts: ["El PSOE y el PP", "El PSOE y la UCD", "El PP y Ciudadanos", "El PSOE y Podemos"], exp: "Es lo que se llama bipartidismo. El PP se llamaba Alianza Popular hasta 1989." },
    ],
    practice: { href: "#joc/cronologia", label: "Juega a Cronología", text: "Ordena los grandes hechos de la historia de España." },
  },
  {
    slug: "legislatura", part: 1, title: "La legislatura 2023-2026", short: "Amnistía, gobierno en minoría, crisis y casos judiciales.", mins: 5, tone: LR, art: AP_ART.calendar,
    lead: "Tres años de una legislatura muy ajustada: un gobierno de coalición en minoría, la ley de amnistía, elecciones autonómicas, crisis y casos judiciales, hasta el adelanto electoral.",
    key: ["Pedro Sánchez fue investido en 2023 con 179 votos, después de pactar la ley de amnistía con ERC y Junts.", "El Gobierno no tenía mayoría propia: no aprobó presupuestos nuevos y perdió votaciones importantes.", "Cuando el Congreso tumbó dos decretos de vivienda, el presidente disolvió las Cortes y convocó elecciones."],
    blocks: [
      { t: "h", h: "Cómo empezó" },
      { t: "p", h: "Las elecciones del 23 de julio de 2023 dejaron un Congreso sin mayorías claras. El PP ganó con 137 escaños, pero Alberto Núñez Feijóo no superó la [[investidura]]. Pedro Sánchez fue investido el 16 de noviembre con 179 votos, después de pactar una ley de [[amnistía]] con ERC y Junts, y formó un gobierno de coalición con Sumar." },
      { t: "h", h: "Los hechos clave, año a año" },
      { t: "widget", w: "legislature" },
      { t: "h", h: "Las claves de la legislatura" },
      { t: "cards", items: [
        { title: "Un gobierno en minoría", text: "PSOE y Sumar sumaban 152 diputados, lejos de los 176. Cada votación dependía de siete u ocho grupos, y el Gobierno perdió votaciones importantes." },
        { title: "Sin presupuestos nuevos", text: "No se aprobó ningún presupuesto nuevo: los de 2023 se [[prorrogaron|PRÓRROGA PRESUPUESTARIA]] durante toda la legislatura." },
        { title: "La amnistía", text: "Fue el debate central. El Gobierno la defendía como una medida para la convivencia en Cataluña, y la oposición la consideraba el precio de la investidura. El Tribunal Constitucional la avaló en 2025." },
        { title: "Investigaciones judiciales", text: "Varios casos afectaron al entorno del Gobierno y del PSOE, como el caso Koldo. Las personas investigadas tienen derecho a la [[presunción de inocencia]] hasta que haya sentencia firme." },
      ] },
      { t: "callout", tone: "info", title: "La economía, en dos datos", h: "El paro bajó del 10 % a finales de 2025, por primera vez desde 2008. El precio de la vivienda, en cambio, siguió subiendo y se convirtió en una de las principales preocupaciones." },
      { t: "h", h: "Cómo ha acabado la legislatura" },
      { t: "p", h: "La legislatura debía durar hasta el verano de 2027, cuatro años después de las elecciones. Ha acabado antes, después de poco más de tres años, porque el Gobierno había perdido la capacidad de aprobar sus iniciativas en el Congreso." },
      { t: "steps", items: [
        { title: "Octubre de 2025 · Junts rompe con el PSOE", text: "El 27 de octubre anuncia que bloqueará las leyes del Gobierno. Sin sus 7 diputados, el Gobierno ya no suma la mayoría que lo invistió." },
        { title: "Sin presupuestos nuevos", text: "No se aprueba ninguno en toda la legislatura: se siguen aplicando los de 2023, [[prorrogados|PRÓRROGA PRESUPUESTARIA]] año tras año." },
        { title: "2 de octubre de 2026 · Caen los decretos de vivienda", text: "El Congreso no convalida dos [[decretos ley|DECRETO LEY]] de vivienda, con los votos en contra de PP, Vox, Junts y UPN, entre otros." },
        { title: "El presidente disuelve las Cortes", text: "Pedro Sánchez decide adelantar las elecciones. El Real Decreto 806/2026, publicado en el BOE el 6 de octubre, disuelve el Congreso y el Senado y convoca las elecciones." },
        { title: "29 de noviembre · Elecciones", text: "Las elecciones se celebran 54 días después de la convocatoria, como marca la ley electoral." },
      ] },
      { t: "h", h: "¿Qué puede hacer un gobierno que pierde la mayoría?" },
      { t: "p", h: "Cuando un gobierno no tiene suficientes apoyos en el Congreso, la Constitución le deja tres caminos. Toca uno para ver cómo funciona." },
      { t: "widget", w: "govoptions" },
      { t: "h", h: "Qué pasa cuando se disuelven las Cortes" },
      { t: "list", items: [
        "Los diputados y los senadores dejan el cargo, y las leyes que se estaban tramitando <b>decaen</b>: si se quieren aprobar, se tendrán que volver a presentar en la nueva legislatura.",
        "La [[Diputación Permanente]] de cada cámara vela por sus poderes hasta que se constituyen las nuevas Cortes. Por ejemplo, puede convalidar los decretos ley que apruebe el Gobierno.",
        "El Gobierno sigue en plenas funciones hasta las elecciones. Después de votar, pasa a ser un [[gobierno en funciones]] hasta que hay uno nuevo (artículo 101 de la Constitución).",
        "El decreto de convocatoria fija también cuándo se constituyen las nuevas Cortes: el 23 de diciembre.",
      ] },
    ],
    quiz: [
      { q: "¿Con cuántos votos fue investido Pedro Sánchez en noviembre de 2023?", opts: ["179", "176", "172", "350"], exp: "Obtuvo 179 votos a favor: PSOE, Sumar, ERC, Junts, EH Bildu, PNV, BNG y Coalición Canaria." },
      { q: "¿Por qué se han adelantado las elecciones al 29 de noviembre?", opts: ["El Congreso tumbó dos decretos ley de vivienda y el presidente disolvió las Cortes", "Prosperó una moción de censura", "El Gobierno perdió una cuestión de confianza", "Se había acabado la legislatura de cuatro años"], exp: "Después del rechazo de los decretos de vivienda, el 2 de octubre, Sánchez disolvió las Cortes. La legislatura debía durar hasta 2027." },
      { q: "¿Qué pasa con las leyes que se estaban tramitando cuando se disuelven las Cortes?", opts: ["Decaen y se tienen que volver a presentar", "Se aprueban automáticamente", "Las acaba de votar el Senado", "Las aprueba el Gobierno por decreto"], exp: "Con la disolución, las iniciativas en trámite decaen. Mientras tanto, la [[Diputación Permanente]] vela por los poderes de la cámara." },
    ],
    practice: { href: "#joc/verificador", label: "Juega al Verificador", text: "Distingue los hechos reales de los falsos." },
  },
  {
    slug: "en-joc", part: 1, title: "Qué hay en juego el 29N", short: "Los grandes debates y las mayorías posibles.", mins: 4, tone: "#f59f24", art: AP_ART.scale,
    lead: "Vivienda, modelo territorial, economía, inmigración… Estos son los grandes debates de la campaña y las mayorías que podrían salir de las urnas.",
    key: ["Vivienda, modelo territorial, economía, inmigración y pensiones son los grandes debates de la campaña.", "Para gobernar hay que superar la investidura: 176 síes en la primera votación o más síes que noes en la segunda.", "Si en dos meses nadie es investido, se repiten las elecciones."],
    blocks: [
      { t: "h", h: "Los grandes debates" },
      { t: "p", h: "Elige un tema para ver por qué es importante y qué propone cada partido. Los resúmenes parten de los programas electorales de 2023 y de las posiciones públicas de cada formación." },
      { t: "widget", w: "issues" },
      { t: "h", h: "Qué mayorías pueden salir" },
      { t: "cards", items: [
        { title: "Un gobierno del PP", text: "Necesitaría 176 síes, o más síes que noes en la segunda votación. Los socios posibles son Vox, UPN y Coalición Canaria. El PP y Vox han pactado en varias comunidades autónomas." },
        { title: "Un gobierno del PSOE", text: "Tendría que reeditar la mayoría de 2023, con Sumar y partidos nacionalistas e independentistas. La ruptura de Junts con el PSOE la hace más difícil." },
        { title: "Una gran coalición", text: "PP y PSOE sumarían de sobra, pero nunca han gobernado juntos en el Estado y los dos lo descartan." },
        { title: "Bloqueo y repetición", text: "Si en dos meses nadie es investido, se vuelven a convocar elecciones, como pasó en 2016 y 2019." },
      ] },
      { t: "callout", tone: "tip", title: "Haz tus cálculos", h: "En el <a href=\"#apren/pactometre\">pactòmetre</a> puedes probar qué combinaciones llegan a la mayoría, a partir de las encuestas o de tu propio escenario." },
      { t: "h", h: "Antes de decidir el voto" },
      { t: "list", items: [
        "Compara las propuestas de cada partido tema a tema en el <a href=\"#apren/partits\">comparador</a>.",
        "Desconfía de los mensajes que llegan sin fuente, sobre todo si buscan indignar.",
        "Comprueba los datos en fuentes oficiales (BOE, INE, Junta Electoral Central) y en más de un medio.",
        "Las encuestas son una fotografía del momento, no un pronóstico.",
        "Votar es un derecho, no una obligación. El voto en blanco también es una opción válida.",
      ] },
    ],
    quiz: [
      { q: "¿Qué tema precipitó el adelanto electoral?", opts: ["La vivienda", "Las pensiones", "La inmigración", "El gasto en defensa"], exp: "El Congreso rechazó dos decretos ley de vivienda el 2 de octubre de 2026." },
      { q: "¿Qué pasa si ningún candidato es investido en dos meses?", opts: ["Se vuelven a convocar elecciones", "Gobierna el partido más votado", "Decide el Senado", "El Rey nombra a un presidente"], exp: "Lo establece el artículo 99 de la Constitución. Pasó en 2016 y en 2019." },
      { q: "¿Han gobernado alguna vez juntos el PP y el PSOE en el Gobierno de España?", opts: ["No, nunca", "Sí, en 2016", "Sí, en 1996", "Sí, durante la pandemia"], exp: "Nunca ha habido una gran coalición entre el PP y el PSOE en el Gobierno del Estado." },
    ],
    practice: { href: "#apren/partits", label: "Abre el comparador de partidos", text: "Compara las propuestas de dos partidos, tema a tema." },
  },
  {
    slug: "ideologies", part: 1, title: "Las ideologías, explicadas", short: "Izquierda, derecha, liberales, conservadores y soberanistas.", mins: 4, tone: LP, art: AP_ART.compass,
    lead: "Izquierda, derecha, liberal, conservador, soberanista… Qué quiere decir cada etiqueta y cómo se sitúan los partidos que se presentan el 29N.",
    key: ["Izquierda y derecha nacen en la Revolución francesa y hoy hablan sobre todo de igualdad, Estado y mercado.", "En España también pesan el eje territorial (centralismo o soberanismo) y el de los valores.", "Las etiquetas son orientativas: muchos partidos mezclan ideas de varias familias."],
    blocks: [
      { t: "h", h: "De dónde salen «izquierda» y «derecha»" },
      { t: "p", h: "Los términos nacen en la Asamblea Nacional francesa de 1789: a la derecha del presidente se sentaban los partidarios del rey y del orden establecido, y a la izquierda, quienes querían cambios más profundos. Hoy la izquierda pone el acento en la igualdad y el papel del Estado, y la derecha, en la libertad económica, el orden y la tradición, aunque dentro de cada bloque hay muchos matices." },
      { t: "h", h: "Tres ejes para entender la política española" },
      { t: "widget", w: "axes" },
      { t: "h", h: "Las grandes familias ideológicas" },
      { t: "widget", w: "families" },
      { t: "callout", tone: "info", title: "Etiquetas orientativas", h: "Muchos partidos combinan ideas de varias familias y se definen a sí mismos de maneras diferentes. Las posiciones que se muestran son aproximadas." },
      { t: "h", h: "¿Izquierda o derecha? Ponte a prueba" },
      { t: "p", h: "Estas ideas se asocian tradicionalmente a un bloque o al otro. Adivina a cuál." },
      { t: "widget", w: "lrquiz" },
    ],
    quiz: [
      { q: "¿De dónde viene la distinción entre izquierda y derecha?", opts: ["De la Asamblea Nacional francesa de 1789", "De las Cortes de Cádiz", "Del Parlamento británico", "De la Segunda República"], exp: "Se refiere a dónde se sentaban los diputados respecto al presidente de la Asamblea." },
      { q: "¿Qué familia ideológica defiende una economía de mercado con un estado del bienestar fuerte?", opts: ["La socialdemocracia", "El liberalismo", "La derecha radical", "El anarquismo"], exp: "La [[socialdemocracia]] combina mercado, servicios públicos fuertes e impuestos progresivos." },
      { q: "¿Qué mide el eje territorial?", opts: ["Si se quiere más autogobierno o más centralismo", "Si se quieren más o menos impuestos", "La edad de los votantes", "El tamaño de los partidos"], exp: "Va del centralismo a la independencia, pasando por el federalismo y el soberanismo." },
    ],
    practice: { href: "#joc/match", label: "Juega al Match ideológico", text: "Descubre con qué actores políticos coincides." },
  },
];

// La guia s'organitza en quatre blocs, en l'ordre en què es viuen unes eleccions: el context, com funcionen,
// com es vota i què passa després. Cada bloc té les seves eines i les seves respostes ràpides.
const AP_BLOCKS = [
  { k: "context", title: "El contexto", q: "¿Qué hay en juego?", sub: "De dónde venimos, qué ha pasado esta legislatura, los grandes debates y las ideologías de los partidos.", tone: LP,
    icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>`,
    chapters: ["don-venim", "legislatura", "en-joc", "ideologies"], tools: ["partits", "actualitat"] },
  { k: "eleccions", title: "Cómo funcionan las elecciones", q: "¿Qué se vota y cómo se cuenta?", sub: "Qué elegimos el 29N, cómo los votos se convierten en escaños y qué reglas tiene la campaña.", tone: LB,
    icon: `<path d="M3 18a9 9 0 0118 0"/><path d="M7.5 18a4.5 4.5 0 019 0"/><path d="M12 3v3"/>`,
    chapters: ["que-votem", "vots-escons", "campanya"], tools: ["simulador"] },
  { k: "votar", title: "Cómo se vota", q: "¿Qué tengo que hacer el 29N?", sub: "Quién puede votar, qué pasa en la mesa y qué quiere decir votar en blanco, nulo o abstenerse.", tone: LR,
    icon: `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V4h8v7"/><path d="M10 7.5l1.5 1.5 3-3"/>`,
    chapters: ["qui-vota", "dia-d", "blanc-nul"], tools: ["calendari"] },
  { k: "despres", title: "Después del 29N", q: "Y ahora, ¿quién gobierna?", sub: "Del recuento a la investidura, y cómo trabaja el Congreso durante la legislatura.", tone: LO,
    icon: `<path d="M3 20h18M5 20V10M10 20V10M14 20V10M19 20V10M2 10l10-6 10 6z"/>`,
    chapters: ["nou-govern", "congres"], tools: ["pactometre"] },
];
{
  const all = [...AP_CONTEXT_CHAPTERS, ...AP_CHAPTERS];
  AP_CHAPTERS.length = 0;
  AP_BLOCKS.forEach((b, bi) => {
    b.n = bi + 1;
    b.chapters = b.chapters.map((slug) => all.find((c) => c.slug === slug));
    b.chapters.forEach((c) => { c.block = b; c.part = b.n; AP_CHAPTERS.push(c); });
  });
  AP_CHAPTERS.forEach((c, i) => { c.n = i + 1; });
}

// ---------- Exemples interactius de la part 1 ----------
const AP_PRESIDENTS = [
  ["Adolfo Suárez", "UCD", 1976.5, 1981.15, LO, "1976-1981"],
  ["Leopoldo Calvo-Sotelo", "UCD", 1981.15, 1982.92, LO, "1981-1982"],
  ["Felipe González", "PSOE", 1982.92, 1996.35, "#e3101f", "1982-1996"],
  ["José María Aznar", "PP", 1996.35, 2004.3, "#1e88d6", "1996-2004"],
  ["José Luis Rodríguez Zapatero", "PSOE", 2004.3, 2011.97, "#e3101f", "2004-2011"],
  ["Mariano Rajoy", "PP", 2011.97, 2018.43, "#1e88d6", "2011-2018"],
  ["Pedro Sánchez", "PSOE", 2018.43, 2026.82, "#e3101f", "2018-"],
];
// Percentatge de vot del PSOE i d'AP/PP a cada elecció general (Ministeri de l'Interior)
const AP_BIPARTISAN = [
  ["1982", 48.1, 26.4], ["1986", 44.1, 26.0], ["1989", 39.6, 25.8], ["1993", 38.8, 34.8], ["1996", 37.6, 38.8],
  ["2000", 34.2, 44.5], ["2004", 42.6, 37.7], ["2008", 43.9, 39.9], ["2011", 28.8, 44.6], ["2015", 22.0, 28.7],
  ["2016", 22.6, 33.0], ["abr. 2019", 28.7, 16.7], ["nov. 2019", 28.0, 20.8], ["2023", 31.7, 33.1],
];
const AP_LEG_CATS = { parl: ["Gobierno y Parlamento", LB], elec: ["Elecciones", LO], just: ["Justicia", LP], soc: ["Sociedad", LR] };
const AP_LEGISLATURE = [
  [2023, "23 jul", "elec", "Elecciones generales: el PP gana con 137 escaños, pero ningún bloque llega a la mayoría absoluta."],
  [2023, "29 sept", "parl", "Alberto Núñez Feijóo no supera la investidura: 172 votos a favor y 177 en contra."],
  [2023, "16 nov", "parl", "Pedro Sánchez es investido con 179 votos (PSOE, Sumar, ERC, Junts, EH Bildu, PNV, BNG y CC), después de pactar una ley de amnistía con ERC y Junts."],
  [2023, "5 dic", "parl", "Podemos abandona el grupo de Sumar y pasa al Grupo Mixto."],
  [2024, "18 feb", "elec", "Elecciones en Galicia: el PP revalida la mayoría absoluta."],
  [2024, "29 abr", "parl", "Sánchez anuncia que sigue en el cargo después de cinco días de reflexión, a raíz de la investigación judicial a su mujer."],
  [2024, "12 mayo", "elec", "Elecciones en Cataluña: gana el PSC y los partidos independentistas pierden la mayoría en el Parlament. Salvador Illa es investido president en agosto."],
  [2024, "28 mayo", "parl", "España reconoce el Estado de Palestina."],
  [2024, "30 mayo", "parl", "El Congreso aprueba definitivamente la ley de amnistía, que entra en vigor el 11 de junio."],
  [2024, "9 jun", "elec", "Elecciones europeas: gana el PP y Se Acabó La Fiesta obtiene 3 escaños."],
  [2024, "25 jun", "parl", "PP y PSOE pactan renovar el Consejo General del Poder Judicial, que tenía el mandato caducado desde 2018."],
  [2024, "29 oct", "soc", "Una dana arrasa la provincia de Valencia y causa 229 muertos."],
  [2025, "28 abr", "soc", "Un apagón eléctrico deja sin luz toda la península ibérica durante horas."],
  [2025, "26 jun", "just", "El Tribunal Constitucional avala la ley de amnistía por 6 votos a 4."],
  [2025, "30 jun", "just", "Santos Cerdán, que había dimitido como secretario de organización del PSOE, ingresa en prisión provisional en el marco del caso Koldo."],
  [2025, "10 sept", "parl", "El Congreso tumba la reducción de la jornada laboral a 37,5 horas con los votos de PP, Vox y Junts."],
  [2025, "27 oct", "parl", "Junts rompe con el PSOE y anuncia que bloqueará las leyes del Gobierno."],
  [2025, "3 nov", "parl", "Carlos Mazón anuncia su dimisión como presidente de la Generalitat Valenciana por la gestión de la dana. Lo sustituye Juanfran Pérez Llorca, con los votos del PP y de Vox."],
  [2025, "20 nov", "just", "El Tribunal Supremo condena al fiscal general del Estado, Álvaro García Ortiz, a dos años de inhabilitación por revelación de datos reservados."],
  [2025, "27 nov", "just", "El exministro José Luis Ábalos y su exasesor Koldo García ingresan en prisión provisional, a la espera de juicio."],
  [2025, "21 dic", "elec", "Elecciones en Extremadura: gana el PP, que necesita a Vox para gobernar, y el PSOE obtiene el peor resultado de su historia en la comunidad."],
  [2026, "enero", "soc", "El paro baja del 10 % por primera vez desde 2008, según la Encuesta de Población Activa de finales de 2025."],
  [2026, "8 feb", "elec", "Elecciones en Aragón: gana el PP y Vox duplica sus escaños."],
  [2026, "15 mar", "elec", "Elecciones en Castilla y León: gana el PP, que vuelve a depender de Vox."],
  [2026, "17 mayo", "elec", "Elecciones en Andalucía: el PP gana, pero pierde la mayoría absoluta."],
  [2026, "2 oct", "parl", "El Congreso tumba dos decretos ley de vivienda con los votos en contra de PP, Vox, Junts y UPN, entre otros."],
  [2026, "6 oct", "parl", "El BOE publica la disolución de las Cortes y la convocatoria de elecciones para el 29 de noviembre."],
];
const AP_ISSUES = [
  { k: "hab", label: "Vivienda", why: "El precio de la vivienda ha crecido mucho más que los sueldos, sobre todo el alquiler en las grandes ciudades. El rechazo de dos decretos de vivienda en el Congreso precipitó el adelanto electoral." },
  { k: "ter", label: "Modelo territorial", why: "La amnistía, la financiación de Cataluña y el reconocimiento de la plurinacionalidad han marcado la legislatura. Es el debate que más separa a los bloques." },
  { k: "eco", label: "Economía e impuestos", why: "La economía ha crecido por encima de la media europea y el paro ha bajado del 10 %, pero la deuda pública sigue cerca del 100 % del PIB. Los partidos discrepan sobre quién debe pagar más impuestos." },
  { k: "treb", label: "Trabajo y pensiones", why: "Salario mínimo, jornada laboral y sostenibilidad de las pensiones. La reducción de la jornada a 37,5 horas no superó el Congreso en septiembre de 2025." },
  { k: "imm", label: "Inmigración", why: "La inmigración ha ganado peso en el debate: las llegadas a Canarias, el reparto de menores no acompañados y la regularización de personas en situación irregular." },
  { k: "clima", label: "Energía y clima", why: "El apagón del 28 de abril de 2025 reabrió el debate sobre el modelo energético: renovables, centrales nucleares e interconexiones." },
  { k: "ext", label: "Europa y mundo", why: "La guerra de Ucrania, Gaza, el gasto en defensa que reclama la OTAN y la relación con Estados Unidos marcan la política exterior." },
];
const AP_ISSUE_NEWS = { hab: "habitatge", ter: "territori", eco: "economia", treb: "economia", imm: "immigracio", clima: "energia", ext: "internacional" };
const AP_FAMILIES = [
  { t: "Socialdemocracia", c: "#e3101f", d: "Economía de mercado con un estado del bienestar fuerte: sanidad, educación y pensiones públicas, financiadas con impuestos progresivos.", p: ["psoe"] },
  { t: "Izquierda alternativa", c: "#e0306f", d: "Más peso del Estado y de los servicios públicos, y defensa del ecologismo, el feminismo y los derechos sociales. Incluye tradiciones comunistas y ecosocialistas.", p: ["fa", "podemos"] },
  { t: "Liberalismo", c: "#f2b600", d: "Libertad individual, economía de mercado y un Estado limitado. En España no hay ningún gran partido puramente liberal: es una tradición presente en parte del centroderecha.", p: ["pp", "junts"] },
  { t: "Conservadurismo y democracia cristiana", c: "#1e88d6", d: "Defensa de la tradición, la familia, el orden y la economía de mercado, a menudo con raíces cristianas.", p: ["pp", "pnv"] },
  { t: "Derecha radical y nacionalpopulismo", c: "#5cbf2a", d: "Nacionalismo fuerte, control estricto de la inmigración, rechazo de lo que llama «ideología de género» y desconfianza hacia la UE. La mayoría de la ciencia política sitúa ahí a Vox, que se define como patriótico y conservador.", p: ["vox"] },
  { t: "Nacionalismos y soberanismos", c: "#20b8c8", d: "Defienden Cataluña, el País Vasco, Galicia o Canarias como naciones o pueblos con derecho a decidir. Los hay de izquierdas y de centroderecha.", p: ["erc", "junts", "bildu", "pnv", "bng", "cc"] },
  { t: "Ecologismo", c: "#00a37a", d: "Sitúa la crisis climática y la protección del medio ambiente en el centro de la política. En España, está presente sobre todo dentro de las coaliciones de izquierdas.", p: ["fa"] },
  { t: "Populismo", c: "#5d4037", d: "Más que una ideología, es un estilo: presenta la política como un choque entre «el pueblo» y «las élites». Puede ser de izquierdas o de derechas, y se combina con otras ideologías.", p: ["salf"] },
];
const AP_LR = [
  ["Hay que subir los impuestos a las rentas más altas para financiar más servicios públicos.", "esq"],
  ["Hay que bajar impuestos para que las empresas creen más empleo.", "dre"],
  ["El Estado debe limitar el precio de los alquileres.", "esq"],
  ["Hay que endurecer las penas y reforzar la policía para garantizar el orden.", "dre"],
  ["Hay que facilitar vías legales de inmigración y regularizar a las personas que ya viven aquí.", "esq"],
  ["La familia tradicional y la religión son la base de la sociedad.", "dre"],
];

Object.assign(AP_WIDGETS, {
  presidents: {
    mount(el) {
      const t0 = 1976.5, t1 = 2026.82;
      el.innerHTML = `<div class="ap-pres card">
        <div class="ap-pres-bar">${AP_PRESIDENTS.map(([n, p, a, b, c]) => `<i style="flex:${(b - a).toFixed(2)};background:${c}" title="${n} (${p})"></i>`).join("")}</div>
        <div class="ap-pres-years"><span>1976</span><span>1986</span><span>1996</span><span>2006</span><span>2016</span><span>2026</span></div>
        <ol class="ap-pres-list">${AP_PRESIDENTS.map(([n, p, , , c, y]) => `<li style="--pc:${c}"><b>${n}</b><span><i>${p}</i>${y}</span></li>`).join("")}</ol>
      </div>`;
      void t0; void t1;
    },
  },
  bipartisan: {
    mount(el) {
      el.innerHTML = `<div class="ap-bip card">
        <p class="kicker">Voto conjunto del PSOE y del PP (AP hasta 1989)</p>
        <div class="ap-bip-chart">${AP_BIPARTISAN.map(([y, a, b]) => `
          <div class="ap-bip-col ${y === "2015" ? "mark" : ""}" title="${y}: PSOE ${String(a).replace(".", ",")} % · PP ${String(b).replace(".", ",")} %">
            <b>${Math.round(a + b)}</b>
            <div class="ap-bip-stack"><i class="pp" style="height:${b}%"></i><i class="ps" style="height:${a}%"></i></div>
            <small>${y.replace("abr. ", "A").replace("nov. ", "N")}</small>
          </div>`).join("")}</div>
        <div class="ap-bip-leg"><span><i class="ps"></i>PSOE</span><span><i class="pp"></i>AP / PP</span><span class="muted">Porcentaje sobre los votos válidos. Fuente: Ministerio del Interior.</span></div>
      </div>`;
    },
  },
  legislature: {
    mount(el) {
      let filter = "tots";
      el.innerHTML = `<div class="ap-leg">
        <div class="ap-leg-filter">${[["tots", "Todo", LI], ...Object.entries(AP_LEG_CATS).map(([k, [l, c]]) => [k, l, c])].map(([k, l, c]) => `<button type="button" data-f="${k}" style="--pc:${c}" class="${k === filter ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="ap-leg-list"></div>
      </div>`;
      const draw = () => {
        const items = AP_LEGISLATURE.filter((e) => filter === "tots" || e[2] === filter);
        let cur = 0;
        $(".ap-leg-list", el).innerHTML = items.map(([y, d, c, t]) => {
          const head = y !== cur ? `<h4 class="ap-leg-y">${y}</h4>` : "";
          cur = y;
          return `${head}<div class="ap-leg-item" style="--pc:${AP_LEG_CATS[c][1]}"><span class="d">${d}</span><p>${t}</p><span class="cat">${AP_LEG_CATS[c][0]}</span></div>`;
        }).join("");
      };
      $$("[data-f]", el).forEach((b) => b.addEventListener("click", () => {
        filter = b.dataset.f;
        $$("[data-f]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },
  issues: {
    mount(el) {
      let cur = AP_ISSUES[0].k;
      el.innerHTML = `<div class="ap-iss">
        <div class="ap-iss-tabs" role="tablist">${AP_ISSUES.map((i) => `<button type="button" role="tab" data-k="${i.k}" class="${i.k === cur ? "on" : ""}">${i.label}</button>`).join("")}</div>
        <div class="ap-iss-body card"></div>
      </div>`;
      const draw = () => {
        const i = AP_ISSUES.find((x) => x.k === cur);
        const rows = PARTIES.filter((p) => PARTY_ARGS[p.id]?.[cur]).map((p) => `
          <div class="ap-iss-row" style="--pc:${p.color}"><b>${p.sig}</b><p>${esc(PARTY_ARGS[p.id][cur])}</p></div>`).join("");
        const news = typeof newsFor === "function" ? newsFor({ topic: AP_ISSUE_NEWS[cur], days: 10, n: 4 }) : [];
        $(".ap-iss-body", el).innerHTML = `<p class="ap-iss-why"><b>Por qué importa.</b> ${esc(i.why)}</p><div class="ap-iss-rows">${rows}</div>
          <p class="ap-note">Resumen de los programas electorales de 2023 y de posiciones públicas. Los programas del 29N pueden introducir cambios.</p>
          ${news.length ? `<div class="ap-iss-news"><h5>En los titulares estos días</h5><div class="nt-row">${news.map((x) => nwCard(x, "mini")).join("")}</div></div>` : ""}`;
      };
      const onNews = () => { if (!el.isConnected) { document.removeEventListener("news:update", onNews); return; } draw(); };
      document.addEventListener("news:update", onNews);
      $$("[data-k]", el).forEach((b) => b.addEventListener("click", () => {
        cur = b.dataset.k;
        $$("[data-k]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },
  // Tres camins per a un govern que perd la majoria (Constitució, articles 86, 112, 114 i 115)
  govoptions: {
    mount(el) {
      const OPTS = [
        { k: "seguir", t: "Seguir gobernando", art: "Art. 86 y 134", tone: LB,
          how: "El Gobierno puede seguir mientras no prospere una [[moción de censura]]. Funciona con los presupuestos [[prorrogados|PRÓRROGA PRESUPUESTARIA]], negocia cada ley con los grupos y aprueba [[decretos ley|DECRETO LEY]], que el Congreso tiene que convalidar en 30 días.",
          good: "Puede acabar la legislatura y elegir cuándo convoca las elecciones.",
          bad: "Cada votación perdida lo desgasta, y puede quedarse sin poder aprobar nada." },
        { k: "confianca", t: "Plantear una cuestión de confianza", art: "Art. 112 y 114", tone: LP,
          how: "El presidente pide al Congreso que le renueve su apoyo, sobre su programa o sobre una decisión concreta. Basta con la mayoría simple: más síes que noes.",
          good: "Si la gana, sale reforzado ante sus socios.",
          bad: "Si la pierde, debe dimitir y el Congreso tiene que investir a un nuevo presidente." },
        { k: "dissoldre", t: "Disolver las Cortes y convocar elecciones", art: "Art. 115", tone: LR, chosen: true,
          how: "Es una decisión del presidente, previa deliberación del Consejo de Ministros. No la puede tomar mientras haya una moción de censura en trámite ni antes de que pase un año desde la última disolución. Las elecciones se celebran 54 días después de la convocatoria.",
          good: "Los ciudadanos deciden una nueva mayoría.",
          bad: "Las leyes en trámite decaen y el trabajo político se detiene hasta que hay nuevo Gobierno." },
      ];
      el.innerHTML = `<div class="ap-gopt">
        <div class="ap-gopt-tabs" role="tablist">${OPTS.map((o, i) => `<button type="button" role="tab" data-k="${o.k}" style="--gt:${o.tone}"><b>${i + 1}</b><span>${o.t}</span>${o.chosen ? `<em>El camino de 2026</em>` : ""}</button>`).join("")}</div>
        <div class="ap-gopt-body card" aria-live="polite"></div>
      </div>`;
      const draw = (k) => {
        const o = OPTS.find((x) => x.k === k);
        $$("[data-k]", el).forEach((b) => { b.classList.toggle("on", b.dataset.k === k); b.setAttribute("aria-selected", b.dataset.k === k); });
        $(".ap-gopt-body", el).style.setProperty("--gt", o.tone);
        $(".ap-gopt-body", el).innerHTML = `<p class="kicker">${o.art} de la Constitución</p><h4>${o.t}</h4><p>${rich(o.how)}</p>
          <div class="ap-gopt-pc"><div class="pro"><b>Si sale bien</b><span>${o.good}</span></div><div class="con"><b>El riesgo</b><span>${o.bad}</span></div></div>
          ${o.chosen ? `<p class="ap-gopt-real">Es lo que pasó en 2026: después de la caída de los decretos de vivienda, el presidente disolvió las Cortes y convocó las elecciones del 29N.</p>` : ""}`;
      };
      $$("[data-k]", el).forEach((b) => b.addEventListener("click", () => { Sfx.play("pick"); draw(b.dataset.k); }));
      draw("dissoldre");
    },
  },
  axes: {
    mount(el) {
      // Col·loca les etiquetes en files perquè no se solapin
      const lane = (items) => {
        const rows = [];
        return items.sort((a, b) => a.v - b.v).map((it) => {
          let r = 0;
          while (rows[r] !== undefined && it.v - rows[r] < 0.9) r++;
          rows[r] = it.v;
          return { ...it, r };
        });
      };
      const axis = (title, lo, hi, desc, items) => {
        const placed = items ? lane(items) : [];
        const rowsN = Math.max(1, ...placed.map((x) => x.r + 1));
        return `<div class="ap-axis">
          <div class="ap-axis-head"><b>${title}</b><span>${desc}</span></div>
          ${items ? `<div class="ap-axis-track" style="--rows:${rowsN}">${placed.map((x) => `<span class="ap-axis-dot" style="left:${x.v * 10}%;--pc:${x.c};--r:${x.r}">${x.s}</span>`).join("")}</div>` : `<div class="ap-axis-track empty"></div>`}
          <div class="ap-axis-ends"><span>${lo}</span><span>${hi}</span></div>
        </div>`;
      };
      const pts = (f) => PARTIES.map((p) => ({ s: p.sig, c: p.color, v: f(p) }));
      el.innerHTML = `<div class="ap-axes card">
        ${axis("Eje económico", "Más Estado", "Más mercado", "Impuestos, servicios públicos y regulación de la economía.", pts((p) => p.x))}
        ${axis("Eje territorial", "Centralismo", "Soberanismo", "Más unidad o más autogobierno, hasta la independencia.", pts((p) => p.y))}
        ${axis("Eje de valores", "Progresista", "Conservador", "Nuevos derechos, laicidad y cambio social, o tradición, familia y religión. Cada partido tiene posiciones diversas según el tema.", null)}
        <p class="ap-note">Posiciones aproximadas, basadas en los programas y en las votaciones en el Congreso. Las mismas que se usan en el mapa del comparador.</p>
      </div>`;
    },
  },
  families: {
    mount(el) {
      el.innerHTML = `<div class="ap-fam">${AP_FAMILIES.map((f) => `
        <article class="ap-fam-card" style="--fc:${f.c}">
          <b>${f.t}</b>
          <p>${esc(f.d)}</p>
          <div class="ap-fam-parties">${f.p.map((id) => { const p = PARTIES.find((x) => x.id === id); return p ? `<button type="button" data-party="${p.id}" style="--pc:${p.color}" title="Abre el comparador">${p.sig}</button>` : ""; }).join("")}</div>
        </article>`).join("")}</div>
        <p class="ap-note">Toca un partido para abrir su ficha en el comparador.</p>`;
      $$("[data-party]", el).forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.party;
        if (cmpSel.b === id) cmpSel.b = cmpSel.a;
        cmpSel.a = id;
        cmpSel.next = "b";
        renderParties();
        location.hash = "#apren/partits";
      }));
    },
  },
  lrquiz: {
    mount(el) {
      let hits = 0, answered = 0;
      el.innerHTML = `<div class="ap-sorter">
        <div class="ap-sorter-score"><b>0</b>/${AP_LR.length} aciertos</div>
        ${AP_LR.map(([t], i) => `<div class="ap-sort" data-i="${i}">
          <p>«${esc(t)}»</p>
          <div class="ap-sort-opts"><button type="button" data-a="esq">Más de izquierdas</button><button type="button" data-a="dre">Más de derechas</button></div>
          <small class="ap-sort-exp" hidden></small>
        </div>`).join("")}
      </div>`;
      $$(".ap-sort", el).forEach((row) => {
        const [, a] = AP_LR[Number(row.dataset.i)];
        $$("button", row).forEach((b) => b.addEventListener("click", () => {
          if (row.classList.contains("done")) return;
          row.classList.add("done");
          const ok = b.dataset.a === a;
          if (ok) hits++;
          answered++;
          Sfx.play(ok ? "ok" : "ko");
          $$("button", row).forEach((x) => {
            x.disabled = true;
            if (x.dataset.a === a) x.classList.add("right");
            else if (x === b) x.classList.add("wrong");
          });
          row.classList.add(ok ? "ok" : "ko");
          const exp = $(".ap-sort-exp", row);
          exp.hidden = false;
          exp.textContent = `${ok ? "✓" : "✕"} Tradicionalmente se asocia a la ${a === "esq" ? "izquierda" : "dreta"}, aunque algunos partidos combinan ideas de los dos bloques.`;
          $(".ap-sorter-score b", el).textContent = hits;
          if (answered === AP_LR.length) $(".ap-sorter-score", el).insertAdjacentHTML("beforeend", ` · ${hits === AP_LR.length ? "¡Perfecto!" : "¡Muy bien!"}`);
        }));
      });
    },
  },
});
