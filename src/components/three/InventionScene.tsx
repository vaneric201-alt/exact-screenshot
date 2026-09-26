import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { InventionId } from "@/data/pages";
import {
  PALETTE,
  Compass,
  Firework,
  GoldDust,
  PaperScroll,
  TypeBlocks,
  makeGlyphTexture,
  type SceneProps,
} from "./HeroScene";

/*
 * Client-only, per-invention 3D model for the top of each presentation page.
 * The viewer can drag sideways to turn it; otherwise it turns slowly by itself.
 * Loaded with React.lazy from InventionCanvas, so nothing here runs during SSR.
 */

type Drag = { active: boolean; lastX: number; lastY: number; yaw: number; pitch: number };

export default function InventionScene({ kind, animate }: { kind: InventionId } & SceneProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const drag = useRef<Drag>({ active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0 });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), {
      rootMargin: "80px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const d = drag.current;
    d.active = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.yaw += (e.clientX - d.lastX) * 0.012;
    d.pitch = THREE.MathUtils.clamp(d.pitch + (e.clientY - d.lastY) * 0.006, -0.5, 0.5);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    kick.current();
  };
  const onUp = () => {
    drag.current.active = false;
  };

  return (
    <div
      ref={wrap}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={animate ? (visible ? "always" : "never") : "demand"}
        camera={{ position: [0, 0, 7], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.6} color="#ffe9c9" />
        <directionalLight position={[4, 6, 5]} intensity={1.7} color="#ffe2b0" />
        <pointLight position={[-4, -2, 3]} intensity={16} color={PALETTE.seal} distance={14} />
        <pointLight position={[4, -3, 2]} intensity={10} color={PALETTE.gold} distance={12} />
        <Turntable drag={drag} kick={kick} animate={animate}>
          {kind === "giay" && <GiayModel animate={animate} />}
          {kind === "laban" && <LabanModel animate={animate} />}
          {kind === "thuocsung" && <ThuocSungModel animate={animate} />}
          {kind === "in" && <InModel animate={animate} />}
        </Turntable>
        <GoldDust animate={animate} />
      </Canvas>
    </div>
  );
}

/** Eases the model towards the dragged angle and adds a slow idle spin. */
function Turntable({
  drag,
  kick,
  animate,
  children,
}: {
  drag: React.RefObject<Drag>;
  kick: React.RefObject<() => void>;
  animate: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const idle = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    kick.current = () => invalidate();
  }, [invalidate, kick]);

  useFrame((_, dt) => {
    const g = group.current;
    const d = drag.current;
    if (!g || !d) return;
    if (animate && !d.active) idle.current += dt * 0.18;
    const k = animate ? 1 - Math.exp(-dt * 6) : 1;
    g.rotation.y += (d.yaw + idle.current - g.rotation.y) * k;
    g.rotation.x += (d.pitch - g.rotation.x) * k;
  });

  return <group ref={group}>{children}</group>;
}

/* ---------- Giấy: the scroll, with loose sheets drifting up around it ---------- */

const SHEETS = 12;

function GiayModel({ animate }: SceneProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const sheetTex = useMemo(() => makeSheetTexture(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: SHEETS }, (_, i) => ({ a: (i / SHEETS) * Math.PI * 2, o: i * 0.37 })),
    [],
  );

  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 1.2;
    refs.current.forEach((m, i) => {
      const s = seeds[i];
      if (!m || !s) return;
      const cycle = (((t * 0.12 + s.o) % 1) + 1) % 1;
      const a = s.a + t * 0.25;
      m.position.set(Math.cos(a) * 2.1, -2.2 + cycle * 4.4, Math.sin(a) * 2.1);
      m.rotation.set(Math.sin(t * 1.3 + i) * 0.6, -a + Math.PI / 2, Math.cos(t * 1.1 + i) * 0.4);
      const fade = Math.min(cycle * 5, (1 - cycle) * 5, 1);
      m.scale.setScalar(0.4 + fade * 0.6);
    });
  });

  return (
    <group>
      <group scale={1.35}>
        <PaperScroll />
      </group>
      {seeds.map((s, i) => (
        <mesh
          key={s.a}
          ref={(m) => {
            refs.current[i] = m;
          }}
        >
          <planeGeometry args={[0.42, 0.56]} />
          <meshStandardMaterial map={sheetTex} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function makeSheetTexture() {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f1e9d6";
    ctx.fillRect(0, 0, 96, 128);
    ctx.strokeStyle = "rgba(31,35,38,0.55)";
    ctx.lineWidth = 3;
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 5; row++) {
        const x = 72 - col * 24;
        const y = 16 + row * 21;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y + 2);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- La bàn: the Song needle compass beside a Han "Tư Nam" spoon ---------- */

function LabanModel({ animate }: SceneProps) {
  return (
    <group>
      <group position={[-0.75, 0.55, 0]} scale={1.1}>
        <Compass animate={animate} />
      </group>
      <group position={[1.05, -1.0, 0.3]} scale={0.8}>
        <SinanSpoon animate={animate} />
      </group>
    </group>
  );
}

function SinanSpoon({ animate }: SceneProps) {
  const spoon = useRef<THREE.Group>(null);
  const state = useRef({ angle: 1.2, vel: 0, kick: 1.5 });
  const plateTex = useMemo(() => makePlateTexture(), []);

  useFrame((_, dt) => {
    const s = state.current;
    const g = spoon.current;
    if (!g || !animate) return;
    s.kick -= dt;
    if (s.kick <= 0) {
      s.vel += (Math.random() - 0.5) * 5;
      s.kick = 3 + Math.random() * 2;
    }
    const step = Math.min(dt, 1 / 30);
    s.vel += (-s.angle * 6 - s.vel * 1.1) * step;
    s.angle += s.vel * step;
    g.rotation.y = s.angle;
  });

  return (
    <group rotation={[0.75, -0.3, 0]}>
      {/* Square bronze earth-plate */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[2.3, 0.1, 2.3]} />
        <meshStandardMaterial color={PALETTE.bronze} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial map={plateTex} metalness={0.4} roughness={0.55} />
      </mesh>
      {/* Lodestone spoon: the handle settles pointing south */}
      <group ref={spoon} rotation={[0, 1.2, 0]}>
        <mesh position={[0, 0.16, 0]} scale={[0.42, 0.2, 0.3]}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshStandardMaterial color="#2c2a28" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.62, 0.22, 0]} rotation={[0, 0, Math.PI / 2 + 0.12]}>
          <cylinderGeometry args={[0.045, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#2c2a28" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function makePlateTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const r = size / 2;
    ctx.fillStyle = "#56766a";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#d4a24c";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, size - 20, size - 20);
    ctx.strokeRect(34, 34, size - 68, size - 68);
    ctx.beginPath();
    ctx.arc(r, r, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#efe8d8";
    ctx.font = "600 22px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const dirs: [string, number, number][] = [
      ["南", r, size - 22],
      ["北", r, 22],
      ["東", size - 22, r],
      ["西", 22, r],
    ];
    dirs.forEach(([d, x, y]) => ctx.fillText(d, x, y));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Thuốc súng: a fire-lance rocket and a sky of staggered bursts ---------- */

function ThuocSungModel({ animate }: SceneProps) {
  return (
    <group>
      <group scale={1.3} position={[0, -0.3, 0]}>
        <Firework animate={animate} />
      </group>
      <group scale={0.75} position={[-1.7, 1.3, -0.6]}>
        <Firework animate={animate} phase={0.9} rocket={false} />
      </group>
      <group scale={0.65} position={[1.8, 1.0, -0.9]}>
        <Firework animate={animate} phase={1.7} rocket={false} />
      </group>
      <group scale={0.55} position={[1.4, -1.6, 0.4]}>
        <Firework animate={animate} phase={0.4} rocket={false} />
      </group>
    </group>
  );
}

/* ---------- Kỹ thuật in: Bi Sheng's clay type, with a ring of loose sorts ---------- */

const RING_CHARS = ["天", "地", "人", "山", "水", "日", "月", "火", "木", "金", "土", "中"];

function InModel({ animate }: SceneProps) {
  const ring = useRef<THREE.Group>(null);
  const materials = useMemo(
    () =>
      RING_CHARS.map((ch) => {
        const top = new THREE.MeshStandardMaterial({ map: makeGlyphTexture(ch), roughness: 0.8 });
        const side = new THREE.MeshStandardMaterial({ color: PALETTE.clay, roughness: 0.85 });
        return [side, side, side, side, top, side];
      }),
    [],
  );

  useFrame((_, dt) => {
    if (!animate || !ring.current) return;
    ring.current.rotation.y -= dt * 0.35;
  });

  return (
    <group>
      <group scale={1.35}>
        <TypeBlocks animate={animate} />
      </group>
      <group rotation={[0.35, 0, 0.1]}>
        <group ref={ring}>
          {RING_CHARS.map((ch, i) => {
            const a = (i / RING_CHARS.length) * Math.PI * 2;
            return (
              <mesh
                key={ch}
                position={[Math.cos(a) * 2.25, Math.sin(i * 1.7) * 0.25, Math.sin(a) * 2.25]}
                rotation={[0, -a + Math.PI / 2, 0]}
                material={materials[i] ?? []}
              >
                <boxGeometry args={[0.32, 0.32, 0.24]} />
              </mesh>
            );
          })}
        </group>
      </group>
    </group>
  );
}
