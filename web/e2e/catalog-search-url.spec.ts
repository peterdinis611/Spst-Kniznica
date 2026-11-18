import { test, expect } from "@playwright/test";

test.describe("catalog search URL", () => {
  test("search query persists in URL when catalog loads", async ({ page }) => {
    await page.goto("/books?search=motor");

    const catalogHeading = page.getByRole("heading", {
      name: /Knižný fond/i,
    });
    const offlineHeading = page.getByRole("heading", {
      name: /Katalóg kníh nedostupný|API brána neodpovedá|Služba dočasne mimo/i,
    });
    await expect(catalogHeading.or(offlineHeading)).toBeVisible({
      timeout: 45_000,
    });

    test.skip(
      !(await catalogHeading.isVisible()),
      "Catalog shell requires API — skip search URL assert when offline",
    );

    await expect(page).toHaveURL(/search=motor/);

    const searchbox = page.getByRole("searchbox", {
      name: /Vyhľadávanie v katalógu/i,
    });
    await expect(searchbox).toBeVisible();
    await expect(searchbox).toHaveValue(/motor/i);
  });
});
