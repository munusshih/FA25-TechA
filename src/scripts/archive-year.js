/**
 * Archive a year as a FROZEN HTML SNAPSHOT and advance to the next.
 *
 *   npm run archive-year                    # archive current year, bump to next
 *   npm run archive-year -- --sheet=URL     # ...and set the new year's sheet
 *   npm run archive-year -- --year=2025 --no-advance   # (re)snapshot a past year
 *
 * Content AND css are tweaked every year, so the archive must be the
 * actual rendered HTML, not a re-rendering Astro page. This:
 *   1. Builds the site (current homepage = the year being archived).
 *   2. Snapshots dist/index.html + its bundled JS/CSS into a fully
 *      self-contained public/<year>/ (asset paths rewritten so it is
 *      immune to every future build). Served at /<year>.
 *   3. Removes any stale src/pages/<year>.astro + src/styles/archive/<year>/
 *      from earlier approaches.
 *   4. Adds <year> to archivedYears and (unless --no-advance) bumps
 *      `year` in site.config.json. Footer + /work switcher update auto.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "src/site.config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? null;
const has = (name) => process.argv.includes(`--${name}`);

const year = Number(arg("year") ?? config.year);
const isCurrentYear = year === config.year;
const newSheetUrl = arg("sheet");

console.log(
  `\n📦 Archiving ${config.season ?? "Fall"} ${year} as frozen HTML...\n`,
);

// 1. Build (the live homepage is the year being archived).
if (has("no-build")) {
  console.log("• --no-build: reusing existing dist/");
} else {
  const before = fs.existsSync(path.join(ROOT, "dist/index.html"))
    ? fs.statSync(path.join(ROOT, "dist/index.html")).mtimeMs
    : 0;
  try {
    execSync("npx astro build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    // astro-selfie's post-build hook can exit non-zero locally without
    // Playwright; the pages are still written. Validate below instead.
  }
  const distIndex = path.join(ROOT, "dist/index.html");
  if (!fs.existsSync(distIndex) || fs.statSync(distIndex).mtimeMs <= before) {
    console.error(
      "❌ Build did not produce a fresh dist/index.html. Aborting.",
    );
    process.exit(1);
  }
}

// 2. Snapshot the rendered homepage into a self-contained public/<year>/.
const distDir = path.join(ROOT, "dist");
const outDir = path.join(ROOT, "public", String(year));
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const rewrite = (s) =>
  s
    .replaceAll("/_astro/", `/${year}/_astro/`)
    .replaceAll('href="./favicon.svg"', 'href="/favicon.svg"');

// Copy + path-rewrite the bundled assets (JS chunk imports + CSS url()).
fs.cpSync(path.join(distDir, "_astro"), path.join(outDir, "_astro"), {
  recursive: true,
});
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(js|css)$/.test(entry.name))
      fs.writeFileSync(p, rewrite(fs.readFileSync(p, "utf8")));
  }
};
walk(path.join(outDir, "_astro"));

let html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
html = rewrite(html).replace(
  /(<link rel="canonical" href="https?:\/\/[^"]+?)\/(")/,
  `$1/${year}/$2`,
);
// A frozen homepage still needs a clear route back to the live course site.
const liveYear = isCurrentYear && !has("no-advance") ? year + 1 : config.year;
const workArchiveItem =
  /(<li class="pill">\s*<a class="pill-link" href="\/work">Work Archive<\/a>\s*<\/li>)/;
if (!workArchiveItem.test(html)) {
  console.error(
    "❌ Could not find the Work Archive navigation item. Aborting.",
  );
  process.exit(1);
}
html = html.replace(
  workArchiveItem,
  `$1 <li class="pill"><a class="pill-link" href="/">Current ${liveYear}</a></li>`,
);
fs.writeFileSync(path.join(outDir, "index.html"), html);

const size = execSync(`du -sh "${outDir}"`).toString().split("\t")[0];
console.log(
  `• Froze homepage -> public/${year}/ (${size}, served at /${year})`,
);

// 3. Remove stale artifacts from earlier (non-snapshot) approaches.
for (const stale of [
  path.join(ROOT, "src/pages", `${year}.astro`),
  path.join(ROOT, "src/styles/archive", String(year)),
]) {
  if (fs.existsSync(stale)) {
    fs.rmSync(stale, { recursive: true, force: true });
    console.log(`• Removed stale ${path.relative(ROOT, stale)}`);
  }
}

// 4. Update config (always record the year; advance only the live year).
const archivedYears = Array.from(
  new Set([...(config.archivedYears ?? []), year]),
).sort((a, b) => b - a);
const nextConfig = { ...config, archivedYears };
if (isCurrentYear && !has("no-advance")) nextConfig.year = year + 1;
if (newSheetUrl) nextConfig.sheetUrl = newSheetUrl;
fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2) + "\n");
console.log(
  `• site.config.json: archivedYears=[${archivedYears.join(", ")}]` +
    (nextConfig.year !== config.year ? `, year=${nextConfig.year}` : ""),
);

console.log(`\n✅ ${year} frozen at /${year}.`);
if (isCurrentYear && !has("no-advance")) {
  console.log(`\nNext, for ${nextConfig.year}:`);
  if (!newSheetUrl)
    console.log(
      `  1. Set "sheetUrl" in src/site.config.json to the ${nextConfig.year} sheet`,
    );
  console.log(`  ${newSheetUrl ? 1 : 2}. npm run sync`);
  console.log(
    `  ${newSheetUrl ? 2 : 3}. edit homepage/styles for ${nextConfig.year}, then npm run dev`,
  );
}
console.log("");
