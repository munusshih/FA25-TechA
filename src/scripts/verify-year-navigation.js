import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = JSON.parse(
  fs.readFileSync(path.join(root, "src", "site.config.json"), "utf8"),
);
const archivedYears = config.archivedYears ?? [];
const failures = [];

const readPage = (relativePath) => {
  const filePath = path.join(root, "dist", relativePath);

  if (!fs.existsSync(filePath)) {
    failures.push(`Missing route output: /${relativePath}`);
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
};

const expectMarkup = (html, markup, route) => {
  if (html && !html.includes(markup)) {
    failures.push(`Missing ${JSON.stringify(markup)} in ${route}`);
  }
};

const currentHomepage = readPage("index.html");
const currentWork = readPage(path.join("work", "index.html"));

for (const year of archivedYears) {
  const archivedHomepageRoute = `/${year}/`;
  const archivedWorkRoute = `/${year}/work/`;
  const archivedHomepage = readPage(path.join(String(year), "index.html"));
  const archivedWork = readPage(path.join(String(year), "work", "index.html"));

  expectMarkup(currentHomepage, `value="${archivedHomepageRoute}"`, "/");
  expectMarkup(currentWork, `value="${archivedWorkRoute}"`, "/work/");
  expectMarkup(
    archivedHomepage,
    `href="${archivedWorkRoute}"`,
    archivedHomepageRoute,
  );
  expectMarkup(
    archivedWork,
    `href="${archivedHomepageRoute}"`,
    archivedWorkRoute,
  );
  expectMarkup(archivedHomepage, 'value="/"', archivedHomepageRoute);
  expectMarkup(archivedWork, 'value="/work/"', archivedWorkRoute);

  if (
    archivedHomepage.includes("data-current-course-link") ||
    archivedHomepage.includes(`>Current ${config.year}<`)
  ) {
    failures.push(
      `Legacy current-year navigation found in ${archivedHomepageRoute}`,
    );
  }
}

if (failures.length > 0) {
  console.error("Year navigation verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Verified year navigation for current ${config.year}` +
    (archivedYears.length > 0
      ? ` and archives ${archivedYears.join(", ")}.`
      : "."),
);
