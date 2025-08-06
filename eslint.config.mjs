import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  // Apply recommended JS rules to all files
  js.configs.recommended,

  // Apply JSX A11y rules to JS/JSX files
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        performance: "readonly",
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },

  // Apply Astro plugin recommended configs FIRST
  ...astro.configs.recommended,

  // THEN override specific rules for Astro files (this should come AFTER astro configs)
  {
    files: ["**/*.astro"],
    languageOptions: {
      globals: {
        // Browser globals for script tags in Astro files
        window: "readonly",
        document: "readonly",
        console: "readonly",
        performance: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        Event: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      // This MUST come after astro configs to override properly
      "no-undef": 0, // Using 0 instead of "off" to be explicit
    },
  },

  // Node.js script files
  {
    files: ["**/scripts/**/*.js", "**/*.config.js"],
    languageOptions: {
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
  },

  // Browser script files
  {
    files: ["**/public/**/*.js", "**/src/scripts/**/*.js"],
    languageOptions: {
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        performance: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        Event: "readonly",
      },
    },
  },

  // Optional: Ignore patterns (replaces .eslintignore)
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**", "build/**"],
  },
];
