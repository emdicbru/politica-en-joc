// =========================================================
// A QUI T'ASSEMBLES? Test d'afinitat amb els partits del 29N
// =========================================================
// Vint afirmacions sobre temes de la campanya. Per a cada partit hi ha la seva posició (de -2, molt en contra, a +2,
// molt a favor) segons el programa, el que ha votat al Congrés i les seves posicions públiques (vegeu PARTY_ARGS a
// partits.js). On la posició no és clara o no se'n coneix cap, no hi ha valor (null) i aquella afirmació no compta
// per a aquell partit. És orientatiu: no és cap recomanació de vot.
// CC i SALF no hi surten: tenen massa poques posicions públiques sobre aquests temes per comparar-les amb justícia.
const ASSEMBLA_PARTIES = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng"];
//                     pp   psoe  vox   fa   pod   erc  junts bildu pnv   bng
const ASSEMBLA_ITEMS = [
  { t: "Habitatge", q: "Cal limitar per llei el preu del lloguer a les zones on és més car.", p: [-2, 2, -2, 2, 2, 2, -1, 2, null, 2] },
  { t: "Impostos", q: "S'han d'abaixar els impostos, encara que hi hagi menys diners per als serveis públics.", p: [2, -2, 2, -2, -2, -1, 1, -2, null, -1] },
  { t: "Impostos", q: "Les grans fortunes, la banca i les energètiques han de pagar més impostos.", p: [-2, 2, -1, 2, 2, 1, -1, 2, -1, 2] },
  { t: "Treball", q: "Cal reduir la jornada laboral a 37,5 hores setmanals sense rebaixar el sou.", p: [-2, 2, -2, 2, 2, 2, -2, 2, null, 2] },
  { t: "Model territorial", q: "Catalunya hauria de poder votar en un referèndum d'independència.", p: [-2, -2, -2, 1, 2, 2, 2, 2, 1, 2] },
  { t: "Model territorial", q: "S'ha de mantenir la llei d'amnistia.", p: [-2, 2, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Model territorial", q: "Caldria suprimir les comunitats autònomes i tornar a un Estat centralitzat.", p: [-2, -2, 2, -2, -2, -2, -2, -2, -2, -2] },
  { t: "Model territorial", q: "Catalunya hauria de recaptar tots els seus impostos, com fa el País Basc.", p: [-2, 0, -2, null, null, 2, 2, null, null, null] },
  { t: "Model territorial", q: "Espanya s'ha de reconèixer com un Estat plurinacional.", p: [-2, 0, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Energia", q: "S'ha d'allargar la vida de les centrals nuclears.", p: [2, -1, 2, -2, -2, null, 1, -2, null, null] },
  { t: "Immigració", q: "Cal regularitzar els immigrants que ja viuen i treballen a Espanya.", p: [-1, 1, -2, 2, 2, 1, null, 2, 1, 1] },
  { t: "Immigració", q: "Les ajudes socials han de donar prioritat a les persones de nacionalitat espanyola.", p: [null, -2, 2, -2, -2, -2, null, -2, -2, -2] },
  { t: "Drets", q: "L'avortament ha de ser un dret garantit a la sanitat pública.", p: [0, 2, -2, 2, 2, 2, 1, 2, 1, 2] },
  { t: "Drets", q: "Cal derogar la llei de violència de gènere.", p: [-2, -2, 2, -2, -2, -2, -2, -2, -2, -2] },
  { t: "Sanitat", q: "La sanitat pública ha de cobrir el dentista i la salut mental.", p: [null, 1, null, 2, 2, 2, null, 2, null, null] },
  { t: "Seguretat", q: "Els pisos ocupats il·legalment s'han de poder desallotjar en pocs dies.", p: [2, null, 2, -1, -2, null, 2, null, null, null] },
  { t: "Llengües", q: "El català, el basc i el gallec han de ser llengües oficials a la Unió Europea.", p: [-1, 2, -2, 2, 2, 2, 2, 2, 2, 2] },
  { t: "Europa i món", q: "La Unió Europea ha de tenir més poder, encara que els estats en perdin.", p: [1, 1, -2, null, null, 1, null, null, 1, null] },
  { t: "Europa i món", q: "Espanya ha d'augmentar la despesa en defensa.", p: [1, 0, 1, -2, -2, null, null, -2, null, -2] },
  { t: "Institucions", q: "Espanya hauria de ser una república.", p: [-2, -1, -2, 1, 2, 2, null, 2, null, 2] },
];
const ASSEMBLA_ANS = [[2, "Molt d'acord"], [1, "D'acord"], [0, "Neutral"], [-1, "En desacord"], [-2, "Molt en desacord"]];
const ASSEMBLA_KEY = "r29n-assembla";
const ASSEMBLA_MIN = 6; // afirmacions en comú perquè un partit surti al resultat

function assemblaScores(ans) {
  return ASSEMBLA_PARTIES.map((id, j) => {
    let num = 0, den = 0, n = 0;
    ASSEMBLA_ITEMS.forEach((it, i) => {
      const a = ans[i], p = it.p[j];
      if (!a || a.v === null || p === null) return;
      const w = a.imp ? 2 : 1;
      num += w * (4 - Math.abs(a.v - p)) / 4; den += w; n++;
    });
    const party = PARTIES.find((x) => x.id === id);
    return { id, sig: party.sig, name: party.name, color: party.color, n, pct: den ? Math.round((num / den) * 100) : 0 };
  }).filter((r) => r.n >= ASSEMBLA_MIN).sort((a, b) => b.pct - a.pct || a.sig.localeCompare(b.sig));
}

function assemblaCanvas(rows) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d";
  const display = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#ffcf3d"; c.fillRect(0, 0, W, 18);
  c.textAlign = "center"; c.fillStyle = INK;
  c.font = sans(40, 700); c.fillText("Eleccions del 29N", W / 2, 120);
  c.font = display(76); c.fillText("A qui m'assemblo?", W / 2, 220);
  const top = rows[0];
  c.font = sans(44, 700); c.fillStyle = "#3a3a63"; c.fillText("Coincideixo més amb", W / 2, 330);
  c.font = display(110); c.fillStyle = top.color; c.fillText(top.sig, W / 2, 470);
  c.font = display(64); c.fillStyle = INK; c.fillText(`${top.pct} %`, W / 2, 560);
  // Els cinc primers, en barres
  const list = rows.slice(0, 5), x0 = 120, bw = W - 240;
  list.forEach((r, i) => {
    const y = 650 + i * 104;
    c.textAlign = "left"; c.font = display(36); c.fillStyle = INK; c.fillText(r.sig, x0, y + 34);
    c.textAlign = "right"; c.font = display(36); c.fillText(`${r.pct} %`, x0 + bw, y + 34);
    round(x0, y + 52, bw, 30, 15); c.fillStyle = "#ece4d2"; c.fill();
    round(x0, y + 52, Math.max(30, (bw * r.pct) / 100), 30, 15); c.fillStyle = r.color; c.fill();
  });
  c.textAlign = "center"; c.font = sans(36, 600); c.fillStyle = "#6e6a82"; c.fillText("I tu, amb qui coincideixes?", W / 2, 1200);
  c.fillStyle = INK; c.font = display(40); c.fillText("Política en Joc", W / 2, 1265);
  c.font = sans(30, 600); c.fillStyle = "#3a3a63"; c.fillText((location.host || "politicaenjoc.cat") + "/#joc/assembla", W / 2, 1310);
  return cv;
}

async function assemblaShare(rows) {
  const top = rows[0];
  const text = `🗳️ Al test d'afinitat política de Política en Joc coincideixo un ${top.pct} % amb ${top.sig}. I tu?`;
  const url = `${location.origin}${location.pathname}#joc/assembla`;
  const cv = assemblaCanvas(rows);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  const file = blob && new File([blob], "a-qui-m-assemblo.png", { type: "image/png" });
  try {
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}` }); return; }
    if (navigator.share) { await navigator.share({ text, url }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  if (blob) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "a-qui-m-assemblo.png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Imatge descarregada i text copiat"); } catch { toast("Imatge descarregada"); }
}

// ---------- Els eixos: la teva posició al mapa ideològic ----------
// Les mateixes afirmacions situen cada persona en els dos eixos del mapa del comparador de partits (#apren/partits):
// x, d'esquerra (0) a dreta (10), i y, de centralisme (0) a sobiranisme (10). +1: estar-hi d'acord porta cap a la
// dreta o cap al sobiranisme; −1, al contrari. Les afirmacions que barregen totes dues coses (república, UE) no compten.
const ASSEMBLA_AXES = {
  x: { 0: -1, 1: 1, 2: -1, 3: -1, 9: 1, 10: -1, 11: 1, 12: -1, 13: 1, 14: -1, 15: 1, 18: 1 },
  y: { 4: 1, 5: 1, 6: -1, 7: 1, 8: 1, 16: 1 },
};
const ASSEMBLA_AX_MIN = { x: 4, y: 3 }; // respostes mínimes en un eix per situar-t'hi
// Partits: la mitjana de les seves posicions (gairebé sempre fermes, ±2). Tu: la mitjana entre aquesta mesura i la
// direcció de les respostes, perquè qui respon «D'acord» a tot el que és d'esquerres no surti al centre. Les respostes
// neutrals, i les que van en direccions contràries, acosten el punt cap al centre.
function assemblaRaw(ax, val, dir = false) {
  let sum = 0, abs = 0, n = 0, nz = 0;
  for (const i in ASSEMBLA_AXES[ax]) {
    const v = val(+i);
    if (v === null || v === undefined) continue;
    sum += ASSEMBLA_AXES[ax][i] * v; abs += Math.abs(v); n++; if (v) nz++;
  }
  if (!n) return null;
  const int = sum / n / 2;
  return { r: !dir ? int : (int + (abs ? (sum / abs) * Math.sqrt(nz / n) : 0)) / 2, n };
}
// Escala de cada eix: les respostes dels partits a les mateixes afirmacions, lligades a la seva posició al mapa.
// Així la teva puntuació cau al mateix lloc que la d'un partit que hagués respost igual (interpolació monòtona).
const ASSEMBLA_SCALE = {};
function assemblaScale(ax) {
  if (ASSEMBLA_SCALE[ax]) return ASSEMBLA_SCALE[ax];
  const pts = [];
  ASSEMBLA_PARTIES.forEach((id, j) => {
    const p = PARTIES.find((x) => x.id === id), raw = assemblaRaw(ax, (i) => ASSEMBLA_ITEMS[i].p[j]);
    if (p && typeof p[ax] === "number" && raw) pts.push({ r: raw.r, v: p[ax], w: 1 });
  });
  pts.sort((a, b) => a.r - b.r);
  // Mateixa puntuació: la mitjana · després, que mai no baixi (els blocs que baixen es fusionen)
  const bl = [];
  pts.forEach((q) => {
    const t = bl[bl.length - 1];
    if (t && Math.abs(t.r - q.r) < 1e-9) { t.v = (t.v * t.w + q.v) / (t.w + 1); t.w++; } else bl.push({ ...q });
    while (bl.length > 1 && bl[bl.length - 2].v > bl[bl.length - 1].v) {
      const b = bl.pop(), a = bl.pop();
      bl.push({ r: (a.r * a.w + b.r * b.w) / (a.w + b.w), v: (a.v * a.w + b.v * b.w) / (a.w + b.w), w: a.w + b.w });
    }
  });
  // Els extrems del mapa (0 i 10) són per a qui respon amb la màxima convicció a totes les afirmacions d'un eix: el test
  // no distingeix els partits que hi responen igual (els sobiranistes, per exemple), i no seria just topar a la seva mitjana.
  const out = bl.map((b) => ({ r: b.r, v: b.v })).filter((p) => p.r > -0.999 && p.r < 0.999);
  out.unshift({ r: -1, v: 0 });
  out.push({ r: 1, v: 10 });
  return (ASSEMBLA_SCALE[ax] = out);
}
function assemblaMap(ax, r) {
  const pts = assemblaScale(ax);
  if (r <= pts[0].r) return pts[0].v;
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k];
    if (r <= b.r) return a.v + ((b.v - a.v) * (r - a.r)) / (b.r - a.r || 1);
  }
  return pts[pts.length - 1].v;
}
function assemblaPos(ans) {
  const out = {};
  for (const ax of ["x", "y"]) {
    const raw = assemblaRaw(ax, (i) => (ans[i] ? ans[i].v : null), true);
    out[ax] = raw && raw.n >= ASSEMBLA_AX_MIN[ax] ? Math.round(assemblaMap(ax, raw.r) * 10) / 10 : null;
  }
  return out.x === null && out.y === null ? null : out;
}
const assemblaXLabel = (x) => x < 2 ? "Esquerra" : x < 4 ? "Centreesquerra" : x <= 6 ? "Centre" : x <= 8 ? "Centredreta" : "Dreta";
const assemblaYLabel = (y) => y < 2 ? "Centralisme" : y < 4.5 ? "Estat de les autonomies" : y < 7 ? "Federalisme i plurinacionalitat" : "Sobiranisme";
const fmtAx = (v) => v.toFixed(1).replace(".", ",");

// El teu punt sobre un mapa (SVG). Si falta un eix, el punt va al mig d'aquell eix.
function assemblaYouMark(px, py, pos, r = 15) {
  if (!pos) return "";
  const x = px(pos.x ?? 5), y = py(pos.y ?? 5);
  return `<g class="pm-you" aria-label="La teva posició"><circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="#17173d" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#17173d" stroke="#ffcf3d" stroke-width="4"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">TU</text></g>`;
}
function assemblaMapSvg(pos, hi = []) {
  const W = 400, H = 400, L = 26, R = 8, T = 8, B = 28, M = 22;
  const px = (x) => L + M + (x / 10) * (W - L - R - 2 * M), py = (y) => H - B - M - (y / 10) * (H - T - B - 2 * M);
  const rad = (s) => Math.max(7, 4 + Math.sqrt(s) * 1.35);
  const ps = PARTIES.filter((p) => typeof p.x === "number").sort((p, q) => q.seats - p.seats);
  const bw = W - L - R, bh = H - T - B;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="La teva posició al mapa ideològic, amb els partits">
    <rect x="${L}" y="${T}" width="${bw}" height="${bh}" rx="14" fill="#fffaf0" stroke="#17173d" stroke-width="2.5"/>
    <rect x="${L}" y="${T}" width="${bw / 2}" height="${bh / 2}" rx="14" fill="rgba(255,75,43,.07)"/><rect x="${L + bw / 2}" y="${T}" width="${bw / 2}" height="${bh / 2}" fill="rgba(53,84,255,.06)"/>
    <rect x="${L}" y="${T + bh / 2}" width="${bw / 2}" height="${bh / 2}" fill="rgba(255,207,61,.1)"/><rect x="${L + bw / 2}" y="${T + bh / 2}" width="${bw / 2}" height="${bh / 2}" rx="14" fill="rgba(23,23,61,.04)"/>
    <path d="M${px(5)} ${T}V${H - B}M${L} ${py(5)}H${W - R}" stroke="#17173d" stroke-width="1.5" stroke-dasharray="4 6" opacity=".45"/>
    <text x="${L + 4}" y="${H - B + 19}" class="ax">← Esquerra</text><text x="${W - R - 4}" y="${H - B + 19}" class="ax" text-anchor="end">Dreta →</text>
    <text x="${L - 9}" y="${T + 6}" class="ax" transform="rotate(-90 ${L - 9} ${T + 6})" text-anchor="end">Sobiranisme ↑</text>
    <text x="${L - 9}" y="${H - B - 4}" class="ax" transform="rotate(-90 ${L - 9} ${H - B - 4})">Centralisme</text>
    ${ps.map((p) => {
      const big = hi.includes(p.id), r = rad(p.seats);
      return `<g class="pm-p ${big ? "hi" : ""}"><circle cx="${px(p.x)}" cy="${py(p.y)}" r="${r}" fill="${p.color}" stroke="#17173d" stroke-width="${big ? 3.5 : 2}"/>
        <text x="${px(p.x)}" y="${py(p.y) + r + 11}" text-anchor="middle" class="pm-lbl out">${esc(p.sig)}</text></g>`;
    }).join("")}
    ${assemblaYouMark(px, py, pos, 13)}
  </svg>`;
}
function assemblaAxesHtml(pos) {
  const row = (lo, hi, v, lab, grad) => v === null
    ? `<div class="asb-ax off"><div class="asb-ax-h"><span>${lo}</span><span>${hi}</span></div><em>Has respost massa poques afirmacions d'aquest eix.</em></div>`
    : `<div class="asb-ax"><div class="asb-ax-h"><span>${lo}</span><b>${esc(lab)} · ${fmtAx(v)}</b><span>${hi}</span></div>
      <div class="asb-ax-t" style="background:${grad}"><i style="left:${v * 10}%"></i></div></div>`;
  return row("Esquerra", "Dreta", pos.x, pos.x === null ? "" : assemblaXLabel(pos.x), "linear-gradient(90deg,#ff4b2b,#e9e2d0,#3554ff)")
    + row("Centralisme", "Sobiranisme", pos.y, pos.y === null ? "" : assemblaYLabel(pos.y), "linear-gradient(90deg,#17173d,#e9e2d0,#ffcf3d)");
}

// Imatge per descarregar: el mapa amb tots els partits i la teva posició (1080 × 1350)
function assemblaMapCanvas(pos, rows) {
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), INK = "#17173d";
  const display = (s) => `900 ${s}px Unbounded, "Arial Black", sans-serif`, sans = (s, w = 600) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
  const round = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#ffcf3d"; c.fillRect(0, 0, W, 18);
  c.textAlign = "center"; c.fillStyle = INK;
  c.font = sans(32, 700); c.fillText("Test d'afinitat política · Eleccions del 29N", W / 2, 90);
  c.font = display(60); c.fillText("La meva posició política", W / 2, 168);
  const sub = [pos.x !== null ? assemblaXLabel(pos.x) : null, pos.y !== null ? assemblaYLabel(pos.y) : null].filter(Boolean).join(" · ");
  c.font = sans(36, 800); c.fillStyle = "#3554ff"; c.fillText(sub, W / 2, 226);
  // El mapa
  const X0 = 120, Y0 = 268, S = 870, M = 48;
  const px = (x) => X0 + M + (x / 10) * (S - 2 * M), py = (y) => Y0 + S - M - (y / 10) * (S - 2 * M);
  round(X0, Y0, S, S, 28); c.fillStyle = "#ffffff"; c.fill();
  c.save(); round(X0, Y0, S, S, 28); c.clip();
  c.fillStyle = "rgba(255,75,43,.08)"; c.fillRect(X0, Y0, S / 2, S / 2);
  c.fillStyle = "rgba(53,84,255,.07)"; c.fillRect(X0 + S / 2, Y0, S / 2, S / 2);
  c.fillStyle = "rgba(255,207,61,.13)"; c.fillRect(X0, Y0 + S / 2, S / 2, S / 2);
  c.fillStyle = "rgba(23,23,61,.05)"; c.fillRect(X0 + S / 2, Y0 + S / 2, S / 2, S / 2);
  c.restore();
  round(X0, Y0, S, S, 28); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  c.setLineDash([8, 12]); c.lineWidth = 2.5; c.globalAlpha = .45;
  c.beginPath(); c.moveTo(px(5), Y0); c.lineTo(px(5), Y0 + S); c.moveTo(X0, py(5)); c.lineTo(X0 + S, py(5)); c.stroke();
  c.setLineDash([]); c.globalAlpha = 1;
  c.fillStyle = "#4a4766"; c.font = sans(26, 800);
  c.textAlign = "left"; c.fillText("← ESQUERRA", X0 + 6, Y0 + S + 40);
  c.textAlign = "right"; c.fillText("DRETA →", X0 + S - 6, Y0 + S + 40);
  c.save(); c.translate(X0 - 22, Y0 + 8); c.rotate(-Math.PI / 2); c.textAlign = "right"; c.fillText("SOBIRANISME ↑", 0, 0); c.restore();
  c.save(); c.translate(X0 - 22, Y0 + S - 8); c.rotate(-Math.PI / 2); c.textAlign = "left"; c.fillText("CENTRALISME", 0, 0); c.restore();
  const top = rows ? rows.slice(0, 3).map((r) => r.id) : [];
  const ps = PARTIES.filter((p) => typeof p.x === "number").sort((p, q) => q.seats - p.seats);
  const rad = (p) => Math.max(18, 12 + Math.sqrt(p.seats) * 3.4);
  ps.forEach((p) => {
    c.beginPath(); c.arc(px(p.x), py(p.y), rad(p), 0, Math.PI * 2); c.fillStyle = p.color; c.fill();
    c.lineWidth = top.includes(p.id) ? 7 : 4; c.strokeStyle = INK; c.stroke();
  });
  c.textAlign = "center"; c.lineJoin = "round";
  ps.forEach((p) => {
    const x = px(p.x), y = py(p.y) + rad(p) + 30;
    c.font = display(24); c.lineWidth = 8; c.strokeStyle = "#ffffff"; c.strokeText(p.sig, x, y); c.fillStyle = INK; c.fillText(p.sig, x, y);
  });
  // Tu
  const ux = px(pos.x ?? 5), uy = py(pos.y ?? 5);
  c.beginPath(); c.arc(ux, uy, 58, 0, Math.PI * 2); c.setLineDash([6, 8]); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.setLineDash([]);
  c.beginPath(); c.arc(ux, uy, 40, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); c.lineWidth = 8; c.strokeStyle = "#ffcf3d"; c.stroke();
  c.fillStyle = "#ffcf3d"; c.font = display(30); c.fillText("JO", ux, uy + 11);
  // Peu
  c.fillStyle = INK; c.font = sans(32, 700);
  if (rows && rows[0]) c.fillText(`Coincideixo més amb ${rows[0].sig} (${rows[0].pct} %)${rows[1] ? ` i ${rows[1].sig} (${rows[1].pct} %)` : ""}`, W / 2, 1236);
  c.font = display(34); c.fillText("Política en Joc", W / 2, 1288);
  c.font = sans(26, 600); c.fillStyle = "#4a4766"; c.fillText(`${location.host || "politicaenjoc.cat"}/#joc/assembla · posicions orientatives`, W / 2, 1328);
  return cv;
}
async function assemblaMapDownload(pos, rows) {
  const cv = assemblaMapCanvas(pos, rows);
  const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
  if (!blob) { toast("No s'ha pogut fer la imatge"); return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "la-meva-posicio-politica.png";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Imatge descarregada");
}

const assemblaLabel = (v) => v === null ? "—" : (ASSEMBLA_ANS.find((a) => a[0] === v) || [0, ""])[1];

function assemblaResult(ctx, ans) {
  const rows = assemblaScores(ans), pos = assemblaPos(ans);
  try { store.set(ASSEMBLA_KEY, { at: Date.now(), top: rows.slice(0, 3).map((r) => [r.id, r.pct]), all: rows.map((r) => [r.id, r.pct]), pos }); } catch { /* sense memòria */ }
  if (!rows.length) {
    return ctx.finish({ score: 0, display: "—", noRecord: true, xp: 10, verdict: "Has saltat massa afirmacions per comparar-te amb els partits.", extraHtml: `<p class="muted">Torna-hi i respon-ne almenys ${ASSEMBLA_MIN}.</p>` });
  }
  const answered = ASSEMBLA_ITEMS.map((it, i) => ({ it, a: ans[i] })).filter((x) => x.a && x.a.v !== null);
  const detail = (r) => {
    const j = ASSEMBLA_PARTIES.indexOf(r.id);
    const rowsH = answered.filter((x) => x.it.p[j] !== null).map((x) => {
      const d = Math.abs(x.a.v - x.it.p[j]), cls = d <= 1 ? "ok" : d >= 3 ? "ko" : "mid";
      return `<li class="asb-d ${cls}"><b>${esc(x.it.q)}</b><span>Tu: ${esc(assemblaLabel(x.a.v))} · ${esc(r.sig)}: ${esc(assemblaLabel(x.it.p[j]))}</span></li>`;
    }).join("");
    return `<ul class="asb-dl">${rowsH}</ul>`;
  };
  // Podi dels tres partits més propers i, per al primer, on hi coincideixes i on no
  const top = rows.slice(0, 3), j0 = ASSEMBLA_PARTIES.indexOf(rows[0].id);
  // Per temes: la distància mitjana de les afirmacions de cada tema (un tema no surt mai a les dues llistes)
  const byT = {};
  answered.forEach((x) => { if (x.it.p[j0] === null) return; (byT[x.it.t] ||= []).push(Math.abs(x.a.v - x.it.p[j0])); });
  const temes = Object.entries(byT).map(([t, l]) => [t, l.reduce((a, b) => a + b, 0) / l.length]);
  const pick = (fn, ord) => temes.filter(([, d]) => fn(d)).sort((a, b) => ord * (a[1] - b[1])).slice(0, 4).map(([t]) => t).join(", ");
  const yes = pick((d) => d <= 1.25, 1), no = pick((d) => d >= 2.5, -1);
  const podium = `<div class="asb-pod">${[top[1], top[0], top[2]].map((r, k) => r ? `<div class="asb-pc p${[2, 1, 3][k]}" style="--pc:${r.color}"><b>${esc(r.sig)}</b><div class="asb-pb"><strong>${r.pct} %</strong><span>${["2n", "1r", "3r"][k]}</span></div></div>` : "<div></div>").join("")}</div>
      ${yes || no ? `<div class="asb-why"><small>On hi coincideixes amb ${esc(rows[0].sig)}</small>
        ${yes ? `<p><i class="ok"></i>${esc(yes)}</p>` : ""}${no ? `<p><i class="ko"></i>Hi discrepes: ${esc(no)}</p>` : ""}</div>` : ""}`;
  const extraHtml = `<div class="asb-res">${podium}
      <p class="asb-all">Tots els partits</p><div class="asb-bars">${rows.map((r) => `<details class="asb-row" style="--pc:${r.color}"><summary><b>${esc(r.sig)}</b><span class="asb-bar"><i style="width:${r.pct}%"></i></span><em>${r.pct} %</em></summary>${detail(r)}</details>`).join("")}</div>
      <p class="muted asb-note">Toca un partit per veure en què hi coincideixes i en què no. Les posicions surten dels programes, del que han votat al Congrés i de les seves declaracions públiques; on no són clares, aquella afirmació no compta. És orientatiu: no és cap recomanació de vot. CC i SALF no hi surten perquè tenen poques posicions públiques sobre aquests temes.</p>
      <div class="asb-acts"><button class="btn primary" type="button" data-asb-share>Comparteix el resultat</button></div>
      ${pos ? `<section class="asb-eix"><h3>La teva posició als eixos</h3>
        <p>Amb les mateixes afirmacions, al mapa del comparador de partits: d'esquerra a dreta i de centralisme a sobiranisme.</p>
        <div class="asb-map">${assemblaMapSvg(pos, rows.slice(0, 3).map((r) => r.id))}</div>
        <div class="asb-axes">${assemblaAxesHtml(pos)}</div>
        <button class="btn asb-dl-btn" type="button" data-asb-img>⬇ Descarrega la imatge amb el mapa</button>
      </section>` : ""}
      <a class="asb-cmp" href="#apren/partits"><span><small>Comparador de partits</small><b>Compara't amb ${esc(rows[0].sig)}${rows[1] ? ` i ${esc(rows[1].sig)}` : ""}</b><em>Propostes tema a tema, cara a cara i caps de llista</em></span><i>→</i></a>
    </div>`;
  ctx.finish({
    score: rows[0].pct, display: `${rows[0].pct} %`, noRecord: true, xp: 40,
    verdict: `Coincideixes més amb ${rows[0].sig}${rows[1] ? `, i després amb ${rows[1].sig}` : ""}.`,
    extraHtml,
    onShown(body) {
      $("[data-asb-share]", body)?.addEventListener("click", () => assemblaShare(rows));
      $("[data-asb-img]", body)?.addEventListener("click", () => assemblaMapDownload(pos, rows));
      // Al comparador, amb els dos partits més propers ja triats
      $(".asb-cmp", body)?.addEventListener("click", () => { if (typeof cmpSel !== "undefined" && rows[1]) { cmpSel.a = rows[0].id; cmpSel.b = rows[1].id; cmpSel.next = "b"; } });
    },
  });
}

registerGame({
  id: "assembla",
  cat: "parlament",
  autostart: true,
  backHref: "#inici",
  tagline: "20 temes de la campanya: amb quin partit coincideixes més?",
  kicker: "Especial 29N",
  title: "Test d'afinitat política",
  level: 1,
  meta: "20 afirmacions",
  icon: icon(`<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20a5 5 0 0110 0M11 20a5 5 0 0110 0"/>`),
  desc: "Digues si hi estàs d'acord o no en 20 temes de la campanya (habitatge, impostos, model territorial, immigració…) i descobreix amb quins partits coincideixes més. Sense temps i sense respostes correctes.",
  rules: ["20 afirmacions · sense temps", "☆ Marca els temes que t'importen més: compten el doble", "Pots saltar-ne", "Resultat i mapa per compartir"],
  start(ctx) {
    const ans = new Array(ASSEMBLA_ITEMS.length).fill(null);
    let i = 0, star = null; // star: si la pregunta d'ara està marcada com a important
    const draw = () => {
      const it = ASSEMBLA_ITEMS[i], cur = ans[i] || { v: undefined, imp: false };
      if (star === null) star = !!cur.imp;
      const nImp = ans.filter((a, k) => k !== i && a && a.imp && a.v !== null).length + (star ? 1 : 0);
      ctx.hud([["n", "Afirmació", `${i + 1}/${ASSEMBLA_ITEMS.length}`]]);
      ctx.body.innerHTML = `<div class="asb">
          <div class="asb-prog"><i style="width:${(i / ASSEMBLA_ITEMS.length) * 100}%"></i></div>
          <div class="asb-top"><span class="asb-t">${esc(it.t)}</span>
            <button class="asb-star${star ? " on" : ""}" type="button" data-imp aria-pressed="${star}"><i>${star ? "★" : "☆"}</i><span>${star ? "És important per a mi" : "M'importa molt"}</span></button></div>
          <p class="asb-q">${esc(it.q)}</p>
          <div class="asb-opts">${ASSEMBLA_ANS.map(([v, l]) => `<button class="asb-o${cur.v === v ? " on" : ""}" data-v="${v}" type="button">${esc(l)}</button>`).join("")}</div>
          <p class="asb-hint">${nImp ? `★ Temes importants: ${nImp}. Compten el doble al resultat.` : "Toca ☆ abans de respondre si aquest tema et sembla especialment important: comptarà el doble."}</p>
          <div class="asb-nav"><button class="btn ghost sm" data-prev type="button"${i ? "" : " disabled"}>← Anterior</button><button class="btn ghost sm" data-skip type="button">Salta</button></div>
        </div>`;
      ctx.body.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => { ans[i] = { v: Number(b.dataset.v), imp: star }; next(); }));
      $("[data-imp]", ctx.body).addEventListener("click", () => { star = !star; if (ans[i]) ans[i].imp = star; if (typeof Sfx !== "undefined") Sfx.play("pick"); draw(); });
      $("[data-skip]", ctx.body).addEventListener("click", () => { ans[i] = { v: null, imp: false }; next(); });
      $("[data-prev]", ctx.body).addEventListener("click", () => { if (i) { i--; star = null; draw(); } });
    };
    const next = () => { star = null; if (i < ASSEMBLA_ITEMS.length - 1) { i++; draw(); } else assemblaResult(ctx, ans); };
    ctx.onKey((e) => { const k = Number(e.key); if (k >= 1 && k <= 5) { const b = ctx.body.querySelectorAll("[data-v]")[k - 1]; b?.click(); } });
    draw();
  },
});
