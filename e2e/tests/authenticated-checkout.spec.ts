import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

// Covers what the guest-shopping spec explicitly leaves out: a real signed-in
// session. Needs E2E_TEST_EMAIL/E2E_TEST_PASSWORD plus CLERK_PUBLISHABLE_KEY/
// CLERK_SECRET_KEY (see e2e/README.md) — a dedicated test account using
// Clerk's `+clerk_test` convention (fixed OTP `424242`, only works against a
// *development* Clerk instance, which this project's is: pk_test_/sk_test_).
// setupClerkTestingToken() bypasses the Cloudflare Turnstile bot-protection
// challenge that otherwise silently blocks a scripted sign-in/sign-up.
//
// Stops at the redirect to Polar's hosted checkout page rather than driving
// Polar's own card-entry form — that verifies our own checkout-session
// creation end to end without completing a real payment.
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Authenticated checkout flow", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — see e2e/README.md",
  );

  test("signed-in customer can reach the Polar checkout page", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");

    await page.getByRole("button", { name: /^sign in$/i }).first().click();
    await page.locator('input[name="identifier"]').fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await page.getByRole("button", { name: /^continue$/i }).click();

    // Clerk treats a fresh browser context as a new, unrecognized device and
    // asks for a one-time email code as a second factor even though the
    // password just checked out — fill it with the fixed `+clerk_test` code
    // when it shows up. isVisible() alone doesn't poll like a real assertion
    // (it's a single snapshot), so use expect(...).toBeVisible() to actually
    // wait out the screen transition, and treat a timeout as "not shown".
    const codeField = page.getByRole("textbox", { name: /verification code/i });
    const needsSecondFactor = await expect(codeField)
      .toBeVisible({ timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (needsSecondFactor) {
      // The code input renders (and reports itself focused/active) slightly
      // before Clerk's backend has actually finished sending the code —
      // filling immediately can race ahead of that and hit "you need to send
      // a verification code before attempting to verify" (seen under
      // parallel test load). Clerk's UI doesn't expose a more precise
      // readiness signal than this, so give the send call a moment to land.
      await page.waitForTimeout(1500);
      // Clerk's OTP input auto-submits once all 6 digits are filled, so
      // there's no separate "Continue" click to make here.
      await codeField.fill("424242");
    }

    // The navbar's permanent "Sign in" button is replaced by Clerk's
    // UserButton avatar once signed in — its disappearance is a simple,
    // implementation-agnostic proxy for "sign-in succeeded".
    await expect(page.getByRole("button", { name: /^sign in$/i })).toHaveCount(0, {
      timeout: 15000,
    });

    await page.locator('a.card-title[href^="/product/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByRole("button", { name: /added to cart/i })).toBeVisible();

    await page.goto("/checkout");
    const checkoutMain = page.getByRole("main");
    // Extra room beyond the global default while the cart's product details
    // are still being fetched (CartSkeleton shows until then).
    await expect(checkoutMain.getByLabel(/full name/i)).toBeVisible({ timeout: 15000 });

    // Only fill fields not already pre-filled from a saved/default address —
    // this account may already have one from a previous run.
    async function fillIfEmpty(label: RegExp, value: string) {
      const field = checkoutMain.getByLabel(label);
      if ((await field.inputValue()) === "") await field.fill(value);
    }
    await fillIfEmpty(/full name/i, "Playwright Test");
    await fillIfEmpty(/^phone/i, "01000000000");
    await fillIfEmpty(/address line 1/i, "1 Test Street");
    await fillIfEmpty(/^city/i, "Cairo");
    await fillIfEmpty(/governorate/i, "Cairo");
    await fillIfEmpty(/^country/i, "Egypt");

    await checkoutMain.getByRole("button", { name: /continue to payment/i }).click();

    // waitUntil: "commit" — we only care that the redirect happened, not
    // that Polar's own external page finished loading (its default "load"
    // wait hung in testing, unrelated to anything this app controls).
    await page.waitForURL(/polar\.sh/i, { timeout: 20000, waitUntil: "commit" });
  });
});
