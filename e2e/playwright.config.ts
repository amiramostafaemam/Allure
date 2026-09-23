import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Only spins up the app itself when E2E_BASE_URL isn't set — the backend
  // needs its own .env (real Clerk/Polar/Neon credentials, nothing this
  // suite provides), so these assume it's already configured the same way
  // `npm run dev` in backend/ already requires. Set E2E_BASE_URL instead to
  // point the suite at a server you're already running (or a deployed one).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "npm run dev",
          cwd: "../backend",
          port: 3001,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: "npm run dev",
          cwd: "../frontend",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      ],
});
