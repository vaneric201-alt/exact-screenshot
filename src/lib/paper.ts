import { useEffect } from "react";

/**
 * Paper grain. If the group adds /textures/paper.webp it is used; otherwise a
 * fibre texture is painted once on a canvas (no animated SVG filters).
 */
export function usePaperTexture() {
  useEffect(() => {
    const img = new Image();
    img.onload = () => document.documentElement.style.setProperty("--paper-tex", "url(/textures/paper.webp)");
    img.onerror = () => document.documentElement.style.setProperty("--paper-tex", `url(${paintFibres()})`);
    img.src = "/textures/paper.webp";
  }, []);
}

function paintFibres() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, S, S);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // soft mottling
  for (let i = 0; i < 900; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 6 + rnd() * 28;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(120, 100, 70, ${0.012 + rnd() * 0.02})`);
    grd.addColorStop(1, "rgba(120, 100, 70, 0)");
    g.fillStyle = grd;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) g.fillRect(x - r + dx, y - r + dy, r * 2, r * 2);
  }
  // long fibres
  g.lineCap = "round";
  for (let i = 0; i < 320; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const a = rnd() * Math.PI * 2;
    const len = 6 + rnd() * 40;
    g.strokeStyle = `rgba(90, 70, 45, ${0.03 + rnd() * 0.045})`;
    g.lineWidth = 0.4 + rnd() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.5) * len * 0.5, y + Math.sin(a + 0.5) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return c.toDataURL("image/png");
}
