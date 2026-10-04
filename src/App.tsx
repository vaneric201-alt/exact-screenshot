import { useEffect, useState } from "react";
import { chapters } from "./content/content";
import { Gate } from "./components/Gate";
import { Nav } from "./components/Nav";
import { YearCounter } from "./components/YearCounter";
import { PresentationHud } from "./components/PresentationHud";
import { Dragon } from "./components/Dragon";
import { HeroFlyover } from "./components/HeroFlyover";
import { IntroReading } from "./components/IntroReading";
import { GreatRewind } from "./components/GreatRewind";
import { Chapter } from "./components/Chapter";
import { Finale, Footer } from "./components/Finale";
import { ScrollTrigger, startSmoothScroll } from "./lib/motion";
import { installKeys } from "./lib/stops";
import { isMuted, setBgmLevel, setMuted } from "./lib/audio";
import { usePaperTexture } from "./lib/paper";

export default function App() {
  const [opened, setOpened] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  // never keep the gate locked if the 3D scene is slow to build
  useEffect(() => {
    const t = window.setTimeout(() => setHeroReady(true), 12000);
    return () => window.clearTimeout(t);
  }, []);
  usePaperTexture();

  useEffect(() => installKeys(), []);

  // M toggles sound anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "m" || e.key === "M") setMuted(!isMuted());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // background music: loud in cinematic scenes, soft while someone is talking
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-audio]"));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setBgmLevel((visible.target as HTMLElement).dataset["audio"] === "loud" ? "loud" : "soft");
      },
      { threshold: [0.2, 0.5, 0.8] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    startSmoothScroll();
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, [opened]);

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="seal-rough" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
          </filter>
        </defs>
      </svg>
      <a className="skip" href="#main">
        Bỏ qua phần mở đầu
      </a>
      {!opened && <Gate ready={heroReady} onOpen={() => setOpened(true)} />}
      <Nav />
      <YearCounter />
      <PresentationHud />
      <Dragon />
      <main id="main">
        <HeroFlyover opened={opened} onReady={() => setHeroReady(true)} />
        <IntroReading />
        <GreatRewind />
        {chapters.map((c) => (
          <Chapter key={c.id} data={c} />
        ))}
        <Finale />
      </main>
      <Footer />
    </>
  );
}
