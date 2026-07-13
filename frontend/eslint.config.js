import js from "@eslint/js";
import tseslintParser from "@typescript-eslint/parser";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  navigator: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  clearTimeout: "readonly",
  clearInterval: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  URL: "readonly",
  Blob: "readonly",
  Event: "readonly",
  CustomEvent: "readonly",
  KeyboardEvent: "readonly",
  MouseEvent: "readonly",
  HTMLTextAreaElement: "readonly",
  HTMLDivElement: "readonly",
  HTMLInputElement: "readonly",
  HTMLElement: "readonly",
  HTMLButtonElement: "readonly",
  HTMLSelectElement: "readonly",
  HTMLPreElement: "readonly",
  HTMLStyleElement: "readonly",
  HTMLSpanElement: "readonly",
  HTMLCanvasElement: "readonly",
  Node: "readonly",
  getComputedStyle: "readonly",
  matchMedia: "readonly",
  alert: "readonly",
  fetch: "readonly",
  crypto: "readonly",
  performance: "readonly",
  ClipboardEvent: "readonly",
  InputEvent: "readonly",
  localStorage: "readonly",
};

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: tseslintParser,
      globals: browserGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslintPlugin,
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-undef": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "wailsjs/"],
  },
];
