// Llegeix els RSS de diversos mitjans i desa a data/news.json NOMÉS el titular, el mitjà, la data i l'enllaç.
// No es copia cap text ni imatge: l'app només mostra el titular com a enllaç cap a la web del mitjà.
// Ús: node tools/update-news.js   (i després: firebase deploy --only hosting)
const fs = require("fs");
const path = require("path");

const FEEDS = [
  { s: "El País", u: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada", filter: true },
  { s: "El Mundo", u: "https://e00-elmundo.uecdn.es/elmundo/rss/espana.xml", filter: true },
  { s: "ABC", u: "https://www.abc.es/rss/2.0/espana/", filter: true },
  { s: "20minutos", u: "https://www.20minutos.es/rss/nacional/", filter: true },
  { s: "eldiario.es", u: "https://www.eldiario.es/rss/politica/" },
  { s: "infoLibre", u: "https://www.infolibre.es/rss/politica", filter: true },
  { s: "El Español", u: "https://www.elespanol.com/rss/espana/politica/" },
  { s: "El Debate", u: "https://www.eldebate.com/rss/espana.xml", filter: true },
  { s: "La Vanguardia", u: "https://www.lavanguardia.com/rss/politica.xml", filter: true },
  { s: "Europa Press", u: "https://www.europapress.es/rss/rss.aspx?ch=66" },
  { s: "Ara", u: "https://www.ara.cat/rss/politica/", filter: true },
  { s: "NacióDigital", u: "https://www.naciodigital.cat/rss/politica", filter: true },
  { s: "VilaWeb", u: "https://www.vilaweb.cat/feed/", filter: true },
];

// Als feeds generals només es queden els titulars de política i eleccions
const POLITICS = /elecci|electoral|29-?n|congreso|congr[eé]s|senado|senat|gobierno|govern|sánchez|sanchez|feijóo|feijoo|abascal|\bpp\b|psoe|vox|sumar|podemos|erc\b|junts|bildu|pnv|bng|amnist|investidura|moci[oó]n|presupuestos|pressupostos|partido|partit|ministr|diputad|encuesta|enquesta|puigdemont|illa|mazón|ayuso|colau|rufián|rufian|campaña|campanya|urnas|urnes|votaci|legislat/i;

const MAX_PER_SOURCE = 20;
const MAX_AGE_DAYS = 14; // els titulars s'acumulen entre execucions: el termòmetre de Notícies en mostra l'evolució
const MAX_ITEMS = 900;

const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, "&")
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

function parse(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    const link = tag(b, "link") || (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || tag(b, "guid");
    const date = new Date(tag(b, "pubDate") || tag(b, "dc:date") || tag(b, "published") || tag(b, "updated"));
    return { t: tag(b, "title"), u: link, s: feed.s, d: date.getTime() };
  }).filter((x) => x.t && /^https?:\/\//.test(x.u) && Number.isFinite(x.d) && !/[^.]\.$/.test(x.t)); // els peus de foto acaben amb punt
}

(async () => {
  const now = Date.now();
  const results = await Promise.all(FEEDS.map(async (f) => {
    try {
      const r = await fetch(f.u, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PoliticaEnJoc/1.0)" }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      let items = parse(await r.text(), f).filter((x) => x.d <= now + 3600e3 && now - x.d < MAX_AGE_DAYS * 864e5);
      if (f.filter) items = items.filter((x) => POLITICS.test(x.t));
      items.sort((a, b) => b.d - a.d);
      console.log(f.s.padEnd(14), items.length);
      return items.slice(0, MAX_PER_SOURCE);
    } catch (e) {
      console.log(f.s.padEnd(14), "ERROR", e.message);
      return [];
    }
  }));
  // Es conserven els titulars desats a les execucions anteriors que encara no han caducat
  const out = path.join(__dirname, "..", "data", "news.json");
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(out, "utf8")).items || []; } catch { /* primera execució */ }
  prev = prev.filter((x) => now - x.d < MAX_AGE_DAYS * 864e5);
  const seen = new Set();
  const items = [...results.flat(), ...prev].sort((a, b) => b.d - a.d).filter((x) => {
    const k = x.u.split("?")[0];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, MAX_ITEMS);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ updated: now, items }));
  console.log("Desat", items.length, "titulars a", out);
})();
