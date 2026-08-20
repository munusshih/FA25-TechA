const normaliseYears = (currentYear, archivedYears = []) => [
  currentYear,
  ...archivedYears.filter((year) => year !== currentYear).sort((a, b) => b - a),
];

export const getYearHref = (year, currentYear, context = "site") => {
  if (context === "work") {
    return year === currentYear ? "/work/" : `/${year}/work/`;
  }

  return year === currentYear ? "/" : `/${year}/`;
};

export const getYearOptions = ({
  currentYear,
  archivedYears = [],
  context = "site",
}) =>
  normaliseYears(currentYear, archivedYears).map((year) => ({
    year,
    href: getYearHref(year, currentYear, context),
    label: year === currentYear ? `${year} (Current)` : String(year),
  }));

const escapeAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const renderYearSwitcher = ({
  currentYear,
  archivedYears = [],
  selectedYear = currentYear,
  context = "site",
}) => {
  const selectId = `year-switcher-${context}-${selectedYear}`;
  const options = getYearOptions({ currentYear, archivedYears, context })
    .map(
      ({ year, href, label }) =>
        `<option value="${escapeAttribute(href)}"${
          year === selectedYear ? " selected" : ""
        }>${escapeAttribute(label)}</option>`,
    )
    .join("");

  return `<div class="year-switcher" data-year-switcher><label class="year-switcher__control"><span class="year-switcher__label">Select year</span><select class="year-switcher__select" id="${escapeAttribute(
    selectId,
  )}" name="year" aria-label="Switch course year" data-year-switcher-select>${options}</select></label></div>`;
};
