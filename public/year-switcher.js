const initialiseYearSwitchers = () => {
  document.querySelectorAll("[data-year-switcher]").forEach((switcher) => {
    if (switcher.dataset.yearSwitcherReady === "true") return;

    const select = switcher.querySelector("[data-year-switcher-select]");
    if (!select) return;

    select.addEventListener("change", () => {
      const destination = select.value;
      if (destination) window.location.assign(destination);
    });
    switcher.dataset.yearSwitcherReady = "true";
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseYearSwitchers);
} else {
  initialiseYearSwitchers();
}

document.addEventListener("astro:page-load", initialiseYearSwitchers);
