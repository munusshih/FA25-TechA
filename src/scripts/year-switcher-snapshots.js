import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderYearSwitcher } from "../lib/year-navigation.js";

const STYLESHEET =
  '<link rel="stylesheet" href="/year-switcher.css" data-year-switcher-asset="styles">';
const SCRIPT =
  '<script src="/year-switcher.js" defer data-year-switcher-asset="script"></script>';
const SWITCHER_PATTERN =
  /<(?:form|div)\b[^>]*\bdata-year-switcher\b[^>]*>[\s\S]*?<\/(?:form|div)>/;
const EXACT_WORK_HREF_PATTERN = /href="\/work\/?"/g;

const addHeadAsset = (html, marker, asset) => {
  if (html.includes(marker)) return html;
  return html.replace("</head>", `${asset}</head>`);
};

export const syncFrozenYearSwitchers = ({
  root,
  currentYear,
  archivedYears,
}) => {
  const updated = [];

  for (const year of archivedYears) {
    const snapshotPath = path.join(root, "public", String(year), "index.html");
    if (!fs.existsSync(snapshotPath)) continue;

    let html = fs.readFileSync(snapshotPath, "utf8");
    html = addHeadAsset(html, 'data-year-switcher-asset="styles"', STYLESHEET);
    html = addHeadAsset(html, 'data-year-switcher-asset="script"', SCRIPT);

    const switcher = renderYearSwitcher({
      currentYear,
      archivedYears,
      selectedYear: year,
      context: "site",
    });
    html = SWITCHER_PATTERN.test(html)
      ? html.replace(SWITCHER_PATTERN, switcher)
      : html.replace("</body>", `${switcher}</body>`);

    html = html.replace(EXACT_WORK_HREF_PATTERN, `href="/${year}/work/"`);

    fs.writeFileSync(snapshotPath, html);
    updated.push(year);
  }

  return updated;
};

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const root = process.cwd();
  const config = JSON.parse(
    fs.readFileSync(path.join(root, "src/site.config.json"), "utf8"),
  );
  const updated = syncFrozenYearSwitchers({
    root,
    currentYear: config.year,
    archivedYears: config.archivedYears ?? [],
  });
  console.log(
    updated.length > 0
      ? `Updated frozen year switchers: ${updated.join(", ")}`
      : "No frozen year switchers to update.",
  );
}
