import { test, expect } from "@playwright/test";

test.describe("HTTP status pages", () => {
  test("502 page uses Slovak gateway copy", async ({ page }) => {
    await page.goto("/502");
    await expect(
      page.getByRole("heading", { name: /API brána neodpovedá/i }),
    ).toBeVisible();
    await expect(page.getByText(/port 5200/i)).toBeVisible();
  });

  test("503 page uses Slovak service-unavailable copy", async ({ page }) => {
    await page.goto("/503");
    await expect(
      page.getByRole("heading", { name: /Služba dočasne mimo/i }),
    ).toBeVisible();
    await expect(page.getByText(/údržba alebo výpadok/i)).toBeVisible();
  });
});
