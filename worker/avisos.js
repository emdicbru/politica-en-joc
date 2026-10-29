// Avisos a l'instant de Política en Joc (Cloudflare Worker). Quan algú envia un missatge privat o truca a un amic,
// l'app crida aquest servei (POST /avisa) i aquí s'envia la notificació push (Web Push) als dispositius de l'amic,
// encara que tingui l'app tancada.
//  - Qui crida s'identifica amb el seu token de Firebase (se'n comprova la signatura de Google).
//  - L'amistat es llegeix de Firestore amb la clau de servei: només s'avisa un amic, i el text de l'avís és el darrer
//    missatge que ha escrit qui crida (o la seva trucada), mai un text que vingui a la petició.
//  - La notificació va xifrada per al dispositiu (RFC 8291) i signada amb la clau VAPID de l'app (RFC 8292).
// Secrets del Worker (els posa GitHub Actions, .github/workflows/avisos.yml): FIREBASE_SA, VAPID_PUBLIC, VAPID_PRIVATE.

const PROJECT = "politica-en-joc";
const ORIGINS = ["https://politicaenjoc.cat", "https://www.politicaenjoc.cat", "https://politica-en-joc.web.app", "https://politica-en-joc.firebaseapp.com"];
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const enc = new TextEncoder();

// ---------- base64url ----------
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const cat = (...a) => { const out = new Uint8Array(a.reduce((t, x) => t + x.length, 0)); let o = 0; a.forEach((x) => { out.set(x, o); o += x.length; }); return out; };
const hmac = async (key, data) => new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), data));

// ---------- Web Push: xifratge aes128gcm (RFC 8291) ----------
// sub: { endpoint, keys: { p256dh, auth } }. test: { asPrivate (JWK), salt } per reproduir els vectors de l'RFC.
export async function encryptPayload(sub, plaintext, test = null) {
  const uaPublic = unb64u(sub.keys.p256dh), authSecret = unb64u(sub.keys.auth);
  const as = test?.asKeys || await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const prkKey = await hmac(authSecret, ecdh);
  const ikm = await hmac(prkKey, cat(enc.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1])));
  const salt = test?.salt || crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const data = typeof plaintext === "string" ? enc.encode(plaintext) : plaintext;
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(data, new Uint8Array([2]))));
  const head = new Uint8Array(21);
  head.set(salt, 0);
  new DataView(head.buffer).setUint32(16, 4096);
  head[20] = 65;
  return cat(head, asPublic, ct);
}

// ---------- VAPID (RFC 8292): la signatura de l'app ----------
async function vapidKey(env) {
  const pub = unb64u(env.VAPID_PUBLIC);
  return crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}
export async function vapidAuth(env, endpoint, now = Math.floor(Date.now() / 1000)) {
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: now + 12 * 3600, sub: "https://politicaenjoc.cat" })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await vapidKey(env), enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC}`;
}
async function webPush(env, sub, payload, { ttl, topic } = {}) {
  const body = await encryptPayload(sub, JSON.stringify(payload));
  const r = await fetch(sub.endpoint, {
    method: "POST",
    headers: { Authorization: await vapidAuth(env, sub.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl ?? 86400), Urgency: "high", ...(topic ? { Topic: topic } : {}) },
    body,
  });
  return r.status;
}

// ---------- Tokens de Firebase: qui fa la crida ----------
let jwks = null, jwksExp = 0;
async function googleKeys() {
  if (jwks && Date.now() < jwksExp) return jwks;
  const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  const max = Number((r.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1] || 3600);
  jwks = (await r.json()).keys;
  jwksExp = Date.now() + max * 1000;
  return jwks;
}
export async function verifyIdToken(token, keys = null, now = Math.floor(Date.now() / 1000)) {
  const [h, p, s] = String(token || "").split(".");
  if (!s) throw new Error("token");
  const head = JSON.parse(new TextDecoder().decode(unb64u(h))), pay = JSON.parse(new TextDecoder().decode(unb64u(p)));
  if (head.alg !== "RS256") throw new Error("alg");
  const jwk = (keys || await googleKeys()).find((k) => k.kid === head.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64u(s), enc.encode(`${h}.${p}`))) throw new Error("signatura");
  if (pay.aud !== PROJECT || pay.iss !== `https://securetoken.google.com/${PROJECT}`) throw new Error("projecte");
  if (!(pay.exp > now) || pay.iat > now + 300 || !pay.sub) throw new Error("caducat");
  return pay.sub;
}

// ---------- Firestore amb la clau de servei ----------
let gtoken = null, gtokenExp = 0;
async function googleToken(env) {
  if (gtoken && Date.now() < gtokenExp) return gtoken;
  const sa = JSON.parse(env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const head = b64u(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const body = b64u(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${head}.${body}`));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${head}.${body}.${b64u(sig)}` });
  const j = await r.json();
  if (!j.access_token) throw new Error("token de servei");
  gtoken = j.access_token;
  gtokenExp = Date.now() + (j.expires_in - 120) * 1000;
  return gtoken;
}
// Valor de Firestore (REST) → JavaScript
export function fsVal(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return Date.parse(v.timestampValue);
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fsVal);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fsVal(x)]));
  return null;
}
async function fsGet(env, path) {
  const r = await fetch(`${FS}/${path}`, { headers: { Authorization: `Bearer ${await googleToken(env)}` } });
  if (r.status === 404) return null;
  const j = await r.json();
  return fsVal({ mapValue: { fields: j.fields || {} } });
}
async function pushSubs(env, uid) {
  const r = await fetch(`${FS}:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await googleToken(env)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "push" }], where: { fieldFilter: { field: { fieldPath: "uid" }, op: "EQUAL", value: { stringValue: uid } } }, limit: 10 } }),
  });
  return (await r.json()).filter((x) => x.document).map((x) => ({ id: x.document.name.split("/").pop(), sub: fsVal(x.document.fields.sub) })).filter((x) => x.sub?.endpoint);
}
const fsDelete = async (env, path) => fetch(`${FS}/${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${await googleToken(env)}` } }).catch(() => {});

// ---------- L'avís ----------
const sent = new Map(); // ja enviats (dins d'aquesta instància): no repetir el mateix missatge o trucada
const calls = new Map(); // uid → [hores de les crides] (límit: 30 per minut)
// Què s'envia, segons l'amistat a Firestore. Torna { to, payload, ttl, topic, key } o un error (text).
export function avisFor(kind, fid, caller, ami, callerName, now = Date.now()) {
  if (!ami || ami.status !== "ok" || !Array.isArray(ami.users) || !ami.users.includes(caller)) return "no sou amics";
  const to = ami.users.find((u) => u !== caller);
  if (kind === "msg") {
    const l = ami.last;
    if (!l || l.from !== caller || now - l.ts > 120000) return "cap missatge recent";
    return { to, key: `m${fid}${l.ts}`, ttl: 86400, payload: { k: "msg", title: callerName, body: String(l.t || "").slice(0, 120), url: `./#amics/xat/${encodeURIComponent(caller)}`, tag: `xat-${fid}` } };
  }
  const c = ami.call;
  if (kind === "call") {
    if (!c || c.from !== caller || c.st !== "ring" || now - c.ts > 60000) return "cap trucada";
    return { to, key: `c${fid}${c.ts}`, ttl: 50, topic: `call${fid}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32), payload: { k: "call", title: `📞 ${callerName} et truca`, body: c.video ? "Videotrucada · Política en Joc" : "Trucada de veu · Política en Joc", url: `./#amics/xat/${encodeURIComponent(caller)}`, tag: `call-${fid}`, fid, code: c.code, video: !!c.video } };
  }
  if (kind === "end") {
    if (!c || (c.st === "ring" && now - c.ts < 60000)) return "la trucada encara sona";
    // Qui truca avisa l'altre (para de sonar o «trucada perduda»); qui la rep, els seus altres dispositius
    return { to: c.from === caller ? to : caller, key: `e${fid}${c.ts}${c.st}`, ttl: 120, topic: `call${fid}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32), payload: { k: "end", tag: `call-${fid}`, missed: c.st === "perduda", title: `📞 Trucada perduda de ${callerName}`, url: `./#amics/xat/${encodeURIComponent(caller)}` } };
  }
  return "tipus desconegut";
}

function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ORIGINS.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o);
  return { "Access-Control-Allow-Origin": ok ? o : ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
}
const json = (req, status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return json(req, 200, { ok: true, servei: "Avisos de Política en Joc" });
    if (req.method !== "POST" || url.pathname !== "/avisa") return json(req, 404, { error: "no existeix" });
    let caller;
    try { caller = await verifyIdToken((req.headers.get("Authorization") || "").replace(/^Bearer /, "")); } catch (e) { return json(req, 401, { error: `sessió: ${e.message}` }); }
    const now = Date.now();
    const recent = (calls.get(caller) || []).filter((t) => now - t < 60000);
    if (recent.length >= 30) return json(req, 429, { error: "massa avisos" });
    calls.set(caller, [...recent, now]);
    let body;
    try { body = await req.json(); } catch { return json(req, 400, { error: "petició" }); }
    const fid = String(body.fid || "");
    if (!/^[A-Za-z0-9_-]{3,200}$/.test(fid)) return json(req, 400, { error: "amistat" });
    try {
      const [ami, user] = await Promise.all([fsGet(env, `amistats/${fid}`), fsGet(env, `users/${caller}`)]);
      const a = avisFor(String(body.kind), fid, caller, ami, user?.name || "Un amic", now);
      if (typeof a === "string") return json(req, 409, { error: a });
      if (sent.has(a.key)) return json(req, 200, { sent: 0, dup: true });
      sent.set(a.key, now);
      if (sent.size > 2000) sent.clear();
      const subs = await pushSubs(env, a.to);
      let ok = 0;
      await Promise.all(subs.map(async (s) => {
        const st = await webPush(env, s.sub, a.payload, { ttl: a.ttl, topic: a.topic }).catch(() => 0);
        if (st >= 200 && st < 300) ok++;
        else if (st === 404 || st === 410) await fsDelete(env, `push/${s.id}`);
      }));
      return json(req, 200, { sent: ok, devices: subs.length });
    } catch (e) {
      return json(req, 500, { error: e.message });
    }
  },
};
