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

  test("429 status page uses Slovak copy", async ({ page }) => {
    await page.goto("/429");
    await expect(
      page.getByRole("heading", { name: /Spomaľ na chvíľu/i }),
    ).toBeVisible();
    await expect(page.getByText(/limit požiadaviek/i)).toBeVisible();
  });
});

test.describe("gateway smoke (optional)", () => {
  test("gateway /health responds when stack is up", async ({ request }) => {
    const gatewayURL =
      process.env.PLAYWRIGHT_GATEWAY_URL ?? "http://localhost:5200";
    const requireGateway = process.env.PLAYWRIGHT_REQUIRE_GATEWAY === "1";

    let live;
    try {
      live = await request.get(`${gatewayURL}/health`, { timeout: 3_000 });
    } catch {
      test.skip(!requireGateway, `Gateway not reachable at ${gatewayURL}`);
      throw new Error(`Gateway not reachable at ${gatewayURL}`);
    }

    expect(live.ok()).toBeTruthy();

    const ready = await request.get(`${gatewayURL}/health/ready`, {
      timeout: 5_000,
    });
    // Ready may be 503 if Book/Booking are down — endpoint must exist.
    expect([200, 503]).toContain(ready.status());
  });
});