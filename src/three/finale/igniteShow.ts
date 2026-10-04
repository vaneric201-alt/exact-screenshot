import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createFire } from "../stage/fire";
import { canvasTex, pbr } from "../stage/textures";
import { buildRocket, createStars } from "./lanceShow";

/*
 * The last scene: a night courtyard below the palace roofs. The camera closes
 * in on a person holding a glowing incense stick to the fuse of a firework
 * rocket; the fuse fizzes, the person steps back and looks up, the rocket
 * climbs, and it bursts high over the roofs — and the sky keeps on bursting
 * while the page says thank you.
 *
 * p (0–1) is scroll progress; the bursts run in real time once reached.
 */

export const IG = {
  /** The stick reaches the fuse. */
  light: 0.3,
  /** The rocket leaves the ground. */
  launch: 0.44,
  /** It bursts. */
  burst: 0.6,
};

export interface IgniteShow {
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
}

export interface IgniteHooks {
  onLight?(): void;
  onLaunch?(): void;
  onBurst?(): void;
  /** Each later shell in the celebration. */
  onShell?(big: boolean): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** A person in a dark padded jacket, built from simple rounded parts with joints that can be posed. */
function buildPerson() {
  const cloth = pbr({ color: "#2a2430", roughness: 0.85 });
  const cloth2 = pbr({ color: "#3a1f1c", roughness: 0.8 });
  const skin = pbr({ color: "#c79a78", roughness: 0.6 });
  const hair = pbr({ color: "#121014", roughness: 0.7 });
  const shoe = pbr({ color: "#141214", roughness: 0.6 });
  const cap = (r: number, l: number, m: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m);
    mesh.castShadow = true;
    return mesh;
  };
  const joint = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  const root = new THREE.Group();
  const hips = joint(root, 0, 0.92, 0);
  const pelvis = cap(0.15, 0.12, cloth2);
  pelvis.rotation.z = Math.PI / 2;
  hips.add(pelvis);
  const spine = joint(hips, 0, 0.06, 0);
  const torso = cap(0.19, 0.36, cloth);
  torso.position.y = 0.3;
  torso.scale.set(1, 1, 0.75);
  spine.add(torso);
  // jacket hem and collar
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.16, 20), cloth);
  hem.position.y = 0.06;
  hem.scale.z = 0.8;
  spine.add(hem);
  const neck = joint(spine, 0, 0.62, 0);
  const headG = joint(neck, 0, 0.12, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 18), skin);
  head.scale.set(0.95, 1.08, 1);
  head.castShadow = true;
  headG.add(head);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.122, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairM.position.set(-0.01, 0.02, 0);
  hairM.rotation.z = 0.25;
  headG.add(hairM);
  const limbs = (side: 1 | -1) => {
    const shoulder = joint(spine, 0, 0.52, side * 0.24);
    const upper = cap(0.06, 0.24, cloth);
    upper.position.y = -0.16;
    shoulder.add(upper);
    const elbow = joint(shoulder, 0, -0.33, 0);
    const fore = cap(0.05, 0.22, cloth);
    fore.position.y = -0.14;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), skin);
    hand.position.y = -0.3;
    elbow.add(hand);
    const hip = joint(hips, 0, -0.02, side * 0.1);
    const thigh = cap(0.08, 0.32, cloth2);
    thigh.position.y = -0.22;
    hip.add(thigh);
    const knee = joint(hip, 0, -0.44, 0);
    const shin = cap(0.065, 0.32, cloth2);
    shin.position.y = -0.2;
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.1), shoe);
    foot.position.set(0.06, -0.43, 0);
    foot.castShadow = true;
    knee.add(foot);
    return { shoulder, elbow, hip, knee, hand };
  };
  const R = limbs(1);
  const L = limbs(-1);
  // the incense stick in the right hand, its tip glowing
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 6), pbr({ color: "#6a3a1e", roughness: 0.8 }));
  const stickPivot = joint(R.elbow, 0, -0.3, 0);
  stick.position.set(0, -0.36, 0);
  stickPivot.add(stick);
  const tip = new THREE.Object3D();
  tip.position.set(0, -0.8, 0);
  stickPivot.add(tip);
  return { root, hips, spine, neck: headG, R, L, stickPivot, tip };
}

/** The palace roofs against the night sky, with a few lit lanterns. */
function skylineTex() {
  return canvasTex(2048, 512, (ctx, w, h, r) => {
    ctx.clearRect(0, 0, w, h);
    const roof = (cx: number, base: number, half: number, rise: number, tiers: number) => {
      ctx.fillStyle = "#07080f";
      for (let t = 0; t < tiers; t++) {
        const y0 = base - t * rise * 0.9;
        const hw = half * (1 - t * 0.28);
        ctx.beginPath();
        ctx.moveTo(cx - hw * 1.12, y0 - rise * 0.12);
        ctx.quadraticCurveTo(cx - hw * 0.9, y0 - rise * 0.05, cx - hw * 0.62, y0 - rise * 0.7);
        ctx.lineTo(cx + hw * 0.62, y0 - rise * 0.7);
        ctx.quadraticCurveTo(cx + hw * 0.9, y0 - rise * 0.05, cx + hw * 1.12, y0 - rise * 0.12);
        ctx.lineTo(cx + hw, y0);
        ctx.lineTo(cx - hw, y0);
        ctx.fill();
        ctx.fillRect(cx - hw * 0.8, y0, hw * 1.6, rise * 0.8);
      }
      // lanterns under the eaves
      for (let k = -2; k <= 2; k++) {
        const x = cx + k * half * 0.35;
        const g = ctx.createRadialGradient(x, base + 10, 0, x, base + 10, 16);
        g.addColorStop(0, "rgba(255,120,60,0.95)");
        g.addColorStop(1, "rgba(255,80,40,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 16, base - 6, 32, 32);
      }
    };
    roof(w * 0.5, h * 0.62, w * 0.16, h * 0.22, 2);
    roof(w * 0.16, h * 0.74, w * 0.09, h * 0.16, 1);
    roof(w * 0.84, h * 0.74, w * 0.09, h * 0.16, 1);
    roof(w * 0.32, h * 0.8, w * 0.06, h * 0.12, 1);
    roof(w * 0.68, h * 0.8, w * 0.06, h * 0.12, 1);
    // the wall in front of them
    ctx.fillStyle = "#07080f";
    ctx.fillRect(0, h * 0.86, w, h * 0.14);
    for (let k = 0; k < 40; k++) {
      ctx.fillStyle = `rgba(255,${120 + r() * 60},60,${0.3 + r() * 0.4})`;
      ctx.fillRect(r() * w, h * (0.87 + r() * 0.05), 2, 2);
    }
  });
}

export function createIgniteShow(canvas: HTMLCanvasElement, hooks: IgniteHooks = {}): IgniteShow {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = canvasTex(1024, 512, (ctx, w, h, r) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#03040b");
    g.addColorStop(0.65, "#0c1230");
    g.addColorStop(1, "#1e1a36");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.7})`;
      ctx.fillRect(r() * w, r() * h * 0.7, r() < 0.93 ? 1 : 2, 1);
    }
  });
  scene.fog = new THREE.Fog("#0c1230", 30, 140);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.12;
  scene.add(new THREE.HemisphereLight("#6f7fb8", "#1a120c", 0.45));
  const moon = new THREE.DirectionalLight("#9fb0e8", 0.5);
  moon.position.set(-6, 10, 4);
  scene.add(moon);

  // ground: worn stone paving
  const paving = canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#3a3a40";
      ctx.fillRect(0, 0, w, h);
      const n = 8;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const v = 50 + r() * 22;
          ctx.fillStyle = `rgb(${v},${v},${v + 6})`;
          ctx.fillRect((x * w) / n + 3, (y * h) / n + 3, w / n - 6, h / n - 6);
        }
    },
    77,
    true,
    { normal: 2, rough: [0.7, 0.95] },
  );
  paving.repeat.set(14, 14);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: paving, normalMap: paving.userData["normalMap"] as THREE.Texture, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const skyline = new THREE.Mesh(new THREE.PlaneGeometry(220, 55), new THREE.MeshBasicMaterial({ map: skylineTex(), transparent: true, fog: false }));
  skyline.position.set(0, 20, -70);
  scene.add(skyline);

  // the person and the rocket on its rack
  const person = buildPerson();
  person.root.position.set(-0.9, 0, 0.25);
  person.root.rotation.y = -0.15;
  scene.add(person.root);
  const rocket = buildRocket();
  rocket.group.scale.setScalar(1.3);
  const ROCKET_Y = 1.45;
  rocket.group.position.set(0.35, ROCKET_Y, 0);
  scene.add(rocket.group);
  const rackMat = pbr({ color: "#4a2a18", roughness: 0.8 });
  for (const x of [0.2, 0.62]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 0.04), rackMat);
    leg.position.set(x, 0.75, -0.1);
    leg.castShadow = true;
    scene.add(leg);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), rackMat);
  bar.position.set(0.41, 1.1, -0.1);
  scene.add(bar);
  // the fuse: a short twisted paper tail from the rocket's base
  const fusePt = new THREE.Vector3(0.3, ROCKET_Y - 0.55, 0.12);
  const fuseCord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), pbr({ color: "#d9c39a", roughness: 0.9 }));
  fuseCord.position.copy(fusePt).add(new THREE.Vector3(0.02, 0.08, 0));
  fuseCord.rotation.z = 0.3;
  scene.add(fuseCord);

  // lights: the stick's glowing tip, the fuse's sparks, the rocket's jet, the bursts
  const glowSprite = canvasTex(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,240,210,1)");
    g.addColorStop(0.3, "rgba(255,150,70,0.7)");
    g.addColorStop(1, "rgba(255,90,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const tipGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  tipGlow.scale.setScalar(0.09);
  scene.add(tipGlow);
  const tipLight = new THREE.PointLight("#ff9a50", 1.2, 3, 1.6);
  scene.add(tipLight);
  const fuseFire = createFire(140, 0.015, 0.09);
  fuseFire.setJet(new THREE.Vector3(0.2, 1, 0.3), 1.4);
  scene.add(fuseFire.object);
  const fuseLight = new THREE.PointLight("#ffb060", 0, 6, 1.4);
  fuseLight.castShadow = true;
  fuseLight.shadow.mapSize.set(1024, 1024);
  scene.add(fuseLight);
  const jet = createFire(420, 0.04, 0.32);
  jet.setJet(new THREE.Vector3(0, -1, 0), 3.4);
  scene.add(jet.object);
  const jetLight = new THREE.PointLight("#ffb050", 0, 14, 1.4);
  scene.add(jetLight);
  const dot = canvasTex(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,240,210,0.7)");
    g.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const TRAIL = 120;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 0.14, map: dot, color: "#ffc070", transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  trail.frustumCulled = false;
  scene.add(trail);
  const stars = createStars(9000, dot);
  stars.points.material.size = 0.42;
  scene.add(stars.points);
  const burstLight = new THREE.PointLight("#ffd080", 0, 90, 1.1);
  scene.add(burstLight);
  const BURST_Y = 30;
  const PALETTES = [
    ["#ffd36a", "#ffb03a", "#fff1c2"],
    ["#ff4d3a", "#ff8a5a"],
    ["#6ad1ff", "#bfefff"],
    ["#ff6ad5", "#ffd1f2"],
    ["#9dff7a", "#fff6a0"],
    ["#ffffff", "#ffe8b0"],
  ];

  // posing: lean in, reach out with the stick, then step back and look up at the sky
  let stickAngle = 0.25;
  let rootX = -0.9;
  let rootZ = 0.25;
  const pose = (reach: number, back: number, look: number, t: number) => {
    person.root.position.set(rootX - back * 0.8, 0, rootZ);
    person.hips.position.y = 0.92 - reach * 0.12 * (1 - back);
    person.spine.rotation.z = -reach * 0.42 * (1 - back) + look * 0.12;
    person.spine.rotation.x = Math.sin(t * 1.4) * 0.015;
    person.R.shoulder.rotation.z = reach * 0.9 * (1 - back) + back * 0.2;
    person.R.elbow.rotation.z = reach * 0.3 * (1 - back);
    person.stickPivot.rotation.z = reach * stickAngle;
    person.L.shoulder.rotation.z = -0.15 - back * 0.6;
    person.L.elbow.rotation.z = back * 1.2;
    person.R.hip.rotation.z = reach * 0.25 * (1 - back);
    person.R.knee.rotation.z = -reach * 0.5 * (1 - back);
    person.L.hip.rotation.z = -reach * 0.15 * (1 - back) - back * 0.15;
    person.neck.rotation.z = -reach * 0.25 * (1 - back) + look * 0.75;
  };
  // find the stick angle and standing place that put the glowing tip on the fuse at full reach
  {
    const tw = new THREE.Vector3();
    const bestTip = new THREE.Vector3();
    let best = Infinity;
    let bestA = 0.25;
    for (let a = -0.8; a <= 1.4; a += 0.02) {
      stickAngle = a;
      pose(1, 0, 0, 0);
      person.root.updateMatrixWorld(true);
      person.tip.getWorldPosition(tw);
      const d = Math.abs(tw.y - fusePt.y);
      if (d < best) {
        best = d;
        bestA = a;
        bestTip.copy(tw);
      }
    }
    stickAngle = bestA;
    rootX += fusePt.x - bestTip.x - 0.01;
    rootZ += fusePt.z - bestTip.z;
  }

  let progress = 0;
  let shown = 0;
  let running = false;
  let raf = 0;
  let lit = false;
  let launched = false;
  let burstT = -1;
  let nextShell = 0;
  let shellN = 0;
  const clock = new THREE.Clock();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
  const tmp = new THREE.Vector3();
  const tipW = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  const shell = (big: boolean) => {
    const pal = PALETTES[shellN % PALETTES.length]!;
    shellN++;
    if (big) tmp.set(0.35, BURST_Y, 0);
    else tmp.set((Math.random() - 0.5) * 34, BURST_Y - 4 + Math.random() * 12, -6 - Math.random() * 14);
    stars.burst(tmp, big ? 2600 : 900, big ? 13 : 8 + Math.random() * 3, pal, big ? 3.2 : 2.6);
    hooks.onShell?.(big);
  };

  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    shown += (progress - shown) * (1 - Math.exp(-dt * 5));
    const p = shown;

    // ---- the person: reaches the stick to the fuse, then steps back and looks up
    const reach = smooth((p - 0.16) / (IG.light - 0.16));
    const back = smooth((p - (IG.launch - 0.06)) / 0.07);
    const look = smooth((p - IG.launch) / 0.1);
    pose(reach, back, look, t);
    person.tip.getWorldPosition(tipW);
    tipGlow.position.copy(tipW);
    tipLight.position.copy(tipW);
    const glowOn = p < IG.launch + 0.1 ? 1 : 0.4;
    tipLight.intensity = (0.8 + Math.sin(t * 9) * 0.15) * glowOn;
    (tipGlow.material as THREE.SpriteMaterial).opacity = 0.9 * glowOn;

    // ---- the fuse catches, fizzes, and the rocket goes
    if (p >= IG.light && !lit) {
      lit = true;
      hooks.onLight?.();
    }
    if (p < IG.light - 0.01) lit = false;
    const fizzing = p >= IG.light && p < IG.launch;
    fuseFire.object.position.copy(fusePt);
    fuseFire.update(dt, fizzing ? 1 : 0);
    fuseLight.position.copy(fusePt).add(new THREE.Vector3(0.1, 0.2, 0.3));
    fuseLight.intensity = fizzing ? 5 + Math.random() * 3 : 0;
    if (p >= IG.launch && !launched) {
      launched = true;
      hooks.onLaunch?.();
    }
    if (p < IG.launch - 0.01) launched = false;
    const fly = clamp01((p - IG.launch) / (IG.burst - IG.launch));
    const ry = ROCKET_Y + fly * fly * (BURST_Y - ROCKET_Y);
    const flying = p >= IG.launch && p < IG.burst;
    rocket.group.position.set(0.35 + Math.sin(t * 7) * 0.03 * (flying ? 1 : 0), ry, 0);
    rocket.group.rotation.z = flying ? Math.sin(t * 11) * 0.03 : 0;
    rocket.group.visible = p < IG.burst + 0.002;
    rocket.nozzle.getWorldPosition(tmp);
    jet.object.position.copy(tmp);
    jet.update(dt, flying ? 1 : 0);
    jetLight.position.copy(tmp);
    jetLight.intensity = flying ? 30 + Math.sin(t * 29) * 6 : 0;
    trailPos.copyWithin(3, 0, (TRAIL - 1) * 3);
    trailPos[0] = tmp.x + (Math.random() - 0.5) * 0.02;
    trailPos[1] = tmp.y;
    trailPos[2] = tmp.z;
    trailGeo.getAttribute("position").needsUpdate = true;
    trail.visible = flying;

    // ---- the burst, then the sky keeps celebrating while the reader stays
    if (p >= IG.burst && burstT < 0) {
      burstT = 0;
      nextShell = 0.9;
      shell(true);
      hooks.onBurst?.();
    }
    if (p < IG.burst - 0.01 && burstT >= 0) {
      burstT = -1;
      stars.reset();
    }
    if (burstT >= 0) {
      burstT += dt;
      if (burstT >= nextShell) {
        shell(false);
        nextShell = burstT + 0.45 + Math.random() * 0.6;
      }
    }
    stars.update(dt);
    burstLight.position.set(0, BURST_Y, 4);
    burstLight.intensity = burstT >= 0 && burstT < 1.4 ? 4000 * Math.exp(-burstT * 2.5) : 0;

    // ---- camera: from a wide courtyard in close on the hands and the fuse, then up to the sky
    const zoom = smooth(p / IG.light);
    const up = smooth((p - IG.launch) / (IG.burst - IG.launch + 0.06));
    camPos.set(THREE.MathUtils.lerp(1.5, 0.4, zoom), THREE.MathUtils.lerp(2.6, 1.15, zoom), THREE.MathUtils.lerp(11, 3.1, zoom));
    camLook.set(THREE.MathUtils.lerp(0, -0.1, zoom), THREE.MathUtils.lerp(1.6, 1.0, zoom), 0);
    // follow the rocket upward, pulling back to take in the whole sky
    camPos.lerp(new THREE.Vector3(0.2, 3, 22), up);
    camLook.lerp(new THREE.Vector3(0.3, Math.min(ry, BURST_Y) * 0.85 + 2, 0), Math.min(1, up * 1.4));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
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
