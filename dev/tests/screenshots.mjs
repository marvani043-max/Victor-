// Captures reference screenshots of the local preview into docs/screenshots/ (JPEG, 1x, preview banner visible).
//   npm run screenshots
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const PORT = 4198, B = `http://localhost:${PORT}`;
const server = spawn(process.execPath, ['dev/server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('preview') && r()));
fs.mkdirSync('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
const shoot = async (name, url, viewport, { full = false, act } = {}) => {
  const page = await browser.newPage({ viewport });
  await page.goto(B + url, { waitUntil: 'networkidle' });
  if (full) { const H = await page.evaluate(() => document.body.scrollHeight); for (let y = 0; y < H; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(40); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForLoadState('networkidle'); }
  if (act) await act(page);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `docs/screenshots/${name}.jpg`, type: 'jpeg', quality: 78, fullPage: full });
  await page.close();
};
const desk = { width: 1440, height: 900 }, phone = { width: 390, height: 844 };
await shoot('01-home-desktop', '/', desk, { full: true });
await shoot('02-home-mobile', '/', phone, { full: true });
await shoot('03-explorer-pink-worn', '/', desk, { act: async (p) => { await p.locator('garment-explorer label.swatch-option').nth(1).click(); await p.locator('garment-explorer [data-view-btn="worn"]').click(); } });
await shoot('04-product-desktop', '/products/double-zip-hoodie', desk, { act: async (p) => { await p.locator('label.swatch-option--lg', { hasText: 'Navy Blue' }).click(); await p.locator('[data-marker="1"]:visible').first().click(); } });
await shoot('05-product-mobile', '/products/off-shoulder-crop-top-black', phone, { full: true });
await shoot('06-sold-out-restock', '/products/heavyweight-double-zip-up-navy', desk);
await shoot('07-collection-filters', '/collections/all?filter.v.option.size=XL&filter.p.m.custom.fit_profile=boxy', desk);
await shoot('08-filter-drawer-mobile', '/collections/all', phone, { act: async (p) => p.locator('[data-facets-open]').click() });
await shoot('09-cart-drawer', '/products/summer-edition-tee-white', phone, { act: async (p) => { await p.locator('[data-add-button]').click(); await p.locator('#CartDrawer[open]').waitFor(); } });
await shoot('10-fit-guide', '/pages/fit-guide', desk, { full: true });
await browser.close();
server.kill();
console.log('Screenshots written to docs/screenshots/');
