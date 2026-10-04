import * as THREE from "three";

/*
 * Centre-line paths for the golden dragons, in dragon space (metres).
 * t = 0 is the neck, t = 1 the tail tip; `time` animates the undulation.
 */

/**
 * A dragon coiling up the side of the frame, head at the top turned toward the
 * centre. side = 1 for the left dragon (faces +x), −1 for the right one.
 */
export function sideCoil(side: 1 | -1) {
  return (t: number, time: number, out: THREE.Vector3) => {
    // two loose turns around a vertical axis, head on top, tail trailing low
    const turns = 1.8;
    const a = t * Math.PI * 2 * turns - time * 0.25 + 0.3;
    const r = 4.2 + t * 2.2 + Math.sin(t * 8 - time * 1.5) * 0.6;
    const x = -Math.cos(a) * r + Math.sin(t * 7 - time * 1.3) * 0.7 * t;
    const y = 12 - t * 27 + Math.sin(t * 6 - time * 1.1) * 0.9;
    const z = Math.sin(a) * r * 0.8 - 3;
    return out.set(side * x, y, z);
  };
}

/** Where a side dragon looks: toward the centre of the frame, a little down and forward. */
export function sideFace(side: 1 | -1) {
  return (time: number, out: THREE.Vector3) => out.set(side * 1, -0.25 + Math.sin(time * 0.7) * 0.08, 0.55);
}

/**
 * A long dragon swimming through the sky along a slow S-curve (world space).
 * `progress.value` (0–1) carries it across the frame; time only animates the body.
 */
export function skyGlide(origin: THREE.Vector3, span: number, progress: { value: number }) {
  return (t: number, time: number, out: THREE.Vector3) => {
    const u = progress.value * 1.3 - 0.15 - t * 0.42;
    const x = origin.x + (u - 0.5) * span;
    const y = origin.y + Math.sin(u * 6 + 0.4) * 16 + Math.sin(t * 14 - time * 2) * 2.6;
    const z = origin.z + Math.cos(u * 4.5) * 40 + Math.sin(t * 11 - time * 1.4) * 3.2;
    return out.set(x, y, z);
  };
}
