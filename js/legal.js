// Textos legals de Política en Joc: avís legal (LSSI-CE), privadesa (RGPD i LOPDGDD), cookies, termes d'ús i crèdits.
// IMPORTANT: omple les dades de la persona titular a LEGAL abans de publicar. Mentre hi hagi «[…]» el web ho mostra com a pendent.
const LEGAL = {
  nom: "Bruno Domingo Sola",
  nif: "", // opcional mentre el web no tingui activitat econòmica; si l'omples, es mostra
  adreca: "", // opcional: adreça postal del titular
  correu: "brudomingosola@gmail.com",
  domini: location.hostname || "politica-en-joc.web.app",
  actualitzat: "21 d'octubre del 2026",
};

const ANALYTICS_ON = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId);

const LEGAL_PAGES = [
  { k: "avis-legal", t: "Avís legal" },
  { k: "privacitat", t: "Privadesa" },
  { k: "cookies", t: "Cookies" },
  { k: "termes", t: "Termes d'ús" },
  { k: "credits", t: "Crèdits i fonts" },
];

const legalMail = () => (LEGAL.correu.startsWith("[") ? `<b>${LEGAL.correu}</b>` : `<a href="mailto:${LEGAL.correu}">${LEGAL.correu}</a>`);
const lg = (k) => `<a href="#legal/${k}">${LEGAL_PAGES.find((p) => p.k === k).t}</a>`;

const LEGAL_TEXT = {
  "avis-legal": () => `
    <h2>1. Qui som</h2>
    <p>En compliment de l'article 10 de la Llei 34/2002, de serveis de la societat de la informació i de comerç electrònic (LSSI-CE), t'informem que aquest lloc web (<b>${LEGAL.domini}</b>), anomenat <b>Política en Joc</b>, pertany a:</p>
    <ul>
      <li><b>Titular:</b> ${LEGAL.nom}</li>
      ${LEGAL.nif ? `<li><b>NIF/DNI:</b> ${LEGAL.nif}</li>` : ""}
      ${LEGAL.adreca ? `<li><b>Domicili:</b> ${LEGAL.adreca}</li>` : ""}
      <li><b>Contacte:</b> ${legalMail()}</li>
    </ul>
    <h2>2. Objecte</h2>
    <p>Política en Joc és una aplicació web gratuïta i divulgativa, feta en català, que ofereix minijocs, explicacions i eines (comparador de partits, pactòmetre, simulador de la Llei d'Hondt, calendari electoral i titulars) a l'entorn de les eleccions generals del 29 de novembre del 2026.</p>
    <h2>3. Independència i neutralitat</h2>
    <p>Aquest web és un projecte independent. <b>No està vinculat a cap partit polític, coalició, candidatura, institució pública ni mitjà de comunicació</b>, i no fa campanya electoral ni demana el vot per a ningú. Les referències a partits i persones tenen només finalitat informativa i educativa. Els noms, sigles i marques de partits, institucions i mitjans pertanyen als seus titulars.</p>
    <h2>4. Informació orientativa, no oficial</h2>
    <p>Fem tot el possible perquè la informació sigui correcta i neutral, però <b>pot contenir errors o quedar desfasada</b> i no substitueix les fonts oficials. Per a qualsevol tràmit o dubte electoral consulta el <a href="https://www.boe.es" target="_blank" rel="noopener">BOE</a>, la <a href="https://www.juntaelectoralcentral.es" target="_blank" rel="noopener">Junta Electoral Central</a> i el <a href="https://www.infoelectoral.interior.gob.es" target="_blank" rel="noopener">Ministeri de l'Interior</a>. Les candidatures i posicions dels partits són orientatives i poden canviar fins a la proclamació oficial.</p>
    <h2>5. Enquestes electorals</h2>
    <p>Les dades d'enquestes que mostra el pactòmetre provenen de tercers (vegeu <a href="#legal/credits">Crèdits i fonts</a>) i <b>no són un pronòstic</b>. En compliment de l'article 69.7 de la Llei orgànica del règim electoral general, <b>durant els cinc dies anteriors a la votació i fins al tancament dels col·legis electorals</b> (del 24 de novembre fins a les 21:00 del 29 de novembre del 2026, hora peninsular) el web deixa de mostrar enquestes i la seva mitjana; només queda disponible l'escenari que construeixes tu mateix.</p>
    <h2>6. Propietat intel·lectual</h2>
    <p>El codi, el disseny, les il·lustracions i els textos propis de Política en Joc són de ${LEGAL.nom}, tots els drets reservats, llevat que s'indiqui el contrari. Les fotografies, tipografies i dades de tercers es fan servir sota les seves llicències, que es detallen a <a href="#legal/credits">Crèdits i fonts</a>. Si creus que algun contingut vulnera drets teus, escriu-nos a ${legalMail()} i el revisarem amb diligència.</p>
    <h2>7. Enllaços externs</h2>
    <p>El web conté enllaços a webs de tercers (mitjans, fonts oficials, Viquipèdia…). Hi accedeixes sota la teva responsabilitat; no controlem el seu contingut ni les seves polítiques de privadesa. Els titulars de l'apartat Actualitat són dels mitjans respectius i enllacen directament a la seva pàgina.</p>
    <h2>8. Responsabilitat</h2>
    <p>El servei s'ofereix «tal com és», sense garanties de disponibilitat contínua ni d'absència d'errors. No ens fem responsables dels danys que puguin derivar-se d'un ús indegut del web ni de les decisions preses a partir de la seva informació. Pots escriure'ns per comunicar qualsevol error o contingut il·lícit.</p>
    <h2>9. Llei aplicable</h2>
    <p>Aquest avís es regeix per la legislació espanyola. Per a qualsevol controvèrsia, i si ets consumidor, són competents els jutjats i tribunals del teu domicili; en els altres casos, els del domicili del titular.</p>`,

  privacitat: () => `
    <h2>1. Responsable del tractament</h2>
    <p><b>${LEGAL.nom}</b>${LEGAL.nif ? ` · NIF/DNI ${LEGAL.nif}` : ""}${LEGAL.adreca ? ` · ${LEGAL.adreca}` : ""} · ${legalMail()}.</p>
    <p>Aquesta política s'ajusta al Reglament (UE) 2016/679 (RGPD) i a la Llei orgànica 3/2018 (LOPDGDD).</p>
    <h2>2. Pots jugar sense compte</h2>
    <p>Per jugar, llegir i fer servir les eines <b>no cal registrar-se</b>. En aquest cas el progrés (XP, rècords, preferències) es desa només al teu dispositiu i no ens arriba cap dada personal. Encara així, per servir-te el web el nostre proveïdor tècnic (Google Firebase Hosting) rep dades tècniques mínimes d'ús, com l'adreça IP, i el web carrega el programari de Firebase des dels servidors de Google.</p>
    <h2>3. Quines dades tractem si inicies sessió amb Google</h2>
    <ul>
      <li><b>Dades del compte de Google:</b> identificador, nom, adreça electrònica i foto de perfil.</li>
      <li><b>Dades de joc:</b> XP, nivell, rècords, assoliments, temps del repte diari i els seus encerts i errors.</li>
      <li><b>Dades socials:</b> els duels 1 contra 1 (participants, preguntes triades, puntuacions, <b>missatges de xat i icones</b>) i la pertinença a lligues d'amics.</li>
    </ul>
    <p>No tractem categories especials de dades, no fem perfils publicitaris ni preses de decisions automatitzades, i no venem ni cedim les teves dades.</p>
    <h2>4. Per a què i amb quina base jurídica</h2>
    <ul>
      <li><b>Prestar el servei</b> (compte, desar el progrés, rànquing, duels i lligues): execució de la relació que estableixes en acceptar els <a href="#legal/termes">Termes d'ús</a> (art. 6.1.b RGPD).</li>
      <li><b>Iniciar sessió amb Google:</b> el teu consentiment en fer clic al botó (art. 6.1.a), que pots retirar eliminant el compte.</li>
      <li><b>Seguretat i prevenció d'abusos</b> (regles d'accés, límits, moderació): interès legítim (art. 6.1.f).</li>
    </ul>
    <h2>5. Qui veu les teves dades</h2>
    <ul>
      <li><b>Altres jugadors registrats</b> veuen el teu nom, la teva foto, el teu nivell i XP, el teu temps al rànquing del repte diari, i, en un duel o lliga, els teus resultats i missatges. <b>No es mostra l'adreça electrònica.</b> Si no vols aparèixer, no facis servir el compte o elimina'l.</li>
      <li><b>Google Ireland Ltd. / Google LLC</b> (Firebase Authentication, Cloud Firestore i Hosting), com a encarregat del tractament. Pot haver-hi transferències a Estats Units emparades per les clàusules contractuals tipus de la Comissió Europea i/o el Marc de Privadesa de Dades UE-EUA.</li>
      <li><b>Wikimedia Foundation:</b> les fotografies de persones es carreguen des dels servidors de Wikimedia Commons, que reben la teva adreça IP quan les veus.</li>
      <li><b>Mitjans de comunicació:</b> per mostrar titulars recents, el teu navegador consulta directament els RSS públics d'alguns mitjans (actualment El País i VilaWeb), que reben la teva adreça IP. Si fas clic a un titular, passes a la seva web amb les seves pròpies polítiques.</li>
      <li>Autoritats, només quan una llei ho exigeixi.</li>
    </ul>
    <h2>6. Quant de temps les conservem</h2>
    <p>Mentre mantinguis el compte. Si l'elimines (Perfil → Elimina el meu compte), esborrem el teu perfil, els teus temps del repte diari, els teus duels i la teva pertinença a lligues. Les còpies de seguretat tècniques de Google poden persistir uns dies fins a la seva rotació.</p>
    <h2>7. Els teus drets</h2>
    <p>Pots exercir els drets d'<b>accés, rectificació, supressió, oposició, limitació del tractament i portabilitat</b>, i retirar el consentiment en qualsevol moment:</p>
    <ul>
      <li>Directament al <a href="#perfil">Perfil</a>: <b>descarregar les teves dades</b> (JSON) i <b>eliminar el teu compte</b>.</li>
      <li>Escrivint a ${legalMail()}, amb la teva petició i una prova raonable de la teva identitat.</li>
    </ul>
    <p>Si penses que no hem tractat bé les teves dades, pots reclamar davant l'<a href="https://www.aepd.es" target="_blank" rel="noopener">Agència Espanyola de Protecció de Dades</a>.</p>
    <h2>8. Menors</h2>
    <p>L'edat mínima per crear un compte és de <b>14 anys</b> (art. 7 LOPDGDD). Els menors de 14 poden fer servir el web sense compte; si creus que un menor de 14 ha creat un compte, avisa'ns i l'eliminarem. Recomanem que les persones menors d'edat no comparteixin dades personals al xat dels duels.</p>
    <h2>9. Seguretat</h2>
    <p>El web es serveix per HTTPS i les dades es guarden en una base de dades amb regles d'accés que limiten què pot llegir i modificar cada persona. Cap sistema és infal·lible; si detectéssim una bretxa que t'afecti, ho notificarem segons la normativa.</p>
    <h2>10. Analítica i publicitat</h2>
    ${ANALYTICS_ON
      ? `<p><b>Analítica (només amb el teu consentiment, art. 6.1.a RGPD):</b> si l'acceptes, fem servir Google Analytics 4 (Google Ireland Ltd. / Google LLC) per obtenir estadístiques agregades: pàgines i funcions visitades, tipus de dispositiu i navegador, país aproximat i durada de la visita. Hem desactivat els senyals de Google i la personalització publicitària, i l'adreça IP no s'emmagatzema als informes. Pots retirar el consentiment quan vulguis: <button class="linklike" data-open-consent>Configura les cookies</button>. Les dades poden transferir-se a Estats Units amb les garanties indicades a l'apartat 5.</p>
         <p><b>Publicitat:</b> no fem servir cookies publicitàries. Si en el futur s'incorporen (per exemple anuncis opcionals), actualitzarem aquesta política i et demanarem consentiment abans d'activar-los.</p>`
      : `<p>Actualment <b>no fem servir cookies publicitàries ni d'analítica</b>. Si en el futur s'incorporen, actualitzarem aquesta política i et demanarem consentiment abans d'activar-los.</p>`}
    <h2>11. Canvis</h2>
    <p>Podem actualitzar aquesta política; la data de l'última versió és a la capçalera. Si el canvi és rellevant, t'ho avisarem al web.</p>`,

  cookies: () => `
    <h2>Què fem servir</h2>
    ${ANALYTICS_ON
      ? `<p>Política en Joc fa servir <b>emmagatzematge tècnic imprescindible</b> (no necessita consentiment, art. 22.2 LSSI-CE) i, <b>només si ho acceptes</b>, <b>cookies d'analítica</b> de Google Analytics per mesurar l'ús del web. <b>No fem servir cookies publicitàries.</b> Pots canviar la teva elecció en qualsevol moment: <button class="linklike" data-open-consent>Configura les cookies</button>. Rebutjar-les és tan fàcil com acceptar-les i no limita cap funció del web.</p>`
      : `<p>Política en Joc <b>no utilitza cookies publicitàries ni d'analítica</b> i no necessita banner de consentiment, perquè només fa servir emmagatzematge tècnic imprescindible o que demanes tu mateix (art. 22.2 LSSI-CE).</p>`}
    <p>Les tipografies s'allotgen al mateix servidor perquè el teu navegador no contacti amb Google per carregar-les.</p>
    <div class="legal-table">
      <div class="lt-row head"><b>Nom</b><b>Tipus</b><b>Finalitat</b><b>Durada</b></div>
      <div class="lt-row"><code>r29n</code><span>Emmagatzematge local</span><span>Desa el teu progrés al dispositiu (XP, rècords, assoliments, repte diari).</span><span>Fins que l'esborris</span></div>
      <div class="lt-row"><code>r29n-sound</code><span>Emmagatzematge local</span><span>Recorda si has silenciat els sons.</span><span>Fins que l'esborris</span></div>
      <div class="lt-row"><code>r29n-user</code><span>Emmagatzematge local</span><span>Mostra ràpidament el teu compte en obrir l'app.</span><span>Fins que tanquis la sessió</span></div>
      <div class="lt-row"><code>r29n-pacte</code><span>Emmagatzematge local</span><span>Recorda el teu escenari del pactòmetre.</span><span>Fins que l'esborris</span></div>
      <div class="lt-row"><code>pendingDuel</code>, <code>pendingLeague</code><span>Emmagatzematge de sessió</span><span>Recorden l'enllaç d'un duel o lliga mentre inicies sessió.</span><span>Fins que tanquis la pestanya</span></div>
      <div class="lt-row"><code>r29n-consent</code><span>Emmagatzematge local</span><span>Recorda la teva elecció sobre cookies.</span><span>12 mesos</span></div>
      <div class="lt-row"><code>firebaseLocalStorageDb</code><span>IndexedDB (Google Firebase)</span><span>Manté la sessió iniciada amb Google.</span><span>Fins que tanquis la sessió</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>_ga</code><span>Cookie de tercers (Google Analytics) · només amb consentiment</span><span>Distingeix visitants de manera anònima per a estadístiques.</span><span>2 anys</span></div>
      <div class="lt-row"><code>_ga_&lt;ID&gt;</code><span>Cookie de tercers (Google Analytics) · només amb consentiment</span><span>Manté l'estat de la sessió d'analítica.</span><span>2 anys</span></div>
      <div class="lt-row"><code>firebase_installations</code><span>IndexedDB (Firebase) · només amb consentiment</span><span>Identificador d'instal·lació per a l'analítica.</span><span>Fins que l'esborris</span></div>` : ""}
    </div>
    <h2>Tercers</h2>
    <p>En iniciar sessió, Google mostra la seva pròpia finestra i pot desar cookies al seu domini segons la seva <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">política de cookies</a>. Els enllaços a mitjans de comunicació obren els seus webs, que tenen les seves pròpies cookies.</p>
    <h2>Com esborrar-ho</h2>
    <p>Pots eliminar les dades locals des de la configuració del navegador, o al <a href="#perfil">Perfil</a> amb «Esborra el progrés». Tanca la sessió per eliminar les dades d'inici de sessió d'aquest dispositiu.</p>`,

  termes: () => `
    <h2>1. Acceptació</h2>
    <p>En fer servir Política en Joc o crear-hi un compte acceptes aquests termes, l'<a href="#legal/avis-legal">Avís legal</a> i la <a href="#legal/privacitat">Política de privadesa</a>. Si no hi estàs d'acord, no facis servir el servei.</p>
    <h2>2. El servei</h2>
    <p>És un joc divulgatiu i gratuït. No hi ha premis, apostes ni contraprestacions econòmiques. El rànquing, els nivells i les lligues són només un entreteniment.</p>
    <h2>3. Compte i edat</h2>
    <p>Necessites un compte de Google per desar el progrés, sortir al rànquing i jugar duels. Has de tenir <b>14 anys o més</b>. Ets responsable de l'ús del teu compte. Pots eliminar-lo en qualsevol moment al Perfil.</p>
    <h2>4. Conducta</h2>
    <p>Als duels i lligues pots enviar missatges i icones. Queda prohibit: insultar, amenaçar o assetjar; contingut il·legal, discriminatori, d'odi o sexual; fer spam o publicitat; compartir dades personals teves o d'altres; suplantar identitats; fer trampes (per exemple, manipular temps, puntuacions o el client) o intentar accedir a dades d'altres persones o alterar el servei. Podem eliminar contingut, suspendre o eliminar comptes que incompleixin aquestes normes.</p>
    <h2>5. El teu contingut</h2>
    <p>Mantens la titularitat dels missatges que escrius. Ens dones una llicència limitada, gratuïta i només per a prestar el servei, per desar-los i mostrar-los a les persones amb qui jugues. Ets responsable del que escrius.</p>
    <h2>6. Propietat intel·lectual</h2>
    <p>Tots els drets sobre el codi, el disseny i els textos propis són del titular. No pots copiar, redistribuir ni fer-ne ús comercial sense permís. Els continguts de tercers són dels seus titulars i es fan servir sota les seves llicències (<a href="#legal/credits">Crèdits i fonts</a>).</p>
    <h2>7. Disponibilitat i canvis</h2>
    <p>Podem modificar, interrompre o retirar funcions, reiniciar rànquings o eliminar contingut sense avís previ, especialment per motius tècnics, de seguretat o després de les eleccions.</p>
    <h2>8. Limitació de responsabilitat</h2>
    <p>El servei s'ofereix «tal com és». En la mesura que ho permeti la llei, no responem de la pèrdua de dades de joc, interrupcions ni errors informatius. Això no limita els drets irrenunciables que tinguis com a consumidor.</p>
    <h2>9. Contacte i notificacions</h2>
    <p>Per a dubtes, errors, drets de protecció de dades o per denunciar contingut il·lícit: ${legalMail()}.</p>
    <h2>10. Llei i jurisdicció</h2>
    <p>Aquests termes es regeixen per la llei espanyola. Si ets consumidor, són competents els tribunals del teu domicili.</p>`,

  credits: () => {
    const photos = Object.entries(typeof PHOTOS !== "undefined" ? PHOTOS : {}).sort((a, b) => a[0].localeCompare(b[0], "ca"));
    return `
    <h2>Fotografies</h2>
    <p>Les fotografies de persones procedeixen de Wikimedia Commons i es mostren sota les llicències que indiquem. Pertanyen als seus autors. Si hi ha cap imatge que vulguis que retirem, escriu a ${legalMail()}.</p>
    <div class="legal-table credits">
      <div class="lt-row head"><b>Persona</b><b>Autoria</b><b>Llicència</b><b>Origen</b></div>
      ${photos.map(([name, p]) => `<div class="lt-row"><span>${esc(name)}</span><span>${esc(p.author || "—")}</span><span>${esc(p.license || "—")}</span><span><a href="${esc(p.page)}" target="_blank" rel="noopener">Commons ↗</a></span></div>`).join("")}
    </div>
    <h2>Dades i continguts</h2>
    <ul>
      <li><b>Candidatures, partits i enquestes:</b> <a href="https://es.wikipedia.org/wiki/Elecciones_generales_de_Espa%C3%B1a_de_2026" target="_blank" rel="noopener">Viquipèdia</a> i <a href="${typeof POLL_SOURCE === "string" ? POLL_SOURCE : "https://en.wikipedia.org"}" target="_blank" rel="noopener">el seu recull d'enquestes</a>, sota la llicència <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ca" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Les xifres s'han adaptat (mitjanes i ajustos); poden contenir errors de transcripció.</li>
      <li><b>Resultats electorals del 2019 i 2023 i procediment electoral:</b> Ministeri de l'Interior, Junta Electoral Central, Congrés dels Diputats i BOE.</li>
      <li><b>Programes dels partits:</b> resum propi a partir dels seus programes i de posicions públiques; no és un text oficial dels partits.</li>
      <li><b>Frases:</b> citacions públiques atribuïdes a polítics, amb l'any i el context, per a ús divulgatiu i de cita.</li>
      <li><b>Titulars:</b> són dels mitjans (El País, El Mundo, ABC, 20minutos, eldiario.es, infoLibre, El Español, El Debate, La Vanguardia, Europa Press, Ara, NacióDigital, VilaWeb). Només en mostrem el titular i l'enllaç.</li>
    </ul>
    <h2>Tipografies i tecnologia</h2>
    <ul>
      <li>Tipografies <b>Unbounded</b> i <b>DM Sans</b>, sota la llicència <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License 1.1</a>.</li>
      <li>Inici de sessió, base de dades i allotjament: <a href="https://firebase.google.com" target="_blank" rel="noopener">Google Firebase</a>.</li>
    </ul>`;
  },
};

function legalFooter() {
  return `<footer class="site-foot">
    <p class="sf-line"><b>Política en Joc</b> · projecte independent, sense vinculació amb cap partit, institució ni mitjà. Informació orientativa.</p>
    <nav aria-label="Informació legal">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}">${p.t}</a>`).join("")}${ANALYTICS_ON ? `<button class="linklike" data-open-consent>Configura les cookies</button>` : ""}</nav>
  </footer>`;
}

function legalNote() {
  return `<p class="legal-note">En continuar declares tenir 14 anys o més i acceptes els ${lg("termes")} i la ${lg("privacitat")}.</p>`;
}

function renderLegal(slug) {
  const root = $("#legal-root");
  if (!root) return;
  const page = LEGAL_PAGES.find((p) => p.k === slug) || LEGAL_PAGES[0];
  const pending = Object.values(LEGAL).some((v) => typeof v === "string" && v.startsWith("["));
  root.innerHTML = `
    <nav class="legal-tabs" aria-label="Pàgines legals">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}" class="${p.k === page.k ? "on" : ""}">${p.t}</a>`).join("")}</nav>
    <article class="card legal">
      <p class="kicker">Última actualització: ${LEGAL.actualitzat}</p>
      <h1 class="page-title">${page.t}</h1>
      ${pending ? `<p class="legal-pending">Pendent: falten per completar les dades del titular en aquest text.</p>` : ""}
      ${LEGAL_TEXT[page.k]()}
    </article>`;
}

document.getElementById("main")?.insertAdjacentHTML("afterend", legalFooter());
