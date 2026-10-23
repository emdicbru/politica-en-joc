// Categories de joc i il·lustracions de les targetes.
// Totes les il·lustracions comparteixen el sistema: lienzo 240×140, traç de tinta de 4-6 px,
// farcits plans de la paleta (crema, groc, vermell, tinta) sobre el color de la categoria.

const GAME_CATS = {
  daily: { name: "Cada dia", color: "#7b3fe4", desc: "Un repte nou cada 24 hores." },
  rapid: { name: "Ràpids", color: "#ff4b2b", desc: "Reflexos, ratxes i rellotge." },
  parlament: { name: "Parlament", color: "#3554ff", desc: "Pactes, ideologies i vocabulari." },
  historia: { name: "Història", color: "#ffcf3d", desc: "Fets, personatges i hemeroteca." },
};

const ART = (() => {
  const I = "#17173d", C = "#fffaf0", Y = "#ffcf3d", R = "#ff4b2b", G = "#0f9d58";
  const svg = (body) => `<svg viewBox="0 0 240 140" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const txt = (x, y, size, fill, s, extra = "") =>
    `<text x="${x}" y="${y}" font-family="Unbounded, 'Arial Black', sans-serif" font-weight="900" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${s}</text>`;
  // Text amb ombra de tinta desplaçada, com els titulars
  const riso = (x, y, size, fill, s) => txt(x + 3, y + 3, size, I, s) + txt(x, y, size, fill, s);
  const MONTHS = ["GEN", "FEB", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DES"];

  return {
    contrarellotge: () => svg(`
      <path d="M22 54h40M12 74h46M26 94h32" stroke="${C}" stroke-width="7"/>
      <rect x="112" y="8" width="26" height="14" rx="4" fill="${I}"/>
      <path d="M166 30l10-10" stroke="${I}" stroke-width="7"/>
      <circle cx="125" cy="76" r="50" fill="${C}" stroke="${I}" stroke-width="5"/>
      <path d="M125 76V26A50 50 0 0 1 168.3 101Z" fill="${Y}" stroke="${I}" stroke-width="4"/>
      <path d="M125 76l-24-24" stroke="${I}" stroke-width="7"/>
      <circle cx="125" cy="76" r="7" fill="${I}"/>
      <g transform="rotate(8 201 30)"><rect x="170" y="16" width="62" height="28" rx="14" fill="${Y}" stroke="${I}" stroke-width="4"/>${txt(201, 36, 14, I, "+300")}</g>`),

    diari: () => {
      const d = new Date();
      return svg(`
        <rect x="70" y="18" width="100" height="112" rx="12" fill="${C}" stroke="${I}" stroke-width="5"/>
        <path d="M70 30a12 12 0 0 1 12-12h76a12 12 0 0 1 12 12v18H70z" fill="${R}" stroke="${I}" stroke-width="5"/>
        <path d="M96 8v20M144 8v20" stroke="${I}" stroke-width="7"/>
        ${txt(120, 42, 13, C, MONTHS[d.getMonth()])}
        ${txt(120, 106, 48, I, d.getDate())}
        <circle cx="178" cy="112" r="21" fill="${Y}" stroke="${I}" stroke-width="5"/>
        <path d="M168 112l7 7 13-14" stroke="${I}" stroke-width="5"/>
        <path d="M42 34v18M33 43h18M206 22v14M199 29h14" stroke="${C}" stroke-width="5"/>
        <circle cx="40" cy="104" r="9" fill="${Y}" stroke="${I}" stroke-width="4"/>`);
    },

    majoria: () => {
      const seats = hemicycleSeats(56, 4, 0.48);
      const dots = seats.map((s, i) =>
        `<circle cx="${(120 + s.x * 96).toFixed(1)}" cy="${(126 + s.y * 96).toFixed(1)}" r="7.5" fill="${i < 31 ? Y : C}" stroke="${I}" stroke-width="3"/>`).join("");
      return svg(`${dots}
        <path d="M120 22v104" stroke="${R}" stroke-width="5" stroke-dasharray="2 9"/>
        <rect x="96" y="2" width="48" height="24" rx="12" fill="${R}" stroke="${I}" stroke-width="4"/>${txt(120, 20, 12, C, "176")}`);
    },

    simulador: () => svg(`
      <path d="M150 8l-6 22M178 18l-14 18M196 44l-20 8" stroke="${C}" stroke-width="6"/>
      <g transform="rotate(-8 92 74)">
        <path d="M34 60l84-34v92L34 92z" fill="${C}" stroke="${I}" stroke-width="5"/>
        <rect x="20" y="58" width="20" height="36" rx="6" fill="${R}" stroke="${I}" stroke-width="5"/>
        <path d="M118 46a26 26 0 010 52" stroke="${I}" stroke-width="5"/>
        <path d="M48 92l8 34h20l-6-30" fill="${Y}" stroke="${I}" stroke-width="5"/>
      </g>
      <g transform="rotate(6 196 104)"><rect x="160" y="84" width="72" height="40" rx="10" fill="${Y}" stroke="${I}" stroke-width="5"/>${txt(196, 112, 18, I, "29N")}</g>`),

    verificador: () => svg(`
      <g transform="rotate(-10 112 72)"><rect x="58" y="24" width="108" height="94" rx="12" fill="${C}" stroke="${I}" stroke-width="5" opacity=".75"/></g>
      <g transform="rotate(7 130 72)">
        <rect x="72" y="20" width="116" height="100" rx="12" fill="${C}" stroke="${I}" stroke-width="5"/>
        <path d="M90 44h72M90 60h56M90 76h64" stroke="${I}" stroke-width="5"/>
        <g transform="rotate(-12 150 100)"><rect x="116" y="87" width="68" height="26" rx="6" fill="${C}" stroke="${G}" stroke-width="4"/>${txt(150, 106, 13, G, "CERT")}</g>
      </g>
      <circle cx="30" cy="108" r="19" fill="${C}" stroke="${I}" stroke-width="4"/><path d="M23 101l14 14M37 101l-14 14" stroke="${I}" stroke-width="5"/>
      <circle cx="212" cy="108" r="19" fill="${Y}" stroke="${I}" stroke-width="4"/><path d="M203 108l6 6 11-12" stroke="${I}" stroke-width="5"/>`),

    mesomenys: () => svg(`
      <g transform="rotate(-5 58 72)"><rect x="14" y="24" width="88" height="92" rx="12" fill="${C}" stroke="${I}" stroke-width="5"/>${txt(58, 86, 38, I, "37")}</g>
      <g transform="rotate(5 182 72)"><rect x="138" y="24" width="88" height="92" rx="12" fill="${Y}" stroke="${I}" stroke-width="5"/>${txt(182, 86, 38, I, "32")}</g>
      <circle cx="120" cy="70" r="23" fill="${I}" stroke="${C}" stroke-width="3"/>${txt(120, 76, 15, C, "VS")}`),

    any: () => svg(`
      ${riso(120, 70, 50, R, "1978")}
      <path d="M22 106h196" stroke="${I}" stroke-width="7"/>
      <path d="M22 96v20M71 99v14M120 96v20M169 99v14M218 96v20" stroke="${I}" stroke-width="4"/>
      <circle cx="152" cy="106" r="16" fill="${C}" stroke="${I}" stroke-width="5"/>`),

    cronologia: () => {
      const xs = [38, 92, 148, 202];
      return svg(`
        <path d="M14 76h212" stroke="${I}" stroke-width="5"/>
        ${xs.map((x, i) => {
          const up = i % 2 === 0;
          return `<path d="M${x} ${up ? 44 : 92}v${up ? 16 : 16}" stroke="${I}" stroke-width="4" transform="${up ? "" : "translate(0 2)"}"/>
            <rect x="${x - 26}" y="${up ? 14 : 108}" width="52" height="${up ? 30 : 26}" rx="6" fill="${C}" stroke="${I}" stroke-width="4"/>
            <path d="M${x - 14} ${up ? 29 : 121}h28" stroke="${I}" stroke-width="4"/>
            <circle cx="${x}" cy="76" r="16" fill="${[C, I, C, R][i]}" stroke="${I}" stroke-width="4"/>${txt(x, 82, 15, [I, Y, I, C][i], i + 1)}`;
        }).join("")}`);
    },

    quiesqui: () => {
      const person = (x, cy, r, fill) => `<circle cx="${x}" cy="${cy}" r="${r}" fill="${fill}" stroke="${I}" stroke-width="5"/>
        <path d="M${x - r * 1.7} 140c0-${r * 1.4} ${r * 0.8}-${r * 2.1} ${r * 1.7}-${r * 2.1}s${r * 1.7} ${r * 0.7} ${r * 1.7} ${r * 2.1}" fill="${fill}" stroke="${I}" stroke-width="5"/>`;
      return svg(`${person(52, 60, 19, C)}${person(188, 60, 19, C)}${person(120, 50, 25, I)}
        ${txt(120, 61, 30, Y, "?")}
        <circle cx="198" cy="22" r="9" fill="${R}" stroke="${I}" stroke-width="4"/><circle cx="36" cy="22" r="6" fill="${C}" stroke="${I}" stroke-width="4"/>`);
    },

    frases: () => svg(`
      <path d="M152 16h66a12 12 0 0 1 12 12v28a12 12 0 0 1-12 12h-18l-12 14V68h-36a12 12 0 0 1-12-12V28a12 12 0 0 1 12-12z" fill="${R}" stroke="${I}" stroke-width="4"/>
      <path d="M166 36h40M166 50h26" stroke="${C}" stroke-width="5"/>
      <path d="M24 36h124a14 14 0 0 1 14 14v46a14 14 0 0 1-14 14H76l-24 22v-22H24a14 14 0 0 1-14-14V50a14 14 0 0 1 14-14z" fill="${C}" stroke="${I}" stroke-width="5"/>
      ${txt(46, 94, 46, R, "«")}
      <path d="M74 64h66M74 84h46" stroke="${I}" stroke-width="7"/>`),

    match: () => svg(`
      <g transform="rotate(-8 92 74)">
        <rect x="38" y="16" width="104" height="114" rx="14" fill="${C}" stroke="${I}" stroke-width="5"/>
        <circle cx="90" cy="54" r="20" fill="${Y}" stroke="${I}" stroke-width="4"/>
        <path d="M60 94h60M68 108h44" stroke="${I}" stroke-width="5"/>
      </g>
      <g transform="rotate(10 170 72)">
        <rect x="126" y="24" width="90" height="98" rx="14" fill="${C}" stroke="${I}" stroke-width="5"/>
        <path d="M171 96s-24-14-24-31a13 13 0 0124-7 13 13 0 0124 7c0 17-24 31-24 31z" fill="${R}" stroke="${I}" stroke-width="4"/>
      </g>
      <g transform="rotate(-10 120 124)"><rect x="72" y="110" width="96" height="28" rx="6" fill="${C}" stroke="${G}" stroke-width="4"/>${txt(120, 130, 14, G, "MATCH")}</g>`),

    sigles: () => svg(`
      ${["C", "G", "P", "J"].map((l, i) => {
        const x = 32 + i * 59, y = i % 2 ? 46 : 32, rot = i % 2 ? 6 : -6;
        return `<g transform="rotate(${rot} ${x} ${y + 30})"><rect x="${x - 25}" y="${y}" width="50" height="60" rx="10" fill="${i % 2 ? Y : C}" stroke="${I}" stroke-width="5"/>${txt(x, y + 43, 32, I, l)}</g>`;
      }).join("")}
      <path d="M40 124h160" stroke="${I}" stroke-width="5" stroke-dasharray="2 12"/>`),

    paraula: () => {
      const letters = ["E", "S", "C", "", ""];
      return svg(`
        ${letters.map((l, i) => {
          const x = 40 + i * 40;
          return `<path d="M${x - 15} 74h30" stroke="${I}" stroke-width="6"/>${l ? txt(x, 64, 30, I, l) : ""}`;
        }).join("")}
        ${["A", "R", "T", "Ó", "U", "N"].map((k, i) => {
          const x = 34 + i * 34, hit = i === 3, miss = i === 1;
          return `<rect x="${x - 14}" y="94" width="28" height="30" rx="6" fill="${hit ? Y : miss ? "#ffd5cb" : C}" stroke="${I}" stroke-width="4"/>${txt(x, 115, 13, I, k)}${miss ? `<path d="M${x - 9} 104l18 10" stroke="${R}" stroke-width="4"/>` : ""}`;
        }).join("")}
        <g transform="rotate(8 206 34)"><rect x="190" y="14" width="32" height="40" rx="4" fill="${C}" stroke="${I}" stroke-width="4"/><path d="M198 26h16M198 34h16M198 42h10" stroke="${I}" stroke-width="3"/></g>`);
    },
  };
})();
