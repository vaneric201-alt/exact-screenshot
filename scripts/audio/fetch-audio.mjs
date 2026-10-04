/*
 * Downloads the music and sound effects from Wikimedia Commons, trims them,
 * and converts them to AAC (.m4a, plays in every browser) in public/audio.
 * Credits go to scripts/audio/credits.json. Needs macOS (afconvert).
 *   node scripts/audio/fetch-audio.mjs
 */
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { OggVorbisDecoder } from "@wasm-audio-decoders/ogg-vorbis";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const OUT = `${HERE}../../public/audio`;
mkdirSync(OUT, { recursive: true });
const UA = { "User-Agent": "school-history-site/1.0 (student history project)" };
const strip = (h = "") => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// name, Commons file, what it is, [start s, length s], bitrate, fade out s
const SOUNDS = [
  ["bgm", "Guqin-Yangguan Sandie.ogg", "Đàn cổ cầm: “Dương Quan tam điệp”", null, 96000, 0],
  ["gate", "Gong or bell vibrant (short).ogg", "Tiếng cồng", null, 96000, 0.8],
  ["paper", "Turning a page.ogg", "Tiếng lật trang giấy", null, 64000, 0.2],
  ["drum", "Floor tom.ogg", "Tiếng trống", [0, 2.2], 64000, 0.6],
  ["stamp", "Rubber seal dabbed on ink pad.ogg", "Tiếng đóng dấu", "onset", 64000, 0.1],
];

async function info(title) {
  const p = new URLSearchParams({ action: "query", format: "json", titles: `File:${title}`, prop: "imageinfo", iiprop: "url|extmetadata" });
  for (let t = 0; ; t++) {
    const txt = await (await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: UA })).text();
    try {
      return Object.values(JSON.parse(txt).query.pages)[0].imageinfo[0];
    } catch (e) {
      // rate limited: wait and try again
      if (t > 5) throw e;
      await new Promise((r) => setTimeout(r, 8000 * (t + 1)));
    }
  }
}

function wav(channels, sampleRate) {
  const n = channels[0].length;
  const buf = Buffer.alloc(44 + n * channels.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * channels.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels.length, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels.length * 2, 28);
  buf.writeUInt16LE(channels.length * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * channels.length * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (const ch of channels) {
      buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(ch[i] * 32767))), o);
      o += 2;
    }
  return buf;
}

const credits = [];
const decoder = new OggVorbisDecoder();
await decoder.ready;
for (const [name, title, what, cut, bitrate, fade] of SOUNDS) {
  const ii = await info(title);
  const m = ii.extmetadata ?? {};
  credits.push({ name, title, what, artist: strip(m.Artist?.value) || "Không rõ", license: strip(m.LicenseShortName?.value), page: ii.descriptionurl });
  const out = `${OUT}/${name}.m4a`;
  if (existsSync(out)) continue;
  const data = new Uint8Array(await (await fetch(ii.url, { headers: UA })).arrayBuffer());
  await decoder.reset();
  const { channelData, sampleRate } = await decoder.decodeFile(data);
  let from = 0;
  let to = channelData[0].length;
  if (cut === "onset") {
    // one dab of the seal: from the first loud sample, 0.7 s
    const ch = channelData[0];
    let peak = 0;
    for (const v of ch) peak = Math.max(peak, Math.abs(v));
    from = Math.max(0, ch.findIndex((v) => Math.abs(v) > peak * 0.3) - Math.round(sampleRate * 0.03));
    to = Math.min(ch.length, from + Math.round(sampleRate * 0.7));
  } else if (Array.isArray(cut)) {
    from = Math.round(cut[0] * sampleRate);
    to = Math.min(to, from + Math.round(cut[1] * sampleRate));
  }
  const chans = channelData.map((c) => c.slice(from, to));
  const f = Math.round(fade * sampleRate);
  for (const c of chans) for (let i = 0; i < f && i < c.length; i++) c[c.length - 1 - i] *= i / f;
  const tmp = `${tmpdir()}/${name}-${process.pid}.wav`;
  writeFileSync(tmp, wav(chans, sampleRate));
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", String(bitrate), tmp, out]);
  unlinkSync(tmp);
  console.log("ok", name, ((to - from) / sampleRate).toFixed(1) + "s");
}
writeFileSync(`${HERE}credits.json`, JSON.stringify(credits, null, 1));
