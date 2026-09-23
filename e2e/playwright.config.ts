import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  // Only needed for the authenticated-checkout spec (fetches a Clerk testing
  // token used to bypass Cloudflare Turnstile bot protection in that test) —
  // harmless no-op for the rest of the suite when Clerk env vars aren't set.
  globalSetup: process.env.CLERK_SECRET_KEY ? "./global-setup.ts" : undefined,
  // Vite's dev server (and the backend's tsx watch process) transform/compile
  // on demand and serialize under concurrent load — running specs in
  // parallel against them caused real flakiness (timeouts, elements not
  // found) that had nothing to do with the app itself. All specs also share
  // one real backend + database, so sequential execution avoids that
  // contention and any future cross-test interference. Small suite, so the
  // time cost of not parallelizing is negligible.
  fullyParallel: false,
  workers: 1,
  // Default 30s is tight for the authenticated spec (password sign-in + a
  // second-factor email-code screen on top of everything the guest specs
  // do), especially against a local dev server rather than an optimized CI
  // one — observed timing out on total-test-time, not any single assertion.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Default 5s is tight against a local Vite dev server (transforms on
  // demand, no production build/caching) — observed occasional real
  // first-load rendering taking longer than that, not an app bug. Individual
  // assertions after slower flows (sign-in, checkout) override this further.
  expect: { timeout: 10_000 },
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
