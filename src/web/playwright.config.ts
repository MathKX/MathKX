import { defineConfig, devices } from "@playwright/test";

// The service serves the built app from wwwroot (dotnet build copies src/web/dist there).
// Build first: `npm run build && dotnet build ../backend/MathKX.Api`.
const baseURL = process.env.MATHKX_E2E_URL ?? "http://localhost:5080";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "ipad", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: false } },
  ],
  ...(process.env.MATHKX_E2E_URL
    ? {}
    : {
        webServer: {
          command: "dotnet run --project ../backend/MathKX.Api --no-build --urls http://localhost:5080",
          url: "http://localhost:5080/api/health",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
