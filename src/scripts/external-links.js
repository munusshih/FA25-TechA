document.addEventListener("DOMContentLoaded", () => {
  const siteHost = window.location.hostname;

  document.querySelectorAll("a[href]").forEach((link) => {
    try {
      const url = new URL(link.href, window.location.origin);
      if (url.hostname !== siteHost) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    } catch {
      // Ignore invalid URLs (like anchors "#id")
    }
  });
});
