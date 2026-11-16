import { test, expect } from "@playwright/test";

test.describe("catalog URL filters", () => {
  test("year and language query appear in filter chips when catalog loads", async ({
    page,
  }) => {
    await page.goto("/books?year=2018&lang=en");

    const catalogHeading = page.getByRole("heading", {
      name: /Knižný fond/i,
    });
    const offlineHeading = page.getByRole("heading", {
      name: /Katalóg kníh nedostupný/i,
    });
    await expect(catalogHeading.or(offlineHeading)).toBeVisible({
      timeout: 45_000,
    });

    test.skip(
      !(await catalogHeading.isVisible()),
      "Catalog shell requires API — skip filter chips when offline",
    );

    await expect(page).toHaveURL(/year=2018/);
    await expect(page).toHaveURL(/lang=en/);
    await expect(page.getByRole("link", { name: /Rok 2018/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Angličtina/i })).toBeVisible();
  });
});