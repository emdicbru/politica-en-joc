// Càlculs de les notificacions (tools/push.js i el Centre de control): hora peninsular, propera repetició i a qui va
// cada avís. Sense dependències: es prova sol (node tools/push-lib.js --test).
"use strict";
const TZ = "Europe/Madrid";
function parts(d) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
}
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
// Ara a la península: dia «AAAA-MM-DD», hora, minut i dia de la setmana (0 = diumenge)
function madrid(d = new Date()) {
  const p = parts(d);
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, minute: Number(p.minute), wd: WD[p.weekday] };
}
// «HH:MM» o un número d'hores → minuts des de mitjanit
function hm(x) {
  if (typeof x === "number") return x * 60;
  const m = String(x || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 9 * 60;
}
// Un dia i una hora peninsulars → mil·lisegons (té en compte l'horari d'estiu)
function madridToMs(day, time) {
  const [y, mo, d] = day.split("-").map(Number), mins = hm(time);
  let t = Date.UTC(y, mo - 1, d, Math.floor(mins / 60), mins % 60);
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(t));
    const seen = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute));
    t += Date.UTC(y, mo - 1, d, Math.floor(mins / 60), mins % 60) - seen;
  }
  return t;
}
const addDays = (day, n) => new Date(Date.parse(day + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const wdOf = (day) => new Date(day + "T12:00:00Z").getUTCDay();
// La propera vegada que toca un avís que es repeteix, després d'«after». m: { time «HH:MM», rep: diari | feiners |
// setmana (el mateix dia de la setmana que «first») | dies (m.days: [0-6]), until (ms, opcional), first (dia) }
function nextAt(m, after = Date.now()) {
  const start = madrid(new Date(after)).day;
  const wdFirst = m.first ? wdOf(m.first) : wdOf(start);
  for (let i = 0; i <= 14; i++) {
    const day = addDays(start, i), wd = wdOf(day);
    const ok = m.rep === "diari" || (m.rep === "feiners" && wd >= 1 && wd <= 5) || (m.rep === "setmana" && wd === wdFirst) || (m.rep === "dies" && (m.days || []).includes(wd));
    if (!ok) continue;
    const t = madridToMs(day, m.time || "09:00");
    if (t <= after + 30000) continue;
    if (m.until && t > m.until) return null;
    return t;
  }
  return null;
}
// A qui va: s = { uid, user: { last (dia del darrer repte), streak, upd (ms de la darrera activitat) } }
function audienceFilter(aud, s, today, now = Date.now()) {
  const played = s.user && s.user.last === today;
  if (aud === "compte") return !!s.uid;
  if (aud === "nojugat") return !!s.user && !played;
  if (aud === "diari") return !played; // el repte diari: també als dispositius sense compte (no se sap si han jugat)
  if (aud === "ratxa") return !!s.user && !played && s.user.streak >= 2 && s.user.last === addDays(today, -1);
  if (aud === "inactius") return !!s.user && now - (s.user.upd || 0) >= 7 * 864e5;
  return true; // tots
}
// El repte #1 va ser l'1 d'octubre de 2026 (js/reptes.js)
const dailyNumber = (day) => Math.round((Date.parse(day + "T12:00:00Z") - Date.parse("2026-10-01T12:00:00Z")) / 864e5) + 1;

module.exports = { madrid, hm, madridToMs, nextAt, audienceFilter, dailyNumber, addDays };

if (require.main === module && process.argv.includes("--test")) {
  let fails = 0;
  const check = (l, ok, x = "") => { console.log(`${ok ? "OK  " : "FAIL"} ${l}${x ? " · " + x : ""}`); if (!ok) fails++; };
  const iso = (t) => new Date(t).toISOString();
  check("9:00 a l'hivern = 8:00 UTC", iso(madridToMs("2026-11-10", "09:00")) === "2026-11-10T08:00:00.000Z", iso(madridToMs("2026-11-10", "09:00")));
  check("9:00 a l'estiu = 7:00 UTC", iso(madridToMs("2026-07-10", "09:00")) === "2026-07-10T07:00:00.000Z");
  const now = Date.parse("2026-11-10T10:00:00Z"); // dimarts 11:00 peninsular
  check("cada dia a les 9:00: demà", iso(nextAt({ rep: "diari", time: "09:00" }, now)) === "2026-11-11T08:00:00.000Z");
  check("cada dia a les 20:00: avui", iso(nextAt({ rep: "diari", time: "20:00" }, now)) === "2026-11-10T19:00:00.000Z");
  const fri = Date.parse("2026-11-13T19:00:00Z"); // divendres 20:00
  check("dies feiners: de divendres a dilluns", iso(nextAt({ rep: "feiners", time: "09:00" }, fri)) === "2026-11-16T08:00:00.000Z");
  check("cada setmana el mateix dia (dimarts)", iso(nextAt({ rep: "setmana", time: "09:00", first: "2026-11-10" }, now)) === "2026-11-17T08:00:00.000Z");
  check("dies concrets (dl, dc)", iso(nextAt({ rep: "dies", days: [1, 3], time: "09:00" }, now)) === "2026-11-11T08:00:00.000Z");
  check("amb data de final: s'acaba", nextAt({ rep: "diari", time: "09:00", until: Date.parse("2026-11-10T23:00:00Z") }, now) === null);
  check("canvi d'hora (25 d'octubre de 2026)", iso(nextAt({ rep: "diari", time: "09:00" }, Date.parse("2026-10-24T10:00:00Z"))) === "2026-10-25T08:00:00.000Z");
  const T = "2026-11-10";
  const u = (last, streak = 0, upd = now) => ({ uid: "u", user: { last, streak, upd } });
  check("nojugat: qui ha jugat avui, no", !audienceFilter("nojugat", u(T), T) && audienceFilter("nojugat", u("2026-11-09"), T));
  check("diari: sense compte, sí; jugat, no", audienceFilter("diari", { uid: null, user: null }, T) && !audienceFilter("diari", u(T), T));
  check("ratxa: ahir va jugar i té ratxa", audienceFilter("ratxa", u("2026-11-09", 3), T) && !audienceFilter("ratxa", u("2026-11-08", 3), T) && !audienceFilter("ratxa", u("2026-11-09", 1), T));
  check("inactius: 7 dies", audienceFilter("inactius", u("2026-11-01", 0, now - 8 * 864e5), T, now) && !audienceFilter("inactius", u(T, 0, now - 864e5), T, now));
  console.log(fails ? `${fails} proves han fallat` : "Totes les proves OK");
  process.exit(fails ? 1 : 0);
}
