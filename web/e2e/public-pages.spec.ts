import { test, expect } from "@playwright/test";

test.describe("public pages chrome", () => {
  test("home page loads brand or catalog entry", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/knižnic|SPST|katalóg/i).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  test("authors page loads catalog or gateway-offline status", async ({
    page,
  }) => {
    await page.goto("/authors");
    await expect(page.locator("body")).toBeVisible();
    // Online: Autori fondu. Offline API: 502/503 status page or error boundary.
    await expect(
      page.getByRole("heading", {
        name: /Autori fondu|Autori nedostupní|API brána neodpovedá|Služba dočasne mimo/i,
      }),
    ).toBeVisible({ timeout: 45_000 });
  });

  test("categories page loads catalog or gateway-offline status", async ({
    page,
  }) => {
    await page.goto("/categories");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Žánre a rady|nedostupn|API brána neodpovedá|Služba dočasne mimo/i,
      }),
    ).toBeVisible({ timeout: 45_000 });
  });

  test("bookings page loads shell or gateway-offline status", async ({
    page,
  }) => {
    await page.goto("/bookings");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page
        .getByRole("heading", {
          name: /výpožič|rezerv|API brána neodpovedá|Služba dočasne mimo/i,
        })
        .or(page.getByText(/výpožič|rezerv|prihlás/i).first()),
    ).toBeVisible({ timeout: 45_000 });
  });

  test("500 status page uses Slovak copy", async ({ page }) => {
    await page.goto("/500");
    await expect(
      page.getByRole("heading", { name: /Niečo sa pokazilo/i }),
    ).toBeVisible();
  });
});
