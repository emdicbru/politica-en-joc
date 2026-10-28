// Aprèn: guia del 29N en 8 capítols interactius, eines i diccionari.
// Contingut contrastat amb la Constitució, la LOREG, el Reglament del Congrés, el Reial decret 806/2026
// (BOE del 6 d'octubre) i les xifres de població de l'INE (1 d'abril del 2026).

const LI = "#17173d", LC = "#fffaf0", LY = "#ffcf3d", LR = "#ff4b2b", LB = "#3554ff", LG = "#0f9d58", LS = "#e2bf8c", LP = "#7b3fe4", LK = "#e0306f";
const lsvg = (body, vb = "0 0 160 110") => `<svg viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const apIcon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

// ---------- Il·lustracions ----------
const AP_ART = {
  hemi: (() => {
    const dots = [];
    [[26, 9], [38, 12], [50, 15]].forEach(([r, n]) => {
      for (let j = 0; j < n; j++) {
        const a = Math.PI * (1 - j / (n - 1));
        const f = j / (n - 1);
        dots.push(`<circle cx="${(80 + Math.cos(a) * r).toFixed(1)}" cy="${(90 - Math.sin(a) * r).toFixed(1)}" r="4.3" fill="${f < 0.42 ? LR : f < 0.52 ? LY : f < 0.6 ? LG : LB}" stroke="${LI}" stroke-width="1.6"/>`);
      }
    });
    return lsvg(`${dots.join("")}<path d="M20 96h120" stroke="${LI}" stroke-width="4"/>
      <g transform="rotate(-12 132 26)"><circle cx="132" cy="26" r="17" fill="${LC}" stroke="${LR}" stroke-width="3"/><text x="132" y="31" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="12" fill="${LR}">29N</text></g>`);
  })(),
  id: lsvg(`<rect x="20" y="22" width="104" height="66" rx="10" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="31" y="35" width="30" height="38" rx="6" fill="${LC}" stroke="${LI}" stroke-width="4"/>
    <circle cx="46" cy="49" r="6" fill="${LI}"/><path d="M36 68c2-7 18-7 20 0" stroke="${LI}" stroke-width="4"/><path d="M72 42h40M72 54h30M72 66h36" stroke="${LI}" stroke-width="4"/>
    <g transform="rotate(8 128 76)"><rect x="104" y="58" width="44" height="32" rx="4" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M104 61l22 15 22-15" stroke="${LI}" stroke-width="3.5"/></g>`),
  urn: lsvg(`<g transform="rotate(-8 80 30)"><rect x="60" y="4" width="40" height="44" rx="3" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M68 18h24M68 28h18" stroke="${LI}" stroke-width="3.5"/></g>
    <rect x="24" y="46" width="112" height="58" rx="8" fill="${LI}"/><rect x="56" y="40" width="48" height="10" rx="3" fill="${LC}" stroke="${LI}" stroke-width="3"/><path d="M48 76h64" stroke="${LY}" stroke-width="5"/>`),
  blanknul: lsvg(`<rect x="12" y="36" width="64" height="46" rx="5" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M12 40l32 23 32-23" stroke="${LI}" stroke-width="4"/>
    <g transform="rotate(6 116 54)"><rect x="92" y="14" width="50" height="70" rx="5" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M101 30h32M101 41h32M101 52h22" stroke="${LI}" stroke-width="3"/><path d="M98 22l38 54M136 22l-38 54" stroke="${LR}" stroke-width="5.5"/></g>`),
  bars: lsvg(`<path d="M16 96h128" stroke="${LI}" stroke-width="4"/>${[[24, 70, LR], [52, 52, LB], [80, 34, LY], [108, 10, "#c9c2b0"]].map(([x, hgt, f]) => `<rect x="${x}" y="${96 - hgt}" width="22" height="${hgt}" rx="3" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}
    <path d="M12 80h136" stroke="${LR}" stroke-width="3" stroke-dasharray="6 6"/>`),
  divide: lsvg(`${["÷1", "÷2", "÷3"].map((t, i) => `<rect x="${20 + i * 42}" y="14" width="36" height="22" rx="4" fill="${LI}"/><text x="${38 + i * 42}" y="30" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="12" fill="${LC}">${t}</text>`).join("")}
    ${[0, 1].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 42}" y="${44 + r * 28}" width="36" height="22" rx="4" fill="${(r === 0 && c < 2) || (r === 1 && c === 0) ? LY : "#fff"}" stroke="${LI}" stroke-width="3"/>`).join("")).join("")}`),
  seats: lsvg(`${[LR, LR, LR, LB, LB, LY, LR].map((f, i) => `<rect x="${18 + (i % 4) * 32}" y="${18 + Math.floor(i / 4) * 40}" width="26" height="30" rx="6" fill="${f}" stroke="${LI}" stroke-width="3"/>`).join("")}`),
  mega: lsvg(`<path d="M34 46h16l50-26v70L50 64H34z" fill="${LY}" stroke="${LI}" stroke-width="4"/><rect x="22" y="44" width="14" height="22" rx="4" fill="${LR}" stroke="${LI}" stroke-width="3.5"/>
    <path d="M52 66l7 24h13l-6-22" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M112 40c7 8 7 24 0 32M122 30c13 14 13 38 0 52" stroke="${LR}" stroke-width="4"/>`),
  board: lsvg(`<rect x="14" y="18" width="132" height="74" rx="10" fill="${LI}"/><text x="58" y="68" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="900" font-size="30" fill="${LY}">176</text>
    <rect x="104" y="30" width="32" height="20" rx="5" fill="${LG}" stroke="${LC}" stroke-width="2"/><text x="120" y="45" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">SÍ</text>
    <rect x="104" y="58" width="32" height="20" rx="5" fill="${LR}" stroke="${LC}" stroke-width="2"/><text x="120" y="73" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="10" fill="#fff">NO</text>`),
  palace: lsvg(`<path d="M18 44L80 14l62 30z" fill="${LC}" stroke="${LI}" stroke-width="4"/><rect x="22" y="44" width="116" height="8" fill="${LI}"/>
    ${[32, 50, 68, 86, 104, 122].map((x) => `<rect x="${x}" y="54" width="8" height="30" fill="#fff" stroke="${LI}" stroke-width="3"/>`).join("")}
    <rect x="16" y="84" width="128" height="10" rx="2" fill="${LY}" stroke="${LI}" stroke-width="3"/><circle cx="80" cy="33" r="5" fill="${LR}"/>`),
  ballotW: lsvg(`<g transform="rotate(-4 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><rect x="48" y="16" width="64" height="14" rx="3" fill="${LR}"/>
    <path d="M52 44h56M52 56h56M52 68h56M52 80h40M52 92h48" stroke="${LI}" stroke-width="3.5"/></g>`),
  ballotS: lsvg(`<g transform="rotate(3 80 56)"><rect x="40" y="8" width="80" height="96" rx="6" fill="${LS}" stroke="${LI}" stroke-width="4"/>
    ${[24, 42, 60, 78].map((y, i) => `<rect x="50" y="${y}" width="12" height="12" rx="2" fill="#fff" stroke="${LI}" stroke-width="3"/><path d="M70 ${y + 6}h38" stroke="${LI}" stroke-width="3.5"/>${i !== 2 ? `<path d="M52 ${y + 6}l3 4 6-8" stroke="${LR}" stroke-width="3.5"/>` : ""}`).join("")}</g>`),
  pin: lsvg(`<rect x="22" y="30" width="96" height="62" rx="8" fill="${LC}" stroke="${LI}" stroke-width="4"/><path d="M36 50h40M36 64h56M36 78h30" stroke="${LI}" stroke-width="4"/>
    <path d="M118 12c-12 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-8-20-20-20z" fill="${LR}" stroke="${LI}" stroke-width="4"/><circle cx="118" cy="32" r="7" fill="${LC}" stroke="${LI}" stroke-width="3"/>`),
  booth: lsvg(`<rect x="34" y="12" width="92" height="86" rx="6" fill="${LB}" stroke="${LI}" stroke-width="4"/><path d="M48 12v86M112 12v86" stroke="${LI}" stroke-width="3"/>
    <path d="M48 20c10 10 10 60 0 70M112 20c-10 10-10 60 0 70" stroke="${LC}" stroke-width="3"/><rect x="66" y="40" width="28" height="36" rx="3" fill="#fff" stroke="${LI}" stroke-width="3"/>`),
  envelope: lsvg(`<rect x="30" y="28" width="100" height="62" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M30 32l50 34 50-34" stroke="${LI}" stroke-width="4"/>`),
  door: lsvg(`<rect x="46" y="12" width="68" height="90" rx="4" fill="${LS}" stroke="${LI}" stroke-width="4"/><circle cx="100" cy="60" r="4" fill="${LI}"/>
    <path d="M20 102h120" stroke="${LI}" stroke-width="4"/><path d="M122 30l10-10M126 44h14M122 58l10 10" stroke="${LI}" stroke-width="4"/>`),
  nul: lsvg(`<rect x="44" y="10" width="72" height="92" rx="6" fill="#fff" stroke="${LI}" stroke-width="4"/><path d="M54 30h52M54 44h52M54 58h40" stroke="${LI}" stroke-width="3.5"/>
    <path d="M50 24l60 64M110 24l-60 64" stroke="${LR}" stroke-width="7"/>`),
};

// ---------- Glossari ----------
// Paraules que no surten al joc «Paraula clau» però que la guia necessita.
const GLOSSARY_EXTRA = [
  { w: "CENSO ELECTORAL", d: "Lista oficial de las personas con derecho a voto. La elabora la Oficina del Censo Electoral, que depende del INE." },
  { w: "MESA ELECTORAL", d: "Tres electores (presidente y dos vocales) elegidos por sorteo que se encargan de la votación y del recuento en un colegio." },
  { w: "TARJETA CENSAL", d: "Carta que te indica el colegio y la mesa donde votas. No hace falta llevarla para votar." },
  { w: "VOTO ÚTIL", d: "Votar a un partido con opciones de escaño en tu circunscripción en lugar del preferido, para que el voto no quede sin efecto." },
  { w: "ACUERDO DE LEGISLATURA", d: "Pacto entre un gobierno y uno o más partidos que no entran en él, pero que se comprometen a apoyarlo durante la legislatura." },
  { w: "VOTO POR CORREO", d: "Manera de votar sin ir al colegio: se pide en Correos y el voto se envía por correo certificado." },
  { w: "LEY D'HONDT", d: "Fórmula que reparte los escaños de cada provincia: los votos de cada partido se dividen entre 1, 2, 3… y los escaños van a los cocientes más altos." },
  { w: "ESCAÑO", d: "Asiento que ocupa un diputado o un senador y, por extensión, su cargo." },
  { w: "CANDIDATURA", d: "Lista de candidatos que presenta un partido, una coalición o una agrupación de electores." },
  { w: "MARGEN DE ERROR", d: "Intervalo dentro del cual es probable que se encuentre el resultado real de una encuesta. Cuanto mayor es la muestra, menor es el margen." },
  { w: "CAMPAÑA ELECTORAL", d: "Periodo de 15 días en el que los partidos pueden pedir el voto. Acaba a las 24 h del viernes anterior a la votación." },
  { w: "GOBIERNO EN FUNCIONES", d: "Gobierno que continúa en el cargo después de las elecciones hasta que toma posesión el nuevo. Solo puede gestionar el día a día." },
  { w: "PROYECTO DE LEY", d: "Propuesta de ley que presenta el Gobierno." },
  { w: "PROPOSICIÓN DE LEY", d: "Propuesta de ley que presentan los grupos parlamentarios, el Senado, los parlamentos autonómicos o la ciudadanía." },
  { w: "ILP", d: "Iniciativa legislativa popular: propuesta de ley que la ciudadanía puede llevar al Congreso con 500.000 firmas." },
  { w: "LEY ORGÁNICA", d: "Ley que regula derechos fundamentales, estatutos de autonomía o el régimen electoral, entre otros. Necesita la mayoría absoluta del Congreso." },
  { w: "SESIÓN CONSTITUTIVA", d: "Primera sesión de las nuevas Cortes, en la que los diputados y los senadores eligen las Mesas de cada cámara." },
  { w: "MESA DEL CONGRESO", d: "Órgano que dirige la cámara: la presidencia, cuatro vicepresidencias y cuatro secretarías." },
  { w: "GRUPO PARLAMENTARIO", d: "Agrupación de diputados de un mismo partido o coalición que actúa conjuntamente en la cámara." },
  { w: "VETO", d: "Rechazo de una ley por el Senado por mayoría absoluta. El Congreso lo puede levantar." },
  { w: "DISOLUCIÓN", d: "Final anticipado de la legislatura que decreta el presidente del Gobierno para convocar elecciones." },
];
const apNorm = (s) => String(s).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9' ]/g, "").trim();
const GLOSSARY = [...WORDS, ...GLOSSARY_EXTRA].sort((a, b) => a.w.localeCompare(b.w, "es"));
// Nom d'un terme del glossari en minúscules, respectant els noms propis i les sigles
const apTermName = (w) => (w.charAt(0) + w.slice(1).toLowerCase()).replace(/d'hondt/g, "D'Hondt").replace(/ del congrés/g, " del Congreso").replace(/ de l'estat/g, " del Estado").replace(/^Grup mixt$/, "Grupo Mixto").replace(/15-m$/, "15-M");
const glossaryFind = (key) => GLOSSARY.find((g) => apNorm(g.w) === apNorm(key));

// [[text]] o [[text|PARAULA]] es converteix en un terme del glossari que es pot tocar
const rich = (s) => String(s).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label, key) => {
  const g = glossaryFind(key || label);
  return g ? `<button type="button" class="term" data-term="${esc(g.w)}">${label}</button>` : label;
});

// ---------- Dades per als exemples ----------
// Diputats per circumscripció el 29N (Reial decret 806/2026): Madrid en guanya un i Cadis en perd un respecte del 2023.
// Mapa de rajoles: [nom, codi, columna, fila]
const AP_TILES = [
  ["A Coruña", "C", 0, 0], ["Lugo", "LU", 1, 0], ["Asturias", "O", 2, 0], ["Cantabria", "S", 3, 0], ["Vizcaya", "BI", 4, 0], ["Guipúzcoa", "SS", 5, 0],
  ["Pontevedra", "PO", 0, 1], ["Ourense", "OR", 1, 1], ["León", "LE", 2, 1], ["Palencia", "P", 3, 1], ["Burgos", "BU", 4, 1], ["Álava", "VI", 5, 1], ["Navarra", "NA", 6, 1], ["Huesca", "HU", 7, 1], ["Lleida", "L", 8, 1], ["Girona", "GI", 9, 1],
  ["Zamora", "ZA", 2, 2], ["Valladolid", "VA", 3, 2], ["Segovia", "SG", 4, 2], ["Soria", "SO", 5, 2], ["La Rioja", "LO", 6, 2], ["Zaragoza", "Z", 7, 2], ["Tarragona", "T", 8, 2], ["Barcelona", "B", 9, 2],
  ["Salamanca", "SA", 2, 3], ["Ávila", "AV", 3, 3], ["Madrid", "M", 4, 3], ["Guadalajara", "GU", 5, 3], ["Teruel", "TE", 7, 3], ["Castellón", "CS", 8, 3],
  ["Cáceres", "CC", 2, 4], ["Toledo", "TO", 4, 4], ["Cuenca", "CU", 5, 4], ["Valencia", "V", 7, 4], ["Islas Baleares", "PM", 9, 4],
  ["Badajoz", "BA", 2, 5], ["Ciudad Real", "CR", 4, 5], ["Albacete", "AB", 6, 5], ["Alicante", "A", 7, 5],
  ["Huelva", "H", 1, 6], ["Sevilla", "SE", 2, 6], ["Córdoba", "CO", 3, 6], ["Jaén", "J", 4, 6], ["Murcia", "MU", 6, 6],
  ["Cádiz", "CA", 2, 7], ["Málaga", "MA", 3, 7], ["Granada", "GR", 4, 7], ["Almería", "AL", 5, 7],
  ["Santa Cruz de Tenerife", "TF", 0, 8], ["Las Palmas", "GC", 1, 8], ["Ceuta", "CE", 3, 8], ["Melilla", "ML", 5, 8],
];
// Població a 1 d'abril del 2026 (INE) per comparar el pes del vot
const AP_POP = { Madrid: 7201554, Barcelona: 6028373, "Valencia": 2827263, Sevilla: 2004487, "Alicante": 2099866, "Soria": 90559, "Teruel": 137488, Zamora: 165510, "Segovia": 161261, "Ávila": 162743, "Cuenca": 201233, "Palencia": 160620, "Huesca": 234361, Ceuta: 84435, Melilla: 86616, Lugo: 328547 };
const AP_POP_TOTAL = 49801559;
const seatsOf = (name) => (PROVINCES.find((p) => p.name === name) || {}).seats || 0;

// ---------- Capítols ----------
const AP_CHAPTERS = [
  {
    slug: "que-votem", title: "Qué votamos el 29N", short: "Congreso, Senado y por qué hay elecciones ahora.", mins: 3, tone: LR, art: AP_ART.hemi,
    lead: "El 29 de noviembre se eligen las Cortes Generales, es decir, el Congreso y el Senado. Del nuevo Congreso saldrá, también, el próximo presidente del Gobierno.",
    key: ["El 29N se eligen 350 diputados y 209 senadores.", "El Congreso elige al presidente del Gobierno y tiene la última palabra sobre las leyes.", "La mayoría absoluta son 176 escaños: en 2023 no la tuvo ningún partido."],
    blocks: [
      { t: "h", h: "¿Por qué votamos ahora?" },
      { t: "p", h: "La legislatura que empezó después de las elecciones del 23 de julio de 2023 debía durar hasta 2027. Pero el 2 de octubre el Congreso tumbó dos [[decretos ley|DECRETO LEY]] de vivienda con los votos de PP, Vox y Junts, y el presidente Pedro Sánchez decidió adelantar las elecciones. El Real Decreto 806/2026, publicado en el BOE el 6 de octubre, disuelve las Cortes y convoca las elecciones para el 29 de noviembre." },
      { t: "callout", tone: "info", title: "Elecciones anticipadas", h: "La Constitución permite al presidente del Gobierno decretar la [[disolución]] de las Cortes antes de tiempo (artículo 115). Las elecciones se celebran siempre 54 días después de la convocatoria." },
      { t: "facts", items: [
        { n: 350, label: "diputados en el Congreso", c: LR },
        { n: 209, label: "senadores elegidos en las urnas", c: "#c39a5f" },
        { n: 176, label: "escaños para la mayoría absoluta", c: LB },
        { n: 52, label: "circunscripciones: 50 provincias, Ceuta y Melilla", c: "#f2b600" },
        { n: 3, suffix: " %", label: "de los votos válidos para entrar en el reparto", c: "#00a37a" },
        { n: 38.7, dec: 1, suffix: " M", label: "personas llamadas a votar", c: LP },
      ] },
      { t: "h", h: "Dos cámaras, dos papeletas" },
      { t: "compare",
        a: { title: "Congreso de los Diputados", tag: "Papeleta blanca", tone: "#fff", art: AP_ART.ballotW, items: [
          "<b>350 diputados</b>, elegidos por provincias.",
          "Listas cerradas: votas a un partido, no a personas.",
          "Elige al presidente del Gobierno en la [[investidura]].",
          "Aprueba las leyes y los [[presupuestos]], y tiene la última palabra.",
          "Puede hacer caer al Gobierno con una [[moción de censura]].",
        ] },
        b: { title: "Senado", tag: "Papeleta sepia", tone: LS, art: AP_ART.ballotS, items: [
          "<b>267 senadores</b>: 209 elegidos el 29N y 58 designados por los parlamentos autonómicos.",
          "Lista abierta: votas a personas, de partidos diferentes si quieres.",
          "Es la cámara de representación territorial.",
          "Puede enmendar o vetar las leyes, pero el Congreso las puede aprobar igualmente.",
          "Debe autorizar la aplicación del artículo 155.",
        ] } },
      { t: "h", h: "El Congreso que se renueva" },
      { t: "p", h: "Así quedó el Congreso el 23 de julio de 2023. Ningún partido tenía la [[mayoría absoluta]], por eso había que pactar. El 29N se vuelven a repartir los 350 escaños y empieza la XVI legislatura." },
      { t: "widget", w: "hemicycle" },
    ],
    quiz: [
      { q: "¿Cuántos escaños hacen falta para la mayoría absoluta en el Congreso?", opts: ["176", "175", "200", "150"], exp: "La mitad de 350 es 175. La mayoría absoluta es la mitad más uno: 176." },
      { q: "¿Qué cámara elige al presidente del Gobierno?", opts: ["El Congreso", "El Senado", "Las dos juntas", "Ninguna: lo nombra el Rey directamente"], exp: "El presidente sale de una votación de investidura en el Congreso. Después el Rey lo nombra formalmente." },
      { q: "¿Cuántos senadores se eligen en las urnas el 29N?", opts: ["209", "350", "267", "150"], exp: "Se eligen 209. Con los 58 que designan los parlamentos autonómicos, el Senado tendrá 267 miembros." },
    ],
    practice: { href: "#joc/majoria", label: "Juega a Haz mayoría", text: "Llega a los 176 escaños pactando con los partidos del Congreso." },
  },
  {
    slug: "qui-vota", title: "Quién puede votar y cómo", short: "Requisitos, documento, voto por correo y desde el extranjero.", mins: 3, tone: LB, art: AP_ART.id,
    lead: "Si tienes la nacionalidad española y 18 años el día de la votación, estás llamado a votar. Puedes hacerlo en tu colegio o por correo.",
    key: ["Vota quien tiene la nacionalidad española y 18 años el 29 de noviembre.", "Hay que llevar el DNI, el pasaporte o el carné de conducir originales. La tarjeta censal no es obligatoria.", "El voto por correo se pide hasta el 19 de noviembre y se envía hasta el 25."],
    blocks: [
      { t: "h", h: "Quién puede votar" },
      { t: "list", items: [
        "Las personas con <b>nacionalidad española</b>. Las extranjeras no pueden votar en las generales, aunque vivan aquí.",
        "Las que tengan <b>18 años cumplidos</b> el 29 de noviembre.",
        "Las que estén inscritas en el [[censo electoral]]. Se podía consultar y reclamar del 12 al 19 de octubre.",
      ] },
      { t: "callout", tone: "info", title: "¿Y la gente de la Unión Europea?", h: "Los ciudadanos de otros países de la UE que viven en España pueden votar en las municipales y en las europeas, pero no en las generales." },
      { t: "h", h: "Dónde me toca y qué tengo que llevar" },
      { t: "cards", items: [
        { title: "Mira dónde te toca", text: "La [[tarjeta censal]] te llega a casa a partir del 2 de noviembre y te indica el colegio y la mesa. Si no la recibes, puedes votar igualmente. También lo puedes consultar en la web del INE.", art: AP_ART.pin },
        { title: "Lleva un documento", text: "El original del DNI, el pasaporte o el carné de conducir, con fotografía. Las fotocopias no sirven.", art: AP_ART.id },
      ] },
      { t: "h", h: "Voto por correo, paso a paso" },
      { t: "steps", items: [
        { title: "Pídelo hasta el 19 de noviembre", text: "En cualquier oficina de Correos con el DNI, o por internet con certificado digital o DNI electrónico." },
        { title: "Recibirás la documentación en casa", text: "Las papeletas, los sobres y el certificado de inscripción en el censo." },
        { title: "Envíalo hasta el 25 de noviembre", text: "Mete la papeleta en el sobre de votación y, con el certificado, dentro del sobre grande. Lo envías por correo certificado, gratis." },
      ] },
      { t: "callout", tone: "warn", title: "Atención", h: "Si pides el [[voto por correo]], ya no podrás votar en persona el día 29." },
      { t: "h", h: "Otras situaciones" },
      { t: "cards", items: [
        { title: "Si vives en el extranjero", text: "Puedes enviar el voto por correo hasta el 24 de noviembre o depositarlo en el consulado del 21 al 26 de noviembre. Si solo estabas allí temporalmente, había que pedirlo hasta el 31 de octubre." },
        { title: "Voto accesible", text: "Las personas ciegas o con discapacidad visual podían pedir hasta el 2 de noviembre un kit en braille para votar de manera autónoma. Desde 2018, todas las personas con discapacidad tienen derecho a voto." },
        { title: "Si trabajas el 29N", text: "Si tu horario coincide con el de votación, puedes tener derecho a un permiso retribuido, de hasta cuatro horas, para ir a votar." },
      ] },
    ],
    quiz: [
      { q: "¿Hasta cuándo se puede pedir el voto por correo para el 29N?", opts: ["Hasta el 19 de noviembre", "Hasta el 25 de noviembre", "Hasta el 28 de noviembre", "El mismo día 29"], exp: "Se puede pedir hasta el 19 de noviembre. El 25 es el último día para enviarlo." },
      { q: "¿Puedes votar si no te ha llegado la tarjeta censal?", opts: ["Sí, con el DNI, el pasaporte o el carné de conducir", "No, es obligatoria", "Solo si lo autoriza la mesa", "Solo por correo"], exp: "La tarjeta censal solo informa. Lo que hace falta es un documento original que te identifique." },
      { q: "¿Una persona extranjera que vive en Barcelona desde hace 10 años puede votar el 29N?", opts: ["No, en las generales hace falta la nacionalidad española", "Sí, si está empadronada", "Sí, si es de la Unión Europea", "Solo al Senado"], exp: "En las generales solo vota quien tiene la nacionalidad española. La gente de la UE puede votar en las municipales y en las europeas." },
    ],
    practice: { href: "#joc/verificador", label: "Juega al Verificador", text: "Separa los hechos reales de los falsos lo más rápido que puedas." },
  },
  {
    slug: "dia-d", title: "El día D: en la mesa", short: "Papeletas, sobres y qué pasa dentro del colegio.", mins: 4, tone: "#f2b600", art: AP_ART.urn,
    lead: "Domingo 29 de noviembre, de 9 a 20 h. Qué pasa dentro del colegio electoral y cómo son las dos papeletas.",
    key: ["Se vota de 9 a 20 h, con dos papeletas: blanca para el Congreso y sepia para el Senado.", "En el Congreso votas una lista cerrada; en el Senado puedes marcar a personas de partidos diferentes.", "El recuento es público, y los resultados provisionales llegan la misma noche."],
    blocks: [
      { t: "steps", wide: true, items: [
        { title: "Busca tu mesa", text: "En la entrada hay listas con los nombres. Cada mesa tiene dos urnas: la del Congreso y la del Senado.", art: AP_ART.pin },
        { title: "Coge las papeletas", text: "Las encontrarás en las mesas y en la cabina. También puedes llevar las que te han enviado los partidos a casa.", art: AP_ART.ballotW },
        { title: "Elige en privado", text: "Puedes entrar en la cabina para meter las papeletas en los sobres sin que nadie te vea.", art: AP_ART.booth },
        { title: "Identifícate", text: "Enseña el documento a la mesa, que comprueba que estás en el censo.", art: AP_ART.id },
        { title: "Entrega los sobres", text: "Se los das al presidente de la mesa, que los mete en la urna: el blanco en la del Congreso y el sepia en la del Senado.", art: AP_ART.urn },
      ] },
      { t: "h", h: "Dos papeletas muy diferentes" },
      { t: "compare",
        a: { title: "Congreso", tag: "Papeleta y sobre blancos", tone: "#fff", art: AP_ART.ballotW, items: [
          "Cada partido tiene su papeleta, con una lista <b>cerrada y bloqueada</b>.",
          "Votas la lista entera, en el orden que ha decidido el partido.",
          "Si tachas, añades o cambias nombres, el voto es nulo.",
        ] },
        b: { title: "Senado", tag: "Papeleta y sobre sepia", tone: LS, art: AP_ART.ballotS, items: [
          "Una sola papeleta con todos los candidatos de la circunscripción.",
          "Marcas con una cruz a las personas que quieres, de cualquier partido.",
          "En las provincias que eligen 4 puedes marcar hasta 3. Si marcas más, el voto es nulo.",
        ] } },
      { t: "h", h: "Pruébalo: rellena una papeleta del Senado" },
      { t: "widget", w: "senate" },
      { t: "p", h: "No en todas partes se pueden hacer tres cruces: en Gran Canaria, Mallorca y Tenerife (3 senadores) puedes hacer 2; en Ceuta y Melilla (2 senadores), 1; y en las islas que eligen uno, también 1." },
      { t: "h", h: "Quién hay en la mesa" },
      { t: "cards", items: [
        { title: "Presidente y dos vocales", text: "Son electores del barrio elegidos por sorteo entre el 31 de octubre y el 4 de noviembre. Formar parte de la [[mesa electoral]] es obligatorio y se cobra una dieta." },
        { title: "Interventores y apoderados", text: "Personas designadas por los partidos para vigilar la votación y el recuento. Los [[interventores|INTERVENTOR]] pueden hacer constar reclamaciones en el acta." },
      ] },
      { t: "h", h: "A las 20 h, el recuento" },
      { t: "p", h: "A las 20 h el presidente anuncia el cierre. Votan las personas que todavía estaban dentro del local, se añaden los votos llegados por correo y, finalmente, votan los miembros de la mesa y los interventores. El recuento es público: cualquier persona puede asistir. Los resultados provisionales llegan la misma noche, y el [[escrutinio]] oficial lo hacen las juntas electorales del 4 al 7 de diciembre." },
    ],
    quiz: [
      { q: "¿De qué color es la papeleta del Senado?", opts: ["Sepia", "Blanca", "Azul", "Verde"], exp: "La del Congreso es blanca y la del Senado, sepia. Los sobres siguen los mismos colores." },
      { q: "¿Qué pasa si tachas un nombre de la lista del Congreso?", opts: ["El voto es nulo", "Ese candidato queda eliminado", "Cuenta como voto en blanco", "No pasa nada"], exp: "En el Congreso las listas son cerradas y bloqueadas: cualquier modificación hace que el voto sea nulo." },
      { q: "En una provincia que elige 4 senadores, ¿cuántas cruces puedes hacer como máximo?", opts: ["3", "4", "1", "2"], exp: "Hasta 3. Es un sistema de voto limitado: así la segunda fuerza también puede obtener senadores." },
    ],
    practice: { href: "#joc/contrarellotge", label: "Juega a Contrarreloj", text: "Responde tantas preguntas como puedas antes de que se acabe el tiempo." },
  },
  {
    slug: "blanc-nul", title: "Blanco, nulo o abstención", short: "Tres opciones que no son para ningún partido, pero no son iguales.", mins: 3, tone: LP, art: AP_ART.blanknul,
    lead: "No es lo mismo no ir a votar que votar en blanco o anular el voto. Cada opción tiene efectos diferentes sobre el resultado.",
    key: ["El voto en blanco es válido y cuenta para el umbral del 3 %, pero no da escaños a nadie.", "El voto nulo no cuenta para nada.", "La abstención no se cuenta: los escaños se reparten entre los votos válidos."],
    blocks: [
      { t: "types" },
      { t: "h", h: "¿Válido, blanco o nulo? Ponte a prueba" },
      { t: "widget", w: "sorter" },
      { t: "h", h: "El efecto (pequeño) del voto en blanco" },
      { t: "p", h: "El voto en blanco es un voto válido. Por eso hace un poco más difícil llegar al 3 % que hace falta para entrar en el reparto de escaños. Mueve la barra y mira qué le pasa al partido E." },
      { t: "widget", w: "blank" },
      { t: "callout", tone: "info", title: "En la práctica", h: "El [[umbral electoral]] del 3 % solo pesa en las provincias que eligen muchos diputados, como Madrid o Barcelona. En las pequeñas, para sacar un escaño hace falta mucho más del 3 % de los votos." },
      { t: "p", h: "La [[abstención]] no se cuenta en ningún sitio: los escaños se reparten igual entre los votos válidos, tanto si vota mucha gente como si vota poca." },
    ],
    quiz: [
      { q: "Un sobre vacío, sin ninguna papeleta, es…", opts: ["Un voto en blanco", "Un voto nulo", "Abstención", "Un voto para el partido más votado"], exp: "Un sobre sin papeleta cuenta como voto en blanco, que es un voto válido." },
      { q: "¿Cuál de estos cuenta para calcular el umbral del 3 %?", opts: ["El voto en blanco", "El voto nulo", "La abstención", "Ninguno de los tres"], exp: "El 3 % se calcula sobre los votos válidos, que incluyen los votos en blanco." },
      { q: "Hay dos papeletas del mismo partido dentro del sobre. ¿Qué pasa?", opts: ["Cuenta como un solo voto válido", "Es un voto nulo", "Cuenta doble", "Es un voto en blanco"], exp: "Si las papeletas son de la misma candidatura, cuenta como un solo voto. Si son de partidos diferentes, es nulo." },
    ],
    practice: { href: "#joc/verificador", label: "Juega al Verificador", text: "Pon a prueba tu ojo para los detalles." },
  },
  {
    slug: "vots-escons", title: "De votos a escaños", short: "Provincias, la ley D'Hondt y por qué no todos los votos pesan igual.", mins: 4, tone: "#00a37a", art: AP_ART.seats,
    lead: "El 29N no hay una sola elección, sino 52: una por circunscripción. Cada provincia reparte sus diputados con la ley D'Hondt.",
    key: ["El 29N hay 52 elecciones a la vez, una por circunscripción, con la ley D'Hondt.", "Las provincias pequeñas tienen más diputados de los que les tocarían por población.", "Los partidos grandes y los que concentran el voto en un territorio necesitan menos votos por escaño."],
    blocks: [
      { t: "h", h: "Cuántos diputados elige cada provincia" },
      { t: "p", h: "Cada provincia tiene 2 como mínimo; Ceuta y Melilla, 1 cada una; y los 248 restantes se reparten según la población. Para el 29N, Madrid gana uno (38) y Cádiz pierde uno (8). Toca una provincia para verlo." },
      { t: "widget", w: "provinces" },
      { t: "h", h: "No todos los votos pesan igual" },
      { t: "p", h: "Como todas las provincias parten de 2 diputados, las menos pobladas obtienen más de los que les tocarían por población. Un diputado de Soria representa a unos 45.000 habitantes; uno de Madrid, casi 190.000." },
      { t: "widget", w: "weight" },
      { t: "h", h: "Cómo funciona la ley D'Hondt" },
      { t: "hondt" },
      { t: "p", h: "Pruébalo con una provincia imaginaria. Mueve las barras y mira cómo cambian los escaños y qué cociente gana cada escaño." },
      { t: "widget", w: "dhondt" },
      { t: "callout", tone: "tip", title: "¿Quieres hacerlo con datos reales?", h: "En el <a href=\"#apren/simulador\">simulador de escaños</a> puedes escribir los votos de cada candidatura, el número de escaños y el voto en blanco." },
      { t: "play", mode: "express", h: "Funda un partido inventado, haz campaña en las 52 circunscripciones y comprueba cómo la [[ley D'Hondt]] y el umbral del 3 % convierten tus votos en escaños." },
    ],
    quiz: [
      { q: "¿Cuántos diputados elige Madrid el 29N?", opts: ["38", "37", "32", "40"], exp: "Son 38, uno más que en 2023, por el aumento de población. Cádiz pasa de 9 a 8." },
      { q: "¿Cuál es el mínimo de diputados de cada provincia (sin contar Ceuta y Melilla)?", opts: ["2", "1", "3", "4"], exp: "Cada provincia tiene 2 de entrada. Ceuta y Melilla eligen 1 cada una." },
      { q: "Con la ley D'Hondt, los votos de cada partido se dividen entre…", opts: ["1, 2, 3… hasta el número de escaños", "El número de electores de la provincia", "100", "El número de partidos"], exp: "Se hacen las divisiones entre 1, 2, 3… y los escaños van a los cocientes más altos." },
    ],
    practice: { href: "#apren/simulador", label: "Abre el simulador de escaños", text: "Haz el reparto de una provincia con tus datos." },
  },
  {
    slug: "campanya", title: "Campaña y encuestas", short: "Las reglas antes de votar y cómo leer una encuesta.", mins: 3, tone: LK, art: AP_ART.mega,
    lead: "Quince días de campaña, uno de reflexión y cinco sin encuestas. Estas son las reglas del juego antes de ir a votar.",
    key: ["La campaña va del 13 al 27 de noviembre, y el 28 es la jornada de reflexión.", "Del 24 al 28 de noviembre no se pueden publicar encuestas.", "Si la diferencia entre dos partidos es menor que el margen de error, es un empate técnico."],
    blocks: [
      { t: "widget", w: "campaign" },
      { t: "cards", items: [
        { title: "La campaña", text: "Del 13 al 27 de noviembre los partidos pueden pedir el voto: mítines, carteles, anuncios y debates. Los espacios gratuitos en las televisiones y radios públicas se reparten según los votos de las elecciones anteriores." },
        { title: "Jornada de reflexión", text: "El sábado 28 no se puede hacer campaña ni pedir el voto. La [[jornada de reflexión]] sirve para que cada uno decida con calma." },
        { title: "Cinco días sin encuestas", text: "Del 24 al 28 de noviembre no se pueden publicar ni difundir encuestas electorales (artículo 69.7 de la LOREG). Por eso el pactómetro las esconde esos días." },
      ] },
      { t: "h", h: "Cómo hay que leer una encuesta" },
      { t: "p", h: "Un [[sondeo]] pregunta a una muestra de personas (por ejemplo, 1.000) y extrapola el resultado. Siempre tiene un [[margen de error]]: cuanto mayor es la muestra, menor es. Mueve la barra y mira cuándo una diferencia entre dos partidos es real y cuándo es un empate técnico." },
      { t: "widget", w: "margin" },
      { t: "list", items: [
        "Mira el <b>tamaño de la muestra</b> y las <b>dates</b> en que se hizo.",
        "Si la diferencia entre dos partidos es menor que el margen de error, es un <b>empate técnico</b>.",
        "La <b>«cocina»</b> es cómo cada empresa ajusta las respuestas. Por eso encuestas hechas los mismos días dan resultados diferentes.",
        "Haz más caso de la <b>media de varias encuestas</b> que de una sola.",
        "Los escaños son una estimación: con 52 repartos provinciales, pequeños cambios de voto pueden mover escaños.",
      ] },
    ],
    quiz: [
      { q: "¿Cuándo empieza la campaña electoral del 29N?", opts: ["El 13 de noviembre", "El 6 de octubre", "El 24 de noviembre", "El 28 de noviembre"], exp: "Empieza a las 0 h del 13 de noviembre y acaba a las 24 h del 27: quince días." },
      { q: "¿Qué no se puede hacer durante la jornada de reflexión?", opts: ["Hacer campaña y pedir el voto", "Ir a votar por correo", "Publicar noticias", "Salir de casa"], exp: "El día antes de la votación está prohibida la propaganda electoral." },
      { q: "Una encuesta da al partido A el 30 % y al B el 28 %, con un margen de error de ±3 puntos. ¿Qué podemos decir?", opts: ["Que es un empate técnico", "Que A ganará seguro", "Que B ganará seguro", "Que la encuesta es falsa"], exp: "Una diferencia de 2 puntos es menor que el margen de error: los dos resultados podrían ser iguales." },
    ],
    practice: { href: "#apren/pactometre", label: "Abre el pactómetro", text: "Mira qué dicen las encuestas y quién podría sumar 176." },
  },
  {
    slug: "nou-govern", title: "Del recuento al nuevo Gobierno", short: "Escrutinio, constitución de las Cortes e investidura.", mins: 3, tone: "#1e88d6", art: AP_ART.board,
    lead: "Votar es solo el primer paso. Después vienen el escrutinio, la constitución de las Cortes y la investidura del presidente del Gobierno.",
    key: ["Las nuevas Cortes se constituyen el 23 de diciembre.", "El Rey propone un candidato, que necesita 176 síes, o más síes que noes 48 horas después.", "Mientras no hay nuevo Gobierno, el anterior sigue en funciones."],
    blocks: [
      { t: "widget", w: "after" },
      { t: "h", h: "Cómo funciona la investidura" },
      { t: "p", h: "Después de las consultas, el Rey propone un candidato. Este presenta su programa en el Congreso y pide la confianza de la cámara. En la primera votación necesita la mayoría absoluta (176 síes). Si no llega, 48 horas después basta con tener más síes que noes. Pruébalo:" },
      { t: "widget", w: "investiture" },
      { t: "callout", tone: "warn", title: "El reloj de los dos meses", h: "Si pasan dos meses desde la primera votación y ningún candidato ha sido investido, el Rey disuelve las Cortes y se vuelven a convocar elecciones (artículo 99 de la Constitución)." },
      { t: "h", h: "Mientras tanto, un Gobierno en funciones" },
      { t: "p", h: "Hasta que no toma posesión el nuevo Gobierno, el anterior sigue [[en funciones|GOBIERNO EN FUNCIONES]]: gestiona el día a día pero no puede, por ejemplo, presentar los presupuestos ni proyectos de ley. Cuando el presidente es investido, el Rey lo nombra y él elige a los ministros." },
      { t: "play", mode: "govern", h: "Después de la noche electoral, negocia con los demás partidos, elige medidas y fórmulas de apoyo e intenta superar la [[investidura]] en la primera o en la segunda votación." },
    ],
    quiz: [
      { q: "¿Qué hace falta para ser investido en la segunda votación?", opts: ["Más síes que noes", "176 síes", "Que nadie vote en contra", "Dos tercios de la cámara"], exp: "En la segunda votación, 48 horas después, basta con la mayoría simple: más síes que noes." },
      { q: "¿Cuánto tiempo hay para investir a un presidente antes de repetir las elecciones?", opts: ["Dos meses desde la primera votación", "Un año", "Quince días", "No hay límite"], exp: "El artículo 99 de la Constitución fija dos meses desde la primera votación de investidura." },
      { q: "¿Qué día se constituyen las nuevas Cortes?", opts: ["El 23 de diciembre", "Al día siguiente de las elecciones", "El 1 de enero", "El 6 de diciembre"], exp: "Lo fija el decreto de convocatoria: el 23 de diciembre a las 10 h." },
    ],
    practice: { href: "#apren/pactometre", label: "Abre el pactómetro", text: "Construye mayorías y comprueba si llegan a la investidura." },
  },
  {
    slug: "congres", title: "El Congreso por dentro", short: "Cómo se hace una ley y cómo se controla al Gobierno.", mins: 4, tone: LI, art: AP_ART.palace,
    lead: "¿Qué hacen los diputados durante la legislatura? Sobre todo tres cosas: hacer leyes, aprobar los presupuestos y controlar al Gobierno.",
    key: ["El Congreso hace las leyes, aprueba los presupuestos y controla al Gobierno.", "Una moción de censura necesita un candidato alternativo y 176 votos.", "Los decretos ley se tienen que convalidar en 30 días."],
    blocks: [
      { t: "h", h: "Cómo se hace una ley" },
      { t: "widget", w: "law" },
      { t: "callout", tone: "info", title: "Leyes orgánicas", h: "Las [[leyes orgánicas|LEY ORGÁNICA]] (derechos fundamentales, estatutos de autonomía, sistema electoral…) necesitan, además, la mayoría absoluta del Congreso en una votación final." },
      { t: "h", h: "Grupos parlamentarios" },
      { t: "p", h: "Para tener [[grupo propio|GRUPO PARLAMENTARIO]] hacen falta 15 diputados, o bien 5 diputados y el 15 % de los votos en las circunscripciones donde se presenta el partido (o el 5 % en todo el Estado). Quien no lo consigue va al [[Grupo Mixto]]. Tener grupo significa más tiempo para hablar, más recursos y más presencia en las comisiones." },
      { t: "h", h: "Controlar al Gobierno" },
      { t: "cards", items: [
        { title: "Sesión de control", text: "Los miércoles de pleno, los diputados preguntan al presidente y a los ministros, que tienen que responder." },
        { title: "Moción de censura", text: "Para hacer caer al Gobierno hay que proponer un candidato alternativo y conseguir 176 votos. Si prospera, ese candidato es el nuevo presidente, como pasó en 2018." },
        { title: "Cuestión de confianza", text: "La plantea el presidente para comprobar que todavía tiene apoyo. Basta con la mayoría simple." },
        { title: "Decretos ley", text: "El Gobierno los aprueba en casos de urgencia, pero el Congreso los tiene que convalidar en 30 días. Si no, decaen, como pasó con los de vivienda el 2 de octubre." },
      ] },
      { t: "play", mode: "legislatura", h: "Gobierna cuatro años: aprueba presupuestos y leyes orgánicas, convalida decretos ley y sobrevive a una [[moción de censura]] o a una [[cuestión de confianza]]." },
    ],
    quiz: [
      { q: "¿Cuántos votos necesita una moción de censura para prosperar?", opts: ["176", "175", "Más síes que noes", "210"], exp: "Hace falta la mayoría absoluta del Congreso: 176 diputados." },
      { q: "¿En cuánto tiempo debe convalidar el Congreso un decreto ley?", opts: ["30 días", "6 meses", "1 año", "No hace falta convalidarlo"], exp: "El artículo 86 de la Constitución da 30 días al Congreso para convalidarlo o derogarlo." },
      { q: "Si el Senado veta una ley, ¿quién tiene la última palabra?", opts: ["El Congreso", "El Senado", "El Tribunal Constitucional", "El Rey"], exp: "El Congreso puede levantar el veto por mayoría absoluta, o por mayoría simple pasados dos meses." },
    ],
    practice: { href: "#joc/paraula", label: "Juega a Palabra clave", text: "Adivina los conceptos del vocabulario parlamentario." },
  },
];
AP_CHAPTERS.forEach((c, i) => { c.n = i + 1; });

const AP_TOOLS = [
  { slug: "partits", title: "Comparador de partidos", text: "Ideario, propuestas y líderes, cara a cara.", tone: LR, icon: `<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/>` },
  { slug: "pactometre", title: "Pactómetro", text: "Encuestas y mayorías posibles.", tone: LB, icon: `<path d="M3 18a9 9 0 0118 0"/><path d="M7.5 18a4.5 4.5 0 019 0"/><path d="M12 3v3"/>` },
  { slug: "simulador", title: "Simulador de escaños", text: "Haz la ley D'Hondt con tus datos.", tone: "#00a37a", icon: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 16v-3M11 16V9M15 16v-5M19 16v-1"/>` },
  { slug: "calendari", href: "#calendari", title: "Calendario electoral", text: "Todas las fechas hasta el 29N.", tone: "#f2b600", icon: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>` },
  { slug: "actualitat", href: "#noticies", title: "Noticias", text: "Los titulares de los medios, al minuto, y el día en 1 minuto.", tone: LK, icon: `<path d="M4 5h13v14H6a2 2 0 01-2-2z"/><path d="M17 9h3v8a2 2 0 01-2 2"/><path d="M7 9h7M7 13h7M7 16h4"/>` },
  { slug: "diccionari", title: "Diccionario", text: `${GLOSSARY.length} conceptos, explicados fácil.`, tone: LP, icon: `<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>` },
];
const AP_TOOL_PAGES = ["partits", "pactometre", "simulador", "diccionari"];

// ---------- Progrés ----------
const learnData = () => Progress.data.learn || (Progress.data.learn = {});
const chapterDone = (c) => learnData()[c.slug] !== undefined;
const chapterPassed = (c) => (learnData()[c.slug] ?? -1) >= 2;

function awardLearnXp(xp) {
  const prev = Progress.levelIndex();
  Progress.data.xp += xp;
  Progress.save();
  renderLevel();
  const now = Progress.levelIndex();
  if (now > prev) toast(`Nuevo nivel: ${LEVELS[now].name}`, "ach");
  if (now >= 4) Progress.unlock("diputat");
  if (now >= 7) Progress.unlock("president");
}

// ---------- Encaminament dins de l'Aprèn ----------
// #apren: la portada · #apren/<capítol>: el capítol pas a pas · #apren/<capítol>/tot: el capítol sencer d'un cop
// #apren/essencials, /repas, /pla i /examen · les eines (#apren/partits…)
const AP_PAGES = { essencials: () => renderEssencials(), repas: () => renderRepas(), pla: () => renderPla(), examen: () => renderExam() };
function renderApren(arg) {
  document.body.classList.remove("lesson");
  const ch = AP_CHAPTERS.find((c) => c.slug === arg);
  const tool = AP_TOOL_PAGES.includes(arg) ? arg : null;
  $$("#view-apren > .ap-page").forEach((p) => { p.hidden = true; });
  closeTerm();
  if (AP_PAGES[arg]) {
    $("#ap-chapter").hidden = false;
    AP_PAGES[arg]();
  } else if (ch) {
    $("#ap-chapter").hidden = false;
    if (location.hash.split("/")[2] === "tot") renderChapter(ch);
    else renderLesson(ch);
  } else if (tool) {
    $(`#ap-tool-${tool}`).hidden = false;
    if (tool === "diccionari") renderDictionary();
  } else {
    $("#ap-hub").hidden = false;
    renderAprenRoute();
  }
  updateReadBar();
}

// El compte enrere global només actualitza si hi ha els elements; aquí l'omplim de seguida
function tickCountdownOnce() {
  const diff = ELECTION_DATE - Date.now();
  if (diff <= 0 || !$("#cd-d")) return;
  const s = Math.floor(diff / 1000);
  $("#cd-d").textContent = Math.floor(s / 86400);
  $("#cd-h").textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  $("#cd-m").textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  $("#cd-s").textContent = String(s % 60).padStart(2, "0");
}

// ---------- Capítol ----------
function renderChapter(ch) {
  const i = ch.n - 1;
  const prev = AP_CHAPTERS[i - 1], next = AP_CHAPTERS[i + 1];
  const root = $("#ap-chapter");
  root.style.setProperty("--tone", ch.tone);
  root.innerHTML = `
    <nav class="ap-crumb"><a href="#apren">← Aprende</a><span>Capítulo ${ch.n} de ${AP_CHAPTERS.length} · <a href="#apren/${ch.slug}">Léelo paso a paso</a></span></nav>
    <header class="ap-ch-head">
      <div class="ap-ch-headart">${ch.art}</div>
      <div>
        <p class="kicker">Parte ${ch.block.n} · ${esc(ch.block.title)} · Capítulo ${ch.n} · ${ch.mins} min</p>
        <h1 class="ap-title">${esc(ch.title)}</h1>
        <p class="ap-lead">${rich(ch.lead)}</p>
      </div>
    </header>
    ${ch.key ? `<aside class="ap-key"><p class="kicker">En 30 segundos</p><ul>${ch.key.map((k) => `<li>${rich(k)}</li>`).join("")}</ul></aside>` : ""}
    <div class="ap-body">${ch.blocks.map((b, k) => renderBlock(b, k)).join("")}</div>
    <section class="ap-quiz card" id="ap-quiz" aria-label="Compruébalo"></section>
    ${ch.practice ? `<a class="ap-practice" href="${ch.practice.href}"><span class="kicker">Ponlo en práctica</span><b>${esc(ch.practice.label)} →</b><small>${esc(ch.practice.text)}</small></a>` : ""}
    <nav class="ap-pager">
      ${prev ? `<a href="#apren/${prev.slug}" class="prev"><small>← Anterior</small><b>${prev.n}. ${esc(prev.title)}</b></a>` : `<a href="#apren" class="prev"><small>←</small><b>Volver a Aprende</b></a>`}
      ${next ? `<a href="#apren/${next.slug}" class="next"><small>Siguiente →</small><b>${next.n}. ${esc(next.title)}</b></a>` : `<a href="#apren" class="next"><small>Fin de la guía →</small><b>Volver a Aprende</b></a>`}
    </nav>`;
  // Exemples interactius i animacions
  $$(".ap-w", root).forEach((el) => AP_WIDGETS[el.dataset.w]?.mount(el));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    if (en.target.id === "hero-hemi") en.target.classList.add("play");
    else countUp(en.target);
  }), { threshold: 0.3 });
  $$("[data-count]", root).forEach((el) => io.observe(el));
  if ($("#hero-hemi", root)) io.observe($("#hero-hemi", root));
  renderQuiz(ch);
}

function renderBlock(b, k) {
  switch (b.t) {
    case "h": return `<h2 class="ap-h">${esc(b.h)}</h2>`;
    case "p": return `<p class="ap-p">${rich(b.h)}</p>`;
    case "callout": return `<aside class="ap-call ${b.tone || "info"}"><b>${esc(b.title)}</b><p>${rich(b.h)}</p></aside>`;
    case "list": return `<ul class="ap-list">${b.items.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>`;
    case "facts": return `<div class="num-grid ap-facts">${b.items.map((x, i) => `
      <div class="num-tile" style="--nc:${x.c};--i:${i}">
        <strong data-count="${x.n}" data-dec="${x.dec || 0}" data-suffix="${x.suffix || ""}">0${x.suffix || ""}</strong>
        <span>${esc(x.label)}</span>
      </div>`).join("")}</div>`;
    case "cards": return `<div class="ap-cards ${b.items.length === 4 ? "four" : ""}">${b.items.map((c) => `
      <article class="ap-card">${c.art ? `<div class="ap-card-art">${c.art}</div>` : ""}<b>${esc(c.title)}</b><p>${rich(c.text)}</p></article>`).join("")}</div>`;
    case "steps": return `<ol class="ap-steps ${b.wide ? "wide" : ""}">${b.items.map((s, i) => `
      <li class="ap-step" style="--i:${i}">${s.art ? `<div class="ap-step-art">${s.art}</div>` : ""}<span class="ap-step-n">${i + 1}</span><b>${esc(s.title)}</b><p>${rich(s.text)}</p></li>`).join("")}</ol>`;
    case "compare": return `<div class="ap-compare">${[b.a, b.b].map((s) => `
      <article class="ap-cmp" style="--st:${s.tone}">
        <header><div class="ap-cmp-art">${s.art}</div><div><b>${esc(s.title)}</b><small>${esc(s.tag)}</small></div></header>
        <ul>${s.items.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>
      </article>`).join("")}</div>`;
    case "types": return `<div class="vote-types">${AP_VOTE_TYPES.map((v) => `
      <article class="vtype" style="--vc:${v.c}">
        <div class="vt-art">${v.art}</div>
        <h3>${v.t}</h3><p>${v.d}</p>
        <ul>${v.facts.map(([ok, f]) => `<li class="${ok ? "yes" : "no"}"><i>${ok ? "✓" : "✕"}</i>${f}</li>`).join("")}</ul>
      </article>`).join("")}</div>`;
    case "hondt": return `<div class="hondt-steps">${AP_HONDT_STEPS.map((s) => `
      <div class="hstep"><div class="hs-art">${s.art}</div><h3>${s.t}</h3><p>${s.d}</p></div>`).join("")}</div>`;
    case "widget": return `<div class="ap-w" data-w="${b.w}" data-k="${k}"></div>`;
    case "play": return `<aside class="ap-play"><div class="ap-play-art">${ART.simulador ? ART.simulador() : ""}</div><div><b>Ponlo en práctica</b><p>${rich(b.h)}</p><a class="btn primary" href="#simulador" data-sim-mode="${b.mode}">Juega al Simulador del 29N</a></div></aside>`;
    default: return "";
  }
}

const AP_VOTE_TYPES = [
  { t: "Voto en blanco", d: "Un sobre vacío, o una papeleta del Senado sin ninguna cruz.", c: "#fff", art: AP_ART.envelope,
    facts: [[true, "Es un voto válido"], [true, "Cuenta para calcular el 3 %"], [false, "No da escaños a nadie"]] },
  { t: "Voto nulo", d: "Papeleta modificada, de más de un partido, con objetos o que no es la oficial.", c: "#ffd5cb", art: AP_ART.nul,
    facts: [[false, "No es un voto válido"], [false, "No cuenta para el 3 %"], [false, "No da escaños a nadie"]] },
  { t: "Abstención", d: "No ir a votar.", c: "#e6d9bf", art: AP_ART.door,
    facts: [[false, "No se cuenta en ningún sitio"], [false, "No afecta al cálculo del 3 %"], [false, "Los escaños se reparten igualmente"]] },
];
const AP_HONDT_STEPS = [
  { t: "1 · Umbral", d: "Quedan fuera las candidaturas que no llegan al 3 % de los votos válidos de la provincia.", art: AP_ART.bars },
  { t: "2 · Divide", d: "Los votos de cada partido se dividen entre 1, 2, 3… hasta el número de escaños.", art: AP_ART.divide },
  { t: "3 · Reparte", d: "Los escaños van a los cocientes más altos. Favorece a los partidos grandes en las provincias pequeñas.", art: AP_ART.seats },
];

// ---------- Test de cada capítol ----------
function renderQuiz(ch) {
  const box = $("#ap-quiz");
  let i = 0, hits = 0;
  const qs = ch.quiz.map((q) => {
    const order = shuffle(q.opts.map((_, k) => k));
    return { ...q, order };
  });
  const prevScore = learnData()[ch.slug];
  function intro() {
    box.innerHTML = `
      <div class="ap-quiz-head"><span class="ap-quiz-ico">✓</span><div><p class="kicker">Compruébalo</p><h2>Tres preguntas para fijarlo</h2>
      <p class="muted">${prevScore === undefined ? `Supéralo con 2 aciertos o más y gana hasta ${10 + 5 * 3} XP.` : `Tu mejor resultado: ${prevScore}/3.`}</p></div></div>
      <button class="btn primary lg" data-start>${prevScore === undefined ? "Empieza el test" : "Otra vez"}</button>`;
    $("[data-start]", box).addEventListener("click", () => { i = 0; hits = 0; question(); });
  }
  function question() {
    const q = qs[i];
    box.innerHTML = `
      <div class="ap-quiz-top"><span class="kicker">Pregunta ${i + 1} de ${qs.length}</span><span class="ap-dots">${qs.map((_, k) => `<i class="${k < i ? "done" : k === i ? "on" : ""}"></i>`).join("")}</span></div>
      <h3 class="ap-q">${esc(q.q)}</h3>
      <div class="choices">${q.order.map((k, n) => `<button class="choice" data-k="${k}"><span class="key">${"ABCD"[n]}</span><span class="ctext">${esc(q.opts[k])}</span></button>`).join("")}</div>`;
    $$(".choice", box).forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.k))));
  }
  function answer(k) {
    const q = qs[i];
    const ok = k === 0;
    if (ok) hits++;
    Sfx.play(ok ? "ok" : "ko");
    $$(".choice", box).forEach((b) => {
      b.disabled = true;
      const bk = Number(b.dataset.k);
      if (bk === 0) b.classList.add("correct");
      else if (bk === k) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    box.insertAdjacentHTML("beforeend", `<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong>${ok ? "¡Correcto!" : "No del todo"}</strong><span>${rich(q.exp)}</span></div>
      <div class="next-row"><button class="btn primary" data-next>${i + 1 < qs.length ? "Siguiente" : "Ver el resultado"}</button></div>`);
    $("[data-next]", box).addEventListener("click", () => { i++; i < qs.length ? question() : finish(); });
  }
  function finish() {
    const ld = learnData();
    const first = ld[ch.slug] === undefined;
    const prevBest = ld[ch.slug] ?? -1;
    ld[ch.slug] = Math.max(prevBest, hits);
    const xp = first ? 10 + 5 * hits : 0;
    if (xp) awardLearnXp(xp); else Progress.save();
    window.Track?.("chapter_complete", { chapter: ch.slug, score: hits });
    if (AP_CHAPTERS.every(chapterPassed)) Progress.unlock("informat");
    const passed = hits >= 2;
    if (passed) confetti?.();
    const next = AP_CHAPTERS[ch.n];
    box.innerHTML = `
      <div class="ap-result ${passed ? "ok" : "ko"}">
        <div class="ap-result-score"><b>${hits}</b><span>/${qs.length}</span></div>
        <div>
          <h3>${passed ? "¡Capítulo superado!" : "¡Casi!"}</h3>
          <p>${passed ? (hits === 3 ? "Pleno: lo has entendido todo." : "Buen trabajo. Puedes repetirlo para hacer el pleno.") : "Relee el capítulo y vuelve a intentarlo: necesitas 2 aciertos."}${xp ? ` <b>+${xp} XP</b>` : ""}</p>
        </div>
      </div>
      <div class="row">
        <button class="btn ghost" data-again>Otra vez</button>
        ${next ? `<a class="btn primary" href="#apren/${next.slug}">Capítulo ${next.n}: ${esc(next.title)} →</a>` : `<a class="btn primary" href="#apren">Volver a Aprende</a>`}
      </div>`;
    $("[data-again]", box).addEventListener("click", () => { i = 0; hits = 0; question(); });
  }
  intro();
}

// ---------- Exemples interactius ----------
const AP_WIDGETS = {
  hemicycle: {
    mount(el) {
      el.innerHTML = `<div class="ap-hemi">
        <div class="hero-art"><div class="hero-hemi" id="hero-hemi" role="img" aria-label="Composición del Congreso surgido de las elecciones del 23 de julio de 2023"></div></div>
        <div class="ap-hemi-side"><div class="maj-box"><strong>176</strong><span>escaños para la mayoría absoluta. Ningún partido tenía suficientes solo.</span></div><div class="hemi-legend" id="hemi-legend"></div></div>
      </div>`;
      renderHeroHemicycle();
    },
  },

  senate: {
    mount(el) {
      const parties = [
        { p: "Partido Azul", c: LB, names: ["Anna Puig", "Jordi Mas", "Laia Roca"] },
        { p: "Partido Verde", c: LG, names: ["Pere Vila", "Marta Sala", "Joan Coll"] },
        { p: "Partido Naranja", c: "#f59f24", names: ["Núria Ferrer", "Xavier Bosch"] },
      ];
      el.innerHTML = `<div class="ap-senate">
        <div class="ap-senate-paper">
          <p class="ap-senate-top">ELECCIONES AL SENADO · PROVINCIA IMAGINARIA<br><small>4 senadores · marca hasta 3 nombres</small></p>
          ${parties.map((g) => `<div class="ap-senate-party"><b style="--pc:${g.c}">${g.p}</b>${g.names.map((n) => `
            <label class="ap-senate-row"><input type="checkbox"><span class="box"></span><span>${n}</span></label>`).join("")}</div>`).join("")}
        </div>
        <div class="ap-senate-out" aria-live="polite"></div>
      </div>`;
      const out = $(".ap-senate-out", el);
      const update = () => {
        const n = $$("input:checked", el).length;
        const st = n === 0 ? ["blank", "Voto en blanco", "Una papeleta del Senado sin ninguna cruz cuenta como voto en blanco: es válido, pero no ayuda a ningún candidato."]
          : n <= 3 ? ["ok", `Voto válido · ${n} ${n === 1 ? "cruz" : "cruces"}`, `Cada persona marcada suma un voto. ${n < 3 ? `Todavía puedes marcar ${3 - n} más.` : "Ya has marcado el máximo."}`]
          : ["ko", "Voto nulo", `Has marcado ${n} nombres y el máximo es 3. Con más cruces de las permitidas, el voto no cuenta para nadie.`];
        out.className = `ap-senate-out ${st[0]}`;
        out.innerHTML = `<b>${st[1]}</b><p>${st[2]}</p>`;
      };
      $$("input", el).forEach((x) => x.addEventListener("change", () => { Sfx.play("pick"); update(); }));
      update();
    },
  },

  sorter: {
    mount(el) {
      const OPTS = [["valid", "Válido"], ["blanc", "En blanco"], ["nul", "Nulo"]];
      const cases = [
        { t: "Un sobre del Congreso vacío, sin papeleta", a: "blanc", e: "Un sobre sin papeleta es voto en blanco." },
        { t: "Papeleta del Congreso de un partido, sin ninguna marca", a: "valid", e: "Es la manera normal de votar al Congreso." },
        { t: "Papeleta del Congreso con el nombre de un candidato tachado", a: "nul", e: "La lista es cerrada y bloqueada: si la modificas, el voto es nulo." },
        { t: "Dos papeletas iguales, del mismo partido, dentro del sobre", a: "valid", e: "Cuenta como un solo voto válido para ese partido." },
        { t: "Papeletas de dos partidos diferentes dentro del sobre", a: "nul", e: "No se sabe a quién querías votar: es nulo." },
        { t: "Papeleta del Senado sin ninguna cruz", a: "blanc", e: "En el Senado, una papeleta sin ningún nombre marcado es voto en blanco." },
        { t: "Papeleta del Senado con 4 cruces en una provincia de 4 senadores", a: "nul", e: "El máximo es 3. Si marcas más, el voto es nulo." },
        { t: "Papeleta con un mensaje escrito a mano", a: "nul", e: "Cualquier alteración voluntaria de la papeleta la hace nula." },
      ];
      let hits = 0, answered = 0;
      el.innerHTML = `<div class="ap-sorter">
        <div class="ap-sorter-score"><b>0</b>/${cases.length} aciertos</div>
        ${cases.map((c, i) => `<div class="ap-sort" data-i="${i}">
          <p>${esc(c.t)}</p>
          <div class="ap-sort-opts">${OPTS.map(([k, l]) => `<button type="button" data-a="${k}">${l}</button>`).join("")}</div>
          <small class="ap-sort-exp" hidden></small>
        </div>`).join("")}
      </div>`;
      $$(".ap-sort", el).forEach((row) => {
        const c = cases[Number(row.dataset.i)];
        $$("button", row).forEach((b) => b.addEventListener("click", () => {
          if (row.classList.contains("done")) return;
          row.classList.add("done");
          const ok = b.dataset.a === c.a;
          if (ok) hits++;
          answered++;
          Sfx.play(ok ? "ok" : "ko");
          $$("button", row).forEach((x) => {
            x.disabled = true;
            if (x.dataset.a === c.a) x.classList.add("right");
            else if (x === b) x.classList.add("wrong");
          });
          row.classList.add(ok ? "ok" : "ko");
          const exp = $(".ap-sort-exp", row);
          exp.hidden = false;
          exp.textContent = `${ok ? "✓" : "✕"} ${c.e}`;
          $(".ap-sorter-score b", el).textContent = hits;
          if (answered === cases.length) $(".ap-sorter-score", el).insertAdjacentHTML("beforeend", ` · ${hits === cases.length ? "¡Perfecto!" : hits >= 6 ? "¡Muy bien!" : "Repasa los que has fallado"}`);
        }));
      });
    },
  },

  blank: {
    mount(el) {
      const base = [["A", 120000, LR], ["B", 95000, LB], ["C", 40000, "#f2b600"], ["D", 22000, LG], ["E", 8800, LP]];
      el.innerHTML = `<div class="ap-blank card">
        <label class="ap-range"><span>Votos en blanco: <b class="v">0</b></span><input type="range" min="0" max="20000" step="500" value="0"></label>
        <div class="ap-blank-bars"></div>
        <p class="ap-blank-out" aria-live="polite"></p>
      </div>`;
      const inp = $("input", el);
      const draw = () => {
        const blank = Number(inp.value);
        const valid = base.reduce((s, p) => s + p[1], 0) + blank;
        const min = valid * 0.03;
        $(".v", el).textContent = fmt(blank);
        const max = base[0][1];
        $(".ap-blank-bars", el).innerHTML = base.map(([n, v, c]) => `
          <div class="ap-bb ${v < min ? "out" : ""}"><span>Partido ${n}</span><div class="track"><i style="width:${(v / max) * 100}%;background:${c}"></i><em style="left:${(min / max) * 100}%"></em></div><b>${((v / valid) * 100).toFixed(2).replace(".", ",")} %</b></div>`).join("");
        const e = base[4][1];
        $(".ap-blank-out", el).innerHTML = e >= min
          ? `El umbral es de <b>${fmt(Math.ceil(min))} votos</b> (3 % de ${fmt(valid)} votos válidos). El partido E, con ${fmt(e)}, <b>entra</b> en el reparto.`
          : `Ahora el umbral sube a <b>${fmt(Math.ceil(min))} votos</b>. El partido E, con ${fmt(e)}, <b>se queda fuera</b> del reparto por culpa de los votos en blanco.`;
      };
      inp.addEventListener("input", draw);
      draw();
    },
  },

  provinces: {
    mount(el) {
      const max = Math.max(...PROVINCES.map((p) => p.seats));
      const tone = (s) => (s >= 30 ? 5 : s >= 10 ? 4 : s >= 6 ? 3 : s >= 4 ? 2 : 1);
      el.innerHTML = `<div class="ap-map card">
        <div class="ap-tiles" role="list">${AP_TILES.map(([name, code, x, y]) => {
          const s = seatsOf(name);
          return `<button type="button" role="listitem" class="ap-tile t${tone(s)}" style="--x:${x};--y:${y}" data-name="${esc(name)}" aria-label="${esc(name)}: ${s} diputados"><small>${code}</small><b>${s}</b></button>`;
        }).join("")}
          <span class="ap-canary" aria-hidden="true">Canarias</span>
        </div>
        <div class="ap-map-side">
          <div class="ap-map-info" aria-live="polite"></div>
          <div class="ap-map-legend">${[[1, "1-3"], [2, "4-5"], [3, "6-8"], [4, "9-16"], [5, "30+"]].map(([t, l]) => `<span><i class="t${t}"></i>${l}</span>`).join("")}</div>
        </div>
      </div>`;
      const info = $(".ap-map-info", el);
      const show = (name) => {
        const s = seatsOf(name), pop = AP_POP[name];
        $$(".ap-tile", el).forEach((t) => t.classList.toggle("sel", t.dataset.name === name));
        info.innerHTML = `<b>${esc(name)}</b><span class="big">${s}</span><span>${s === 1 ? "diputat" : "diputados"}</span>${pop ? `<small>${fmt(Math.round(pop / s / 100) * 100)} habitantes por diputado</small>` : ""}${name === "Madrid" ? `<small>Un diputado más que en 2023</small>` : name === "Cádiz" ? `<small>Un diputado menos que en 2023</small>` : ""}`;
      };
      $$(".ap-tile", el).forEach((t) => t.addEventListener("click", () => { Sfx.play("pick"); show(t.dataset.name); }));
      show("Madrid");
      void max;
    },
  },

  weight: {
    mount(el) {
      const rows = ["Madrid", "Barcelona", "Valencia", "Sevilla", null, "Lugo", "Zamora", "Teruel", "Soria"].map((n) => n
        ? { n, v: AP_POP[n] / seatsOf(n) }
        : { n: "Media de España", v: AP_POP_TOTAL / 350, avg: true });
      const max = Math.max(...rows.map((r) => r.v));
      el.innerHTML = `<div class="ap-weight card">
        <p class="kicker">Habitantes por diputado</p>
        ${rows.map((r) => `<div class="ap-wrow ${r.avg ? "avg" : ""}"><span>${esc(r.n)}</span><div class="track"><i style="width:${(r.v / max) * 100}%"></i></div><b>${fmt(Math.round(r.v / 100) * 100)}</b></div>`).join("")}
        <p class="ap-note">Un voto en Soria pesa unas <b>${(rows[0].v / rows[rows.length - 1].v).toFixed(1).replace(".", ",")} veces</b> más que uno en Madrid. Población a 1 de abril de 2026 (INE).</p>
      </div>`;
    },
  },

  dhondt: {
    mount(el) {
      const P = [["Azul", LB, 42], ["Rojo", LR, 30], ["Amarillo", "#f2b600", 17], ["Verde", LG, 8]];
      let seats = 5;
      el.innerHTML = `<div class="ap-dh card">
        <div class="ap-dh-controls">
          ${P.map(([n, c, v], i) => `<label class="ap-range" style="--pc:${c}"><span><i></i>${n}: <b data-v="${i}">${v}.000</b> votos</span><input type="range" min="0" max="80" step="1" value="${v}" data-i="${i}"></label>`).join("")}
          <div class="ap-dh-seats"><span>Escaños de la provincia:</span>${[3, 5, 7].map((s) => `<button type="button" data-s="${s}" class="${s === seats ? "on" : ""}">${s}</button>`).join("")}</div>
        </div>
        <div class="ap-dh-out">
          <div class="ap-dh-chips" aria-live="polite"></div>
          <div class="ap-dh-table"></div>
          <p class="ap-note"></p>
        </div>
      </div>`;
      const draw = () => {
        const votes = P.map((_, i) => Number($(`input[data-i="${i}"]`, el).value) * 1000);
        P.forEach((_, i) => { $(`[data-v="${i}"]`, el).textContent = fmt(votes[i]); });
        const valid = votes.reduce((a, b) => a + b, 0) || 1;
        const elig = votes.map((v) => v >= valid * 0.03 && v > 0);
        const { won, winners } = dhondt(votes.map((v, i) => (elig[i] ? v : 0)), seats);
        const rank = new Map(winners.map((w, k) => [`${w.pi}-${w.d}`, k + 1]));
        $(".ap-dh-chips", el).innerHTML = `${winners.map((w, k) => `<span class="ap-seat" style="--pc:${P[w.pi][1]};--k:${k}" title="Escaño ${k + 1}: ${P[w.pi][0]}">${k + 1}</span>`).join("")}
          <span class="ap-dh-sum">${P.map(([n, c], i) => `<em style="--pc:${c}">${n} ${won[i]}</em>`).join("")}</span>`;
        $(".ap-dh-table", el).innerHTML = `<table class="q-table"><tr><th></th>${Array.from({ length: seats }, (_, d) => `<th>÷${d + 1}</th>`).join("")}</tr>
          ${P.map(([n, c], i) => `<tr><td><i class="sw" style="background:${c}"></i>${n}</td>${Array.from({ length: seats }, (_, d) => {
            const r = rank.get(`${i}-${d + 1}`);
            return `<td class="${r ? "win" : ""}">${elig[i] ? fmt(Math.round(votes[i] / (d + 1))) : "—"}${r ? `<span class="rank">#${r}</span>` : ""}</td>`;
          }).join("")}</tr>`).join("")}</table>`;
        const out = P.filter((_, i) => !elig[i] && votes[i] > 0).map(([n]) => n);
        const last = winners[winners.length - 1];
        $(".ap-note", el).innerHTML = `${last ? `El último escaño lo obtiene el partido <b>${P[last.pi][0]}</b> con un cociente de ${fmt(Math.round(last.q))}. ` : ""}${out.length ? `Quedan fuera por no llegar al 3 %: ${out.join(", ")}.` : ""}`;
      };
      $$("input", el).forEach((x) => x.addEventListener("input", draw));
      $$("[data-s]", el).forEach((b) => b.addEventListener("click", () => {
        seats = Number(b.dataset.s);
        $$("[data-s]", el).forEach((x) => x.classList.toggle("on", x === b));
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },

  campaign: {
    mount(el) {
      const items = [
        ["2026-11-13", "13 nov", "Empieza la campaña"],
        ["2026-11-19", "19 nov", "Último día para pedir el voto por correo"],
        ["2026-11-24", "24 nov", "Empiezan los días sin encuestas"],
        ["2026-11-25", "25 nov", "Último día para enviar el voto por correo"],
        ["2026-11-27", "27 nov", "Acaba la campaña (24 h)"],
        ["2026-11-28", "28 nov", "Jornada de reflexión"],
        ["2026-11-29", "29 nov", "Votación, de 9 a 20 h"],
      ];
      const today = todayKey();
      let marked = false;
      el.innerHTML = `<ol class="ap-camp">${items.map(([d, l, t]) => {
        let cls = d < today ? "done" : "";
        if (!marked && d >= today) { cls = d === today ? "today" : "next"; marked = true; }
        return `<li class="${cls}${d === "2026-11-29" ? " key" : ""}"><span class="d">${l}</span><span class="t">${t}</span></li>`;
      }).join("")}</ol>`;
    },
  },

  margin: {
    mount(el) {
      const A = 32, B = 27;
      el.innerHTML = `<div class="ap-margin card">
        <label class="ap-range"><span>Tamaño de la muestra: <b class="v"></b> personas</span><input type="range" min="400" max="4000" step="100" value="1000"></label>
        <div class="ap-mg-axis">
          ${[["A", A, LB], ["B", B, LR]].map(([n, v, c]) => `<div class="ap-mg-row" data-n="${n}" style="--pc:${c}"><span>Partido ${n} · ${v} %</span><div class="ap-mg-track"><i class="band"></i><i class="pt"></i></div></div>`).join("")}
          <div class="ap-mg-scale"><span>20 %</span><span>25 %</span><span>30 %</span><span>35 %</span><span>40 %</span></div>
        </div>
        <p class="ap-mg-out" aria-live="polite"></p>
      </div>`;
      const inp = $("input", el);
      const pos = (v) => ((v - 20) / 20) * 100;
      const draw = () => {
        const n = Number(inp.value);
        const m = 1.96 * Math.sqrt(0.25 / n) * 100;
        $(".v", el).textContent = fmt(n);
        [["A", A], ["B", B]].forEach(([k, v]) => {
          const row = $(`[data-n="${k}"]`, el);
          $(".band", row).style.left = `${pos(v - m)}%`;
          $(".band", row).style.width = `${pos(v + m) - pos(v - m)}%`;
          $(".pt", row).style.left = `${pos(v)}%`;
        });
        const overlap = A - m <= B + m;
        $(".ap-mg-out", el).innerHTML = `Margen de error: <b>±${m.toFixed(1).replace(".", ",")} puntos</b>. ${overlap
          ? "Los intervalos se superponen: la diferencia de 5 puntos todavía podría ser ruido. Es un <b>empate técnico</b>."
          : "Los intervalos ya no se superponen: con esta muestra, A va <b>claramente por delante</b>."}`;
      };
      inp.addEventListener("input", draw);
      draw();
    },
  },

  after: {
    mount(el) {
      const steps = [
        ["29 nov", "Votación y recuento", "La misma noche hay resultados provisionales."],
        ["4-7 dic", "Escrutinio oficial", "Las juntas electorales provinciales proclaman a los electos."],
        ["23 dic", "Se constituyen las Cortes", "A las 10 h, Congreso y Senado eligen sus Mesas y presidencias."],
        ["Consultas", "El Rey habla con los grupos", "Y propone un candidato a la presidencia del Gobierno."],
        ["Investidura", "176 síes, o más síes que noes", "1.ª votación: mayoría absoluta. 2.ª, 48 horas después: mayoría simple."],
        ["2 meses", "O nuevas elecciones", "Si en dos meses nadie es investido, se disuelven las Cortes.", true],
      ];
      el.innerHTML = `<ol class="ap-after">${steps.map(([k, t, d, w], i) => `<li class="${w ? "warn" : ""}" style="--i:${i}"><span class="k">${k}</span><b>${t}</b><p>${d}</p></li>`).join("")}</ol>`;
    },
  },

  investiture: {
    mount(el) {
      const presets = [["Mayoría clara", 180, 0], ["Con abstenciones", 171, 169], ["Empate", 170, 170], ["Sin suficientes apoyos", 160, 175]];
      el.innerHTML = `<div class="ap-inv card">
        <div class="ap-inv-presets">${presets.map(([l], i) => `<button type="button" data-p="${i}">${l}</button>`).join("")}</div>
        <label class="ap-range" style="--pc:${LG}"><span><i></i>Sí: <b class="si"></b></span><input type="range" min="0" max="350" value="171" data-k="si"></label>
        <label class="ap-range" style="--pc:${LR}"><span><i></i>No: <b class="no"></b></span><input type="range" min="0" max="350" value="169" data-k="no"></label>
        <p class="ap-inv-abs">Abstenciones: <b></b></p>
        <div class="ap-inv-res">
          <div class="r1"><small>1.ª votación · hacen falta 176 síes</small><b></b></div>
          <div class="r2"><small>2.ª votación · más síes que noes</small><b></b></div>
        </div>
      </div>`;
      const si = $('[data-k="si"]', el), no = $('[data-k="no"]', el);
      const draw = (moved) => {
        let s = Number(si.value), n = Number(no.value);
        if (s + n > 350) { if (moved === "si") n = 350 - s; else s = 350 - n; si.value = s; no.value = n; }
        $(".si", el).textContent = s;
        $(".no", el).textContent = n;
        $(".ap-inv-abs b", el).textContent = 350 - s - n;
        const r1 = s >= 176, r2 = s > n;
        $(".r1", el).className = `r1 ${r1 ? "ok" : "ko"}`;
        $(".r1 b", el).textContent = r1 ? "¡Investido!" : `No (${s} de 176)`;
        $(".r2", el).className = `r2 ${r1 ? "na" : r2 ? "ok" : "ko"}`;
        $(".r2 b", el).textContent = r1 ? "No hace falta" : r2 ? "¡Investido!" : s === n ? "No: empate" : "No";
      };
      si.addEventListener("input", () => draw("si"));
      no.addEventListener("input", () => draw("no"));
      $$("[data-p]", el).forEach((b) => b.addEventListener("click", () => {
        const [, s, n] = presets[Number(b.dataset.p)];
        si.value = s; no.value = n;
        Sfx.play("pick");
        draw();
      }));
      draw();
    },
  },

  law: {
    mount(el) {
      const steps = [
        ["Iniciativa", "El Gobierno presenta un [[proyecto de ley]], o bien los grupos, el Senado, un parlamento autonómico o 500.000 firmas ([[ILP]]) presentan una [[proposición de ley]]."],
        ["Enmiendas", "Los grupos pueden presentar [[enmiendas|ENMIENDA]]. Una enmienda a la totalidad, si prospera, tumba el texto."],
        ["Ponencia y comisión", "Un grupo reducido de diputados ([[ponencia]]) y después la comisión negocian y reescriben el texto."],
        ["Pleno del Congreso", "Todos los diputados votan el texto."],
        ["Senado", "Tiene dos meses para aprobarlo, enmendarlo o ponerle un [[veto]] por mayoría absoluta."],
        ["Vuelve al Congreso", "Acepta o rechaza las enmiendas del Senado. Puede levantar el veto por mayoría absoluta, o por mayoría simple pasados dos meses."],
        ["Sanción y BOE", "El Rey sanciona la ley y se publica en el BOE. A partir de aquí, es de obligado cumplimiento."],
      ];
      el.innerHTML = `<ol class="ap-law">${steps.map(([t, d], i) => `<li style="--i:${i}"><span class="n">${i + 1}</span><div><b>${t}</b><p>${rich(d)}</p></div></li>`).join("")}</ol>`;
    },
  },
};

// ---------- Glossari emergent ----------
let termPop = null;
function closeTerm() {
  termPop?.remove();
  termPop = null;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (!t) {
    if (termPop && !e.target.closest(".term-pop")) closeTerm();
    return;
  }
  e.preventDefault();
  const g = glossaryFind(t.dataset.term);
  if (!g) return;
  closeTerm();
  termPop = h(`<div class="term-pop" role="dialog" aria-label="${esc(g.w)}">
    <b>${esc(apTermName(g.w))}</b><p>${esc(g.d)}</p>
    <a href="#apren/diccionari">Abre el diccionario →</a>
  </div>`);
  document.body.appendChild(termPop);
  const r = t.getBoundingClientRect();
  const w = Math.min(300, innerWidth - 24);
  termPop.style.width = `${w}px`;
  termPop.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + scrollX}px`;
  const below = r.bottom + 10 + termPop.offsetHeight < innerHeight - 90;
  termPop.style.top = `${(below ? r.bottom + 10 : r.top - termPop.offsetHeight - 10) + scrollY}px`;
  termPop.classList.add(below ? "below" : "above");
  Sfx.play("pick");
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTerm(); });
window.addEventListener("hashchange", closeTerm);

// ---------- Diccionari ----------
let dictQuery = "";
function renderDictionary() {
  const root = $("#dict-root");
  if (!root) return;
  if (!root.dataset.ready) {
    root.dataset.ready = "1";
    root.innerHTML = `
      <label class="dict-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" placeholder="Busca un concepto…" aria-label="Busca en el diccionario" autocomplete="off"></label>
      <div class="dict-letters"></div>
      <div class="dict-list"></div>`;
    $("input", root).addEventListener("input", (e) => { dictQuery = e.target.value; drawDict(); });
  }
  $("input", root).value = dictQuery;
  drawDict();
}
function drawDict() {
  const root = $("#dict-root");
  const q = apNorm(dictQuery);
  const list = GLOSSARY.filter((g) => !q || apNorm(g.w).includes(q) || apNorm(g.d).includes(q));
  const letters = [...new Set(GLOSSARY.map((g) => apNorm(g.w)[0]))];
  $(".dict-letters", root).innerHTML = letters.map((l) => `<button type="button" data-l="${l}" ${list.some((g) => apNorm(g.w)[0] === l) ? "" : "disabled"}>${l}</button>`).join("");
  $$(".dict-letters button", root).forEach((b) => b.addEventListener("click", () => {
    document.getElementById(`dict-${b.dataset.l}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  let cur = "";
  $(".dict-list", root).innerHTML = list.length ? list.map((g) => {
    const l = apNorm(g.w)[0];
    const head = l !== cur ? `<h3 class="dict-l" id="dict-${l}">${l}</h3>` : "";
    cur = l;
    return `${head}<details class="dict-item"><summary>${esc(apTermName(g.w))}</summary><p>${esc(g.d)}</p></details>`;
  }).join("") : `<p class="muted">No hay ningún concepto que coincida con «${esc(dictQuery)}».</p>`;
  if (q) $$(".dict-item", root).forEach((d) => { d.open = true; });
}

// ---------- Barra de lectura ----------
function updateReadBar() {
  let bar = $("#ap-read");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "ap-read";
    $(".topbar")?.appendChild(bar);
  }
  const ch = $("#ap-chapter");
  const on = ch && !ch.hidden && !$("#view-apren").hidden;
  if (!on) { bar.style.width = "0"; return; }
  const r = ch.getBoundingClientRect();
  const total = r.height - innerHeight + 140;
  const k = Math.min(1, Math.max(0, (-r.top + 100) / Math.max(1, total)));
  bar.style.width = `${k * 100}%`;
}
window.addEventListener("scroll", updateReadBar, { passive: true });
window.addEventListener("hashchange", () => setTimeout(updateReadBar, 0));

// ---------- Capçalera de cada eina ----------
const AP_TOOL_LEAD = {
  partits: "Elige dos partidos y compara su ideario, las propuestas tema a tema, los líderes y cómo han votado.",
  pactometre: "¿Quién puede gobernar? Parte de la media de las últimas encuestas, de una encuesta concreta o de tu propio escenario.",
  simulador: "Reparte los escaños de una provincia con la ley D'Hondt: elige cuántos hay, escribe los votos de cada candidatura y mira el resultado.",
  actualitat: "Los titulares de política de los principales medios. Cada enlace te lleva a su web.",
  diccionari: "Todos los conceptos de la guía, explicados con palabras sencillas.",
  calendari: "Todas las fechas del proceso electoral, del decreto de convocatoria (Real Decreto 806/2026, BOE del 6 de octubre) a la constitución de las nuevas Cortes.",
};
$$(".ap-tool-head[data-tool]").forEach((el) => {
  const t = AP_TOOLS.find((x) => x.slug === el.dataset.tool);
  if (!t) return;
  el.style.setProperty("--tone", t.tone);
  el.innerHTML = `<nav class="ap-crumb"><a href="#apren">← Aprende</a><span>Herramientas</span></nav>
    <div class="ap-tool-hero"><span class="ap-tool-ico">${apIcon(t.icon)}</span><div><h1 class="ap-title">${esc(t.title)}</h1><p class="ap-lead">${esc(AP_TOOL_LEAD[t.slug] || t.text)}</p></div></div>`;
});

// ---------- Respostes ràpides ----------
// [pregunta, resposta, capítol on s'explica]
const AP_FAQ = [
  ["¿Por qué se han adelantado las elecciones?", "La legislatura debía durar hasta el verano de 2027. El Gobierno, en minoría, había perdido el apoyo de Junts, y el 2 de octubre el Congreso tumbó dos [[decretos ley|DECRETO LEY]] de vivienda. Pedro Sánchez disolvió las Cortes el 6 de octubre.", "legislatura"],
  ["¿Cuántos escaños hacen falta para gobernar solo?", "176 de 350: es la [[mayoría absoluta]]. Si ningún partido llega, necesita el apoyo o la abstención de otros grupos para superar la [[investidura]] y aprobar leyes.", "en-joc"],
  ["¿Cómo sé qué partido se acerca más a lo que pienso?", "Las ideologías se pueden situar en dos ejes: izquierda y derecha, y centralismo e independencia. Compara las propuestas de cada partido en el comparador y juega al Match ideológico para ver con quién coincides.", "ideologies"],
  ["¿Dónde me toca votar?", "Lo dice la [[tarjeta censal]], que llega a casa a partir del 2 de noviembre. Si no la recibes, lo puedes consultar en la web del INE.", "qui-vota"],
  ["¿Qué tengo que llevar para votar?", "El original del DNI, el pasaporte o el carné de conducir, con fotografía. La tarjeta censal no es obligatoria.", "qui-vota"],
  ["¿Hasta cuándo puedo votar por correo?", "Se pide hasta el 19 de noviembre y se envía hasta el 25. Si lo pides, ya no podrás votar en persona.", "qui-vota"],
  ["¿A qué hora se vota?", "Domingo 29 de noviembre, de 9 a 20 h. Las personas que a las 20 h ya están dentro del local todavía pueden votar.", "dia-d"],
  ["¿Votar en blanco ayuda al partido más grande?", "No va a ningún partido. Como es un voto válido, hace subir un poco el 3 % que hace falta para entrar en el reparto, y eso solo afecta a los partidos que se quedan cerca.", "vots-escons"],
  ["¿Qué pasa si no voy a votar?", "La [[abstención]] no se cuenta en ningún sitio: los escaños se reparten igual entre los votos válidos.", "blanc-nul"],
  ["En el Senado, ¿puedo votar a personas de partidos diferentes?", "Sí. En las provincias que eligen 4 puedes marcar hasta 3 personas, de cualquier partido.", "que-votem"],
  ["Si trabajo el 29N, ¿puedo ir a votar?", "Si tu horario coincide con el de votación, puedes tener derecho a un permiso retribuido de hasta cuatro horas.", "qui-vota"],
  ["Vivo en el extranjero. ¿Cómo voto?", "Puedes enviar el voto por correo hasta el 24 de noviembre o depositarlo en el consulado del 21 al 26 de noviembre.", "qui-vota"],
  ["¿Cuándo se sabrá quién ha ganado?", "Los resultados provisionales llegan la misma noche. El [[escrutinio]] oficial lo hacen las juntas electorales del 4 al 7 de diciembre.", "nou-govern"],
  ["¿Cuándo habrá nuevo presidente?", "Las nuevas Cortes se constituyen el 23 de diciembre y después viene la [[investidura]]. Si en dos meses desde la primera votación nadie es investido, se repiten las elecciones.", "nou-govern"],
  ["¿Por qué no todos los votos valen igual?", "Cada provincia tiene un mínimo de 2 diputados, y las menos pobladas obtienen más de los que les tocarían. Un diputado de Soria representa a unos 45.000 habitantes; uno de Madrid, casi 190.000.", "vots-escons"],
];

// ---------- Cercador de l'Aprèn: capítols, respostes ràpides, eines i diccionari ----------
const apPlain = (s) => String(s).replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").replace(/<[^>]+>/g, " ");
let apIndex = null;
function aprenIndex() {
  if (apIndex) return apIndex;
  const blockText = (b) => [b.h, b.title, ...(b.items || []).map((x) => (typeof x === "string" ? x : `${x.title || ""} ${x.text || ""} ${x.label || ""}`)), ...(b.a ? b.a.items : []), ...(b.b ? b.b.items : [])].filter(Boolean).join(" ");
  apIndex = [
    ...AP_CHAPTERS.map((c) => ({ kind: "Capítulo", title: `${c.n}. ${c.title}`, sub: c.short, href: `#apren/${c.slug}`,
      text: apPlain([c.title, c.short, c.lead, ...(c.key || []), ...c.blocks.map(blockText), ...c.quiz.map((q) => `${q.q} ${q.exp}`)].join(" ")) })),
    ...AP_FAQ.map(([q, a, slug]) => ({ kind: "Respuesta", title: q, sub: apPlain(a), href: `#apren/${slug}`, text: apPlain(`${q} ${a}`) })),
    ...GLOSSARY.map((g) => ({ kind: "Diccionario", title: apTermName(g.w), sub: g.d, href: "#apren/diccionari", term: g.w, text: `${g.w} ${g.d}` })),
    ...AP_TOOLS.map((t) => ({ kind: "Herramienta", title: t.title, sub: t.text, href: t.href || `#apren/${t.slug}`, text: `${t.title} ${t.text}` })),
  ].map((x) => ({ ...x, n: apNorm(x.text), nt: apNorm(x.title) }));
  return apIndex;
}
function mountAprenSearch(box) {
  if (!box) return;
  const input = $("input", box), out = $(".ap-search-res", box);
  const draw = () => {
    const words = apNorm(input.value).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) { out.innerHTML = ""; return; }
    const hits = aprenIndex().map((x) => {
      if (!words.every((w) => x.n.includes(w))) return null;
      const score = words.reduce((t, w) => t + (x.nt.includes(w) ? 3 : 1), 0) + (x.kind === "Respuesta" ? 1 : 0);
      return { x, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
    out.innerHTML = hits.length ? `<ul class="ap-sres">${hits.map(({ x }) => `<li><a href="${x.href}" ${x.term ? `data-term-go="${esc(x.term)}"` : ""}><em>${x.kind}</em><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></a></li>`).join("")}</ul>`
      : `<p class="muted">No hay nada que coincida con «${esc(input.value)}». Prueba con otra palabra.</p>`;
    $$("[data-term-go]", out).forEach((a) => a.addEventListener("click", () => { dictQuery = a.dataset.termGo.toLowerCase(); }));
  };
  input.addEventListener("input", draw);
}

// ---------- Examen final: 10 preguntes barrejades de tota la guia ----------
const AP_EXAM_N = 10;
function renderExam() {
  const root = $("#ap-chapter");
  root.style.setProperty("--tone", "#3554ff");
  const pool = AP_CHAPTERS.flatMap((c) => c.quiz.map((q, qi) => ({ ...q, ch: c, qi })));
  const qs = shuffle(pool).slice(0, AP_EXAM_N).map((q) => ({ ...q, order: shuffle(q.opts.map((_, k) => k)) }));
  const best = learnData()._exam;
  let i = 0, hits = 0;
  const misses = [];
  root.innerHTML = `
    <nav class="ap-crumb"><a href="#apren">← Aprende</a><span>Examen final</span></nav>
    <header class="ap-ch-head ap-exam-head">
      <div class="ap-ch-headart"><span class="ap-exam-big" aria-hidden="true">A+</span></div>
      <div><p class="kicker">Examen final · ${AP_EXAM_N} preguntas</p><h1 class="ap-title">¿Eres un votante informado?</h1>
        <p class="ap-lead">Preguntas mezcladas de los ${AP_CHAPTERS.length} capítulos. Con 8 aciertos o más, aprobado con nota.${best !== undefined ? ` Tu mejor resultado: <b>${best}/${AP_EXAM_N}</b>.` : ""}</p></div>
    </header>
    <section class="ap-quiz card" id="ap-exam"></section>`;
  const box = $("#ap-exam", root);
  const question = () => {
    const q = qs[i];
    box.innerHTML = `
      <div class="ap-quiz-top"><span class="kicker">Pregunta ${i + 1} de ${qs.length} · ${esc(q.ch.title)}</span><span class="ap-dots">${qs.map((_, k) => `<i class="${k < i ? "done" : k === i ? "on" : ""}"></i>`).join("")}</span></div>
      <h3 class="ap-q">${esc(q.q)}</h3>
      <div class="choices">${q.order.map((k, n) => `<button class="choice" data-k="${k}"><span class="key">${"ABCD"[n]}</span><span class="ctext">${esc(q.opts[k])}</span></button>`).join("")}</div>`;
    $$(".choice", box).forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.k))));
  };
  const answer = (k) => {
    const q = qs[i], ok = k === 0;
    if (ok) hits++; else misses.push(q);
    aprMissSet(`${q.ch.slug}#${q.qi}`, !ok);
    Sfx.play(ok ? "ok" : "ko");
    $$(".choice", box).forEach((b) => {
      b.disabled = true;
      const bk = Number(b.dataset.k);
      b.classList.add(bk === 0 ? "correct" : bk === k ? "wrong" : "dim");
    });
    box.insertAdjacentHTML("beforeend", `<div class="explain ${ok ? "is-ok" : "is-ko"}"><strong>${ok ? "¡Correcto!" : "No del todo"}</strong><span>${rich(q.exp)}</span></div>
      <div class="next-row"><button class="btn primary" data-next>${i + 1 < qs.length ? "Siguiente" : "Ver el resultado"}</button></div>`);
    $("[data-next]", box).addEventListener("click", () => { i++; i < qs.length ? question() : finish(); });
  };
  const finish = () => {
    const ld = learnData();
    const first = ld._exam === undefined;
    ld._exam = Math.max(ld._exam ?? -1, hits);
    if (first) awardLearnXp(5 * hits); else Progress.save();
    if (hits >= 8) { Progress.unlock("examen"); confetti?.(); }
    window.Track?.("exam_complete", { score: hits });
    const verdict = hits === AP_EXAM_N ? "Excelente: lo sabes todo." : hits >= 8 ? "Aprobado con nota." : hits >= 5 ? "Aprobado, pero hay cosas que repasar." : "Hay que repasar la guía.";
    const repas = [...new Map(misses.map((q) => [q.ch.slug, q.ch])).values()];
    box.innerHTML = `
      <div class="ap-result ${hits >= 5 ? "ok" : "ko"}">
        <div class="ap-result-score"><b>${hits}</b><span>/${AP_EXAM_N}</span></div>
        <div><h3>${verdict}</h3><p>${first ? `<b>+${5 * hits} XP</b> · ` : ""}${hits >= 8 ? "Ya puedes decir que vas a votar con criterio." : "Vuelve a intentarlo cuando quieras: las preguntas cambian cada vez."}</p></div>
      </div>
      ${repas.length ? `<div class="ap-repas"><p class="kicker">Para repasar</p>${repas.map((c) => `<a href="#apren/${c.slug}">${c.n}. ${esc(c.title)} →</a>`).join("")}</div>` : ""}
      <div class="row">
        <button class="btn ghost" data-again>Otra vez</button>
        <button class="btn" data-share>Comparte el resultado</button>
        <a class="btn primary" href="#apren">Volver a Aprende</a>
      </div>`;
    $("[data-again]", box).addEventListener("click", renderExam);
    $("[data-share]", box).addEventListener("click", async () => {
      const text = `He sacado un ${hits}/${AP_EXAM_N} en el examen del 29N de Política en Joc. ¿Te sale mejor? ${location.origin}${location.pathname}#apren/examen`;
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
      try { await navigator.clipboard.writeText(text); toast("Texto copiado: pégalo donde quieras"); } catch { toast(text); }
    });
  };
  question();
}
ACHIEVEMENTS.push({ id: "examen", name: "Matrícula de honor", desc: "Saca 8 o más en el examen final de Aprende." });

// ---------- Apartat de l'Aprèn a l'Inici ----------
function renderHomeApren() {
  const el = $("#home-apren");
  if (!el) return;
  const chs = [...AP_CHAPTERS].sort((a, b) => a.n - b.n);
  const passed = chs.filter(chapterPassed).length;
  const started = chs.some(chapterDone);
  const next = chs.find((c) => !chapterPassed(c));
  const R = 30, C = 2 * Math.PI * R;
  const day = hashString(todayKey());
  const word = GLOSSARY[day % GLOSSARY.length];
  const [fq, fa, fslug] = AP_FAQ[day % AP_FAQ.length];
  const exam = learnData()._exam;
  // El carrusel comença pel capítol que toca i continua amb la resta
  const from = next ? chs.indexOf(next) : 0;
  const order = [...chs.slice(from), ...chs.slice(0, from)];
  const status = (c) => {
    const s = learnData()[c.slug];
    return s === undefined ? `<span class="ha-st">${c.mins} min</span>` : s >= 2 ? `<span class="ha-st ok">✓ ${s}/3</span>` : `<span class="ha-st retry">${s}/3 · repite</span>`;
  };
  el.innerHTML = `<section class="home-apren">
    <div class="section-head"><div><p class="kicker">Guía del 29N</p><h2 class="section-title">Aprende</h2></div><a class="home-more" href="#apren">Toda la guía</a></div>
    <div class="ha-grid">
      <div class="ha-main">
        ${next ? `<a class="ha-next card" href="#apren/${next.slug}" style="--tone:${next.tone}">
          <span class="ha-next-art">${next.art}</span>
          <span class="ha-next-body">
            <span class="ha-next-k">${started ? "Continúa donde lo dejaste" : "Empieza por aquí"} · capítulo ${next.n} de ${chs.length} · ${next.mins} min</span>
            <b>${esc(next.title)}</b>
            <small>${esc(next.short)}</small>
            <span class="btn primary">${started ? "Continúa" : "Empieza la guía"} →</span>
          </span>
          <span class="ha-ring" aria-label="${passed} de ${chs.length} capítulos superados"><svg viewBox="0 0 70 70" aria-hidden="true"><circle cx="35" cy="35" r="${R}" class="bg"/><circle cx="35" cy="35" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - passed / chs.length)}"/></svg><span><b>${passed}</b>/${chs.length}</span></span>
        </a>` : `<a class="ha-next card done" href="#apren/examen">
          <span class="ha-next-body"><span class="ha-next-k">Guía completada</span><b>Ya eres un votante informado</b><small>Has superado los ${chs.length} capítulos. Ponte a prueba con el examen final.</small><span class="btn primary">Examen final →</span></span>
        </a>`}
        <div class="ha-chs" aria-label="Capítulos de la guía">${order.map((c) => `
          <a class="ha-ch ${chapterPassed(c) ? "is-done" : ""}" href="#apren/${c.slug}" style="--tone:${c.tone}">
            <span class="ha-ch-art">${c.art}</span>
            <span class="ha-ch-n">${String(c.n).padStart(2, "0")}</span>
            <b>${esc(c.title)}</b>
            ${status(c)}
          </a>`).join("")}</div>
      </div>
      <aside class="ha-side">
        <a class="ha-word card" href="#apren/diccionari">
          <span class="kicker">Palabra del día</span>
          <b>${esc(apTermName(word.w))}</b>
          <span>${esc(word.d)}</span>
        </a>
        <details class="ha-faq card">
          <summary><span class="kicker">Pregunta del día</span><b>${esc(fq)}</b></summary>
          <p>${rich(fa)}</p>
          <a href="#apren/${fslug}">Lee más →</a>
        </details>
        <a class="ha-exam" href="#apren/examen">
          <span class="ha-exam-ico" aria-hidden="true">A+</span>
          <span><b>Examen final</b><small>${exam !== undefined ? `Tu mejor resultado: ${exam}/10` : "10 preguntas de toda la guía"}</small></span>
        </a>
        <div class="ha-tools">${AP_TOOLS.filter((t) => ["partits", "pactometre", "diccionari"].includes(t.slug)).map((t) => `<a href="${t.href || `#apren/${t.slug}`}" style="--tone:${t.tone}">${apIcon(t.icon)}<span>${esc(t.title)}</span></a>`).join("")}</div>
      </aside>
    </div>
  </section>`;
}
