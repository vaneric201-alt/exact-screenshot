import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/*
 * A small museum stage shared by the four invention scenes: a lacquered
 * plinth on the paper page, soft studio light, a turntable the reader can
 * drag, and labels anchored to points in 3D (drawn by the page as HTML).
 */

export interface LabelDef {
  id: string;
  text: string;
  sub?: string;
  anchor: THREE.Object3D;
  /** Progress window in which the label is shown. */
  from: number;
  to: number;
  /** Which side of the anchor the label sits on. */
  side?: "left" | "right";
  /** Vertical offset of the label from its anchor, px (default: above). */
  dy?: number;
}

export interface LabelState {
  id: string;
  x: number;
  y: number;
  ax: number;
  ay: number;
  opacity: number;
  side: "left" | "right";
}

export interface SceneModule {
  labels: LabelDef[];
  /** p: scroll progress 0–1; t: seconds; dt: frame time. */
  update(p: number, t: number, dt: number): void;
  /** Camera framing for this progress. */
  frame?(p: number): { target: THREE.Vector3; distance: number; height: number };
  dispose?(): void;
}

export interface Stage {
  scene: THREE.Scene;
  /** Everything that turns with the reader's drag lives here. */
  turntable: THREE.Group;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  setModule(m: SceneModule): void;
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  resize(): void;
  dispose(): void;
}

/** How close the camera stands on wide screens, relative to each scene's framing. */
const ZOOM = 0.74;

export function createStage(
  canvas: HTMLCanvasElement,
  opts: { onLabels?: (l: LabelState[]) => void; plinth?: boolean; shadows?: boolean } = {},
): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = opts.shadows ?? true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const key = new THREE.DirectionalLight("#fff1d8", 2.4);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -4;
  sc.right = sc.top = 4;
  sc.near = 0.5;
  sc.far = 20;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#ffe2b0", 1.1);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight("#fff6e6", "#8a7458", 0.55));

  const turntable = new THREE.Group();
  scene.add(turntable);

  if (opts.plinth !== false) {
    // a round lacquered plinth with a gold rim
    const lacquer = new THREE.MeshPhysicalMaterial({ color: "#2a1410", roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.25 });
    const gold = new THREE.MeshStandardMaterial({ color: "#c9a24a", metalness: 1, roughness: 0.35 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.18, 96), lacquer);
    top.position.y = -0.09;
    top.receiveShadow = true;
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.025, 12, 128), gold);
    rimRing.rotation.x = Math.PI / 2;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.72, 2.85, 0.14, 96), lacquer);
    base.position.y = -0.25;
    turntable.add(top, rimRing, base);
    // soft contact shadow on the page underneath
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, "rgba(40,25,10,0.45)");
    g.addColorStop(1, "rgba(40,25,10,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 7.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.33;
    scene.add(shadow);
  }

  // ---------- drag to turn ----------
  let spin = 0;
  let spinVel = 0;
  let dragging = false;
  let lastX = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    spinVel = dx * 0.006;
    spin += spinVel;
  };
  const onUp = () => (dragging = false);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  let module: SceneModule | null = null;
  let progress = 0;
  let shown = 0;
  let running = false;
  let raf = 0;
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3(0, 0.6, 0);
  let camDist = 7;
  let camHeight = 2.4;
  const v = new THREE.Vector3();

  const labelsOut: LabelState[] = [];
  const projectLabels = () => {
    if (!module || !opts.onLabels) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    labelsOut.length = 0;
    for (const l of module.labels) {
      const fade = Math.min(smooth((shown - l.from) / 0.03), smooth((l.to - shown) / 0.03));
      l.anchor.getWorldPosition(v);
      v.project(camera);
      const ax = (v.x * 0.5 + 0.5) * w;
      const ay = (-v.y * 0.5 + 0.5) * h;
      const side = l.side ?? (ax < w / 2 ? "left" : "right");
      const off = Math.min(150, w * 0.1);
      labelsOut.push({ id: l.id, ax, ay, x: side === "left" ? ax - off : ax + off, y: ay + (l.dy ?? -40), opacity: v.z < 1 ? fade : 0, side });
    }
    opts.onLabels(labelsOut);
  };

  const frame = () => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    shown += (progress - shown) * (1 - Math.exp(-dt * 6));
    if (!dragging) {
      // inertia, then ease back towards the front view
      spinVel *= Math.exp(-dt * 3);
      spin += spinVel;
      spin *= Math.exp(-dt * 0.35);
    }
    turntable.rotation.y = spin;
    module?.update(shown, t, dt);
    const f = module?.frame?.(shown);
    if (f) {
      const k = 1 - Math.exp(-dt * 4);
      camTarget.lerp(f.target, k);
      camDist += (f.distance - camDist) * k;
      camHeight += (f.height - camHeight) * k;
    }
    // stand close enough that the objects, not the plinth, fill the frame;
    // portrait screens need to stand further back
    const back = camera.aspect < 1 ? 1.25 : ZOOM;
    camera.position.set(camTarget.x, camTarget.y + camHeight * back, camTarget.z + camDist * back);
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
    projectLabels();
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
    camera.fov = camera.aspect < 1 ? 46 : 32;
    // on wide screens the text panel sits on the left: shift the picture right
    if (camera.aspect > 1.1) camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    frame();
  };

  return {
    scene,
    turntable,
    camera,
    renderer,
    setModule(m) {
      module = m;
      const f = m.frame?.(0);
      if (f) {
        camTarget.copy(f.target);
        camDist = f.distance;
        camHeight = f.height;
      }
    },
    setProgress(p) {
      progress = Math.min(1, Math.max(0, p));
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
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      module?.dispose?.();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => {
            for (const val of Object.values(x)) if ((val as THREE.Texture)?.isTexture) (val as THREE.Texture).dispose();
            x.dispose();
          });
        }
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export function smooth(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** 0 before a, 1 after b, eased in between. */
export function span(p: number, a: number, b: number) {
  return smooth((p - a) / (b - a));
}

/** Seeded random for repeatable scenes. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
