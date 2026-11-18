import { test, expect } from "@playwright/test";

test.describe("admin shell", () => {
  test("admin route shows shell chrome or auth gate", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();

    await expect(
      page
        .getByText(/Správa|Admin|prihlás|Entra|bez prístupu|Nie si prihlásený/i)
        .first(),
    ).toBeVisible({ timeout: 45_000 });
  });
});
