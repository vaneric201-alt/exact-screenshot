import * as THREE from "three";
import { bambooTex, canvasTex, metalTex, mottle, pbr, textTex, woodTex } from "../stage/textures";

/*
 * A Song-dynasty fire lance (火槍), built along +x: a wooden spear shaft with
 * an iron butt cap; near the head, a bamboo barrel with its growth nodes,
 * wrapped in pasted paper and lashed on with twisted hemp cord; a fuse leaving
 * the back of the barrel; and a leaf-shaped iron spearhead with a midrib on a
 * socket, with a red tassel. Used on the gunpowder plinth (taken apart along
 * its length) and, very large, in the finale.
 */

export interface FireLance {
  group: THREE.Group;
  parts: { shaft: THREE.Group; tube: THREE.Group; charge: THREE.Mesh; fuse: THREE.Mesh; head: THREE.Group };
  /** At the open front of the barrel, pointing +x: where the flame leaves. */
  muzzle: THREE.Object3D;
}

/** A cylinder lying along +x. */
function along<T extends THREE.BufferGeometry>(g: T) {
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Twisted cord wound `turns` times around the x axis between x0 and x1. */
function lashing(radius: number, x0: number, x1: number, turns: number, cord: number) {
  const pts: THREE.Vector3[] = [];
  const n = turns * 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, Math.cos(a) * radius, Math.sin(a) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, cord, 6);
}

/** Hemp cord: twisted plies, so the lashing reads as rope even up close. */
function cordTex(seed: number) {
  return canvasTex(
    256,
    64,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#8a6a3e";
      ctx.fillRect(0, 0, w, h);
      for (let x = -h; x < w + h; x += 10) {
        ctx.strokeStyle = "rgba(45,30,12,0.55)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
        ctx.strokeStyle = "rgba(230,200,150,0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x + 4, 0);
        ctx.lineTo(x + 4 + h, h);
        ctx.stroke();
      }
      mottle(ctx, w, h, r, "rgba(40,25,10,1)", 0.25, 4, 2);
    },
    seed,
    true,
    { normal: 3, rough: [0.85, 1] },
  );
}

/** Old pasted paper with the characters 火槍 brushed on it. */
function wrapTex() {
  return textTex("火槍", { w: 512, h: 256, cols: 1, paper: "#d9c79c", ink: "#2a1c10", size: 96 });
}

export function buildFireLance(opts: { tassel?: boolean } = {}): FireLance {
  const group = new THREE.Group();
  const iron = pbr({ map: metalTex("#3d3a36", "#5a4630", 401), metalness: 0.85, roughness: 0.55, relief: 0.8 });
  const steel = new THREE.MeshPhysicalMaterial({ map: metalTex("#9a978f", "#6f6a60", 403), color: "#d8d4cc", metalness: 1, roughness: 0.28, clearcoat: 0.3 });

  // ---------- shaft: from the butt (x = -1.6) to inside the barrel (x = 0.42)
  const shaft = new THREE.Group();
  const grain = woodTex("#7a5230", 411);
  grain.rotation = Math.PI / 2;
  grain.center.set(0.5, 0.5);
  grain.repeat.set(1, 3);
  const shaftMesh = new THREE.Mesh(along(new THREE.CylinderGeometry(0.032, 0.036, 2.02, 28, 8)), pbr({ map: grain, roughness: 0.62, relief: 1.2 }));
  shaftMesh.position.x = -0.59;
  const butt = new THREE.Mesh(along(new THREE.CylinderGeometry(0.04, 0.042, 0.12, 24)), iron);
  butt.position.x = -1.6;
  const buttSpike = new THREE.Mesh(along(new THREE.ConeGeometry(0.03, 0.12, 16)), iron);
  buttSpike.rotation.z = Math.PI;
  buttSpike.position.x = -1.71;
  // a leather grip wound around the middle of the shaft
  const grip = new THREE.Mesh(lashing(0.037, -0.95, -0.55, 14, 0.006), pbr({ color: "#3a2416", roughness: 0.7 }));
  shaft.add(shaftMesh, butt, buttSpike, grip);

  // ---------- barrel: bamboo with nodes, a paper wrap, three lashings
  const tube = new THREE.Group();
  const TL = 0.66;
  const TR = 0.074;
  const skin = bambooTex(413);
  skin.repeat.set(3, 1);
  const bamboo = pbr({ map: skin, roughness: 0.5, side: THREE.DoubleSide, relief: 1.2 });
  const tubeMesh = new THREE.Mesh(along(new THREE.CylinderGeometry(TR, TR * 1.03, TL, 40, 1, true)), bamboo);
  const inner = new THREE.Mesh(along(new THREE.CylinderGeometry(TR * 0.82, TR * 0.82, TL, 32, 1, true)), pbr({ color: "#3b2a14", roughness: 0.9, side: THREE.BackSide }));
  const lip = new THREE.Mesh(new THREE.RingGeometry(TR * 0.82, TR, 40), bamboo);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = TL / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(TR * 1.03, 40), pbr({ color: "#6d5328", roughness: 0.8 }));
  back.rotation.y = -Math.PI / 2;
  back.position.x = -TL / 2;
  tube.add(tubeMesh, inner, lip, back);
  // growth nodes: raised rings
  for (const x of [-TL / 2 + 0.02, 0.06]) {
    const node = new THREE.Mesh(new THREE.TorusGeometry(TR * 1.02, 0.007, 10, 48), pbr({ map: bambooTex(415), roughness: 0.45 }));
    node.rotation.y = Math.PI / 2;
    node.position.x = x;
    tube.add(node);
  }
  const wrap = new THREE.Mesh(along(new THREE.CylinderGeometry(TR * 1.035, TR * 1.035, 0.26, 40, 1, true)), pbr({ map: wrapTex(), roughness: 0.9, side: THREE.DoubleSide }));
  wrap.position.x = -0.12;
  tube.add(wrap);
  const cordMat = pbr({ map: cordTex(417), roughness: 0.95, relief: 1.5 });
  for (const [a, b] of [
    [-0.31, -0.27],
    [0.07, 0.11],
    [0.25, 0.29],
  ] as const) {
    tube.add(new THREE.Mesh(lashing(TR * 1.06, a, b, 6, 0.0062), cordMat));
  }
  tube.position.x = 0.13;

  // ---------- the powder charge (seen when the barrel opens)
  const powder = canvasTex(
    256,
    256,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#1b1712";
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 9000; k++) {
        const v = 20 + r() * 70;
        ctx.fillStyle = `rgba(${v},${v * 0.92},${v * 0.8},${0.4 + r() * 0.6})`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
    },
    419,
    true,
    { normal: 4, rough: [0.8, 1] },
  );
  const charge = new THREE.Mesh(along(new THREE.CylinderGeometry(TR * 0.8, TR * 0.8, TL * 0.82, 28)), pbr({ map: powder, roughness: 1, relief: 1.5 }));
  charge.position.x = 0.1;

  // ---------- fuse: twisted, leaving the back of the barrel and curling down
  const fuseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.03, 0.06, 0),
    new THREE.Vector3(-0.11, 0.1, 0.02),
    new THREE.Vector3(-0.2, 0.08, 0.01),
    new THREE.Vector3(-0.26, 0.03, -0.01),
  ]);
  const fuse = new THREE.Mesh(new THREE.TubeGeometry(fuseCurve, 48, 0.007, 8), pbr({ map: cordTex(421), color: "#c9a56a", roughness: 0.9 }));
  fuse.position.set(-0.17, TR * 0.85, 0);

  // ---------- head: socket with rings, leaf blade with a midrib, red tassel
  const head = new THREE.Group();
  const socket = new THREE.Mesh(along(new THREE.CylinderGeometry(0.026, 0.04, 0.2, 24)), iron);
  head.add(socket);
  for (const x of [-0.08, 0.02, 0.09]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036 - x * 0.08, 0.006, 8, 24), iron);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    head.add(ring);
  }
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0);
  leaf.bezierCurveTo(0.06, 0.055, 0.18, 0.06, 0.4, 0);
  leaf.bezierCurveTo(0.18, -0.06, 0.06, -0.055, 0, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(leaf, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 3, curveSegments: 24 });
  bladeGeo.translate(0, 0, -0.002);
  const blade = new THREE.Mesh(bladeGeo, steel);
  blade.rotation.x = Math.PI / 2;
  blade.position.x = 0.1;
  const rib = new THREE.Mesh(along(new THREE.CylinderGeometry(0.004, 0.012, 0.36, 8)), steel);
  rib.position.x = 0.28;
  rib.scale.set(1, 0.6, 1.4);
  head.add(blade, rib);
  if (opts.tassel !== false) {
    const N = 90;
    const hair = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0022, 0.0012, 1, 4), pbr({ color: "#a3221a", roughness: 0.75 }), N);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2 + Math.random() * 0.2;
      const len = 0.13 + Math.random() * 0.06;
      q.setFromEuler(new THREE.Euler(Math.cos(a) * 0.35, 0, Math.PI / 2 + 0.55 + Math.sin(a) * 0.25));
      const o = new THREE.Vector3(-0.07, Math.cos(a) * 0.03, Math.sin(a) * 0.03);
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      m4.compose(o.addScaledVector(dir, len / 2), q, new THREE.Vector3(1, len, 1));
      hair.setMatrixAt(k, m4);
    }
    head.add(hair);
  }
  head.position.x = 0.58;

  const muzzle = new THREE.Object3D();
  muzzle.position.x = 0.13 + TL / 2;
  group.add(shaft, tube, charge, fuse, head, muzzle);
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return { group, parts: { shaft, tube, charge, fuse, head }, muzzle };
}
