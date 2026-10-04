import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFire } from "../stage/fire";
import { bambooTex, canvasTex, pbr } from "../stage/textures";

/*
 * The fast-forward (1088 → 2026) as one continuous shot: a firework rocket
 * (火箭) stands at the bottom of the screen, its fuse lit; it launches and keeps
 * climbing, trembling a little, while the camera rises with it through the
 * night. Each event of the rewind book hangs along the way, left and right of
 * its path, as a framed photograph with its year; as the rocket passes, the
 * photograph lights up and the years run on. Only at 2026 does it burst into
 * a great firework — today.
 */

export interface LanceEvent {
  year: number;
  label: string;
  image: string;
  blank?: boolean;
}

export interface LanceShow {
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
}

export interface LanceHooks {
  /** The rocket leaves the ground (forward only). */
  onFire?(): void;
  /** The rocket passes event i (forward only), or -1 before the first. */
  onPass?(i: number): void;
  /** It bursts at 2026 (forward only). */
  onBurst?(): void;
}

/** Progress at which the rocket launches, and where it bursts. */
export const FIRE_AT = 0.07;
export const FLIGHT_END = 0.92;

const SPACING = 4.6;
const START_Y = 2.6;
const eventY = (i: number) => START_Y + (i + 1) * SPACING;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** A Chinese sky rocket: red paper tube with gold bands and 福, a paper cone, a long bamboo guide stick. */
export function buildRocket() {
  const g = new THREE.Group();
  const paper = canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#b8231a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e3b54f";
    for (const y of [0.08, 0.92]) ctx.fillRect(0, h * y - 9, w, 18);
    ctx.fillRect(0, h * 0.5 - 3, w, 6);
    ctx.font = '700 86px "Noto Serif TC", "Songti TC", serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const x of [0.25, 0.75]) ctx.fillText("福", w * x, h * 0.3);
    for (const x of [0, 0.5, 1]) ctx.fillText("春", w * x, h * 0.72);
  });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.66, 32), pbr({ map: paper, roughness: 0.7 }));
  const gold = pbr({ color: "#e0b24c", metalness: 0.6, roughness: 0.35 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.26, 32), gold);
  cone.position.y = 0.46;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.103, 0.012, 8, 32), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.33;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.06, 32), pbr({ color: "#3a2a1c", roughness: 0.9 }));
  base.position.y = -0.36;
  const stickTex = bambooTex(611);
  stickTex.repeat.set(1, 6);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.9, 8), pbr({ map: stickTex, roughness: 0.6 }));
  stick.position.set(0.11, -0.75, 0);
  const cordMat = pbr({ color: "#4a2c14", roughness: 0.9 });
  for (const y of [-0.2, 0.2]) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.008, 6, 24), cordMat);
    c.rotation.x = Math.PI / 2;
    c.position.y = y;
    g.add(c);
  }
  g.add(tube, cone, rim, base, stick);
  const nozzle = new THREE.Object3D();
  nozzle.position.y = -0.4;
  g.add(nozzle);
  return { group: g, nozzle };
}

/** A paper-mounted photograph, with its year under it. */
function photoFrame(e: LanceEvent, loader: THREE.TextureLoader) {
  const g = new THREE.Group();
  const W = 2.6;
  const H = 1.95;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, H + 0.56, 0.05), pbr({ color: "#efe4c8", roughness: 0.9 }));
  mount.position.y = -0.14;
  g.add(mount);
  const photoMat = new THREE.MeshStandardMaterial({ color: e.blank ? "#f7f1e3" : "#ffffff", roughness: 0.75, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 });
  if (!e.blank) {
    loader.load(`/img/${e.image}.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      // cover-fit the photograph into the 4:3 window
      const a = (t.image as HTMLImageElement).width / (t.image as HTMLImageElement).height;
      const target = W / H;
      if (a > target) {
        t.repeat.set(target / a, 1);
        t.offset.set((1 - target / a) / 2, 0);
      } else {
        t.repeat.set(1, a / target);
        t.offset.set(0, (1 - a / target) / 2);
      }
      photoMat.map = t;
      photoMat.emissiveMap = t;
      photoMat.needsUpdate = true;
    });
  }
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), photoMat);
  photo.position.set(0, 0.06, 0.03);
  g.add(photo);
  const yearTex = canvasTex(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = e.blank ? "#b23a2b" : "#2a1a0e";
    ctx.font = '700 92px "Newsreader", "Noto Serif", Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e.label, w / 2, h / 2 + 4);
  });
  const year = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: yearTex, transparent: true }));
  year.position.set(0, -H / 2 - 0.15, 0.03);
  g.add(year);
  return { group: g, photoMat };
}

/** Firework stars: a pool of points thrown out from a burst, slowed by the air and pulled down by gravity. */
export function createStars(count: number, sprite: THREE.Texture) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const base = new Float32Array(count * 3);
  const age = new Float32Array(count).fill(99);
  const life = new Float32Array(count).fill(1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.16, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  let next = 0;
  const c = new THREE.Color();
  return {
    points,
    burst(at: THREE.Vector3, n: number, speed: number, colors: string[], lifeS = 2.4) {
      for (let k = 0; k < n; k++) {
        const i = next;
        next = (next + 1) % count;
        // even directions on a sphere
        const u = Math.random() * 2 - 1;
        const a = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        const v = speed * (0.82 + Math.random() * 0.18);
        vel[i * 3] = Math.cos(a) * s * v;
        vel[i * 3 + 1] = u * v;
        vel[i * 3 + 2] = Math.sin(a) * s * v;
        pos[i * 3] = at.x;
        pos[i * 3 + 1] = at.y;
        pos[i * 3 + 2] = at.z;
        c.set(colors[k % colors.length]!);
        base[i * 3] = c.r;
        base[i * 3 + 1] = c.g;
        base[i * 3 + 2] = c.b;
        age[i] = 0;
        life[i] = lifeS * (0.75 + Math.random() * 0.5);
      }
    },
    update(dt: number) {
      const drag = Math.exp(-dt * 1.6);
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        if (age[i]! > life[i]!) {
          col[j] = col[j + 1] = col[j + 2] = 0;
          continue;
        }
        age[i] = age[i]! + dt;
        vel[j] = vel[j]! * drag;
        vel[j + 1] = vel[j + 1]! * drag - 2.2 * dt;
        vel[j + 2] = vel[j + 2]! * drag;
        pos[j] = pos[j]! + vel[j]! * dt;
        pos[j + 1] = pos[j + 1]! + vel[j + 1]! * dt;
        pos[j + 2] = pos[j + 2]! + vel[j + 2]! * dt;
        // white-hot at first, then its colour, fading with a twinkle near the end
        const k = age[i]! / life[i]!;
        const fade = Math.pow(1 - k, 1.6) * (k > 0.6 ? 0.6 + Math.random() * 0.4 : 1);
        const hot = Math.max(0, 1 - k * 6);
        col[j] = Math.min(1, base[j]! * fade + hot);
        col[j + 1] = Math.min(1, base[j + 1]! * fade + hot * 0.9);
        col[j + 2] = Math.min(1, base[j + 2]! * fade + hot * 0.7);
      }
      geo.getAttribute("position").needsUpdate = true;
      geo.getAttribute("color").needsUpdate = true;
    },
    reset() {
      age.fill(99);
      col.fill(0);
      geo.getAttribute("color").needsUpdate = true;
    },
  };
}

export function createLanceShow(canvas: HTMLCanvasElement, events: LanceEvent[], hooks: LanceHooks = {}): LanceShow {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const skyLow = new THREE.Color("#141a3a");
  const skyHigh = new THREE.Color("#04050c");
  const sky = new THREE.Color().copy(skyLow);
  scene.background = sky;
  scene.fog = new THREE.Fog(sky.clone(), 16, 46);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 120);
  scene.add(new THREE.HemisphereLight("#c9d4ff", "#1a1008", 0.55));
  const moon = new THREE.DirectionalLight("#dfe6ff", 0.9);
  moon.position.set(-3, 5, 6);
  scene.add(moon);

  // 2026 is the burst itself, so only the years before it hang along the climb
  const climb = events.filter((e) => !e.blank);
  const END_Y = eventY(climb.length - 1) + 3.6;

  // ---------- the ground the rocket leaves from: dark paving and a little launch rack
  const GROUND = -2.75;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), pbr({ color: "#1b1712", roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND;
  scene.add(ground);
  const rackMat = pbr({ color: "#4a2a18", roughness: 0.8 });
  for (const x of [-0.22, 0.42]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.0, 0.05), rackMat);
    leg.position.set(x, GROUND + 1.5, -0.12);
    scene.add(leg);
  }
  for (const y of [-0.45, GROUND + 0.6]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), rackMat);
    bar.position.set(0.1, y, -0.12);
    scene.add(bar);
  }
  // a lantern glow at ground level, so the start is not pitch dark
  const groundGlow = new THREE.PointLight("#ff9a50", 18, 9, 1.6);
  groundGlow.position.set(-1.4, GROUND + 1.2, 1.4);
  scene.add(groundGlow);

  // ---------- stars and thin clouds along the climb, so the rise reads as speed
  const dot = canvasTex(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,240,210,0.7)");
    g.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const STARS = 1800;
  const sp = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 70;
    sp[i * 3 + 1] = -2 + Math.random() * (END_Y + 30);
    sp[i * 3 + 2] = -18 - Math.random() * 14;
  }
  const starGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.12, map: dot, color: "#e8ecff", transparent: true, opacity: 0.8, depthWrite: false, fog: false })));
  const puff = canvasTex(128, 128, (ctx, w, h, r) => {
    for (let k = 0; k < 18; k++) {
      const x = 24 + r() * 80;
      const y = 40 + r() * 48;
      const rr = 14 + r() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
  for (let k = 0; k < 26; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: "#8d94b8", transparent: true, opacity: 0.22, depthWrite: false }));
    s.position.set((Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 9), 4 + Math.random() * END_Y, -6 - Math.random() * 8);
    s.scale.setScalar(5 + Math.random() * 7);
    scene.add(s);
  }

  // ---------- the rocket, its fuse, its jet of sparks and a trail of glitter
  const rocket = buildRocket();
  rocket.group.scale.setScalar(1.7);
  scene.add(rocket.group);
  const jet = createFire(520, 0.05, 0.4);
  jet.setJet(new THREE.Vector3(0, -1, 0), 3.6);
  scene.add(jet.object);
  const fuse = createFire(90, 0.01, 0.12);
  fuse.setJet(new THREE.Vector3(0, 1, 0), 0.8);
  scene.add(fuse.object);
  const rocketLight = new THREE.PointLight("#ffb050", 0, 9, 1.4);
  scene.add(rocketLight);
  const TRAIL = 140;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Points(
    trailGeo,
    new THREE.PointsMaterial({ size: 0.16, map: dot, color: "#ffc070", transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  trail.frustumCulled = false;
  scene.add(trail);

  // ---------- the years: photographs left and right of the climb
  const loader = new THREE.TextureLoader();
  const frames = climb.map((e, i) => {
    const f = photoFrame(e, loader);
    const side = i % 2 ? 1 : -1;
    f.group.position.set(side * 3.1, eventY(i), -1.2);
    f.group.rotation.y = -side * 0.16;
    scene.add(f.group);
    return f;
  });

  // ---------- the burst at 2026
  const stars = createStars(5200, dot);
  scene.add(stars.points);
  const burstLight = new THREE.PointLight("#ffd080", 0, 40, 1.2);
  scene.add(burstLight);
  const BURST_AT = new THREE.Vector3(0, END_Y + 1.2, 0);
  const SHELLS = [
    { at: [0, 0, 0], n: 1800, speed: 9.5, colors: ["#ffd36a", "#ffb03a", "#fff1c2"], delay: 0 },
    { at: [0, 0, 0], n: 800, speed: 5.2, colors: ["#ff4d3a", "#ff7a4a"], delay: 0.05 },
    { at: [-4.5, -1.2, -2], n: 650, speed: 5.0, colors: ["#6ad1ff", "#bfefff"], delay: 0.7 },
    { at: [4.8, -0.6, -2], n: 650, speed: 5.0, colors: ["#ff6ad5", "#ffd1f2"], delay: 1.1 },
    { at: [0.4, 2.4, -3], n: 800, speed: 6.0, colors: ["#9dff7a", "#fff6a0"], delay: 1.6 },
  ];

  let progress = 0;
  let shown = 0;
  let running = false;
  let raf = 0;
  let fired = false;
  let burstT = -1;
  let shellsDone = 0;
  let lastPass = -2;
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    shown += (progress - shown) * (1 - Math.exp(-dt * 5));
    const p = shown;

    // launch once
    if (p >= FIRE_AT && !fired) {
      fired = true;
      hooks.onFire?.();
    }
    if (p < FIRE_AT - 0.01) fired = false;

    // the climb: a quick lift off the rack, then steadily up through the years
    const f = clamp01((p - FIRE_AT) / (FLIGHT_END - FIRE_AT));
    const lift = clamp01((p - FIRE_AT) / 0.03);
    const y = p < FIRE_AT ? 0.15 : 0.15 + lift * lift * 1.2 + f * (END_Y - 1.35);
    const flying = p >= FIRE_AT && p < FLIGHT_END;
    const tremble = flying ? 1 : 0;
    rocket.group.position.set((Math.sin(t * 7.3) * 0.03 + Math.sin(t * 2.1) * 0.05) * tremble, y, 0);
    rocket.group.rotation.set(Math.sin(t * 9.7) * 0.02 * tremble, 0, Math.sin(t * 11.3) * 0.04 * tremble);
    rocket.group.visible = p < FLIGHT_END + 0.002;
    rocket.nozzle.getWorldPosition(tmp);
    jet.object.position.copy(tmp);
    jet.update(dt, flying ? 1 : 0);
    // the fuse fizzes on the rack before launch
    fuse.object.position.set(0.05, -0.6, 0.14);
    fuse.update(dt, p < FIRE_AT && p > 0.005 ? 1 : 0);
    rocketLight.position.copy(tmp);
    rocketLight.intensity = flying ? 26 + Math.sin(t * 31) * 5 : p < FIRE_AT ? 4 + Math.random() * 3 : 0;
    for (let i = TRAIL - 1; i > 0; i--) {
      trailPos[i * 3] = trailPos[(i - 1) * 3]! + (Math.random() - 0.5) * 0.015;
      trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1]! - 0.01;
      trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2]!;
    }
    trailPos[0] = tmp.x;
    trailPos[1] = tmp.y;
    trailPos[2] = tmp.z;
    trailGeo.getAttribute("position").needsUpdate = true;
    trail.visible = flying;

    // the sky darkens as it climbs
    sky.copy(skyLow).lerp(skyHigh, Math.min(1, f * 1.4));
    (scene.fog as THREE.Fog).color.copy(sky);

    // the photographs light up as the rocket passes
    let pass = -1;
    frames.forEach((fr, i) => {
      const d = y - eventY(i);
      if (d >= -0.3) pass = i;
      const glow = Math.exp(-(d * d) / 4);
      fr.photoMat.emissiveIntensity = 0.1 + glow * 0.55;
      fr.group.scale.setScalar(1 + glow * 0.15);
    });
    if (pass !== lastPass) {
      if (pass > lastPass) hooks.onPass?.(pass);
      lastPass = pass;
    }

    // the burst runs in real time from the moment it is reached, so it plays out even if the page stops
    if (p >= FLIGHT_END && burstT < 0) {
      burstT = 0;
      shellsDone = 0;
      hooks.onBurst?.();
    }
    if (p < FLIGHT_END - 0.01 && burstT >= 0) {
      burstT = -1;
      stars.reset();
    }
    if (burstT >= 0) {
      burstT += dt;
      while (shellsDone < SHELLS.length && burstT >= SHELLS[shellsDone]!.delay) {
        const s = SHELLS[shellsDone]!;
        tmp.set(s.at[0]!, s.at[1]!, s.at[2]!).add(BURST_AT);
        stars.burst(tmp, s.n, s.speed, s.colors, 2.6);
        shellsDone++;
      }
      // keep the sky celebrating while the reader stays here
      if (shellsDone === SHELLS.length && burstT > 3.2) {
        burstT = 0.6;
        shellsDone = 2;
      }
    }
    stars.update(dt);
    burstLight.position.copy(BURST_AT);
    burstLight.intensity = burstT >= 0 && burstT < 1.2 ? 900 * Math.exp(-burstT * 3) : 0;

    // camera: low by the rack, then rising with the rocket, which stays low in the frame
    const rise = clamp01((p - FIRE_AT) / 0.05);
    const follow = Math.min(y, END_Y - 1.35);
    const end = clamp01((p - FLIGHT_END) / 0.03);
    camTarget.set(0, THREE.MathUtils.lerp(2.0, follow + 2.1, rise), 0);
    camTarget.y = THREE.MathUtils.lerp(camTarget.y, BURST_AT.y, end);
    const shake = flying ? 0.025 : 0;
    camera.position.set(
      Math.sin(t * 23) * shake + Math.sin(t * 13.7) * shake * 0.6,
      camTarget.y + 0.25 + Math.sin(t * 19) * shake,
      THREE.MathUtils.lerp(6.5, 9.2, rise) + end * 5,
    );
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  };

  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    frame();
  };
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 62 : 40;
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
      scene.traverse((o) => {
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
