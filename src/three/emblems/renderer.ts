import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildEmblem, type Emblem, type EmblemId } from "../models/emblems";

/*
 * One WebGL context renders every invention emblem on the page: each emblem
 * draws into its own 2D canvas, and only while that canvas is on screen. This
 * keeps the page well under the browser's limit on live WebGL contexts (the
 * flyover, the book and the four plinths already use six).
 */

interface Slot {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  emblem: Emblem;
  pivot: THREE.Group;
  visible: boolean;
  spin: number;
  size: number;
}

const SIZE = 360;
let renderer: THREE.WebGLRenderer | null = null;
let env: THREE.Texture | null = null;
const slots = new Set<Slot>();
let raf = 0;
let last = 0;
const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => es.forEach((e) => visibleFor(e.target, e.isIntersecting)), { rootMargin: "100px" }) : null;

function visibleFor(el: Element, v: boolean) {
  for (const s of slots) if (s.canvas === el) s.visible = v;
  kick();
}

function ensureRenderer() {
  if (renderer) return renderer;
  const c = document.createElement("canvas");
  renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return renderer;
}

function kick() {
  if (!raf && [...slots].some((s) => s.visible)) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

function loop(now: number) {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const r = ensureRenderer();
  const t = now / 1000;
  let any = false;
  for (const s of slots) {
    if (!s.visible) continue;
    any = true;
    s.spin += dt * 0.35;
    s.pivot.rotation.y = Math.sin(s.spin) * 0.55 + s.spin * 0.12;
    s.emblem.update?.(t, dt);
    if (r.domElement.width !== s.size) r.setSize(s.size, s.size, false);
    r.render(s.scene, s.camera);
    s.ctx.clearRect(0, 0, s.size, s.size);
    s.ctx.drawImage(r.domElement, 0, 0);
  }
  if (any) raf = requestAnimationFrame(loop);
}

export function mountEmblem(canvas: HTMLCanvasElement, id: EmblemId, size = SIZE) {
  ensureRenderer();
  canvas.width = canvas.height = size;
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight("#fff1d8", 2.6);
  key.position.set(-2.5, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;
  const kc = key.shadow.camera;
  kc.left = kc.bottom = -1.5;
  kc.right = kc.top = 1.5;
  scene.add(key, new THREE.HemisphereLight("#fff6e6", "#6a5440", 0.5));
  const rim = new THREE.DirectionalLight("#ffd9a0", 1.4);
  rim.position.set(3, 2, -3);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.05, 2.65);
  camera.lookAt(0, 0, 0);
  const emblem = buildEmblem(id);
  const pivot = new THREE.Group();
  pivot.add(emblem.object);
  scene.add(pivot);
  const slot: Slot = { canvas, ctx: canvas.getContext("2d")!, scene, camera, emblem, pivot, visible: false, spin: Math.random() * 6, size };
  slots.add(slot);
  io?.observe(canvas);
  return () => {
    slots.delete(slot);
    io?.unobserve(canvas);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
      }
    });
  };
}
