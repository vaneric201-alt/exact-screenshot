import * as THREE from "three";

/*
 * Blue-hour sky for the flyover: deep blue overhead, a lighter blue at the
 * horizon, a warm afterglow around the low sun, a few faint stars; and the
 * Western Hills as layered silhouettes on the horizon.
 */

export interface DuskColors {
  zenith: string;
  horizon: string;
  glow: string;
}

export const DUSK: DuskColors = { zenith: "#08142c", horizon: "#3d5a8c", glow: "#f0955a" };

/** Golden sunset, as in the reference walk-through: violet overhead, peach and rose at the horizon. */
export const SUNSET: DuskColors = { zenith: "#3b4f9c", horizon: "#f7b48e", glow: "#ffb066" };

export function duskSkyMaterial(sunDir: THREE.Vector3, c: DuskColors = DUSK, stars = true, clouds = 0) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new THREE.Color(c.zenith) },
      uHorizon: { value: new THREE.Color(c.horizon) },
      uGlow: { value: new THREE.Color(c.glow) },
      uSun: { value: sunDir.clone().normalize() },
      uStars: { value: stars ? 1 : 0 },
      uClouds: { value: clouds },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      uniform vec3 uSun;
      uniform float uStars;
      uniform float uClouds;
      varying vec3 vDir;
      float n2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
        float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
        float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
        float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int k = 0; k < 6; k++) { v += a * n2(p); p = p * 2.03 + 17.0; a *= 0.5; }
        return v;
      }
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.3, 1.0);
        vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
        float s = max(dot(d, uSun), 0.0);
        float band = exp(-max(h, 0.0) * 7.0);
        col += uGlow * (pow(s, 5.0) * 0.55 + pow(s, 60.0) * 1.4) * band;
        col += uGlow * 0.12 * exp(-abs(h) * 30.0);
        col = mix(col, uHorizon * 0.55, smoothstep(0.0, -0.25, h));
        // sunset clouds: long streaks on a high layer, lit rose and gold from below near the sun
        if (uClouds > 0.0 && h > 0.0) {
          vec2 uv = d.xz / (h + 0.12);
          float c = fbm(uv * vec2(0.9, 2.4) + 3.0);
          c = smoothstep(0.48, 0.78, c) * smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(0.55, 0.95, h));
          float lit = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 2.0);
          vec3 under = mix(vec3(0.62, 0.42, 0.62), vec3(1.0, 0.62, 0.42), lit);
          vec3 rim = vec3(1.0, 0.86, 0.6) * pow(s, 8.0) * 0.8;
          col = mix(col, under + rim, c * uClouds);
        }
        vec3 q = floor(d * 380.0);
        float star = step(0.9978, hash(q)) * smoothstep(0.18, 0.7, h) * uStars;
        col += vec3(0.9, 0.93, 1.0) * star * (0.5 + 0.5 * hash(q + 7.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/** A few ridge lines of hills far away, darker the nearer they are. */
export function westernHills(radius: number) {
  const g = new THREE.Group();
  const layers = [
    { r: radius, color: "#9a7c9c", h: 260, seed: 1 },
    { r: radius * 0.86, color: "#86688a", h: 200, seed: 2 },
    { r: radius * 0.74, color: "#715873", h: 150, seed: 3 },
  ];
  for (const L of layers) {
    const n = 360;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      // the hills rise mostly to the west and north-west, as around Beijing
      const west = Math.max(0, Math.cos(a - Math.PI * 1.15));
      const nz =
        0.55 * Math.sin(a * 5 + L.seed) + 0.3 * Math.sin(a * 13 + L.seed * 2.3) + 0.15 * Math.sin(a * 31 + L.seed * 5.1);
      const top = (0.25 + 0.75 * west) * L.h * (0.75 + 0.35 * nz);
      const x = Math.sin(a) * L.r;
      const z = Math.cos(a) * L.r;
      pos.push(x, -40, z, x, Math.max(10, top), z);
      if (i < n) {
        const k = i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: L.color, fog: false, side: THREE.DoubleSide }));
    m.frustumCulled = false;
    g.add(m);
  }
  return g;
}
