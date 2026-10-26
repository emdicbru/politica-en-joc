#!/usr/bin/env node
// Versió en castellà de Política en Joc (politicaenjoc.cat/es/). L'app s'escriu en català i aquesta eina en genera la
// còpia en castellà a partir del diccionari i18n/es.json: { "text en català": "texto en castellano" }.
//
//   node tools/tradueix.js extreu              → i18n/es-pendents.json: els textos que encara no són al diccionari
//   node tools/tradueix.js construeix <carpeta> → <carpeta>/: index.html, manifest i js/ en castellà (es/ a la web)
//
// Com es tradueix: es llegeix el codi (acorn) i només es canvien els textos que es veuen. De les plantilles i les
// cadenes amb HTML, el text entre etiquetes i els atributs placeholder, title, aria-label i alt; les interpolacions
// ${…} es representen amb {} al diccionari. Una paraula sola en minúscules només es tradueix quan es mostra (dins d'una
// plantilla, concatenada amb text o en una propietat de text), perquè sovint és una clau ("dia", "lliure"…).
// Si un text no és al diccionari, es queda en català i surt a la llista de pendents.
"use strict";
const fs = require("fs"), path = require("path");
const acorn = require("./vendor/acorn.js");

const ROOT = path.join(__dirname, "..");
const DICT_F = path.join(ROOT, "i18n", "es.json");
// Fitxers que no es tradueixen: el Centre de control (només l'equip) i el correu de premsa
const KEEP = new Set(["js/control.js", "js/control-premsa.js", "js/control-anuncis.js", "js/usuaris.js", "js/premsa-mail.js", "js/firebase-config.js"]);
const ATTR_RE = /\b(placeholder|title|aria-label|alt)="([^"]*)"/g;
const DISPLAY_KEYS = new Set(["title", "label", "text", "desc", "name", "short", "lead", "q", "sub", "unit", "verdict", "msg", "info", "exp", "note", "kicker", "caption", "help", "hint", "tip", "intro", "body", "summary", "tagline", "rules", "opts", "options", "answer", "meta", "what", "why"]);
const LOCALE_FNS = new Set(["localeCompare", "toLocaleString", "toLocaleDateString", "toLocaleTimeString"]);

function appFiles() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const files = [...html.matchAll(/<script[^>]*src="(js\/[^"?]+)/g)].map((m) => m[1]);
  for (const f of fs.readdirSync(path.join(ROOT, "js", "debat"))) if (f.endsWith(".js") && !files.includes(`js/debat/${f}`)) files.push(`js/debat/${f}`);
  return files.filter((f) => fs.existsSync(path.join(ROOT, f)));
}

// ---------- Què és un text per traduir ----------
const norm = (s) => s.replace(/\s+/g, " ").trim();
function isText(core, html) {
  const bare = core.trim(), t = bare.replace(/\{\}/g, " ").replace(/\s+/g, " ").trim();
  const sp = /\s/.test(bare);
  if (t.length < 2 || !/[a-zà-ÿ]{2}/i.test(t)) return false;
  if (/^(ca|es|en|fr|de|it|pt)$/.test(bare) || /^[a-z]{2}-[A-Z]{2}$/.test(bare) || /^[A-Z][a-z]+\/[A-Z][A-Za-z_]+$/.test(bare)) return false; // llengües i zones horàries
  if (!sp && /^(https?:|data:|mailto:|#|\.{0,2}\/)/.test(bare)) return false; // adreces i rutes
  if (/^[\d\s.,:;%+\-−×/()·€$#?!'"=<>{}]+$/.test(bare)) return false;
  if (!html && !sp && (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(bare) || /^[a-z]+[A-Z][A-Za-z0-9]*$/.test(bare))) return false; // claus i camelCase (fora del text d'una plantilla)
  if (/[{;]\s*$/.test(bare) && /:/.test(bare)) return false; // CSS
  if (/^[MLCQAZHVmlcqazhv]\s*-?\d/.test(bare)) return false; // camins SVG
  // Sense espais, amb símbols de codi i sense accents: selectors, rutes, claus ([data-nav], .ap-x, data/, h23, a,b)
  if (!sp && /[.#[\]/=,:_0-9>*]/.test(bare.replace(/[:.…!?]+$/, "")) && !/[à-ÿÀ-ß·]/.test(bare)) return false;
  if (/(^|[\s,(])[.#][a-z][\w-]*/.test(bare) || /(?<!\[)\[[a-z-]+(=[^\]]*)?\](?!\])|:not\(|::?(before|after|hover)/.test(bare)) return false; // selectors (no els [[enllaços]] del glossari)
  if (/^\((prefers|display-mode|max-width|min-width|hover|pointer|orientation)/.test(bare)) return false; // media queries
  if (/^(translate|rotate|scale|matrix|skew|rgba?|hsla?|var|calc|url|cubic-bezier|linear-gradient|radial-gradient)\(/.test(bare)) return false; // CSS i SVG
  if (/^[\w-]+\.(js|css|json|png|webp|svg|jpg|ics|txt|html|bin)(\?.*)?$/.test(bare)) return false; // noms de fitxer
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(bare)) return false; // adreces de correu
  if (/^<!--/.test(bare)) return false;
  return true;
}
const loneWord = (core) => /^[a-zà-ÿ·'’-]+$/.test(core.trim()); // una paraula en minúscules

// Aplica fn a cada text d'una cadena (amb HTML o sense). fn(core) → traducció o null. Les interpolacions són \0.
function mapText(s, fn) {
  const html = /<\/?[a-z][^>]*>/i.test(s);
  const unit = (part, isHtml) => {
    const m = part.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2]) return part;
    const key = (isHtml ? norm(m[2]) : m[2]).replace(/\u0000/g, "{}");
    const tr = isText(key, isHtml) ? fn(key) : null;
    return tr == null ? part : m[1] + tr.replace(/\{\}/g, "\u0000") + m[3];
  };
  if (!html) return unit(s, false);
  return s.split(/(<[^>]*>)/).map((p, i) => (i % 2 ? p.replace(ATTR_RE, (all, a, v) => {
    const tr = isText(v.replace(/\u0000/g, "{}")) ? fn(norm(v).replace(/\u0000/g, "{}")) : null;
    return tr == null ? all : `${a}="${tr.replace(/\{\}/g, "\u0000").replace(/"/g, "&quot;")}"`;
  }) : unit(p, true))).join("");
}

// ---------- Recorregut del codi ----------
function walk(node, parents, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parents);
  parents.push(node);
  for (const k in node) {
    if (k === "loc" || k === "start" || k === "end") continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && walk(c, parents, visit));
    else if (v && typeof v.type === "string") walk(v, parents, visit);
  }
  parents.pop();
}
// Una paraula sola en minúscules només es tradueix si es mostra
function displayContext(parents) {
  for (let i = parents.length - 1; i >= 0; i--) {
    const p = parents[i];
    if (p.type === "TemplateLiteral") return true;
    if (p.type === "BinaryExpression") return p.operator === "+";
    if (p.type === "Property") return !p.computed && DISPLAY_KEYS.has(p.key.name || p.key.value);
    if (p.type === "ConditionalExpression" || p.type === "LogicalExpression" || p.type === "ArrayExpression" && false) continue;
    if (p.type === "CallExpression") return ["toast", "esc", "rich", "h"].includes(p.callee.name);
    return false;
  }
  return false;
}

function translateSource(src, file, dict, seen) {
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: /online|debat-plato|debat-gent/.test(file) ? "module" : "script", allowHashBang: true });
  const edits = [];
  const look = (key, lone, parents) => {
    const asKey = lone && loneWord(key) && !displayContext(parents);
    seen?.(key, file, asKey);
    const tr = dict[key];
    if (typeof tr !== "string") return null;
    if (asKey && !tr.startsWith("!")) return null;
    const out = tr.startsWith("!") ? tr.slice(1) : tr;
    return out !== key ? out : null;
  };
  walk(ast, [], (n, parents) => {
    const parent = parents[parents.length - 1];
    if (n.type === "Property" && !n.computed && !n.shorthand && n.kind === "init") {
      const k = n.key.type === "Identifier" ? n.key.name : typeof n.key.value === "string" ? n.key.value : null;
      const tr = k && /^[A-ZÀ-Ú]/.test(k) && typeof dict[k] === "string" ? dict[k].replace(/^!/, "") : null;
      if (tr && tr !== k) edits.push([n.key.start, n.key.end, JSON.stringify(tr)]);
    }
    if (n.type === "Literal" && typeof n.value === "string") {
      if (parent && (parent.type === "ImportDeclaration" || parent.type === "ExportNamedDeclaration" || parent.type === "ExportAllDeclaration" || parent.type === "ImportExpression")) return;
      if (parent?.type === "Property" && parent.key === n) return;
      if (n.value === "use strict") return;
      // Format de dates i ordenació: català → castellà
      if (n.value === "ca-ES") { edits.push([n.start, n.end, JSON.stringify("es-ES")]); return; }
      if (n.value === "ca" && parent?.type === "CallExpression" && (LOCALE_FNS.has(parent.callee.property?.name) || parent.callee.object?.name === "Intl")) { edits.push([n.start, n.end, '"es"']); return; }
      if (n.value === "ca" && parent?.type === "NewExpression" && parent.callee.object?.name === "Intl") { edits.push([n.start, n.end, '"es"']); return; }
      const out = mapText(n.value, (k) => look(k, true, parents));
      if (out !== n.value) {
        const q = src[n.start];
        const body = out.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(new RegExp(q, "g"), `\\${q}`);
        edits.push([n.start, n.end, q + body + q]);
      }
    }
    if (n.type === "TemplateLiteral") {
      if (parent?.type === "TaggedTemplateExpression") return;
      const joined = n.quasis.map((q) => q.value.cooked ?? q.value.raw).join("\u0000");
      const out = mapText(joined, (k) => look(k, false, parents));
      if (out === joined) return;
      const parts = out.split("\u0000");
      if (parts.length !== n.quasis.length) { console.warn(`Avís: ${file}: una traducció no té les mateixes {} que l'original; es deixa en català`); return; }
      n.quasis.forEach((q, i) => {
        if (parts[i] === (q.value.cooked ?? q.value.raw)) return;
        edits.push([q.start, q.end, parts[i].replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")]);
      });
    }
  });
  edits.sort((a, b) => b[0] - a[0]);
  let res = src;
  for (const [a, b, t] of edits) res = res.slice(0, a) + t + res.slice(b);
  return res;
}

// ---------- index.html ----------
function translateHtml(html, dict, seen) {
  const look = (k) => { seen?.(k, "index.html"); const tr = dict[k]; return typeof tr === "string" && tr !== k ? tr : null; };
  // Només el cos visible i els meta de la pàgina; els scripts no es toquen
  let out = html.replace(/<html lang="ca">/, '<html lang="es">');
  out = out.replace(/(<meta (?:name="description"|property="og:(?:title|description)"|name="twitter:(?:title|description)") content=")([^"]+)(")/g, (m, a, v, b) => a + (look(norm(v)) ?? v) + b);
  out = out.replace(/<title>([^<]+)<\/title>/, (m, t) => `<title>${look(norm(t)) ?? t}</title>`);
  const body = out.indexOf("<body"), end = out.lastIndexOf("</body>");
  const segs = out.slice(body, end).split(/(<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>|<style[\s\S]*?<\/style>)/);
  const tr = segs.map((s, i) => (i % 2 ? s : mapText(s, look))).join("");
  return out.slice(0, body) + tr + out.slice(end);
}

// ---------- Rutes de /es/ ----------
// La versió en castellà viu a /es/ i només hi té els fitxers traduïts (index.html, js/ i el manifest). La resta (css,
// tipografies, imatges, 3D, dades, el service worker) és la de la versió catalana, un nivell més amunt.
const ES_FIXES = {
  "index.html": [
    [/(href|src)="(css|fonts|img)\//g, '$1="../$2/'],
    [/"\.\/js\/vendor\//g, '"../js/vendor/'],
    ['<link rel="canonical" href="https://politicaenjoc.cat/">', '<link rel="canonical" href="https://politicaenjoc.cat/es/">'],
    ['<meta property="og:url" content="https://politicaenjoc.cat/">', '<meta property="og:url" content="https://politicaenjoc.cat/es/">'],
    ['<meta property="og:locale" content="ca_ES">', '<meta property="og:locale" content="es_ES">'],
  ],
  "js/app.js": [['register("sw.js")', 'register("../sw.js")']],
  "js/control.js": [['src="img/', 'src="../img/']],
  "js/debat/debat-gent.js": [['"../../assets/gent/"', '"../../../assets/gent/"']],
};
function esPaths(f, s) {
  for (const [a, b] of ES_FIXES[f] || []) {
    const out = s.replace(a, b);
    if (out === s) throw new Error(`${f}: no trobo «${a}» per adaptar-lo a /es/`);
    s = out;
  }
  return s.replace(/(\|\|\s*)"data\/"/g, '$1"../data/"'); // window.PEJ_DATA || "data/"
}
function esManifest(dict) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));
  const tr = (s) => (typeof dict[s] === "string" ? dict[s].replace(/^!/, "") : s);
  const icon = (i) => ({ ...i, src: "../" + i.src });
  return JSON.stringify({ ...m, lang: "es", description: tr(m.description), icons: m.icons.map(icon), shortcuts: (m.shortcuts || []).map((s) => ({ ...s, name: tr(s.name), icons: (s.icons || []).map(icon) })) }, null, 2) + "\n";
}

function loadDict() { try { return JSON.parse(fs.readFileSync(DICT_F, "utf8")); } catch { return {}; } }

// Escriu la versió en castellà a outDir (index.html, manifest.webmanifest i js/). Torna el nombre de fitxers.
function build(outDir, dict = loadDict(), seen) {
  if (ROOT.startsWith(path.resolve(outDir))) throw new Error(`No escric la versió en castellà a ${outDir}: esborraria l’app`);
  fs.rmSync(outDir, { recursive: true, force: true });
  const files = appFiles();
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    const out = esPaths(f, KEEP.has(f) ? src : translateSource(src, f, dict, seen));
    fs.mkdirSync(path.dirname(path.join(outDir, f)), { recursive: true });
    fs.writeFileSync(path.join(outDir, f), out);
  }
  fs.writeFileSync(path.join(outDir, "index.html"), esPaths("index.html", translateHtml(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), dict, seen)));
  fs.writeFileSync(path.join(outDir, "manifest.webmanifest"), esManifest(dict));
  return files.length + 2;
}

if (require.main === module) {
  const [cmd, outDir] = process.argv.slice(2);
  const dict = loadDict();
  if (cmd === "extreu") {
    const found = new Map();
    const keys = new Set(), shown = new Set();
    const seen = (k, f, asKey) => { if (!found.has(k)) found.set(k, new Set()); found.get(k).add(f); (asKey ? keys : shown).add(k); };
    for (const f of appFiles()) if (!KEEP.has(f)) translateSource(fs.readFileSync(path.join(ROOT, f), "utf8"), f, {}, seen);
    translateHtml(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {}, seen);
    // «clau»: paraula sola que només surt fora de text (pot ser una clau interna): es tradueix només amb «!»
    const pend = [...found].filter(([k]) => !(k in dict)).map(([k, fs2]) => ({ t: k, f: [...fs2].join(","), ...(keys.has(k) && !shown.has(k) ? { clau: true } : {}) }));
    fs.writeFileSync(path.join(ROOT, "i18n", "es-pendents.json"), JSON.stringify(pend, null, 1));
    const unused = Object.keys(dict).filter((k) => !found.has(k));
    console.log(`${found.size} textos a l'app · ${Object.keys(dict).length} al diccionari · ${pend.length} pendents · ${unused.length} que ja no surten`);
  } else if (cmd === "construeix" && outDir) {
    const missing = new Set();
    const seen = (k) => { if (!(k in dict)) missing.add(k); };
    const n = build(outDir, dict, seen);
    console.log(`Versió en castellà a ${outDir}: ${n} fitxers${missing.size ? ` · ${missing.size} textos sense traduir (en català)` : ""}`);
  } else {
    console.log("Ús: node tools/tradueix.js extreu | construeix <carpeta>");
  }
}
module.exports = { translateSource, translateHtml, appFiles, loadDict, build, KEEP };
