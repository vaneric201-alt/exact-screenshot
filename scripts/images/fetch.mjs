/*
 * Downloads the archival images listed in slots.json from Wikimedia Commons,
 * converts them to WebP in public/img and records author + licence in credits.json.
 * Existing files are skipped. Then refresh src/content/imageCredits.ts:
 *   node scripts/images/fetch.mjs && node scripts/images/gen-credits.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = fileURLToPath(new URL(".", import.meta.url));
import sharp from "sharp";
const OUT = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? `${HERE}../../public/img`;
mkdirSync(OUT, { recursive: true });
const slots = JSON.parse(readFileSync(`${HERE}slots.json`, "utf8"));
const UA = { "User-Agent": "school-history-site/1.0 (student history project)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h = "") => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const cache = new Map();
const credits = [];
async function info(title) {
  if (cache.has(title)) return cache.get(title);
  for (let t = 0; t < 6; t++) {
    const p = new URLSearchParams({ action: "query", format: "json", titles: `File:${title}`, prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "1280" });
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: UA });
    const txt = await r.text();
    try {
      const j = JSON.parse(txt);
      const pg = Object.values(j.query.pages)[0];
      const ii = pg.imageinfo?.[0];
      if (!ii) throw new Error("missing " + title);
      cache.set(title, ii);
      await sleep(1500);
      return ii;
    } catch (e) {
      if (String(e).includes("missing")) throw e;
      await sleep(6000 * (t + 1));
    }
  }
  throw new Error("rate limited: " + title);
}
// by default only the missing images are fetched (their credits merge into credits.json); --all refreshes every credit
const all = process.argv.includes("--all");
for (const [slot, title, alt] of slots) {
  if (!all && existsSync(`${OUT}/${slot}.webp`)) continue;
  try {
    const ii = await info(title);
    const m = ii.extmetadata ?? {};
    const long = ii.width / ii.height > 3;
    let url = (ii.thumburl ?? ii.url).split("?")[0];
    if (long) {
      // very long scrolls: fetch the original (thumbnails that wide are refused) and crop a window from it
      url = ii.url.split("?")[0];
    }
    const out = `${OUT}/${slot}.webp`;
    if (!existsSync(out)) {
      let buf = null;
      for (let t = 0; t < 5 && !buf; t++) {
        const r = await fetch(url, { headers: UA });
        if (r.ok) buf = Buffer.from(await r.arrayBuffer());
        else await sleep(5000 * (t + 1));
      }
      if (!buf) throw new Error("download failed " + url);
      let img = sharp(buf).rotate();
      const meta = await img.metadata();
      if (long) {
        const h = meta.height;
        const w = Math.round(h * 1.4);
        img = img.extract({ left: Math.max(0, Math.round((meta.width - w) * 0.35)), top: 0, width: Math.min(w, meta.width), height: h });
      }
      await img.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
      await sleep(800);
    }
    credits.push({
      slot, alt, title,
      artist: strip(m.Artist?.value) || "Không rõ",
      license: strip(m.LicenseShortName?.value) || "?",
      licenseUrl: m.LicenseUrl?.value ?? "",
      page: ii.descriptionurl,
    });
    console.log("ok", slot, "|", strip(m.LicenseShortName?.value));
  } catch (e) {
    console.log("FAIL", slot, String(e).slice(0, 160));
  }
}
const old = existsSync(`${HERE}credits.json`) ? JSON.parse(readFileSync(`${HERE}credits.json`, "utf8")) : [];
const merged = new Map(old.map((c) => [c.slot, c]));
// keep hand-corrected alt texts from the previous run
for (const c of credits) merged.set(c.slot, { ...c, alt: merged.get(c.slot)?.alt ?? c.alt });
writeFileSync(`${HERE}credits.json`, JSON.stringify([...merged.values()], null, 1));
