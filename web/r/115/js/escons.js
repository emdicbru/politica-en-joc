// Llei d'Hondt i hemicicle del Congrés. Els fan servir l'app (minijocs, simulador, pactòmetre) i els widgets (widget/).

// ---------- Llei d'Hondt ----------
function dhondt(votes, seats) {
  const qs = [];
  votes.forEach((v, pi) => { for (let d = 1; d <= seats; d++) qs.push({ pi, d, q: v / d }); });
  // En cas d'empat guanya la candidatura amb més vots totals (art. 163.1 LOREG)
  qs.sort((a, b) => b.q - a.q || votes[b.pi] - votes[a.pi]);
  const winners = qs.slice(0, seats);
  const won = votes.map(() => 0);
  winners.forEach((w) => won[w.pi]++);
  return { won, winners, next: qs[seats] };
}

// ---------- Geometria de l'hemicicle ----------
function hemicycleSeats(total, rows = 12, r0 = 0.36) {
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((1 - r0) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sumR));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  for (let k = rows - 1; diff !== 0; k = (k - 1 + rows) % rows) {
    counts[k] += Math.sign(diff);
    diff -= Math.sign(diff);
  }
  const seats = [];
  radii.forEach((r, i) => {
    const n = counts[i];
    for (let j = 0; j < n; j++) {
      const a = Math.PI * (1 - j / (n - 1));
      seats.push({ x: Math.cos(a) * r, y: -Math.sin(a) * r, a, r });
    }
  });
  return seats.sort((p, q) => q.a - p.a || p.r - q.r);
}

function hemicycleSVG(parties) {
  const seats = hemicycleSeats(parties.reduce((s, p) => s + p.seats, 0));
  let k = 0;
  const circles = parties.flatMap((p) => Array.from({ length: p.seats }, () => {
    const s = seats[k++];
    return `<circle cx="${s.x.toFixed(4)}" cy="${s.y.toFixed(4)}" r="0.025" fill="${p.color}" data-p="${p.id}"/>`;
  }));
  return `<svg class="hemicycle" viewBox="-1.04 -1.04 2.08 1.08" role="img" aria-label="Hemicicle del Congrés">${circles.join("")}</svg>`;
}
