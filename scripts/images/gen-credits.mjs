import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const HERE = fileURLToPath(new URL(".", import.meta.url));
const OUT = process.argv[2] ?? `${HERE}../../src/content/imageCredits.ts`;
const IMG = process.argv[3] ?? `${HERE}../../public/img`;
const all = [];
all.push(...JSON.parse(readFileSync(`${HERE}credits.json`, "utf8")));
const seen = new Map();
for (const c of all) if (existsSync(`${IMG}/${c.slot}.webp`)) seen.set(c.slot, c);
const clean = (s) => {
  s = s.replace(/&amp;/g, "&").replace(/\s*\(talk\)\s*/g, "").replace(/\s+/g, " ").replace(/\[$/, "").trim();
  if (/^Unknown author from the time of Ming dynasty/.test(s)) return "Không rõ tác giả, thời Minh";
  if (/^Unknown/.test(s)) return "Không rõ tác giả";
  return s.replace(/^User:/, "").replace(/ from .+$/, "").slice(0, 90);
};
const rows = [...seen.values()].map((c) => ({
  slot: c.slot,
  alt: c.alt,
  title: c.title,
  artist: clean(c.artist === "Không rõ" ? "Không rõ tác giả" : c.artist),
  license: c.license === "Public domain" ? "Phạm vi công cộng" : c.license,
  licenseUrl: c.licenseUrl,
  page: c.page,
}));
const src = `// Generated from Wikimedia Commons metadata (scripts/images/gen-credits.mjs). Do not edit by hand.
export interface ImageCredit {
  slot: string;
  alt: string;
  title: string;
  artist: string;
  license: string;
  licenseUrl: string;
  page: string;
}

export const imageCredits: Record<string, ImageCredit> = ${JSON.stringify(Object.fromEntries(rows.map((r) => [r.slot, r])), null, 2)};
`;
writeFileSync(OUT, src);
console.log(rows.length, "credits");
