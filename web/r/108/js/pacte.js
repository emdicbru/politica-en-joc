// Pactòmetre: escenaris d'enquestes, mitjana i escenari propi.
// Dades d'enquestes: Viquipèdia, «Opinion polling for the next Spanish general election» (consulta del 21-10-2026).

const POLL_SOURCE = "https://en.wikipedia.org/wiki/Opinion_polling_for_the_next_Spanish_general_election";
const POLL_UPDATED = "21 d'octubre del 2026";

// Escons de cada enquesta (els intervals s'han substituït pel punt mitjà i tot s'ajusta a 350).
const PACTE_ORDER = ["podemos", "fa", "psoe", "bng", "bildu", "erc", "junts", "pnv", "cc", "altres", "upn", "pp", "vox", "salf"];
const PACTE_INFO = {
  podemos: { sig: "Podemos", color: "#6c2b7e" },
  fa: { sig: "Sumar/FA", color: "#e0306f" },
  psoe: { sig: "PSOE", color: "#e3101f" },
  bng: { sig: "BNG", color: "#7bb6e0" },
  bildu: { sig: "EH Bildu", color: "#0f9a83" },
  erc: { sig: "ERC", color: "#f59f24" },
  junts: { sig: "Junts", color: "#20b8c8" },
  pnv: { sig: "PNV", color: "#3f8f45" },
  cc: { sig: "CC", color: "#f2d21b" },
  altres: { sig: "Altres", color: "#9a9a9a" },
  upn: { sig: "UPN", color: "#2b3f91" },
  pp: { sig: "PP", color: "#1e88d6" },
  vox: { sig: "Vox", color: "#5cbf2a" },
  salf: { sig: "SALF", color: "#5d4037" },
};

const POLL_SEATS = [
  { n: "Electomanía", d: "15–17 oct", s: { pp: 134, psoe: 111, vox: 62, fa: 7, podemos: 1, erc: 8, junts: 5, bildu: 7, pnv: 6, bng: 3, cc: 0, upn: 0, salf: 0, altres: 6 } },
  { n: "Sigma Dos / El Mundo", d: "1–14 oct", s: { pp: 134.5, psoe: 103.5, vox: 66.5, fa: 9.5, podemos: 1, erc: 9, junts: 6.5, bildu: 6.5, pnv: 5.5, bng: 2, cc: 1, upn: 0, salf: 0, altres: 5 } },
  { n: "SocioMétrica / El Español", d: "10–11 oct", s: { pp: 141, psoe: 104, vox: 64, fa: 8, podemos: 2, erc: 8, junts: 6, bildu: 7, pnv: 4, bng: 2, cc: 1, upn: 1, salf: 0, altres: 1 } },
  { n: "Target Point / El Debate", d: "6–9 oct", s: { pp: 136, psoe: 104, vox: 65, fa: 10, podemos: 2, erc: 9, junts: 5.5, bildu: 7, pnv: 5.5, bng: 2.5 } },
  { n: "Electomanía", d: "5–9 oct", s: { pp: 131, psoe: 107, vox: 67, fa: 11, podemos: 2, erc: 8, junts: 4, bildu: 7, pnv: 6, bng: 3, cc: 0, upn: 1, salf: 0, altres: 3 } },
  { n: "40dB / Prisa", d: "7–8 oct", s: { pp: 131.5, psoe: 111, vox: 68.5, fa: 6, podemos: 2, erc: 8, junts: 7, bildu: 7, pnv: 6, bng: 2, cc: 1, upn: 1, salf: 0, altres: 1 } },
  { n: "GAD3 / Vocento", d: "6–8 oct", s: { pp: 133, psoe: 107, vox: 65, fa: 10, podemos: 2, erc: 10, junts: 5, bildu: 8, pnv: 6, bng: 2, cc: 1, upn: 0, salf: 0, altres: 1 } },
  { n: "Hamalgama / Vozpópuli", d: "5–8 oct", s: { pp: 144, psoe: 103, vox: 68, fa: 5, podemos: 2, erc: 7, junts: 7, bildu: 6, pnv: 4, bng: 2, cc: 1, upn: 1, salf: 0 } },
  { n: "Sigma Dos / El Mundo", d: "1–8 oct", s: { pp: 135, psoe: 103, vox: 68, fa: 9, podemos: 2, erc: 9, junts: 7, bildu: 6, pnv: 6, bng: 2, cc: 1, upn: 1, altres: 2 } },
];

// Intenció de vot (%) de les 12 enquestes més recents
const POLL_PCT_KEYS = ["pp", "psoe", "vox", "fa", "podemos", "erc", "junts", "bildu", "pnv", "salf"];
const POLL_PCT = [
  [31.8, 27.1, 18.9, 4.9, 2.0, 2.1, 1.2, 1.4, 1.0, 1.7],
  [31.5, 25.3, 19.5, 7.2, 2.8, 2.5, 1.2, 1.2, 0.9, null],
  [32.6, 26.2, 18.8, 5.8, 2.8, 2.0, 1.5, 1.3, 0.8, 2.1],
  [32.0, 25.9, 18.7, 6.9, 3.4, null, null, null, null, 1.3],
  [31.5, 26.9, 19.1, 6.0, 3.4, 2.0, 1.1, 1.4, 1.1, 1.7],
  [31.9, 28.1, 18.9, 5.3, 2.3, null, null, null, null, 1.8],
  [28.7, 26.1, 18.9, 8.0, 2.6, 2.5, 1.9, null, null, 2.0],
  [31.4, 26.4, 18.2, 7.4, 2.3, 2.6, 1.5, 1.5, 1.0, 1.8],
  [33.4, 25.3, 19.6, 5.4, 3.3, 1.9, 1.7, 1.3, 0.9, 1.8],
  [32.8, 28.0, 18.8, 6.3, 3.2, 1.9, 1.2, 1.5, 1.1, 1.8],
  [31.9, 25.3, 19.1, 7.6, 3.1, 2.6, 1.2, 1.1, 0.9, null],
  [30.4, 26.5, 19.0, 7.6, 2.3, 2.2, 1.1, 1.3, 0.9, 1.9],
];

// Reparteix perquè la suma sigui exactament 350 (mètode del residu més gran)
function normalizeSeats(raw, total = 350) {
  const ids = PACTE_ORDER;
  const sum = ids.reduce((a, id) => a + (raw[id] || 0), 0) || 1;
  const exact = ids.map((id) => ((raw[id] || 0) * total) / sum);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) out[i]++; });
  return Object.fromEntries(ids.map((id, i) => [id, out[i]]));
}

function averageSeats() {
  const acc = {}, cnt = {};
  POLL_SEATS.forEach((p) => PACTE_ORDER.forEach((id) => {
    if (p.s[id] != null) { acc[id] = (acc[id] || 0) + p.s[id]; cnt[id] = (cnt[id] || 0) + 1; }
  }));
  const avg = {};
  PACTE_ORDER.forEach((id) => { avg[id] = cnt[id] ? acc[id] / cnt[id] : 0; });
  return normalizeSeats(avg);
}

function averagePct() {
  return POLL_PCT_KEYS.map((id, k) => {
    const v = POLL_PCT.map((r) => r[k]).filter((x) => x != null);
    return { id, avg: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length };
  });
}

const PACTE_KEY = "r29n-pacte";
const pacte = (() => {
  const saved = store.get(PACTE_KEY, null) || {};
  return {
    src: saved.src ?? "avg",
    custom: saved.custom || null,
    stance: saved.stance || {}, // id -> "si" | "abs" | "no"
  };
})();
const savePacte = () => store.set(PACTE_KEY, { src: pacte.src, custom: pacte.custom, stance: pacte.stance });

// LOREG art. 69.7: prohibida la difusió d'enquestes els 5 dies previs a la votació i fins que es tanquin els col·legis
const POLL_BLACKOUT = [new Date("2026-11-24T00:00:00+01:00").getTime(), new Date("2026-11-29T21:00:00+01:00").getTime()];
const pollsBlocked = () => { const n = Date.now(); return n >= POLL_BLACKOUT[0] && n < POLL_BLACKOUT[1]; };

// Base neutra durant l'apagada d'enquestes: el resultat real del 23-J del 2023
const RESULT_2023 = { pp: 137, psoe: 121, vox: 33, fa: 31, erc: 7, junts: 7, bildu: 6, pnv: 5, bng: 1, cc: 1, upn: 1 };

function pacteSeats() {
  if (pollsBlocked() && pacte.src !== "custom") pacte.src = "custom";
  if (pacte.src === "custom") return pacte.custom || (pollsBlocked() ? normalizeSeats(RESULT_2023) : averageSeats());
  if (pacte.src === "avg") return averageSeats();
  const p = POLL_SEATS[Number(pacte.src)];
  return normalizeSeats(p ? p.s : {});
}

const PACTE_PRESETS = [
  { k: "dreta", label: "PP + Vox", si: ["pp", "vox", "upn", "salf"] },
  { k: "2023", label: "Bloc de la investidura 2023", si: ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng", "cc"] },
  { k: "gran", label: "PP + PSOE", si: ["pp", "psoe", "upn"] },
];

const STANCE_LABEL = { si: "Sí", abs: "Abstenció", no: "No" };
const nextStance = (s) => (s === "si" ? "abs" : s === "abs" ? "no" : "si");

// Aliances que descartem perquè no són plausibles (p. ex. Vox amb independentistes)
const INCOMPAT = {
  vox: ["psoe", "fa", "podemos", "erc", "junts", "bildu", "pnv", "bng"],
  pp: ["podemos", "erc", "bildu", "bng", "fa"],
  psoe: ["vox", "salf", "upn"],
  fa: ["vox", "salf", "upn", "pp"],
  podemos: ["vox", "salf", "upn", "pp"],
  erc: ["vox", "salf", "upn", "pp"],
  bildu: ["vox", "salf", "upn", "pp"],
  bng: ["vox", "salf", "upn", "pp"],
  junts: ["vox", "salf"],
  pnv: ["vox", "salf"],
};
const compatible = (members) => members.every((a) => members.every((b) => !(INCOMPAT[a] || []).includes(b)));

// Majories mínimes (cap membre no sobra) que passen un filtre de compatibilitat. També la fa servir el simulador.
function minimalMajoritiesOf(ids, seats, ok = () => true, need = 176, max = 8) {
  const out = [];
  for (let mask = 1; mask < 1 << ids.length; mask++) {
    const members = ids.filter((_, i) => mask & (1 << i));
    const total = members.reduce((a, id) => a + seats[id], 0);
    if (total < need) continue;
    if (members.some((id) => total - seats[id] >= need)) continue; // no és mínima
    if (!ok(members)) continue;
    out.push({ members, total });
  }
  return out.sort((a, b) => a.members.length - b.members.length || a.total - b.total).slice(0, max);
}
function minimalMajorities(seats) {
  return minimalMajoritiesOf(PACTE_ORDER.filter((id) => seats[id] > 0 && id !== "altres"), seats, compatible);
}

function renderPacte() {
  const root = $("#pacte-root");
  if (!root) return;
  const seats = pacteSeats();
  const total = PACTE_ORDER.reduce((a, id) => a + (seats[id] || 0), 0);
  const stanceOf = (id) => pacte.stance[id] || "no";
  const sum = (st) => PACTE_ORDER.filter((id) => stanceOf(id) === st).reduce((a, id) => a + (seats[id] || 0), 0);
  const yes = sum("si"), abs = sum("abs"), no = sum("no");
  const verdict = yes >= 176
    ? { cls: "ok", t: "Investidura aprovada en primera votació", d: `Amb ${yes} vots a favor se supera la majoria absoluta (176).` }
    : yes > no
      ? { cls: "mid", t: "Investidura aprovada en segona votació", d: `No arriba als 176, però hi ha més sís (${yes}) que nos (${no}): n'hi ha prou amb la majoria simple, 48 hores després.` }
      : { cls: "ko", t: "Investidura fallida", d: yes === 0 ? "Toca els partits per decidir què votarien." : `Hi ha més nos (${no}) que sís (${yes}). Caldria buscar altres suports o un altre candidat; passats dos mesos de la primera votació sense investidura, es convoquen eleccions.` };

  const majorities = minimalMajorities(seats);
  const pct = averagePct();
  const maxPct = Math.max(...pct.map((p) => p.max));

  const blocked = pollsBlocked();
  root.innerHTML = `
    ${blocked ? `<div class="pc-blackout"><b>Enquestes no disponibles</b><p>D'acord amb l'article 69.7 de la Llei orgànica del règim electoral general, no es poden publicar ni difondre enquestes electorals durant els cinc dies anteriors a la votació. Fins al tancament dels col·legis electorals, el pactòmetre només permet treballar amb un escenari propi, que parteix dels resultats del 23 de juliol de 2023.</p></div>` : ""}
    <div class="pc-src" role="tablist" aria-label="Font dels escons">
      ${blocked ? "" : `<button class="pc-chip ${pacte.src === "avg" ? "on" : ""}" data-src="avg">Mitjana de les enquestes</button>
      ${POLL_SEATS.map((p, i) => `<button class="pc-chip ${pacte.src === String(i) ? "on" : ""}" data-src="${i}">${p.n}<small>${p.d}</small></button>`).join("")}`}
      <button class="pc-chip custom ${pacte.src === "custom" ? "on" : ""}" data-src="custom">✎ El meu escenari</button>
    </div>

    <div class="pc-main">
      <div class="pc-hemi">
        ${hemicycleSVG(PACTE_ORDER.filter((id) => seats[id] > 0).map((id) => ({ id, seats: seats[id], color: PACTE_INFO[id].color })))}
        <div class="pc-hemi-num"><b>${yes}</b><span>sís · cal 176</span></div>
      </div>
      <div class="pc-bar" aria-label="Sís, abstencions i nos">
        <i class="y" style="width:${(yes / 350) * 100}%"></i><i class="a" style="width:${(abs / 350) * 100}%"></i><i class="n" style="width:${(no / 350) * 100}%"></i>
        <em style="left:${(176 / 350) * 100}%"><span>176</span></em>
      </div>
      <div class="pc-count"><span class="y"><b>${yes}</b> Sí</span><span class="a"><b>${abs}</b> Abstenció</span><span class="n"><b>${no}</b> No</span></div>
      <div class="pc-verdict ${verdict.cls}"><b>${verdict.t}</b><p>${verdict.d}</p></div>
    </div>

    <div class="pc-presets"><span>Pactes ràpids:</span>
      ${PACTE_PRESETS.map((p) => `<button class="btn ghost" data-preset="${p.k}">${p.label}</button>`).join("")}
      <button class="btn ghost" data-preset="reset">Esborrar</button>
    </div>

    <div class="pc-parties">
      ${PACTE_ORDER.filter((id) => id !== "altres" || seats.altres > 0).map((id) => {
        const st = stanceOf(id), i = PACTE_INFO[id];
        return `<div class="pc-party ${st}" style="--pc:${i.color}">
          <button class="pc-stance" data-stance="${id}" title="Canvia el sentit del vot" ${id === "altres" ? "disabled" : ""}>
            <i></i><b>${i.sig}</b><span>${id === "altres" ? "Sense bloc" : STANCE_LABEL[st]}</span>
          </button>
          <div class="pc-seats">
            <button data-dec="${id}" aria-label="Menys escons de ${i.sig}">−</button>
            <strong>${seats[id] || 0}</strong>
            <button data-inc="${id}" aria-label="Més escons de ${i.sig}">+</button>
          </div>
        </div>`;
      }).join("")}
    </div>
    <p class="pc-total ${total === 350 ? "" : "bad"}">${total === 350 ? "Total: 350 escons" : `Total: ${total} escons (n'hi ha de ser 350)`} · toca un partit per canviar-ne el vot; usa − i + per crear el teu escenari.</p>

    <h3 class="sub-h">Majories possibles amb aquests escons</h3>
    <p class="muted pc-note">Combinacions mínimes que sumen 176 o més (si en treus un partit, ja no hi arribes). Només hi ha aliances plausibles: descartem, per exemple, Vox amb independentistes o el PP amb Bildu. Toca'n una per aplicar-la.</p>
    <div class="pc-majs">${majorities.length ? majorities.map((m, k) => `
      <button class="pc-maj" data-maj="${k}">
        <span class="pm-names">${m.members.map((id) => `<i style="--pc:${PACTE_INFO[id].color}">${PACTE_INFO[id].sig}</i>`).join("")}</span>
        <b>${m.total}</b>
      </button>`).join("") : `<p class="muted">Cap combinació arriba als 176 amb aquests escons.</p>`}</div>

    ${blocked ? "" : `<h3 class="sub-h">Intenció de vot: mitjana de les últimes ${POLL_PCT.length} enquestes</h3>`}
    ${blocked ? "" : `<div class="pc-pct">${pct.map((p) => `
      <div class="pc-pct-row" style="--pc:${PACTE_INFO[p.id].color}">
        <span class="n">${PACTE_INFO[p.id].sig}</span>
        <div class="bar"><i style="width:${(p.avg / maxPct) * 100}%"></i><em style="left:${(p.min / maxPct) * 100}%;width:${((p.max - p.min) / maxPct) * 100}%"></em></div>
        <b>${p.avg.toFixed(1).replace(".", ",")} %</b>
        <small>${p.min.toFixed(1).replace(".", ",")}–${p.max.toFixed(1).replace(".", ",")}</small>
      </div>`).join("")}</div>
    <p class="src-note">Font: <a href="${POLL_SOURCE}" target="_blank" rel="noopener">Viquipèdia, recull d'enquestes</a> (consulta del ${POLL_UPDATED}). Les xifres d'escons són estimacions de cada empresa demoscòpica; quan s'expressen en forquilla, s'ha pres el valor central i el total s'ha ajustat a 350. La mitjana és aritmètica i no ponderada. Les enquestes no constitueixen un pronòstic.</p>`}`;

  $$("[data-src]", root).forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.src;
    if (v === "custom" && !pacte.custom) pacte.custom = { ...pacteSeats() };
    pacte.src = v;
    savePacte();
    renderPacte();
  }));
  const edit = (id, delta) => {
    pacte.custom = { ...pacteSeats() };
    pacte.custom[id] = Math.max(0, Math.min(350, (pacte.custom[id] || 0) + delta));
    pacte.src = "custom";
    savePacte();
    renderPacte();
  };
  $$("[data-inc]", root).forEach((b) => b.addEventListener("click", () => edit(b.dataset.inc, 1)));
  $$("[data-dec]", root).forEach((b) => b.addEventListener("click", () => edit(b.dataset.dec, -1)));
  $$("[data-stance]", root).forEach((b) => b.addEventListener("click", () => {
    pacte.stance[b.dataset.stance] = nextStance(stanceOf(b.dataset.stance));
    Sfx.play("pick");
    savePacte();
    renderPacte();
  }));
  $$("[data-preset]", root).forEach((b) => b.addEventListener("click", () => {
    const pr = PACTE_PRESETS.find((p) => p.k === b.dataset.preset);
    pacte.stance = {};
    PACTE_ORDER.forEach((id) => { pacte.stance[id] = pr && pr.si.includes(id) ? "si" : "no"; });
    Sfx.play("pick");
    savePacte();
    renderPacte();
  }));
  $$("[data-maj]", root).forEach((b) => b.addEventListener("click", () => {
    const m = majorities[Number(b.dataset.maj)];
    pacte.stance = {};
    PACTE_ORDER.forEach((id) => { pacte.stance[id] = m.members.includes(id) ? "si" : "no"; });
    Sfx.play("pick");
    savePacte();
    renderPacte();
  }));
  // Ressalta al hemicicle els partits que voten sí
  $$(".pc-hemi circle", root).forEach((c) => { c.style.opacity = stanceOf(c.dataset.p) === "si" ? 1 : stanceOf(c.dataset.p) === "abs" ? 0.55 : 0.2; });
}
