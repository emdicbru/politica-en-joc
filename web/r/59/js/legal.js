// Textos legals de Política en Joc: avís legal (LSSI-CE), política de privadesa (RGPD i LOPDGDD),
// política de galetes, condicions d'ús i crèdits.
const LEGAL = {
  nom: "Bruno Domingo Sola",
  nif: "", // opcional mentre el lloc web no tingui activitat econòmica; si s'omple, es mostra
  adreca: "", // opcional: adreça postal del titular
  correu: "brudomingosola@gmail.com",
  domini: "politicaenjoc.cat",
  actualitzat: "23 d'octubre de 2026",
};

const ANALYTICS_ON = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId);

const LEGAL_PAGES = [
  { k: "avis-legal", t: "Avís legal", h: "Avís legal" },
  { k: "privacitat", t: "Privadesa", h: "Política de privadesa" },
  { k: "cookies", t: "Galetes", h: "Política de galetes" },
  { k: "termes", t: "Condicions d'ús", h: "Condicions d'ús" },
  { k: "credits", t: "Crèdits", h: "Crèdits i fonts" },
];

const legalMail = () => `<a href="mailto:${LEGAL.correu}">${LEGAL.correu}</a>`;
const legalLink = (k) => { const p = LEGAL_PAGES.find((x) => x.k === k); return `<a href="#legal/${k}">${p.h}</a>`; };
const legalId = () => [
  `<li><b>Titular:</b> ${LEGAL.nom}</li>`,
  LEGAL.nif ? `<li><b>NIF:</b> ${LEGAL.nif}</li>` : "",
  LEGAL.adreca ? `<li><b>Domicili:</b> ${LEGAL.adreca}</li>` : "",
  `<li><b>Adreça electrònica:</b> ${legalMail()}</li>`,
  `<li><b>Lloc web:</b> ${LEGAL.domini}</li>`,
].join("");

const LEGAL_TEXT = {
  "avis-legal": () => `
    <h2>1. Dades identificatives</h2>
    <p>En compliment del deure d'informació previst a l'article 10 de la Llei 34/2002, d'11 de juliol, de serveis de la societat de la informació i de comerç electrònic (LSSI-CE), es fan constar les dades següents:</p>
    <ul>${legalId()}</ul>

    <h2>2. Objecte</h2>
    <p>Aquest avís legal regula l'accés i l'ús del lloc web Política en Joc (en endavant, el lloc web), un projecte divulgatiu i gratuït sobre les eleccions generals del 29 de novembre de 2026 que inclou jocs, continguts formatius i eines de consulta.</p>
    <p>L'accés al lloc web atribueix la condició de persona usuària i comporta l'acceptació d'aquest avís legal, de la ${legalLink("privacitat")}, de la ${legalLink("cookies")} i de les ${legalLink("termes")}.</p>

    <h2>3. Independència</h2>
    <p>El lloc web és un projecte independent. No té cap vinculació amb partits polítics, coalicions, candidatures, administracions públiques ni mitjans de comunicació, i no constitueix propaganda electoral. Les referències a formacions polítiques i a persones tenen una finalitat exclusivament informativa i educativa.</p>

    <h2>4. Exactitud de la informació</h2>
    <p>El titular vetlla per la correcció i l'actualització dels continguts, però no en garanteix l'exactitud ni l'exhaustivitat. La informació té caràcter orientatiu i no substitueix les fonts oficials, especialment el Butlletí Oficial de l'Estat, la Junta Electoral Central i el Ministeri de l'Interior. Les dades sobre candidatures i programes electorals poden variar fins a la proclamació oficial de les candidatures i durant la campanya.</p>

    <h2>5. Enquestes electorals</h2>
    <p>Les dades d'enquestes procedeixen de fonts de tercers, que s'indiquen en cada cas, i no constitueixen cap pronòstic. D'acord amb l'article 69.7 de la Llei orgànica 5/1985, de 19 de juny, del règim electoral general, el lloc web no publica ni difon enquestes electorals des del 24 de novembre de 2026 fins al tancament dels col·legis electorals el dia de la votació.</p>

    <h2>6. Propietat intel·lectual i industrial</h2>
    <p>Els continguts propis del lloc web (codi font, disseny, il·lustracions i textos) són titularitat de ${LEGAL.nom}, llevat que s'indiqui el contrari. Se'n prohibeix la reproducció, la distribució, la comunicació pública i la transformació amb finalitats comercials sense autorització prèvia i per escrit.</p>
    <p>Les marques, les denominacions i els logotips de tercers pertanyen als seus titulars respectius. Les fotografies, les tipografies i les dades de tercers s'utilitzen d'acord amb les llicències que s'indiquen a l'apartat ${legalLink("credits")}.</p>

    <h2>7. Enllaços a llocs de tercers</h2>
    <p>El lloc web conté enllaços a llocs web de tercers. El titular no és responsable dels seus continguts ni de les seves polítiques de privadesa. Els titulars de premsa de l'apartat Notícies pertanyen als mitjans de comunicació corresponents i enllacen a la publicació original.</p>
    ${COFFEE_URL ? `<p>L'enllaç «Convida'm a un cafè» porta a Ko-fi, una plataforma externa per fer aportacions voluntàries. Les aportacions són opcionals, no donen cap avantatge dins del joc i es gestionen íntegrament en aquella plataforma, d'acord amb les seves condicions i la seva política de privadesa.</p>` : ""}

    <h2>8. Responsabilitat</h2>
    <p>El titular no és responsable dels danys que es puguin derivar d'un ús indegut del lloc web, ni de les interrupcions, els errors tècnics o la manca de disponibilitat del servei. La persona usuària es compromet a fer un ús del lloc web conforme a la legislació vigent, a la bona fe i a aquest avís legal.</p>

    <h2>9. Comunicacions</h2>
    <p>Qualsevol comunicació relativa al lloc web, inclosa la notificació d'errors o de continguts presumptament il·lícits, es pot adreçar a ${legalMail()}.</p>

    <h2>10. Legislació aplicable i jurisdicció</h2>
    <p>Aquest avís legal es regeix per la legislació espanyola. Per a la resolució de qualsevol controvèrsia, quan la persona usuària tingui la condició de consumidora, seran competents els jutjats i tribunals del seu domicili.</p>`,

  privacitat: () => `
    <h2>1. Responsable del tractament</h2>
    <ul>${legalId()}</ul>
    <p>Aquesta política s'ajusta al Reglament (UE) 2016/679 del Parlament Europeu i del Consell, de 27 d'abril de 2016 (RGPD), i a la Llei orgànica 3/2018, de 5 de desembre, de protecció de dades personals i garantia dels drets digitals (LOPDGDD).</p>

    <h2>2. Dades personals tractades</h2>
    <p><b>a) Ús del lloc web sense compte.</b> Per jugar i consultar els continguts no cal registrar-se. En aquest cas no es recullen dades identificatives: el progrés del joc i les preferències es desen exclusivament al dispositiu de la persona usuària. El proveïdor d'allotjament tracta les dades tècniques necessàries per servir el lloc web, com ara l'adreça IP.</p>
    <p><b>b) Persones usuàries registrades amb un compte de Google.</b> Es tracten l'identificador d'usuari, el nom, l'adreça electrònica i la fotografia del compte de Google; el nom d'usuari i la foto de perfil que la persona usuària tria (una fotografia pròpia es redueix al dispositiu abans de desar-la), que són visibles per a la resta d'usuaris als rànquings i als duels; les dades de progrés en el joc (punts d'experiència, nivell, rècords i assoliments); els resultats del repte diari; la participació en duels, inclosos els missatges i les icones enviats, la pertinença a lligues i, si hi juga, els pronòstics i les fitxes de la Lliga de pronòstics.</p>
    <p><b>c) Notificacions.</b> Si una persona activa les notificacions, es desa l'adreça de subscripció que el navegador assigna al dispositiu per rebre-les (la proporciona el servei de notificacions del navegador: Google, Apple o Mozilla), els temes triats i el tipus de dispositiu. No s'associa al nom ni al compte. Es poden desactivar en qualsevol moment des de Perfil o des de la configuració del navegador, i aleshores l'identificador s'elimina.</p>
    <p><b>d) Estadística d'ús anònima.</b> L'app compta de manera agregada i anònima l'ús que se'n fa (visites per dia i per hora, seccions visitades, partides jugades, tipus de dispositiu i web d'origen per categories). No es recullen dades identificatives ni s'associa a cap compte. Es pot desactivar des de la Política de galetes.</p>
    <p><b>e) Monedes i botiga.</b> Si una persona amb compte compra articles de la botiga del joc, es desen al seu perfil els articles que té i els que porta posats; el marc i el títol són visibles als rànquings. Les monedes són una moneda fictícia del joc.</p>
    ${ANALYTICS_ON ? `<p><b>c) Dades d'analítica.</b> Únicament amb el consentiment previ de la persona usuària, es recullen dades d'ús agregades mitjançant Google Analytics: pàgines consultades, tipus de dispositiu i navegador, ubicació aproximada i durada de la visita.</p>` : ""}
    <p>No es tracten categories especials de dades ni es fan perfils amb finalitats publicitàries o decisions automatitzades.</p>

    <h2>3. Finalitats i base jurídica</h2>
    <div class="legal-table two">
      <div class="lt-row head"><b>Finalitat</b><b>Base jurídica</b></div>
      <div class="lt-row"><span>Gestió del compte i prestació del servei: desament del progrés, rànquings, duels i lligues.</span><span>Execució de les condicions d'ús acceptades per la persona usuària (art. 6.1.b RGPD).</span></div>
      <div class="lt-row"><span>Seguretat del servei i prevenció d'usos fraudulents.</span><span>Interès legítim del responsable (art. 6.1.f RGPD).</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><span>Elaboració d'estadístiques d'ús.</span><span>Consentiment de la persona usuària (art. 6.1.a RGPD), revocable en qualsevol moment.</span></div>` : ""}
      <div class="lt-row"><span>Atenció de consultes i de sol·licituds d'exercici de drets.</span><span>Compliment d'obligacions legals (art. 6.1.c RGPD).</span></div>
    </div>

    <h2>4. Destinataris</h2>
    <ul>
      <li>GitHub, Inc., com a proveïdor de l'allotjament dels fitxers de l'app (codi, imatges, tipografies i dades públiques com els titulars o els resultats), en qualitat d'encarregat del tractament. Només rep les dades tècniques necessàries per servir-los, com l'adreça IP.</li>
      <li>Google Ireland Limited i Google LLC, com a proveïdors dels serveis Firebase (autenticació, base de dades i allotjament)${ANALYTICS_ON ? " i Google Analytics" : ""}, en qualitat d'encarregats del tractament.</li>
      <li>GitHub, Inc., que allotja el fitxer públic de titulars de premsa. La seva consulta comporta la transmissió de l'adreça IP.</li>
      <li>Wikimedia Foundation, Inc., des d'on es carreguen les fotografies. La seva visualització comporta la transmissió de l'adreça IP.</li>
      <li>Els mitjans de comunicació El País i VilaWeb, els canals RSS dels quals es consulten directament des del navegador per mostrar titulars recents. Aquesta consulta comporta la transmissió de l'adreça IP.</li>
      <li>Altres persones usuàries registrades, que poden veure el nom, la fotografia de perfil, el nivell i els resultats en els rànquings, els duels i les lligues. L'adreça electrònica no es mostra en cap cas.</li>
    </ul>
    <p>Les dades no es cedeixen a tercers, llevat d'obligació legal.</p>

    <h2>5. Transferències internacionals</h2>
    <p>Alguns dels proveïdors esmentats poden tractar dades als Estats Units. Aquestes transferències s'emparen en el Marc de privadesa de dades UE-EUA o en les clàusules contractuals tipus aprovades per la Comissió Europea.</p>

    <h2>6. Termini de conservació</h2>
    <p>Les dades es conserven mentre el compte estigui actiu. Quan se suprimeix el compte, s'eliminen el perfil, els resultats del repte diari, els duels, la pertinença a lligues i els pronòstics, sens perjudici de les còpies de seguretat dels proveïdors, que s'eliminen d'acord amb els seus cicles de rotació.${ANALYTICS_ON ? " Les dades d'analítica es conserven durant el període configurat a Google Analytics, que no supera els catorze mesos." : ""}</p>

    <h2>7. Drets de les persones interessades</h2>
    <p>La persona interessada pot exercir els drets d'accés, rectificació, supressió, oposició, limitació del tractament i portabilitat, així com retirar el consentiment prestat, per mitjà de:</p>
    <ul>
      <li>les eines disponibles a la secció Perfil, que permeten descarregar una còpia de les dades i suprimir el compte;</li>
      <li>un escrit adreçat a ${legalMail()}, acompanyat d'un document que n'acrediti la identitat.</li>
    </ul>
    <p>Així mateix, pot presentar una reclamació davant l'<a href="https://www.aepd.es" target="_blank" rel="noopener">Agència Espanyola de Protecció de Dades</a>.</p>

    <h2>8. Menors d'edat</h2>
    <p>L'edat mínima per crear un compte és de catorze anys, d'acord amb l'article 7 de la LOPDGDD. Les persones menors de catorze anys poden utilitzar el lloc web sense registrar-se. Si es té coneixement que una persona menor de catorze anys ha creat un compte, aquest se suprimirà.</p>

    <h2>9. Mesures de seguretat</h2>
    <p>S'apliquen mesures tècniques i organitzatives adequades al risc, entre les quals la comunicació xifrada (HTTPS) i regles d'accés a la base de dades que limiten la lectura i la modificació de la informació.</p>

    <h2>10. Modificacions</h2>
    <p>Aquesta política es pot actualitzar per adaptar-la a canvis normatius o del servei. La data de l'última actualització figura a l'encapçalament.</p>`,

  cookies: () => `
    <h2>1. Què són les galetes</h2>
    <p>Les galetes (cookies) i les tecnologies similars, com l'emmagatzematge local del navegador, són fitxers o registres que es desen al dispositiu de la persona usuària quan visita un lloc web. Permeten, entre altres finalitats, mantenir la sessió, recordar preferències o obtenir informació estadística.</p>

    <h2>2. Galetes i tecnologies utilitzades</h2>
    <div class="legal-table">
      <div class="lt-row head"><b>Nom</b><b>Titular i tipus</b><b>Finalitat</b><b>Durada</b></div>
      <div class="lt-row"><code>r29n</code><span>Pròpia · tècnica</span><span>Desar el progrés del joc al dispositiu.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-sound</code><span>Pròpia · preferències</span><span>Recordar la preferència de so.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-user</code><span>Pròpia · tècnica</span><span>Mostrar l'estat de la sessió en carregar el lloc web.</span><span>Fins al tancament de la sessió</span></div>
      <div class="lt-row"><code>r29n-pacte</code><span>Pròpia · preferències</span><span>Recordar l'escenari del pactòmetre.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-sim-save</code><span>Pròpia · tècnica</span><span>Desar la partida en curs del simulador.</span><span>Fins que s'acaba la partida o s'elimina</span></div>
      <div class="lt-row"><code>r29n-onboard</code><span>Pròpia · preferències</span><span>Recordar que ja s'ha vist la presentació inicial de l'app.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-esp</code><span>Pròpia · funcional</span><span>Guardar la darrera configuració de l'especial del 29N (fase i participació) per mostrar-la de seguida.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-push</code><span>Pròpia · preferències</span><span>Recordar si has activat les notificacions i si has dit «Ara no» a la proposta d'activar-les.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-stats</code><span>Pròpia · estadística anònima</span><span>Guardar el dia de la primera i de l'última visita d'aquest dispositiu i els comptadors d'ús pendents d'enviar (vegeu el punt 3). No conté cap identificador.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-install</code><span>Pròpia · preferències</span><span>Recordar si ja has instal·lat l'app o si no vols que t'ho tornem a proposar.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>pej-v1</code><span>Pròpia · funcional</span><span>Memòria cau del service worker: còpia dels fitxers de l'app perquè carregui ràpid i funcioni sense connexió. No conté dades personals.</span><span>Fins a la propera versió</span></div>
      <div class="lt-row"><code>r29n-avis</code><span>Pròpia · funcional</span><span>Recordar que ja has vist l'avís de la Lliga de pronòstics, perquè no torni a sortir.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-porra</code><span>Pròpia · preferències</span><span>Guardar la teva porra d'escons per al 29N. Només es desa en aquest dispositiu i no es publica.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-cafe</code><span>Pròpia · preferències</span><span>Recordar quan s'ha mostrat per darrer cop la invitació a fer una aportació, perquè no aparegui més d'un cop cada cinc dies.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-news</code><span>Pròpia · preferències</span><span>Recordar els partits i temes que segueixes a Notícies, l'hora de la darrera visita (per marcar els titulars nous) i si ja has vist «El dia en 1 minut».</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-debat</code><span>Pròpia · preferències</span><span>Recordar el candidat i el partit que has creat al simulador de debat.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-sim-prefs</code><span>Pròpia · preferències</span><span>Recordar si ja s'ha vist el tutorial del simulador.</span><span>Fins que s'elimini</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>r29n-consent</code><span>Pròpia · tècnica</span><span>Desar les preferències sobre galetes.</span><span>12 mesos</span></div>` : ""}
      <div class="lt-row"><code>pendingDuel</code>, <code>pendingLeague</code><span>Pròpia · sessió</span><span>Conservar un enllaç d'invitació durant l'inici de sessió.</span><span>Fins al tancament de la pestanya</span></div>
      <div class="lt-row"><code>firebaseLocalStorageDb</code><span>Google (Firebase) · tècnica</span><span>Mantenir la sessió iniciada.</span><span>Fins al tancament de la sessió</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>_ga</code><span>Google · analítica</span><span>Distingir visitants amb finalitats estadístiques.</span><span>2 anys</span></div>
      <div class="lt-row"><code>_ga_&lt;ID&gt;</code><span>Google · analítica</span><span>Mantenir l'estat de la sessió d'analítica.</span><span>2 anys</span></div>
      <div class="lt-row"><code>firebase_installations</code><span>Google (Firebase) · analítica</span><span>Identificador d'instal·lació associat a l'analítica.</span><span>Fins que s'elimini</span></div>` : ""}
    </div>
    <p>El lloc web no utilitza galetes publicitàries. Les tipografies s'allotgen al mateix servidor, de manera que la seva càrrega no implica cap connexió amb tercers.</p>

    <h2>3. Base jurídica</h2>
    <p>Les galetes tècniques i de preferències són necessàries per prestar el servei sol·licitat i estan exemptes del deure d'obtenir consentiment, d'acord amb l'article 22.2 de la LSSI-CE.${ANALYTICS_ON ? " Les galetes d'analítica només s'instal·len amb el consentiment previ de la persona usuària." : ""}</p>
    <p><b>Estadística anònima pròpia.</b> Per saber quines parts de l'app s'utilitzen i millorar-les, cada visita suma 1 a uns comptadors agregats per dia (per exemple, «partides de l'Endevina l'any» o «visites des d'un mòbil Android»). No s'utilitza cap galeta ni identificador, no es desa cap adreça IP ni cap dada que permeti saber qui és ningú, i no hi intervé cap tercer: els comptadors es desen a la base de dades del mateix servei. Si no vols que les teves visites comptin, pots desactivar-ho: <button class="linklike" type="button" data-stats-toggle>${typeof Stats !== "undefined" && Stats.off() ? "Torna a comptar les meves visites" : "No comptis les meves visites"}</button>.</p>

    ${ANALYTICS_ON ? `<h2>4. Gestió del consentiment</h2>
    <p>En el primer accés es mostra un avís que permet acceptar, rebutjar o configurar les galetes d'analítica. Rebutjar-les no limita cap funcionalitat del lloc web. L'elecció es conserva durant dotze mesos i es pot modificar en qualsevol moment des de l'enllaç <button class="linklike" data-open-consent>Configuració de galetes</button>, disponible també al peu de pàgina.</p>` : ""}

    <h2>${ANALYTICS_ON ? "5" : "4"}. Eliminació des del navegador</h2>
    <p>Les galetes i les dades emmagatzemades es poden eliminar des de la configuració del navegador. Les instruccions dels navegadors principals es poden consultar als enllaços següents: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a>, <a href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener">Mozilla Firefox</a>, <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">Safari</a> i <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a>. El progrés del joc també es pot esborrar des de la secció Perfil.</p>

    <h2>${ANALYTICS_ON ? "6" : "5"}. Galetes de tercers en l'inici de sessió</h2>
    <p>L'inici de sessió amb Google es fa en una finestra del mateix proveïdor, que pot instal·lar galetes pròpies d'acord amb la seva <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">política de galetes</a>. Els enllaços a mitjans de comunicació condueixen a llocs web amb polítiques de galetes pròpies.</p>`,

  termes: () => `
    <h2>1. Objecte i acceptació</h2>
    <p>Aquestes condicions regulen l'ús del lloc web Política en Joc i dels serveis associats. L'ús del lloc web o la creació d'un compte comporten l'acceptació d'aquestes condicions, de l'${legalLink("avis-legal")} i de la ${legalLink("privacitat")}.</p>

    <h2>2. Descripció del servei</h2>
    <p>El lloc web ofereix de manera gratuïta jocs, continguts formatius i eines de consulta sobre el sistema polític i les eleccions generals. Els rànquings, els nivells i les lligues tenen una finalitat exclusivament lúdica i no comporten cap premi ni contraprestació.</p>

    <h2>3. Registre i compte</h2>
    <p>Algunes funcionalitats, com el desament del progrés en línia, els rànquings, els duels i les lligues, requereixen iniciar sessió amb un compte de Google. Per crear un compte cal tenir almenys catorze anys. La persona usuària és responsable de l'ús que es faci del seu compte i el pot suprimir en qualsevol moment des de la secció Perfil.</p>
    <p>Les monedes que es guanyen jugant i els articles de la botiga són igualment ficticis: no es poden comprar amb diners ni bescanviar, i les monedes que s'afegeixen a la Lliga de pronòstics es converteixen en fitxes.</p>
    <p>Les fitxes de la Lliga de pronòstics són una moneda fictícia del joc: no es poden comprar ni vendre, no tenen cap valor econòmic i no es poden bescanviar per diners, béns ni serveis. No es tracta de cap joc amb premi ni d'apostes amb contraprestació.</p>

    <h2>4. Normes de conducta</h2>
    <p>Es prohibeix, en particular:</p>
    <ul>
      <li>fer servir un nom d'usuari o una foto de perfil ofensius, que suplantin altres persones o que vulnerin drets de tercers (es poden retirar sense avís previ);</li>
      <li>publicar missatges injuriosos, amenaçadors, discriminatoris o que incitin a l'odi o a la violència;</li>
      <li>difondre continguts il·lícits, sexuals o que vulnerin drets de tercers;</li>
      <li>enviar publicitat o comunicacions no sol·licitades;</li>
      <li>compartir dades personals pròpies o de tercers;</li>
      <li>suplantar la identitat d'altres persones;</li>
      <li>manipular puntuacions, temps o resultats, o alterar el funcionament del servei;</li>
      <li>accedir o intentar accedir a dades d'altres persones usuàries.</li>
    </ul>

    <h2>5. Continguts de les persones usuàries</h2>
    <p>Les persones usuàries conserven la titularitat dels missatges que envien i concedeixen una llicència gratuïta, no exclusiva i limitada a la prestació del servei per emmagatzemar-los i mostrar-los a les persones amb qui interactuen. Cada persona usuària és responsable dels continguts que publica.</p>

    <h2>6. Suspensió i cancel·lació</h2>
    <p>El titular pot retirar continguts i suspendre o cancel·lar comptes que incompleixin aquestes condicions o la legislació vigent.</p>

    <h2>7. Propietat intel·lectual</h2>
    <p>Els drets sobre el codi font, el disseny i els continguts propis del lloc web corresponen al titular. Els continguts de tercers s'utilitzen d'acord amb les llicències que s'indiquen a l'apartat ${legalLink("credits")}.</p>

    <h2>8. Disponibilitat i modificacions</h2>
    <p>El titular pot modificar, suspendre o retirar funcionalitats, reiniciar rànquings o eliminar continguts per motius tècnics, de seguretat o d'organització del servei, en particular un cop finalitzat el procés electoral.</p>

    <h2>9. Limitació de responsabilitat</h2>
    <p>El servei es presta en l'estat en què es troba en cada moment. En la mesura que ho permeti la legislació aplicable, el titular no respon de la pèrdua de dades de joc, de les interrupcions del servei ni dels errors informatius. Aquesta limitació no afecta els drets que la normativa de consumidors i usuaris reconeix amb caràcter irrenunciable.</p>

    <h2>10. Contacte</h2>
    <p>Les consultes, les notificacions de continguts presumptament il·lícits i les sol·licituds relatives a aquestes condicions es poden adreçar a ${legalMail()}.</p>

    <h2>11. Legislació aplicable i jurisdicció</h2>
    <p>Aquestes condicions es regeixen per la legislació espanyola. Quan la persona usuària tingui la condició de consumidora, seran competents els jutjats i tribunals del seu domicili.</p>`,

  credits: () => {
    const photos = Object.entries(typeof PHOTOS !== "undefined" ? PHOTOS : {}).sort((a, b) => a[0].localeCompare(b[0], "ca"));
    return `
    <h2>1. Fotografies</h2>
    <p>Les fotografies de persones procedeixen de Wikimedia Commons i s'utilitzen d'acord amb les llicències que s'indiquen. Els drets corresponen als seus autors. Les sol·licituds de retirada es poden adreçar a ${legalMail()}.</p>
    <div class="legal-table credits">
      <div class="lt-row head"><b>Persona</b><b>Autoria</b><b>Llicència</b><b>Origen</b></div>
      ${photos.map(([name, p]) => `<div class="lt-row"><span>${esc(name)}</span><span>${esc(p.author || "—")}</span><span>${esc(p.license || "—")}</span><span><a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></span></div>`).join("")}
    </div>

    <h2>2. Dades i continguts</h2>
    <ul>
      <li>Candidatures, partits i enquestes: <a href="https://es.wikipedia.org/wiki/Elecciones_generales_de_Espa%C3%B1a_de_2026" target="_blank" rel="noopener">Viquipèdia</a> i el seu <a href="${typeof POLL_SOURCE === "string" ? POLL_SOURCE : "https://en.wikipedia.org"}" target="_blank" rel="noopener">recull d'enquestes</a>, sota la llicència <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ca" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Les xifres s'han adaptat mitjançant mitjanes i ajustos.</li>
      <li>Resultats electorals i procediment electoral: Ministeri de l'Interior, Junta Electoral Central, Congrés dels Diputats i Butlletí Oficial de l'Estat.</li>
      <li>Població per províncies: Institut Nacional d'Estadística.</li>
      <li>Propostes dels partits: elaboració pròpia a partir dels programes electorals i de posicions públiques. No es tracta de textos oficials de les formacions.</li>
      <li>Cites: declaracions públiques atribuïdes a dirigents polítics, amb indicació de l'any i el context, amb finalitat divulgativa.</li>
      <li>Titulars de premsa: pertanyen als mitjans respectius (El País, El Mundo, ABC, 20minutos, eldiario.es, infoLibre, El Español, El Debate, La Vanguardia, Europa Press, Ara, NacióDigital i VilaWeb). Només se'n mostren el titular i l'enllaç.</li>
    </ul>

    <h2>3. Tipografies i tecnologia</h2>
    <ul>
      <li>Tipografies Unbounded i DM Sans, sota la llicència <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License 1.1</a>.</li>
      <li>Plató en 3D del simulador de debat: <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a>, sota la llicència MIT.</li>
      <li>Mapa de circumscripcions del simulador: elaborat a partir de les dades cartogràfiques de <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>, de domini públic.</li>
      <li>Autenticació, base de dades i allotjament: <a href="https://firebase.google.com" target="_blank" rel="noopener">Google Firebase</a>.</li>
      <li>Actualització automàtica de titulars: GitHub Actions.</li>
    </ul>`;
  },
};

// Ko-fi: només un enllaç (sense el seu widget, que carregaria codi i galetes de tercers).
// Si COFFEE_URL és buit, no es mostra enlloc.
const COFFEE_URL = "https://ko-fi.com/politicaenjoc";
const COFFEE_KEY = "r29n-cafe";
function coffeeLink(text = "Convida'm a un cafè", cls = "") {
  return COFFEE_URL ? `<a class="coffee-link ${cls}" href="${COFFEE_URL}" target="_blank" rel="noopener">☕ ${text}</a>` : "";
}
// Línia discreta al resultat d'una partida: només si ha anat bé i, com a molt, un cop cada 5 dies
function coffeeResultNote(good) {
  if (!COFFEE_URL || !good) return "";
  const last = store.get(COFFEE_KEY, 0);
  if (Date.now() - last < 5 * 864e5) return "";
  store.set(COFFEE_KEY, Date.now());
  return `<p class="coffee-note">Política en Joc és gratuïta i sense anuncis. Si t'ho has passat bé, ${coffeeLink("convida'm a un cafè")}.</p>`;
}

function legalFooter() {
  return `<footer class="site-foot">
    <p class="sf-line">Web no oficial. No té cap vincle amb partits, institucions ni mitjans de comunicació.</p>
    ${COFFEE_URL ? `<p class="sf-line sf-coffee">Gratuïta i sense anuncis. Si t'agrada, ${coffeeLink("convida'm a un cafè")}.</p>` : ""}
    <p class="sf-line sf-author">Feta per <a href="https://www.instagram.com/emdicbru_/" target="_blank" rel="noopener">@emdicbru_</a> a Instagram i <a href="https://x.com/emdicbru" target="_blank" rel="noopener">@emdicbru</a> a X.</p>
    <nav aria-label="Informació legal">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}">${p.h}</a>`).join("")}${ANALYTICS_ON ? `<button class="linklike" data-open-consent>Configuració de galetes</button>` : ""}</nav>
    <p class="sf-copy">© 2026 ${LEGAL.nom}</p>
  </footer>`;
}

function legalNote() {
  return `<p class="legal-note">L'inici de sessió implica l'acceptació de les ${legalLink("termes")} i de la ${legalLink("privacitat")}, i la declaració de tenir almenys 14 anys.</p>`;
}

function renderLegal(slug) {
  const root = $("#legal-root");
  if (!root) return;
  const page = LEGAL_PAGES.find((p) => p.k === slug) || LEGAL_PAGES[0];
  root.innerHTML = `
    <nav class="legal-tabs" aria-label="Pàgines legals">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}" class="${p.k === page.k ? "on" : ""}">${p.t}</a>`).join("")}</nav>
    <article class="card legal">
      <p class="kicker">Última actualització: ${LEGAL.actualitzat}</p>
      <h1 class="page-title">${page.h}</h1>
      ${LEGAL_TEXT[page.k]()}
    </article>`;
}

document.getElementById("main")?.insertAdjacentHTML("afterend", legalFooter());
