import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createGoldenDragon, createScaleTextures } from "./three/fc/dragon3d";
import { sideCoil, sideFace } from "./three/fc/dragonPaths";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1600, 900, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#efe6d2");
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const sun = new THREE.DirectionalLight("#ffe2bd", 2.5);
sun.position.set(20, 30, 25);
scene.add(sun, new THREE.HemisphereLight("#fff", "#8a7a64", 0.4));
const tex = createScaleTextures();
const gold = new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: tex.color, metalness: 1, roughness: 0.32, normalMap: tex.normal, normalScale: new THREE.Vector2(1.1, 1.1), clearcoat: 0.35, clearcoatRoughness: 0.25 });
const goldRough = new THREE.MeshPhysicalMaterial({ color: "#e0a93b", metalness: 1, roughness: 0.38, clearcoat: 0.3 });
const dragon = createGoldenDragon({ path: sideCoil(1), gold, goldRough, thickness: 1.5, headScale: 1.1, face: sideFace(1) });
scene.add(dragon.group);
const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 500);
const params = new URLSearchParams(location.search);
const view = params.get("view") ?? "front";
if (view === "head") {
  camera.position.set(6, 16, 14);
  camera.lookAt(-2, 13, 0);
} else {
  camera.position.set(0, 0, 60);
  camera.lookAt(0, 0, 0);
}
const t = Number(params.get("t") ?? 0);
dragon.update(t);
renderer.render(scene, camera);
(window as unknown as { shot: (n: string) => Promise<void> }).shot = async (n: string) => {
  renderer.render(scene, camera);
  await fetch(`/__shot?name=${n}`, { method: "POST", body: canvas.toDataURL("image/jpeg", 0.9) });
};
