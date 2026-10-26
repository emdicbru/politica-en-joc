#!/usr/bin/env node
// Publica Política en Joc en dos llocs, perquè el pla gratuït de Firebase no es quedi sense trànsit:
//  1. GitHub Pages (gratuït, molt més marge): tots els fitxers de l'app (js, css, tipografies, imatges, 3D) a
//     https://emdicbru.github.io/politica-en-joc/r/<versió>/. Cada versió té la seva carpeta i no canvia mai; se'n
//     guarden les 3 últimes. Les dades (data/: titulars, quiz, resultats del 29N) les publica el mateix repositori.
//  2. Firebase Hosting: tota la web, com sempre (si GitHub fallés, l'app hi torna sola), però amb un index.html que
//     carrega els fitxers des de GitHub Pages. Així l'adreça, la sessió, l'app instal·lada i les notificacions no canvien
//     i Firebase només serveix la pàgina inicial, que és petita.
//  3. La versió en castellà (/es/ i r/<versió>/es/), que es genera aquí mateix amb tools/tradueix.js.
//
// Ús:   node tools/publica.js [--src <carpeta>] [--firebase <ordre firebase>] [--nomes-github] [--nomes-firebase]
// La versió és la ?v=N de l'index.html. L'accés a GitHub és el del git d'aquest ordinador (git credential).
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto"), os = require("os");
const { execSync } = require("child_process");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes("--" + k);
const ROOT = path.join(__dirname, "..");
const SRC = path.resolve(arg("src", ROOT));
const FIREBASE = arg("firebase", "firebase");
const REPO = "emdicbru/politica-en-joc", BRANCH = "main";
const SITE = "https://emdicbru.github.io/politica-en-joc/";
const KEEP = 3;
const RELEASE_DIRS = ["js", "css", "fonts", "assets", "img"];
const HOST_SKIP = [/^tools\//, /^i18n\//, /(^|\/)\./, /node_modules/, /README\.md$/, /^firebase(\.[a-z]+)?\.json$/, /^firestore\.rules$/, /^CONFIGURACIO\.md$/, /\.bat$/];

const html = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
const V = Number((html.match(/\?v=(\d+)"/) || [])[1]);
if (!V) throw new Error("No trobo la versió (?v=N) a index.html");
const CDN = `${SITE}r/${V}/`;
const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);

// Versió en castellà (/es/): la genera tools/tradueix.js a partir del diccionari i18n/es.json. Hi ha index.html,
// manifest.webmanifest i js/ traduïts; la resta (css, imatges, 3D, dades, service worker) és la de la versió catalana.
const ES_DIR = path.join(os.tmpdir(), `pej-es-${V}`);
const ES_CDN = `${CDN}es/`;
let esHtml = null;
function buildEs() {
  if (path.resolve(SRC) !== path.resolve(ROOT)) throw new Error("La versió en castellà es genera des de la carpeta de l'app (sense --src)");
  const tr = require("./tradueix.js"), dict = tr.loadDict(), missing = new Set();
  const n = tr.build(ES_DIR, dict, (k) => { if (!(k in dict)) missing.add(k); });
  esHtml = fs.readFileSync(path.join(ES_DIR, "index.html"), "utf8");
  log(`Castellà: ${n} fitxers traduïts${missing.size ? ` · AVÍS: ${missing.size} textos sense traduir surten en català (node tools/tradueix.js extreu)` : ""}`);
}

function walk(dir, rel = "", out = []) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (HOST_SKIP.some((re) => re.test(r))) continue;
    if (e.isDirectory()) walk(dir, r, out); else out.push(r);
  }
  return out;
}

// ---------- index.html per a Firebase: els fitxers vénen de GitHub Pages ----------
// Si algun no carrega (GitHub caigut o bloquejat), la sessió salta a local.html, que és l'index.html de sempre amb els
// fitxers servits per Firebase.
// Per a /es/: cdn = ES_CDN i dir = ES_DIR (els js traduïts); css, tipografies i mòduls de vendor són els comuns.
function cdnIndex(src, { cdn = CDN, dir = SRC } = {}) {
  const loader = `<script>
    // Fitxers de l'app des de GitHub Pages (tools/publica.js). Si no carreguen, es passa a local.html (fitxers de Firebase).
    window.PEJ_CDN = ${JSON.stringify(cdn)};
    window.PEJ_DATA = ${JSON.stringify(SITE + "data/")};
    window.pejFail = function () {
      try { if (sessionStorage.getItem("pej-local")) return; sessionStorage.setItem("pej-local", "1"); } catch (e) { /* sense emmagatzematge */ }
      location.replace("local.html" + location.search + location.hash);
    };
  </script>`;
  // Integritat (SRI): el navegador només executa el fitxer si és exactament el que s'ha publicat. Si algú canviés un
  // fitxer a GitHub, no s'executaria i la sessió passaria als fitxers de Firebase.
  const sri = (f, d = SRC) => `sha384-${crypto.createHash("sha384").update(fs.readFileSync(path.join(d, f.split("?")[0]))).digest("base64")}`;
  const at = (f, d) => ` integrity="${sri(f, d)}" crossorigin="anonymous" onerror="pejFail()"`;
  let out = src, n = 0;
  // Import map del 3D, amb la integritat de tots els mòduls (els navegadors que no ho entenen ho ignoren)
  out = out.replace(/<script type="importmap">([\s\S]*?)<\/script>/, (m, body) => {
    n++;
    const map = JSON.parse(body.replace(/"\.{1,2}\/js\//g, `"${CDN}js/`));
    map.integrity = {};
    walk(SRC).filter((r) => /^js\/vendor\/.*\.js$/.test(r)).forEach((r) => { map.integrity[CDN + r] = sri(r); });
    walk(dir).filter((r) => /^js\/debat\/.*\.js$/.test(r)).forEach((r) => { map.integrity[cdn + r] = sri(r, dir); });
    return `<script type="importmap">${JSON.stringify(map)}</script>`;
  });
  out = out.replace(/<link rel="stylesheet" href="(?:\.\.\/)?(css\/[^"]+)">/g, (m, h) => { n++; return `<link rel="stylesheet" href="${CDN}${h}"${at(h)}>`; });
  out = out.replace(/<link rel="preload" href="(?:\.\.\/)?(fonts\/[^"]+)"([^>]*)>/g, (m, h, rest) => { n++; return `<link rel="preload" href="${CDN}${h}"${rest.replace(/\s*crossorigin(="[^"]*")?/, "")} crossorigin="anonymous">`; });
  out = out.replace(/<script( type="module")? src="(js\/[^"]+)"><\/script>/g, (m, mod, f) => { n++; return `<script${mod || ""} src="${cdn}${f}"${at(f, dir)}></script>`; });
  if (n < 10) throw new Error(`Només he trobat ${n} fitxers a index.html: alguna cosa ha canviat`);
  // El carregador va just abans de l'import map (el primer fitxer)
  const first = out.indexOf('<script type="importmap">');
  out = out.slice(0, first) + loader + "\n  " + out.slice(first);
  return { html: out, n };
}

// ---------- GitHub (API, sense clonar) ----------
let TOKEN = null;
function token() {
  if (TOKEN) return TOKEN;
  const out = execSync("git credential fill", { input: "protocol=https\nhost=github.com\n\n", env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" } }).toString();
  TOKEN = (out.match(/^password=(.*)$/m) || [])[1];
  if (!TOKEN) throw new Error("No hi ha accés a GitHub en aquest ordinador (git credential)");
  return TOKEN;
}
async function gh(p, opt = {}) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://api.github.com/repos/${REPO}${p}`, { ...opt, headers: { Authorization: `Bearer ${token()}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" } });
    if (r.ok) return r.status === 204 ? null : r.json();
    const txt = await r.text();
    if (i < 3 && r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
    const e = new Error(`GitHub ${r.status} ${p}: ${txt.slice(0, 200)}`); e.status = r.status; throw e;
  }
}
const blobSha = (buf) => crypto.createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");

async function publishGithub() {
  // [ruta dins de la versió, fitxer]: l'app i, a es/, els js traduïts
  const list = [
    ...walk(SRC).filter((r) => RELEASE_DIRS.includes(r.split("/")[0])).map((r) => [r, path.join(SRC, r)]),
    ...walk(ES_DIR).filter((r) => r.startsWith("js/")).map((r) => [`es/${r}`, path.join(ES_DIR, r)]),
  ];
  const files = list.map(([r]) => r);
  log(`GitHub Pages: versió ${V}, ${files.length} fitxers`);
  for (let attempt = 1; ; attempt++) {
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const head = await gh(`/git/commits/${ref.object.sha}`);
    const tree = await gh(`/git/trees/${head.tree.sha}?recursive=1`);
    if (tree.truncated) throw new Error("L'arbre del repositori és massa gran per llegir-lo d'un cop");
    const known = new Set(tree.tree.filter((t) => t.type === "blob").map((t) => t.sha));
    const entries = [];
    let up = 0;
    for (const [r, abs] of list) {
      const buf = fs.readFileSync(abs);
      let sha = blobSha(buf);
      if (!known.has(sha)) {
        sha = (await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: buf.toString("base64"), encoding: "base64" }) })).sha;
        known.add(sha); up++;
      }
      entries.push({ path: `web/r/${V}/${r}`, mode: "100644", type: "blob", sha });
    }
    // Només es guarden les últimes versions
    const vers = [...new Set(tree.tree.map((t) => (t.path.match(/^web\/r\/(\d+)\//) || [])[1]).filter(Boolean).map(Number))].filter((x) => x !== V).sort((a, b) => b - a);
    const drop = vers.slice(KEEP - 1);
    for (const t of tree.tree) {
      const m = t.path.match(/^web\/r\/(\d+)\//);
      if (t.type === "blob" && m && (drop.includes(Number(m[1])) || (Number(m[1]) === V && !files.includes(t.path.slice(`web/r/${V}/`.length))))) entries.push({ path: t.path, mode: "100644", type: "blob", sha: null });
    }
    const nt = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree: entries }) });
    if (nt.sha === head.tree.sha) { log("GitHub Pages: aquesta versió ja hi era"); return; }
    const c = await gh("/git/commits", { method: "POST", body: JSON.stringify({ message: `Publica la versió ${V} de l'app`, tree: nt.sha, parents: [head.sha] }) });
    try {
      await gh(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: c.sha, force: false }) });
      log(`GitHub Pages: pujats ${up} fitxers nous${drop.length ? `, retirades les versions ${drop.join(", ")}` : ""}`);
      return;
    } catch (e) {
      if (e.status === 422 && attempt < 5) { log("Algú ha publicat alhora (els titulars); ho torno a provar"); continue; }
      throw e;
    }
  }
}
async function waitPages() {
  const probe = [["js/core.js", path.join(SRC, "js/core.js")], ["css/styles.css", path.join(SRC, "css/styles.css")], ["es/js/core.js", path.join(ES_DIR, "js/core.js")]].map(([f, abs]) => [f, fs.readFileSync(abs)]);
  for (let i = 0; i < 60; i++) {
    const ok = await Promise.all(probe.map(async ([f, buf]) => {
      try { const r = await fetch(`${CDN}${f}?espera=${Date.now()}`, { cache: "no-store" }); return r.ok && Buffer.compare(Buffer.from(await r.arrayBuffer()), buf) === 0; } catch { return false; }
    }));
    if (ok.every(Boolean)) { log("GitHub Pages: ja es pot descarregar"); return; }
    if (i === 0) log("Esperant que GitHub Pages publiqui la versió (sol trigar un minut)…");
    await new Promise((s) => setTimeout(s, 10000));
  }
  throw new Error("GitHub Pages no ha publicat la versió en 10 minuts. No toco Firebase: la web continua com estava.");
}

// ---------- Firebase ----------
function publishFirebase() {
  const out = path.join(os.tmpdir(), `pej-web-${V}`);
  fs.rmSync(out, { recursive: true, force: true });
  for (const r of walk(SRC)) { fs.mkdirSync(path.dirname(path.join(out, r)), { recursive: true }); fs.copyFileSync(path.join(SRC, r), path.join(out, r)); }
  const { html: idx, n } = cdnIndex(html);
  fs.writeFileSync(path.join(out, "index.html"), idx);
  fs.writeFileSync(path.join(out, "local.html"), html); // còpia de rescat amb els fitxers de Firebase
  // /es/: els js traduïts, el manifest i les dues pàgines (amb fitxers de GitHub Pages i de rescat)
  for (const r of walk(ES_DIR)) { if (r === "index.html") continue; fs.mkdirSync(path.dirname(path.join(out, "es", r)), { recursive: true }); fs.copyFileSync(path.join(ES_DIR, r), path.join(out, "es", r)); }
  const { html: esIdx } = cdnIndex(esHtml, { cdn: ES_CDN, dir: ES_DIR });
  fs.writeFileSync(path.join(out, "es", "index.html"), esIdx);
  fs.writeFileSync(path.join(out, "es", "local.html"), esHtml);
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8"));
  cfg.hosting.public = ".";
  const mf = (cfg.hosting.headers || []).find((x) => x.source === "/manifest.webmanifest");
  cfg.hosting.headers = [...(cfg.hosting.headers || []), ...(mf ? [{ ...mf, source: "/es/manifest.webmanifest" }] : []), ...securityHeaders([idx, html, esIdx, esHtml])];
  delete cfg.firestore;
  fs.writeFileSync(path.join(out, "firebase.json"), JSON.stringify(cfg, null, 2));
  log(`Firebase: index.html amb ${n} fitxers des de GitHub Pages; publicant…`);
  execSync(`"${FIREBASE}" deploy --only hosting --project politica-en-joc --non-interactive --config "${path.join(out, "firebase.json")}"`, { cwd: out, stdio: "inherit" });
  log("Firebase: fet");
}

// ---------- Capçaleres de seguretat ----------
// Política de contingut (CSP): només s'executa el codi de la web, de GitHub Pages (els fitxers de l'app), de Google
// (Firebase i l'inici de sessió) i els blocs incrustats que són exactament aquests (hash). La web no es pot posar dins
// d'una altra pàgina (frame-ancestors). Només a les pàgines (index.html i local.html), no a les de l'inici de sessió (/__/).
function securityHeaders(pages) {
  const h = (t) => `'sha256-${crypto.createHash("sha256").update(t, "utf8").digest("base64")}'`;
  const inline = new Set();
  pages.forEach((p) => { for (const m of p.matchAll(/<script(?: type="importmap")?>([\s\S]*?)<\/script>/g)) inline.add(h(m[1])); });
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${SITE.replace(/\/politica-en-joc\/$/, "")} https://www.gstatic.com https://apis.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com ${[...inline].join(" ")} 'unsafe-hashes' ${h("pejFail()")}`,
    `style-src 'self' 'unsafe-inline' ${SITE.replace(/\/politica-en-joc\/$/, "")}`,
    `font-src 'self' data: ${SITE.replace(/\/politica-en-joc\/$/, "")}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob:",
    "connect-src 'self' https: wss:",
    "frame-src https://politica-en-joc.firebaseapp.com https://accounts.google.com https://apis.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const page = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
  ];
  const all = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
  return [{ source: "/", headers: page }, { source: "/es", headers: page }, { source: "/es/", headers: page }, { source: "**/*.html", headers: page }, { source: "**", headers: all }];
}

module.exports = { cdnIndex, securityHeaders };
if (require.main === module) {
  (async () => {
    buildEs();
    if (!flag("nomes-firebase")) { await publishGithub(); await waitPages(); }
    if (!flag("nomes-github")) publishFirebase();
    log(`Publicada la versió ${V}.`);
  })().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
}
