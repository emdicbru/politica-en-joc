// Simulador de debat electoral: contingut. Tot és ficció: les intervencions dels candidats reals són inventades i genèriques,
// inspirades en les posicions públiques dels seus partits, i no reprodueixen declaracions reals.

const DB_DISCLAIMER = "Debat de ficció. Les intervencions dels candidats reals són inventades i genèriques, inspirades en les posicions públiques dels seus partits.";

// ---------- El teu partit ----------
const DB_IDEOS = [
  { k: "esq", label: "Esquerra", x: 1.5 },
  { k: "cesq", label: "Centreesquerra", x: 3.5 },
  { k: "centre", label: "Centre", x: 5 },
  { k: "cdreta", label: "Centredreta", x: 6.8 },
  { k: "dreta", label: "Dreta", x: 8.8 },
];
const DB_TERRS = [
  { k: "central", label: "Centralista", d: "Un model igual per a tot l'Estat." },
  { k: "autonom", label: "Autonomista", d: "Més autogovern i finançament just." },
  { k: "sobir", label: "Sobiranista", d: "Que cada nació decideixi el seu futur." },
];
const DB_SIZES = [
  { k: "gran", label: "Gran", d: "Aspira a governar. Et conviden a tots els debats, també al cara a cara.", base: 30 },
  { k: "mitja", label: "Mitjà", d: "Té grup propi al Congrés. Et conviden al debat a set.", base: 9 },
  { k: "nou", label: "Nou", d: "Sense escons. Només et conviden al debat de les forces sense grup.", base: 2 },
];
const DB_STYLES = [
  { k: "rigor", label: "Rigorós", d: "Dades i calma. Les respostes tècniques et surten millor, però costa emocionar.", fx: { dades: 1.3, emocio: 0.85, atac: 0.9, proposta: 1.1 } },
  { k: "combat", label: "Combatiu", d: "Contundent i ràpid. Els atacs fan més mal, però t'alteres més fàcilment.", fx: { dades: 0.9, emocio: 1, atac: 1.35, proposta: 0.95 }, nerves: 1.25 },
  { k: "proper", label: "Proper", d: "Empàtic i planer. Connectes amb la gent, però les xifres no són el teu fort.", fx: { dades: 0.85, emocio: 1.35, atac: 0.85, proposta: 1.05 } },
];
const DB_COLORS = ["#7b3fe4", "#00a37a", "#f59f24", "#e0306f", "#1e88d6", "#ff4b2b", "#3f8f45", "#17173d"];
const DB_NAMES = ["Laia Prats", "Marc Rovira", "Núria Vidal", "Jordi Casals", "Clara Ribas", "Pau Serra", "Aina Costa", "Oriol Puig"];

// ---------- Formats i convidats ----------
// Els debats es fan segons la representació dels partits (criteri de proporcionalitat de la Junta Electoral Central).
// Cada debat té la presentació, uns quants temes triats a l'atzar (topics), els pactes i el minut d'or.
const DB_FORMATS = {
  cara: { title: "Cara a cara", net: "Cadena privada", desc: "Tu i el principal rival, una hora, sense ningú més. És el debat més vist de la campanya.", sizes: ["gran"], rivals: 1, topics: 2, secs: 300 },
  quatre: { title: "Debat a quatre", net: "Televisió pública", desc: "Els quatre partits més grans. Molt de ritme i poc temps per a cadascú.", sizes: ["gran"], rivals: 3, topics: 3, secs: 270 },
  set: { title: "Debat a set", net: "Televisió pública", desc: "Tots els grups del Congrés. Per destacar, cal saber triar els moments.", sizes: ["gran", "mitja"], rivals: 6, topics: 3, secs: 240 },
  petits: { title: "Debat de les forces sense grup", net: "Canal autonòmic", desc: "Els partits que no tenen grup propi. Menys audiència, però és la teva oportunitat.", sizes: ["nou"], rivals: 3, topics: 2, secs: 270 },
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
  { k: "dona1", label: "Cabell llarg" }, { k: "dona2", label: "Melena" }, { k: "dona3", label: "Cua" }, { k: "dona4", label: "Bob" },
  { k: "home1", label: "Pentinat enrere" }, { k: "home2", label: "Cabell curt" }, { k: "home4", label: "Serrell" }, { k: "home3", label: "Calb" },
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
  obertura: { title: "Presentació", q: "Bona nit i benvinguts al debat. Comencem amb la presentació: per què us haurien de votar el 29 de novembre?", cam: "Un minut per presentar-te",
    qs: ["Comencem amb la presentació: per què us haurien de votar el 29 de novembre?", "Primer torn: en un minut, qui són i què proposen?"] },
  economia: { title: "Economia i impostos", q: "Parlem d'economia. Els preus han pujat més que els sous. Què faran per a les famílies que no arriben a final de mes?",
    qs: ["Parlem d'economia. Els preus han pujat més que els sous. Què faran per a les famílies que no arriben a final de mes?", "Impostos: qui ha de pagar més i qui ha de pagar menys? Concretin, si us plau.", "Molts joves treballen i continuen sent pobres. Com ho arreglaran?"] },
  habitatge: { title: "Habitatge", q: "L'habitatge és la principal preocupació dels joves. Quina és la seva proposta concreta?",
    qs: ["L'habitatge és la principal preocupació dels joves. Quina és la seva proposta concreta?", "Els lloguers s'han disparat a les grans ciutats. Què faran perquè la gent s'hi pugui quedar a viure?", "Comprar un pis és un somni per a molts joves. Com els ajudaran?"] },
  territori: { title: "Model territorial", q: "Model territorial: finançament autonòmic, autogovern, Catalunya. On se situen?",
    qs: ["Model territorial: finançament autonòmic, autogovern, Catalunya. On se situen?", "Moltes comunitats reclamen un finançament més just. Què proposen?"] },
  sanitat: { title: "Sanitat", q: "Les llistes d'espera no paren de créixer. Com les reduiran?",
    qs: ["Les llistes d'espera no paren de créixer. Com les reduiran?", "Falten metges a l'atenció primària i a molts pobles no n'hi ha. Quina és la seva solució?"] },
  immigracio: { title: "Immigració", q: "La immigració és un dels temes que més divideix. Quin model proposen?",
    qs: ["La immigració és un dels temes que més divideix. Quin model proposen?", "Com volen gestionar l'arribada de persones migrants i la seva integració?"] },
  clima: { title: "Clima i energia", q: "Sequeres, incendis i el preu de la llum. Quina és la seva política climàtica?",
    qs: ["Sequeres, incendis i el preu de la llum. Quina és la seva política climàtica?", "Com faran la transició energètica sense que la paguin les famílies?"] },
  pactes: { title: "Pactes i governabilitat", q: "Cap partit tindrà majoria absoluta. Amb qui pactaran per governar?",
    qs: ["Cap partit tindrà majoria absoluta. Amb qui pactaran per governar?", "Parlem de pactes. Amb qui seurien a negociar l'endemà de les eleccions?"] },
  tancament: { title: "Minut d'or", q: "Arribem al final. Cada candidat té un minut per demanar el vot. És el seu minut d'or." },
};
const DB_TOPIC_NAMES = { economia: "els salaris", habitatge: "l'habitatge", territori: "el finançament", sanitat: "la sanitat", immigracio: "la immigració", clima: "l'energia" };
// La moderadora repregunta quan no s'ha respost la pregunta
const DB_FOLLOWUPS = [
  "Perdoni, però no ha respost la pregunta. Què farà, concretament?",
  "Li torno a preguntar: quina és la seva proposta? La gent vol saber-ho.",
  "Ha parlat molt del seu rival, però la pregunta era sobre vostè. Concreti, si us plau.",
];
// Quan interromps un rival
const DB_INTERRUPTS = ["Perdoni, però això no és cert!", "Un moment, un moment: això que diu és fals.", "No, no. Això no ho pot dir així, i vostè ho sap.", "Deixi'm dir una cosa: les dades el desmenteixen."];

// ---------- Les teves respostes ----------
// Propostes segons la ideologia (economia i habitatge) o el model territorial
const DB_PROPOSALS = {
  economia: {
    esq: "que paguin més els que més tenen, amb un impost a les grans fortunes, i pujar el salari mínim",
    cesq: "pujar els salaris més baixos i reforçar els serveis públics sense ofegar la classe mitjana",
    centre: "menys burocràcia per a autònoms i petites empreses, i uns comptes públics equilibrats",
    cdreta: "abaixar l'IRPF a les rendes mitjanes i atraure inversió que creï feina",
    dreta: "una rebaixa d'impostos general i retallar la despesa política supèrflua",
  },
  habitatge: {
    esq: "posar un topall als lloguers i construir un gran parc públic de lloguer social",
    cesq: "construir habitatge públic a preu assequible i ajudar els joves a pagar el lloguer",
    centre: "incentius fiscals perquè els propietaris lloguin a preu assequible, pactats amb el sector",
    cdreta: "alliberar sòl per construir més i donar seguretat jurídica als propietaris",
    dreta: "desallotjar ràpidament les ocupacions i abaixar els impostos de la compra d'habitatge",
  },
  territori: {
    central: "un sol model per a tot l'Estat, perquè cap territori tingui més privilegis que un altre",
    autonom: "un finançament just i més autogovern, sempre dins de la Constitució",
    sobir: "que la ciutadania pugui decidir el seu futur votant, com en qualsevol democràcia madura",
  },
  sanitat: {
    esq: "contractar més metges i infermeres i deixar de derivar diners públics a la sanitat privada",
    cesq: "un pla de xoc amb més personal a l'atenció primària i un temps màxim d'espera garantit per llei",
    centre: "un temps màxim garantit per a cada operació i més coordinació entre comunitats",
    cdreta: "fer servir tots els centres disponibles, públics i concertats, per buidar les llistes d'espera en dos anys",
    dreta: "llibertat per triar metge i centre i una targeta sanitària única per a tot el país",
  },
  immigracio: {
    esq: "regularitzar qui ja viu i treballa aquí i garantir els drets humans a la frontera",
    cesq: "vies legals i ordenades per venir a treballar, i més recursos per a la integració",
    centre: "una immigració ordenada, lligada a les ofertes de feina i amb integració de veritat",
    cdreta: "una immigració legal lligada al treball i més control de les fronteres",
    dreta: "un control estricte de les fronteres i l'expulsió de qui entri il·legalment",
  },
  clima: {
    esq: "energia renovable pública, transport públic gratuït per als joves i un calendari per tancar les nuclears",
    cesq: "accelerar les renovables i ajudar les famílies a aïllar i rehabilitar els habitatges",
    centre: "una transició energètica gradual, amb renovables i sense apujar la factura",
    cdreta: "mantenir les nuclears mentre creixen les renovables, perquè la llum sigui barata",
    dreta: "abaixar els impostos de l'energia i aturar les normes climàtiques que perjudiquen el camp",
  },
};
const DB_STORIES = {
  obertura: "Vaig créixer en un barri on la gent s'aixeca a les sis per anar a treballar, i és per ells que em presento",
  economia: "Aquesta setmana una infermera em deia que, amb dues feines, no arriba a final de mes",
  habitatge: "Fa uns dies vaig conèixer una parella de trenta anys que encara viu a casa dels pares perquè el lloguer és impossible",
  territori: "A cada poble on vaig em diuen el mateix: volen que les decisions es prenguin a prop seu",
  sanitat: "La mare d'una amiga ha esperat vuit mesos per operar-se del maluc, amb dolor cada dia",
  immigracio: "Al barri on visc hi ha gent nascuda a vint països diferents que treballa i paga impostos com tothom",
  clima: "Aquest estiu un pagès de la Segarra em va ensenyar la collita que havia perdut per la sequera",
};
// Les cartes de resposta: cada enfocament té un cost de temps i un efecte diferent en cada grup de votants
const DB_APPROACHES = {
  proposta: { label: "Proposta concreta", icon: "📌", secs: 55, fx: { base: 1, indecisos: 2.2, rivals: 0.4 } },
  dades: { label: "Dades i calendari", icon: "📊", secs: 75, fx: { base: 0.6, indecisos: 2.6, rivals: 0.8 } },
  emocio: { label: "Una història", icon: "💬", secs: 50, fx: { base: 2, indecisos: 1.6, rivals: 0.2 } },
  atac: { label: "Ataca el rival", icon: "⚡", secs: 40, fx: { base: 2.4, indecisos: -0.6, rivals: -1.2 } },
};

// Obertura i minut d'or
const DB_OPENINGS = [
  { k: "emocio", label: "Per què em presento", quote: "{story}. Vull un país on treballar dur torni a valdre la pena." },
  { k: "dades", label: "Diagnòstic del país", quote: "Tres xifres: el preu del lloguer, el sou mitjà dels joves i les llistes d'espera. Totes tres han empitjorat, i jo porto un pla per a cadascuna." },
  { k: "atac", label: "Directe al favorit", quote: "{rival} ha tingut la seva oportunitat i no l'ha aprofitat. Avui els explicaré per què ha arribat l'hora de canviar." },
  { k: "proposta", label: "La promesa estrella", quote: "Si governo, la primera llei serà sobre {tema}: {proposal}." },
];
const DB_CLOSINGS = [
  { k: "esperanca", label: "Esperança", fx: { base: 1.5, indecisos: 2.4, rivals: 0.6 }, quote: "El 29 de novembre no votem contra ningú: votem a favor d'un país que funcioni per a tothom. Us demano la confiança." },
  { k: "por", label: "Advertència", fx: { base: 2.6, indecisos: 0.6, rivals: -0.8 }, quote: "Si no anem a votar, altres decidiran per nosaltres. Aquesta vegada ens hi juguem massa." },
  { k: "proposta", label: "La proposta estrella", fx: { base: 1.2, indecisos: 2.6, rivals: 0.4 }, quote: "Recordeu una sola cosa d'aquest debat: {proposal}. Això és el que farem." },
  { k: "mobilitza", label: "Crida a la mobilització", fx: { base: 3, indecisos: 1, rivals: -0.2 }, quote: "Cada vot compta. Parleu-ne a casa, a la feina, amb els amics. El 29 de novembre, guanyem-ho junts." },
];

// ---------- Rivals: intervencions genèriques segons el perfil del partit ----------
// esq: esquerra; dreta: dreta; sob: sobiranista o nacionalista; nova: partits nous de protesta
const DB_RIVAL_KIND = { pp: "dreta", psoe: "esq", vox: "dreta", fa: "esq", podemos: "esq", erc: "sob", junts: "sob", bildu: "sob", pnv: "sob", bng: "sob", cc: "sob", salf: "nova" };
const DB_RIVAL_LINES = {
  obertura: {
    esq: ["Vinc a defensar el que hem aconseguit i el molt que encara queda per fer per a la majoria social.", "Aquest país avança quan es reparteix millor la riquesa, i això és el que proposem."],
    dreta: ["Vinc a proposar un canvi: menys impostos, més ordre i un Govern que compleixi la paraula.", "Espanya necessita estabilitat i un rumb clar, i nosaltres l'oferim."],
    sob: ["Vinc a defensar els interessos del meu país, que massa sovint s'obliden a Madrid.", "Que ningú no dubti que el nostre vot serà decisiu i que el farem valdre."],
    nova: ["Sóc aquí perquè la gent està farta dels de sempre, i nosaltres no devem res a ningú.", "Els partits tradicionals han fallat. Nosaltres som l'alternativa."],
  },
  economia: {
    esq: ["Hem pujat el salari mínim i això ha anat bé. Cal continuar repartint millor.", "Els beneficis de les grans empreses han de contribuir més."],
    dreta: ["El problema són els impostos: la gent paga massa i rep massa poc.", "Amb menys burocràcia i impostos més baixos, l'economia creixerà més."],
    sob: ["El dèficit fiscal ens llasta: els nostres diners han de servir per als nostres serveis.", "Volem decidir la nostra política econòmica, sense dependre de ningú."],
    nova: ["Mentre els polítics cobren sous de luxe, la gent no arriba a final de mes.", "Primer, retallar els privilegis dels polítics; després, parlem d'impostos."],
  },
  habitatge: {
    esq: ["L'habitatge és un dret, no un negoci: cal regular els lloguers.", "Necessitem molt més habitatge públic, i el volem fer."],
    dreta: ["L'ocupació il·legal i la inseguretat jurídica fan fugir els propietaris del lloguer.", "La solució és construir més, no posar topalls que redueixen l'oferta."],
    sob: ["Les competències d'habitatge són nostres i les volem exercir sense interferències.", "Calen recursos per fer el parc públic que necessitem."],
    nova: ["Els joves no es poden independitzar, i ningú dels que han governat ho ha arreglat.", "Primer cal acabar amb el malbaratament, i després hi haurà diners per a habitatge."],
  },
  territori: {
    esq: ["Defensem un model federal que reconegui la diversitat de l'Estat.", "El diàleg és l'únic camí per resoldre els conflictes territorials."],
    dreta: ["La igualtat de tots els espanyols no es negocia.", "No hi haurà privilegis per a uns quants a canvi de vots."],
    sob: ["El nostre poble té dret a decidir, i no renunciarem a aquest objectiu.", "Volem un finançament que no ens castigui any rere any."],
    nova: ["Les autonomies són una màquina de despesa política que cal aprimar.", "Menys estructures polítiques i més serveis per a la gent."],
  },
  sanitat: {
    esq: ["La sanitat pública no es ven: més pressupost i més personal.", "Les retallades d'ara són les llistes d'espera de demà."],
    dreta: ["Cal fer servir tots els recursos, públics i privats, per reduir les esperes.", "Menys burocràcia i més metges a les consultes."],
    sob: ["La sanitat és competència nostra, però ens falten els recursos per pagar-la.", "Ningú gestiona millor la sanitat que qui la té a prop."],
    nova: ["Mentre els polítics tenen privilegis, la gent espera mesos per a una operació.", "Primer, treure diners dels càrrecs inútils i posar-los a la sanitat."],
  },
  immigracio: {
    esq: ["La immigració sosté les pensions i l'economia: cal integrar-la amb drets.", "Ningú no és il·legal: cal regularitzar qui ja viu aquí."],
    dreta: ["Volem una immigració legal i ordenada, no la que decideixen les màfies.", "Cal controlar les fronteres, com fa qualsevol país seriós."],
    sob: ["La integració es fa als nostres pobles i ciutats, i ens n'han de donar els recursos.", "Volem les competències per gestionar-ho des d'aquí."],
    nova: ["Els governs de sempre han perdut el control de les fronteres.", "Primer els d'aquí: és el que la gent diu al carrer."],
  },
  clima: {
    esq: ["L'emergència climàtica no espera: renovables i transició justa, ja.", "La transició ecològica és la gran oportunitat industrial del país."],
    dreta: ["Transició sí, però sense arruïnar el camp ni la indústria.", "No podem pujar la factura de la llum a les famílies en nom del clima."],
    sob: ["Les renovables s'han de fer amb el territori, no contra el territori.", "Volem decidir el nostre model energètic."],
    nova: ["Les agendes climàtiques de Brussel·les les paga el pagès.", "Primer que abaixin la factura de la llum; després, que donin lliçons."],
  },
  pactes: {
    esq: ["Pactarem amb les forces progressistes. Amb l'extrema dreta, mai.", "La majoria progressista ja ha demostrat que funciona."],
    dreta: ["Volem governar en solitari, i si cal parlar, serà amb qui defensi la unitat d'Espanya.", "No pactarem amb els qui volen trencar el país."],
    sob: ["Els nostres vots tindran un preu, i el preu serà el que necessita el nostre país.", "Pactarem amb qui respecti la nostra voluntat."],
    nova: ["No pactarem amb la casta. Que ens votin i ja en parlarem.", "Nosaltres som el vot de càstig, i no ens vendrem."],
  },
  tancament: {
    esq: ["El 29 de novembre ens juguem si continuem avançant o tornem enrere. Us demano el vot.", "Votar és la millor manera de defensar el que hem aconseguit."],
    dreta: ["El 29 de novembre podem canviar de rumb. Confieu en nosaltres.", "És l'hora del canvi. Us demano el vot per a un Govern fort."],
    sob: ["Com més forts siguem a Madrid, més respectats serem a casa. Voteu-nos.", "El nostre vot és decisiu: feu-lo servir."],
    nova: ["Si esteu farts, ara teniu una alternativa. No us quedeu a casa.", "Sacsegem el sistema. El 29 de novembre, voteu-nos."],
  },
};
// Intervencions pròpies de cada partit (si n'hi ha, tenen preferència sobre les genèriques)
const DB_PARTY_LINES = {
  pp: {
    obertura: ["Vinc a proposar un Govern que torni a posar ordre a l'economia i a les institucions.", "Espanya necessita un canvi de rumb, i nosaltres tenim l'equip per fer-lo."],
    economia: ["Cal abaixar impostos a les classes mitjanes i acabar amb la despesa que no serveix per a res.", "Menys impostos i més inversió: així es crea feina."],
    habitatge: ["Cal construir molt més i protegir els propietaris davant de l'ocupació.", "Proposem avals perquè els joves puguin comprar el primer pis."],
    territori: ["La igualtat de tots els espanyols no es pot negociar a canvi de vots.", "Defensem l'Estat de les autonomies, sense privilegis per a ningú."],
    sanitat: ["Proposem un pla nacional contra les llistes d'espera, amb tots els recursos disponibles.", "Les llistes d'espera són el fracàs d'aquest Govern."],
    immigracio: ["Volem una immigració ordenada i legal, lligada al treball.", "Cal controlar les fronteres i perseguir les màfies."],
    clima: ["Transició energètica sí, però sense castigar el camp ni la indústria.", "Allargar la vida de les nuclears és la manera de reduir emissions sense apujar la factura."],
    pactes: ["Aspirem a governar sols. No pactarem amb qui vulgui trencar Espanya.", "Volem una majoria prou àmplia per no dependre de ningú."],
    tancament: ["Si voleu un canvi tranquil i seriós, el 29 de novembre voteu-nos.", "És l'hora de l'alternança. Us demano la confiança."],
  },
  psoe: {
    obertura: ["Vinc a defensar el que hem avançat: més ocupació, pensions dignes i més drets.", "Aquest país funciona millor quan protegeix la majoria."],
    economia: ["Hem pujat el salari mínim i hi ha més gent treballant que mai. Cal continuar.", "Volem que els grans beneficis contribueixin més, no la classe treballadora."],
    habitatge: ["Ampliarem el parc públic d'habitatge i posarem límits als preus abusius.", "L'habitatge ha de ser un dret, no un negoci especulatiu."],
    territori: ["Proposem una Espanya federal, on hi càpiga tothom.", "El diàleg ha funcionat millor que la confrontació."],
    sanitat: ["Blindarem la sanitat pública davant de les retallades.", "Més metges i més pressupost per a l'atenció primària."],
    immigracio: ["La immigració regular és necessària per a l'economia i per a les pensions.", "Cal integrar, no aixecar murs."],
    clima: ["La transició ecològica crea feina i abaixa la factura de la llum.", "Les renovables són la gran oportunitat industrial d'Espanya."],
    pactes: ["Pactarem amb les forces progressistes. Amb l'extrema dreta, mai.", "La majoria progressista ja ha demostrat que pot governar."],
    tancament: ["El 29 de novembre ens juguem no fer cap pas enrere. Us demano el vot.", "Votem per continuar avançant."],
  },
  vox: {
    obertura: ["Vinc a dir el que els altres no s'atreveixen a dir.", "Som l'única alternativa real als partits de sempre."],
    economia: ["Cal retallar la despesa política i abaixar dràsticament els impostos.", "Primer els d'aquí: protegirem el camp i la indústria nacional."],
    habitatge: ["Acabarem amb l'ocupació il·legal amb desallotjaments immediats.", "Més sòl i menys impostos: així es fan pisos assequibles."],
    territori: ["Les autonomies han fracassat: cal recuperar competències per a l'Estat.", "Una sola nació i la mateixa llei per a tothom."],
    sanitat: ["Una sola targeta sanitària per a tota Espanya.", "Menys burocràcia autonòmica i més metges."],
    immigracio: ["Volem fronteres segures i expulsar qui entri il·legalment.", "La immigració il·legal s'ha d'aturar, i ho farem."],
    clima: ["Les polítiques climàtiques estan arruïnant els nostres agricultors.", "Prou d'agendes que encareixen la vida."],
    pactes: ["Només donarem suport a un Govern que defensi la unitat d'Espanya.", "No serem la crossa de ningú a canvi de res."],
    tancament: ["Si voleu un canvi de veritat, voteu sense por.", "El 29 de novembre, voteu amb valentia."],
  },
  fa: {
    obertura: ["Vinc a defensar una política útil per a la gent que no arriba a final de mes.", "Hem vingut a guanyar drets, no a perdre'ls."],
    economia: ["Reduirem la jornada laboral sense reduir el sou.", "Cal un sistema fiscal on paguin més els que més tenen."],
    habitatge: ["Topall als lloguers i prou fons voltor.", "L'habitatge és el gran problema del país, i cal intervenir el mercat."],
    territori: ["Defensem un Estat plurinacional i el diàleg.", "Reconèixer la diversitat fa el país més fort."],
    sanitat: ["Ni un euro públic per fer negoci amb la salut.", "Volem la salut mental i el dentista a la sanitat pública."],
    immigracio: ["Regularitzar qui ja viu i treballa aquí és de justícia.", "Drets humans a la frontera, sempre."],
    clima: ["L'emergència climàtica no espera: transició justa, ja.", "Més transport públic i renovables al servei de tothom."],
    pactes: ["Volem reeditar un Govern progressista, però més valent.", "Amb nosaltres, el Govern anirà més lluny."],
    tancament: ["Voteu per una vida que es pugui pagar.", "El 29 de novembre, votem per guanyar drets."],
  },
  erc: {
    obertura: ["Vinc a defensar Catalunya i a fer que els nostres vots serveixin per a alguna cosa.", "Som aquí per arrencar compromisos, no per fer de decorat."],
    economia: ["El dèficit fiscal ens llasta: volem gestionar els nostres recursos.", "Rodalies, finançament i inversions: que es compleixi el que es promet."],
    territori: ["Volem un referèndum pactat i el finançament singular per a Catalunya.", "El conflicte polític només es resol votant."],
    pactes: ["Els nostres vots valen el que valguin els compromisos complerts.", "Mai no farem president ningú que pacti amb l'extrema dreta."],
    tancament: ["Com més forts siguem a Madrid, més respectats serem a casa.", "Voteu perquè Catalunya decideixi."],
  },
  junts: {
    obertura: ["Vinc a defensar Catalunya, i res més.", "Els nostres vots són de Catalunya i no els regalarem."],
    economia: ["Volem rebaixar la pressió fiscal a les empreses i als autònoms catalans.", "Catalunya paga molt i rep poc: cal canviar-ho."],
    territori: ["El nostre objectiu és la independència, i no hi renunciem.", "Volem les competències que ens toquen, sense excuses."],
    immigracio: ["Volem que Catalunya tingui les competències d'immigració.", "La integració es fa en català i des de Catalunya."],
    pactes: ["No firmarem xecs en blanc a ningú.", "Pactarem fets, no promeses."],
    tancament: ["Si voleu que Catalunya compti, voteu-nos.", "Voteu per una Catalunya que no demana permís."],
  },
  bildu: {
    obertura: ["Vinc a defensar les classes populars i els drets d'Euskal Herria.", "Som una força útil per frenar la dreta."],
    economia: ["Pensions dignes i salaris que permetin viure.", "Cal una fiscalitat justa i més valenta."],
    territori: ["Euskal Herria té dret a decidir el seu futur.", "Volem més sobirania per decidir com volem viure."],
    pactes: ["Farem servir els nostres vots per frenar la dreta i guanyar drets.", "Som una força fiable per a un Govern progressista."],
    tancament: ["Voteu per una Euskal Herria amb més drets.", "Feu servir el vostre vot per frenar la dreta."],
  },
  podemos: {
    obertura: ["Vinc a dir les coses pel seu nom, encara que molestin.", "Som l'esquerra que no s'agenolla."],
    economia: ["Cal posar impostos als bancs i a les elèctriques.", "Prou de rescatar sempre els mateixos."],
    habitatge: ["Intervenir el mercat del lloguer ja, sense excuses.", "Prohibir la compra d'habitatge per especular."],
    pactes: ["Farem un Govern d'esquerres de veritat o res.", "No serem una crossa sense condicions."],
    tancament: ["Si voleu una esquerra valenta, voteu-nos.", "El vot útil és el vot valent."],
  },
  bng: {
    obertura: ["Vinc a defensar Galícia, que massa sovint s'oblida a Madrid.", "Galícia necessita veu pròpia al Congrés."],
    economia: ["Volem que l'energia que produïm a Galícia la paguem més barata.", "Inversions per a Galícia, no promeses."],
    pactes: ["Els nostres vots seran per a Galícia.", "Pactarem amb qui respecti Galícia."],
    tancament: ["Voteu Galícia.", "Feu que Galícia compti al Congrés."],
  },
  cc: {
    obertura: ["Vinc a defensar Canàries, que té problemes que a Madrid no s'entenen.", "Som la veu de les illes."],
    economia: ["Volem que es compleixi el règim econòmic i fiscal de Canàries.", "Canàries necessita inversions i connectivitat."],
    immigracio: ["Canàries no pot assumir sola l'arribada de pasteres: cal solidaritat de tot l'Estat.", "Necessitem recursos per atendre els menors que arriben sols."],
    pactes: ["Donarem suport a qui es comprometi amb Canàries.", "El nostre vot és per a Canàries."],
    tancament: ["Voteu Canàries.", "Que Canàries tingui veu pròpia."],
  },
  salf: {
    obertura: ["Sóc aquí perquè la gent està farta de la classe política de sempre.", "Nosaltres no devem res a ningú."],
    economia: ["Primer, acabar amb els privilegis dels polítics.", "Mentre la gent no arriba a final de mes, ells es pugen el sou."],
    immigracio: ["Cal acabar amb el descontrol a les fronteres.", "La gent té por i ningú l'escolta."],
    pactes: ["No pactarem amb la casta.", "Som el vot de càstig, i no ens vendrem."],
    tancament: ["Si esteu farts, ara teniu una alternativa.", "El 29 de novembre, sacsegeu el sistema."],
  },
};
// Atacs propis de cada partit al jugador
const DB_PARTY_ATTACKS = {
  pp: ["El seu programa és un festival de despesa que pagaran els de sempre.", "Vostè no ha gestionat mai res. Com vol governar un país?"],
  psoe: ["Vostè promet retallar drets amb un somriure.", "Les seves receptes ja les vam patir, i van ser un desastre."],
  vox: ["Vostè és més del mateix, amb una altra corbata.", "Vostè parla molt però no s'atreveix a dir el que pensa."],
  fa: ["Les seves propostes no resisteixen el preu d'un lloguer a qualsevol ciutat.", "Quan toca triar entre la gent i els poderosos, vostè sempre tria els mateixos."],
  erc: ["Vostè es recorda de Catalunya només en campanya.", "Les seves promeses a Catalunya caduquen l'endemà de votar."],
  junts: ["Vostè no ha entès res del que passa a Catalunya.", "Molt de discurs, però a l'hora de la veritat sempre vota amb Madrid."],
  podemos: ["Vostè és l'esquerra que es rendeix abans de començar.", "Quan arriba al Govern, s'oblida de tot el que havia promès."],
  salf: ["Quant cobra vostè? La gent vol saber-ho.", "Vostè viu de la política, i es nota."],
};
// Topades entre rivals: el primer ataca ({b} és el nom de l'altre) i l'altre respon
const DB_CLASH = {
  dreta: ["{b} ha posat la governabilitat en mans dels qui volen trencar el país.", "Amb {b}, els impostos no han parat de pujar."],
  esq: ["{b} vol retallar tot el que hem guanyat en drets.", "Les receptes de {b} ja les vam patir a la crisi."],
  sob: ["Ni {b} ni els seus han complert mai res del que van prometre.", "{b} només es recorda de nosaltres quan necessita vots."],
  nova: ["{b} és la mateixa casta de sempre.", "{b} ha viscut tota la vida de la política."],
};
const DB_CLASH_REPLY = {
  dreta: ["Lliçons, de vostè, ni una.", "La gent sap perfectament qui ha governat malament."],
  esq: ["Això és fals, i vostè ho sap.", "Vostè sempre recorre a la por."],
  sob: ["Quan ens necessiten, bé que ens truquen.", "Nosaltres complim; són vostès qui no compleixen."],
  nova: ["Vostès són els que han portat el país fins aquí.", "Això ho diuen els que fa quaranta anys que manen."],
};

// Atacs dels rivals al jugador
const DB_ATTACKS = {
  esq: ["El seu programa beneficia els de sempre. Que ho expliqui a les famílies treballadores.", "Molt de discurs, però on són els números de les seves propostes?"],
  dreta: ["Vostè promet coses que no es poden pagar. Qui les pagarà?", "El seu partit no té ni experiència ni equip per governar."],
  sob: ["Vostè parla de tot l'Estat però no entén res del que passa a casa nostra.", "Les seves promeses sempre s'obliden l'endemà de les eleccions."],
  nova: ["Vostè és un més dels de sempre, encara que vulgui semblar nou.", "Quant cobra vostè? La gent vol saber-ho."],
};

// ---------- Obstacles ----------
// Afirmacions dels rivals que es poden verificar en directe (sobre les regles electorals)
const DB_CLAIMS = [
  { t: "Madrid és la circumscripció que elegeix més diputats: 38.", ok: true, exp: "És cert: Madrid elegeix 38 diputats, i Barcelona 32." },
  { t: "Al Senat, cada província peninsular elegeix sis senadors.", ok: false, exp: "És fals: cada província peninsular n'elegeix quatre." },
  { t: "Per tenir majoria absoluta al Congrés calen 176 diputats.", ok: true, exp: "És cert: la meitat més un dels 350 diputats." },
  { t: "El vot en blanc no compta per a res.", ok: false, exp: "És fals: és un vot vàlid i compta per calcular el 3 % que cal per optar a escó." },
  { t: "La campanya electoral dura quinze dies.", ok: true, exp: "És cert: del 13 al 27 de novembre." },
  { t: "El president del Govern l'escullen directament els ciutadans a les urnes.", ok: false, exp: "És fals: votem diputats, i és el Congrés qui elegeix el president en una investidura." },
  { t: "Els joves de setze anys poden votar en aquestes eleccions.", ok: false, exp: "És fals: a les eleccions generals cal tenir divuit anys." },
  { t: "Una moció de censura ha de proposar un candidat alternatiu a president.", ok: true, exp: "És cert: a Espanya la moció de censura és constructiva." },
  { t: "Cada província té com a mínim dos diputats.", ok: true, exp: "És cert: la llei electoral en garanteix dos a cada província, i un a Ceuta i un a Melilla." },
  { t: "Les enquestes es poden publicar fins al dia abans de votar.", ok: false, exp: "És fals: no se'n poden publicar durant els cinc dies anteriors a la votació." },
  { t: "El Senat pot vetar una llei, però el Congrés pot aixecar el veto.", ok: true, exp: "És cert: per majoria absoluta, o per majoria simple passats dos mesos." },
  { t: "A la jornada de reflexió encara es poden fer mítings fins a mitjanit.", ok: false, exp: "És fals: la campanya s'acaba el divendres a mitjanit i el dissabte no es pot fer campanya." },
  // Dades de cada tema (topic): surten amb preferència en el bloc d'aquell tema
  { topic: "economia", t: "L'IVA general a Espanya és del 21 %.", ok: true, exp: "És cert: el tipus general de l'IVA és del 21 %." },
  { topic: "economia", t: "L'IRPF el paguen les empreses, no les persones.", ok: false, exp: "És fals: l'IRPF és l'impost sobre la renda de les persones; les empreses paguen l'impost de societats." },
  { topic: "habitatge", t: "La Constitució diu que tothom té dret a gaudir d'un habitatge digne i adequat.", ok: true, exp: "És cert: ho diu l'article 47 de la Constitució." },
  { topic: "habitatge", t: "L'habitatge és un dret fonamental, amb la mateixa protecció que la llibertat d'expressió.", ok: false, exp: "És fals: l'article 47 és un principi rector de la política social i econòmica, no un dret fonamental amb la mateixa protecció." },
  { topic: "sanitat", t: "La Constitució reconeix el dret a la protecció de la salut.", ok: true, exp: "És cert: ho diu l'article 43 de la Constitució." },
  { topic: "sanitat", t: "Els hospitals públics els gestiona directament el Ministeri de Sanitat.", ok: false, exp: "És fals: la gestió de la sanitat pública està traspassada a les comunitats autònomes." },
  { topic: "immigracio", t: "Per votar a les eleccions generals cal tenir la nacionalitat espanyola.", ok: true, exp: "És cert: a les eleccions generals només hi poden votar els espanyols." },
  { topic: "immigracio", t: "Els ciutadans d'altres països de la Unió Europea que viuen aquí poden votar a les generals.", ok: false, exp: "És fals: poden votar a les municipals i a les europees, però no a les generals." },
  { topic: "clima", t: "L'Acord de París vol limitar l'escalfament global ben per sota dels 2 °C.", ok: true, exp: "És cert: i fer esforços perquè no passi d'1,5 °C." },
  { topic: "clima", t: "Espanya ja ha tancat totes les centrals nuclears.", ok: false, exp: "És fals: encara en funcionen, i el calendari de tancament va del 2027 al 2035." },
  { topic: "territori", t: "El País Basc i Navarra recapten els seus propis impostos.", ok: true, exp: "És cert: tenen el concert i el conveni econòmic." },
  { topic: "territori", t: "Totes les comunitats autònomes tenen exactament les mateixes competències.", ok: false, exp: "És fals: les competències varien segons l'estatut de cada comunitat." },
];
// Partits amb qui et pregunten si pactaries (per contrast ideològic)
const DB_TRAP = {
  esq: "vox", cesq: "vox", centre: "bildu", cdreta: "bildu", dreta: "bildu",
};
