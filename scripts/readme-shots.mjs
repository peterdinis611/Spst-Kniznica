import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve('docs/screenshots');
const app = 'http://127.0.0.1:5173';
const story = 'http://127.0.0.1:6006';

await mkdir(out, { recursive: true });

async function alive(url) {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		return res.status < 500;
	} catch {
		return false;
	}
}

if (!(await alive(app))) {
	throw new Error(`Fond nebeží na ${app}. Najprv bun run db:up a bun run dev.`);
}
if (!(await alive(story))) {
	throw new Error(`Storybook nebeží na ${story}. Najprv bun run storybook.`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 1440, height: 920 },
	deviceScaleFactor: 2,
	colorScheme: 'light'
});
const page = await context.newPage();

async function ready(url) {
	const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
	const status = res?.status() ?? 0;
	if (status >= 400) throw new Error(`${url} → ${status}`);
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(450);
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

async function band(file, { top = 0, height = 780 } = {}) {
	const vp = page.viewportSize();
	await page.screenshot({
		path: resolve(out, file),
		animations: 'disabled',
		clip: {
			x: 0,
			y: top,
			width: vp.width,
			height: Math.min(height, vp.height - top)
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

await ready(`${app}/discover`);
await page.locator('[data-tour="featured"]').waitFor();
await shot(page.locator('[data-tour="featured"]'), 'objavovat.png', 20);

await ready(`${app}/departments`);
await page.locator('ol li').first().waitFor();
const deptFirst = await page.locator('ol li').nth(0).boundingBox();
const deptLast = await page.locator('ol li').nth(1).boundingBox();
if (!deptFirst || !deptLast) throw new Error('departments missing');
{
	const vp = page.viewportSize();
	await page.screenshot({
		path: resolve(out, 'odbory.png'),
		animations: 'disabled',
		clip: {
			x: Math.max(0, deptFirst.x - 24),
			y: Math.max(0, deptFirst.y - 24),
			width: Math.min(vp.width - 32, deptFirst.width + 48),
			height: Math.min(vp.height - 32, deptLast.y + deptLast.height - deptFirst.y + 48)
		}
	});
	console.log('wrote odbory.png');
}

await ready(`${app}/authors`);
await page.locator('a[href*="/authors/"]').first().waitFor();
await band('autori.png', { top: 72, height: 720 });

await ready(`${app}/books/book-algoritmy`);
await page.locator('article').first().waitFor();
await shot(page.locator('article').first(), 'kniha.png', 28);

await ready(`${app}/docs`);
await page.locator('.handbook-spread, .handbook').first().waitFor();
await band('prirucka.png', { height: 820 });

await ready(`${app}/login`);
await page.locator('#email').fill('maria.kovacova@spst.sk');
await shot(page.locator('section.pass'), 'preukaz.png', 40);

await ready(`${app}/login?mod=novy`);
await page.locator('#name').fill('Mária Kováčová');
await page.locator('#email').fill('maria.kovacova@spst.sk');
await shot(page.locator('section.pass'), 'novy.png', 40);

async function storyShot(id, file, pick, pad = 36) {
	const url = `${story}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`;
	await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(500);
	const loc = pick(page);
	await loc.waitFor({ timeout: 15000 });
	await shot(loc, file, pad);
}

await storyShot('fond-borrowslip--otvorený', 'listok.png', (p) => p.locator('.borrow-slip'));
await storyShot('pult-pultledger--zásuvka', 'pult.png', (p) => p.locator('.pult-drawer'));
await storyShot('fond-catalogsearch--náhľad', 'hladanie.png', (p) => p.locator('.search-panel'), 24);
await storyShot('pult-pultnav--kartotéka', 'kartoteka.png', (p) => p.locator('.pult-tabs'), 28);
await storyShot('fond-fundledger--register', 'register.png', (p) => p.locator('.folios'), 24);

await browser.close();
console.log('done');
