# E2E tests

Playwright suite covering the storefront end to end, against a real running app (real Neon DB, real Clerk, real Polar — this project has no mock/sandbox mode).

## What's covered

- Browsing the catalog, opening a product, adding it to the cart, and confirming it persists to the cart page across a real page load (not just in-memory state).
- Checkout is gated behind sign-in — a signed-out visitor sees a sign-in prompt, not the shipping form.

## What's deliberately not covered, and why

Completing a real purchase needs a signed-in account and a real Polar payment. Automating those isn't something this suite does:

- **Sign-in**: there's no test/mock Clerk instance here — this project has one Clerk instance, and it's the production one. Clerk's usual E2E workaround (`+clerk_test` emails with a fixed OTP) only works against a *development* instance, so it doesn't apply.
- **Payment**: even with a signed-in session, actually completing checkout hands off to Polar's own hosted page. Driving a real card-entry flow there isn't something to automate from here — that's Polar's surface to test, not this app's.

If a dedicated test account (or a second, development-mode Clerk instance) becomes available, the natural next step is a second spec that signs in via [`@clerk/testing`](https://clerk.com/docs/testing/playwright) and drives the flow through to the Polar redirect — verifying our own checkout-session creation without needing to complete an actual payment.

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
