import { test, expect } from "@playwright/test";

// Covers the one flow every visitor hits regardless of who they are:
// browse the catalog, open a product, add it to the cart, see it persist
// to the cart page, and confirm checkout is properly gated behind sign-in
// rather than silently failing. Deliberately stops there — completing a
// real purchase needs a signed-in account and a real Polar payment,
// neither of which this suite can responsibly fake (see e2e/README.md).
test.describe("Guest shopping flow", () => {
  test("browse, open a product, add to cart, see it persist on the cart page", async ({ page }) => {
    await page.goto("/");

    // CatalogProductCard wraps both the photo AND a separate name link in
    // a[href^="/product/"] — the photo's own anchor has no text of its
    // own, but the category badge sits inside it, so an unscoped
    // a[href^="/product/"] locator can just as easily match that (its
    // "text" would be the category, not the product name). .card-title is
    // specifically the name link.
    const firstProductLink = page.locator('a.card-title[href^="/product/"]').first();
    await expect(firstProductLink).toBeVisible();
    const productName = (await firstProductLink.textContent())?.trim();
    expect(productName).toBeTruthy();

    await firstProductLink.click();
    await expect(page).toHaveURL(/\/product\/.+/);
    await expect(page.getByRole("heading", { name: productName!, exact: true })).toBeVisible();

    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByRole("button", { name: /added to cart/i })).toBeVisible();

    // Reloading via the cart URL directly (not clicking the nav link) also
    // proves the cart survives a fresh page load, not just in-memory SPA
    // state — it's backed by localStorage (store/cart.js).
    await page.goto("/cart");
    await expect(page.getByRole("link", { name: productName!, exact: true })).toBeVisible({
      timeout: 15000,
    });
  });

  test("checkout is gated behind sign-in instead of failing silently", async ({ page }) => {
    await page.goto("/");

    await page.locator('a.card-title[href^="/product/"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    await page.goto("/checkout");
    // Scoped to <main> — the navbar has its own permanent "Sign in" button
    // whenever anyone's signed out, so an unscoped locator matches both.
    const checkoutMain = page.getByRole("main");
    await expect(checkoutMain.getByText(/sign in to continue to checkout/i)).toBeVisible();
    await expect(checkoutMain.getByRole("button", { name: /^sign in$/i })).toBeVisible();
    // The shipping form itself must not render at all for a signed-out
    // visitor — this is the exact gap fixed alongside this test (the full
    // form used to render regardless, only failing after submission).
    await expect(page.getByLabel(/full name/i)).toHaveCount(0);
  });
});
