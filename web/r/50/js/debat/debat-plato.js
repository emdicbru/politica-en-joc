// Plató de televisió en 3D del simulador de debat (Three.js i complements, inclosos al projecte: js/vendor, llicència MIT).
// Es carrega només en entrar al plató. API: plans de càmera, qui parla, pantalla LED i reaccions.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createPerson, prepareGent } from "./debat-gent.js?v=37";

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.redraw = (fn) => { fn(g, w, h); t.needsUpdate = true; };
  return t;
}
const hex = (c) => `#${new THREE.Color(c).getHexString()}`;

// Qualitat segons el dispositiu: 2 alta (reflexos, desenfocament), 1 mitjana, 0 baixa
function pickQuality() {
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(innerWidth, innerHeight) < 600;
  if (coarse || small) return (navigator.hardwareConcurrency || 4) >= 6 ? 1 : 0;
  return 2;
}

export async function createPlato(host, { cands, title = "DEBAT 29N", net = "Televisió", quality } = {}) {
  try { await document.fonts.ready; } catch { /* sense fonts */ }
  let Q = quality ?? pickQuality();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  const pr = Math.min(window.devicePixelRatio || 1, Q >= 1 ? 1.5 : 1);
  renderer.setPixelRatio(pr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = Q >= 1;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "db-canvas";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03040c);
  scene.fog = new THREE.FogExp2(0x060718, 0.026);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 90);
  const clock = new THREE.Clock();
  const anim = []; // funcions que s'executen cada fotograma

  // ---------- Llums d'estudi ----------
  scene.add(new THREE.HemisphereLight(0x8fa0ff, 0x150c26, 0.32));
  const key = new THREE.DirectionalLight(0xfff0e2, 2.4);
  key.position.set(3.5, 7.5, 10);
  key.target.position.set(0, 1.2, -1.5);
  key.castShadow = Q >= 1;
  key.shadow.mapSize.set(Q >= 2 ? 2048 : 1024, Q >= 2 ? 2048 : 1024);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 6, bottom: -4, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xc6d4ff, 0.55);
  fill.position.set(-7, 3, 7);
  scene.add(fill);
  const rimA = new THREE.SpotLight(0x5470ff, 70, 22, 0.55, 0.6, 1.4);
  rimA.position.set(-6, 6.5, -7); rimA.target.position.set(-1, 1.4, -2);
  const rimB = new THREE.SpotLight(0xff4f86, 70, 22, 0.55, 0.6, 1.4);
  rimB.position.set(6, 6.5, -7); rimB.target.position.set(1, 1.4, -2);
  scene.add(rimA, rimA.target, rimB, rimB.target);
  const spot = new THREE.SpotLight(0xfff6ea, 0, 14, 0.32, 0.55, 1.2);
  spot.position.set(0, 7, 2);
  scene.add(spot, spot.target);

  // ---------- Terra brillant ----------
  const floorTex = canvasTex(2048, 2048, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w / 2);
    grd.addColorStop(0, "#1a1d52"); grd.addColorStop(0.55, "#0c0e2c"); grd.addColorStop(1, "#05060f");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(110,130,255,.22)"; g.lineWidth = 3;
    for (let r = 150; r < w / 2; r += 95) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = "rgba(110,130,255,.08)"; g.lineWidth = 2;
    for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; g.beginPath(); g.moveTo(w / 2 + Math.cos(t) * 150, h / 2 + Math.sin(t) * 150); g.lineTo(w / 2 + Math.cos(t) * w / 2, h / 2 + Math.sin(t) * w / 2); g.stroke(); }
    g.font = "900 300px Unbounded, 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "rgba(255,207,61,.09)"; g.fillText("29N", w / 2, h / 2 + 330);
  });
  if (Q >= 2) {
    const mirror = new Reflector(new THREE.CircleGeometry(16, 96), { textureWidth: Math.round(innerWidth * pr * 0.5), textureHeight: Math.round(innerHeight * pr * 0.5), color: 0x7a7a86 });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -0.002;
    scene.add(mirror);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 96), new THREE.MeshStandardMaterial({ map: floorTex, roughness: Q >= 2 ? 0.4 : 0.2, metalness: Q >= 2 ? 0.1 : 0.55, transparent: Q >= 2, opacity: Q >= 2 ? 0.84 : 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const glow = (color, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
  [6.2, 10.2].forEach((r, i) => { const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 160), glow(i ? 0xff4f86 : 0x4f6bff, 1.6)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring); });

  // ---------- Pantalla LED corbada (es veu per dins: textura girada) ----------
  const LEDW = Q >= 2 ? 4096 : 2048, LEDH = LEDW / 4;
  let ledTitle = title, ledSub = net;
  const drawLed = (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#0d1360"); grd.addColorStop(0.45, "#28157a"); grd.addColorStop(0.75, "#4a1260"); grd.addColorStop(1, "#6e0f3c");
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // Píxels de pantalla LED
    const step = w / 256;
    g.fillStyle = "rgba(0,0,0,.22)";
    for (let x = 0; x < w; x += step) g.fillRect(x, 0, step * 0.18, h);
    for (let y = 0; y < h; y += step) g.fillRect(0, y, w, step * 0.18);
    // Línies decoratives
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = w / 900;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, h * (0.1 + i * 0.1)); g.bezierCurveTo(w * 0.3, h * (0.05 + i * 0.1), w * 0.7, h * (0.2 + i * 0.09), w, h * (0.12 + i * 0.1)); g.stroke(); }
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#ffffff";
    g.font = `900 ${Math.round(h * 0.19)}px Unbounded, 'Arial Black', sans-serif`;
    g.fillText(ledTitle, w / 2, h * 0.43);
    g.fillStyle = "#ffcf3d";
    g.font = `800 ${Math.round(h * 0.075)}px 'DM Sans', Arial, sans-serif`;
    g.fillText(ledSub, w / 2, h * 0.64);
    const tw = g.measureText(ledSub).width;
    g.fillStyle = "#ff3b3b"; g.beginPath(); g.arc(w / 2 - tw / 2 - h * 0.05, h * 0.64, h * 0.018, 0, Math.PI * 2); g.fill();
  };
  const ledTex = canvasTex(LEDW, LEDH, drawLed);
  ledTex.wrapS = THREE.RepeatWrapping; ledTex.repeat.x = -1;
  const LR = 9.6, LCZ = 2;
  const led = new THREE.Mesh(new THREE.CylinderGeometry(LR, LR, 4.4, 160, 1, true, Math.PI - 1.05, 2.1), new THREE.MeshBasicMaterial({ map: ledTex, side: THREE.BackSide, toneMapped: false, color: new THREE.Color(0xffffff).multiplyScalar(0.95) }));
  led.position.set(0, 2.85, LCZ);
  scene.add(led);
  // Escombrada de llum que recorre la pantalla
  const sweepTex = canvasTex(512, 64, (g, w, h) => { const grd = g.createLinearGradient(0, 0, w, 0); grd.addColorStop(0, "rgba(255,255,255,0)"); grd.addColorStop(0.5, "rgba(255,255,255,.22)"); grd.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = grd; g.fillRect(0, 0, w, h); });
  sweepTex.wrapS = THREE.RepeatWrapping; sweepTex.repeat.x = 0.6;
  const sweep = new THREE.Mesh(new THREE.CylinderGeometry(LR - 0.04, LR - 0.04, 4.4, 160, 1, true, Math.PI - 1.05, 2.1), new THREE.MeshBasicMaterial({ map: sweepTex, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sweep.position.copy(led.position);
  scene.add(sweep);
  anim.push((t) => { sweepTex.offset.x = (t * 0.05) % 1; });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0b1c, roughness: 0.45, metalness: 0.6 });
  [0.62, 5.08].forEach((y) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(LR + 0.05, LR + 0.05, 0.12, 160, 1, true, Math.PI - 1.07, 2.14), frameMat); b.position.set(0, y, LCZ); scene.add(b); });
  // Columnes LED als costats de la pantalla
  const colTex = canvasTex(64, 512, (g, w, h) => { const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#ff4f86"); grd.addColorStop(0.5, "#5b4bff"); grd.addColorStop(1, "#1f6bff"); g.fillStyle = grd; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,.3)"; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 3); });
  colTex.wrapT = THREE.RepeatWrapping;
  const colMat = new THREE.MeshBasicMaterial({ map: colTex, toneMapped: false, color: new THREE.Color(0xffffff).multiplyScalar(1.4) });
  [-1, 1].forEach((side) => [0, 1].forEach((i) => {
    const a = Math.PI + side * (1.12 + i * 0.16);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.8, 0.22), colMat);
    col.position.set(Math.sin(a) * (LR - 0.3), 2.6, LCZ + Math.cos(a) * (LR - 0.3));
    scene.add(col);
  }));
  anim.push((t) => { colTex.offset.y = (t * 0.12) % 1; });

  // ---------- Graella de llums al sostre, amb feixos en la boira ----------
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x1a1b26, roughness: 0.5, metalness: 0.8 });
  [[0, 5.9, -3.2, 15, 0.22, 0.22], [0, 5.9, 5.5, 15, 0.22, 0.22], [-7.4, 5.9, 1.15, 0.22, 0.22, 8.9], [7.4, 5.9, 1.15, 0.22, 0.22, 8.9]].forEach(([x, y, z, w, h, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trussMat); b.position.set(x, y, z); scene.add(b); });
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(0xbfcaff) }, strength: { value: 0.16 } },
    vertexShader: "varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 color; uniform float strength; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float a = strength * vY * edge; gl_FragColor = vec4(color * a, a); }",
  });

  // ---------- Persones: es carreguen abans de muntar el plató ----------
  const SUITS = [0x1c2038, 0x26262e, 0x232a4a, 0x2f2a33];
  const specOf = (c, i) => ({ seed: c.seed ?? i + 3, look: c.look, age: c.age, skin: c.skin, hair: c.hair, suit: c.suit ?? SUITS[i % SUITS.length], accent: c.color, quality: Q, hands: { x: 0.2, y: 1.12, z: 0.3 } });
  const modSpec = { seed: 99, look: "dona2", age: 46, skin: 0xe6b89a, hair: 0x3b2a1e, suit: 0x5a1f2e, accent: 0xf2efe8, seated: true, quality: Q, hands: { x: 0.2, y: 0.83, z: 0.42 } };
  await prepareGent([...cands.map(specOf), modSpec]);

  // ---------- Tarima, faristols i candidats ----------
  const n = cands.length;
  const C = new THREE.Vector3(0, 0, 1.5);
  const R = n === 2 ? 4.2 : 4.4 + n * 0.22;
  const spread = n === 2 ? 0.36 : Math.min(1.05, 0.2 * (n - 1));
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.75, R + 0.75, 0.12, 128, 1, false, Math.PI - spread - 0.2, (spread + 0.2) * 2), new THREE.MeshStandardMaterial({ color: 0x0c0d22, roughness: 0.3, metalness: 0.5 }));
  riser.position.set(C.x, 0.06, C.z); riser.receiveShadow = true;
  scene.add(riser);

  const people = new Map();
  const podGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.27, 0); s.lineTo(0.27, 0); s.lineTo(0.33, 1.02); s.quadraticCurveTo(0.33, 1.06, 0.29, 1.06); s.lineTo(-0.29, 1.06); s.quadraticCurveTo(-0.33, 1.06, -0.33, 1.02); s.lineTo(-0.27, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 8 });
    g.translate(0, 0, -0.21);
    return g;
  })();
  const podMat = new THREE.MeshPhysicalMaterial({ color: 0x0c0d1e, roughness: 0.28, metalness: 0.55, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  const topMat = new THREE.MeshPhysicalMaterial({ color: 0x1a1c36, roughness: 0.15, metalness: 0.3, clearcoat: 1 });
  const micMat = new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: 0.35, metalness: 0.8 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xc9c7c0, roughness: 0.9 });
  cands.forEach((c, i) => {
    const a = n === 1 ? 0 : -spread + (2 * spread * i) / (n - 1);
    const pos = new THREE.Vector3(C.x + Math.sin(a) * R, 0.12, C.z - Math.cos(a) * R);
    const g = new THREE.Group();
    g.position.copy(pos);
    g.lookAt(0, 0.12, 9);
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.castShadow = true; pod.receiveShadow = true;
    g.add(pod);
    // Pantalla frontal amb les sigles i el nom
    const screen = canvasTex(512, 640, (ctx, w, h) => {
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#0f1030"); grd.addColorStop(1, hex(new THREE.Color(c.color).multiplyScalar(0.55)));
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = c.color; ctx.fillRect(0, h - 70, w, 70);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `900 ${c.sig.length > 5 ? 88 : c.sig.length > 3 ? 110 : 140}px Unbounded, 'Arial Black', sans-serif`;
      ctx.fillText(c.sig, w / 2, h * 0.42);
      ctx.font = "800 40px 'DM Sans', Arial, sans-serif";
      ctx.fillText(c.name, w / 2, h - 35);
    });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshBasicMaterial({ map: screen, toneMapped: false, color: new THREE.Color(0xffffff).multiplyScalar(0.9) }));
    front.position.set(0, 0.6, 0.226);
    front.rotation.x = -0.055;
    g.add(front);
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.018, 0.02), glow(c.color, 2.4));
    ledStrip.position.set(0, 0.03, 0.22);
    g.add(ledStrip);
    const topLed = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.01, 0.01), glow(c.color, 2));
    topLed.position.set(0, 1.075, 0.235);
    g.add(topLed);
    // Superfície inclinada, papers i micròfon de coll de cigne
    const top = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.03, 0.48, 2, 0.012), topMat);
    top.position.set(0, 1.085, 0); top.rotation.x = 0.16; top.castShadow = true;
    g.add(top);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), paperMat);
    paper.position.set(-0.1, 1.105, 0.02); paper.rotation.set(0.16, 0.08, 0);
    g.add(paper);
    const neckCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.18, 1.1, 0.08), new THREE.Vector3(0.17, 1.2, 0.03), new THREE.Vector3(0.12, 1.32, -0.08), new THREE.Vector3(0.07, 1.4, -0.2)]);
    const mic = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 24, 0.006, 8, false), micMat);
    const micHead = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.011, 0.06, 16), micMat);
    micHead.position.set(0.06, 1.415, -0.23);
    micHead.rotation.set(-0.9, 0, 0.25);
    const micLed = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.002, 6, 16), glow(0xff3030, 1));
    micLed.position.set(0.18, 1.106, 0.08); micLed.rotation.x = Math.PI / 2;
    g.add(mic, micHead, micLed);
    // La persona, darrere del faristol
    const p = createPerson(specOf(c, i));
    p.root.position.set(0, 0, -0.42);
    g.add(p.root);
    scene.add(g);
    // Feix de llum del sostre cap al faristol
    if (Q >= 1) {
      const top = new THREE.Vector3(pos.x * 0.9, 5.85, pos.z + 0.8);
      const dir = new THREE.Vector3(pos.x, 1.2, pos.z).sub(top);
      const len = dir.length();
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.85, len, 32, 1, true), beamMat);
      cone.position.copy(top).addScaledVector(dir, 0.5);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
      scene.add(cone);
      const fix = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.32, 16), trussMat);
      fix.position.copy(top);
      scene.add(fix);
    }
    people.set(c.id, { group: g, person: p, pos, mic: micLed, me: !!c.me });
  });
  // Halo del jugador a terra
  const me = [...people.values()].find((p) => p.me);
  if (me) {
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.66, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcf3d).multiplyScalar(1.6), transparent: true, opacity: 0.85, toneMapped: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(me.pos.x, 0.125, me.pos.z);
    scene.add(halo);
  }

  // ---------- La moderadora, a la consola central ----------
  const modPos = new THREE.Vector3(0, 0, 3.3);
  const modG = new THREE.Group();
  modG.position.copy(modPos);
  modG.rotation.y = Math.PI;
  const deskShape = new THREE.Shape();
  deskShape.absarc(0, 0, 0.95, -0.95, 0.95, false);
  deskShape.absarc(0, 0, 0.6, 0.95, -0.95, true);
  const deskGeo = new THREE.ExtrudeGeometry(deskShape, { depth: 0.76, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 32 });
  deskGeo.rotateX(-Math.PI / 2); deskGeo.rotateY(Math.PI / 2);
  const desk = new THREE.Mesh(deskGeo, podMat);
  desk.castShadow = true; desk.receiveShadow = true;
  const topGeo = new THREE.ExtrudeGeometry(deskShape, { depth: 0.03, bevelEnabled: false, curveSegments: 32 });
  topGeo.rotateX(-Math.PI / 2); topGeo.rotateY(Math.PI / 2);
  const deskTop = new THREE.Mesh(topGeo, topMat);
  deskTop.position.y = 0.77;
  const deskLed = new THREE.Mesh(new THREE.TorusGeometry(0.965, 0.008, 6, 64, 1.9), glow(0xffcf3d, 2));
  deskLed.rotation.x = Math.PI / 2; deskLed.rotation.z = -0.95 - Math.PI / 2; deskLed.position.y = 0.42;
  const tablet = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.012, 0.17, 2, 0.006), new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 0.2, metalness: 0.4, emissive: 0x1b2a55, emissiveIntensity: 0.6 }));
  tablet.position.set(0.18, 0.805, 0.72); tablet.rotation.y = 0.3;
  const mPaper = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.004, 0.29), paperMat);
  mPaper.position.set(-0.15, 0.8, 0.74); mPaper.rotation.y = -0.15;
  const modP = createPerson(modSpec);
  modP.root.position.set(0, 0, 0.25);
  // La taula queda davant de la moderadora (entre ella i els candidats)
  const deskG = new THREE.Group();
  deskG.add(desk, deskTop, deskLed);
  deskG.rotation.y = Math.PI;
  // Cadira de la moderadora
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x15161f, roughness: 0.55, metalness: 0.2 });
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.09, 0.48, 3, 0.03), chairMat); seat.position.set(0, 0.47, 0.02);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.62, 0.08, 3, 0.035), chairMat); back.position.set(0, 0.86, -0.2); back.rotation.x = -0.12;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), micMat); post.position.set(0, 0.22, 0);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 5), micMat); foot.position.set(0, 0.02, 0);
  [seat, back].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  chair.add(seat, back, post, foot);
  chair.position.set(0, 0, 0.18);
  modG.add(deskG, tablet, mPaper, chair, modP.root);
  scene.add(modG);
  const modHead = () => modP.headWorld(new THREE.Vector3());

  // ---------- Càmeres de plató (atrezzo) i paret del fons ----------
  const camProps = [];
  const camBodyMat = new THREE.MeshStandardMaterial({ color: 0x23252f, roughness: 0.4, metalness: 0.6 });
  [[-4.6, 8.4], [2.4, 10.4], [5.2, 8]].forEach(([x, z]) => {
    const g = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.2, 16), camBodyMat); ped.position.y = 0.6;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.12, 24), camBodyMat); base.position.y = 0.06;
    const bodyC = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.32, 0.62, 3, 0.04), camBodyMat); bodyC.position.y = 1.42;
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.36, 24), new THREE.MeshStandardMaterial({ color: 0x0b0b0f, roughness: 0.2, metalness: 0.7 }));
    lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.42, -0.48);
    const prompter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.08), camBodyMat); prompter.position.set(0, 1.45, -0.75);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x401010, toneMapped: false })); tally.position.set(0, 1.66, -0.7);
    g.add(ped, base, bodyC, lens, prompter, tally);
    g.position.set(x, 0, z);
    g.lookAt(0, 0, 0);
    g.rotateY(Math.PI);
    scene.add(g);
    camProps.push({ g, tally });
  });
  const backTex = canvasTex(2048, 512, (g, w, h) => {
    g.fillStyle = "#07081c"; g.fillRect(0, 0, w, h);
    for (let x = 60; x < w; x += 140) { const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "rgba(80,110,255,0)"); grd.addColorStop(0.5, "rgba(80,110,255,.55)"); grd.addColorStop(1, "rgba(80,110,255,0)"); g.fillStyle = grd; g.fillRect(x, 0, 8, h); }
    g.fillStyle = "rgba(255,207,61,.7)"; g.fillRect(0, h * 0.64, w, 5);
    g.font = "900 80px Unbounded, 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillText("DEBAT 29N · DEBAT 29N · DEBAT 29N", w / 2, h * 0.36);
  });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 7), new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false }));
  backWall.position.set(0, 3.2, 13); backWall.rotation.y = Math.PI;
  scene.add(backWall);

  // ---------- Postproducció ----------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pr);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = Q >= 2 ? new BokehPass(scene, camera, { focus: 3, aperture: 0.0016, maxblur: 0.006 }) : null;
  if (bokeh) { bokeh.enabled = false; composer.addPass(bokeh); }
  const bloom = Q >= 1 ? new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.5, 0.93) : null;
  if (bloom) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- Plans de càmera ----------
  const look = new THREE.Vector3(), shotPos = new THREE.Vector3(), shotLook = new THREE.Vector3();
  let fromPos = new THREE.Vector3(), fromLook = new THREE.Vector3(), t0 = 0, dur = 0, shotFov = 30, close = null;
  const portrait = () => camera.aspect < 0.9;
  function frameOf(id) {
    const p = people.get(id);
    const head = p.person.headWorld(new THREE.Vector3());
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(p.group.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.group.quaternion);
    const dist = portrait() ? 1.55 : 1.95;
    return { pos: head.clone().addScaledVector(fwd, dist).addScaledVector(right, 0.32).add(new THREE.Vector3(0, 0.02, 0)), look: head.clone().add(new THREE.Vector3(0, -0.09, 0)), fov: portrait() ? 34 : 24, focus: head };
  }
  function shot(name, { cut = true } = {}) {
    let pos, lk, fov, focus = null;
    if (name === "wide") {
      pos = portrait() ? new THREE.Vector3(0, 5.4, 14.5) : new THREE.Vector3(0, 3.4, 13.5);
      lk = portrait() ? new THREE.Vector3(0, 0.9, -1.8) : new THREE.Vector3(0, 1.25, -1);
      fov = portrait() ? 50 : 32;
    } else if (name === "mod") {
      const h = modHead();
      pos = h.clone().add(new THREE.Vector3(0.4, 0.05, -1.9)); lk = h.clone().add(new THREE.Vector3(0, -0.07, 0)); fov = portrait() ? 34 : 26; focus = h;
    } else if (name === "two") {
      pos = new THREE.Vector3(0, 2, 7.6); lk = new THREE.Vector3(0, 1.35, -1.6); fov = portrait() ? 46 : 30;
    } else if (people.has(name)) {
      const f = frameOf(name); pos = f.pos; lk = f.look; fov = f.fov; focus = f.focus;
    } else return;
    fromPos = cut ? pos.clone() : camera.position.clone();
    fromLook = cut ? lk.clone() : look.clone();
    shotPos.copy(pos); shotLook.copy(lk); shotFov = fov; close = focus;
    t0 = performance.now(); dur = cut ? 0 : 900;
    if (cut) { camera.position.copy(pos); look.copy(lk); camera.fov = fov; camera.updateProjectionMatrix(); host.classList.remove("db-cut"); void host.offsetWidth; host.classList.add("db-cut"); }
    if (bokeh) bokeh.enabled = !!focus;
    const near = camProps.reduce((b, c) => (c.g.position.distanceTo(pos) < b.g.position.distanceTo(pos) ? c : b), camProps[0]);
    camProps.forEach((c) => c.tally.material.color.setHex(c === near ? 0xff2020 : 0x401010));
  }

  // ---------- Qui parla i cap on miren ----------
  let speaker = null;
  const tmp = new THREE.Vector3();
  function speak(id) {
    speaker = id;
    people.forEach((p, pid) => { p.person.setTalk(pid === id); p.mic.material.color.setHex(pid === id ? 0x30ff60 : 0xff3030).multiplyScalar(1.4); });
    modP.setTalk(id === "mod");
    const p = id && id !== "mod" ? people.get(id) : null;
    if (p) { const h = p.person.headWorld(tmp); spot.position.set(h.x, 6.5, h.z + 2.2); spot.target.position.set(h.x, h.y - 0.25, h.z); spot.intensity = 22; }
    else if (id === "mod") { const h = modHead(); spot.position.set(h.x, 6.5, h.z - 2); spot.target.position.copy(h); spot.intensity = 16; }
    else spot.intensity = 0;
  }
  const react = (id, kind) => { const p = people.get(id); p?.person.react(kind, clock.elapsedTime); };
  function screen(t, sub) { ledTitle = t; ledSub = sub; ledTex.userData.redraw(drawLed); }

  // ---------- Bucle ----------
  let raf = 0, alive = true, frames = 0, slow = 0;
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    if (dur) {
      const k = Math.min(1, (now - t0) / dur);
      camera.position.lerpVectors(fromPos, shotPos, ease(k));
      look.lerpVectors(fromLook, shotLook, ease(k));
      camera.fov += (shotFov - camera.fov) * 0.1; camera.updateProjectionMatrix();
    }
    // Lleuger moviment de càmera, com una càmera de plató
    camera.position.x += Math.sin(t * 0.33) * 0.0009;
    camera.position.y += Math.sin(t * 0.47) * 0.0005;
    camera.lookAt(look);
    // Mirades: qui escolta mira qui parla; qui parla mira la càmera; la moderadora segueix el debat
    const spk = speaker && speaker !== "mod" ? people.get(speaker) : null;
    const spkHead = spk ? spk.person.headWorld(new THREE.Vector3()) : speaker === "mod" ? modHead() : null;
    people.forEach((p, id) => {
      if (id === speaker) p.person.setGaze(camera.position);
      else if (spkHead) p.person.setGaze(spkHead);
      else p.person.setGaze(modHead());
      p.person.update(t, dt);
    });
    modP.setGaze(spkHead && speaker !== "mod" ? spkHead : camera.position);
    modP.update(t, dt);
    anim.forEach((f) => f(t));
    if (bokeh && close) bokeh.uniforms.focus.value = camera.position.distanceTo(close);
    composer.render(dt);
    // Si va lent, es rebaixa la qualitat
    frames++;
    if (frames > 30 && frames < 200) { if (dt > 0.045) slow++; if (slow > 40 && Q > 0) { Q--; slow = 0; if (bokeh) bokeh.enabled = false; if (Q === 0 && bloom) bloom.enabled = false; renderer.setPixelRatio(1); resize(); } }
  }
  function resize() {
    const w = host.clientWidth || 640, h = host.clientHeight || 360;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  shot("wide");
  raf = requestAnimationFrame(loop);
  const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else if (alive) { clock.getDelta(); raf = requestAnimationFrame(loop); } };
  document.addEventListener("visibilitychange", onVis);

  return {
    shot, speak, react, screen, resize,
    get quality() { return Q; },
    get _debug() { return { people, modP, camera, scene }; },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
      envTex.dispose(); pmrem.dispose(); composer.dispose?.(); renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
