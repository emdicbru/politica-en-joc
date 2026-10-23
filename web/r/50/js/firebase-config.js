// Configuració de Firebase (projecte «politica-en-joc») per a les funcions en línia:
// inici de sessió amb Google, progrés al núvol, rànquing diari, lligues i duels 1 vs 1.
// Aquests valors no són secrets: és normal que siguin públics. La seguretat la donen
// les regles de Firestore (firestore.rules).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDdqhWL0BD5Py8kMW4_3puY2omDpg_NhF4",
  // Al domini propi, l'inici de sessió passa pel mateix domini (Firebase Hosting hi serveix /__/auth/): així funciona
  // també als navegadors que bloquegen les galetes de tercers, com Safari. A les adreces de Firebase, com fins ara.
  authDomain: /(^|\.)politicaenjoc\.com$/.test(location.hostname) ? location.hostname : "politica-en-joc.firebaseapp.com",
  projectId: "politica-en-joc",
  storageBucket: "politica-en-joc.firebasestorage.app",
  messagingSenderId: "339432287996",
  appId: "1:339432287996:web:0e7f05e2fba70796db3179",
  // ID de mesura de Google Analytics 4 (tipus "G-XXXXXXXXXX"). Mentre estigui buit no es mostra el banner ni es carrega res.
  measurementId: "G-PZWQFY3R43",
  // Clau pública (VAPID) de les notificacions push. És pública; la privada és un secret de GitHub (VAPID_PRIVATE).
  // La posa tools/push-setup.js. Mentre estigui buida, les notificacions no es poden activar.
  vapidKey: "BJczW68D4U462IgTUb3G-LuT2HJgLvypJSLAZ9WTrNbtrj02xNvU-2lT2DE_joPCv6SNnYJTzTvUKWSbK5LOr-A",
};
