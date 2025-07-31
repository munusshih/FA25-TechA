// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  site: "https://tech-a.designfuture.space",
  integrations: [mdx()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"), // ✅ alias @ to src
      },
    },
  },
});
