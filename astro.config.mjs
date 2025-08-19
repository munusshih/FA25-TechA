// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import selfie from "astro-selfie";

export default defineConfig({
  site: "https://tech-a.designfuture.space",
  integrations: [
    mdx(),
    !process.env["CI"] && !process.env["VERCEL"] && selfie(),
  ].filter(Boolean),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"), // ✅ alias @ to src
      },
    },
  },
});
