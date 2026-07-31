/**
 * Refresh the project previews in assets/work/.
 *
 *   npm install        (once)
 *   npm run shots      (re-shoots every site below and re-encodes)
 *   npm run shots -- heirloom skeg      (only those ids)
 *
 * Shoots each live site at 1440x900 @2x, then writes AVIF + WebP at 1520w and
 * 760w. The markup references these by <picture>/srcset, so nothing in
 * index.html needs editing when a client site changes — just re-run this.
 *
 * Every shot is written to assets/work/ only if the capture succeeded, so a
 * site being down cannot blank an existing preview.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets", "work");
const TMP = path.join(ROOT, ".shots-tmp");

const SITES = [
  { id: "depositdesk", url: "https://depositdesk.app" },
  { id: "handyhands", url: "https://handyhands209.com" },
  { id: "heirloom", url: "https://heirloomwindows.com" },
  { id: "jspot", url: "http://thejspotband.com/" },
  { id: "skeg", url: "https://skegsoftware.com" },
  { id: "appstore", url: "https://apps.shopify.com/depositdesk" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const only = process.argv.slice(2);
const targets = only.length ? SITES.filter((s) => only.includes(s.id)) : SITES;
if (!targets.length) {
  console.error("No matching ids. Known:", SITES.map((s) => s.id).join(", "));
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(TMP, { recursive: true });

const browser = await chromium.launch();
let failed = 0;

for (const site of targets) {
  const raw = path.join(TMP, `${site.id}.png`);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent: UA,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(6000);
    for (const label of ["Accept", "Accept all", "Got it", "I agree", "Close"]) {
      const btn = page.getByRole("button", { name: label, exact: false }).first();
      if (await btn.count().catch(() => 0)) await btn.click({ timeout: 1500 }).catch(() => {});
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: raw });

    for (const width of [1520, 760]) {
      const base = sharp(raw).resize({ width, fit: "cover", position: "top" });
      await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${site.id}-${width}.avif`));
      await base.clone().webp({ quality: 78, effort: 5 }).toFile(path.join(OUT, `${site.id}-${width}.webp`));
    }
    console.log("ok  ", site.id);
  } catch (err) {
    failed++;
    console.error("FAIL", site.id, String(err).split("\n")[0], "— kept the existing preview");
  }
  await ctx.close();
}

await browser.close();
await fs.rm(TMP, { recursive: true, force: true });
if (failed) {
  console.error(`\n${failed} site(s) failed. Existing previews were left in place.`);
  process.exit(1);
}
console.log("\nAll previews refreshed.");
