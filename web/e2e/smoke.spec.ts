import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("books page shows catalog chrome or offline Slovak copy", async ({
    page,
  }) => {
    await page.goto("/books");

    const catalogHeading = page.getByRole("heading", {
      name: /Knižný fond/i,
    });
    const offlineHeading = page.getByRole("heading", {
      name: /Katalóg kníh nedostupný/i,
    });

    await expect(catalogHeading.or(offlineHeading)).toBeVisible({
      timeout: 45_000,
    });

    if (await catalogHeading.isVisible()) {
      await expect(page.getByText("Katalóg", { exact: false }).first()).toBeVisible();
      await expect(
        page.getByRole("searchbox", { name: /Vyhľadávanie v katalógu/i }),
      ).toBeVisible();
    }
  });

  test("401 status page uses Slovak copy", async ({ page }) => {
    await page.goto("/401");
    await expect(
      page.getByRole("heading", { name: /Nie si prihlásený/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/školským účtom \(Entra\)/i),
    ).toBeVisible();
  });

  test("404 status page uses Slovak copy", async ({ page }) => {
    await page.goto("/404");
    await expect(
      page.getByRole("heading", { name: /Stránka neexistuje/i }),
    ).toBeVisible();
    await expect(page.getByText(/katalógu SPST/i)).toBeVisible();
  });
});