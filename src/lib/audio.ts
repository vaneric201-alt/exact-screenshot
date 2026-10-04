import { Howl, Howler } from "howler";

/*
 * Sound design (design.md §11). Nothing plays before the Gate click.
 * Missing files are silent: every load error is swallowed.
 */
type Sfx = "drum" | "brush" | "stamp" | "paper" | "gate";

const VOL: Record<Sfx, number> = { drum: 0.5, brush: 0.4, stamp: 0.6, paper: 0.4, gate: 0.55 };
const sounds = new Map<Sfx, Howl>();
let bgm: Howl | null = null;
let unlocked = false;
let muted = false;
let bgmLevel: "loud" | "soft" = "loud";
const lastPlay = new Map<Sfx, number>();
const muteListeners = new Set<(m: boolean) => void>();

try {
  muted = localStorage.getItem("muted") === "1";
} catch {
  /* private mode */
}

function make(src: string, volume: number, loop = false, stream = false) {
  return new Howl({ src: [src], volume, loop, html5: stream, preload: true, onloaderror: () => {}, onplayerror: () => {} });
}

/** Effects that have a file (see scripts/audio/fetch-audio.mjs); the others stay silent. */
const FILES: Partial<Record<Sfx, string>> = { drum: "drum", stamp: "stamp", paper: "paper", gate: "gate" };

export function unlockAudio(withSound: boolean) {
  unlocked = true;
  if (!withSound) setMuted(true);
  (Object.keys(FILES) as Sfx[]).forEach((k) => sounds.set(k, make(`/audio/${FILES[k]}.m4a`, VOL[k])));
  // guqin music: streamed, so it starts before the whole file has loaded
  bgm = make("/audio/bgm.m4a", 0.6, true, true);
  Howler.mute(muted);
  bgm.play();
}

export function play(name: Sfx, minGapMs = 0) {
  if (!unlocked || muted) return;
  const now = performance.now();
  if (minGapMs && now - (lastPlay.get(name) ?? 0) < minGapMs) return;
  lastPlay.set(name, now);
  sounds.get(name)?.play();
}

export function setBgmLevel(level: "loud" | "soft") {
  if (level === bgmLevel || !bgm) {
    bgmLevel = level;
    return;
  }
  bgmLevel = level;
  bgm.fade(bgm.volume(), level === "loud" ? 0.6 : 0.15, 800);
}

export function fadeOutBgm(ms = 4000) {
  if (!bgm) return;
  bgm.fade(bgm.volume(), 0.85, 900);
  window.setTimeout(() => bgm?.fade(bgm.volume(), 0, ms), 1000);
}

export function setMuted(m: boolean) {
  muted = m;
  Howler.mute(m);
  try {
    localStorage.setItem("muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
  muteListeners.forEach((f) => f(m));
}

export function isMuted() {
  return muted;
}

export function onMuted(f: (m: boolean) => void) {
  muteListeners.add(f);
  return () => {
    muteListeners.delete(f);
  };
}

// ---------- synthesised effects: no files to fetch, same mute rules ----------

export type Synth = "shot" | "boom" | "pop" | "crackle" | "launch";

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/**
 * A short synthesised sound: the fire lance's roar (`shot`), a deep explosion
 * (`boom`), a firework burst (`pop`) and its crackle, a missile launch rumble.
 */
export function synth(kind: Synth, gain = 1) {
  if (!unlocked || muted) return;
  const ctx = Howler.ctx as AudioContext | undefined;
  if (!ctx) return;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.connect(Howler.masterGain ?? ctx.destination);
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const f = ctx.createBiquadFilter();
  src.connect(f).connect(out);
  const env = (a: number, peak: number, d: number) => {
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(peak * gain, t + a);
    out.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  if (kind === "shot") {
    f.type = "lowpass";
    f.frequency.setValueAtTime(3800, t);
    f.frequency.exponentialRampToValueAtTime(380, t + 0.7);
    env(0.015, 0.55, 0.8);
    src.start(t, Math.random(), 1);
  } else if (kind === "boom") {
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(60, t + 2.6);
    env(0.02, 1.0, 3.2);
    src.start(t, 0, 3);
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.frequency.setValueAtTime(70, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 1.6);
    sg.gain.setValueAtTime(0.8 * gain, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    sub.connect(sg).connect(Howler.masterGain ?? ctx.destination);
    sub.start(t);
    sub.stop(t + 2.1);
  } else if (kind === "launch") {
    f.type = "bandpass";
    f.frequency.setValueAtTime(260, t);
    f.frequency.exponentialRampToValueAtTime(900, t + 2.5);
    f.Q.value = 0.6;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.7 * gain, t + 0.6);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    src.start(t, 0, 3);
  } else if (kind === "pop") {
    f.type = "lowpass";
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    env(0.005, 0.6, 0.55);
    src.start(t, Math.random() * 2, 0.6);
  } else {
    // crackle: many tiny clicks
    f.type = "highpass";
    f.frequency.value = 2500;
    out.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k < 26; k++) {
      const at = t + 0.05 + Math.random() * 1.1;
      out.gain.setValueAtTime(0.0001, at);
      out.gain.exponentialRampToValueAtTime(0.25 * gain, at + 0.004);
      out.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    }
    src.start(t, Math.random(), 1.3);
  }
}
