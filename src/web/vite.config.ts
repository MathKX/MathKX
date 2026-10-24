/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The service listens on 5080 in development (src/backend/MathKX.Api/Properties/launchSettings.json);
// MATHKX_API_URL overrides it.
const apiUrl = process.env.MATHKX_API_URL ?? "http://localhost:5080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": { target: apiUrl, changeOrigin: true } },
  },
  build: { outDir: "dist" },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    css: false,
  },
});
