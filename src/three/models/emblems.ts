import * as THREE from "three";
import { rng } from "../stage/stage";
import { canvasTex, metalTex, mottle, paperTex, pbr, stoneTex, textTex, woodTex } from "../stage/textures";

/*
 * Small, detailed models of the four inventions, used as emblems beside the
 * chapter titles (and as the "ancient" half of the finale's pairs). Each fits
 * a unit sphere around the origin and looks good turning slowly.
 *  giay      · a stack of handmade sheets with deckle edges, a written top
 *              sheet and a scroll tied with red cord
 *  in        · a carved woodblock (characters in relief, mirrored, inked) and
 *              three clay movable types
 *  thuocsung · a glazed ceramic thunder-bomb with a twisted, sparking fuse
 *  laban     · the south-pointing spoon on a bronze diviner's board
 */

export type EmblemId = "giay" | "in" | "thuocsung" | "laban";

export interface Emblem {
  object: THREE.Group;
  update?(t: number, dt: number): void;
}

const shadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
};

/** A sheet with an irregular, fibrous (deckle) edge and a little curl at one corner. */
function deckleSheet(w: number, d: number, seed: number, map: THREE.Texture, curl = 0) {
  const r = rng(seed);
  const grid = new THREE.PlaneGeometry(w, d, 24, 24);
  const gp = grid.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i);
    const y = gp.getY(i);
    const c = Math.max(0, x / (w / 2) + y / (d / 2) - 1.1);
    gp.setZ(i, c * c * curl + (r() - 0.5) * 0.002);
  }
  grid.computeVertexNormals();
  return new THREE.Mesh(grid, pbr({ map, roughness: 0.92, side: THREE.DoubleSide, alphaMap: deckleAlpha(seed), alphaTest: 0.5 }));
}

/** Alpha for a deckle edge: torn fibres around the rim. */
function deckleAlpha(seed: number) {
  return canvasTex(
    256,
    256,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      const m = 7;
      const pts: [number, number][] = [];
      for (let x = m; x <= w - m; x += 4) pts.push([x, m + r() * 6]);
      for (let y = m; y <= h - m; y += 4) pts.push([w - m - r() * 6, y]);
      for (let x = w - m; x >= m; x -= 4) pts.push([x, h - m - r() * 6]);
      for (let y = h - m; y >= m; y -= 4) pts.push([m + r() * 6, y]);
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.fill();
    },
    seed,
    false,
  );
}

function paperEmblem(): Emblem {
  const g = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const s = deckleSheet(1.05, 1.35, 600 + k, paperTex(false, 610 + (k % 3)));
    s.rotation.x = -Math.PI / 2;
    s.rotation.z = (k - 3) * 0.02;
    s.position.set((k % 2) * 0.012, -0.3 + k * 0.012, (k % 3) * 0.01);
    g.add(s);
  }
  const top = deckleSheet(1.05, 1.35, 699, textTex("倫乃造意用樹膚麻頭及敝布魚網以為紙", { w: 512, h: 640, cols: 5, paper: "#f1e6c9", ink: "#241a10", size: 74 }), 0.28);
  top.rotation.x = -Math.PI / 2;
  top.position.y = -0.21;
  g.add(top);
  // a scroll tied with red cord, lying across the stack
  const scroll = new THREE.Group();
  const rollTex = paperTex(false, 620);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 48), pbr({ map: rollTex, roughness: 0.9 }));
  const endTex = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#efe4c8";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,95,60,0.6)";
      for (let rr = 6; rr < 128; rr += 6) {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(128 + rr * 0.04, 128, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    621,
    true,
    { normal: 2 },
  );
  for (const y of [-0.6, 0.6]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.12, 48), pbr({ map: endTex, roughness: 0.9 }));
    cap.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2;
    cap.position.y = y;
    roll.add(cap);
  }
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.123, 0.012, 10, 48), pbr({ color: "#a3221a", roughness: 0.6 }));
  cord.rotation.x = Math.PI / 2;
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.12, 0, 0), new THREE.Vector3(0.2, -0.05, 0.05), new THREE.Vector3(0.24, -0.2, 0.12)]), 16, 0.011, 8),
    cord.material,
  );
  scroll.add(roll, cord, tail);
  scroll.rotation.set(0, 0.5, Math.PI / 2);
  scroll.position.set(0.05, -0.05, 0.25);
  g.add(scroll);
  g.rotation.x = 0.15;
  return { object: shadow(g) };
}

/** Characters carved in relief: a height map (white = raised) and an inked colour map. */
function carvedBlock(chars: string, cols: number, seed: number) {
  const draw = (ink: boolean) =>
    canvasTex(
      512,
      512,
      (ctx, w, h, r) => {
        if (ink) {
          ctx.fillStyle = "#6b4528";
          ctx.fillRect(0, 0, w, h);
          mottle(ctx, w, h, r, "rgba(20,12,6,1)", 0.35, 4, 3);
        } else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = ink ? "#16110c" : "#fff";
        const per = Math.ceil(chars.length / cols);
        const size = Math.floor(h / (per + 0.6));
        ctx.font = `900 ${size}px "Noto Serif TC", "Songti TC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const colW = w / cols;
        [...chars].forEach((ch, i) => {
          const c = Math.floor(i / per);
          ctx.fillText(ch, w - colW * (c + 0.5), size * 0.3 + (i % per) * size);
        });
        ctx.restore();
      },
      seed,
      ink,
    );
  return { ink: draw(true), height: draw(false) };
}

function printingEmblem(): Emblem {
  const g = new THREE.Group();
  const side = woodTex("#7b5130", 630);
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.8), pbr({ map: side, roughness: 0.7, relief: 1.2 }));
  block.position.y = -0.2;
  const { ink, height } = carvedBlock("金剛般若波羅蜜經如是我聞一時佛在舍衛國", 5, 631);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.74, 220, 170), new THREE.MeshStandardMaterial({ map: ink, displacementMap: height, displacementScale: 0.035, roughness: 0.55 }));
  face.rotation.x = -Math.PI / 2;
  face.position.y = -0.088;
  face.geometry.computeVertexNormals();
  g.add(block, face);
  // three clay types, one turned to show its character
  const clay = stoneTex("#a58a66", 633);
  const chars = ["活", "字", "印"];
  chars.forEach((ch, i) => {
    const t = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), pbr({ map: clay, roughness: 0.85, relief: 1.4 }));
    const glyph = carvedBlock(ch, 1, 640 + i);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.19, 80, 80), new THREE.MeshStandardMaterial({ map: glyph.ink, displacementMap: glyph.height, displacementScale: 0.018, roughness: 0.6 }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.13;
    t.add(body, top);
    t.scale.setScalar(0.62);
    t.position.set(0.66, -0.31 + 0.08, -0.22 + i * 0.18);
    t.rotation.y = 0.3 + (i - 1) * 0.2;
    if (i === 2) {
      // one type lies on its side so its carved face shows
      t.rotation.set(0, 0.4, Math.PI / 2);
      t.position.set(0.5, -0.31 + 0.062, 0.52);
    }
    g.add(t);
  });
  g.rotation.x = 0.1;
  g.position.x = -0.18;
  return { object: shadow(g) };
}

function gunpowderEmblem(): Emblem {
  const g = new THREE.Group();
  // glazed stoneware: a tenmoku glaze, black-brown with fine rust "hare's fur"
  // streaks running down from the shoulder, thinning to bare clay at the foot
  const glaze = canvasTex(
    1024,
    512,
    (ctx, w, h, r) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "#3a2414");
      gr.addColorStop(0.18, "#1c120b");
      gr.addColorStop(0.82, "#140d08");
      gr.addColorStop(0.9, "#6b4a2e");
      gr.addColorStop(1, "#a07850");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 1400; k++) {
        const x = r() * w;
        const y0 = h * (0.05 + r() * 0.2);
        const len = h * (0.2 + r() * 0.55);
        ctx.strokeStyle = `rgba(${150 + r() * 70},${80 + r() * 50},${30 + r() * 20},${0.06 + r() * 0.16})`;
        ctx.lineWidth = 0.6 + r() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.bezierCurveTo(x + (r() - 0.5) * 6, y0 + len * 0.3, x + (r() - 0.5) * 8, y0 + len * 0.7, x + (r() - 0.5) * 10, y0 + len);
        ctx.stroke();
      }
      mottle(ctx, w, h, r, "rgba(0,0,0,1)", 0.25, 5, 3);
      // a crawl in the glaze and a few pinholes
      for (let k = 0; k < 120; k++) {
        ctx.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.4})`;
        ctx.beginPath();
        ctx.arc(r() * w, r() * h * 0.85, 0.8 + r() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    650,
    true,
    { normal: 1.4, rough: [0.18, 0.45] },
  );
  const prof = [
    [0, -0.5],
    [0.22, -0.49],
    [0.42, -0.36],
    [0.5, -0.1],
    [0.47, 0.18],
    [0.34, 0.36],
    [0.14, 0.44],
    [0.1, 0.5],
    [0.12, 0.54],
    [0, 0.55],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshPhysicalMaterial({ map: glaze, normalMap: glaze.userData["normalMap"] as THREE.Texture, roughnessMap: glaze.userData["roughnessMap"] as THREE.Texture, roughness: 1, clearcoat: 0.6, clearcoatRoughness: 0.32, envMapIntensity: 0.55 }));
  // iron caltrop spikes set into the clay (as in the Wujing Zongyao thunder-bombs)
  const spikeMat = pbr({ map: metalTex("#3d3a36", "#5a4630", 651), metalness: 0.8, roughness: 0.6 });
  const r = rng(652);
  for (let k = 0; k < 44; k++) {
    const u = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(a), u * 0.75, Math.sqrt(1 - u * u) * Math.sin(a)).normalize();
    if (dir.y > 0.6) continue;
    const sp = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.2, 6), spikeMat);
    sp.position.copy(dir).multiplyScalar(0.5);
    sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(sp);
  }
  // paper seal over the mouth and the twisted fuse
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.05, 32), pbr({ map: paperTex(true, 653), roughness: 0.95 }));
  seal.position.y = 0.56;
  const fuseCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.58, 0), new THREE.Vector3(0.04, 0.72, 0.02), new THREE.Vector3(0.14, 0.8, -0.02), new THREE.Vector3(0.24, 0.76, 0)]);
  const fuse = new THREE.Mesh(new THREE.TubeGeometry(fuseCurve, 32, 0.016, 8), pbr({ color: "#7a5a32", roughness: 0.9 }));
  g.add(pot, seal, fuse);
  // sparks at the fuse tip
  const N = 60;
  const pos = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sparkTex = canvasTex(64, 64, (ctx) => {
    const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,250,220,1)");
    gr.addColorStop(0.25, "rgba(255,190,80,0.9)");
    gr.addColorStop(1, "rgba(255,120,20,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 64, 64);
  });
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.13, map: sparkTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(sparks);
  const tip = new THREE.Vector3(0.24, 0.76, 0);
  const glow = new THREE.PointLight("#ffb050", 2.4, 2.5, 2);
  glow.position.copy(tip);
  g.add(glow);
  return {
    object: shadow(g),
    update(t, dt) {
      for (let i = 0; i < N; i++) {
        life[i]! += dt * (1.5 + (i % 5) * 0.2);
        if (life[i]! >= 1) {
          life[i] = 0;
          pos[i * 3] = tip.x;
          pos[i * 3 + 1] = tip.y;
          pos[i * 3 + 2] = tip.z;
          const a = Math.random() * Math.PI * 2;
          const s = 0.4 + Math.random() * 0.8;
          vel[i * 3] = Math.cos(a) * s * 0.6;
          vel[i * 3 + 1] = 0.3 + Math.random() * 0.7;
          vel[i * 3 + 2] = Math.sin(a) * s * 0.6;
        }
        vel[i * 3 + 1]! -= dt * 2.2;
        pos[i * 3]! += vel[i * 3]! * dt;
        pos[i * 3 + 1]! += vel[i * 3 + 1]! * dt;
        pos[i * 3 + 2]! += vel[i * 3 + 2]! * dt;
      }
      geo.getAttribute("position").needsUpdate = true;
      glow.intensity = 2.2 + Math.sin(t * 31) * 0.5 + Math.sin(t * 17) * 0.4;
    },
  };
}

function compassEmblem(): Emblem {
  const g = new THREE.Group();
  // the square "earth" board with its engraved rings of directions
  const bronzeMap = metalTex("#8a6a3a", "#4f7a62", 660);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.5), pbr({ map: bronzeMap, metalness: 0.9, roughness: 0.42, relief: 1.2 }));
  board.position.y = -0.3;
  const dial = canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(79,122,98,1)", 0.45, 3, 4);
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = "rgba(30,20,10,0.75)";
      for (const rad of [150, 250, 330, 440]) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(25,15,8,0.85)";
      ctx.font = '900 58px "Noto Serif TC", "Songti TC", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const dirs = "子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬";
      [...dirs].forEach((ch, i) => {
        const a = (i / dirs.length) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillText(ch, 0, -385);
        ctx.restore();
      });
      const tri = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];
      ctx.font = '70px "Apple Symbols", "Segoe UI Symbol", serif';
      tri.forEach((ch, i) => {
        const a = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillText(ch, 0, -290);
        ctx.restore();
      });
    },
    661,
    true,
    { normal: 2.2, rough: [0.35, 0.65], invert: true },
  );
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.48), pbr({ map: dial, metalness: 0.88, roughness: 0.45, relief: 1.6 }));
  face.rotation.x = -Math.PI / 2;
  face.position.y = -0.258;
  // the round "heaven" plate in the centre
  const heaven = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.03, 64), pbr({ map: bronzeMap, metalness: 0.95, roughness: 0.25 }));
  heaven.position.y = -0.245;
  g.add(board, face, heaven);
  // the lodestone spoon: polished black stone, bowl and a long handle
  const stone = new THREE.MeshPhysicalMaterial({ map: stoneTex("#26231f", 662), color: "#3a3631", metalness: 0.2, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), stone);
  bowl.scale.set(1.25, 0.75, 1);
  bowl.rotation.x = Math.PI;
  bowl.position.y = -0.1;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 12, 64), stone);
  rim.scale.set(1.25, 1, 1);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.1;
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.18, -0.1, 0), new THREE.Vector3(0.38, -0.07, 0), new THREE.Vector3(0.62, -0.04, 0)]), 32, 0.022, 12),
    stone,
  );
  const spoon = new THREE.Group();
  spoon.add(bowl, rim, handle);
  spoon.position.y = -0.03;
  g.add(spoon);
  // a small wooden stand under the board
  const wood = pbr({ map: woodTex("#5a2e1c", 663), roughness: 0.5 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.1, 1.62), wood);
  plinth.position.y = -0.39;
  g.add(plinth);
  g.scale.setScalar(0.85);
  return {
    object: shadow(g),
    update(t) {
      // the spoon settles to south with a slow damped swing
      spoon.rotation.y = Math.sin(t * 0.9) * 0.12 * Math.exp(-((t % 12) / 4)) - Math.PI / 2;
    },
  };
}

export function buildEmblem(id: EmblemId): Emblem {
  switch (id) {
    case "giay":
      return paperEmblem();
    case "in":
      return printingEmblem();
    case "thuocsung":
      return gunpowderEmblem();
    case "laban":
      return compassEmblem();
  }
}
