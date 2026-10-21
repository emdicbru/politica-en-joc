# Política en Joc · posada en marxa

- **App publicada:** <https://politica-en-joc.web.app>
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
npx firebase-tools deploy --project politica-en-joc
```

Si només has tocat l'app (no les regles): `--only hosting`.

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
