# E2E tests

Playwright suite covering the storefront end to end, against a real running app (real Neon DB, real Clerk, real Polar — this project has no mock/sandbox mode).

## What's covered

- **Guest shopping** (`guest-shopping.spec.ts`): browsing the catalog, opening a product, adding it to the cart, and confirming it persists to the cart page across a real page load (not just in-memory state). Checkout is gated behind sign-in — a signed-out visitor sees a sign-in prompt, not the shipping form.
- **Authenticated checkout** (`authenticated-checkout.spec.ts`, skipped unless configured — see below): signs in with a real account, adds a product to the cart, fills the shipping form, and confirms our own checkout-session creation works end to end by following the redirect to Polar's hosted checkout page.

## What's deliberately not covered, and why

Actually completing a purchase hands off to Polar's own hosted checkout page once a session is created. Driving a real card-entry flow there isn't something to automate from here — that's Polar's surface to test, not this app's. The authenticated spec stops at confirming the redirect happens.

## Running

Needs the backend's real `.env` configured the same way `npm run dev` in `backend/` already requires (Clerk, Polar, `DATABASE_URL`).

```bash
cd e2e
npm install
npx playwright install chromium   # first time only
npm test
```

By default this starts both `frontend` and `backend` dev servers itself. To point it at servers you're already running (or a deployed environment) instead, set `E2E_BASE_URL`:

```bash
E2E_BASE_URL=http://localhost:5173 npm test
```

## Enabling the authenticated spec

This project's Clerk instance is a *development* one (`pk_test_…`/`sk_test_…` in `frontend/.env`/`backend/.env`), which makes Clerk's testing conventions available — this wouldn't work against a production instance. Copy `.env.example` to `.env` inside `e2e/` and fill in:

- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — the same dev-instance keys the app itself uses. Used by `global-setup.ts` to fetch a Clerk testing token, which bypasses the Cloudflare Turnstile bot-protection challenge that would otherwise silently block a scripted sign-in.
- `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` — a **dedicated test account**, not a real user's credentials. Use Clerk's `+clerk_test` email convention (e.g. `you+clerk_test@example.com`) — any verification code screen it hits accepts the fixed code `424242` instead of a real emailed one, so the whole flow runs unattended. If the account doesn't exist yet, sign it up once through the site's normal "Sign up" flow (same fixed code applies there too) before pointing the test at it.

Without these vars set, `authenticated-checkout.spec.ts` skips itself (with a message saying why) and the rest of the suite runs as normal.

## Notes

- The suite runs with a single worker (`workers: 1`) rather than in parallel — Vite's dev server and the backend both compile/serialize on demand and showed real flakiness under concurrent load in testing (timeouts, elements briefly not found) that had nothing to do with the app. All specs also share one real backend and database, so sequential execution avoids that contention.
- Re-running the suite back-to-back several times in quick succession can hit Clerk's testing-token endpoint rate limit (`Failed to fetch testing token from Clerk API`) — this is specific to rapid manual iteration, not something normal single-run usage hits.
