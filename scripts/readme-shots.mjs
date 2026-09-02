import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve('docs/screenshots');
const app = 'http://127.0.0.1:5173';
const story = 'http://127.0.0.1:6006';

await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 1440, height: 920 },
	deviceScaleFactor: 2,
	colorScheme: 'light'
});
const page = await context.newPage();

async function ready(url) {
	await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(400);
}

async function shot(locator, file, pad = 28) {
	await locator.scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);
	const box = await locator.boundingBox();
	if (!box) throw new Error(`missing ${file}`);
	const vp = page.viewportSize();
	const x = Math.max(0, box.x - pad);
	const y = Math.max(0, box.y - pad);
	await page.screenshot({
		path: resolve(out, file),
		animations: 'disabled',
		clip: {
			x,
			y,
			width: Math.min(vp.width - x, box.width + pad * 2),
			height: Math.min(vp.height - y, box.height + pad * 2)
		}
	});
	console.log('wrote', file);
}

await ready(`${app}/`);
await shot(page.locator('.folio-shelf'), 'sien.png', 36);

const rail = page.locator('.complete-shelf, .cover-rail').first();
await rail.waitFor();
const block = page.locator('section.folio-block').filter({ has: rail });
await shot(block, 'police.png', 24);

await ready(`${app}/books`);
await page.locator('a.slip').first().waitFor();
const first = await page.locator('a.slip').nth(0).boundingBox();
const last = await page.locator('a.slip').nth(5).boundingBox();
if (!first || !last) throw new Error('catalog slips missing');
await page.screenshot({
	path: resolve(out, 'katalog.png'),
	animations: 'disabled',
	clip: {
		x: Math.max(0, first.x - 16),
		y: Math.max(0, first.y - 16),
		width: first.width + 32,
		height: last.y + last.height - first.y + 32
	}
});
console.log('wrote katalog.png');

await ready(`${app}/login`);
await page.locator('#email').fill('maria.kovacova@spst.sk');
await shot(page.locator('section.pass'), 'preukaz.png', 40);

async function storyShot(id, file, pick) {
	const url = `${story}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`;
	await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(500);
	const loc = pick(page);
	await loc.waitFor({ timeout: 15000 });
	await shot(loc, file, 36);
}

await storyShot('fond-borrowslip--otvorený', 'listok.png', (p) => p.locator('.borrow-slip'));
await storyShot('pult-pultledger--zásuvka', 'pult.png', (p) => p.locator('.pult-drawer'));

await browser.close();
console.log('done');
