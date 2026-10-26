# Política en Joc · posada en marxa

- **App publicada:** <https://politicaenjoc.cat> (l'adreça antiga, politica-en-joc.web.app, hi redirigeix)
- **Projecte de Firebase:** `politica-en-joc` · [consola](https://console.firebase.google.com/project/politica-en-joc/overview)
- **Base de dades:** Firestore a Europa (`eur3`), amb les regles de [firestore.rules](firestore.rules) desplegades.
- **Configuració de l'app:** [js/firebase-config.js](js/firebase-config.js). Els valors no són secrets: la seguretat la donen les regles.

## Pas pendent: activar l'inici de sessió amb Google
Google només permet fer-ho des de la consola, perquè crea un client OAuth:

1. Obre <https://console.firebase.google.com/project/politica-en-joc/authentication/providers>.
2. Si surt **Comença**, prem-lo.
3. **Google** → **Activa** → tria el teu correu com a correu d'assistència → **Desa**.

Els dominis `politica-en-joc.web.app`, `politica-en-joc.firebaseapp.com` i `localhost` ja hi queden autoritzats.

## Publicar canvis
Des d'aquesta carpeta:

```bash
node tools/publica.js
```

Abans, puja la versió (`?v=N`) de tots els fitxers a `index.html`. L'eina fa dues coses:

1. Puja els fitxers de l'app (js, css, tipografies, imatges, 3D) a GitHub Pages, a `https://emdicbru.github.io/politica-en-joc/r/<versió>/`, i espera que estiguin disponibles. Es guarden les 3 últimes versions.
2. Publica la web a Firebase Hosting amb un `index.html` que carrega aquests fitxers des de GitHub. Així Firebase gratuït (que només serveix uns 360 MB al dia) només envia la pàgina inicial, d'uns 8 KB per visita. L'adreça, la sessió, l'app instal·lada i les notificacions no canvien.

L'`index.html` de Firebase porta la integritat (SRI) de cada fitxer de GitHub i una política de seguretat de contingut (CSP) amb els hashes del codi incrustat: si algú canviés un fitxer a GitHub, el navegador no l'executaria. Si afegeixes un script extern nou (per exemple, Google Analytics), cal afegir-ne el domini a `securityHeaders()` de l'eina.

Si GitHub Pages fallés, l'app salta sola a `local.html`, que és la mateixa pàgina amb els fitxers servits per Firebase. Les dades (`data/`: titulars, quiz i resultats del 29N) també es llegeixen de GitHub Pages; les publica el flux `.github/workflows/pages.yml` del repositori.

Si has tocat les regles de Firestore: `npx firebase-tools deploy --only firestore:rules --project politica-en-joc`.

## Versió en castellà (/es/)
L'app s'escriu només en català. `tools/publica.js` en genera sola la versió en castellà a `politicaenjoc.cat/es/` amb el diccionari `i18n/es.json` (`"text en català": "texto en castellano"`). Les dues versions comparteixen el progrés, l'usuari i les dades; cada una té la seva pàgina, el seu manifest (s'instal·len per separat) i la seva partida desada del simulador.

- **Quan canvies o afegeixes textos:** `node tools/tradueix.js extreu` deixa a `i18n/es-pendents.json` els que encara no són al diccionari. Afegeix-los a `i18n/es.json` i publica. Si en queda algun sense traduir, `publica.js` ho avisa i aquell text surt en català a /es/.
- **Regles del diccionari:** `{}` és una interpolació (n'hi ha d'haver les mateixes que a l'original). Una traducció igual que l'original vol dir «no es tradueix» (noms propis, claus). Una paraula sola en minúscules que fa de clau interna (`"clau": true` a pendents) només es tradueix si la traducció comença amb `!`.
- **Glossari:** els enllaços `[[terme]]` de l'Aprèn han d'apuntar a un terme que existeixi traduït (per exemple, `[[mayoría absoluta]]`).
- **Per provar-la:** `node tools/tradueix.js construeix <carpeta>` hi escriu la versió en castellà (`index.html`, `manifest.webmanifest` i `js/`), que va dins d'`es/` al costat de l'app.
- **Què no es tradueix:** el Centre de control, el correu de premsa, els titulars dels mitjans i el quiz de l'actualitat de `data/quiz.json` (en castellà només hi surten les preguntes automàtiques). Les notificacions push es continuen enviant en català.
- **Idioma:** el selector és al peu de pàgina i a Perfil › Ajustos, i la tria es desa a `r29n-lang`. Sense tria, un navegador que prefereix el castellà al català entra a /es/.

## Provar-ho en local
```bash
npx serve .
```
i obre <http://localhost:3000>. Obrint `index.html` amb doble clic, l'app funciona però sense les funcions en línia.

## Què es guarda
- `users/{uid}`: nom i foto de Google, XP, nivell, rècords, assoliments i ratxa. Ho poden llegir els altres jugadors amb sessió (rànquing). El correu **no** es desa.
- `dailies/{data}/entries/{uid}`: el temps del primer intent del repte diari. No es pot modificar.
- `leagues/{codi}`: lligues d'amics (nom, propietari i membres). Cadascú només s'hi pot afegir a si mateix.
- `duels/{codi}`: els duels 1 vs 1. Cada jugador només pot escriure el seu propi progrés.

Abans de difondre-la, cal una política de privacitat: hi ha dades de comptes de Google i hi pot haver usuaris menors.

## Domini propi: politicaenjoc.cat
L'app ja està preparada: els textos legals, les metadades per compartir (`img/og.png`), `robots.txt`, `sitemap.xml` i l'inici de sessió ja fan servir el domini. Quan el tinguis comprat, segueix aquests passos per ordre:

1. **Connecta el domini a Firebase Hosting.** Consola de Firebase → Hosting → *Afegeix un domini personalitzat* → `politicaenjoc.cat`. Afegeix també `www.politicaenjoc.cat` i marca que redirigeixi a `politicaenjoc.cat`. Firebase et donarà uns registres DNS (A i TXT) per posar al proveïdor del domini. El certificat HTTPS es genera sol (pot trigar fins a 24 hores).
2. **Autoritza el domini per a l'inici de sessió.** Consola de Firebase → Authentication → Settings → *Dominis autoritzats* → afegeix `politicaenjoc.cat` i `www.politicaenjoc.cat`.
3. **Afegeix l'adreça de retorn de Google.** Google Cloud Console (projecte `politica-en-joc`) → APIs i serveis → Credencials → el client OAuth web → *URI de redirecció autoritzats* → afegeix `https://politicaenjoc.cat/__/auth/handler`. A `js/firebase-config.js`, quan l'app es carrega des del domini propi, l'inici de sessió ja passa per aquest domini.
4. **Comprova-ho** obrint <https://politicaenjoc.cat>: l'app es carrega i l'inici de sessió amb Google funciona.
5. **Activa la redirecció.** A `index.html`, canvia `REDIRECT = false` per `REDIRECT = true` i publica. A partir d'aleshores, `politica-en-joc.web.app` redirigeix a `politicaenjoc.cat`. Cada adreça té el seu propi emmagatzematge al navegador; per això la redirecció s'emporta el progrés local (XP, rècords, partides del simulador, preferències) i el desa al domini nou si allà encara no n'hi ha. Qui té usuari de Google recupera el progrés del núvol igualment. Les galetes d'analítica no es traslladen: el banner de consentiment torna a sortir.
6. **Opcional:** dona d'alta el domini a Google Search Console i envia-hi `https://politicaenjoc.cat/sitemap.xml`. Si vols una adreça de contacte del domini (per exemple, `hola@politicaenjoc.cat`), canvia `correu` a `js/legal.js`.

## Premsa: enviar notes de premsa des del Centre de control

Les notes de premsa s'escriuen al Centre de control (pestanya **Premsa**, només administradors) i les envia
GitHub Actions (`tools/premsa.js`, cada 5 minuts o a l'instant amb el token) amb el servei **Brevo**, des de
`hola@politicaenjoc.cat`. Cal fer-ho una sola vegada:

1. **Compte de Brevo** (gratuït, fins a 300 correus al dia): https://www.brevo.com → crea el compte.
2. **Autentica el domini** a Brevo: *Senders, Domains & Dedicated IPs → Domains → Add a domain* → `politicaenjoc.cat`.
   Brevo et donarà uns registres DNS (un `TXT` brevo-code, la clau DKIM i un `TXT` DMARC). Afegeix-los al panell DNS
   d'entorno (com vas fer amb el domini) i prem *Verify* a Brevo. Pot trigar unes hores.
3. **Remitent**: *Senders → Add a sender* → nom `Política en Joc`, adreça `hola@politicaenjoc.cat`. Amb el domini
   autenticat no cal que la bústia existeixi; si Brevo demana confirmar-la per correu, caldrà crear la bústia a entorno.
4. **Clau de l'API**: *SMTP & API → API Keys → Generate a new API key*. Copia-la.
5. **Desa-la a GitHub**: repositori `emdicbru/politica-en-joc` → *Settings → Secrets and variables → Actions →
   New repository secret* → nom `BREVO_KEY`, valor la clau. (El secret `FIREBASE_SA` ja hi és, el fan servir les notificacions.)

Quan estigui fet, el Centre de control › Premsa marcarà «Servei d'enviament: A punt» (en 5–15 minuts).

- Les respostes dels periodistes van a l'adreça de *Configuració › Les respostes van a* (de moment, el Gmail).
- Abans d'enviar una nota a tothom, envia't sempre una prova.
- Cada correu porta un enllaç de baixa; qui el fa servir ja no rep res més.
- Les notes enviades surten a la Sala de premsa pública: https://politicaenjoc.cat/#premsa

## Anuncis: un vídeo per jugar la 3a partida del repte diari

El repte diari es pot jugar 3 vegades al dia, cada partida amb proves noves; al rànquing compta el millor temps.
Amb el límit actiu (Centre de control › **Anuncis**), les 2 primeres són lliures i la 3a cal guanyar-la mirant un
vídeo d'un anunciant (Google AdSense, «H5 Games Ads»). El codi de Google només es carrega si algú prem «Mira el vídeo».

1. Crea el compte a https://adsense.google.com amb el web `politicaenjoc.cat`.
2. Escriu l'identificador (`ca-pub-…`) al Centre de control › Anuncis i deixa «Anuncis de prova».
3. `ads.txt`: demana a Claude que publiqui https://politicaenjoc.cat/ads.txt amb la línia que surt a la pestanya.
4. A AdSense: demana els anuncis per a jocs web (H5 Games Ads), crea el missatge de consentiment RGPD
   (*Privadesa i missatges*) i bloqueja les categories sensibles **Política**, Religió, Jocs d'atzar i Contingut sexual.
5. Quan AdSense aprovi la web: «Anuncis reals» i activa «2 partides + 3a amb vídeo».
