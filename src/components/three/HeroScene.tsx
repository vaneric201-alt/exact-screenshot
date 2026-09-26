import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Client-only Three.js hero: the four inventions floating in lacquer-red and gold.
 * Loaded with React.lazy from HeroCanvas, so nothing here runs during SSR.
 */

const PALETTE = {
  lacquer: "#8f2a1f",
  seal: "#b23a2b",
  gold: "#d4a24c",
  goldDeep: "#a8792c",
  paper: "#efe8d8",
  ink: "#1f2326",
  bronze: "#4e6b5c",
  wood: "#4a2a1c",
  clay: "#b8875a",
};

type SceneProps = { animate: boolean };

export default function HeroScene({ animate }: SceneProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pause rendering while the hero is scrolled out of view.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), {
      rootMargin: "80px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={animate ? (visible ? "always" : "never") : "demand"}
        camera={{ position: [0, 0, 9], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.55} color="#ffe9c9" />
        <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffe2b0" />
        <pointLight position={[-5, -2, 3]} intensity={18} color={PALETTE.seal} distance={14} />
        <pointLight position={[5, -3, 2]} intensity={10} color={PALETTE.gold} distance={12} />
        <Rig animate={animate}>
          <Layout animate={animate} />
        </Rig>
        <GoldDust animate={animate} />
      </Canvas>
    </div>
  );
}

/** Mouse parallax + a gentle drift away from the camera as the page scrolls. */
function Rig({ animate, children }: { animate: boolean; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!animate) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !animate) return;
    const k = 1 - Math.exp(-dt * 3);
    g.rotation.y += (pointer.current.x * 0.22 - g.rotation.y) * k;
    g.rotation.x += (pointer.current.y * 0.14 - g.rotation.x) * k;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.2);
    g.position.z += (-scroll * 2.5 - g.position.z) * k;
  });

  return <group ref={group}>{children}</group>;
}

/** Places the four objects around the title, tighter on portrait screens. */
function Layout({ animate }: SceneProps) {
  const { viewport } = useThree();
  const portrait = viewport.aspect < 1;
  // Portrait: tuck the objects into the corners, clear of the stacked title.
  const x = portrait ? viewport.width * 0.36 : Math.min(viewport.width * 0.36, 6);
  const y = portrait ? viewport.height * 0.43 : viewport.height * 0.26;
  const s = portrait ? 0.45 : 1;

  return (
    <>
      <Float animate={animate} position={[-x, y, -0.5]} scale={s} seed={0}>
        <PaperScroll />
      </Float>
      <Float animate={animate} position={[x, y, -0.8]} scale={s} seed={1.3}>
        <Compass animate={animate} />
      </Float>
      <Float animate={animate} position={[-x, -y, -0.6]} scale={s} seed={2.1}>
        <Firework animate={animate} />
      </Float>
      <Float animate={animate} position={[x, -y, -0.4]} scale={s} seed={3.7}>
        <TypeBlocks animate={animate} />
      </Float>
    </>
  );
}

function Float({
  animate,
  position,
  scale,
  seed,
  children,
}: {
  animate: boolean;
  position: [number, number, number];
  scale: number;
  seed: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || !animate) return;
    const t = clock.elapsedTime + seed * 10;
    g.position.y = position[1] + Math.sin(t * 0.8) * 0.18;
    g.rotation.z = Math.sin(t * 0.5) * 0.08;
    g.rotation.y = Math.sin(t * 0.35) * 0.35;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {children}
    </group>
  );
}

/* ---------- Giấy: a half-unrolled hanging scroll ---------- */

function PaperScroll() {
  const paperGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.5, 2, 12, 16);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      pos.setZ(i, Math.cos((px / 0.75) * Math.PI * 0.5) * 0.12);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const inkTexture = useMemo(() => makeScrollTexture(), []);

  return (
    <group rotation={[0.1, -0.35, 0.05]}>
      <mesh geometry={paperGeo}>
        <meshStandardMaterial
          map={inkTexture}
          color={PALETTE.paper}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[1.06, -1.06].map((py) => (
        <group key={py} position={[0, py, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.09, 1.7, 20]} />
            <meshStandardMaterial color={PALETTE.wood} roughness={0.5} />
          </mesh>
          {[0.9, -0.9].map((cy) => (
            <mesh key={cy} position={[0, cy, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.12, 20]} />
              <meshStandardMaterial color={PALETTE.gold} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function makeScrollTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 340;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f3ecdc";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#1f2326";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 64px 'Noto Serif SC', serif";
    ["紙", "文", "書"].forEach((ch, i) => ctx.fillText(ch, 160, 70 + i * 90));
    ctx.font = "600 30px 'Noto Serif SC', serif";
    ["蔡", "倫", "造"].forEach((ch, i) => ctx.fillText(ch, 80, 90 + i * 48));
    ctx.fillStyle = "#b23a2b";
    ctx.fillRect(58, 250, 44, 44);
    ctx.fillStyle = "#f3ecdc";
    ctx.font = "600 26px 'Noto Serif SC', serif";
    ctx.fillText("印", 80, 273);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- La bàn: bronze dial with a restless needle ---------- */

function Compass({ animate }: SceneProps) {
  const needle = useRef<THREE.Group>(null);
  const state = useRef({ angle: 1.6, vel: 0, kick: 0 });
  const dialTexture = useMemo(() => makeDialTexture(), []);

  useFrame((_, dt) => {
    const n = needle.current;
    if (!n || !animate) return;
    const s = state.current;
    // Damped spring towards south, with an occasional nudge so it keeps searching.
    s.kick -= dt;
    if (s.kick <= 0) {
      s.vel += (Math.random() - 0.5) * 6;
      s.kick = 2.5 + Math.random() * 2;
    }
    const step = Math.min(dt, 1 / 30);
    s.vel += (-s.angle * 9 - s.vel * 1.4) * step;
    s.angle += s.vel * step;
    n.rotation.z = s.angle;
  });

  return (
    <group rotation={[0.95, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.1, 0.18, 48]} />
        <meshStandardMaterial color={PALETTE.lacquer} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.095]}>
        <circleGeometry args={[0.95, 48]} />
        <meshStandardMaterial map={dialTexture} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <torusGeometry args={[1.0, 0.04, 12, 64]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.9} roughness={0.25} />
      </mesh>
      <group ref={needle} position={[0, 0, 0.2]} rotation={[0, 0, 1.6]}>
        <mesh position={[0, 0.34, 0]}>
          <coneGeometry args={[0.07, 0.68, 4]} />
          <meshStandardMaterial color={PALETTE.seal} metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.34, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.07, 0.68, 4]} />
          <meshStandardMaterial color={PALETTE.gold} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={PALETTE.ink} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function makeDialTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const r = size / 2;
    const grd = ctx.createRadialGradient(r, r, 10, r, r, r);
    grd.addColorStop(0, "#6f8d7c");
    grd.addColorStop(1, "#3f5a4c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#d4a24c";
    ctx.lineWidth = 2;
    [0.92, 0.66, 0.42].forEach((k) => {
      ctx.beginPath();
      ctx.arc(r, r, r * k, 0, Math.PI * 2);
      ctx.stroke();
    });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(r + Math.cos(a) * r * 0.66, r + Math.sin(a) * r * 0.66);
      ctx.lineTo(r + Math.cos(a) * r * 0.92, r + Math.sin(a) * r * 0.92);
      ctx.stroke();
    }
    ctx.fillStyle = "#efe8d8";
    ctx.font = "600 26px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const dirs = ["南", "東", "北", "西"];
    dirs.forEach((d, i) => {
      const a = Math.PI / 2 + (i * Math.PI) / 2;
      ctx.fillText(d, r + Math.cos(a) * r * 0.54, r + Math.sin(a) * r * 0.54);
    });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Thuốc súng: bamboo rocket + particle burst ---------- */

const BURST = 260;

function Firework({ animate }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const sprite = useMemo(() => makeSpriteTexture(), []);
  const { geometry, dirs } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(BURST * 3);
    const col = new Float32Array(BURST * 3);
    const d = new Float32Array(BURST * 3);
    const gold = new THREE.Color(PALETTE.gold);
    const red = new THREE.Color("#e2553f");
    const warm = new THREE.Color("#ffe6a8");
    for (let i = 0; i < BURST; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.6 + Math.random() * 0.6);
      d.set([v.x, v.y, v.z], i * 3);
      const c = [gold, red, warm][i % 3] ?? gold;
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geometry: g, dirs: d };
  }, []);

  const apply = (t: number) => {
    const p = points.current;
    if (!p) return;
    const pos = p.geometry.attributes["position"] as THREE.BufferAttribute;
    const e = 1 - Math.pow(1 - t, 3);
    for (let i = 0; i < BURST; i++) {
      const o = i * 3;
      pos.setXYZ(
        i,
        (dirs[o] ?? 0) * e * 1.4,
        (dirs[o + 1] ?? 0) * e * 1.4 - t * t * 0.6,
        (dirs[o + 2] ?? 0) * e * 1.4,
      );
    }
    pos.needsUpdate = true;
    (p.material as THREE.PointsMaterial).opacity = t < 0.1 ? t * 10 : 1 - (t - 0.1) / 0.9;
  };

  useEffect(() => {
    if (!animate) apply(0.45);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  useFrame(({ clock }) => {
    if (!animate) return;
    apply((clock.elapsedTime % 2.6) / 2.6);
  });

  return (
    <group>
      <points ref={points} geometry={geometry} position={[0, 0.55, 0]} frustumCulled={false}>
        <pointsMaterial
          size={0.11}
          map={sprite}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <group rotation={[0, 0, -0.35]} position={[0, -0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.16, 1.1, 24]} />
          <meshStandardMaterial color={PALETTE.seal} roughness={0.45} />
        </mesh>
        {[-0.35, 0.05, 0.4].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <torusGeometry args={[0.165, 0.025, 8, 32]} />
            <meshStandardMaterial color={PALETTE.gold} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.65, 0]}>
          <coneGeometry args={[0.17, 0.3, 24]} />
          <meshStandardMaterial color={PALETTE.goldDeep} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, -1.05, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
          <meshStandardMaterial color={PALETTE.wood} />
        </mesh>
      </group>
    </group>
  );
}

function makeSpriteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- Kỹ thuật in: movable clay type ---------- */

const TYPE_CHARS = ["印", "書", "文", "字", "活", "版", "傳", "知", "典"];

function TypeBlocks({ animate }: SceneProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const materials = useMemo(
    () =>
      TYPE_CHARS.map((ch) => {
        const top = new THREE.MeshStandardMaterial({ map: makeGlyphTexture(ch), roughness: 0.8 });
        const side = new THREE.MeshStandardMaterial({ color: PALETTE.clay, roughness: 0.85 });
        // BoxGeometry face order: +x, -x, +y, -y, +z, -z. The glyph faces the camera (+z).
        return [side, side, side, side, top, side];
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!animate) return;
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (m) m.position.z = Math.max(0, Math.sin(t * 1.6 - i * 0.7)) * 0.22;
    });
  });

  return (
    <group rotation={[-0.45, 0.4, 0]}>
      {TYPE_CHARS.map((ch, i) => (
        <mesh
          key={ch}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={[((i % 3) - 1) * 0.56, (1 - Math.floor(i / 3)) * 0.56, 0]}
          material={materials[i] ?? []}
        >
          <boxGeometry args={[0.5, 0.5, 0.36]} />
        </mesh>
      ))}
    </group>
  );
}

function makeGlyphTexture(ch: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#c69a6c";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#2a1a12";
    ctx.font = "700 86px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, 64, 70);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Ambient gold dust ---------- */

function GoldDust({ animate }: SceneProps) {
  const ref = useRef<THREE.Points>(null);
  const sprite = useMemo(() => makeSpriteTexture(), []);
  const geometry = useMemo(() => {
    const n = 160;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos.set(
        [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6 - 2],
        i * 3,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.y += dt * 0.02;
    ref.current.rotation.x = Math.sin(ref.current.rotation.y * 3) * 0.05;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        map={sprite}
        color={PALETTE.gold}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
