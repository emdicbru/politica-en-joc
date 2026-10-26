// Textos legals de Política en Joc: avís legal (LSSI-CE), política de privadesa (RGPD i LOPDGDD),
// política de galetes, condicions d'ús i crèdits.
const LEGAL = {
  nom: "Bruno Domingo Sola",
  nif: "", // opcional mentre el lloc web no tingui activitat econòmica; si s'omple, es mostra
  adreca: "", // opcional: adreça postal del titular
  correu: "brudomingosola@gmail.com",
  domini: "politicaenjoc.cat",
  actualitzat: "23 de octubre de 2026",
};

const ANALYTICS_ON = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId);

const LEGAL_PAGES = [
  { k: "avis-legal", t: "Aviso legal", h: "Aviso legal" },
  { k: "privacitat", t: "Privacidad", h: "Política de privacidad" },
  { k: "cookies", t: "Cookies", h: "Política de cookies" },
  { k: "termes", t: "Condiciones de uso", h: "Condiciones de uso" },
  { k: "credits", t: "Créditos", h: "Créditos y fuentes" },
];

const legalMail = () => `<a href="mailto:${LEGAL.correu}">${LEGAL.correu}</a>`;
const legalLink = (k) => { const p = LEGAL_PAGES.find((x) => x.k === k); return `<a href="#legal/${k}">${p.h}</a>`; };
const legalId = () => [
  `<li><b>Titular:</b> ${LEGAL.nom}</li>`,
  LEGAL.nif ? `<li><b>NIF:</b> ${LEGAL.nif}</li>` : "",
  LEGAL.adreca ? `<li><b>Domicilio:</b> ${LEGAL.adreca}</li>` : "",
  `<li><b>Dirección electrónica:</b> ${legalMail()}</li>`,
  `<li><b>Sitio web:</b> ${LEGAL.domini}</li>`,
].join("");

const LEGAL_TEXT = {
  "avis-legal": () => `
    <h2>1. Datos identificativos</h2>
    <p>En cumplimiento del deber de información previsto en el artículo 10 de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se hacen constar los datos siguientes:</p>
    <ul>${legalId()}</ul>

    <h2>2. Objeto</h2>
    <p>Este aviso legal regula el acceso y el uso del sitio web Política en Joc (en adelante, el sitio web), un proyecto divulgativo y gratuito sobre las elecciones generales del 29 de noviembre de 2026 que incluye juegos, contenidos formativos y herramientas de consulta.</p>
    <p>El acceso al sitio web atribuye la condición de persona usuaria y comporta la aceptación de este aviso legal, de la ${legalLink("privacitat")}, de la ${legalLink("cookies")} y de las ${legalLink("termes")}.</p>

    <h2>3. Independencia</h2>
    <p>El sitio web es un proyecto independiente. No tiene ninguna vinculación con partidos políticos, coaliciones, candidaturas, administraciones públicas ni medios de comunicación, y no constituye propaganda electoral. Las referencias a formaciones políticas y a personas tienen una finalidad exclusivamente informativa y educativa.</p>

    <h2>4. Exactitud de la información</h2>
    <p>El titular vela por la corrección y la actualización de los contenidos, pero no garantiza su exactitud ni su exhaustividad. La información tiene carácter orientativo y no sustituye a las fuentes oficiales, especialmente el Boletín Oficial del Estado, la Junta Electoral Central y el Ministerio del Interior. Los datos sobre candidaturas y programas electorales pueden variar hasta la proclamación oficial de las candidaturas y durante la campaña.</p>

    <h2>5. Encuestas electorales</h2>
    <p>Los datos de encuestas proceden de fuentes de terceros, que se indican en cada caso, y no constituyen ningún pronóstico. De acuerdo con el artículo 69.7 de la Ley Orgánica 5/1985, de 19 de junio, del Régimen Electoral General, el sitio web no publica ni difunde encuestas electorales desde el 24 de noviembre de 2026 hasta el cierre de los colegios electorales el día de la votación.</p>

    <h2>6. Propiedad intelectual e industrial</h2>
    <p>Los contenidos propios del sitio web (código fuente, diseño, ilustraciones y textos) son titularidad de ${LEGAL.nom}, salvo que se indique lo contrario. Se prohíbe su reproducción, distribución, comunicación pública y transformación con fines comerciales sin autorización previa y por escrito.</p>
    <p>Las marcas, las denominaciones y los logotipos de terceros pertenecen a sus titulares respectivos. Las fotografías, las tipografías y los datos de terceros se utilizan de acuerdo con las licencias que se indican en el apartado ${legalLink("credits")}.</p>

    <h2>7. Enlaces a sitios de terceros</h2>
    <p>El sitio web contiene enlaces a sitios web de terceros. El titular no es responsable de sus contenidos ni de sus políticas de privacidad. Los titulares de prensa del apartado Noticias pertenecen a los medios de comunicación correspondientes y enlazan a la publicación original.</p>
    ${COFFEE_URL ? `<p>El enlace «Invítame a un café» lleva a Ko-fi, una plataforma externa para hacer aportaciones voluntarias. Las aportaciones son opcionales, no dan ninguna ventaja dentro del juego y se gestionan íntegramente en esa plataforma, de acuerdo con sus condiciones y su política de privacidad.</p>` : ""}

    <h2>8. Responsabilidad</h2>
    <p>El titular no es responsable de los daños que se puedan derivar de un uso indebido del sitio web, ni de las interrupciones, los errores técnicos o la falta de disponibilidad del servicio. La persona usuaria se compromete a hacer un uso del sitio web conforme a la legislación vigente, a la buena fe y a este aviso legal.</p>

    <h2>9. Comunicaciones</h2>
    <p>Cualquier comunicación relativa al sitio web, incluida la notificación de errores o de contenidos presuntamente ilícitos, se puede dirigir a ${legalMail()}.</p>

    <h2>10. Legislación aplicable y jurisdicción</h2>
    <p>Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia, cuando la persona usuaria tenga la condición de consumidora, serán competentes los juzgados y tribunales de su domicilio.</p>`,

  privacitat: () => `
    <h2>1. Responsable del tratamiento</h2>
    <ul>${legalId()}</ul>
    <p>Esta política se ajusta al Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), y a la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).</p>

    <h2>2. Datos personales tratados</h2>
    <p><b>a) Uso del sitio web sin cuenta.</b> Para jugar y consultar los contenidos no hace falta registrarse. En este caso no se recogen datos identificativos: el progreso del juego y las preferencias se guardan exclusivamente en el dispositivo de la persona usuaria. El proveedor de alojamiento trata los datos técnicos necesarios para servir el sitio web, como la dirección IP.</p>
    <p><b>b) Personas usuarias registradas con una cuenta de Google.</b> Se tratan el identificador de usuario, el nombre, la dirección electrónica y la fotografía de la cuenta de Google; el nombre de usuario y la foto de perfil que la persona usuaria elige (una fotografía propia se reduce en el dispositivo antes de guardarla), que son visibles para el resto de usuarios en los rankings y en los duelos; los datos de progreso en el juego (puntos de experiencia, nivel, récords y logros); los resultados del reto diario; la participación en duelos, incluidos los mensajes y los iconos enviados, la pertenencia a ligas y, si juega, los pronósticos y las fichas de la Liga de pronósticos.</p>
    <p><b>c) Notificaciones.</b> Si una persona activa las notificaciones, se guarda la dirección de suscripción que el navegador asigna al dispositivo para recibirlas (la proporciona el servicio de notificaciones del navegador: Google, Apple o Mozilla), los temas elegidos y el tipo de dispositivo. No se asocia al nombre ni a la cuenta. Se pueden desactivar en cualquier momento desde Perfil o desde la configuración del navegador, y entonces el identificador se elimina.</p>
    <p><b>d) Estadística de uso anónima.</b> La app cuenta de manera agregada y anónima el uso que se hace de ella (visitas por día y por hora, secciones visitadas, partidas jugadas, tipo de dispositivo y web de origen por categorías). No se recogen datos identificativos ni se asocia a ninguna cuenta. Se puede desactivar desde la Política de cookies.</p>
    <p><b>e) Monedas y tienda.</b> Si una persona con cuenta compra artículos de la tienda del juego, se guardan en su perfil los artículos que tiene y los que lleva puestos; el marco y el título son visibles en los rankings. Las monedas son una moneda ficticia del juego.</p>
    <p><b>f) Avisos de error.</b> Si una persona avisa de un error, se guarda el texto que escribe, el correo electrónico si lo indica voluntariamente (para poder responderle), la sección de la app donde estaba, el tipo de dispositivo y navegador, el tamaño de la pantalla, la versión de la app, el último error técnico de la página y, si tiene la sesión iniciada, su identificador de usuario. Solo lo ve el equipo de la app, se utiliza exclusivamente para corregir el error y responderle, y se borra cuando ya no es necesario y como máximo al cabo de doce meses.</p>
    <p><b>h) Vídeos de anunciantes (opcional).</b> Cuando el reto diario ofrece una partida extra a cambio de ver un vídeo, si una persona pulsa «Mira el vídeo» para jugar una tercera partida del reto diario, se carga el servicio de anuncios de Google (AdSense) y se muestra un vídeo de un anunciante. Antes, Google pide el consentimiento para las cookies y, si se deniega, muestra anuncios no personalizados. Google trata la dirección IP, identificadores del dispositivo y del navegador y, con consentimiento, datos para personalizar los anuncios, como responsable independiente de acuerdo con su <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">política de privacidad</a>. Si no se pide el vídeo, no se carga nada de Google Ads.</p>
    <p><b>g) Contactos de prensa.</b> Para enviar las notas de prensa de Política en Joc, se tratan el nombre, el medio, la dirección electrónica profesional y las etiquetas temáticas de periodistas y medios de comunicación, obtenidas de fuentes públicas profesionales o facilitadas por las propias personas. Solo accede a ellos el equipo de la app. Cada correo incluye un enlace para dejar de recibirlos, y también se puede pedir por escrito.</p>
    ${ANALYTICS_ON ? `<p><b>c) Datos de analítica.</b> Únicamente con el consentimiento previo de la persona usuaria, se recogen datos de uso agregados mediante Google Analytics: páginas consultadas, tipo de dispositivo y navegador, ubicación aproximada y duración de la visita.</p>` : ""}
    <p>No se tratan categorías especiales de datos ni se hacen perfiles con fines publicitarios o decisiones automatizadas.</p>

    <h2>3. Finalidades y base jurídica</h2>
    <div class="legal-table two">
      <div class="lt-row head"><b>Finalidad</b><b>Base jurídica</b></div>
      <div class="lt-row"><span>Gestión de la cuenta y prestación del servicio: guardado del progreso, rankings, duelos y ligas.</span><span>Ejecución de las condiciones de uso aceptadas por la persona usuaria (art. 6.1.b RGPD).</span></div>
      <div class="lt-row"><span>Mostrar un vídeo de un anunciante cuando la persona lo pide para jugar una partida extra.</span><span>Consentimiento de la persona usuaria (art. 6.1.a RGPD), que pide el mensaje de Google antes del vídeo y se puede retirar en cualquier momento.</span></div>
      <div class="lt-row"><span>Envío de notas de prensa a periodistas y medios de comunicación.</span><span>Interés legítimo del responsable en la difusión del proyecto entre profesionales de la información (art. 6.1.f RGPD), con derecho de oposición en cualquier momento.</span></div>
      <div class="lt-row"><span>Seguridad del servicio y prevención de usos fraudulentos.</span><span>Interés legítimo del responsable (art. 6.1.f RGPD).</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><span>Elaboración de estadísticas de uso.</span><span>Consentimiento de la persona usuaria (art. 6.1.a RGPD), revocable en cualquier momento.</span></div>` : ""}
      <div class="lt-row"><span>Atención de consultas y de solicitudes de ejercicio de derechos.</span><span>Cumplimiento de obligaciones legales (art. 6.1.c RGPD).</span></div>
    </div>

    <h2>4. Destinatarios</h2>
    <ul>
      <li>GitHub, Inc., como proveedor del alojamiento de los archivos de la app (código, imágenes, tipografías y datos públicos como los titulares o los resultados), en calidad de encargado del tratamiento. Solo recibe los datos técnicos necesarios para servirlos, como la dirección IP.</li>
      <li>Google Ireland Limited y Google LLC, como proveedores de los servicios Firebase (autenticación, base de datos y alojamiento)${ANALYTICS_ON ? " y Google Analytics" : ""}, en calidad de encargados del tratamiento.</li>
      <li>Google Ireland Limited (AdSense), que sirve los vídeos de anunciantes solo cuando se piden, como responsable independiente para los anuncios.</li>
      <li>Sendinblue SAS (Brevo), con sede en Francia, como proveedor del envío de los correos de las notas de prensa, en calidad de encargado del tratamiento.</li>
      <li>GitHub, Inc., que aloja el archivo público de titulares de prensa. Su consulta comporta la transmisión de la dirección IP.</li>
      <li>Wikimedia Foundation, Inc., desde donde se cargan las fotografías. Su visualización comporta la transmisión de la dirección IP.</li>
      <li>Los medios de comunicación El País y VilaWeb, cuyos canales RSS se consultan directamente desde el navegador para mostrar titulares recientes. Esta consulta comporta la transmisión de la dirección IP.</li>
      <li>Otras personas usuarias registradas, que pueden ver el nombre, la fotografía de perfil, el nivel y los resultados en los rankings, los duelos y las ligas. La dirección electrónica no se muestra en ningún caso.</li>
    </ul>
    <p>Los datos no se ceden a terceros, salvo obligación legal.</p>

    <h2>5. Transferencias internacionales</h2>
    <p>Algunos de los proveedores mencionados pueden tratar datos en los Estados Unidos. Estas transferencias se amparan en el Marco de privacidad de datos UE-EE. UU. o en las cláusulas contractuales tipo aprobadas por la Comisión Europea.</p>

    <h2>6. Plazo de conservación</h2>
    <p>Los datos de los contactos de prensa se conservan mientras sean útiles para la difusión del proyecto y hasta que la persona se oponga a recibir más comunicaciones; en ese caso, se conserva solo la dirección marcada como baja para no volver a escribirle. Los datos se conservan mientras la cuenta esté activa. Cuando se elimina la cuenta, se borran el perfil, los resultados del reto diario, los duelos, la pertenencia a ligas y los pronósticos, sin perjuicio de las copias de seguridad de los proveedores, que se eliminan de acuerdo con sus ciclos de rotación.${ANALYTICS_ON ? " Los datos de analítica se conservan durante el periodo configurado en Google Analytics, que no supera los catorce meses." : ""}</p>

    <h2>7. Derechos de las personas interesadas</h2>
    <p>La persona interesada puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar el consentimiento prestado, mediante:</p>
    <ul>
      <li>las herramientas disponibles en la sección Perfil, que permiten descargar una copia de los datos y eliminar la cuenta;</li>
      <li>un escrito dirigido a ${legalMail()}, acompañado de un documento que acredite su identidad.</li>
    </ul>
    <p>Asimismo, puede presentar una reclamación ante la<a href="https://www.aepd.es" target="_blank" rel="noopener">Agencia Española de Protección de Datos</a>.</p>

    <h2>8. Menores de edad</h2>
    <p>La edad mínima para crear una cuenta es de catorce años, de acuerdo con el artículo 7 de la LOPDGDD. Las personas menores de catorce años pueden utilizar el sitio web sin registrarse. Si se tiene conocimiento de que una persona menor de catorce años ha creado una cuenta, esta se eliminará.</p>

    <h2>9. Medidas de seguridad</h2>
    <p>Se aplican medidas técnicas y organizativas adecuadas al riesgo, entre ellas la comunicación cifrada (HTTPS) y reglas de acceso a la base de datos que limitan la lectura y la modificación de la información.</p>

    <h2>10. Modificaciones</h2>
    <p>Esta política se puede actualizar para adaptarla a cambios normativos o del servicio. La fecha de la última actualización figura en el encabezado.</p>`,

  cookies: () => `
    <h2>1. Qué son las cookies</h2>
    <p>Las cookies y las tecnologías similares, como el almacenamiento local del navegador, son archivos o registros que se guardan en el dispositivo de la persona usuaria cuando visita un sitio web. Permiten, entre otras finalidades, mantener la sesión, recordar preferencias u obtener información estadística.</p>

    <h2>2. Cookies y tecnologías utilizadas</h2>
    <div class="legal-table">
      <div class="lt-row head"><b>Nombre</b><b>Titular y tipo</b><b>Finalidad</b><b>Duración</b></div>
      <div class="lt-row"><code>r29n</code><span>Propia · técnica</span><span>Guardar el progreso del juego en el dispositivo.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-sound</code><span>Propia · preferencias</span><span>Recordar la preferencia de sonido.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-user</code><span>Propia · técnica</span><span>Mostrar el estado de la sesión al cargar el sitio web.</span><span>Hasta el cierre de la sesión</span></div>
      <div class="lt-row"><code>r29n-pacte</code><span>Propia · preferencias</span><span>Recordar el escenario del pactómetro.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-sim-save</code><span>Propia · técnica</span><span>Guardar la partida en curso del simulador.</span><span>Hasta que se acaba la partida o se elimina</span></div>
      <div class="lt-row"><code>r29n-onboard</code><span>Propia · preferencias</span><span>Recordar que ya se ha visto la presentación inicial de la app.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-esp</code><span>Propia · funcional</span><span>Guardar la última configuración del especial del 29N (fase y participación) para mostrarla enseguida.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-push</code><span>Propia · preferencias</span><span>Recordar si has activado las notificaciones y si has dicho «Ahora no» a la propuesta de activarlas.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-stats</code><span>Propia · estadística anónima</span><span>Guardar el día de la primera y de la última visita de este dispositivo y los contadores de uso pendientes de enviar (véase el punto 3). No contiene ningún identificador.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-install</code><span>Propia · preferencias</span><span>Recordar si ya has instalado la app o si no quieres que te lo volvamos a proponer.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>pej-v1</code><span>Propia · funcional</span><span>Memoria caché del service worker: copia de los archivos de la app para que cargue rápido y funcione sin conexión. No contiene datos personales.</span><span>Hasta la próxima versión</span></div>
      <div class="lt-row"><code>r29n-avis</code><span>Propia · funcional</span><span>Recordar que ya has visto el aviso de la Liga de pronósticos, para que no vuelva a salir.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-porra</code><span>Propia · preferencias</span><span>Guardar tu porra de escaños para el 29N. Solo se guarda en este dispositivo y no se publica.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-cafe</code><span>Propia · preferencias</span><span>Recordar cuándo se ha mostrado por última vez la invitación a hacer una aportación, para que no aparezca más de una vez cada cinco días.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-news</code><span>Propia · preferencias</span><span>Recordar los partidos y temas que sigues en Noticias, la hora de la última visita (para marcar los titulares nuevos) y si ya has visto «El día en 1 minuto».</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-debat</code><span>Propia · preferencias</span><span>Recordar el candidato y el partido que has creado en el simulador de debate.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-diari-intents</code><span>Propia · funcional</span><span>Contar las partidas del reto diario que has jugado hoy (para darte pruebas nuevas y, si procede, el límite de partidas).</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-ads</code><span>Propia · funcional</span><span>Recordar si hay vídeos de anunciantes y cómo están configurados. No contiene datos personales.</span><span>Hasta que se elimine</span></div>
      <div class="lt-row"><code>r29n-sim-prefs</code><span>Propia · preferencias</span><span>Recordar si ya se ha visto el tutorial del simulador.</span><span>Hasta que se elimine</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>r29n-consent</code><span>Propia · técnica</span><span>Guardar las preferencias sobre cookies.</span><span>12 meses</span></div>` : ""}
      <div class="lt-row"><code>pendingDuel</code>, <code>pendingLeague</code><span>Propia · sesión</span><span>Conservar un enlace de invitación durante el inicio de sesión.</span><span>Hasta el cierre de la pestaña</span></div>
      <div class="lt-row"><code>firebaseLocalStorageDb</code><span>Google (Firebase) · técnica</span><span>Mantener la sesión iniciada.</span><span>Hasta el cierre de la sesión</span></div>
      ${ANALYTICS_ON ? `<div class="lt-row"><code>_ga</code><span>Google · analítica</span><span>Distinguir visitantes con fines estadísticos.</span><span>2 años</span></div>
      <div class="lt-row"><code>_ga_&lt;ID&gt;</code><span>Google · analítica</span><span>Mantener el estado de la sesión de analítica.</span><span>2 años</span></div>
      <div class="lt-row"><code>firebase_installations</code><span>Google (Firebase) · analítica</span><span>Identificador de instalación asociado a la analítica.</span><span>Hasta que se elimine</span></div>` : ""}
    </div>
    <p><b>Cookies publicitarias, solo si pides un vídeo.</b> Mientras no pidas ningún vídeo, el sitio web no utiliza cookies publicitarias. Si el reto diario te ofrece una partida extra y pulsas «Mira el vídeo», Google (AdSense) puede guardar cookies como <code>__gads</code>, <code>__gpi</code>, <code>__eoi</code>, <code>IDE</code> i <code>FCCDCF</code> (esta última, para recordar el consentimiento), de acuerdo con su mensaje de consentimiento y su <a href="https://business.safety.google/adscookies/" target="_blank" rel="noopener">información sobre cookies</a>. Si no pides ningún vídeo, no se guarda ninguna.</p>
    <p>Las tipografías se alojan en el mismo servidor, de manera que su carga no implica ninguna conexión con terceros.</p>

    <h2>3. Base jurídica</h2>
    <p>Las cookies técnicas y de preferencias son necesarias para prestar el servicio solicitado y están exentas del deber de obtener consentimiento, de acuerdo con el artículo 22.2 de la LSSI-CE.${ANALYTICS_ON ? " Las cookies de analítica solo se instalan con el consentimiento previo de la persona usuaria." : ""}</p>
    <p><b>Estadística anónima propia.</b> Para saber qué partes de la app se utilizan y mejorarlas, cada visita suma 1 a unos contadores agregados por día (por ejemplo, «partidas de Adivina el año» o «visitas desde un móvil Android»). No se utiliza ninguna cookie ni identificador, no se guarda ninguna dirección IP ni ningún dato que permita saber quién es nadie, y no interviene ningún tercero: los contadores se guardan en la base de datos del propio servicio. Si no quieres que tus visitas cuenten, puedes desactivarlo: <button class="linklike" type="button" data-stats-toggle>${typeof Stats !== "undefined" && Stats.off() ? "Vuelve a contar mis visitas" : "No cuentes mis visitas"}</button>.</p>

    ${ANALYTICS_ON ? `<h2>4. Gestión del consentimiento</h2>
    <p>En el primer acceso se muestra un aviso que permite aceptar, rechazar o configurar las cookies de analítica. Rechazarlas no limita ninguna funcionalidad del sitio web. La elección se conserva durante doce meses y se puede modificar en cualquier momento desde el enlace <button class="linklike" data-open-consent>Configuración de cookies</button>, disponible también en el pie de página.</p>` : ""}

    <h2>${ANALYTICS_ON ? "5" : "4"}. Eliminación desde el navegador</h2>
    <p>Las cookies y los datos almacenados se pueden eliminar desde la configuración del navegador. Las instrucciones de los navegadores principales se pueden consultar en los enlaces siguientes: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a>, <a href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener">Mozilla Firefox</a>, <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">Safari</a> i <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a>. El progreso del juego también se puede borrar desde la sección Perfil.</p>

    <h2>${ANALYTICS_ON ? "6" : "5"}. Cookies de terceros en el inicio de sesión</h2>
    <p>El inicio de sesión con Google se hace en una ventana del propio proveedor, que puede instalar cookies propias de acuerdo con su <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">política de cookies</a>. Los enlaces a medios de comunicación llevan a sitios web con políticas de cookies propias.</p>`,

  termes: () => `
    <h2>1. Objeto y aceptación</h2>
    <p>Estas condiciones regulan el uso del sitio web Política en Joc y de los servicios asociados. El uso del sitio web o la creación de una cuenta comportan la aceptación de estas condiciones, del ${legalLink("avis-legal")} y de la ${legalLink("privacitat")}.</p>

    <h2>2. Descripción del servicio</h2>
    <p>El sitio web ofrece de manera gratuita juegos, contenidos formativos y herramientas de consulta sobre el sistema político y las elecciones generales. Los rankings, los niveles y las ligas tienen una finalidad exclusivamente lúdica y no comportan ningún premio ni contraprestación.</p>

    <h2>3. Registro y cuenta</h2>
    <p>Algunas funcionalidades, como el guardado del progreso en línea, los rankings, los duelos y las ligas, requieren iniciar sesión con una cuenta de Google. Para crear una cuenta hay que tener al menos catorce años. La persona usuaria es responsable del uso que se haga de su cuenta y la puede eliminar en cualquier momento desde la sección Perfil.</p>
    <p>Las monedas que se ganan jugando y los artículos de la tienda son igualmente ficticios: no se pueden comprar con dinero ni canjear, y las monedas que se añaden a la Liga de pronósticos se convierten en fichas.</p>
    <p>Las fichas de la Liga de pronósticos son una moneda ficticia del juego: no se pueden comprar ni vender, no tienen ningún valor económico y no se pueden canjear por dinero, bienes ni servicios. No se trata de ningún juego con premio ni de apuestas con contraprestación.</p>

    <h2>4. Normas de conducta</h2>
    <p>Se prohíbe, en particular:</p>
    <ul>
      <li>usar un nombre de usuario o una foto de perfil ofensivos, que suplanten a otras personas o que vulneren derechos de terceros (se pueden retirar sin aviso previo);</li>
      <li>publicar mensajes injuriosos, amenazadores, discriminatorios o que inciten al odio o a la violencia;</li>
      <li>difundir contenidos ilícitos, sexuales o que vulneren derechos de terceros;</li>
      <li>enviar publicidad o comunicaciones no solicitadas;</li>
      <li>compartir datos personales propios o de terceros;</li>
      <li>suplantar la identidad de otras personas;</li>
      <li>manipular puntuaciones, tiempos o resultados, o alterar el funcionamiento del servicio;</li>
      <li>acceder o intentar acceder a datos de otras personas usuarias.</li>
    </ul>

    <h2>5. Contenidos de las personas usuarias</h2>
    <p>Las personas usuarias conservan la titularidad de los mensajes que envían y conceden una licencia gratuita, no exclusiva y limitada a la prestación del servicio para almacenarlos y mostrarlos a las personas con quienes interactúan. Cada persona usuaria es responsable de los contenidos que publica.</p>

    <h2>6. Suspensión y cancelación</h2>
    <p>El titular puede retirar contenidos y suspender o cancelar cuentas que incumplan estas condiciones o la legislación vigente.</p>

    <h2>7. Propiedad intelectual</h2>
    <p>Los derechos sobre el código fuente, el diseño y los contenidos propios del sitio web corresponden al titular. Los contenidos de terceros se utilizan de acuerdo con las licencias que se indican en el apartado ${legalLink("credits")}.</p>

    <h2>8. Disponibilidad y modificaciones</h2>
    <p>El titular puede modificar, suspender o retirar funcionalidades, reiniciar rankings o eliminar contenidos por motivos técnicos, de seguridad o de organización del servicio, en particular una vez finalizado el proceso electoral.</p>

    <h2>9. Limitación de responsabilidad</h2>
    <p>El servicio se presta en el estado en que se encuentra en cada momento. En la medida en que lo permita la legislación aplicable, el titular no responde de la pérdida de datos de juego, de las interrupciones del servicio ni de los errores informativos. Esta limitación no afecta a los derechos que la normativa de consumidores y usuarios reconoce con carácter irrenunciable.</p>

    <h2>10. Contacto</h2>
    <p>Las consultas, las notificaciones de contenidos presuntamente ilícitos y las solicitudes relativas a estas condiciones se pueden dirigir a ${legalMail()}.</p>

    <h2>11. Legislación aplicable y jurisdicción</h2>
    <p>Estas condiciones se rigen por la legislación española. Cuando la persona usuaria tenga la condición de consumidora, serán competentes los juzgados y tribunales de su domicilio.</p>`,

  credits: () => {
    const photos = Object.entries(typeof PHOTOS !== "undefined" ? PHOTOS : {}).sort((a, b) => a[0].localeCompare(b[0], "es"));
    return `
    <h2>1. Fotografías</h2>
    <p>Las fotografías de personas proceden de Wikimedia Commons y se utilizan de acuerdo con las licencias que se indican. Los derechos corresponden a sus autores. Las solicitudes de retirada se pueden dirigir a ${legalMail()}.</p>
    <div class="legal-table credits">
      <div class="lt-row head"><b>Persona</b><b>Autoría</b><b>Licencia</b><b>Origen</b></div>
      ${photos.map(([name, p]) => `<div class="lt-row"><span>${esc(name)}</span><span>${esc(p.author || "—")}</span><span>${esc(p.license || "—")}</span><span><a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></span></div>`).join("")}
    </div>

    <h2>2. Datos y contenidos</h2>
    <ul>
      <li>Candidaturas, partidos y encuestas: <a href="https://es.wikipedia.org/wiki/Elecciones_generales_de_Espa%C3%B1a_de_2026" target="_blank" rel="noopener">Wikipedia</a> y su <a href="${typeof POLL_SOURCE === "string" ? POLL_SOURCE : "https://en.wikipedia.org"}" target="_blank" rel="noopener">recopilación de encuestas</a>, bajo la licencia <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ca" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Las cifras se han adaptado mediante medias y ajustes.</li>
      <li>Resultados electorales y procedimiento electoral: Ministerio del Interior, Junta Electoral Central, Congreso de los Diputados y Boletín Oficial del Estado.</li>
      <li>Población por provincias: Instituto Nacional de Estadística.</li>
      <li>Propuestas de los partidos: elaboración propia a partir de los programas electorales y de posiciones públicas. No se trata de textos oficiales de las formaciones.</li>
      <li>Citas: declaraciones públicas atribuidas a dirigentes políticos, con indicación del año y el contexto, con finalidad divulgativa.</li>
      <li>Titulares de prensa: pertenecen a los medios respectivos (El País, El Mundo, ABC, 20minutos, eldiario.es, infoLibre, El Español, El Debate, La Vanguardia, Europa Press, Ara, NacióDigital y VilaWeb). Solo se muestran el titular y el enlace.</li>
    </ul>

    <h2>3. Tipografías y tecnología</h2>
    <ul>
      <li>Tipografías Unbounded y DM Sans, bajo la licencia <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License 1.1</a>.</li>
      <li>Plató en 3D del simulador de debate: <a href="https://threejs.org" target="_blank" rel="noopener">Three.js</a>, bajo la licencia MIT.</li>
      <li>Mapa de circunscripciones del simulador: elaborado a partir de los datos cartográficos de <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>, de dominio público.</li>
      <li>Autenticación, base de datos y alojamiento: <a href="https://firebase.google.com" target="_blank" rel="noopener">Google Firebase</a>.</li>
      <li>Actualización automática de titulares: GitHub Actions.</li>
    </ul>`;
  },
};

// Ko-fi: només un enllaç (sense el seu widget, que carregaria codi i galetes de tercers).
// Si COFFEE_URL és buit, no es mostra enlloc.
const COFFEE_URL = "https://ko-fi.com/politicaenjoc";
const COFFEE_KEY = "r29n-cafe";
function coffeeLink(text = "Invítame a un café", cls = "") {
  return COFFEE_URL ? `<a class="coffee-link ${cls}" href="${COFFEE_URL}" target="_blank" rel="noopener">☕ ${text}</a>` : "";
}
// Línia discreta al resultat d'una partida: només si ha anat bé i, com a molt, un cop cada 5 dies
function coffeeResultNote(good) {
  if (!COFFEE_URL || !good) return "";
  const last = store.get(COFFEE_KEY, 0);
  if (Date.now() - last < 5 * 864e5) return "";
  store.set(COFFEE_KEY, Date.now());
  return `<p class="coffee-note">Política en Joc es gratuita. Si te lo has pasado bien, ${coffeeLink("invítame a un café")}.</p>`;
}


function legalFooter() {
  return `<footer class="site-foot">
    <p class="sf-line">Web no oficial. No tiene ningún vínculo con partidos, instituciones ni medios de comunicación.</p>
    ${COFFEE_URL ? `<p class="sf-line sf-coffee">Gratuita. Si te gusta, ${coffeeLink("invítame a un café")}.</p>` : ""}
    <p class="sf-line"><button class="linklike" type="button" data-report>🐞 Avisa de un error</button></p>
    <p class="sf-line sf-lang">${langLinks()}</p>
    <p class="sf-line sf-author">Hecha por <a href="https://x.com/emdicbru" target="_blank" rel="noopener">@emdicbru</a> · <a href="#premsa">Sala de prensa</a></p>
    <nav aria-label="Información legal">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}">${p.h}</a>`).join("")}${ANALYTICS_ON ? `<button class="linklike" data-open-consent>Configuración de cookies</button>` : ""}</nav>
  </footer>`;
}

function legalNote() {
  return `<p class="legal-note">El inicio de sesión implica la aceptación de las ${legalLink("termes")} y de la ${legalLink("privacitat")}, y la declaración de tener al menos 14 años.</p>`;
}

function renderLegal(slug) {
  const root = $("#legal-root");
  if (!root) return;
  const page = LEGAL_PAGES.find((p) => p.k === slug) || LEGAL_PAGES[0];
  root.innerHTML = `
    <nav class="legal-tabs" aria-label="Páginas legales">${LEGAL_PAGES.map((p) => `<a href="#legal/${p.k}" class="${p.k === page.k ? "on" : ""}">${p.t}</a>`).join("")}</nav>
    <article class="card legal">
      <p class="kicker">Última actualización: ${LEGAL.actualitzat}</p>
      <h1 class="page-title">${page.h}</h1>
      ${LEGAL_TEXT[page.k]()}
    </article>`;
}

document.getElementById("main")?.insertAdjacentHTML("afterend", legalFooter());
