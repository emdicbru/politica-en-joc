// Jornada i nit electoral del 29N (pàgina #nit). Fa servir la configuració, les fases i el bucle en directe d'especial.js.
// · El motor: a cada circumscripció, el repartiment per la Llei d'Hondt i, sobretot, l'últim escó: qui el té, quants
//   vots li falten a cada rival per prendre-l'hi i si «balla» (el marge és petit, i encara més mentre queda per escrutar).
//   D'aquí surten la forquilla d'escons de cada partit i les sumes que arriben a 176.
// · La pàgina: un marcador amb el titular de la nit, el Congrés amb les forquilles, els escons en joc, el mapa (qui guanya
//   o què balla), les majories possibles i l'última hora. El dia de la votació (i abans), els escons a vigilar segons el 2023.
// · El simulacre de la Sala de control parteix dels vots reals del 2023 (nit-2023.js), amb canvis inventats.

const NIT_MAJ = 176;
// Candidatures que no són a PARTIES (sobretot del 2023): sigla i color
const NIT_EXTRA = {
  upn: ["UPN", "#1c3f94"], cup: ["CUP", "#e8c300"], ncbc: ["NC-BC", "#5fb0c9"], pdecat: ["PDeCAT", "#2a5fa8"], adelante: ["Adelante", "#3aa060"],
  te: ["Teruel Existe", "#00826f"], eva: ["España Vaciada", "#3a9c3a"], pacma: ["PACMA", "#9cc23a"], bqex: ["BQEx", "#3a8c3a"], gbai: ["Geroa Bai", "#d6243a"],
  par: ["PAR", "#e8b400"], somoscc: ["Somos CyL", "#7a5aa8"], upl: ["UPL", "#b5326a"], xav: ["XAV", "#3a8c8c"], altres: ["Otros", "#b5aea0"],
};
const nitParty = (k) => {
  const p = espParty(k);
  if (PARTIES.some((x) => x.id === k) || !NIT_EXTRA[k]) return p;
  return { id: k, sig: NIT_EXTRA[k][0], name: NIT_EXTRA[k][0], color: NIT_EXTRA[k][1] };
};
const nitSig = (k) => nitParty(k).sig;
// Els dos blocs de la investidura de Pedro Sánchez del novembre del 2023 (Sumar, ara Frente Amplio i Podemos)
const NIT_BLOCS = [
  { id: "si", t: "Invistieron a Sánchez en 2023", ids: ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"] },
  { id: "no", t: "Votaron en contra", ids: ["pp", "vox", "upn"] },
];
const nitBloc = (d, b) => b.ids.reduce((a, k) => a + (d.seats[k] || 0), 0);
// «A i B», «A, B i C»
const nitAnd = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")}${typeof PEJ_LANG !== "undefined" && PEJ_LANG === "es" ? " y " : " i "}${list[list.length - 1]}`);
const nitN = (n) => fmt(Math.round(n));
const nitPct = (x, d = 1) => espPct(x * 100, d);

// ---------- Motor ----------
// Una circumscripció: escons i l'últim escó. «escrutat» (0-100) fa més amples els marges que es consideren en joc.
function nitProv(vots, blanc, seats, escrutat = 100) {
  const ids = Object.keys(vots).filter((k) => k !== "altres" && vots[k] > 0);
  const valid = Object.values(vots).reduce((a, b) => a + b, 0) + (blanc || 0);
  // El 3 % amb enters (100 × vots ≥ 3 × vàlids): amb decimals, a la frontera s'equivocaria per un vot
  const ok = (k) => valid > 0 && 100 * vots[k] >= 3 * valid;
  const q = [];
  ids.filter(ok).forEach((k) => { for (let d = 1; d <= seats; d++) q.push({ k, d, v: vots[k] / d }); });
  // En cas d'empat, la candidatura amb més vots (art. 163.1 LOREG)
  q.sort((a, b) => b.v - a.v || vots[b.k] - vots[a.k]);
  const won = {};
  q.slice(0, seats).forEach((x) => { won[x.k] = (won[x.k] || 0) + 1; });
  const last = q[seats - 1] || null;
  // Vots que falten a cada candidatura per quedar-se l'últim escó, amb enters: el seu quocient següent ha de superar
  // l'últim que entra (vots × divisor), o igualar-lo amb més vots totals (empat, art. 163.1 LOREG). Si no arriba al 3 %,
  // també n'ha de tenir prou per passar-lo, tenint en compte que els vots que guanya també fan créixer els vàlids.
  const needs = {};
  if (last) ids.forEach((k) => {
    if (k === last.k) return;
    const v = vots[k], div = (won[k] || 0) + 1, hv = vots[last.k], hd = last.d;
    // (v + n) × hd > hv × div  →  n > hv × div / hd − v
    const A = hv * div;
    let n = Math.floor(A / hd) - v + 1;
    if (A % hd === 0 && A / hd > hv) n = A / hd - v; // empat de quocient: guanya qui té més vots totals
    if (!ok(k)) {
      // 100 × (v + t) ≥ 3 × (vàlids + t)  →  t ≥ (3 × vàlids − 100 × v) / 97
      const t = Math.max(0, Math.ceil((3 * valid - 100 * v) / 97));
      n = Math.max(n, t);
    }
    if (n > 0) needs[k] = n;
  });
  // La barrera del 3 %: si un partit amb escó en té just el 3 %, els vots que guanya un altre (que fan créixer els vàlids)
  // el poden deixar per sota i fer-li perdre els escons. Aleshores es recompta de debò per trobar el mínim exacte.
  const alloc = (vv) => {
    const val = Object.values(vv).reduce((a, b) => a + b, 0) + (blanc || 0), qq = [];
    Object.keys(vv).filter((k) => k !== "altres" && vv[k] > 0 && 100 * vv[k] >= 3 * val).forEach((k) => { for (let d = 1; d <= seats; d++) qq.push({ k, v: vv[k] / d }); });
    qq.sort((a, b) => b.v - a.v || vv[b.k] - vv[a.k]);
    const w = {};
    qq.slice(0, seats).forEach((x) => { w[x.k] = (w[x.k] || 0) + 1; });
    return { w, val };
  };
  const fragile = ids.filter((k) => won[k]).map((k) => ({ k, x: Math.floor((100 * vots[k] - 3 * valid) / 3) + 1 }));
  Object.keys(needs).forEach((k) => {
    if (!fragile.some((f) => f.k !== k && f.x < needs[k])) return;
    let lo = 0, hi = needs[k];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((alloc({ ...vots, [k]: vots[k] + mid }).w[k] || 0) > (won[k] || 0)) hi = mid; else lo = mid; }
    needs[k] = hi;
  });
  const ch = Object.entries(needs).sort((a, b) => a[1] - b[1])[0];
  // Qui perdria l'escó si el rival hi arriba (normalment, qui té l'últim; amb la barrera, qui queda per sota del 3 %)
  let victim = last?.k || null, barrier = false;
  if (ch) {
    const after = alloc({ ...vots, [ch[0]]: vots[ch[0]] + ch[1] });
    const lost = ids.find((k) => k !== ch[0] && (after.w[k] || 0) < (won[k] || 0));
    if (lost) { victim = lost; barrier = 100 * vots[lost] < 3 * after.val; }
  }
  const margin = ch && valid ? ch[1] / valid : null;
  const left = 1 - Math.min(100, Math.max(0, escrutat)) / 100;
  const lvl = margin === null ? null : margin < 0.003 + 0.012 * left ? "fil" : margin < 0.01 + 0.04 * left ? "ajustat" : null;
  // Quocients al voltant del tall: els tres últims que entren i els dos primers que queden fora
  const from = Math.max(0, seats - 3);
  const ladder = q.slice(from, seats + 2).map((x, i) => ({ k: x.k, d: x.d, v: x.v, n: from + i + 1, in: from + i < seats }));
  // Fins on pot arribar el rival: el seu quocient següent respecte de l'últim que entra
  const chNext = ch ? vots[ch[0]] / ((won[ch[0]] || 0) + 1) : 0;
  return { valid, won, victim, barrier, holder: last?.k || null, lastQ: last?.v || 0, challenger: ch?.[0] || null, need: ch?.[1] || null, margin, lvl, needs, ladder, ratio: last ? Math.min(1, chNext / last.v) : 0 };
}

// Resultats del motor sobre el format de l'escrutini: { escrutat, participacio, actualitzat, provs: [{ code, escrutat, vots, blanc }] }
function espCompute(raw) {
  const tot = {}, seats = {}, perProv = [];
  let valid = 0;
  raw.provs.forEach((pr) => {
    const p = SIM_PROVS.find((x) => x.code === pr.code);
    if (!p) return;
    const nSeats = pr.seats || p.seats;
    const an = nitProv(pr.vots || {}, pr.blanc || 0, nSeats, pr.escrutat ?? 100);
    valid += an.valid;
    Object.entries(pr.vots || {}).forEach(([k, n]) => { tot[k] = (tot[k] || 0) + n; });
    Object.entries(an.won).forEach(([k, n]) => { seats[k] = (seats[k] || 0) + n; });
    const top = Object.entries(pr.vots || {}).filter(([k]) => k !== "altres").sort((a, b) => b[1] - a[1])[0];
    perProv.push({
      i: p.i, code: p.code, name: p.name, ccaa: p.ccaa, seats: nSeats, escrutat: pr.escrutat ?? 100, won: an.won, vots: pr.vots || {}, valid: an.valid,
      winner: top && top[1] ? top[0] : null, an,
      air: an.holder && an.challenger ? { holder: an.holder, rival: an.challenger, need: an.need } : null,
    });
  });
  const totalSeats = Object.values(seats).reduce((a, b) => a + b, 0);
  const ranking = Object.keys(tot).filter((k) => k !== "altres").sort((a, b) => (seats[b] || 0) - (seats[a] || 0) || tot[b] - tot[a]);
  const d = { escrutat: raw.escrutat, participacio: raw.participacio, actualitzat: raw.actualitzat, simulacre: !!raw.simulacre, tot, valid, seats, totalSeats, provs: perProv, ranking };
  nitDerive(d);
  return d;
}
// Escons en joc, forquilles i sumes de 176
function nitDerive(d) {
  d.ballen = d.provs.filter((p) => p.an.lvl).sort((a, b) => a.an.margin - b.an.margin);
  d.range = {};
  Object.keys(d.seats).forEach((k) => { d.range[k] = [d.seats[k], d.seats[k]]; });
  d.ballen.forEach((p) => {
    const h = p.an.victim || p.an.holder, c = p.an.challenger;
    (d.range[h] ||= [d.seats[h] || 0, d.seats[h] || 0])[0]--;
    (d.range[c] ||= [d.seats[c] || 0, d.seats[c] || 0])[1]++;
  });
  d.sums = nitSums(d);
}
// Sumes mínimes que arriben a 176 (cap partit hi sobra), de menys a més partits
function nitSums(d) {
  const ids = Object.keys(d.seats).filter((k) => d.seats[k] > 0).sort((a, b) => d.seats[b] - d.seats[a]).slice(0, 14);
  const out = [];
  for (let m = 1; m < 1 << ids.length; m++) {
    const set = ids.filter((_, i) => m & (1 << i));
    if (set.length > 6) continue;
    const sum = set.reduce((a, k) => a + d.seats[k], 0);
    if (sum < NIT_MAJ || set.some((k) => sum - d.seats[k] >= NIT_MAJ)) continue;
    const min = set.reduce((a, k) => a + (d.range[k]?.[0] ?? d.seats[k]), 0);
    out.push({ ids: set, sum, min, st: min >= NIT_MAJ ? "ok" : "fil" });
  }
  return out.sort((a, b) => a.ids.length - b.ids.length || b.sum - a.sum);
}
const nitTwo = (d) => d.sums.filter((s) => s.ids.length <= 2);
// Qui pot governar: les dues opcions de govern i els suports que necessitarien. Els suports possibles són els partits
// que van votar cada investidura el 2023 (un fet, no una opinió): Feijóo, el setembre, i Sánchez, el novembre.
const NIT_GOV = [
  { id: "pp", core: ["pp", "vox"], pool: ["upn", "cc"], poolT: "los que votaron a Feijóo en 2023" },
  { id: "psoe", core: ["psoe", "fa"], pool: ["podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"], poolT: "los que invistieron a Sánchez en 2023" },
];
function nitGov(d, g) {
  const s = (k) => d.seats[k] || 0, lo = (k) => d.range[k]?.[0] ?? s(k), hi = (k) => d.range[k]?.[1] ?? s(k);
  const sum = g.core.reduce((a, k) => a + s(k), 0);
  const min = g.core.reduce((a, k) => a + lo(k), 0), max = g.core.reduce((a, k) => a + hi(k), 0);
  const pool = g.pool.filter((k) => s(k) > 0).sort((a, b) => s(b) - s(a));
  const all = sum + pool.reduce((a, k) => a + s(k), 0);
  const out = { ...g, sum, min, max, pool, all, need: Math.max(0, NIT_MAJ - sum) };
  if (sum >= NIT_MAJ) { out.st = min >= NIT_MAJ ? "maj" : "fil"; return out; }
  if (all < NIT_MAJ) { out.st = all + pool.reduce((a, k) => a + (hi(k) - s(k)), 0) + (max - sum) >= NIT_MAJ ? "lluny-fil" : "no"; return out; }
  out.st = "suports";
  // Imprescindibles: sense ells, ni amb tots els altres suports s'hi arriba
  out.key = pool.filter((k) => all - s(k) < NIT_MAJ);
  // Les sumes més curtes (de menys partits) que hi arriben, sense cap partit que hi sobri
  const combos = [];
  for (let m = 1; m < 1 << pool.length; m++) {
    const set = pool.filter((_, i) => m & (1 << i));
    const t = sum + set.reduce((a, k) => a + s(k), 0);
    if (t >= NIT_MAJ && set.every((k) => t - s(k) < NIT_MAJ)) combos.push({ ids: set, t });
  }
  combos.sort((a, b) => a.ids.length - b.ids.length || b.t - a.t);
  out.combos = combos.filter((c) => c.ids.length === combos[0].ids.length).slice(0, 2);
  return out;
}
// El titular de la nit, en dues frases (només aritmètica: qui va primer i quines sumes arriben a 176)
function nitTitular(d) {
  const w = d.ranking[0];
  if (!w || !d.seats[w]) return null;
  const n = d.seats[w], ref = ESP_2023[w]?.[0];
  const done = d.escrutat >= 100;
  const delta = ref === undefined ? "" : n === ref ? ", los mismos que en 2023" : ` (${n > ref ? "+" : "−"}${Math.abs(n - ref)} respecto a 2023)`;
  const t1 = `${nitSig(w)} ${done ? "gana" : "va primero"} con ${n} escaños${delta}`;
  let t2;
  if (n >= NIT_MAJ) t2 = `${nitSig(w)} tiene mayoría absoluta${d.range[w]?.[0] < NIT_MAJ ? ", pero depende de escaños en juego" : ""}.`;
  else {
    // La suma dels dos primers (la gran coalició) gairebé sempre arriba a 176: no és notícia
    const big = d.ranking.slice(0, 2).filter((k) => d.seats[k]);
    const two = nitTwo(d).filter((s) => !big.every((k) => s.ids.includes(k)));
    const c = two.find((s) => s.ids.includes(w));
    if (c) t2 = `${nitAnd(c.ids.map(nitSig))} suman ${c.sum}: ${c.sum === NIT_MAJ ? "justo la mayoría absoluta" : "por encima de la mayoría absoluta (176)"}${c.st === "fil" ? ", pero depende de escaños en juego" : ""}.`;
    else {
      const [a, b] = NIT_BLOCS.map((x) => nitBloc(d, x));
      t2 = `${nitSig(w)} no llega a 176 con ningún socio solo. Los partidos que invistieron a Sánchez en 2023 suman ${a}; PP, Vox y UPN, ${b}.`;
    }
  }
  return { t1, t2 };
}
// El 2023 com si fos una nit acabada (per als escons a vigilar i per comparar)
let nit2023Cache = null;
function nit2023() {
  if (nit2023Cache) return nit2023Cache;
  nit2023Cache = espCompute({ escrutat: 100, participacio: 66.6, provs: Object.entries(NIT_2023).map(([code, x]) => ({ code, escrutat: 100, vots: x.v, blanc: x.b, seats: Object.values(x.s).reduce((a, b) => a + b, 0) })) });
  return nit2023Cache;
}

// ---------- Simulacre (Sala de control): els vots del 2023 amb canvis inventats ----------
function espSimulacre(progress) {
  const seed = Math.floor((espPreview()?.simInici || Esp.cfg.simInici || 7) / 1000) % 9973;
  const rnd = (s) => { const x = Math.sin((s + seed * 0.37) * 9301.7) * 49297; return x - Math.floor(x); };
  // Canvis respecte al 2023 (inventats, i diferents a cada simulacre)
  const sw = (k, base, spread) => base * (1 + spread * (rnd(k.length * 7 + k.charCodeAt(0)) - 0.5));
  const SW = { pp: sw("pp", 0.98, 0.12), psoe: sw("psoe", 0.97, 0.12), vox: sw("vox", 1.12, 0.2), fa: sw("fa", 0.92, 0.2), erc: sw("erc", 1.04, 0.2), junts: sw("junts", 0.98, 0.2), bildu: sw("bildu", 1.06, 0.15), pnv: sw("pnv", 0.95, 0.15), bng: sw("bng", 1.3, 0.3), cc: sw("cc", 1, 0.2) };
  const podemosOfFa = 0.22, salf = 0.022 + 0.012 * rnd(91);
  const BIAS = { pp: 0.07, vox: 0.05, psoe: -0.01, fa: -0.09, podemos: -0.07 }; // primers vots: zones rurals
  let sumEsc = 0, sumW = 0;
  const provs = SIM_PROVS.map((p, i) => {
    const b = NIT_2023[p.code];
    const valid23 = Object.values(b.v).reduce((a, c) => a + c, 0) + b.b;
    const fin = {};
    Object.entries(b.v).forEach(([k, n], j) => {
      const f = (SW[k] ?? 1) * (0.93 + 0.14 * rnd(i * 17 + j));
      if (k === "fa") { fin.fa = n * f * (1 - podemosOfFa); fin.podemos = n * f * podemosOfFa * (0.85 + 0.3 * rnd(i + 401)); } else fin[k] = n * f;
    });
    fin.salf = valid23 * salf * (0.6 + 0.8 * rnd(i * 3 + 77));
    // Les circumscripcions petites s'escruten més de pressa
    const speed = 0.95 + 0.4 * rnd(i + 3) + (p.seats <= 5 ? 0.3 : 0);
    const e = Math.max(0, Math.min(1, progress * speed * 1.08 - 0.03 * rnd(i + 9)));
    const vots = {};
    Object.entries(fin).forEach(([k, n]) => { vots[k] = Math.round(n * e * (1 + (BIAS[k] || 0) * (1 - e) * 2)); });
    sumEsc += e * valid23; sumW += valid23;
    return { code: p.code, escrutat: Math.round(e * 1000) / 10, vots, blanc: Math.round(b.b * e) };
  });
  const part = 66.6 + 5 * (rnd(57) - 0.5);
  return { escrutat: Math.round((sumEsc / sumW) * 1000) / 10, participacio: progress > 0 ? Math.round((part - 1.2 * (1 - progress)) * 100) / 100 : null, actualitzat: Date.now(), provs, simulacre: true };
}

// ---------- Estat de la pàgina ----------
const Nit = { sel: null, party: null, map: "guanya", filter: null, all: false, coal: new Set() };
const espCoal = Nit.coal;
const nitLive = () => ["nit", "despres"].includes(espFase()) && espResultsMode() !== "off";

// ---------- Peces ----------
const nitChip = (k, extra = "") => { const p = nitParty(k); return `<span class="nt-pc ${extra}" style="--c:${p.color}"><i></i>${esc(p.sig)}</span>`; };
function nitHemi(d, ref = null) {
  const ids = Object.keys(d.seats).filter((k) => d.seats[k]).sort((a, b) => (ESP_ORDER.indexOf(a) + 1 || 50) - (ESP_ORDER.indexOf(b) + 1 || 50));
  const list = ids.map((k) => ({ id: k, seats: d.seats[k], color: nitParty(k).color }));
  const rest = 350 - d.totalSeats;
  if (rest > 0) list.push({ id: "pendent", seats: rest, color: "#ddd6c6" });
  return `<div class="nt-hemi">${hemicycleSVG(list)}<span class="nt-hemi-maj" aria-hidden="true"></span><div class="nt-hemi-c"><b>${d.totalSeats}</b><small>de 350 escaños${ref ? ` · ${esc(ref)}` : ""}</small></div></div>`;
}
// Fila de la cursa: escons, forquilla (si n'hi ha), diferència amb el 2023 i vots
function nitRace(d, { prev = null, open = null, compare = true } = {}) {
  const rows = d.ranking.filter((k) => d.seats[k] || (d.range[k]?.[1] || 0) > 0 || d.tot[k] / d.valid >= 0.01);
  const top = Math.max(NIT_MAJ + 14, ...rows.map((k) => d.range[k]?.[1] || d.seats[k] || 0));
  const x = (n) => `${(Math.min(n, top) / top) * 100}%`;
  return `<div class="nt-race" style="--maj:${x(NIT_MAJ)}">${rows.map((k) => {
    const p = nitParty(k), s = d.seats[k] || 0, [lo, hi] = d.range[k] || [s, s], ref = ESP_2023[k]?.[0];
    const diff = compare && ref !== undefined ? s - ref : null;
    const moved = prev ? s - (prev.seats[k] || 0) : 0;
    return `<button type="button" class="nt-row ${moved > 0 ? "flash-up" : moved < 0 ? "flash-down" : ""} ${open === k ? "on" : ""}" data-party="${k}" style="--c:${p.color}" aria-expanded="${open === k}">
      <span class="nt-row-n"><i></i>${esc(p.sig)}</span>
      <span class="nt-row-bar"><i style="width:${x(s)}"></i>${hi > lo ? `<u style="left:${x(lo)};width:calc(${x(hi)} - ${x(lo)})" title="Horquilla: de ${lo} a ${hi}"></u>` : ""}</span>
      <b class="nt-row-s">${s}${moved ? `<small class="${moved > 0 ? "up" : "down"}">${moved > 0 ? "▲" : "▼"}${Math.abs(moved)}</small>` : ""}</b>
      <span class="nt-row-r">${hi > lo ? `${lo}–${hi}` : ""}</span>
      <span class="nt-row-d ${diff > 0 ? "up" : diff < 0 ? "down" : ""}">${diff === null ? "" : diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}`}</span>
      <span class="nt-row-v">${d.valid ? espPct((d.tot[k] / d.valid) * 100) : ""}</span>
    </button>${open === k ? nitPartyFocus(d, k) : ""}`;
  }).join("")}</div>`;
}
// Un partit: on pot guanyar un escó i on en pot perdre un
function nitPartyFocus(d, k) {
  const gain = d.provs.filter((p) => p.an.needs[k] && p.an.holder !== k).map((p) => ({ p, need: p.an.needs[k] })).sort((a, b) => a.need - b.need).slice(0, 3);
  const lose = d.provs.filter((p) => (p.an.victim || p.an.holder) === k && p.an.need).sort((a, b) => a.an.need - b.an.need).slice(0, 3);
  const line = (p, n, who) => `<li><b>${esc(p.name)}</b><span>${who}</span><em>${nitN(n)} votos <small>(${nitPct(n / p.valid)})</small></em></li>`;
  return `<div class="nt-focus" style="--c:${nitParty(k).color}">
    <div><h4>Dónde puede ganar un escaño</h4>${gain.length ? `<ul>${gain.map(({ p, need }) => line(p, need, `se lo quitaría a ${esc(nitSig(p.an.victim || p.an.holder))}`)).join("")}</ul>` : `<p class="muted">En ningún sitio cerca.</p>`}</div>
    <div><h4>Dónde puede perder uno</h4>${lose.length ? `<ul>${lose.map((p) => line(p, p.an.need, `lo disputa ${esc(nitSig(p.an.challenger))}`)).join("")}</ul>` : `<p class="muted">No tiene ningún último escaño.</p>`}</div>
  </div>`;
}
// Targeta d'un escó en joc
function nitDuel(p, { flip = false, year = "" } = {}) {
  const a = p.an;
  return `<button type="button" class="nt-duel lvl-${a.lvl || "seguro"}" data-prov="${p.i}">
    <span class="nt-duel-h"><b>${esc(p.name)}</b><small>${p.seats} ${p.seats === 1 ? "escaño" : "escaños"}${p.escrutat < 100 ? ` · ${espPct(p.escrutat, 0)} escrutado` : year ? ` · ${esc(year)}` : ""}</small>${a.lvl ? `<em class="nt-badge">${a.lvl === "fil" ? "Al filo" : "Ajustado"}</em>` : ""}</span>
    <span class="nt-vs">${nitChip(a.victim || a.holder, "has")}<span class="nt-vs-a" aria-hidden="true">⇄</span>${nitChip(a.challenger)}</span>
    <span class="nt-need">${year ? `A ${esc(nitSig(a.challenger))} le faltaron` : `A ${esc(nitSig(a.challenger))} le faltan`} <b>${nitN(a.need)}</b> votos <small>(${nitPct(a.margin, 2)})</small></span>
    <span class="nt-tug" aria-hidden="true"><i style="width:${(a.ratio * 100).toFixed(1)}%;--c:${nitParty(a.challenger).color}"></i></span>
    ${a.barrier ? `<span class="nt-barrier">${esc(nitSig(a.victim))} quedaría por debajo del 3 % y perdería el escaño</span>` : ""}
    ${flip ? `<span class="nt-flip">↻ Acaba de cambiar de manos</span>` : ""}
  </button>`;
}
// Detall d'una circumscripció: escons, el tall de la Llei d'Hondt i el marge
function nitProvDetail(p, ref) {
  if (!p) return `<p class="muted nt-pick">👆 Toca una circunscripción para ver sus escaños y por qué baila el último.</p>`;
  const a = p.an, r23 = ref?.provs.find((x) => x.code === p.code);
  const ks = [...new Set([...Object.keys(a.won), ...Object.keys(r23?.won || {})])].sort((x, y) => (a.won[y] || 0) - (a.won[x] || 0));
  return `<h3>${esc(p.name)}</h3>
    <p class="muted">${p.seats} ${p.seats === 1 ? "escaño" : "escaños"}${p.escrutat < 100 ? ` · ${espPct(p.escrutat)} escrutado` : ""}</p>
    <div class="nt-pd-s">${ks.map((k) => { const n = a.won[k] || 0, o = r23?.won[k] || 0; return `<span style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))} <b>${n}</b>${r23 && n !== o ? `<small class="${n > o ? "up" : "down"}">${n > o ? "+" : "−"}${Math.abs(n - o)}</small>` : ""}</span>`; }).join("") || "<span>Todavía sin escaños</span>"}</div>
    ${a.ladder.length ? `<div class="nt-ladder"><p class="nt-ladder-t">Cómo se han repartido los últimos escaños</p>${a.ladder.map((x, j) => `${!x.in && (j === 0 || a.ladder[j - 1].in) ? `<div class="nt-cut"><span>corte: ${p.seats} ${p.seats === 1 ? "escaño" : "escaños"}</span></div>` : ""}<div class="nt-lq ${x.in ? "in" : "out"}" style="--c:${nitParty(x.k).color}"><span>${x.in ? `escaño ${x.n}` : "fora"}</span>${nitChip(x.k)}<em>${nitN(x.v)}</em></div>`).join("")}<p class="nt-ladder-h">Los votos de cada partido se dividen por 1, 2, 3… Los escaños van a los cocientes más altos.</p></div>` : ""}
    ${a.challenger ? `<p class="nt-pd-m ${a.lvl ? `lvl-${a.lvl}` : ""}">El último escaño es de <b>${esc(nitSig(a.holder))}</b>. ${esc(nitSig(a.challenger))} se lo quedaría con <b>${nitN(a.need)}</b> votos más (${nitPct(a.margin, 2)} de los válidos).</p>` : ""}`;
}

// ---------- Pàgina ----------
function renderNit(arg) {
  const root = $("#nit-page");
  if (!root) return;
  const f = espFase();
  root.innerHTML = `${espPreviewBar()}
    <div class="nt">
      <header class="nt-hero" data-hero></header>
      <div data-gov></div>
      <nav class="nt-tabs" aria-label="Secciones de la noche electoral" data-tabs></nav>
      <div class="nt-cols">
        <div class="nt-main" data-main></div>
        <aside class="nt-rail">
          <div data-pred-box></div>
          <div data-pron-box></div>
          <div data-porra-box></div>
        </aside>
      </div>
      <p class="sim-fiction" data-src></p>
    </div>`;
  espBind(root);
  root.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-share]")) return;
    const t = nitLive() && Esp.data ? nitTitular(Esp.data) : null;
    const text = t ? `${t.t1}. ${t.t2} Sigue la noche electoral en directo 🗳️` : "Sigue la noche electoral del 29N en directo en Política en Joc 🗳️";
    const url = `${location.origin}${location.pathname}#nit`;
    try { if (navigator.share) await navigator.share({ title: "Noche electoral", text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); toast("Enlace copiado"); } } catch { /* cancel·lat */ }
  });
  // Delegació: tot el que es toca dins de la pàgina
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-party],[data-prov],[data-map],[data-filter],[data-all],[data-coal],[data-coal-clear],[data-sum]");
    if (!t || !root.contains(t)) return;
    if (t.dataset.party) { Nit.party = Nit.party === t.dataset.party ? null : t.dataset.party; espPaint(); }
    else if (t.dataset.prov) { Nit.sel = Number(t.dataset.prov); espPaint(); $("#nt-mapa", root)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (t.dataset.map) { Nit.map = t.dataset.map; espPaint(); }
    else if (t.dataset.filter !== undefined) { Nit.filter = t.dataset.filter || null; Nit.all = false; espPaint(); }
    else if (t.dataset.all !== undefined) { Nit.all = !Nit.all; espPaint(); }
    else if (t.dataset.coal) { const k = t.dataset.coal; Nit.coal.has(k) ? Nit.coal.delete(k) : Nit.coal.add(k); espPaint(); }
    else if (t.dataset.coalClear !== undefined) { Nit.coal.clear(); espPaint(); }
    else if (t.dataset.sum) { Nit.coal.clear(); t.dataset.sum.split(",").forEach((k) => Nit.coal.add(k)); espPaint(); }
  });
  Esp.nitArg = arg;
  espPaint(true);
  if (espResultsMode() !== "off" && !Esp.data) espFetchResults().then(() => { if (espView() === "nit") espPaint(); });
  espSchedule();
}

function espPaint(first = false) {
  const root = $("#nit-page");
  if (!root || !$("[data-main]", root)) return;
  const f = espFase(), live = nitLive(), d = live ? Esp.data : null;
  const keepScroll = window.scrollY;
  const ref = nit2023();
  $("[data-hero]", root).innerHTML = live ? nitHeroNight(f, d) : nitHeroDay(f);
  $("[data-gov]", root).innerHTML = live && d ? nitGovHtml(d) : "";
  const secs = live && d ? [["nt-congres", "El Congreso"], ["nt-joc", "Escaños en juego"], ["nt-mapa", "Mapa"], ["nt-majories", "Mayorías"], ["nt-hora", "Última hora"]]
    : [["nt-com", "Cómo seguir la noche"], ["nt-joc", "Escaños a vigilar"], ["nt-mapa", "Mapa"], ["nt-congres", "El Congreso de 2023"]];
  $("[data-tabs]", root).innerHTML = secs.map(([id, t]) => `<a href="#${id}" data-jump="${id}">${esc(t)}${id === "nt-joc" && d?.ballen.length ? ` <b>${d.ballen.length}</b>` : ""}</a>`).join("");
  $$("[data-jump]", root).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); $(`#${a.dataset.jump}`, root)?.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  const main = $("[data-main]", root);
  main.innerHTML = live ? (d ? nitMainNight(d, ref) : nitWaiting()) : nitMainDay(ref);
  // El mapa
  const svg = $(".nt-map .sim-map", main);
  if (svg) {
    const src = live && d ? d : ref;
    simPaintMap(svg, (i) => {
      const p = src.provs.find((x) => x.i === i);
      if (!p) return {};
      if (Nit.map === "joc") {
        const l = p.an.lvl;
        return { fill: l === "fil" ? "#ff4b2b" : l === "ajustat" ? "#ffb020" : "#efe7d6", ink: l ? "#fff" : "rgba(23,23,61,.45)", sel: i === Nit.sel, label: `${p.name}: ${l === "fil" ? "escaño al filo" : l === "ajustat" ? "escaño ajustado" : "sin escaños en juego"}` };
      }
      const w = p.winner ? nitParty(p.winner) : null;
      return { fill: w ? w.color : "var(--card)", ink: w ? "#fff" : "var(--ink)", sel: i === Nit.sel, label: `${p.name}: ${w ? `gana ${w.sig}` : "sin datos"}` };
    });
    simMapPick(svg, (i) => { Nit.sel = Nit.sel === i ? null : i; espPaint(); });
  }
  // Columna de joc (la porra oberta no es repinta, perquè no es perdi el que s'està escrivint)
  $("[data-pred-box]", root).innerHTML = espPredHtml(d);
  if (typeof pronNitCard === "function") $("[data-pron-box]", root).innerHTML = pronNitCard(d);
  espPredBind(root);
  if (first || !$("[data-porra]", root)) {
    $("[data-porra-box]", root).innerHTML = espPorraHtml(d);
    espPorraBind(root);
  }
  $("[data-src]", root).textContent = live
    ? `Datos: ${d?.simulacre ? "simulacro a partir de los votos de 2023, con cambios inventados, solo para probar la página." : "escrutinio provisional del Ministerio del Interior. Los resultados oficiales son los que proclama la Junta Electoral."} Escaños en juego: últimos escaños con un margen de menos del 1 % de los votos válidos (más amplio mientras queda por escrutar).`
    : "Datos de 2023: Ministerio del Interior. Escaños a vigilar: los últimos escaños que en 2023 se decidieron por menos votos.";
  if (!first) window.scrollTo({ top: keepScroll });
  if (first && Esp.nitArg) setTimeout(() => $(Esp.nitArg === "porra" ? "#esp-porra" : Esp.nitArg === "prediccions" ? "#esp-pred" : `#nt-${Esp.nitArg}`, root)?.scrollIntoView({ block: "start", behavior: "smooth" }), 150);
}

// ---------- Marcador ----------
function nitHeroNight(f, d) {
  const t = d ? nitTitular(d) : null;
  const p23 = 66.6, part = d?.participacio;
  return `<div class="nt-hero-top"><span class="esp-onair">${f === "nit" ? `<span class="dot-live"></span>En directo` : "Resultados"}</span>${d?.simulacre ? `<span class="esp-simtag">Simulacro · datos inventados</span>` : ""}<span class="esp-upd">${d ? `Actualizado ${espAgo(d.actualitzat || Esp.fetchedAt)}` : ""}</span><button type="button" class="nt-share" data-share>Comparte</button></div>
    <div class="nt-hero-main">
      <div class="nt-hero-t"><p class="nt-k">Elecciones generales · 29 de noviembre de 2026</p>
        <h1>${t ? esc(t.t1) : f === "nit" ? "Noche electoral" : "Resultados del 29N"}</h1>
        ${t ? "" : `<p class="nt-sub">${f === "nit" ? "Los primeros resultados llegarán en unos minutos." : ""}</p>`}
        ${espMsg()}</div>
      ${d ? `<div class="nt-ring">${espRing(d.escrutat)}<div><b>${espPct(d.escrutat)}</b><small>escrutado</small></div></div>` : ""}
    </div>
    ${d ? `<div class="nt-kpis">
      <div><small>Participación</small><b>${part ? espPct(part, 2) : "—"}</b>${part ? `<span class="${part >= p23 ? "up" : "down"}">${part >= p23 ? "+" : "−"}${espPct(Math.abs(part - p23), 2)} vs. 2023</span>` : ""}</div>
      <a href="#nt-joc" data-jump="nt-joc" class="${d.ballen.length ? "hot" : ""}"><small>Escaños en juego</small><b>${d.ballen.length}</b><span>${d.ballen.length ? "pueden cambiar de manos" : "ninguno ahora mismo"}</span></a>
    </div>
    ${Esp.feed[0] ? `<p class="nt-tick"><span>⚡ Última hora</span>${esc(Esp.feed[0].text)}</p>` : ""}` : ""}`;
}
function nitHeroDay(f) {
  const t = espNow(), open = t >= ESP_T.obre, onDay = t >= ESP_T.dia && t < ESP_T.nit;
  const rows = (Esp.cfg.participacio || []).filter((x) => x.v !== null && x.v !== "" && x.v !== undefined);
  return `<div class="nt-hero-top"><span class="esp-onair">${f === "dia" ? `<span class="dot-live"></span>Jornada electoral` : f === "previa" ? "Jornada de reflexión" : "29N"}</span><button type="button" class="nt-share" data-share>Comparte</button></div>
    <div class="nt-hero-main"><div class="nt-hero-t"><p class="nt-k">Elecciones generales · 29 de noviembre de 2026</p>
      <h1>${f === "dia" ? "Hoy se vota" : f === "previa" ? "Mañana se vota" : "La noche electoral, aquí"}</h1>
      <p class="nt-sub">${onDay ? (open ? `Los colegios cierran dentro de <b>${espCountdown(ESP_T.nit)}</b>. A las 20:00 empieza el escrutinio en directo aquí mismo.` : `Los colegios abren dentro de <b>${espCountdown(ESP_T.obre)}</b> y cierran a las 20:00.`) : "Los colegios abren a las 9:00 y cierran a las 20:00. Después, el escrutinio en directo aquí mismo."}</p>
      ${espMsg()}</div></div>
    <div class="nt-kpis">
      ${rows.map((x) => { const diff = x.ref ? Number(x.v) - Number(x.ref) : null; return `<div><small>Participación a las ${esc(x.h)}</small><b>${espPct(Number(x.v), 2)}</b>${diff !== null ? `<span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : "−"}${espPct(Math.abs(diff), 2)} vs. 2023</span>` : ""}</div>`; }).join("")}
      <div><small>Cierran los colegios</small><b>20:00</b><span>${onDay && open ? `dentro de ${espCountdown(ESP_T.nit)}` : "en Canarias, a las 21:00 peninsulares"}</span></div>
      <a href="#nt-joc" data-jump="nt-joc" class="hot"><small>Escaños a vigilar</small><b>${nit2023().ballen.length}</b><span>según 2023</span></a>
      <div><small>Mayoría absoluta</small><b>176</b><span>de 350 escaños</span></div>
    </div>`;
}

// ---------- Qui pot governar (sempre a dalt) ----------
function nitGovHtml(d) {
  const x = (v) => `${(Math.min(v, 260) / 260) * 100}%`;
  const names = (ids) => nitAnd(ids.map(nitSig));
  const card = (g) => {
    const verdict = {
      maj: ["ok", "✔", "Mayoría absoluta"],
      fil: ["fil", "✔", "Mayoría, pero al filo"],
      suports: ["sup", "+", `Pueden llegar con apoyos: faltan ${g.need}`],
      "lluny-fil": ["no", "✘", `No llegan: faltan ${g.need}`],
      no: ["no", "✘", `No llegan: faltan ${g.need}`],
    }[g.st];
    const range = g.max > g.min ? `Entre ${g.min} y ${g.max} según cómo acaben los escaños en juego.` : "";
    let detail = "";
    if (g.st === "fil") detail = `<p>${esc(range)} Si caen los escaños en juego, se quedarían en ${g.min}.</p>`;
    else if (g.st === "maj") detail = range ? `<p>${esc(range)}</p>` : "";
    else if (g.st === "suports") detail = `
      <p class="nt-gv-need">Con todos ${esc(g.poolT)} sumarían <b>${g.all}</b>.</p>
      ${g.key.length ? `<p class="nt-gv-key"><span>Imprescindibles</span>${g.key.map((k) => nitChip(k)).join("")}</p>` : ""}
      ${g.combos.length && !(g.combos.length === 1 && g.combos[0].ids.length === g.key.length) ? `<p class="nt-gv-min"><span>La suma más corta</span>${g.combos.map((c) => `<em>+ ${c.ids.map((k) => nitChip(k)).join(" + ")} = <b>${c.t}</b></em>`).join("<i>o</i>")}</p>` : ""}`;
    else detail = `<p>Con todos ${esc(g.poolT)} (${esc(names(g.pool)) || "ninguno con escaños"}) sumarían ${g.all}: faltarían ${NIT_MAJ - g.all}.${g.st === "lluny-fil" ? " Solo podrían llegar si todos los escaños en juego caen a su favor." : ""}</p>`;
    return `<article class="nt-gv v-${verdict[0]}">
      <header><span class="nt-gv-p">${g.core.map((k) => nitChip(k, "has")).join("<b>+</b>")}</span><strong>${g.sum}</strong></header>
      <div class="nt-gv-bar"><i style="width:${x(g.sum)}">${g.core.map((k) => `<s style="flex:${d.seats[k] || 0};background:${nitParty(k).color}"></s>`).join("")}</i>${g.max > g.min ? `<u style="left:${x(g.min)};width:calc(${x(g.max)} - ${x(g.min)})"></u>` : ""}<em style="left:${x(NIT_MAJ)}"><span>176</span></em></div>
      <p class="nt-gv-v"><span>${verdict[1]}</span>${esc(verdict[2])}</p>
      ${detail}
    </article>`;
  };
  return `<section class="nt-govern" id="nt-govern" aria-label="Quién puede gobernar">
    <h2>¿Quién puede gobernar? <small>${d.escrutat < 100 ? `con el ${espPct(d.escrutat)} escrutado` : "escrutinio terminado"}</small></h2>
    <div class="nt-gv-g">${NIT_GOV.map((g) => card(nitGov(d, g))).join("")}</div>
    <p class="nt-gv-note">Apoyos posibles: los partidos que votaron cada investidura en 2023. Mayoría absoluta: 176 de 350.${d.seats.salf ? ` SALF, que no estaba, tiene ${d.seats.salf}.` : ""}</p>
  </section>`;
}

// ---------- Contingut: la nit ----------
function nitWaiting() {
  return `<section class="card esp-wait"><h2 class="section-title sm">Esperando los primeros datos</h2><p>Todavía no hay datos del escrutinio. Esta página se actualiza sola: no hace falta que recargues.</p><div class="esp-skel"><span></span><span></span><span></span></div></section>`;
}
function nitMainNight(d, ref) {
  const prev = Esp.prev;
  // Escons que acaben de canviar de mans (respecte a l'actualització anterior)
  const flipped = new Set(prev ? d.provs.filter((p) => { const o = prev.provs.find((x) => x.code === p.code); return o && o.an.holder && p.an.holder && o.an.holder !== p.an.holder; }).map((p) => p.code) : []);
  const involved = [...new Set(d.ballen.flatMap((p) => [p.an.victim || p.an.holder, p.an.challenger]))].sort((a, b) => (d.seats[b] || 0) - (d.seats[a] || 0));
  const list = Nit.filter ? d.ballen.filter((p) => (p.an.victim || p.an.holder) === Nit.filter || p.an.challenger === Nit.filter) : d.ballen;
  const shown = Nit.all ? list : list.slice(0, 6);
  const sel = Nit.sel !== null ? d.provs.find((p) => p.i === Nit.sel) : d.ballen[0] || null;
  const coalIds = d.ranking.filter((k) => d.seats[k]);
  const coalSum = [...Nit.coal].reduce((a, k) => a + (d.seats[k] || 0), 0);
  const coalMin = [...Nit.coal].reduce((a, k) => a + (d.range[k]?.[0] ?? d.seats[k] ?? 0), 0);
  const sums = nitTwo(d).slice(0, 4);
  const bl = NIT_BLOCS.map((b) => ({ ...b, n: nitBloc(d, b), min: b.ids.reduce((a, k) => a + (d.range[k]?.[0] ?? d.seats[k] ?? 0), 0), max: b.ids.reduce((a, k) => a + (d.range[k]?.[1] ?? d.seats[k] ?? 0), 0) }));
  const rest = 350 - bl.reduce((a, b) => a + b.n, 0);
  return `
    <section class="card nt-sec nt-congres" id="nt-congres">
      <div class="nt-sec-h"><h2 class="section-title sm">🏛️ El Congreso, ahora</h2><span class="muted">escaños · horquilla · vs. 2023 · votos</span></div>
      <div class="nt-congres-g">
        ${nitHemi(d)}
        <div>${nitRace(d, { prev, open: Nit.party })}
          <p class="muted nt-note">La <b>horquilla</b> indica entre cuántos escaños puede acabar cada partido si cambian de manos los escaños en juego. Toca un partido para ver dónde puede ganar o perder un escaño.${d.escrutat < 100 ? " Hasta el 100 % escrutado, todo es provisional." : ""}</p></div>
      </div>
    </section>

    <section class="card nt-sec nt-joc" id="nt-joc">
      <div class="nt-sec-h"><h2 class="section-title sm">🎯 Escaños en juego <span class="nt-count">${d.ballen.length}</span></h2></div>
      <p class="muted">En cada circunscripción, el último escaño se lo queda quien tiene el cociente más alto de la ley d'Hondt. Estos se deciden por pocos votos y pueden cambiar de manos${d.escrutat < 100 ? " a medida que avanza el escrutinio" : ""}.</p>
      ${involved.length > 1 ? `<div class="nt-filter"><button type="button" class="${Nit.filter ? "" : "on"}" data-filter="">Todos</button>${involved.map((k) => `<button type="button" class="${Nit.filter === k ? "on" : ""}" data-filter="${k}" style="--c:${nitParty(k).color}"><i></i>${esc(nitSig(k))}</button>`).join("")}</div>` : ""}
      ${list.length ? `<div class="nt-duels">${shown.map((p) => nitDuel(p, { flip: flipped.has(p.code) })).join("")}</div>
        ${list.length > 6 ? `<button type="button" class="btn ghost nt-more" data-all>${Nit.all ? "Mostrar menos" : `Mostrarlos todos (${list.length})`}</button>` : ""}`
        : `<p class="nt-empty">${Nit.filter ? `Ningún escaño en juego de ${esc(nitSig(Nit.filter))} ahora mismo.` : "Ahora mismo no baila ningún escaño: todos los últimos escaños se deciden por más de un 1 % de los votos."}</p>`}
    </section>

    <section class="card nt-sec nt-mapbox" id="nt-mapa">
      <div class="nt-sec-h"><h2 class="section-title sm">🗺️ El mapa</h2>
        <div class="nt-seg" role="group" aria-label="Qué muestra el mapa"><button type="button" class="${Nit.map === "guanya" ? "on" : ""}" data-map="guanya">Quién gana</button><button type="button" class="${Nit.map === "joc" ? "on" : ""}" data-map="joc">Escaños en juego</button></div></div>
      <div class="nt-mapwrap"><div class="nt-map">${simSpainMap("esp-map")}${Nit.map === "joc" ? `<p class="nt-legend"><span class="fil">Al filo</span><span class="ajustat">Ajustado</span><span>Sin escaños en juego</span></p>` : ""}</div>
        <div class="nt-pd">${nitProvDetail(sel, ref)}</div></div>
    </section>

    <section class="card nt-sec nt-maj" id="nt-majories">
      <div class="nt-sec-h"><h2 class="section-title sm">🤝 La mayoría: 176</h2></div>
      <p class="muted">Quién puede gobernar, con los apoyos necesarios, está arriba del todo. Aquí, las sumas de dos partidos y tu propio cálculo.</p>
      <h3 class="nt-h3">Con un solo socio</h3>
      ${sums.length ? `<div class="nt-sums">${sums.map((s) => `<button type="button" class="nt-sum st-${s.st}" data-sum="${s.ids.join(",")}"><span class="nt-sum-p">${s.ids.map((k) => nitChip(k)).join("")}</span><b>${s.sum}</b><em>${s.ids.length === 1 ? "Solo" : s.st === "ok" ? "Segura" : `Al filo · ${s.min} si caen los escaños en juego`}</em></button>`).join("")}</div>` : `<p class="nt-empty">Ningún partido llega a 176 con un solo socio.</p>`}
      <p class="muted nt-note">Es aritmética, no un pronóstico de pactos.</p>
      <div class="nt-coal">
        <p class="nt-coal-t"><b>Pruébalo tú:</b> elige partidos</p>
        <div class="esp-coal-chips">${coalIds.map((k) => `<button type="button" class="${Nit.coal.has(k) ? "on" : ""}" data-coal="${k}" style="--c:${nitParty(k).color}">${esc(nitSig(k))} · ${d.seats[k]}</button>`).join("")}</div>
        <div class="esp-coal-bar"><span style="width:${Math.min(100, (coalSum / 350) * 100)}%"></span><i style="left:${(NIT_MAJ / 350) * 100}%"></i></div>
        <p class="esp-coal-res"><b>${coalSum}</b> escaños · ${coalSum >= NIT_MAJ ? `<span class="up">Mayoría absoluta ✔</span>${coalMin < NIT_MAJ ? ` <span class="nt-warn">(${coalMin} si caen los escaños en juego)</span>` : ""}` : `faltan <b>${NIT_MAJ - coalSum}</b>`}${Nit.coal.size ? ` · <button type="button" class="linklike" data-coal-clear>Borra</button>` : ""}</p>
      </div>
    </section>

    <section class="card nt-sec nt-hora" id="nt-hora">
      <h2 class="section-title sm">⚡ Última hora</h2>
      <ol class="nt-feed">${Esp.feed.length ? Esp.feed.slice(0, 12).map((e) => `<li class="k-${e.kind}"><time>${new Date(e.t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</time><span>${esc(e.text)}</span></li>`).join("") : `<li class="k-info"><span>Aquí saldrán los cambios del escrutinio a medida que lleguen.</span></li>`}</ol>
    </section>`;
}

// ---------- Contingut: el dia (i abans) ----------
function nitMainDay(ref) {
  const watch = ref.ballen.slice(0, Nit.all ? 99 : 6);
  const sel = Nit.sel !== null ? ref.provs.find((p) => p.i === Nit.sel) : ref.ballen[0] || null;
  return `
    <section class="card nt-sec nt-com" id="nt-com">
      <h2 class="section-title sm">📺 Cómo seguir la noche</h2>
      <ol class="nt-steps">
        <li><b>20:00 · Cierran los colegios</b><span>Empieza el escrutinio. Los primeros votos suelen ser de zonas rurales y el resultado se mueve mucho al principio.</span></li>
        <li><b>Escaños en juego</b><span>En cada circunscripción, el último escaño se puede decidir por pocos votos. Aquí verás cuáles bailan y cuántos votos faltan para que cambien de manos.</span></li>
        <li><b>176</b><span>Es la mayoría absoluta. Verás las sumas de partidos que llegan y cuáles dependen de un escaño.</span></li>
      </ol>
    </section>

    <section class="card nt-sec nt-joc" id="nt-joc">
      <div class="nt-sec-h"><h2 class="section-title sm">🎯 Escaños a vigilar esta noche <span class="nt-count">${ref.ballen.length}</span></h2></div>
      <p class="muted">En 2023, estos últimos escaños se decidieron por menos de un 1 % de los votos. Son los primeros candidatos a bailar esta noche.</p>
      <div class="nt-duels">${watch.map((p) => nitDuel(p, { year: "2023" })).join("")}</div>
      ${ref.ballen.length > 6 ? `<button type="button" class="btn ghost nt-more" data-all>${Nit.all ? "Mostrar menos" : `Mostrarlos todos (${ref.ballen.length})`}</button>` : ""}
    </section>

    <section class="card nt-sec nt-mapbox" id="nt-mapa">
      <div class="nt-sec-h"><h2 class="section-title sm">🗺️ El mapa de 2023</h2>
        <div class="nt-seg" role="group" aria-label="Qué muestra el mapa"><button type="button" class="${Nit.map === "guanya" ? "on" : ""}" data-map="guanya">Quién ganó</button><button type="button" class="${Nit.map === "joc" ? "on" : ""}" data-map="joc">Escaños ajustados</button></div></div>
      <div class="nt-mapwrap"><div class="nt-map">${simSpainMap("esp-map")}${Nit.map === "joc" ? `<p class="nt-legend"><span class="fil">Al filo</span><span class="ajustat">Ajustado</span><span>Seguro</span></p>` : ""}</div>
        <div class="nt-pd">${nitProvDetail(sel, null)}</div></div>
    </section>

    <section class="card nt-sec nt-congres" id="nt-congres">
      <div class="nt-sec-h"><h2 class="section-title sm">🏛️ El Congreso saliente</h2><span class="muted">elecciones del 23 de julio de 2023</span></div>
      <div class="nt-congres-g">${nitHemi(ref, "2023")}<div>${nitRace(ref, { compare: false })}<p class="muted nt-note">Sumar se cuenta como Frente Amplio. La horquilla muestra qué habría pasado si hubieran cambiado de manos los escaños ajustados.</p></div></div>
    </section>`;
}

// ---------- Última hora: també els escons que canvien de mans o es posen al fil ----------
const espEventsBase = espEvents;
espEvents = function (a, b) {
  espEventsBase(a, b);
  const add = (kind, text) => Esp.feed.unshift({ kind, text, t: Date.now() });
  // En entrar a mitja nit: d'on venim
  if (!a && b?.ballen?.length) { const p = b.ballen[0]; add("fil", `${b.ballen.length} ${b.ballen.length === 1 ? "escaño en juego" : "escaños en juego"}. El más ajustado, en ${p.name}: a ${nitSig(p.an.challenger)} le faltan ${nitN(p.an.need)} votos para quitárselo a ${nitSig(p.an.victim || p.an.holder)}.`); }
  if (!a || !b) return;
  let n = 0;
  b.provs.forEach((p) => {
    const o = a.provs.find((x) => x.code === p.code);
    if (!o || n >= 3 || p.escrutat < 5) return;
    if (o.an.holder && p.an.holder && o.an.holder !== p.an.holder) { add("gir", `En ${p.name}, ${nitSig(p.an.holder)} le quita el último escaño a ${nitSig(o.an.holder)}.`); n++; }
    else if (p.an.lvl === "fil" && o.an.lvl !== "fil" && p.an.challenger) { add("fil", `Escaño al filo en ${p.name}: a ${nitSig(p.an.challenger)} le faltan ${nitN(p.an.need)} votos para quitárselo a ${nitSig(p.an.victim || p.an.holder)}.`); n++; }
  });
  Esp.feed = Esp.feed.slice(0, 30);
};
