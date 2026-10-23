// Dades ampliades dels partits per al comparador: història, on governen, propostes estrella,
// aliances habituals i quatre temes més d'argumentari. Redactat en termes neutres a partir de
// programes electorals i fets públics; els programes del 29N poden introduir canvis.

ARG_AREAS.push(
  { k: "pen", label: "Pensions", icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>` },
  { k: "serv", label: "Sanitat i educació", icon: `<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>` },
  { k: "jus", label: "Justícia i seguretat", icon: `<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/>` },
  { k: "est", label: "Model d'Estat i llengües", icon: `<path d="M3 20h18M5 20V10M10 20V10M14 20V10M19 20V10M2 10l10-6 10 6z"/>` },
);

const PARTY_EXTRA = {
  pp: {
    hist: "Refundat el 1989 a partir d'Alianza Popular. Ha governat Espanya amb Aznar (1996–2004) i Rajoy (2011–2018), i des del 2018 és a l'oposició al Congrés.",
    gov: "Governa la majoria de comunitats autònomes: Madrid, Andalusia, Galícia, Castella i Lleó, València, Múrcia, Aragó, Extremadura, Cantàbria, Balears i La Rioja, a més de Ceuta i Melilla.",
    strong: "Madrid, Galícia, Andalusia, Castella i Lleó, València i Múrcia.",
    stars: ["Rebaixa de l'IRPF", "Derogar l'amnistia i el que anomena «sanchisme»", "Pla d'habitatge amb més sòl disponible"],
    allies: "Pacta amb Vox a diversos governs autonòmics i ajuntaments, i amb Coalición Canaria i UPN.",
    vs: "Competeix pel vot de centre amb el PSOE i pel de dreta amb Vox.",
  },
  psoe: {
    hist: "Fundat per Pablo Iglesias el 1879. Ha governat amb Felipe González (1982–1996), Zapatero (2004–2011) i Sánchez des del 2018.",
    gov: "Lidera el Govern d'Espanya (en coalició amb Sumar) i governa a Castella-la Manxa, Astúries i Navarra; a Catalunya governa el PSC amb Salvador Illa.",
    strong: "Andalusia, Catalunya (amb el PSC), Castella-la Manxa, Astúries, Navarra i Extremadura.",
    stars: ["Mantenir i ampliar els drets socials", "Més habitatge públic", "Impostos a banca i energètiques"],
    allies: "Governa en coalició amb Sumar i depèn de nacionalistes i independentistes (ERC, Junts, PNV, Bildu, BNG) per aprovar lleis.",
    vs: "Competeix amb el PP pel vot moderat i amb Sumar i Podemos pel vot d'esquerres.",
  },
  vox: {
    hist: "Fundat el 2013 per antics membres del PP. Va entrar al Parlament d'Andalusia el 2018 i al Congrés el 2019, on va ser tercera força.",
    gov: "Va governar en coalició amb el PP a diverses comunitats entre el 2023 i el 2024; actualment dona suport extern o negocia amb el PP governs i pressupostos.",
    strong: "Múrcia, València, Andalusia, Madrid, Ceuta i Melilla.",
    stars: ["Immigració irregular: expulsions i control de fronteres", "Recentralitzar competències", "Derogar lleis d'identitat de gènere i memòria democràtica"],
    allies: "Pacta amb el PP quan cal sumar majories; no pacta amb el PSOE ni amb els nacionalistes.",
    vs: "Competeix amb el PP pel vot conservador i amb SALF pel vot de protesta.",
  },
  fa: {
    hist: "Neix com a refundació de Sumar (2023) amb IU, Més Madrid, Catalunya en Comú i altres. Sumar va entrar al Govern en coalició amb el PSOE el 2023.",
    gov: "Va ser el soci minoritari del Govern d'Espanya (2023–); a les comunitats té una presència limitada.",
    strong: "Madrid, Catalunya, València, Balears i les grans ciutats.",
    stars: ["Reducció de la jornada laboral a 37,5 h", "Habitatge: topall al lloguer i més públic", "Transició ecològica i feminisme"],
    allies: "Aliat natural del PSOE; manté tensió amb Podemos i amb el sector més a l'esquerra.",
    vs: "Competeix amb el PSOE i Podemos pel vot d'esquerres i progressista.",
  },
  podemos: {
    hist: "Sorgit del 15-M el 2014. Va ser tercera força el 2015–2016 i va entrar al Govern amb el PSOE el 2020; avui és un partit més petit i crític.",
    gov: "No governa; va deixar el Govern d'Espanya l'any 2023 i s'ha desmarcat de Sumar.",
    strong: "Sobretot entre votants joves i urbans; presència limitada al territori.",
    stars: ["Nacionalitzar sectors estratègics", "Habitatge: topall de lloguers", "República i plurinacionalitat"],
    allies: "Dona suport puntual al PSOE però es distancia de Sumar i del Govern.",
    vs: "Competeix amb Sumar/FA pel vot d'esquerra alternativa.",
  },
  erc: {
    hist: "Fundada el 1931, va governar la Generalitat amb Companys; ha estat al centre de la política catalana des del 2003 i va presidir la Generalitat amb Aragonès (2021–2024).",
    gov: "Va ser al Govern de la Generalitat fins al 2024 i ara hi dona suport parlamentari al PSC de Salvador Illa; és clau a la governabilitat del Congrés.",
    strong: "Catalunya, especialment l'interior i la perifèria de Barcelona.",
    stars: ["Finançament singular per a Catalunya", "Traspàs de Rodalies i autogovern", "Llei d'amnistia"],
    allies: "Dona suport als governs del PSOE a canvi de concessions; competeix amb Junts i el PSC.",
    vs: "Competeix amb Junts pel vot independentista i amb el PSC pel d'esquerres.",
  },
  junts: {
    hist: "Neix el 2020 de la unió de Convergència (PDeCAT) i independents al voltant de Carles Puigdemont, que va presidir la Generalitat el 2016–2017.",
    gov: "Ha estat al Govern de la Generalitat fins al 2022 i ara és a l'oposició; al Congrés ha estat decisiu per aprovar o bloquejar lleis.",
    strong: "Catalunya, sobretot interior, Girona i zones rurals.",
    stars: ["Amnistia i retorn de Puigdemont", "Competències d'immigració i finançament propi", "Més català a l'Administració i a l'Estat"],
    allies: "No pacta amb Vox ni amb el PP; va facilitar la investidura de Sánchez el 2023 amb l'acord de l'amnistia.",
    vs: "Competeix amb ERC pel vot independentista i amb Aliança Catalana per la dreta sobiranista.",
  },
  bildu: {
    hist: "Coalició fundada el 2012 de l'esquerra independentista basca (Sortu, EA, Alternatiba, Aralar). Governa molts ajuntaments i és segona força al País Basc.",
    gov: "No governa al País Basc, però sí en molts ajuntaments; al Congrés dona suport selectiu al Govern del PSOE.",
    strong: "País Basc (Gipuzkoa), Navarra.",
    stars: ["Dret a decidir d'Euskal Herria", "Habitatge i salaris dignes", "Presos i memòria històrica"],
    allies: "Dona suport als governs d'esquerres al Congrés a canvi de mesures socials i de memòria.",
    vs: "Competeix amb el PNV pel vot nacionalista basc.",
  },
  pnv: {
    hist: "Fundat el 1895 per Sabino Arana. Ha governat Euskadi gairebé sempre des del 1980.",
    gov: "Governa el País Basc (en coalició amb el PSE) i té un gran pes a ajuntaments i diputacions forals.",
    strong: "Bizkaia, Àlaba i País Basc en general.",
    stars: ["Concert econòmic i autogovern", "Competències i traspassos pendents", "Estabilitat econòmica i industrial"],
    allies: "Soci habitual dels governs del PSOE i del PP segons l'època; va fer caure Rajoy el 2018.",
    vs: "Competeix amb EH Bildu pel vot nacionalista basc.",
  },
  bng: {
    hist: "Fundat el 1982. Va governar la Xunta amb el PSdeG (2005–2009) i és segona força al Parlament de Galícia amb Ana Pontón.",
    gov: "No governa la Xunta; sí governa ajuntaments. Té un diputat al Congrés.",
    strong: "Galícia, sobretot ciutats i zones rurals de l'interior.",
    stars: ["Un nou finançament i més competències per a Galícia", "Defensa de la llengua gallega", "Serveis públics a l'Espanya buidada"],
    allies: "Dona suport al PSOE en votacions clau; col·labora amb ERC, Bildu i altres forces perifèriques.",
    vs: "Competeix amb el PSdeG pel vot d'esquerres a Galícia.",
  },
  cc: {
    hist: "Fundada el 1993 com a federació de partits insulars. Governa Canàries des de fa dècades amb alguns parèntesis.",
    gov: "Governa Canàries en coalició amb el PP.",
    strong: "Illes Canàries.",
    stars: ["Agenda canària: règim especial i fons", "Immigració i menors no acompanyats", "Finançament i connectivitat de les illes"],
    allies: "Pacta alternativament amb el PSOE i el PP segons els interessos canaris.",
    vs: "Competeix amb el PSOE i el PP a les illes.",
  },
  salf: {
    hist: "Fundat el 2024 per Alvise Pérez després d'una candidatura sorprenent a les europees, on va obtenir 3 eurodiputats.",
    gov: "No governa cap institució.",
    strong: "Es mou sobretot per xarxes socials i entre votants joves.",
    stars: ["Reduir la «casta política»", "Menys impostos i menys burocràcia", "Transparència i mesures anticorrupció"],
    allies: "No té aliances estables; es presenta com a alternativa antisistema.",
    vs: "Competeix amb Vox i amb el PP pel vot de protesta.",
  },
};

const ARGS_EXTRA = {
  pp: {
    pen: "Garanteix les pensions i les revaloritza amb l'IPC; vol potenciar plans complementaris i deduccions per a l'estalvi privat.",
    serv: "Més col·laboració publicoprivada a la sanitat, reducció de llistes d'espera i llibertat d'elecció de centre; defensa l'educació concertada.",
    jus: "Reforma del Poder Judicial per despolititzar-lo, reincidència més dura, lluita contra l'ocupació il·legal i més efectius policials.",
    est: "Monarquia parlamentària i Constitució del 1978. Defensa la unitat d'Espanya i el bilingüisme: «llibertat lingüística» a les escoles.",
  },
  psoe: {
    pen: "Pensions revaloritzades amb l'IPC per llei i un Mecanisme d'Equitat Intergeneracional; no al retard de l'edat de jubilació.",
    serv: "Sanitat pública universal, reforç de l'atenció primària, més beques i educació pública gratuïta de 0 a 3 anys.",
    jus: "Renovació del CGPJ pactada amb el PP, reforma de la llei de seguretat ciutadana i memòria democràtica.",
    est: "Monarquia parlamentària i Estat de les autonomies amb horitzó federal. Defensa les llengües cooficials, també a la UE.",
  },
  vox: {
    pen: "Pensions contributives garantides amb l'IPC; vol limitar l'accés a ajudes a qui té nacionalitat o arrelament.",
    serv: "Llibertat educativa, «pin parental» i ensenyament en castellà a tot el territori; sanitat pública amb menys burocràcia.",
    jus: "Mà dura amb la delinqüència, expulsió d'estrangers condemnats, derogació de la llei de violència de gènere i il·legalització de partits que atemptin contra la unitat.",
    est: "Monarquia i unitat d'Espanya. Proposa recentralitzar competències i suprimir les autonomies; el castellà com a única llengua vehicular.",
  },
  fa: {
    pen: "Pensions dignes i actualitzades amb l'IPC; defensa un sistema públic i rebutja allargar l'edat de jubilació.",
    serv: "Reforçar la sanitat pública, gratuïtat de l'educació de 0 a 3 anys, salut mental i dental dins la cartera pública.",
    jus: "Democratitzar la justícia, abolir la «llei mordassa» i garantir els drets de les persones migrants.",
    est: "Estat plurinacional i plurilingüe; obert al debat sobre el model d'Estat i amb tradició republicana a part del seu espai.",
  },
  podemos: {
    pen: "Defensa un sistema públic de pensions amb actualització per l'IPC i pensions mínimes dignes; rebutja afavorir plans privats.",
    serv: "Sanitat 100 % pública, educació pública i gratuïta fins a la universitat i reversió de les privatitzacions.",
    jus: "Reforma democràtica del Poder Judicial, derogació de la llei mordassa i lluita contra la corrupció.",
    est: "República i Estat plurinacional; referèndum pactat a Catalunya. Defensa les llengües cooficials.",
  },
  erc: {
    pen: "Gestió pròpia de les polítiques socials; defensa un sistema de pensions públic i suficient.",
    serv: "Sanitat i educació en català amb competències plenes; inversió en atenció primària i salut mental.",
    jus: "Amnistia plena, desjudicialitzar el conflicte polític i fi de les causes de l'Estat contra càrrecs independentistes.",
    est: "República catalana. Defensa un referèndum d'autodeterminació pactat i el català com a llengua pròpia.",
  },
  junts: {
    pen: "Cotitzacions i pensions catalanes amb més gestió pròpia; contrari a augmentar la càrrega fiscal.",
    serv: "Competències plenes en sanitat, educació i seguretat social; escola en català.",
    jus: "Amnistia, retorn dels exiliats i aturar el que consideren judicialització política.",
    est: "Independència de Catalunya i reconeixement nacional; vol més competències en immigració i justícia.",
  },
  bildu: {
    pen: "Pensions mínimes dignes i competències pròpies en matèria de seguretat social.",
    serv: "Sanitat i educació públiques i en basc; contra la privatització i per ratis més baixos.",
    jus: "Fi de la dispersió de presos, memòria i reparació de víctimes, i derogació de la llei mordassa.",
    est: "Dret a decidir d'Euskal Herria i república; defensa l'euskera com a llengua pròpia.",
  },
  pnv: {
    pen: "Gestió pròpia de la Seguretat Social basca; manté les pensions amb l'IPC i la cohesió social.",
    serv: "Model basc de sanitat i educació pública d'alt nivell, amb gestió d'Osakidetza i foment de l'euskera.",
    jus: "Competències pròpies en justícia i seguretat; col·laboració amb l'Ertzaintza.",
    est: "Més autogovern, concert econòmic i reconeixement nacional; no és favorable a trencar la Constitució.",
  },
  bng: {
    pen: "Pensions públiques i dignes amb competències gallegues sobre la seguretat social.",
    serv: "Sanitat i educació públiques; més inversió en l'Espanya rural; el gallec com a llengua pròpia.",
    jus: "Garantir drets i repàs de les lleis repressives; justícia accessible en gallec.",
    est: "Dret a l'autodeterminació de Galícia i Estat plurinacional.",
  },
  cc: {
    pen: "Pensions adaptades al cost de vida de les illes i complements pel cost de la insularitat.",
    serv: "Inversió sanitària i educativa a Canàries, centres d'atenció i reducció de les llistes d'espera.",
    jus: "Seguretat marítima i de fronteres a les illes, i recursos per a la immigració.",
    est: "Més autogovern per a Canàries, l'Estatut d'insularitat i l'ultraperifèria reconeguda a la UE.",
  },
  salf: {
    pen: "Defensa mantenir les pensions i revisar el sistema per fer-lo sostenible; poc detallat al programa.",
    serv: "Menys burocràcia i reducció de «xiringuitos»; sanitat i educació sense propostes detallades.",
    jus: "Mesures anticorrupció, més transparència i sancions als polítics condemnats.",
    est: "Es presenta contrari a la «partitocràcia»; defensa menys càrrecs electes i menys autonomies.",
  },
};

Object.keys(ARGS_EXTRA).forEach((id) => { if (PARTY_ARGS[id]) Object.assign(PARTY_ARGS[id], ARGS_EXTRA[id]); });
