// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import selfie from "astro-selfie";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const archivedHomepageDevRoutes = {
  name: "archived-homepage-dev-routes",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const archivedHomepage = requestUrl.pathname.match(/^\/(\d{4})\/$/);

      if (archivedHomepage) {
        const year = archivedHomepage[1];
        const snapshot = path.join(projectRoot, "public", year, "index.html");

        if (fs.existsSync(snapshot)) {
          request.url = `/${year}/index.html${requestUrl.search}`;
        }
      }

      next();
    });
  },
};

export default defineConfig({
  site: "https://tech-a.designfuture.space",
  integrations: [
    mdx(),
    !process.env["CI"] && !process.env["VERCEL"] && selfie(),
  ].filter(Boolean),

  vite: {
    plugins: [archivedHomepageDevRoutes, tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"), // ✅ alias @ to src
      },
    },
  },
});
