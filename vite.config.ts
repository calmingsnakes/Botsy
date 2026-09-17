/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// GitHub Pages serves the repo at /<repo>/ — set VITE_BASE=/ for a custom domain or Cloudflare Pages.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/Botsy/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: here("./index.html"),
        app: here("./app/index.html"),
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
