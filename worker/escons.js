// Previsualització dels enllaços de «La teva predicció» (#prediccio, abans #escons). Quan algú comparteix la seva predicció, l'enllaç passa per
// aquí perquè WhatsApp, X, Telegram… en mostrin la imatge pròpia (l'hemicicle d'aquella predicció) en lloc de la genèrica:
//  - GET /e?c=<codi>&s=<escons>&l=ca|es → pàgina mínima amb les etiquetes og:* que redirigeix de seguida a l'app
//    (politicaenjoc.cat/#prediccio/<codi>); el codi és el mateix de l'app i porta tota la predicció.
//  - GET /e.png?s=<escons>&l=ca|es → la imatge (PNG de 1200 × 630), dibuixada aquí mateix a partir dels escons.
// No es desa res: tot va dins de l'adreça. La imatge només conté punts de colors i xifres que surten de l'adreça, i es
// desa a la memòria cau de Cloudflare perquè cada enllaç es dibuixi una sola vegada.

const APP = "https://politicaenjoc.cat/";
const P = {
  podemos: ["PODEMOS", "#6c2b7e"], bildu: ["EH BILDU", "#0f9a83"], bng: ["BNG", "#7bb6e0"], fa: ["FA", "#e0306f"], erc: ["ERC", "#f59f24"],
  psoe: ["PSOE", "#e3101f"], pnv: ["PNV", "#3f8f45"], cc: ["CC", "#f2d21b"], junts: ["JUNTS", "#20b8c8"], altres: ["ALTRES", "#b5aea0"],
  pp: ["PP", "#1e88d6"], upn: ["UPN", "#1c3f94"], salf: ["SALF", "#5d4037"], vox: ["VOX", "#5cbf2a"],
};
const ORDER = Object.keys(P); // d'esquerra a dreta a l'hemicicle
const SIG = { podemos: "Podemos", bildu: "EH Bildu", bng: "BNG", fa: "FA", erc: "ERC", psoe: "PSOE", pnv: "PNV", cc: "CC", junts: "Junts", altres: "Altres", pp: "PP", upn: "UPN", salf: "SALF", vox: "Vox" };

// «pp136.psoe122.vox33…» → { pp: 136, … } (només partits coneguts i, en total, com a molt 350 escons)
export function parseSeats(s) {
  const out = {};
  let tot = 0;
  for (const m of String(s || "").slice(0, 200).matchAll(/([a-z]{2,8})(\d{1,3})/g)) {
    const k = m[1], n = Number(m[2]);
    if (!P[k] || out[k] !== undefined || !n) continue;
    if (tot + n > 350) break;
    out[k] = n; tot += n;
  }
  return out;
}
const CODE_RE = /^[A-Za-z0-9~.:,%_-]{1,1500}$/;
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function landing(url) {
  const l = url.searchParams.get("l") === "es" ? "es" : "ca";
  const code = url.searchParams.get("c") || "";
  const ok = CODE_RE.test(code);
  const seats = parseSeats(url.searchParams.get("s"));
  let name = "";
  if (ok) { try { name = decodeURIComponent(code.split("~")[3] || "").replace(/[\u0000-\u001f]/g, "").slice(0, 40); } catch { name = ""; } }
  const to = `${APP}${l === "es" ? "es/" : ""}#prediccio${ok ? `/${code}` : ""}`;
  const top = Object.entries(seats).sort((a, b) => b[1] - a[1]).filter(([k]) => k !== "altres").slice(0, 6).map(([k, n]) => `${SIG[k]} ${n}`).join(" · ");
  const T = l === "es"
    ? { t: name ? `La predicción de ${name} para el 29N` : "Una predicción para el 29N", d: `${top ? `${top}. ` : ""}Mírala provincia a provincia y haz la tuya en Política en Joc.`, alt: "Hemiciclo del Congreso con la predicción de escaños" }
    : { t: name ? `La predicció de ${name} per al 29N` : "Una predicció per al 29N", d: `${top ? `${top}. ` : ""}Mira-la província a província i fes la teva a Política en Joc.`, alt: "Hemicicle del Congrés amb la predicció d'escons" };
  const s = Object.entries(seats).map(([k, n]) => `${k}${n}`).join(".");
  const img = `${url.origin}/e.png?s=${s}&l=${l}`;
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(T.t)}</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:site_name" content="Política en Joc">
<meta property="og:title" content="${escHtml(T.t)}"><meta property="og:description" content="${escHtml(T.d)}">
<meta property="og:url" content="${escHtml(to)}">
<meta property="og:image" content="${escHtml(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escHtml(T.alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escHtml(T.t)}"><meta name="twitter:description" content="${escHtml(T.d)}"><meta name="twitter:image" content="${escHtml(img)}">
<meta http-equiv="refresh" content="0;url=${escHtml(to)}">
<script>location.replace(${JSON.stringify(to).replace(/</g, "\\u003c")})</script>
</head><body style="font-family:system-ui,sans-serif;padding:24px"><p><a href="${escHtml(to)}">${escHtml(T.t)} →</a></p></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}

// ---------- Dibuix ----------
// Lletra de 5 × 7 punts (cada punt es dibuixa com una rodona, com els escons)
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31], "'": [4, 4, 8, 0, 0, 0, 0],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12], ".": [0, 0, 0, 0, 0, 12, 12], "·": [0, 0, 0, 12, 12, 0, 0],
  ":": [0, 12, 12, 0, 12, 12, 0], "-": [0, 0, 0, 31, 0, 0, 0], "+": [0, 4, 4, 31, 4, 4, 0], " ": [0, 0, 0, 0, 0, 0, 0],
};
// Lletres amb accent: la base i la marca a sobre (punts de les files -2 i -1)
const ACC = { "Ó": ["O", [[3, -2], [2, -1]]], "Ò": ["O", [[1, -2], [2, -1]]], "É": ["E", [[3, -2], [2, -1]]], "È": ["E", [[1, -2], [2, -1]]], "À": ["A", [[1, -2], [2, -1]]], "Í": ["I", [[3, -2], [2, -1]]], "Ú": ["U", [[3, -2], [2, -1]]], "Ñ": ["N", [[1, -1], [2, -2], [3, -1]]] };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const W = 1200, H = 630, LV = 4; // nivells d'antialiàsing per color

function makeCanvas() {
  const pal = [], idx = new Map();
  const bg = hex("#f6f3ec");
  pal.push(bg);
  const color = (h) => {
    if (!idx.has(h)) { const c = hex(h); idx.set(h, pal.length); for (let i = 1; i <= LV; i++) pal.push(c.map((v, j) => Math.round(bg[j] + ((v - bg[j]) * i) / LV))); }
    return idx.get(h);
  };
  const px = new Uint8Array(W * H);
  // Rodona amb vores suaus (sobre el fons)
  const dot = (cx, cy, r, h) => {
    const base = color(h);
    const x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(W - 1, Math.ceil(cx + r + 1));
    const y0 = Math.max(0, Math.floor(cy - r - 1)), y1 = Math.min(H - 1, Math.ceil(cy + r + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, cov = r + 0.5 - Math.sqrt(dx * dx + dy * dy);
      if (cov <= 0) continue;
      const lv = Math.min(LV, Math.max(1, Math.round(cov * LV)));
      const o = y * W + x, cur = px[o];
      if (cur === 0 || ((cur - 1) % LV) + 1 < lv) px[o] = base + lv - 1;
    }
  };
  const text = (s, x, y, sc, h, align = "left") => {
    const chars = [...String(s).toUpperCase()].filter((c) => FONT[c] || ACC[c]);
    const w = chars.length * 6 * sc - sc;
    let cx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    chars.forEach((c) => {
      const [b, marks] = ACC[c] || [c, []];
      marks.forEach(([i, j]) => dot(cx + i * sc + sc / 2, y + j * sc + sc / 2, sc * 0.46, h));
      FONT[b].forEach((row, j) => { for (let i = 0; i < 5; i++) if (row & (16 >> i)) dot(cx + i * sc + sc / 2, y + j * sc + sc / 2, sc * 0.46, h); });
      cx += 6 * sc;
    });
    return w;
  };
  return { pal, px, dot, text };
}

// Seients de l'hemicicle (com hemicycleSeats de l'app)
function seatsLayout(total, rows = 12, r0 = 0.36) {
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((1 - r0) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sumR));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  for (let k = rows - 1; diff !== 0; k = (k - 1 + rows) % rows) { counts[k] += Math.sign(diff); diff -= Math.sign(diff); }
  const out = [];
  radii.forEach((r, i) => { const n = counts[i]; for (let j = 0; j < n; j++) { const a = Math.PI * (1 - j / Math.max(1, n - 1)); out.push({ x: Math.cos(a) * r, y: -Math.sin(a) * r, a, r }); } });
  return out.sort((p, q) => q.a - p.a || p.r - q.r);
}

export function drawPrediction(seats, l = "ca") {
  const C = makeCanvas(), INK = "#1d1b26", MUTED = "#7a7487";
  const total = 350, lay = seatsLayout(total);
  const cx = 330, cy = 470, R = 280, dr = 6.4;
  const fill = [];
  ORDER.forEach((k) => { for (let i = 0; i < (seats[k] || 0); i++) fill.push(P[k][1]); });
  lay.forEach((s, i) => C.dot(cx + s.x * R, cy + s.y * R, dr, fill[i] || "#dcd6cb"));
  C.text("350", cx, cy - 46, 6, INK, "center");
  C.text(l === "es" ? "ESCAÑOS" : "ESCONS", cx, cy + 4, 3, MUTED, "center");
  C.text(l === "es" ? "MAYORÍA: 176" : "MAJORIA: 176", cx, cy + 60, 3, MUTED, "center");
  // Llegenda
  const rows = ORDER.filter((k) => seats[k]).sort((a, b) => seats[b] - seats[a]).slice(0, 10);
  C.text("29N", 690, 36, 6, INK);
  C.text(l === "es" ? "PREDICCIÓN DE ESCAÑOS" : "PREDICCIÓ D'ESCONS", 690, 96, 3, MUTED);
  const top = 150, step = rows.length > 8 ? 40 : 46;
  rows.forEach((k, i) => {
    const y = top + i * step;
    C.dot(705, y + 14, 13, P[k][1]);
    C.text(P[k][0], 736, y, 4, INK);
    C.text(String(seats[k]), 1140, y, 4, INK, "right");
  });
  C.text("POLITICAENJOC.CAT", 1140, H - 44, 3, MUTED, "right");
  C.text(l === "es" ? "PREDICCIÓN PERSONAL · NO ES UNA ENCUESTA" : "PREDICCIÓ PERSONAL · NO ÉS CAP ENQUESTA", 60, H - 44, 2, MUTED);
  return C;
}

// ---------- PNG amb paleta ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function zlib(raw) {
  const cs = new CompressionStream("deflate");
  const res = new Response(new Blob([raw]).stream().pipeThrough(cs));
  return new Uint8Array(await res.arrayBuffer());
}
export async function encodePng(C) {
  const raw = new Uint8Array((W + 1) * H);
  for (let y = 0; y < H; y++) raw.set(C.px.subarray(y * W, (y + 1) * W), y * (W + 1) + 1);
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W); dv.setUint32(4, H); ihdr[8] = 8; ihdr[9] = 3; // 8 bits, paleta
  const plte = new Uint8Array(C.pal.length * 3);
  C.pal.forEach((c, i) => plte.set(c, i * 3));
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("PLTE", plte), chunk("IDAT", await zlib(raw)), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  parts.forEach((p) => { out.set(p, o); o += p.length; });
  return out;
}

export async function image(req, url, ctx) {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = new Request(url.toString(), { method: "GET" });
  const hit = cache && (await cache.match(key));
  if (hit) return hit;
  const png = await encodePng(drawPrediction(parseSeats(url.searchParams.get("s")), url.searchParams.get("l") === "es" ? "es" : "ca"));
  const res = new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable", "Access-Control-Allow-Origin": "*" } });
  if (cache) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}
