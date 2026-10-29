// Textos legals de Política en Joc: avís legal (LSSI-CE), política de privadesa (RGPD i LOPDGDD),
// política de galetes, condicions d'ús i crèdits.
const LEGAL = {
  nom: "Bruno Domingo Sola",
  nif: "", // opcional mentre el lloc web no tingui activitat econòmica; si s'omple, es mostra
  adreca: "", // opcional: adreça postal del titular
  correu: "brudomingosola@gmail.com",
  domini: "politicaenjoc.cat",
  actualitzat: "29 d'octubre de 2026",
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
    <p>Els simuladors (campanya, debat i legislatura), els jocs i els seus resultats són ficció amb finalitat educativa: no són pronòstics ni sondejos, i no reflecteixen la intenció de vot real. El comportament que s'atribueix als partits reals dins dels simuladors és una simplificació a partir de les seves posicions públiques i no representa cap declaració de les formacions. Els candidats, partits i declaracions creats per les persones usuàries són ficticis.</p>

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
    <p><b>b) Persones usuàries registrades amb un compte de Google.</b> Es tracten l'identificador d'usuari, el nom, l'adreça electrònica i la fotografia del compte de Google; el nom d'usuari i la foto de perfil que la persona usuària tria (una fotografia pròpia es redueix al dispositiu abans de desar-la), que són visibles per a la resta d'usuaris als rànquings i als duels; les dades de progrés en el joc (punts d'experiència, nivell, rècords, assoliments i l'activitat de cada dia dels darrers 60 dies: partides i punts); els resultats del repte diari; la participació en duels, inclosos els missatges i les icones enviats; les amistats amb altres persones usuàries i els missatges del xat privat entre amics, que només poden llegir les dues persones; la participació en campanyes i debats contra amics del simulador (el partit o el candidat creat, les decisions de joc i els missatges del xat de la partida, amb les reaccions) i en trucades i videotrucades entre amics (la veu i la imatge van directament entre els dispositius de les persones que hi participen i no es graven ni s'emmagatzemen; per establir la connexió es desen temporalment dades tècniques, com ara l'adreça IP del dispositiu, que s'esborren en penjar); si s'activen les notificacions, l'adreça de notificacions del dispositiu, lligada a l'usuari per rebre els avisos de missatges i trucades dels amics; la pertinença a lligues i, si hi juga, els pronòstics i les fitxes de la Lliga de pronòstics.</p>
    <p><b>Confidencialitat dels missatges.</b> Els xats privats, els de les partides i les trucades són comunicacions entre les persones que hi participen. L'equip de Política en Joc no els llegeix ni els analitza; només veu el missatge concret que algú denuncia (apartat g).</p>
    <p><b>c) Notificacions.</b> Si una persona activa les notificacions, es desa l'adreça de subscripció que el navegador assigna al dispositiu per rebre-les (la proporciona el servei de notificacions del navegador: Google, Apple o Mozilla), els temes triats i el tipus de dispositiu. Si la persona té la sessió iniciada, aquesta adreça s'associa al seu identificador d'usuari perquè hi arribin els avisos dels missatges i les trucades dels seus amics; el text de l'avís (el nom de qui escriu i el començament del missatge) s'envia xifrat i no es desa. Per decidir si un avís t'arriba es pot tenir en compte, si el dispositiu està lligat al compte, si ja has fet el repte d'avui, la teva ratxa i quan vas entrar per darrer cop (per exemple, el recordatori del repte no s'envia a qui ja l'ha fet). Es poden desactivar en qualsevol moment des de Perfil o des de la configuració del navegador, i aleshores l'adreça s'elimina.</p>
    <p><b>d) Estadística d'ús anònima.</b> L'app compta de manera agregada i anònima l'ús que se'n fa (sessions per dia i per hora, seccions visitades, partides jugades, tipus de dispositiu i web d'origen per categories). També el temps actiu per secció i fins on arriba la gent en alguns recorreguts. No es recullen dades identificatives i no s'associa a cap compte. Només amb el consentiment de l'avís de galetes es desa al dispositiu el dia de la primera i l'última visita (per saber si és nou o torna). Es pot desactivar des de la Política de galetes.</p>
    <p><b>e) Monedes i botiga.</b> Si una persona amb compte compra articles de la botiga del joc, es desen al seu perfil els articles que té i els que porta posats; el marc i el títol són visibles als rànquings. Les monedes són una moneda fictícia del joc.</p>
    <p><b>f) Avisos d'error.</b> Si una persona avisa d'un error, es desa el text que escriu, el correu electrònic si l'indica voluntàriament (per poder-li respondre), la secció de l'app on era, el tipus de dispositiu i navegador, la mida de la pantalla, la versió de l'app, l'últim error tècnic de la pàgina i, si té sessió iniciada, el seu identificador d'usuari. Només ho veu l'equip de l'app, s'utilitza exclusivament per corregir l'error i respondre-li, i s'esborra quan ja no és necessari i com a molt al cap de dotze mesos.</p>
    <p><b>g) Denúncies de missatges.</b> Si una persona denuncia un missatge (botó ⚑ o menú del missatge), es desa el text del missatge denunciat, el nom d'usuari i l'identificador de qui l'ha escrit, la secció on era, les dades tècniques de l'apartat f i, si té sessió iniciada, l'identificador de qui el denuncia. Només ho veu l'equip de l'app per revisar-lo i, si escau, retirar continguts o suspendre comptes (vegeu les ${legalLink("termes")}). Es conserva el temps necessari per resoldre la denúncia i com a molt dotze mesos.</p>
    <p><b>h) Vídeos d'anunciants (opcional).</b> Quan el repte diari ofereix una partida extra a canvi de veure un vídeo, si una persona prem «Mira el vídeo» per jugar una tercera partida del repte diari, es carrega el servei d'anuncis de Google (AdSense) i es mostra un vídeo d'un anunciant. Abans, Google demana el consentiment per a les galetes i, si es denega, mostra anuncis no personalitzats. Google tracta l'adreça IP, identificadors del dispositiu i del navegador i, amb consentiment, dades per personalitzar els anuncis, com a responsable independent d'acord amb la seva <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">política de privadesa</a>. Si no es demana el vídeo, no es carrega res de Google Ads.</p>
    <p><b>i) Contactes de premsa.</b> Per enviar les notes de premsa de Política en Joc, es tracten el nom, el mitjà, l'adreça electrònica professional i les etiquetes temàtiques de periodistes i mitjans de comunicació, obtingudes de fonts públiques professionals o facilitades per les mateixes persones. Només hi accedeix l'equip de l'app. Cada correu inclou un enllaç per deixar de rebre'n, i també es pot demanar per escrit.</p>
    ${ANALYTICS_ON ? `<p><b>j) Dades d'analítica.</b> Únicament amb el consentiment previ de la persona usuària, es recullen dades d'ús agregades mitjançant Google Analytics: pàgines consultades, tipus de dispositiu i navegador, ubicació aproximada i durada de la visita.</p>` : ""}
    <p>No es tracten categories especials de dades ni es fan perfils amb finalitats publicitàries o decisions automatitzades.</p>

    <h2>3. Finalitats i base jurídica</h2>
    <div class="legal-table two">
      <div class="lt-row head"><b>Finalitat</b><b>Base jurídica</b></div>
      <div class="lt-row"><span>Gestió del compte i prestació del servei: desament del progrés, rànquings, duels, campanyes contra amics i lligues.</span><span>Execució de les condicions d'ús acceptades per la persona usuària (art. 6.1.b RGPD).</span></div>
      <div class="lt-row"><span>Amistats, xats, trucades i avisos de missatges i trucades entre amics.</span><span>Execució de les condicions d'ús, a petició de la persona usuària (art. 6.1.b RGPD).</span></div>
      <div class="lt-row"><span>Revisió de denúncies, moderació de continguts i protecció de les persones usuàries, especialment les menors.</span><span>Compliment d'obligacions legals (art. 6.1.c RGPD, en relació amb el Reglament (UE) 2022/2065 de serveis digitals) i interès legítim (art. 6.1.f RGPD).</span></div>
      <div class="lt-row"><span>Mostrar un vídeo d'un anunciant quan la persona el demana per jugar una partida extra.</span><span>Consentiment de la persona usuària (art. 6.1.a RGPD), que el demana el missatge de Google abans del vídeo i es pot retirar en qualsevol moment.</span></div>
      <div class="lt-row"><span>Enviament de notes de premsa a periodistes i mitjans de comunicació.</span><span>Interès legítim del responsable en la difusió del projecte entre professionals de la informació (art. 6.1.f RGPD), amb dret d'oposició en qualsevol moment.</span></div>
      <div class="lt-row"><span>Seguretat del servei i prevenció d'usos fraudulents.</span><span>Interès legítim del responsable (art. 6.1.f RGPD).</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><span>Elaboració d'estadístiques d'ús.</span><span>Consentiment de la persona usuària (art. 6.1.a RGPD), revocable en qualsevol moment.</span></div>` : ""}
      <div class="lt-row"><span>Atenció de consultes i de sol·licituds d'exercici de drets.</span><span>Compliment d'obligacions legals (art. 6.1.c RGPD).</span></div>
    </div>

    <h2>4. Destinataris</h2>
    <ul>
      <li>GitHub, Inc., com a proveïdor de l'allotjament dels fitxers de l'app (codi, imatges, tipografies i dades públiques com els titulars o els resultats), en qualitat d'encarregat del tractament. Només rep les dades tècniques necessàries per servir-los, com l'adreça IP.</li>
      <li>Google Ireland Limited i Google LLC, com a proveïdors dels serveis Firebase (autenticació, base de dades i allotjament)${ANALYTICS_ON ? " i Google Analytics" : ""}, en qualitat d'encarregats del tractament.</li>
      <li>Google Ireland Limited (AdSense), que serveix els vídeos d'anunciants només quan es demanen, com a responsable independent per als anuncis.</li>
      <li>Sendinblue SAS (Brevo), amb seu a França, com a proveïdor de l'enviament dels correus de les notes de premsa, en qualitat d'encarregat del tractament.</li>
      <li>GitHub, Inc., que allotja el fitxer públic de titulars de premsa. La seva consulta comporta la transmissió de l'adreça IP.</li>
      <li>Wikimedia Foundation, Inc., des d'on es carreguen les fotografies. La seva visualització comporta la transmissió de l'adreça IP.</li>
      <li>Els mitjans de comunicació El País i VilaWeb, els canals RSS dels quals es consulten directament des del navegador per mostrar titulars recents. Aquesta consulta comporta la transmissió de l'adreça IP.</li>
      <li>Google LLC, els servidors STUN públics de la qual s'utilitzen per establir les trucades entre amics. Aquesta consulta comporta la transmissió de l'adreça IP. Les persones que participen en una trucada reben també l'adreça IP dels altres dispositius, necessària per a la connexió directa.</li>
      <li>Cloudflare, Inc., que allotja el servei que envia els avisos de missatges i trucades entre amics, en qualitat d'encarregat del tractament. Rep l'identificador i el nom d'usuari de qui escriu o truca, el text curt de l'avís i l'adreça IP. Els avisos viatgen xifrats fins al dispositiu a través del servei de notificacions del navegador (Google, Apple o Mozilla), que no en pot llegir el contingut.</li>
      <li>Altres persones usuàries registrades, que poden veure el nom, la fotografia de perfil, el nivell i els resultats en els rànquings, els duels, les campanyes contra amics i les lligues. L'adreça electrònica no es mostra en cap cas.</li>
    </ul>
    <p>Les dades no es cedeixen a tercers, llevat d'obligació legal.</p>

    <h2>5. Transferències internacionals</h2>
    <p>Alguns dels proveïdors esmentats poden tractar dades als Estats Units. Aquestes transferències s'emparen en el Marc de privadesa de dades UE-EUA o en les clàusules contractuals tipus aprovades per la Comissió Europea.</p>

    <h2>6. Termini de conservació</h2>
    <p>Les dades dels contactes de premsa es conserven mentre siguin útils per a la difusió del projecte i fins que la persona s'oposi a rebre més comunicacions; en aquest cas, se'n conserva només l'adreça marcada com a baixa per no tornar-li a escriure. Les dades es conserven mentre el compte estigui actiu. Els missatges del xat privat es conserven mentre dura l'amistat (en deixar de ser amics s'esborra tot el xat) i cada persona pot esborrar els seus; els xats de les campanyes i els debats, mentre existeix la sala; les dades tècniques de les trucades s'esborren en penjar; les adreces de notificacions, fins que es desactiven o el servei del navegador les dona per caducades. Quan se suprimeix el compte, s'eliminen el perfil, els resultats del repte diari, els duels, les amistats i els xats privats, la participació en campanyes contra amics, la pertinença a lligues i els pronòstics, sens perjudici de les còpies de seguretat dels proveïdors, que s'eliminen d'acord amb els seus cicles de rotació.${ANALYTICS_ON ? " Les dades d'analítica es conserven durant el període configurat a Google Analytics, que no supera els catorze mesos." : ""}</p>

    <h2>7. Drets de les persones interessades</h2>
    <p>La persona interessada pot exercir els drets d'accés, rectificació, supressió, oposició, limitació del tractament i portabilitat, així com retirar el consentiment prestat, per mitjà de:</p>
    <ul>
      <li>les eines disponibles a la secció Perfil, que permeten descarregar una còpia de les dades i suprimir el compte;</li>
      <li>un escrit adreçat a ${legalMail()}, acompanyat d'un document que n'acrediti la identitat.</li>
    </ul>
    <p>Així mateix, pot presentar una reclamació davant l'<a href="https://www.aepd.es" target="_blank" rel="noopener">Agència Espanyola de Protecció de Dades</a>.</p>

    <h2>8. Menors d'edat</h2>
    <p>L'edat mínima per crear un compte és de catorze anys, d'acord amb l'article 7 de la LOPDGDD. Les persones menors de catorze anys poden utilitzar el lloc web sense registrar-se. Si es té coneixement que una persona menor de catorze anys ha creat un compte, aquest se suprimirà. Els xats i les trucades només són possibles entre persones que s'han acceptat mútuament com a amigues, i qualsevol persona pot deixar de ser amiga d'una altra i denunciar-ne els missatges. Es recomana a les persones menors que només acceptin com a amics persones que coneguin.</p>

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
      <div class="lt-row"><code>r29n-sim-save</code>, <code>r29n-sim-save-es</code><span>Pròpia · tècnica</span><span>Desar la partida en curs del simulador.</span><span>Fins que s'acaba la partida o s'elimina</span></div>
      <div class="lt-row"><code>r29n-onboard</code><span>Pròpia · preferències</span><span>Recordar que ja s'ha vist la presentació inicial de l'app.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-esp</code><span>Pròpia · funcional</span><span>Guardar la darrera configuració de l'especial del 29N (fase i participació) per mostrar-la de seguida.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-push</code><span>Pròpia · preferències</span><span>Recordar si has activat les notificacions i si has dit «Ara no» a la proposta d'activar-les.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-stats</code><span>Pròpia · estadística (només amb consentiment)</span><span>Si acceptes l'estadística d'ús: el dia de la primera i de l'última visita d'aquest dispositiu i quants dies diferents hi has entrat, per saber si és nou, si torna i cada quan. No conté cap identificador. Sense consentiment, només la tria de no comptar les teves visites, si la fas.</span><span>Fins que retiris el consentiment o s'elimini</span></div>
      <div class="lt-row"><code>r29n-install</code><span>Pròpia · preferències</span><span>Recordar si ja has instal·lat l'app, si has dit «Ara no» a la proposta d'instal·lar-la i quantes vegades l'has oberta, perquè no se't proposi la primera vegada ni més d'un cop al dia.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-ses</code><span>Pròpia · sessió</span><span>Saber que l'app ja s'ha obert en aquesta pestanya (per al comptador de la fila anterior).</span><span>Fins al tancament de la pestanya</span></div>
      <div class="lt-row"><code>r29n-lang</code><span>Pròpia · preferències</span><span>Recordar l'idioma que has triat (català o castellà).</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-apren</code><span>Pròpia · tècnica</span><span>Desar el teu avenç a l'apartat Aprèn (capítols llegits i ruta).</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-nit</code><span>Pròpia · preferències</span><span>Guardar les teves prediccions per a la nit electoral. Només es desen en aquest dispositiu.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-dhard-&lt;dia&gt;</code><span>Pròpia · sessió</span><span>Guardar uns minuts quina és la prova més fallada del repte diari, per no tornar-la a demanar al servidor.</span><span>10 minuts, i en tancar la pestanya</span></div>
      <div class="lt-row"><code>r29n-sim-amics-&lt;id&gt;</code><span>Pròpia · tècnica</span><span>Desar el dia de campanya que estàs jugant contra els teus amics, per no perdre'l si recarregues.</span><span>Fins que s'acaba la partida</span></div>
      <div class="lt-row"><code>r29n-ami-notif-no</code><span>Pròpia · preferències</span><span>Recordar que has dit «Ara no» a l'avís d'activar les notificacions de la pestanya Amics.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-feat-preview</code>, <code>r29n-esp-preview</code>, <code>r29n-lab-amics</code>, <code>r29n-gh</code><span>Pròpia · tècnica</span><span>Només per a l'equip de l'app: proves del Laboratori i eines del Centre de control.</span><span>Fins al tancament de la pestanya o fins que s'elimini</span></div>
      <div class="lt-row"><code>pej-v1</code><span>Pròpia · funcional</span><span>Memòria cau del service worker: còpia dels fitxers de l'app perquè carregui ràpid i funcioni sense connexió. No conté dades personals.</span><span>Fins a la propera versió</span></div>
      <div class="lt-row"><code>r29n-avis</code><span>Pròpia · funcional</span><span>Recordar que ja has vist l'avís de la Lliga de pronòstics, perquè no torni a sortir.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-novetats</code><span>Pròpia · funcional</span><span>Recordar que ja has vist l'avís de novetats de l'app, perquè no torni a sortir.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-porra</code><span>Pròpia · preferències</span><span>Guardar la teva porra d'escons per al 29N. Només es desa en aquest dispositiu i no es publica.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-cafe</code><span>Pròpia · preferències</span><span>Recordar quan s'ha mostrat per darrer cop la invitació a fer una aportació, perquè no aparegui més d'un cop cada cinc dies.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-news</code><span>Pròpia · preferències</span><span>Recordar els partits i temes que segueixes a Notícies, l'hora de la darrera visita (per marcar els titulars nous) i si ja has vist «El dia en 1 minut».</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-debat</code><span>Pròpia · preferències</span><span>Recordar el candidat i el partit que has creat al simulador de debat.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-diari-intents</code><span>Pròpia · funcional</span><span>Comptar les partides del repte diari que has jugat avui (per donar-te proves noves i, si escau, el límit de partides).</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-ads</code><span>Pròpia · funcional</span><span>Recordar si hi ha vídeos d'anunciants i com estan configurats. No conté dades personals.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-sim-prefs</code><span>Pròpia · preferències</span><span>Recordar si ja s'ha vist el tutorial del simulador.</span><span>Fins que s'elimini</span></div>
      <div class="lt-row"><code>r29n-consent</code><span>Pròpia · tècnica</span><span>Desar la teva resposta a l'avís de galetes (si acceptes o no l'estadística d'ús).</span><span>12 mesos</span></div>
      <div class="lt-row"><code>pendingDuel</code>, <code>pendingLeague</code><span>Pròpia · sessió</span><span>Conservar un enllaç d'invitació durant l'inici de sessió.</span><span>Fins al tancament de la pestanya</span></div>
      <div class="lt-row"><code>firebaseLocalStorageDb</code><span>Google (Firebase) · tècnica</span><span>Mantenir la sessió iniciada.</span><span>Fins al tancament de la sessió</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>_ga</code><span>Google · analítica</span><span>Distingir visitants amb finalitats estadístiques.</span><span>2 anys</span></div>
      <div class="lt-row"><code>_ga_&lt;ID&gt;</code><span>Google · analítica</span><span>Mantenir l'estat de la sessió d'analítica.</span><span>2 anys</span></div>
      <div class="lt-row"><code>firebase_installations</code><span>Google (Firebase) · analítica</span><span>Identificador d'instal·lació associat a l'analítica.</span><span>Fins que s'elimini</span></div>` : ""}
    </div>
    <p><b>Galetes publicitàries, només si demanes un vídeo.</b> Mentre no demanis cap vídeo, el lloc web no utilitza galetes publicitàries. Si el repte diari t'ofereix una partida extra i prems «Mira el vídeo», Google (AdSense) pot desar galetes com <code>__gads</code>, <code>__gpi</code>, <code>__eoi</code>, <code>IDE</code> i <code>FCCDCF</code> (aquesta última, per recordar el consentiment), d'acord amb el seu missatge de consentiment i la seva <a href="https://business.safety.google/adscookies/" target="_blank" rel="noopener">informació sobre galetes</a>. Si no demanes cap vídeo, no se'n desa cap.</p>
    <p>Les tipografies s'allotgen al mateix servidor, de manera que la seva càrrega no implica cap connexió amb tercers.</p>

    <h2>3. Base jurídica</h2>
    <p>Les galetes tècniques i de preferències són necessàries per prestar el servei sol·licitat i estan exemptes del deure d'obtenir consentiment, d'acord amb l'article 22.2 de la LSSI-CE. Les dades d'estadística que es desen al dispositiu (r29n-stats)${ANALYTICS_ON ? " i les galetes d'analítica" : ""} només es desen amb el consentiment previ de la persona usuària (art. 6.1.a RGPD i 22.2 LSSI-CE).</p>
    <p><b>Estadística anònima pròpia.</b> Per saber quines parts de l'app s'utilitzen i millorar-les, cada visita suma 1 a uns comptadors agregats per dia (per exemple, «partides de l'Endevina l'any» o «visites des d'un mòbil Android»). També es compta, a la memòria de la pàgina i sense desar res, el temps actiu a cada secció i fins on arriba la gent en recorreguts com el tutorial o la instal·lació. Sense el teu consentiment no es desa res al dispositiu per fer-ho; si l'acceptes, es desa a r29n-stats el que s'indica a la taula. No s'utilitza cap identificador, no es desa cap adreça IP ni cap dada que permeti saber qui és ningú, i no hi intervé cap tercer: els comptadors es desen a la base de dades del mateix servei. Si no vols que les teves visites comptin, pots desactivar-ho: <button class="linklike" type="button" data-stats-toggle>${typeof Stats !== "undefined" && Stats.off() ? "Torna a comptar les meves visites" : "No comptis les meves visites"}</button>.</p>

    <h2>4. Gestió del consentiment</h2>
    <p>En el primer accés es mostra un avís que permet, d'un sol toc, acceptar o rebutjar l'estadística d'ús${ANALYTICS_ON ? " (inclosa Google Analytics)" : ""}, o configurar-la. Rebutjar-la no limita cap funcionalitat del lloc web. L'elecció es conserva durant dotze mesos i es pot modificar en qualsevol moment des de l'enllaç <button class="linklike" data-open-consent>Configuració de galetes</button>, disponible també al peu de pàgina.</p>

    <h2>5. Eliminació des del navegador</h2>
    <p>Les galetes i les dades emmagatzemades es poden eliminar des de la configuració del navegador. Les instruccions dels navegadors principals es poden consultar als enllaços següents: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a>, <a href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener">Mozilla Firefox</a>, <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">Safari</a> i <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a>. El progrés del joc també es pot esborrar des de la secció Perfil.</p>

    <h2>6. Galetes de tercers en l'inici de sessió</h2>
    <p>L'inici de sessió amb Google es fa en una finestra del mateix proveïdor, que pot instal·lar galetes pròpies d'acord amb la seva <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">política de galetes</a>. Els enllaços a mitjans de comunicació condueixen a llocs web amb polítiques de galetes pròpies.</p>`,

  termes: () => `
    <h2>1. Objecte i acceptació</h2>
    <p>Aquestes condicions regulen l'ús del lloc web Política en Joc i dels serveis associats. L'ús del lloc web o la creació d'un compte comporten l'acceptació d'aquestes condicions, de l'${legalLink("avis-legal")} i de la ${legalLink("privacitat")}.</p>

    <h2>2. Descripció del servei</h2>
    <p>El lloc web ofereix de manera gratuïta jocs, continguts formatius i eines de consulta sobre el sistema polític i les eleccions generals, així com funcions per jugar amb amics: xat, trucades i videotrucades, duels, campanyes i debats. Els rànquings, els nivells i les lligues tenen una finalitat exclusivament lúdica i no comporten cap premi ni contraprestació.</p>
    <p>Les trucades i les videotrucades van directament entre els dispositius de les persones que hi participen, no es graven i depenen de la connexió de cadascú: no se'n garanteix la disponibilitat ni la qualitat, i no serveixen per contactar amb els serveis d'emergència.</p>

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
      <li>accedir o intentar accedir a dades d'altres persones usuàries;</li>
      <li>gravar, fer captures o difondre les converses, les trucades o les videotrucades d'altres persones sense el seu consentiment;</li>
      <li>assetjar, intimidar o insistir a contactar amb qui no ho vol, i fer servir els xats o les trucades per contactar amb menors amb finalitats il·lícites;</li>
      <li>posar als partits, candidats o sales noms ofensius o que suplantin formacions reals.</li>
    </ul>
    <p>Per xatejar i trucar cal que totes dues persones s'hagin acceptat com a amigues. Qualsevol persona pot deixar de ser amiga d'una altra en qualsevol moment (s'esborra tot el xat) i denunciar els missatges que rebi.</p>

    <h2>5. Continguts de les persones usuàries</h2>
    <p>Les persones usuàries conserven la titularitat dels missatges que envien i concedeixen una llicència gratuïta, no exclusiva i limitada a la prestació del servei per emmagatzemar-los i mostrar-los a les persones amb qui interactuen. Cada persona usuària és responsable dels continguts que publica.</p>

    <h2>6. Moderació, denúncies, suspensió i cancel·lació</h2>
    <p>Qualsevol persona pot denunciar un missatge des del mateix xat (botó ⚑ o menú del missatge) i qualsevol contingut presumptament il·lícit escrivint a ${legalMail()}, indicant on és i per què el considera il·lícit. L'equip revisa les denúncies de manera manual, sense sistemes automàtics, i les resol amb diligència.</p>
    <p>El titular pot retirar continguts i suspendre o cancel·lar comptes que incompleixin aquestes condicions o la legislació vigent. Quan es retira un contingut o se suspèn un compte, s'informa la persona afectada del motiu per correu electrònic, llevat que la llei ho impedeixi, i aquesta pot demanar-ne la revisió responent al mateix correu. Les autoritats i les persones usuàries poden adreçar-se al punt de contacte únic del servei, ${legalMail()}, en català, castellà o anglès (articles 11, 12, 16 i 17 del Reglament (UE) 2022/2065 de serveis digitals).</p>

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
  return `<p class="coffee-note">Política en Joc és gratuïta. Si t'ho has passat bé, ${coffeeLink("convida'm a un cafè")}.</p>`;
}


// Peu de pàgina: franja fosca amb la marca, l'idioma i el cafè; tres grups d'enllaços (el projecte, ajuda, legal) i la nota d'independència
function legalFooter() {
  return `<footer class="site-foot">
    <div class="sf-in">
      <div class="sf-main">
        <div class="sf-id">
          <a class="sf-brand" href="#inici">
            <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 200 200"><g transform="translate(0 -16)"><path d="M30 144 A70 70 0 0 1 170 144" fill="none" stroke="#17173d" stroke-width="26" stroke-linecap="round"/><path d="M66 144 A34 34 0 0 1 134 144" fill="none" stroke="#17173d" stroke-width="26" stroke-linecap="round"/><circle cx="100" cy="144" r="15" fill="#ff4b2b"/></g></svg></span>
            <span><b>Política en Joc</b><small>Les eleccions del 29N, jugant.</small></span>
          </a>
          <div class="sf-acts">
            <div class="sf-lang" role="group" aria-label="Idioma"><span aria-hidden="true">🌐</span>${langLinks("lang-sw sf-sw")}</div>
            ${coffeeLink("Convida'm a un cafè", "sf-coffee")}
          </div>
        </div>
        <div class="sf-cols">
          <section class="sf-col">
            <h2>El projecte</h2>
            <ul>
              <li><a href="#premsa">Sala de premsa</a></li>
              <li><a href="${stUrl("qui")}">Qui som</a></li>
              <li><a href="#legal/credits">Crèdits i fonts</a></li>
              <li><a href="https://x.com/emdicbru" target="_blank" rel="noopener">Feta per @emdicbru</a></li>
            </ul>
          </section>
          <section class="sf-col">
            <h2>Ajuda</h2>
            <ul>
              <li><a href="#apren">Guia per votar el 29N</a></li>
              <li><a href="${stUrl("dicc")}">Diccionari de política</a></li>
              <li><a href="${stUrl("faq")}">Preguntes freqüents</a></li>
              <li><button class="linklike" type="button" data-report>Avisa d'un error</button></li>
              <li><button class="linklike" type="button" data-open-consent>Configuració de galetes</button></li>
            </ul>
          </section>
          <nav class="sf-col" aria-label="Informació legal">
            <h2>Legal</h2>
            <ul>${LEGAL_PAGES.filter((p) => p.k !== "credits").map((p) => `<li><a href="#legal/${p.k}">${p.h}</a></li>`).join("")}</ul>
          </nav>
        </div>
      </div>
      <p class="sf-note"><span>© 2026 Política en Joc</span><span>Web gratuïta, no oficial i independent: no té cap vincle amb partits, institucions ni mitjans de comunicació.</span></p>
    </div>
  </footer>`;
}

// Pàgines estàtiques amb adreça pròpia (tools/estatiques.js): les poden llegir els cercadors
const ST_URLS = { ca: { qui: "/qui-som/", dicc: "/diccionari/", faq: "/preguntes-frequents/" }, es: { qui: "/es/quienes-somos/", dicc: "/es/diccionario/", faq: "/es/preguntas-frecuentes/" } };
const stUrl = (k) => ST_URLS[typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? "es" : "ca"][k];

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
