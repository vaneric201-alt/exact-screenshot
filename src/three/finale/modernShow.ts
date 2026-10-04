import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildEmblem, type Emblem, type EmblemId } from "../models/emblems";
import { buildPhoneAndSatellites, buildPrinterAndMill, buildTablet, type Modern } from "../models/modern";
import { buildDF17, buildDF41, buildHowitzer, buildHQ9, buildJ20, buildMissile, buildTank, buildTorpedo } from "../models/military";
import { buildGlobe, lonLat } from "../models/globe";
import { canvasTex } from "../stage/textures";
import { createFire } from "../stage/fire";
import { createAirScene } from "./airScene";
import { upgrade, type ModelName } from "../models/loaded";
import { AIR_BEATS, circleStep, montageQ, montageRect, ORDER, PH } from "./modernPhases";

/*
 * "The four inventions today", one continuous sequence (timings in modernPhases.ts):
 *  CIRCLE   the four modern heirs appear one by one on a turning ring, each
 *           lit as it comes to the front
 *  PAIRS    paper, printing, compass: the ancient object steps back while a
 *           stream of light carries it into its modern heir
 *  PARADE   gunpowder: the 2019 parade line-up rolls past (DF-41, DF-17,
 *           HQ-9, Type 99A tanks, PLZ-05 howitzers, a Yu-6 torpedo on its cradle)
 *  AIR      a low canyon run of J-20s; a PL-15 drops, lights, and the camera
 *           closes on it before it strikes a target drone (airScene.ts)
 *  FLIGHT   a night globe: a missile rises from China and arcs over the
 *           Pacific, the parade riding in the bottom-left corner; its flash
 *           whites out the screen
 *  MONTAGE  all four, ancient → modern, in a 2×2 grid that draws back into the
 *           four corners of the screen, leaving the middle for the page's words
 */

const LAUNCH: [number, number] = [106, 38.5];
const BURST: [number, number] = [-148, 33];

export interface ModernShow {
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
}

export interface ModernHooks {
  /** Each frame, with the eased progress the picture is drawn at (for words that follow the 3D exactly). */
  onFrame?(p: number): void;
  /** Fired once when the ballistic missile leaves the ground (forward only). */
  onLaunch?(): void;
  /** Fired once at its explosion (forward only). */
  onBurst?(): void;
  /** The air-to-air missile lights its motor. */
  onAirFire?(): void;
  /** It strikes the target drone. */
  onAirHit?(): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const span = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
const PAPER = new THREE.Color("#f7f1e3");

export function createModernShow(canvas: HTMLCanvasElement, hooks: ModernHooks = {}): ModernShow {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.autoClear = false;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ======================================================== the studio (circle, pairs, montage)
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.75;
  scene.background = canvasTex(1024, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.6, h * 0.42, 20, w * 0.5, h * 0.5, w * 0.75);
    g.addColorStop(0, "#26344a");
    g.addColorStop(0.6, "#0d1524");
    g.addColorStop(1, "#05080f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
  // product-shot lighting: a soft key, a cool rim and a warm kicker
  const key = new THREE.DirectionalLight("#fff3e0", 2.6);
  key.position.set(-3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const kc = key.shadow.camera;
  kc.left = kc.bottom = -5;
  kc.right = kc.top = 5;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  const rim = new THREE.DirectionalLight("#7fb0ff", 1.8);
  rim.position.set(4, 3, -4);
  const kicker = new THREE.DirectionalLight("#ffc890", 0.9);
  kicker.position.set(5, 1, 3);
  scene.add(key, rim, kicker, new THREE.HemisphereLight("#cfe0ff", "#20180f", 0.55));
  // a glossy dark floor that catches soft reflections
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 96),
    new THREE.MeshPhysicalMaterial({ color: "#060a12", roughness: 0.5, metalness: 0.1, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.08 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.95;
  floor.receiveShadow = true;
  scene.add(floor);

  interface Pair {
    id: EmblemId;
    ancient: Emblem;
    aGroup: THREE.Group;
    modern: Modern;
    mGroup: THREE.Group;
  }
  const missileTruck = (): Modern => {
    const g = new THREE.Group();
    const d = buildDF41();
    d.scale.setScalar(0.6);
    d.position.set(0, -0.95, 0);
    g.add(d);
    return { object: g, update: () => {} };
  };
  const builders: Record<EmblemId, () => Modern> = { giay: buildTablet, in: buildPrinterAndMill, laban: buildPhoneAndSatellites, thuocsung: missileTruck };
  const pairs: Pair[] = ORDER.map((id) => {
    const ancient = buildEmblem(id);
    const aGroup = new THREE.Group();
    aGroup.add(ancient.object);
    const modern = builders[id]();
    const mGroup = new THREE.Group();
    mGroup.add(modern.object);
    scene.add(aGroup, mGroup);
    return { id, ancient, aGroup, modern, mGroup };
  });

  // the ring for the circle intro: four pedestals on a thin gold circle
  const R = 2.4;
  const ring = new THREE.Group();
  const pedMat = new THREE.MeshPhysicalMaterial({ color: "#1a2132", roughness: 0.3, metalness: 0.4, clearcoat: 0.6 });
  const gold = new THREE.MeshBasicMaterial({ color: "#d9b86a", transparent: true, opacity: 0.5 });
  const circle = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 200), gold);
  circle.rotation.x = Math.PI / 2;
  circle.position.y = -0.94;
  ring.add(circle);
  const pedestals = [0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.84, 0.16, 64), pedMat);
    p.position.set(Math.sin(a) * R, -0.87, Math.cos(a) * R);
    p.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.01, 6, 96), gold);
    edge.rotation.x = Math.PI / 2;
    edge.position.copy(p.position).setY(-0.79);
    ring.add(p, edge);
    return p;
  });
  scene.add(ring);
  const spot = new THREE.SpotLight("#fff1d0", 0, 16, 0.24, 0.6, 1.2);
  scene.add(spot, spot.target);

  // a stream of light from the ancient object to the modern one
  const STREAM = 260;
  const stPos = new Float32Array(STREAM * 3);
  const stT = new Float32Array(STREAM).map(() => Math.random());
  const stOff = new Float32Array(STREAM * 3).map(() => (Math.random() - 0.5) * 0.5);
  const stGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(stPos, 3));
  const glowDot = canvasTex(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,240,200,1)");
    g.addColorStop(0.35, "rgba(255,200,120,0.6)");
    g.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const stMat = new THREE.PointsMaterial({ size: 0.07, map: glowDot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const stream = new THREE.Points(stGeo, stMat);
  stream.frustumCulled = false;
  scene.add(stream);

  // ======================================================== parade line-up
  const parade = new THREE.Scene();
  parade.environment = env;
  parade.environmentIntensity = 0.7;
  parade.background = canvasTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#6f8396");
    g.addColorStop(0.55, "#b9c3c8");
    g.addColorStop(1, "#d9d2c0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  parade.fog = new THREE.Fog("#b9c3c8", 16, 46);
  const pSun = new THREE.DirectionalLight("#fff4de", 3);
  pSun.position.set(-6, 9, 5);
  pSun.castShadow = true;
  pSun.shadow.mapSize.set(2048, 2048);
  const pc = pSun.shadow.camera;
  pc.left = pc.bottom = -14;
  pc.right = pc.top = 14;
  parade.add(pSun, pSun.target, new THREE.HemisphereLight("#dfe8f0", "#5a5244", 0.8));
  // Chang'an Avenue: asphalt with white lane lines
  const road = canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#4a4d50";
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 20000; k++) {
        const v = 40 + r() * 60;
        ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
        ctx.fillRect(r() * w, r() * h, 2, 2);
      }
      ctx.fillStyle = "rgba(240,240,235,0.85)";
      for (const y of [h * 0.22, h * 0.5, h * 0.78]) for (let x = 0; x < w; x += 120) ctx.fillRect(x, y - 4, 70, 8);
    },
    931,
    true,
    { normal: 1.5, rough: [0.75, 0.95] },
  );
  road.repeat.set(10, 2);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 26), new THREE.MeshStandardMaterial({ map: road, normalMap: road.userData["normalMap"] as THREE.Texture, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  parade.add(ground);
  // the columns as they passed on Chang'an Avenue: missiles in the front rank, armour behind
  const convoy = new THREE.Group();
  const place = (o: THREE.Object3D, x: number, z: number, s = 1, real?: ModelName) => {
    // the downloaded model replaces the hand-built one once it has loaded
    if (real) upgrade(o, real);
    o.position.set(x, 0, z);
    o.scale.setScalar(s);
    convoy.add(o);
  };
  place(buildDF41(), 0, 1.0);
  place(buildDF17(), -5.4, 1.0, 1, "df17");
  place(buildHQ9(), -10.2, 1.0, 1, "hq9");
  place(buildTorpedo(), -14.6, 1.0, 1.15);
  place(buildTank(), 1.0, -2.1, 1.15, "ztz99a");
  place(buildTank(), -2.6, -2.1, 1.15, "ztz99a");
  place(buildHowitzer(), -6.6, -2.1, 1.1, "plz05");
  place(buildHowitzer(), -10.6, -2.1, 1.1, "plz05");
  parade.add(convoy);
  const j20s = [buildJ20(), buildJ20(), buildJ20()];
  j20s.forEach((j) => {
    upgrade(j, "j20");
    j.scale.setScalar(1.25);
    parade.add(j);
  });
  const pCam = new THREE.PerspectiveCamera(34, 1, 0.1, 160);

  // ======================================================== the canyon
  const air = createAirScene(env);

  // ======================================================== globe and flight
  const space = new THREE.Scene();
  space.background = canvasTex(1024, 512, (ctx, w, h, r) => {
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 1400; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.8})`;
      const s = r() < 0.95 ? 1 : 2;
      ctx.fillRect(r() * w, r() * h, s, s);
    }
  });
  const sun = new THREE.DirectionalLight("#ffffff", 0.6);
  sun.position.set(-5, 2, 3);
  space.add(sun, new THREE.AmbientLight("#6d86b0", 0.35));
  const { group: globe } = buildGlobe(1);
  space.add(globe);
  const missile = buildMissile();
  missile.scale.setScalar(0.2);
  space.add(missile);
  const exhaust = createFire(260, 0.006, 0.06);
  space.add(exhaust.object);
  // the trail: a line that grows behind the missile, and a glowing plume along it
  const TRAIL = 200;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0.85 }));
  trail.frustumCulled = false;
  space.add(trail);
  const plume = new THREE.Points(
    trailGeo,
    new THREE.PointsMaterial({ size: 0.045, map: glowDot, color: "#ffcf8a", transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  plume.frustumCulled = false;
  space.add(plume);
  const sCam = new THREE.PerspectiveCamera(34, 1, 0.01, 50);
  // the burst: a bright sphere and a ring on the ocean
  const burstBall = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: "#fff4d8", transparent: true, opacity: 0 }));
  const burstRing = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1, 64),
    new THREE.MeshBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  space.add(burstBall, burstRing);
  const launchW = lonLat(...LAUNCH, 1);
  const burstW = lonLat(...BURST, 1);
  const axis = new THREE.Vector3().crossVectors(launchW, burstW).normalize();
  const arcAngle = launchW.angleTo(burstW);
  const along = (t: number, out: THREE.Vector3) => {
    out.copy(launchW).applyAxisAngle(axis, arcAngle * t);
    return out.multiplyScalar(1 + 0.32 * Math.sin(Math.PI * t) + 0.002);
  };

  // ======================================================== runtime
  let progress = 0;
  let shown = 0;
  let running = false;
  let raf = 0;
  let launched = false;
  let burst = false;
  let airFired = false;
  let airHit = false;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const aPos = new THREE.Vector3();
  const mPos = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 0.45, 0);
  let w = 1;
  let h = 1;

  const studioOnly = () => {
    for (const pr of pairs) pr.aGroup.visible = pr.mGroup.visible = false;
    ring.visible = false;
    stream.visible = false;
    spot.intensity = 0;
    key.intensity = 2.6;
  };

  // ---------- circle: the four modern heirs appear one by one, each turned to the front and lit
  const updateCircle = (p: number, t: number, dt: number) => {
    studioOnly();
    ring.visible = true;
    const { f, all } = circleStep(p);
    const step = Math.min(3, Math.floor(f));
    const turn = step < 3 ? step + smooth((f - step - 0.55) / 0.45) : 3;
    const rot = -turn * (Math.PI / 2) + Math.sin(t * 0.2) * 0.04;
    ring.rotation.y = rot;
    const front = Math.round(turn) % 4;
    key.intensity = all ? 2.4 : 1.1;
    pairs.forEach((pr, i) => {
      const appear = smooth((f - i) / 0.35);
      pr.mGroup.visible = appear > 0.001;
      if (!pr.mGroup.visible) return;
      const a = (i / 4) * Math.PI * 2 + rot;
      const lit = !all && i === front;
      const s = (lit ? 0.92 : 0.66) * appear;
      pr.mGroup.scale.setScalar(Math.max(0.0001, s));
      pr.mGroup.position.set(Math.sin(a) * R, -0.05 + (lit ? 0.1 : 0) + (1 - appear) * 0.6, Math.cos(a) * R);
      pr.mGroup.rotation.y = -0.3 + Math.sin(t * 0.3 + i) * 0.12;
      pr.modern.update(0.85, t, dt);
      if (lit) {
        spot.position.set(pr.mGroup.position.x * 0.5, 6, pr.mGroup.position.z * 0.5 + 1.5);
        spot.target.position.copy(pr.mGroup.position);
        spot.intensity = 70;
      }
    });
    pedestals.forEach((pd, i) => (pd.visible = f > i - 0.2));
    (gold as THREE.MeshBasicMaterial).opacity = 0.35 + (all ? 0.5 : 0.15);
    const pull = smooth((f - 4) / 0.5);
    camera.position.set(0, 1.7 + pull * 1.2, 7.6 + pull * 0.8);
    camera.lookAt(0, -0.05 - pull * 0.25, 0);
  };

  // ---------- pairs: the ancient object steps back to the middle, its modern heir grows on the right
  const updatePairs = (p: number, t: number, dt: number) => {
    studioOnly();
    let active = false;
    for (const seg of PH.pairs) {
      const pr = pairs.find((x) => x.id === seg.id)!;
      const k = clamp01((p - seg.from) / (seg.to - seg.from));
      const vis = span(p, seg.from - 0.008, seg.from + 0.01) * (1 - span(p, seg.to - 0.01, seg.to + 0.008));
      if (vis < 0.001) continue;
      active = true;
      pr.aGroup.visible = pr.mGroup.visible = true;
      const grow = span(k, 0.12, 0.38);
      pr.aGroup.scale.setScalar((1.25 - grow * 0.5) * vis);
      pr.aGroup.position.set(0.5 - grow * 0.6, -0.35 + grow * 0.1, 0.2);
      pr.aGroup.rotation.y = t * 0.3;
      pr.ancient.update?.(t, dt);
      pr.mGroup.scale.setScalar(Math.max(0.0001, grow * vis * 0.95));
      pr.mGroup.position.set(1.95, (1 - grow) * -0.6, -0.2);
      pr.mGroup.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.12;
      pr.modern.update(clamp01((k - 0.3) / 0.7), t, dt);
      // the stream of light while it changes
      const flow = span(k, 0.08, 0.2) * (1 - span(k, 0.42, 0.55));
      stMat.opacity = flow * vis;
      pr.aGroup.getWorldPosition(aPos);
      pr.mGroup.getWorldPosition(mPos);
      mPos.y += 0.2;
      for (let i = 0; i < STREAM; i++) {
        stT[i] = (stT[i]! + dt * (0.45 + (i % 9) * 0.05)) % 1;
        const s = stT[i]!;
        tmp.lerpVectors(aPos, mPos, s);
        tmp.y += Math.sin(s * Math.PI) * 0.9;
        const spread = Math.sin(s * Math.PI);
        stPos[i * 3] = tmp.x + stOff[i * 3]! * spread;
        stPos[i * 3 + 1] = tmp.y + stOff[i * 3 + 1]! * spread;
        stPos[i * 3 + 2] = tmp.z + stOff[i * 3 + 2]! * spread;
      }
      stGeo.getAttribute("position").needsUpdate = true;
    }
    stream.visible = active;
    camera.position.set(Math.sin(t * 0.1) * 0.25 + 0.2, 0.9, 6.6);
    camera.lookAt(0.2, 0.05, 0);
  };

  // ---------- montage: one pair alone, framed for one corner of the screen
  const mCam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
  const showPair = (pr: Pair, t: number, dt: number) => {
    studioOnly();
    pr.aGroup.visible = pr.mGroup.visible = true;
    pr.aGroup.scale.setScalar(0.9);
    pr.aGroup.position.set(-1.55, -0.3, 0.2);
    pr.aGroup.rotation.y = t * 0.3;
    pr.ancient.update?.(t, dt);
    pr.mGroup.scale.setScalar(0.85);
    pr.mGroup.position.set(1.15, -0.1, 0);
    pr.mGroup.rotation.y = -0.3 + Math.sin(t * 0.3) * 0.15;
    pr.modern.update(0.85, t, dt);
    mCam.position.set(-0.2, 1.1, 7.4);
    mCam.lookAt(-0.2, 0.05, 0);
  };

  const updateParade = (p: number, t: number) => {
    const k = clamp01((p - PH.parade[0]) / (PH.parade[1] - PH.parade[0]));
    // the convoy rolls slowly along the avenue; the jets pass overhead
    convoy.position.x = -1.5 + k * 4 + Math.sin(t * 0.2) * 0.05;
    j20s.forEach((j, i) => {
      j.position.set(10 - ((t * 2 + i * 2.2) % 32), 4.8 + (i === 0 ? 0.4 : 0), -1.5 + (i - 1) * 1.6);
    });
    // a slow dolly down the column, from the DF-41's cab toward the back ranks
    pCam.position.set(5.2 - k * 13, 1.5 + k * 1.3, 6.4 - k * 0.6);
    pCam.lookAt(convoy.position.x - 1.5 - k * 10, 0.7, -0.4);
    pSun.position.set(pCam.position.x - 6, 9, 5);
    pSun.target.position.set(pCam.position.x, 0, 0);
  };

  const updateFlight = (p: number, dt: number) => {
    const k = clamp01((p - PH.flight[0]) / (PH.flight[1] - PH.flight[0]));
    // the camera sits above the mid-Pacific, a little north; closes in as the missile comes down
    const view = tmp.copy(launchW).add(burstW).normalize();
    const camDir = tmp2.copy(view).add(UP).normalize();
    sCam.position.copy(camDir).multiplyScalar(4.6 - span(k, 0.55, 0.9) * 1.1);
    sCam.lookAt(0, 0.12, 0);
    const fly = clamp01((k - 0.12) / 0.7);
    const flying = k > 0.12 && k < 0.82;
    if (k > 0.12 && !launched) {
      launched = true;
      hooks.onLaunch?.();
    }
    if (k < 0.1) launched = false;
    along(fly, missile.position);
    along(Math.min(1, fly + 0.01), tmp);
    missile.lookAt(tmp);
    missile.rotateY(-Math.PI / 2);
    missile.visible = k > 0.1 && k < 0.83;
    exhaust.object.position.copy(missile.position);
    exhaust.setJet(new THREE.Vector3().subVectors(missile.position, tmp).normalize(), 0.6);
    exhaust.update(dt, flying ? 1 : 0);
    const n = Math.floor(fly * (TRAIL - 1));
    for (let i = 0; i < TRAIL; i++) {
      along(Math.min(fly, (i / (TRAIL - 1)) * fly), tmp);
      trailPos[i * 3] = tmp.x;
      trailPos[i * 3 + 1] = tmp.y;
      trailPos[i * 3 + 2] = tmp.z;
    }
    trailGeo.setDrawRange(0, Math.max(2, n));
    trailGeo.getAttribute("position").needsUpdate = true;
    trail.visible = plume.visible = k > 0.1;
    // the burst over the ocean
    const b = clamp01((k - 0.82) / 0.18);
    if (b > 0 && !burst) {
      burst = true;
      hooks.onBurst?.();
    }
    if (k < 0.8) burst = false;
    burstBall.position.copy(burstW).multiplyScalar(1.03);
    burstBall.scale.setScalar(0.02 + b * 0.35);
    (burstBall.material as THREE.MeshBasicMaterial).opacity = b > 0 ? 1 - b * 0.4 : 0;
    burstRing.position.copy(burstW).multiplyScalar(1.004);
    burstRing.lookAt(0, 0, 0);
    burstRing.scale.setScalar(0.02 + b * 0.6);
    (burstRing.material as THREE.MeshBasicMaterial).opacity = b > 0 ? 1 - b : 0;
  };

  const updateAir = (p: number, t: number, dt: number) => {
    const k = clamp01((p - PH.air[0]) / (PH.air[1] - PH.air[0]));
    air.update(k, t, dt);
    if (k >= AIR_BEATS.release + 0.03 && !airFired) {
      airFired = true;
      hooks.onAirFire?.();
    }
    if (k < AIR_BEATS.release) airFired = false;
    if (k >= AIR_BEATS.hit && !airHit) {
      airHit = true;
      hooks.onAirHit?.();
    }
    if (k < AIR_BEATS.hit - 0.02) airHit = false;
  };

  /** Draw into a part of the canvas; x, y, ww, hh in pixels from the bottom-left. */
  const region = (x: number, y: number, ww: number, hh: number) => {
    renderer.setScissorTest(true);
    renderer.setScissor(x, y, ww, hh);
    renderer.setViewport(x, y, ww, hh);
  };

  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    shown += (progress - shown) * (1 - Math.exp(-dt * 6));
    const p = shown;
    hooks.onFrame?.(p);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.setClearColor(0x000000);
    renderer.clear();

    if (p < PH.circle[1]) {
      updateCircle(p, t, dt);
      renderer.render(scene, camera);
      return;
    }
    if (p < PH.parade[0]) {
      updatePairs(p, t, dt);
      renderer.render(scene, camera);
      return;
    }
    if (p < PH.air[0]) {
      updateParade(p, t);
      pCam.aspect = w / h;
      pCam.updateProjectionMatrix();
      renderer.render(parade, pCam);
      return;
    }
    if (p < PH.air[1]) {
      updateAir(p, t, dt);
      air.resize(w / h);
      renderer.render(air.scene, air.camera);
      return;
    }
    if (p < PH.montage[0]) {
      // the globe full screen, the parade riding in the bottom-left corner
      updateFlight(p, dt);
      sCam.aspect = w / h;
      sCam.updateProjectionMatrix();
      renderer.render(space, sCam);
      updateParade(PH.parade[1], t);
      const cw = Math.round(w * 0.3);
      const ch = Math.round(h * 0.3);
      region(24, 24, cw, ch);
      pCam.aspect = cw / ch;
      pCam.updateProjectionMatrix();
      renderer.clearDepth();
      renderer.render(parade, pCam);
      renderer.setScissorTest(false);
      return;
    }
    // montage: on paper, the four pairs in a grid that draws back into the corners
    renderer.setClearColor(PAPER);
    renderer.clear();
    const q = montageQ(p);
    pairs.forEach((pr, i) => {
      const r = montageRect(i, q);
      const cw = Math.round(r.w * w);
      const ch = Math.round(r.h * h);
      region(Math.round(r.x * w), Math.round((1 - r.y - r.h) * h), cw, ch);
      showPair(pr, t, dt);
      mCam.aspect = cw / ch;
      mCam.updateProjectionMatrix();
      renderer.render(scene, mCam);
    });
    renderer.setScissorTest(false);
  };

  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    frame();
  };
  const resize = () => {
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 55 : 34;
    camera.updateProjectionMatrix();
    frame();
  };

  return {
    setProgress(p) {
      progress = clamp01(p);
      if (!running) {
        shown = progress;
        frame();
      }
    },
    start() {
      if (running) return;
      running = true;
      clock.getDelta();
      loop();
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      for (const s of [scene, parade, space, air.scene])
        s.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
          mats.forEach((x) => x.dispose());
        });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
