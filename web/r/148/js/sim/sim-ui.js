// Simulador del 29N · Components de la interfície que fan servir totes les pantalles del joc.
// Logos, brúixola ideològica, enquestes, votacions, caixes de «Què ha passat i per què?» i la imatge per compartir.

const SIM_GREY = "#ddd3bd";
const SIM_DISCLAIMER = "Joc de simulació amb finalitat educativa. Els partits i els candidats són reals, però tot el que passa a la partida és ficció: no és cap enquesta ni cap previsió del resultat del 29N.";
const SIM_APPROX = "Les prioritats, les línies vermelles i els vots de cada partit són una aproximació del joc a partir de la seva posició al comparador. No són declaracions dels partits.";
// Durant els cinc dies anteriors a la votació no es mostren les enquestes del joc (article 69.7 de la LOREG)
const simPollsHidden = () => typeof pollsBlocked === "function" && pollsBlocked();
// Nom del candidat d'un partit
const simCand = (s, id) => (id === "jo" ? (s.me.leader || `el candidat de ${s.me.sig}`) : simById(s, id)?.cand || simById(s, id)?.name);
const simPct = (x, d = 1) => (x * 100).toLocaleString("ca-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
const simNum = (x, d = 1) => Number(x).toLocaleString("ca-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

// Etiquetes dels eixos
const simAxis = {
  eco: (v) => (v < 3.5 ? "Esquerra econòmica" : v > 6.5 ? "Dreta econòmica" : "Centre econòmic"),
  ter: (v) => (v < 3 ? "Centralista" : v > 6.5 ? "Sobiranista" : "Autonomista"),
  val: (v) => (v < 3.5 ? "Progressista" : v > 6.5 ? "Conservador" : "Moderat"),
};
const simDist = simDistP;
const simById = simPartyById;

// Color del text sobre un color de partit: tinta sobre els colors clars, blanc sobre els foscos
function simInk(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? "#17173d" : "#fff";
}
// Pastilla amb les sigles (llistes, votacions, mapes)
const simLogo = (p, size = "") => `<span class="sim-logo ${size}" style="--pc:${p.color};color:${simInk(p.color)}">${esc(p.sig)}</span>`;

// Logo generat: una forma i la inicial del partit
const SIM_SHAPES = {
  cercle: "Cercle", quadrat: "Quadrat", hexagon: "Hexàgon", estrella: "Estrella",
};
function simShapePath(shape) {
  if (shape === "quadrat") return `<rect x="8" y="8" width="84" height="84" rx="18"/>`;
  if (shape === "hexagon") return `<path d="M50 5l39 22.5v45L50 95 11 72.5v-45z"/>`;
  if (shape === "estrella") return `<path d="M50 4l12.6 26.2 28.8 3.9-21 20 5.2 28.6L50 69 24.4 82.7l5.2-28.6-21-20 28.8-3.9z"/>`;
  return `<circle cx="50" cy="50" r="44"/>`;
}
function simLogoSvg(p, size = 64) {
  const ink = simInk(p.color);
  const initial = esc((p.name || p.sig || "?").trim().charAt(0).toUpperCase());
  return `<svg class="sim-logosvg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Logo de ${esc(p.name)}">
    <g fill="${p.color}" stroke="#17173d" stroke-width="5" stroke-linejoin="round">${simShapePath(p.shape)}</g>
    <text x="50" y="${p.shape === "estrella" ? 64 : 66}" text-anchor="middle" font-family="Unbounded, 'Arial Black', sans-serif" font-weight="900" font-size="${p.shape === "estrella" ? 34 : 46}" fill="${ink}">${initial}</text>
  </svg>`;
}

// Brúixola: economia (horitzontal) i valors (vertical), amb els rivals de referència
function simCompass(me, rivals = SIM_RIVALS) {
  const X = (v) => 14 + v * 17.2, Y = (v) => 186 - v * 17.2;
  const dots = rivals.map((r) => `<g class="sim-cp-r"><circle cx="${X(r.eco)}" cy="${Y(r.val)}" r="6" fill="${r.color}"/><text x="${X(r.eco)}" y="${Y(r.val) - 9}" text-anchor="middle">${r.sig}</text></g>`).join("");
  return `<svg class="sim-compass" viewBox="0 0 200 200" role="img" aria-label="Mapa ideològic: economia i valors">
    <rect x="14" y="14" width="172" height="172" rx="10" class="sim-cp-bg"/>
    <path d="M100 14v172M14 100h172" class="sim-cp-axis"/>
    <text x="100" y="10" text-anchor="middle" class="sim-cp-l">Conservador</text>
    <text x="100" y="198" text-anchor="middle" class="sim-cp-l">Progressista</text>
    <text x="18" y="96" class="sim-cp-l">Estat</text>
    <text x="182" y="96" text-anchor="end" class="sim-cp-l">Mercat</text>
    ${dots}
    ${me ? `<circle cx="${X(me.eco)}" cy="${Y(me.val)}" r="10" fill="${me.color}" class="sim-cp-me"/><text x="${X(me.eco)}" y="${Y(me.val) + 22}" text-anchor="middle" class="sim-cp-tu">TU</text>` : ""}
  </svg>`;
}
function simTerBar(me) {
  return `<div class="sim-terbar"><div class="sim-terbar-track">${SIM_RIVALS.map((r) => `<i style="left:${r.ter * 10}%;--pc:${r.color}" title="${r.name}"></i>`).join("")}
    ${me ? `<b style="left:${me.ter * 10}%;--pc:${me.color}"></b>` : ""}</div><div class="sim-terbar-l"><span>Centralisme</span><span>Sobiranisme</span></div></div>`;
}

// Barres d'una enquesta del joc (amb la variació respecte de l'anterior)
function simPollBars(s, poll, prev) {
  if (simPollsHidden()) return `<p class="sim-banner">Durant els cinc dies anteriors a la votació no es mostren enquestes, tampoc les del joc, perquè hi surten partits reals (article 69.7 de la LOREG).</p>`;
  const rows = [s.me, ...s.rivals].map((p) => ({ p, v: poll.est[p.id] || 0, d: prev ? (poll.est[p.id] || 0) - (prev.est[p.id] || 0) : null }))
    .sort((a, b) => b.v - a.v);
  const max = Math.max(...rows.map((r) => r.v), 1);
  return `<div class="sim-bars">${rows.map(({ p, v, d }) => `
    <div class="sim-bar ${p.id === "jo" ? "me" : ""}"><span class="sim-bar-n">${esc(p.sig)}</span>
      <span class="sim-bar-t"><i style="width:${(v / max) * 100}%;--pc:${p.color}"></i></span>
      <b>${simNum(v)} %</b>
      ${d === null ? "" : `<small class="${d > 0.05 ? "up" : d < -0.05 ? "down" : ""}">${d > 0.05 ? "▲" : d < -0.05 ? "▼" : "="}${Math.abs(d) >= 0.05 ? simNum(Math.abs(d)) : ""}</small>`}
    </div>`).join("")}</div>
    <p class="sim-note"><b>Enquesta del joc (ficció)</b> · ${fmt(poll.sample)} entrevistes · marge d'error ±${simNum(poll.margin)} punts</p>`;
}

// Mapa real d'Espanya per circumscripcions (SIM_MAP, sim-map.js). Cada província és un grup amb data-i;
// el color es posa després amb simPaintMap. Ceuta i Melilla tenen un cercle perquè es puguin tocar.
function simSpainMap(cls = "") {
  const M = SIM_MAP;
  const provs = SIM_PROVS.map((p) => {
    const g = M.provs[p.code];
    const tiny = p.code === "CE" || p.code === "ML";
    return `<g class="sim-pg" data-i="${p.i}" tabindex="0" role="button" aria-label="${esc(p.name)}, ${p.seats} ${p.seats === 1 ? "escó" : "escons"}">
      <path d="${g.d}"/>${tiny ? `<circle cx="${g.x}" cy="${g.y}" r="11"/>` : ""}
      <text class="sim-pg-n ${p.seats >= 7 ? "big" : ""}" x="${g.x}" y="${g.y + 5}">${p.seats}</text>
      <text class="sim-pg-mk" x="${g.x}" y="${g.y - 10}"></text>
    </g>`;
  }).join("");
  return `<svg class="sim-map ${cls}" viewBox="0 0 ${M.w} ${M.h}" role="group" aria-label="Mapa d'Espanya per circumscripcions">
    <path class="sim-map-bg" d="${M.bg}"/>
    <rect class="sim-map-can" x="${M.can.x}" y="${M.can.y}" width="${M.can.w}" height="${M.can.h}" rx="10"/>
    <text class="sim-map-cant" x="${M.can.x + 10}" y="${M.can.y + 18}">Canàries</text>
    ${provs}
  </svg>`;
}
// Pinta cada circumscripció: f(i) → { fill, ink, mark, sel, label }
function simPaintMap(svg, f) {
  $$(".sim-pg", svg).forEach((g) => {
    const i = Number(g.dataset.i), o = f(i) || {};
    g.style.setProperty("--f", o.fill || "var(--card)");
    g.style.setProperty("--t", o.ink || "var(--ink)");
    g.classList.toggle("sel", !!o.sel);
    g.classList.toggle("in", !!o.in);
    $(".sim-pg-mk", g).textContent = o.mark || "";
    if (o.label) g.setAttribute("aria-label", o.label);
  });
}
// Fa que les circumscripcions es puguin triar amb el ratolí, el dit o el teclat
function simMapPick(svg, cb) {
  $$(".sim-pg", svg).forEach((g) => {
    g.addEventListener("click", () => cb(Number(g.dataset.i)));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cb(Number(g.dataset.i)); } });
  });
}

// Munta una pantalla nova dins de l'escenari del joc
function simMount(G, html) {
  G.ctx.body.innerHTML = "";
  const el = h(html);
  G.ctx.body.appendChild(el);
  const top = $("#view-joc")?.getBoundingClientRect().top ?? 0;
  if (top < 0) window.scrollTo({ top: window.scrollY + top });
  return el;
}

// «Què ha passat i per què?»: causa, efecte i enllaç a l'Aprèn
function simExplain(text, link = null, title = "Què ha passat i per què?") {
  return `<div class="sim-why"><b>${title}</b><p>${rich(text)}</p>${link ? `<a href="#apren/${link}">Aprèn-ne més</a>` : ""}</div>`;
}

// Hemicicle amb els partits ordenats d'esquerra a dreta
const simHemiOrder = (s) => [s.me, ...s.rivals].sort((a, b) => (a.eco + a.val) - (b.eco + b.val));
function simHemi(s, seats, center = "") {
  return `<div class="hemi-wrap">${hemicycleSVG(simHemiOrder(s).map((p) => ({ id: p.id, color: p.color, seats: seats[p.id] || 0 })))}${center ? `<div class="hemi-center">${center}</div>` : ""}</div>`;
}

// Resultat d'una votació: barra de sís, abstencions i nos, amb la marca dels 176
function simVoteBar(r, absolute = true) {
  const w = (n) => `${(n / 350) * 100}%`;
  return `<div class="sim-vbar" role="img" aria-label="${r.si} vots a favor, ${r.abs} abstencions i ${r.no} en contra">
    <div class="sim-vbar-t"><i class="si" style="width:${w(r.si)}"></i><i class="abs" style="width:${w(r.abs)}"></i><i class="no" style="width:${w(r.no)}"></i>${absolute ? `<span class="sim-vbar-m" style="left:${(176 / 350) * 100}%"></span>` : ""}</div>
    <div class="sim-vbar-l"><span class="si"><b>${r.si}</b> sí</span><span class="abs"><b>${r.abs}</b> abstencions</span><span class="no"><b>${r.no}</b> no</span></div>
  </div>`;
}
const SIM_VOTE_LABEL = { si: "Sí", abs: "Abstenció", no: "No" };
function simVoteRows(s, votes, seats) {
  return `<ul class="sim-vrows">${Object.keys(votes).sort((a, b) => (seats[b] || 0) - (seats[a] || 0)).map((id) => {
    const p = simById(s, id), v = votes[id];
    const vv = typeof v === "string" ? v : v.v;
    return `<li class="${id === "jo" ? "me" : ""}">${simLogo(p)}<span class="n"><b>${esc(p.name)}</b>${v.why ? `<small>${esc(v.why)}</small>` : ""}</span><span class="seats">${seats[id] || 0}</span><em class="v ${vv}">${SIM_VOTE_LABEL[vv]}</em></li>`;
  }).join("")}</ul>`;
}

// =========================================================
// Imatge per compartir (sense enviar res a cap servidor)
// =========================================================
function simShareCanvas(s, info) {
  const W = 1080, H = 1080;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const INK = "#17173d", PAPER = "#f1e9d8", CARD = "#fffaf0";
  const display = (size, weight = 900) => `${weight} ${size}px Unbounded, "Arial Black", sans-serif`;
  const sans = (size, weight = 600) => `${weight} ${size}px "DM Sans", system-ui, sans-serif`;
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(23,23,61,.08)";
  for (let x = 6; x < W; x += 18) for (let y = 6; y < H; y += 18) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
  // Capçalera
  c.fillStyle = INK; c.fillRect(0, 0, W, 120);
  c.fillStyle = "#ffcf3d"; c.font = display(40); c.textAlign = "left"; c.fillText("SIMULADOR DEL 29N", 60, 76);
  c.fillStyle = CARD; c.font = sans(26, 700); c.textAlign = "right"; c.fillText("Del carrer a la Moncloa", W - 60, 74);
  // Targeta
  const round = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  c.fillStyle = INK; round(70, 180, W - 128, 800, 36); c.fill();
  c.fillStyle = CARD; round(60, 170, W - 128, 800, 36); c.fill();
  c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
  // Logo i nom
  const lx = 150, ly = 290;
  c.fillStyle = s.me.color; c.strokeStyle = INK; c.lineWidth = 6;
  c.beginPath();
  if (s.me.shape === "quadrat") round(lx - 70, ly - 70, 140, 140, 28);
  else if (s.me.shape === "hexagon") { for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k - Math.PI / 2; c[k ? "lineTo" : "moveTo"](lx + Math.cos(a) * 74, ly + Math.sin(a) * 74); } c.closePath(); }
  else if (s.me.shape === "estrella") { for (let k = 0; k < 10; k++) { const a = Math.PI / 5 * k - Math.PI / 2, r = k % 2 ? 34 : 76; c[k ? "lineTo" : "moveTo"](lx + Math.cos(a) * r, ly + Math.sin(a) * r); } c.closePath(); }
  else c.arc(lx, ly, 72, 0, Math.PI * 2);
  c.fill(); c.stroke();
  c.fillStyle = simInk(s.me.color); c.font = display(s.me.shape === "estrella" ? 44 : 64); c.textAlign = "center"; c.fillText(s.me.name.charAt(0).toUpperCase(), lx, ly + (s.me.shape === "estrella" ? 16 : 23));
  c.textAlign = "left"; c.fillStyle = INK; c.font = display(s.me.name.length > 16 ? 44 : 56);
  c.fillText(s.me.name, 250, 285);
  c.font = sans(30, 500); c.fillStyle = "#3a3a63";
  c.fillText(s.me.motto ? `«${s.me.motto}»` : `${s.me.sig} · ${simAxis.eco(s.me.eco)}`, 252, 330);
  // Escons
  c.fillStyle = INK; c.font = display(150); c.textAlign = "left"; c.fillText(String(info.seats), 96, 520);
  const sw = c.measureText(String(info.seats)).width;
  c.font = display(34); c.fillText(info.seats === 1 ? "ESCÓ" : "ESCONS", 120 + sw, 470);
  c.font = sans(28, 600); c.fillStyle = "#3a3a63"; c.fillText(info.sub, 122 + sw, 512);
  // Hemicicle
  const seats = hemicycleSeats(350);
  const order = simHemiOrder(s);
  let k = 0;
  const cx = W / 2 + 10, cy = 860, R = 330;
  order.forEach((p) => {
    for (let n = 0; n < (info.seatMap[p.id] || 0); n++) {
      const st = seats[k++]; if (!st) return;
      c.beginPath(); c.arc(cx + st.x * R, cy + st.y * R, 8.4, 0, Math.PI * 2);
      c.fillStyle = p.color; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
    }
  });
  c.textAlign = "center"; c.fillStyle = INK; c.font = display(30); c.fillText(info.line, cx, 920);
  c.font = sans(24, 500); c.fillStyle = "#6e6a82"; c.fillText(info.line2 || "", cx, 955);
  // Peu
  c.fillStyle = INK; c.font = sans(22, 600); c.fillText(`${SIM_DISCLAIMER}`, W / 2, 1030);
  return cv;
}

async function simShare(s, info) {
  const text = `He jugat al Simulador del 29N amb «${s.me.name}»: ${info.seats} ${info.seats === 1 ? "escó" : "escons"}. ${info.line}. ${location.origin}${location.pathname}#joc/simulador`;
  const cv = simShareCanvas(s, info);
  const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
  const file = blob && new File([blob], "simulador-29n.png", { type: "image/png" });
  try {
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return "shared"; }
  } catch (e) { if (e?.name === "AbortError") return "cancel"; }
  try { await navigator.clipboard?.writeText(text); } catch { /* sense porta-retalls */ }
  if (blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "simulador-29n.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  toast("S'ha descarregat la imatge i s'ha copiat el text");
  return "download";
}
