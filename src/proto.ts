import { createForbiddenCityFlyover } from "./three/forbiddenCityFlyover";

const canvas = document.getElementById("c") as HTMLCanvasElement;
if (new URLSearchParams(location.search).has("cap")) {
  // capture mode: fixed 1600×900 drawing size regardless of the window
  Object.assign(canvas.style, { position: "absolute", width: "1600px", height: "900px", inset: "auto" });
}
const hud = document.getElementById("hud")!;
const t0 = performance.now();
const fly = createForbiddenCityFlyover(canvas, {
  onFrame: (fps) => (hud.textContent = `${fps.toFixed(0)} fps · p=${p.toFixed(3)}`),
});
hud.textContent = `built in ${(performance.now() - t0).toFixed(0)} ms`;
let p = 0;
const q = new URLSearchParams(location.search).get("p");
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  p = q ? Number(q) : scrollY / max;
  fly.setProgress(p);
};
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => fly.resize());
addEventListener("pointermove", (e) => fly.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)));
onScroll();
fly.start();
fly.intro();
(window as unknown as { fly: typeof fly }).fly = fly;

/** Dev: render frame p and save it via the dev server (see vite.config.ts). */
(window as unknown as { shot: (p: number, name: string) => Promise<string> }).shot = async (p: number, name: string) => {
  fly.renderFrame(p);
  const url = canvas.toDataURL("image/jpeg", 0.88);
  await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: "POST", body: url });
  return name;
};
