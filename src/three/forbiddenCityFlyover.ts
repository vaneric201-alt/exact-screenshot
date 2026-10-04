import * as THREE from "three";
import { SUNSET, duskSkyMaterial, westernHills } from "./fc/duskSky";
import {
  BloomEffect,
  BrightnessContrastEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { N8AOPostPass } from "n8ao";
import { createTextures } from "./fc/textures";
import { buildCity } from "./fc/layout";
import type { Mats } from "./fc/builders";
import { createGoldenDragon, createScaleTextures, type GoldenDragon } from "./fc/dragon3d";
import { sideCoil, sideFace, skyGlide } from "./fc/dragonPaths";
import { SHOTS, shotAt } from "./fc/shots";
import { buildLanterns } from "./fc/lanterns";
import { realSupremeHall } from "./fc/supremeHall";


/** Where the detailed hall stands: its own platform sunk into the great terrace (top 8.1 m), centred over the old footprint. */
const SUPREME_Y = 0.3;
const SUPREME_Z = 44;
/*
 * A drone flight over the Forbidden City along its south–north axis:
 * low in front of the Meridian Gate, in through its opening central doors, across the Golden Water
 * courtyard, the Gate and Hall of Supreme Harmony, the Inner Court and the
 * Imperial Garden, then up and round to the classic view from Jingshan.
 *
 * API: createForbiddenCityFlyover(canvas, opts) →
 *   { start, stop, intro, setProgress, setPointer, resize, dispose, onFps }
 */

export interface FlyoverOptions {
  quality?: "high" | "medium" | "low";
  shadows?: boolean;
  maxPixelRatio?: number;
  /** Morning haze colour that the city dissolves into at distance. */
  hazeColor?: string;
  onFrame?: (fps: number) => void;
  /** Called while the Meridian Gate's doors are swinging (0 = shut, 1 = open). */
  onGate?: (open: number) => void;
}

export interface Flyover {
  start(): void;
  stop(): void;
  intro(duration?: number): Promise<void>;
  setProgress(p: number): void;
  /** 1 shows the bird's-eye view used on the loading screen; intro() swoops down from it. */
  setAerial(a: number): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  setQuality(q: "high" | "medium" | "low"): void;
  /** Render one still frame at progress p (reduced motion, thumbnails, tests). */
  renderFrame(p?: number): void;
  dispose(): void;
  /** Internals for development tools. */
  debug: { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; composer: EffectComposer; bloom: BloomEffect };
}

export function createForbiddenCityFlyover(canvas: HTMLCanvasElement, opts: FlyoverOptions = {}): Flyover {
  let quality = opts.quality ?? "high";
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
  });
  const maxDpr = () => Math.min(window.devicePixelRatio, opts.maxPixelRatio ?? (quality === "high" ? 1.5 : 1));
  renderer.setPixelRatio(maxDpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = opts.shadows ?? true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // warm sunset haze; denser at ground level so the far city never shows its seams
  const haze = new THREE.Color(opts.hazeColor ?? "#d9a08e");
  const baseFog = 0.0011;
  scene.fog = new THREE.FogExp2(haze.getHex(), baseFog);

  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.5, 9000);

  // ---------------- sky & sun: blue hour ----------------
  // A low sun in the west-south-west, just before it sets; the sky is a deep
  // blue with a warm afterglow, the Western Hills stand dark on the horizon.
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 11), THREE.MathUtils.degToRad(300));
  const sky = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), duskSkyMaterial(sunDir, SUNSET, false, 1));
  sky.frustumCulled = false;
  scene.add(sky);
  scene.add(westernHills(4300));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), duskSkyMaterial(sunDir, SUNSET, false, 1)));
  const env = pmrem.fromScene(envScene, 0.02).texture;
  scene.environment = env;
  scene.environmentIntensity = 1.25;

  const sun = new THREE.DirectionalLight("#ffc488", 4.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality === "high" ? 4096 : 2048, quality === "high" ? 4096 : 2048);
  const sc = sun.shadow.camera;
  sc.left = -260;
  sc.right = 260;
  sc.top = 260;
  sc.bottom = -260;
  sc.near = 10;
  sc.far = 2400;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight("#c9b2e6", "#8a6448", 1.75);
  scene.add(hemi);

  // ---------------- materials ----------------
  const tex = createTextures(renderer.capabilities.getMaxAnisotropy());
  const macroScale = 1 / 220;
  const withMacro = <T extends THREE.MeshStandardMaterial>(m: T, strength = 0.35, grime = 0) => {
    m.onBeforeCompile = (shader) => {
      shader.uniforms["uMacro"] = { value: tex.macro };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vMacroUv;")
        .replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvec4 mwp = modelMatrix * vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nmwp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);\n#endif\nvMacroUv = mwp.xz * " +
            macroScale.toFixed(6) +
            ";",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vMacroUv;\nuniform sampler2D uMacro;")
        .replace(
          "#include <map_fragment>",
          "#include <map_fragment>\nfloat macroV = texture2D(uMacro, vMacroUv).r;\ndiffuseColor.rgb *= mix(1.0, macroV * 1.7, " +
            strength.toFixed(2) +
            ");\n" +
            // rain splash & dirt darken the foot of every wall
            (grime > 0 ? "diffuseColor.rgb *= 1.0 - " + grime.toFixed(2) + " * (1.0 - smoothstep(0.0, 2.2, vGrimeY));" : ""),
        );
      if (grime > 0) {
        shader.vertexShader = shader.vertexShader
          .replace("varying vec2 vMacroUv;", "varying vec2 vMacroUv;\nvarying float vGrimeY;")
          .replace("vMacroUv = mwp.xz", "vGrimeY = mwp.y;\nvMacroUv = mwp.xz");
        shader.fragmentShader = shader.fragmentShader.replace("varying vec2 vMacroUv;", "varying vec2 vMacroUv;\nvarying float vGrimeY;");
      }
    };
    m.customProgramCacheKey = () => "macro" + strength + "g" + grime;
    return m;
  };

  const M: Mats = {
    roof: new THREE.MeshPhysicalMaterial({
      map: tex.roofColor,
      normalMap: tex.roofNormal,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: tex.roofRough,
      roughness: 1,
      clearcoat: 0.45,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.1,
    }),
    ridge: new THREE.MeshStandardMaterial({ color: "#c38a1d", roughness: 0.38, envMapIntensity: 1.1 }),
    soffit: new THREE.MeshStandardMaterial({ map: tex.soffit, roughness: 0.85 }),
    plaster: withMacro(
      new THREE.MeshStandardMaterial({ map: tex.plaster, normalMap: tex.plasterNormal, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.93 }),
      0.18,
      0.35,
    ),
    gableWall: new THREE.MeshStandardMaterial({ color: "#86281f", roughness: 0.9 }),
    lacquer: new THREE.MeshStandardMaterial({ map: tex.lacquer, roughness: 0.42, envMapIntensity: 0.9 }),
    marble: withMacro(new THREE.MeshStandardMaterial({ map: tex.marble, roughness: 0.62 }), 0.15),
    paving: withMacro(
      new THREE.MeshStandardMaterial({ map: tex.bricks, normalMap: tex.bricksNormal, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.92 }),
      0.45,
    ),
    imperialWay: withMacro(new THREE.MeshStandardMaterial({ map: tex.marble, roughness: 0.7, color: "#d8d2c4" }), 0.25),
    beam: new THREE.MeshStandardMaterial({ map: tex.beam, roughness: 0.72 }),
    door: new THREE.MeshStandardMaterial({ map: tex.door, roughness: 0.58 }),
    gold: new THREE.MeshStandardMaterial({ color: "#d9a441", metalness: 1, roughness: 0.28 }),
    arch: new THREE.MeshStandardMaterial({ color: "#15110e", roughness: 1 }),
    water: new THREE.MeshStandardMaterial({
      color: "#33443f",
      roughness: 0.06,
      metalness: 0.15,
      normalMap: tex.waterNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
      envMapIntensity: 1.35,
    }),
    greyRoof: withMacro(new THREE.MeshStandardMaterial({ map: tex.greyTile, roughness: 0.86 }), 0.3),
    greyWall: withMacro(new THREE.MeshStandardMaterial({ color: "#9a948a", roughness: 0.95 }), 0.3),
    ground: withMacro(new THREE.MeshStandardMaterial({ color: "#8b8573", roughness: 1 }), 0.55),
    greenRoof: new THREE.MeshStandardMaterial({ color: "#4f7a55", roughness: 0.4 }),
  };
  const foliage = withMacro(new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, vertexColors: true }), 0.2);
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#4a3a2c", roughness: 1 });

  // ---------------- the city ----------------
  const city = buildCity(M, foliage, trunkMat);
  scene.add(city.staticRoot);
  city.instanced.forEach((m) => scene.add(m));
  city.water.forEach((w) => scene.add(w));
  scene.add(city.gate.group);
  scene.add(city.supreme);
  // the detailed Hall of Supreme Harmony replaces the hand-built one once it has loaded
  realSupremeHall()
    .then((h) => {
      h.rotation.y = -Math.PI / 2; // its front (+x) to the south (+z)
      h.position.set(0, SUPREME_Y, SUPREME_Z);
      scene.add(h);
      city.supreme.visible = false;
    })
    .catch(() => {});
  // red palace lanterns, lit at sunset
  const lanterns = buildLanterns();
  scene.add(lanterns.group);
  // the central doors of the Meridian Gate open as the camera comes down the way
  let gateOpen = -1;
  const openGate = (z: number) => {
    const k = 1 - THREE.MathUtils.smoothstep(z, 548, 640);
    if (Math.abs(k - gateOpen) < 1e-4) return;
    gateOpen = k;
    const angle = k * THREE.MathUtils.degToRad(96);
    for (const h of city.gate.hinges) h.rotation.y = (h.userData["open"] as number) * angle;
    opts.onGate?.(k);
  };

  // ---------------- golden dragons ----------------
  // Two coil at the sides of the frame at the start (they ride with the camera),
  // a third swims across the sky behind the palace at the end of the flight.
  const scales = createScaleTextures();
  const dragonGold = new THREE.MeshPhysicalMaterial({
    map: scales.color,
    color: "#ffd27a",
    normalMap: scales.normal,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: scales.rough,
    metalness: 0.8,
    roughness: 1,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.25,
  });
  const dragonSmooth = new THREE.MeshPhysicalMaterial({
    color: "#f0b64a",
    metalness: 0.8,
    roughness: 0.3,
    clearcoat: 0.3,
    envMapIntensity: 1.25,
  });
  scene.add(camera);
  // at blue hour the gold would only mirror the dark sky: two warm lamps
  // travel with the camera and light the dragons that frame the view
  for (const side of [-1, 1]) {
    const lamp = new THREE.PointLight("#ffc98a", 900, 70, 2);
    lamp.position.set(side * 14, 6, -26);
    camera.add(lamp);
  }
  const sideDragons: { d: GoldenDragon; wrap: THREE.Group; side: 1 | -1 }[] = ([1, -1] as const).map((side) => {
    const d = createGoldenDragon({ path: sideCoil(side), gold: dragonGold, goldRough: dragonSmooth, thickness: 1.5, headScale: 1.1, face: sideFace(side) });
    const wrap = new THREE.Group();
    wrap.add(d.group);
    camera.add(wrap);
    return { d, wrap, side };
  });
  // the sky dragon crosses the frame as the reader scrolls the last part of the flight
  const skyProgress = { value: 0 };
  const skyDragon = createGoldenDragon({
    path: skyGlide(new THREE.Vector3(0, 86, -500), 520, skyProgress),
    gold: dragonGold,
    goldRough: dragonSmooth,
    thickness: 3.2,
    headScale: 1.2,
    segments: 220,
  });
  scene.add(skyDragon.group);
  const placeDragons = (p: number, time: number) => {
    const aspect = camera.aspect;
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 42 * aspect;
    // during the bird's-eye loading view they draw back towards the edges
    const out = Math.max(THREE.MathUtils.smoothstep(p, 0.015, 0.09), aerial * 0.42);
    for (const s of sideDragons) {
      s.wrap.visible = out < 1;
      if (!s.wrap.visible) continue;
      // on narrower screens they shrink and tuck into the edges, clear of the title
      const k = THREE.MathUtils.clamp(aspect / 1.78, 0.5, 1);
      const inset = 9.5 * k;
      s.wrap.position.set(-s.side * (halfW - inset + out * 30), -1.5 - out * 6 + (1 - k) * 6, -42);
      s.wrap.rotation.set(0, s.side * 0.3, 0);
      s.wrap.scale.setScalar(k);
      s.d.update(time);
    }
    skyDragon.group.visible = p > 0.78 && aerial < 0.5;
    skyProgress.value = THREE.MathUtils.clamp((p - 0.78) / 0.22, 0, 1);
    if (skyDragon.group.visible) skyDragon.update(time);
  };

  // ---------------- birds ----------------
  const BIRDS = 26;
  const birdGeo = new THREE.BufferGeometry();
  birdGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0.25, -0.9, 0.12, -0.1, 0, 0, -0.25, 0, 0, 0.25, 0.9, 0.12, -0.1, 0, 0, -0.25], 3),
  );
  birdGeo.computeVertexNormals();
  const birds = new THREE.InstancedMesh(birdGeo, new THREE.MeshBasicMaterial({ color: "#2b2622", side: THREE.DoubleSide, fog: true }), BIRDS);
  const birdSeeds = Array.from({ length: BIRDS }, (_, i) => ({ a: i * 2.39996, r: 6 + (i % 7) * 2.2, h: (i % 5) * 1.6, ph: i * 0.7 }));
  scene.add(birds);

  // ---------------- post-processing ----------------
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));
  const ao = new N8AOPostPass(scene, camera, 1, 1);
  ao.configuration.aoRadius = 5;
  ao.configuration.distanceFalloff = 1.2;
  ao.configuration.intensity = 2.6;
  ao.configuration.gammaCorrection = false;
  ao.setQualityMode(quality === "high" ? "Medium" : "Low");
  if (quality !== "high") ao.configuration.halfRes = true;
  composer.addPass(ao);
  const bloom = new BloomEffect({ intensity: 0.32, luminanceThreshold: 0.82, luminanceSmoothing: 0.2, mipmapBlur: true });
  const effects = new EffectPass(
    camera,
    new SMAAEffect(),
    bloom,
    new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
    new HueSaturationEffect({ saturation: -0.04 }),
    new BrightnessContrastEffect({ contrast: 0.08, brightness: 0.0 }),
    new VignetteEffect({ darkness: 0.42, offset: 0.28 }),
  );
  composer.addPass(effects);

  // ---------------- camera path ----------------
  let progress = 0;
  let shown = 0;
  /** 1 = bird's-eye view of the whole palace (loading screen), 0 = on the flight path. */
  let aerial = 0;
  const aerialPos = new THREE.Vector3(-120, 820, 760);
  const aerialLook = new THREE.Vector3(0, 0, -40);
  const pointer = new THREE.Vector2();
  const pointerSm = new THREE.Vector2();
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const tmpAhead = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  const shotPos = (p: number) => {
    const { i, t } = shotAt(p);
    const sh = SHOTS[i]!;
    // slow in, slow out within each shot, like a dolly on rails
    const e = t * t * (3 - 2 * t) * 0.7 + t * 0.3;
    tmpPos.fromArray(sh.pos[0]).lerp(tmpAhead.fromArray(sh.pos[1]), e);
    tmpLook.fromArray(sh.look[0]).lerp(tmpAhead.fromArray(sh.look[1]), e);
  };
  const place = (t: number, time: number) => {
    const p = THREE.MathUtils.clamp(t, 0, 1);
    shotPos(p);
    if (aerial > 0) {
      const a = aerial * aerial * (3 - 2 * aerial);
      // slow orbit while waiting on the loading screen
      const orbit = time * 0.03;
      const ax = aerialPos.x * Math.cos(orbit) - aerialPos.z * Math.sin(orbit) * 0.25;
      // portrait screens pull further back so the whole walled city fits
      const back = THREE.MathUtils.clamp(0.9 / camera.aspect, 1, 1.5);
      tmpAhead.set(ax, aerialPos.y, aerialPos.z).sub(aerialLook).multiplyScalar(back).add(aerialLook);
      tmpPos.lerp(tmpAhead, a);
      tmpLook.lerp(aerialLook, a);
    }
    // a steady hand-held drift
    tmpPos.x += Math.sin(time * 0.7) * 0.12;
    tmpPos.y += Math.sin(time * 1.1) * 0.06;
    camera.position.copy(tmpPos);
    openGate(aerial > 0.5 ? 9999 : tmpPos.z);
    // pointer: the view leans a little toward the mouse
    tmpLook.x += pointerSm.x * 18;
    tmpLook.y += pointerSm.y * 9;
    camera.up.copy(up);
    camera.lookAt(tmpLook);
    // the textbook slides cover the left of the screen: on wide screens the
    // picture shifts right so each building stands in the open part
    const vw = canvas.clientWidth || 1;
    const vh = canvas.clientHeight || 1;
    const shift = vw > 900 ? vw * 0.17 * (1 - aerial) * THREE.MathUtils.smoothstep(p, 0.05, 0.09) : 0;
    if (shift > 0.5) camera.setViewOffset(vw, vh, -shift, 0, vw, vh);
    else camera.clearViewOffset();
  };

  // shadow camera follows what the camera looks at, snapped to shadow texels
  const focus = new THREE.Vector3();
  const updateSun = () => {
    focus.copy(camera.position).lerp(tmpLook, 0.55);
    focus.y = 0;
    const size = (sc.right - sc.left) / sun.shadow.mapSize.x;
    focus.x = Math.round(focus.x / size) * size;
    focus.z = Math.round(focus.z / size) * size;
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sunDir, 1200);
    sun.target.updateMatrixWorld();
  };

  // ---------------- loop ----------------
  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;
  let fogIntro = 0;
  // the bird's-eye view looks down through clear air so the plan reads
  const fogDensity = (altitude: number) => baseFog * (1 + (altitude / 900) * (1 - aerial)) * (1 - 0.5 * aerial);
  let frames = 0;
  let fpsT = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    shown += (progress - shown) * (1 - Math.exp(-dt * 5));
    pointerSm.lerp(pointer, 1 - Math.exp(-dt * 3));
    place(shown, time);
    placeDragons(shown, time);
    updateSun();
    lanterns.update(camera.position, time, 1 - aerial);
    // fog: thick paper-coloured haze during the intro, then clear morning air;
    // a little thicker high up so the far city melts into the horizon
    const altitude = camera.position.y;
    (scene.fog as THREE.FogExp2).density = fogDensity(altitude) + fogIntro;
    // water drift
    tex.waterNormal.offset.set(time * 0.004, time * 0.0025);
    // birds circle over the square
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < BIRDS; i++) {
      const s = birdSeeds[i]!;
      const a = s.a + time * 0.18;
      const bx = Math.cos(a) * (40 + s.r) + 10;
      const bz = 180 + Math.sin(a) * (30 + s.r);
      const by = 46 + s.h + Math.sin(time * 1.1 + s.ph) * 1.2;
      q.setFromAxisAngle(up, -a);
      const flap = 0.6 + Math.abs(Math.sin(time * 9 + s.ph)) * 0.8;
      m.compose(tmpAhead.set(bx, by, bz), q, new THREE.Vector3(1.1, flap, 1.1));
      birds.setMatrixAt(i, m);
    }
    birds.instanceMatrix.needsUpdate = true;
    composer.render(dt);
    frames++;
    fpsT += dt;
    if (fpsT > 1) {
      opts.onFrame?.(frames / fpsT);
      frames = 0;
      fpsT = 0;
    }
  };

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    // keep the gate wide enough on tall phone screens
    camera.fov = w / h < 1 ? 62 : 46;
    camera.updateProjectionMatrix();
  };
  resize();
  place(0, 0);
  updateSun();

  return {
    debug: { scene, camera, renderer, composer, bloom },
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
    intro(duration = 2.8) {
      return new Promise((resolve) => {
        const t0 = performance.now();
        const fromAerial = aerial;
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / (duration * 1000));
          const e = 1 - Math.pow(1 - k, 3);
          // from the bird's-eye view the camera swoops down to the gate
          aerial = fromAerial * (1 - (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2));
          fogIntro = fromAerial > 0 ? 0 : (1 - e) * 0.03;
          if (k < 1) requestAnimationFrame(step);
          else resolve();
        };
        fogIntro = fromAerial > 0 ? 0 : 0.03;
        step();
      });
    },
    setAerial(a: number) {
      aerial = THREE.MathUtils.clamp(a, 0, 1);
    },
    setProgress(p: number) {
      progress = THREE.MathUtils.clamp(p, 0, 1);
    },
    setPointer(x: number, y: number) {
      pointer.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
    },
    resize,
    renderFrame(p?: number) {
      if (p !== undefined) progress = shown = THREE.MathUtils.clamp(p, 0, 1);
      place(shown, 0);
      camera.updateMatrixWorld();
      placeDragons(shown, 4);
      updateSun();
      (scene.fog as THREE.FogExp2).density = fogDensity(camera.position.y);
      composer.render(0.016);
    },
    setQuality(q) {
      quality = q;
      renderer.shadowMap.enabled = q !== "low";
      ao.enabled = q !== "low";
      ao.configuration.halfRes = q !== "high";
      ao.setQualityMode(q === "high" ? "Medium" : "Low");
      resize();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      composer.dispose();
      pmrem.dispose();
      env.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      Object.values(tex).forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
