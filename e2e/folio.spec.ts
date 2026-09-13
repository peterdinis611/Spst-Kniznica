import { expect, test } from '@playwright/test';

test('tik without a bearer stays 403', async ({ request }) => {
	const res = await request.get('/api/desk/tick');
	expect(res.status()).toBe(403);
});

test('search returns a short slip, not the whole register', async ({ request }) => {
	const res = await request.get('/api/search?q=algoritm');
	expect(res.ok()).toBeTruthy();
	const body = (await res.json()) as { items?: unknown[] };
	expect(Array.isArray(body.items)).toBeTruthy();
	expect(body.items?.length ?? 0).toBeLessThanOrEqual(8);
});

test('catalog page ships one leaf, not every zväzok', async ({ page }) => {
	await page.goto('/books');
	const slips = page.locator('a[href^="/books/"]');
	await expect(slips.first()).toBeVisible();
	expect(await slips.count()).toBeLessThanOrEqual(60);
});

test('order leaf is a card, not a dump of the register', async ({ page }) => {
	await page.goto('/books');
	await page.locator('a[href^="/books/"]').first().click();
	await expect(page.getByRole('heading').first()).toBeVisible();
	await expect(page.locator('body')).toContainText(/prihlás|požič|objednáv|voľn/i);
});
