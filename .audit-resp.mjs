import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const base = 'http://127.0.0.1:5173';
const routes = ['/', '/discover', '/holdings', '/books', '/departments', '/authors', '/login', '/docs', '/loans'];
const widths = [320, 390, 768];

const browser = await chromium.launch();
const report = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  for (const route of routes) {
    const url = base + route;
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(350);
      const info = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowX = Math.ceil(doc.scrollWidth - doc.clientWidth);
        const offenders = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 8 && r.right > window.innerWidth + 2;
          })
          .slice(0, 8)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 80),
              w: Math.round(r.width),
              right: Math.round(r.right)
            };
          });
        return {
          title: document.title,
          overflowX,
          scrollW: doc.scrollWidth,
          clientW: doc.clientWidth,
          offenders
        };
      });
      const shot = `/tmp/spst-resp/${width}${route.replaceAll('/', '_') || '_home'}.png`;
      await page.screenshot({ path: shot, fullPage: false });
      report.push({ width, route, status: res?.status(), ...info, shot });
    } catch (err) {
      report.push({ width, route, error: String(err) });
    }
  }
  await context.close();
}

writeFileSync('/tmp/spst-resp/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
