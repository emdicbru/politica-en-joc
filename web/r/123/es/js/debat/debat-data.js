// Simulador de debat electoral: contingut. Tot és ficció: les intervencions dels candidats reals són inventades i genèriques,
// inspirades en les posicions públiques dels seus partits, i no reprodueixen declaracions reals.

const DB_DISCLAIMER = "Debate de ficción. Las intervenciones de los candidatos reales son inventadas y genéricas, inspiradas en las posiciones públicas de sus partidos.";

// ---------- El teu partit ----------
const DB_IDEOS = [
  { k: "esq", label: "Izquierda", x: 1.5 },
  { k: "cesq", label: "Centroizquierda", x: 3.5 },
  { k: "centre", label: "Centro", x: 5 },
  { k: "cdreta", label: "Centroderecha", x: 6.8 },
  { k: "dreta", label: "Derecha", x: 8.8 },
];
const DB_TERRS = [
  { k: "central", label: "Centralista", d: "Un modelo igual para todo el Estado." },
  { k: "autonom", label: "Autonomista", d: "Más autogobierno y financiación justa." },
  { k: "sobir", label: "Soberanista", d: "Que cada nación decida su futuro." },
];
const DB_SIZES = [
  { k: "gran", label: "Grande", d: "Aspira a gobernar. Te invitan a todos los debates, también al cara a cara.", base: 30 },
  { k: "mitja", label: "Medio", d: "Tiene grupo propio en el Congreso. Te invitan al debate a siete.", base: 9 },
  { k: "nou", label: "Nuevo", d: "Sin escaños. Solo te invitan al debate de las fuerzas sin grupo.", base: 2 },
];
const DB_STYLES = [
  { k: "rigor", label: "Riguroso", d: "Datos y calma. Las respuestas técnicas te salen mejor, pero cuesta emocionar.", fx: { dades: 1.3, emocio: 0.85, atac: 0.9, proposta: 1.1 } },
  { k: "combat", label: "Combativo", d: "Contundente y rápido. Los ataques hacen más daño, pero te alteras con más facilidad.", fx: { dades: 0.9, emocio: 1, atac: 1.35, proposta: 0.95 }, nerves: 1.25 },
  { k: "proper", label: "Cercano", d: "Empático y llano. Conectas con la gente, pero las cifras no son tu fuerte.", fx: { dades: 0.85, emocio: 1.35, atac: 0.85, proposta: 1.05 } },
];
const DB_COLORS = ["#7b3fe4", "#00a37a", "#f59f24", "#e0306f", "#1e88d6", "#ff4b2b", "#3f8f45", "#17173d"];
const DB_NAMES = ["Laia Prats", "Marc Rovira", "Núria Vidal", "Jordi Casals", "Clara Ribas", "Pau Serra", "Aina Costa", "Oriol Puig"];

// ---------- Formats i convidats ----------
// Els debats es fan segons la representació dels partits (criteri de proporcionalitat de la Junta Electoral Central).
// Cada debat té la presentació, uns quants temes triats a l'atzar (topics), els pactes i el minut d'or.
const DB_FORMATS = {
  cara: { title: "Cara a cara", net: "Cadena privada", desc: "Tú y el principal rival, una hora, sin nadie más. Es el debate más visto de la campaña.", sizes: ["gran"], rivals: 1, topics: 2, secs: 300 },
  quatre: { title: "Debate a cuatro", net: "Televisión pública", desc: "Los cuatro partidos más grandes. Mucho ritmo y poco tiempo para cada uno.", sizes: ["gran"], rivals: 3, topics: 3, secs: 270 },
  set: { title: "Debate a siete", net: "Televisión pública", desc: "Todos los grupos del Congreso. Para destacar, hay que saber elegir los momentos.", sizes: ["gran", "mitja"], rivals: 6, topics: 3, secs: 240 },
  petits: { title: "Debate de las fuerzas sin grupo", net: "Canal autonómico", desc: "Los partidos que no tienen grupo propio. Menos audiencia, pero es tu oportunidad.", sizes: ["nou"], rivals: 3, topics: 2, secs: 270 },
};
// Els temes que poden sortir (l'economia i l'habitatge, gairebé sempre)
const DB_TOPICS = ["economia", "habitatge", "sanitat", "immigracio", "clima", "territori"];
// Rivals de cada format, per ordre de mida (els partits reals de partits.js)
const DB_LINEUPS = {
  quatre: ["pp", "psoe", "vox", "fa"],
  set: ["pp", "psoe", "vox", "fa", "erc", "junts", "bildu"],
  petits: ["salf", "podemos", "bng", "cc"],
};

// ---------- La moderadora ----------
const DB_MOD = { name: "Marta Soler", role: "Moderadora" };
// Aspecte dels avatars del plató (models genèrics de MakeHuman): no reprodueixen la cara de ningú,
// només s'ajusten al gènere, l'edat aproximada i el to de cabell de cada candidat.
const DB_LOOKS = [
  { k: "dona1", label: "Pelo largo" }, { k: "dona2", label: "Melena" }, { k: "dona3", label: "Coleta" }, { k: "dona4", label: "Bob" },
  { k: "home1", label: "Peinado hacia atrás" }, { k: "home2", label: "Pelo corto" }, { k: "home4", label: "Flequillo" }, { k: "home3", label: "Calvo" },
];
// Aspecte inicial de cada nom proposat (el jugador el pot canviar)
const DB_NAME_LOOKS = ["dona1", "home2", "dona2", "home1", "dona3", "home4", "dona4", "home3"];
const DB_SKINS = ["#f6d9c5", "#f1cbb0", "#e2b293", "#c99372", "#a86f4c", "#7d4e33"];
const DB_HAIRS = ["#1b1714", "#2a1d16", "#46301f", "#6b4a2c", "#9d7a52", "#c9b9a3", "#a9a39b"];
const DB_CAST = {
  pp: { look: "home1", age: 64, hair: "#a9a39b", skin: "#f1cbb0" },
  psoe: { look: "home2", age: 54, hair: "#2a1d16", skin: "#e2b293" },
  vox: { look: "home1", age: 50, hair: "#1b1714", skin: "#e2b293" },
  fa: { look: "dona2", age: 52, hair: "#2a1d16", skin: "#f1cbb0" },
  podemos: { look: "dona3", age: 38, hair: "#1b1714", skin: "#e2b293" },
  erc: { look: "home2", age: 44, hair: "#1b1714", skin: "#e2b293" },
  junts: { look: "dona1", age: 45, hair: "#46301f", skin: "#f1cbb0" },
  bildu: { look: "home4", age: 58, hair: "#6b4a2c", skin: "#f1cbb0" },
  pnv: { look: "dona2", age: 56, hair: "#6b4a2c", skin: "#f6d9c5" },
  bng: { look: "home3", age: 62, hair: "#a9a39b", skin: "#f1cbb0" },
  cc: { look: "dona1", age: 53, hair: "#2a1d16", skin: "#c99372" },
  salf: { look: "home2", age: 36, hair: "#2a1d16", skin: "#e2b293" },
};
const DB_BLOCKS = {
  obertura: { title: "Presentación", q: "Buenas noches y bienvenidos al debate. Empezamos con la presentación: ¿por qué deberían votarles el 29 de noviembre?", cam: "Un minuto para presentarte",
    qs: ["Empezamos con la presentación: ¿por qué deberían votarles el 29 de noviembre?", "Primer turno: en un minuto, ¿quiénes son y qué proponen?"] },
  economia: { title: "Economía e impuestos", q: "Hablemos de economía. Los precios han subido más que los sueldos. ¿Qué harán por las familias que no llegan a fin de mes?",
    qs: ["Hablemos de economía. Los precios han subido más que los sueldos. ¿Qué harán por las familias que no llegan a fin de mes?", "Impuestos: ¿quién debe pagar más y quién debe pagar menos? Concreten, por favor.", "Muchos jóvenes trabajan y siguen siendo pobres. ¿Cómo lo arreglarán?"] },
  habitatge: { title: "Vivienda", q: "La vivienda es la principal preocupación de los jóvenes. ¿Cuál es su propuesta concreta?",
    qs: ["La vivienda es la principal preocupación de los jóvenes. ¿Cuál es su propuesta concreta?", "Los alquileres se han disparado en las grandes ciudades. ¿Qué harán para que la gente pueda quedarse a vivir en ellas?", "Comprar un piso es un sueño para muchos jóvenes. ¿Cómo los ayudarán?"] },
  territori: { title: "Modelo territorial", q: "Modelo territorial: financiación autonómica, autogobierno, Cataluña. ¿Dónde se sitúan?",
    qs: ["Modelo territorial: financiación autonómica, autogobierno, Cataluña. ¿Dónde se sitúan?", "Muchas comunidades reclaman una financiación más justa. ¿Qué proponen?"] },
  sanitat: { title: "Sanidad", q: "Las listas de espera no paran de crecer. ¿Cómo las reducirán?",
    qs: ["Las listas de espera no paran de crecer. ¿Cómo las reducirán?", "Faltan médicos en la atención primaria y en muchos pueblos no hay. ¿Cuál es su solución?"] },
  immigracio: { title: "Inmigración", q: "La inmigración es uno de los temas que más divide. ¿Qué modelo proponen?",
    qs: ["La inmigración es uno de los temas que más divide. ¿Qué modelo proponen?", "¿Cómo quieren gestionar la llegada de personas migrantes y su integración?"] },
  clima: { title: "Clima y energía", q: "Sequías, incendios y el precio de la luz. ¿Cuál es su política climática?",
    qs: ["Sequías, incendios y el precio de la luz. ¿Cuál es su política climática?", "¿Cómo harán la transición energética sin que la paguen las familias?"] },
  pactes: { title: "Pactos y gobernabilidad", q: "Ningún partido tendrá mayoría absoluta. ¿Con quién pactarán para gobernar?",
    qs: ["Ningún partido tendrá mayoría absoluta. ¿Con quién pactarán para gobernar?", "Hablemos de pactos. ¿Con quién se sentarían a negociar al día siguiente de las elecciones?"] },
  tancament: { title: "Minuto de oro", q: "Llegamos al final. Cada candidato tiene un minuto para pedir el voto. Es su minuto de oro." },
};
const DB_TOPIC_NAMES = { economia: "los salarios", habitatge: "la vivienda", territori: "la financiación", sanitat: "la sanidad", immigracio: "la inmigración", clima: "la energía" };
// La moderadora repregunta quan no s'ha respost la pregunta
const DB_FOLLOWUPS = [
  "Perdone, pero no ha respondido a la pregunta. ¿Qué hará, concretamente?",
  "Le vuelvo a preguntar: ¿cuál es su propuesta? La gente quiere saberlo.",
  "Ha hablado mucho de su rival, pero la pregunta era sobre usted. Concrete, por favor.",
];
// Quan interromps un rival
const DB_INTERRUPTS = ["¡Perdone, pero eso no es cierto!", "Un momento, un momento: eso que dice es falso.", "No, no. Eso no lo puede decir así, y usted lo sabe.", "Déjeme decir una cosa: los datos lo desmienten."];

// ---------- Les teves respostes ----------
// Propostes segons la ideologia (economia i habitatge) o el model territorial
const DB_PROPOSALS = {
  economia: {
    esq: "que paguen más los que más tienen, con un impuesto a las grandes fortunas, y subir el salario mínimo",
    cesq: "subir los salarios más bajos y reforzar los servicios públicos sin ahogar a la clase media",
    centre: "menos burocracia para autónomos y pequeñas empresas, y unas cuentas públicas equilibradas",
    cdreta: "bajar el IRPF a las rentas medias y atraer inversión que cree empleo",
    dreta: "una rebaja de impuestos general y recortar el gasto político superfluo",
  },
  habitatge: {
    esq: "poner un tope a los alquileres y construir un gran parque público de alquiler social",
    cesq: "construir vivienda pública a precio asequible y ayudar a los jóvenes a pagar el alquiler",
    centre: "incentivos fiscales para que los propietarios alquilen a precio asequible, pactados con el sector",
    cdreta: "liberar suelo para construir más y dar seguridad jurídica a los propietarios",
    dreta: "desalojar rápidamente las okupaciones y bajar los impuestos de la compra de vivienda",
  },
  territori: {
    central: "un solo modelo para todo el Estado, para que ningún territorio tenga más privilegios que otro",
    autonom: "una financiación justa y más autogobierno, siempre dentro de la Constitución",
    sobir: "que la ciudadanía pueda decidir su futuro votando, como en cualquier democracia madura",
  },
  sanitat: {
    esq: "contratar más médicos y enfermeras y dejar de derivar dinero público a la sanidad privada",
    cesq: "un plan de choque con más personal en la atención primaria y un tiempo máximo de espera garantizado por ley",
    centre: "un tiempo máximo garantizado para cada operación y más coordinación entre comunidades",
    cdreta: "usar todos los centros disponibles, públicos y concertados, para vaciar las listas de espera en dos años",
    dreta: "libertad para elegir médico y centro y una tarjeta sanitaria única para todo el país",
  },
  immigracio: {
    esq: "regularizar a quien ya vive y trabaja aquí y garantizar los derechos humanos en la frontera",
    cesq: "vías legales y ordenadas para venir a trabajar, y más recursos para la integración",
    centre: "una inmigración ordenada, ligada a las ofertas de trabajo y con integración de verdad",
    cdreta: "una inmigración legal ligada al trabajo y más control de las fronteras",
    dreta: "un control estricto de las fronteras y la expulsión de quien entre ilegalmente",
  },
  clima: {
    esq: "energía renovable pública, transporte público gratuito para los jóvenes y un calendario para cerrar las nucleares",
    cesq: "acelerar las renovables y ayudar a las familias a aislar y rehabilitar las viviendas",
    centre: "una transición energética gradual, con renovables y sin subir la factura",
    cdreta: "mantener las nucleares mientras crecen las renovables, para que la luz sea barata",
    dreta: "bajar los impuestos de la energía y frenar las normas climáticas que perjudican al campo",
  },
};
const DB_STORIES = {
  obertura: "Crecí en un barrio donde la gente se levanta a las seis para ir a trabajar, y es por ellos que me presento",
  economia: "Esta semana una enfermera me decía que, con dos trabajos, no llega a fin de mes",
  habitatge: "Hace unos días conocí a una pareja de treinta años que todavía vive en casa de sus padres porque el alquiler es imposible",
  territori: "En cada pueblo al que voy me dicen lo mismo: quieren que las decisiones se tomen cerca de ellos",
  sanitat: "La madre de una amiga ha esperado ocho meses para operarse de la cadera, con dolor cada día",
  immigracio: "En el barrio donde vivo hay gente nacida en veinte países diferentes que trabaja y paga impuestos como todo el mundo",
  clima: "Este verano un agricultor de la Segarra me enseñó la cosecha que había perdido por la sequía",
};
// Les cartes de resposta: cada enfocament té un cost de temps i un efecte diferent en cada grup de votants
const DB_APPROACHES = {
  proposta: { label: "Propuesta concreta", icon: "📌", secs: 55, fx: { base: 1, indecisos: 2.2, rivals: 0.4 } },
  dades: { label: "Datos y calendario", icon: "📊", secs: 75, fx: { base: 0.6, indecisos: 2.6, rivals: 0.8 } },
  emocio: { label: "Una historia", icon: "💬", secs: 50, fx: { base: 2, indecisos: 1.6, rivals: 0.2 } },
  atac: { label: "Ataca al rival", icon: "⚡", secs: 40, fx: { base: 2.4, indecisos: -0.6, rivals: -1.2 } },
};

// Obertura i minut d'or
const DB_OPENINGS = [
  { k: "emocio", label: "Por qué me presento", quote: "{story}. Quiero un país donde trabajar duro vuelva a valer la pena." },
  { k: "dades", label: "Diagnóstico del país", quote: "Tres cifras: el precio del alquiler, el sueldo medio de los jóvenes y las listas de espera. Las tres han empeorado, y yo traigo un plan para cada una." },
  { k: "atac", label: "Directo al favorito", quote: "{rival} ha tenido su oportunidad y no la ha aprovechado. Hoy les explicaré por qué ha llegado la hora de cambiar." },
  { k: "proposta", label: "La promesa estrella", quote: "Si gobierno, la primera ley será sobre {tema}: {proposal}." },
];
const DB_CLOSINGS = [
  { k: "esperanca", label: "Esperanza", fx: { base: 1.5, indecisos: 2.4, rivals: 0.6 }, quote: "El 29 de noviembre no votamos contra nadie: votamos a favor de un país que funcione para todos. Les pido la confianza." },
  { k: "por", label: "Advertencia", fx: { base: 2.6, indecisos: 0.6, rivals: -0.8 }, quote: "Si no vamos a votar, otros decidirán por nosotros. Esta vez nos jugamos demasiado." },
  { k: "proposta", label: "La propuesta estrella", fx: { base: 1.2, indecisos: 2.6, rivals: 0.4 }, quote: "Recuerden una sola cosa de este debate: {proposal}. Eso es lo que haremos." },
  { k: "mobilitza", label: "Llamada a la movilización", fx: { base: 3, indecisos: 1, rivals: -0.2 }, quote: "Cada voto cuenta. Hablen de ello en casa, en el trabajo, con los amigos. El 29 de noviembre, ganémoslo juntos." },
];

// ---------- Rivals: intervencions genèriques segons el perfil del partit ----------
// esq: esquerra; dreta: dreta; sob: sobiranista o nacionalista; nova: partits nous de protesta
const DB_RIVAL_KIND = { pp: "dreta", psoe: "esq", vox: "dreta", fa: "esq", podemos: "esq", erc: "sob", junts: "sob", bildu: "sob", pnv: "sob", bng: "sob", cc: "sob", salf: "nova" };
const DB_RIVAL_LINES = {
  obertura: {
    esq: ["Vengo a defender lo que hemos conseguido y lo mucho que todavía queda por hacer para la mayoría social.", "Este país avanza cuando se reparte mejor la riqueza, y eso es lo que proponemos."],
    dreta: ["Vengo a proponer un cambio: menos impuestos, más orden y un Gobierno que cumpla su palabra.", "España necesita estabilidad y un rumbo claro, y nosotros lo ofrecemos."],
    sob: ["Vengo a defender los intereses de mi país, que demasiado a menudo se olvidan en Madrid.", "Que nadie dude de que nuestro voto será decisivo y de que lo haremos valer."],
    nova: ["Estoy aquí porque la gente está harta de los de siempre, y nosotros no le debemos nada a nadie.", "Los partidos tradicionales han fallado. Nosotros somos la alternativa."],
  },
  economia: {
    esq: ["Hemos subido el salario mínimo y ha ido bien. Hay que seguir repartiendo mejor.", "Los beneficios de las grandes empresas deben contribuir más."],
    dreta: ["El problema son los impuestos: la gente paga demasiado y recibe demasiado poco.", "Con menos burocracia e impuestos más bajos, la economía crecerá más."],
    sob: ["El déficit fiscal nos lastra: nuestro dinero debe servir para nuestros servicios.", "Queremos decidir nuestra política económica, sin depender de nadie."],
    nova: ["Mientras los políticos cobran sueldos de lujo, la gente no llega a fin de mes.", "Primero, recortar los privilegios de los políticos; después, hablemos de impuestos."],
  },
  habitatge: {
    esq: ["La vivienda es un derecho, no un negocio: hay que regular los alquileres.", "Necesitamos mucha más vivienda pública, y la queremos hacer."],
    dreta: ["La okupación ilegal y la inseguridad jurídica hacen huir a los propietarios del alquiler.", "La solución es construir más, no poner topes que reducen la oferta."],
    sob: ["Las competencias de vivienda son nuestras y las queremos ejercer sin interferencias.", "Hacen falta recursos para hacer el parque público que necesitamos."],
    nova: ["Los jóvenes no se pueden independizar, y ninguno de los que han gobernado lo ha arreglado.", "Primero hay que acabar con el despilfarro, y después habrá dinero para vivienda."],
  },
  territori: {
    esq: ["Defendemos un modelo federal que reconozca la diversidad del Estado.", "El diálogo es el único camino para resolver los conflictos territoriales."],
    dreta: ["La igualdad de todos los españoles no se negocia.", "No habrá privilegios para unos cuantos a cambio de votos."],
    sob: ["Nuestro pueblo tiene derecho a decidir, y no renunciaremos a este objetivo.", "Queremos una financiación que no nos castigue año tras año."],
    nova: ["Las autonomías son una máquina de gasto político que hay que adelgazar.", "Menos estructuras políticas y más servicios para la gente."],
  },
  sanitat: {
    esq: ["La sanidad pública no se vende: más presupuesto y más personal.", "Los recortes de ahora son las listas de espera de mañana."],
    dreta: ["Hay que usar todos los recursos, públicos y privados, para reducir las esperas.", "Menos burocracia y más médicos en las consultas."],
    sob: ["La sanidad es competencia nuestra, pero nos faltan los recursos para pagarla.", "Nadie gestiona mejor la sanidad que quien la tiene cerca."],
    nova: ["Mientras los políticos tienen privilegios, la gente espera meses para una operación.", "Primero, sacar dinero de los cargos inútiles y ponerlo en la sanidad."],
  },
  immigracio: {
    esq: ["La inmigración sostiene las pensiones y la economía: hay que integrarla con derechos.", "Nadie es ilegal: hay que regularizar a quien ya vive aquí."],
    dreta: ["Queremos una inmigración legal y ordenada, no la que deciden las mafias.", "Hay que controlar las fronteras, como hace cualquier país serio."],
    sob: ["La integración se hace en nuestros pueblos y ciudades, y nos tienen que dar los recursos.", "Queremos las competencias para gestionarlo desde aquí."],
    nova: ["Los gobiernos de siempre han perdido el control de las fronteras.", "Primero los de aquí: es lo que la gente dice en la calle."],
  },
  clima: {
    esq: ["La emergencia climática no espera: renovables y transición justa, ya.", "La transición ecológica es la gran oportunidad industrial del país."],
    dreta: ["Transición sí, pero sin arruinar el campo ni la industria.", "No podemos subir la factura de la luz a las familias en nombre del clima."],
    sob: ["Las renovables se deben hacer con el territorio, no contra el territorio.", "Queremos decidir nuestro modelo energético."],
    nova: ["Las agendas climáticas de Bruselas las paga el agricultor.", "Primero que bajen la factura de la luz; después, que den lecciones."],
  },
  pactes: {
    esq: ["Pactaremos con las fuerzas progresistas. Con la extrema derecha, nunca.", "La mayoría progresista ya ha demostrado que funciona."],
    dreta: ["Queremos gobernar en solitario, y si hay que hablar, será con quien defienda la unidad de España.", "No pactaremos con quienes quieren romper el país."],
    sob: ["Nuestros votos tendrán un precio, y el precio será lo que necesita nuestro país.", "Pactaremos con quien respete nuestra voluntad."],
    nova: ["No pactaremos con la casta. Que nos voten y ya hablaremos.", "Nosotros somos el voto de castigo, y no nos venderemos."],
  },
  tancament: {
    esq: ["El 29 de noviembre nos jugamos si seguimos avanzando o volvemos atrás. Les pido el voto.", "Votar es la mejor manera de defender lo que hemos conseguido."],
    dreta: ["El 29 de noviembre podemos cambiar de rumbo. Confíen en nosotros.", "Es la hora del cambio. Les pido el voto para un Gobierno fuerte."],
    sob: ["Cuanto más fuertes seamos en Madrid, más respetados seremos en casa. Vótennos.", "Nuestro voto es decisivo: úsenlo."],
    nova: ["Si están hartos, ahora tienen una alternativa. No se queden en casa.", "Sacudamos el sistema. El 29 de noviembre, vótennos."],
  },
};
// Intervencions pròpies de cada partit (si n'hi ha, tenen preferència sobre les genèriques)
const DB_PARTY_LINES = {
  pp: {
    obertura: ["Vengo a proponer un Gobierno que vuelva a poner orden en la economía y en las instituciones.", "España necesita un cambio de rumbo, y nosotros tenemos el equipo para hacerlo."],
    economia: ["Hay que bajar impuestos a las clases medias y acabar con el gasto que no sirve para nada.", "Menos impuestos y más inversión: así se crea empleo."],
    habitatge: ["Hay que construir mucho más y proteger a los propietarios frente a la okupación.", "Proponemos avales para que los jóvenes puedan comprar su primer piso."],
    territori: ["La igualdad de todos los españoles no se puede negociar a cambio de votos.", "Defendemos el Estado de las autonomías, sin privilegios para nadie."],
    sanitat: ["Proponemos un plan nacional contra las listas de espera, con todos los recursos disponibles.", "Las listas de espera son el fracaso de este Gobierno."],
    immigracio: ["Queremos una inmigración ordenada y legal, ligada al trabajo.", "Hay que controlar las fronteras y perseguir a las mafias."],
    clima: ["Transición energética sí, pero sin castigar al campo ni a la industria.", "Alargar la vida de las nucleares es la manera de reducir emisiones sin subir la factura."],
    pactes: ["Aspiramos a gobernar solos. No pactaremos con quien quiera romper España.", "Queremos una mayoría suficientemente amplia para no depender de nadie."],
    tancament: ["Si quieren un cambio tranquilo y serio, el 29 de noviembre vótennos.", "Es la hora de la alternancia. Les pido la confianza."],
  },
  psoe: {
    obertura: ["Vengo a defender lo que hemos avanzado: más empleo, pensiones dignas y más derechos.", "Este país funciona mejor cuando protege a la mayoría."],
    economia: ["Hemos subido el salario mínimo y hay más gente trabajando que nunca. Hay que seguir.", "Queremos que los grandes beneficios contribuyan más, no la clase trabajadora."],
    habitatge: ["Ampliaremos el parque público de vivienda y pondremos límites a los precios abusivos.", "La vivienda debe ser un derecho, no un negocio especulativo."],
    territori: ["Proponemos una España federal, en la que quepa todo el mundo.", "El diálogo ha funcionado mejor que la confrontación."],
    sanitat: ["Blindaremos la sanidad pública frente a los recortes.", "Más médicos y más presupuesto para la atención primaria."],
    immigracio: ["La inmigración regular es necesaria para la economía y para las pensiones.", "Hay que integrar, no levantar muros."],
    clima: ["La transición ecológica crea empleo y baja la factura de la luz.", "Las renovables son la gran oportunidad industrial de España."],
    pactes: ["Pactaremos con las fuerzas progresistas. Con la extrema derecha, nunca.", "La mayoría progresista ya ha demostrado que puede gobernar."],
    tancament: ["El 29 de noviembre nos jugamos no dar ningún paso atrás. Les pido el voto.", "Votemos para seguir avanzando."],
  },
  vox: {
    obertura: ["Vengo a decir lo que los demás no se atreven a decir.", "Somos la única alternativa real a los partidos de siempre."],
    economia: ["Hay que recortar el gasto político y bajar drásticamente los impuestos.", "Primero los de aquí: protegeremos el campo y la industria nacional."],
    habitatge: ["Acabaremos con la okupación ilegal con desalojos inmediatos.", "Más suelo y menos impuestos: así se hacen pisos asequibles."],
    territori: ["Las autonomías han fracasado: hay que recuperar competencias para el Estado.", "Una sola nación y la misma ley para todos."],
    sanitat: ["Una sola tarjeta sanitaria para toda España.", "Menos burocracia autonómica y más médicos."],
    immigracio: ["Queremos fronteras seguras y expulsar a quien entre ilegalmente.", "La inmigración ilegal se tiene que frenar, y lo haremos."],
    clima: ["Las políticas climáticas están arruinando a nuestros agricultores.", "Basta de agendas que encarecen la vida."],
    pactes: ["Solo apoyaremos a un Gobierno que defienda la unidad de España.", "No seremos la muleta de nadie a cambio de nada."],
    tancament: ["Si quieren un cambio de verdad, voten sin miedo.", "El 29 de noviembre, voten con valentía."],
  },
  fa: {
    obertura: ["Vengo a defender una política útil para la gente que no llega a fin de mes.", "Hemos venido a ganar derechos, no a perderlos."],
    economia: ["Reduciremos la jornada laboral sin reducir el sueldo.", "Hace falta un sistema fiscal en el que paguen más los que más tienen."],
    habitatge: ["Tope a los alquileres y basta de fondos buitre.", "La vivienda es el gran problema del país, y hay que intervenir el mercado."],
    territori: ["Defendemos un Estado plurinacional y el diálogo.", "Reconocer la diversidad hace el país más fuerte."],
    sanitat: ["Ni un euro público para hacer negocio con la salud.", "Queremos la salud mental y el dentista en la sanidad pública."],
    immigracio: ["Regularizar a quien ya vive y trabaja aquí es de justicia.", "Derechos humanos en la frontera, siempre."],
    clima: ["La emergencia climática no espera: transición justa, ya.", "Más transporte público y renovables al servicio de todos."],
    pactes: ["Queremos reeditar un Gobierno progresista, pero más valiente.", "Con nosotros, el Gobierno irá más lejos."],
    tancament: ["Voten por una vida que se pueda pagar.", "El 29 de noviembre, votemos para ganar derechos."],
  },
  erc: {
    obertura: ["Vengo a defender Cataluña y a hacer que nuestros votos sirvan para algo.", "Estamos aquí para arrancar compromisos, no para hacer de decorado."],
    economia: ["El déficit fiscal nos lastra: queremos gestionar nuestros recursos.", "Rodalies, financiación e inversiones: que se cumpla lo que se promete."],
    territori: ["Queremos un referéndum pactado y la financiación singular para Cataluña.", "El conflicto político solo se resuelve votando."],
    pactes: ["Nuestros votos valen lo que valgan los compromisos cumplidos.", "Nunca haremos presidente a nadie que pacte con la extrema derecha."],
    tancament: ["Cuanto más fuertes seamos en Madrid, más respetados seremos en casa.", "Voten para que Cataluña decida."],
  },
  junts: {
    obertura: ["Vengo a defender Cataluña, y nada más.", "Nuestros votos son de Cataluña y no los regalaremos."],
    economia: ["Queremos rebajar la presión fiscal a las empresas y a los autónomos catalanes.", "Cataluña paga mucho y recibe poco: hay que cambiarlo."],
    territori: ["Nuestro objetivo es la independencia, y no renunciamos a él.", "Queremos las competencias que nos tocan, sin excusas."],
    immigracio: ["Queremos que Cataluña tenga las competencias de inmigración.", "La integración se hace en catalán y desde Cataluña."],
    pactes: ["No firmaremos cheques en blanco a nadie.", "Pactaremos hechos, no promesas."],
    tancament: ["Si quieren que Cataluña cuente, vótennos.", "Voten por una Cataluña que no pide permiso."],
  },
  bildu: {
    obertura: ["Vengo a defender a las clases populares y los derechos de Euskal Herria.", "Somos una fuerza útil para frenar a la derecha."],
    economia: ["Pensiones dignas y salarios que permitan vivir.", "Hace falta una fiscalidad justa y más valiente."],
    territori: ["Euskal Herria tiene derecho a decidir su futuro.", "Queremos más soberanía para decidir cómo queremos vivir."],
    pactes: ["Usaremos nuestros votos para frenar a la derecha y ganar derechos.", "Somos una fuerza fiable para un Gobierno progresista."],
    tancament: ["Voten por una Euskal Herria con más derechos.", "Usen su voto para frenar a la derecha."],
  },
  podemos: {
    obertura: ["Vengo a llamar a las cosas por su nombre, aunque molesten.", "Somos la izquierda que no se arrodilla."],
    economia: ["Hay que poner impuestos a los bancos y a las eléctricas.", "Basta de rescatar siempre a los mismos."],
    habitatge: ["Intervenir el mercado del alquiler ya, sin excusas.", "Prohibir la compra de vivienda para especular."],
    pactes: ["Haremos un Gobierno de izquierdas de verdad o nada.", "No seremos una muleta sin condiciones."],
    tancament: ["Si quieren una izquierda valiente, vótennos.", "El voto útil es el voto valiente."],
  },
  bng: {
    obertura: ["Vengo a defender Galicia, que demasiado a menudo se olvida en Madrid.", "Galicia necesita voz propia en el Congreso."],
    economia: ["Queremos que la energía que producimos en Galicia la paguemos más barata.", "Inversiones para Galicia, no promesas."],
    pactes: ["Nuestros votos serán para Galicia.", "Pactaremos con quien respete Galicia."],
    tancament: ["Voten Galicia.", "Hagan que Galicia cuente en el Congreso."],
  },
  cc: {
    obertura: ["Vengo a defender Canarias, que tiene problemas que en Madrid no se entienden.", "Somos la voz de las islas."],
    economia: ["Queremos que se cumpla el régimen económico y fiscal de Canarias.", "Canarias necesita inversiones y conectividad."],
    immigracio: ["Canarias no puede asumir sola la llegada de pateras: hace falta la solidaridad de todo el Estado.", "Necesitamos recursos para atender a los menores que llegan solos."],
    pactes: ["Apoyaremos a quien se comprometa con Canarias.", "Nuestro voto es para Canarias."],
    tancament: ["Voten Canarias.", "Que Canarias tenga voz propia."],
  },
  salf: {
    obertura: ["Estoy aquí porque la gente está harta de la clase política de siempre.", "Nosotros no le debemos nada a nadie."],
    economia: ["Primero, acabar con los privilegios de los políticos.", "Mientras la gente no llega a fin de mes, ellos se suben el sueldo."],
    immigracio: ["Hay que acabar con el descontrol en las fronteras.", "La gente tiene miedo y nadie la escucha."],
    pactes: ["No pactaremos con la casta.", "Somos el voto de castigo, y no nos venderemos."],
    tancament: ["Si están hartos, ahora tienen una alternativa.", "El 29 de noviembre, sacudan el sistema."],
  },
};
// Atacs propis de cada partit al jugador
const DB_PARTY_ATTACKS = {
  pp: ["Su programa es un festival de gasto que pagarán los de siempre.", "Usted no ha gestionado nunca nada. ¿Cómo quiere gobernar un país?"],
  psoe: ["Usted promete recortar derechos con una sonrisa.", "Sus recetas ya las sufrimos, y fueron un desastre."],
  vox: ["Usted es más de lo mismo, con otra corbata.", "Usted habla mucho pero no se atreve a decir lo que piensa."],
  fa: ["Sus propuestas no resisten el precio de un alquiler en cualquier ciudad.", "Cuando toca elegir entre la gente y los poderosos, usted siempre elige a los mismos."],
  erc: ["Usted se acuerda de Cataluña solo en campaña.", "Sus promesas a Cataluña caducan al día siguiente de votar."],
  junts: ["Usted no ha entendido nada de lo que pasa en Cataluña.", "Mucho discurso, pero a la hora de la verdad siempre vota con Madrid."],
  podemos: ["Usted es la izquierda que se rinde antes de empezar.", "Cuando llega al Gobierno, se olvida de todo lo que había prometido."],
  salf: ["¿Cuánto cobra usted? La gente quiere saberlo.", "Usted vive de la política, y se nota."],
};
// Topades entre rivals: el primer ataca ({b} és el nom de l'altre) i l'altre respon
const DB_CLASH = {
  dreta: ["{b} ha puesto la gobernabilidad en manos de quienes quieren romper el país.", "Con {b}, los impuestos no han parado de subir."],
  esq: ["{b} quiere recortar todo lo que hemos ganado en derechos.", "Las recetas de {b} ya las sufrimos en la crisis."],
  sob: ["Ni {b} ni los suyos han cumplido nunca nada de lo que prometieron.", "{b} solo se acuerda de nosotros cuando necesita votos."],
  nova: ["{b} es la misma casta de siempre.", "{b} ha vivido toda la vida de la política."],
};
const DB_CLASH_REPLY = {
  dreta: ["Lecciones, de usted, ni una.", "La gente sabe perfectamente quién ha gobernado mal."],
  esq: ["Eso es falso, y usted lo sabe.", "Usted siempre recurre al miedo."],
  sob: ["Cuando nos necesitan, bien que nos llaman.", "Nosotros cumplimos; son ustedes quienes no cumplen."],
  nova: ["Ustedes son los que han llevado al país hasta aquí.", "Eso lo dicen los que llevan cuarenta años mandando."],
};

// Atacs dels rivals al jugador
const DB_ATTACKS = {
  esq: ["Su programa beneficia a los de siempre. Que se lo explique a las familias trabajadoras.", "Mucho discurso, pero ¿dónde están los números de sus propuestas?"],
  dreta: ["Usted promete cosas que no se pueden pagar. ¿Quién las pagará?", "Su partido no tiene ni experiencia ni equipo para gobernar."],
  sob: ["Usted habla de todo el Estado pero no entiende nada de lo que pasa en nuestra casa.", "Sus promesas siempre se olvidan al día siguiente de las elecciones."],
  nova: ["Usted es uno más de los de siempre, aunque quiera parecer nuevo.", "¿Cuánto cobra usted? La gente quiere saberlo."],
};

// ---------- Obstacles ----------
// Afirmacions dels rivals que es poden verificar en directe (sobre les regles electorals)
const DB_CLAIMS = [
  { t: "Madrid es la circunscripción que elige más diputados: 38.", ok: true, exp: "Es cierto: Madrid elige 38 diputados, y Barcelona 32." },
  { t: "En el Senado, cada provincia peninsular elige seis senadores.", ok: false, exp: "Es falso: cada provincia peninsular elige cuatro." },
  { t: "Para tener mayoría absoluta en el Congreso hacen falta 176 diputados.", ok: true, exp: "Es cierto: la mitad más uno de los 350 diputados." },
  { t: "El voto en blanco no cuenta para nada.", ok: false, exp: "Es falso: es un voto válido y cuenta para calcular el 3 % que hace falta para optar a escaño." },
  { t: "La campaña electoral dura quince días.", ok: true, exp: "Es cierto: del 13 al 27 de noviembre." },
  { t: "Al presidente del Gobierno lo eligen directamente los ciudadanos en las urnas.", ok: false, exp: "Es falso: votamos diputados, y es el Congreso quien elige al presidente en una investidura." },
  { t: "Los jóvenes de dieciséis años pueden votar en estas elecciones.", ok: false, exp: "Es falso: en las elecciones generales hay que tener dieciocho años." },
  { t: "Una moción de censura debe proponer un candidato alternativo a presidente.", ok: true, exp: "Es cierto: en España la moción de censura es constructiva." },
  { t: "Cada provincia tiene como mínimo dos diputados.", ok: true, exp: "Es cierto: la ley electoral garantiza dos a cada provincia, y uno a Ceuta y otro a Melilla." },
  { t: "Las encuestas se pueden publicar hasta el día antes de votar.", ok: false, exp: "Es falso: no se pueden publicar durante los cinco días anteriores a la votación." },
  { t: "El Senado puede vetar una ley, pero el Congreso puede levantar el veto.", ok: true, exp: "Es cierto: por mayoría absoluta, o por mayoría simple pasados dos meses." },
  { t: "En la jornada de reflexión todavía se pueden hacer mítines hasta medianoche.", ok: false, exp: "Es falso: la campaña acaba el viernes a medianoche y el sábado no se puede hacer campaña." },
  // Dades de cada tema (topic): surten amb preferència en el bloc d'aquell tema
  { topic: "economia", t: "El IVA general en España es del 21 %.", ok: true, exp: "Es cierto: el tipo general del IVA es del 21 %." },
  { topic: "economia", t: "El IRPF lo pagan las empresas, no las personas.", ok: false, exp: "Es falso: el IRPF es el impuesto sobre la renta de las personas; las empresas pagan el impuesto de sociedades." },
  { topic: "habitatge", t: "La Constitución dice que todo el mundo tiene derecho a disfrutar de una vivienda digna y adecuada.", ok: true, exp: "Es cierto: lo dice el artículo 47 de la Constitución." },
  { topic: "habitatge", t: "La vivienda es un derecho fundamental, con la misma protección que la libertad de expresión.", ok: false, exp: "Es falso: el artículo 47 es un principio rector de la política social y económica, no un derecho fundamental con la misma protección." },
  { topic: "sanitat", t: "La Constitución reconoce el derecho a la protección de la salud.", ok: true, exp: "Es cierto: lo dice el artículo 43 de la Constitución." },
  { topic: "sanitat", t: "Los hospitales públicos los gestiona directamente el Ministerio de Sanidad.", ok: false, exp: "Es falso: la gestión de la sanidad pública está transferida a las comunidades autónomas." },
  { topic: "immigracio", t: "Para votar en las elecciones generales hay que tener la nacionalidad española.", ok: true, exp: "Es cierto: en las elecciones generales solo pueden votar los españoles." },
  { topic: "immigracio", t: "Los ciudadanos de otros países de la Unión Europea que viven aquí pueden votar en las generales.", ok: false, exp: "Es falso: pueden votar en las municipales y en las europeas, pero no en las generales." },
  { topic: "clima", t: "El Acuerdo de París quiere limitar el calentamiento global muy por debajo de los 2 °C.", ok: true, exp: "Es cierto: y hacer esfuerzos para que no pase de 1,5 °C." },
  { topic: "clima", t: "España ya ha cerrado todas las centrales nucleares.", ok: false, exp: "Es falso: todavía funcionan, y el calendario de cierre va de 2027 a 2035." },
  { topic: "territori", t: "El País Vasco y Navarra recaudan sus propios impuestos.", ok: true, exp: "Es cierto: tienen el concierto y el convenio económico." },
  { topic: "territori", t: "Todas las comunidades autónomas tienen exactamente las mismas competencias.", ok: false, exp: "Es falso: las competencias varían según el estatuto de cada comunidad." },
];
// Partits amb qui et pregunten si pactaries (per contrast ideològic)
const DB_TRAP = {
  esq: "vox", cesq: "vox", centre: "bildu", cdreta: "bildu", dreta: "bildu",
};
