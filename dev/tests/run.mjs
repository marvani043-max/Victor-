// End-to-end checks against the local preview server (real theme Liquid/CSS/JS, mock Shopify data).
//   npm test
// Writes dev/tests/results.json. These checks verify the theme's front-end behaviour; anything that
// depends on Shopify itself (checkout, email delivery, inventory, analytics ingestion) is out of scope here.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PORT = 4199;
const BASE = `http://localhost:${PORT}`;
const results = [];
const PRODUCT_HANDLES = (await import('../data/products.mjs')).PRODUCTS.map((p) => p.handle);

function record(group, name, ok, detail = '') {
  results.push({ group, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${group}] ${name}${detail ? ` — ${detail}` : ''}`);
}
async function check(group, name, fn) {
  try { const detail = await fn(); record(group, name, true, typeof detail === 'string' ? detail : ''); }
  catch (e) { record(group, name, false, e.message.split('\n')[0]); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const server = spawn(process.execPath, ['dev/server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 8000);
  server.stdout.on('data', (d) => { if (String(d).includes('preview')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

const browser = await chromium.launch();
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/nope')) page.errors.push(`${r.status()} ${r.url()}`); });
  return page;
};

const PAGES = ['/', '/collections/all', '/collections/hoodies', '/collections/summer-edition', '/collections', '/pages/fit-guide', '/pages/contact', '/pages/story', '/search?q=hoodie', '/cart', ...PRODUCT_HANDLES.map((h) => `/products/${h}`)];
const VIEWPORTS = [{ name: 'mobile 360', width: 360, height: 780 }, { name: 'tablet 768', width: 768, height: 1024 }, { name: 'desktop 1440', width: 1440, height: 900 }];

try {
  /* ---------------- Pages, overflow, console errors, image attributes ---------------- */
  for (const vp of VIEWPORTS) {
    const page = await newPage({ viewport: { width: vp.width, height: vp.height } });
    const problems = [];
    for (const url of PAGES) {
      page.errors = [];
      const res = await page.goto(BASE + url, { waitUntil: 'networkidle' });
      if (res.status() !== 200) problems.push(`${url} → ${res.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) problems.push(`${url} horizontal overflow ${overflow}px`);
      const badImgs = await page.evaluate(() => [...document.images].filter((i) => !i.hasAttribute('alt') || !i.getAttribute('width') || !i.getAttribute('height')).map((i) => i.src.split('/').pop()));
      if (badImgs.length) problems.push(`${url} images missing alt/width/height: ${badImgs.slice(0, 3).join(', ')}`);
      const h1 = await page.locator('h1').count();
      if (h1 !== 1) problems.push(`${url} has ${h1} h1 elements`);
      if (page.errors.length) problems.push(`${url} console/network: ${page.errors.slice(0, 2).join(' | ')}`);
    }
    record('Layout', `${PAGES.length} pages at ${vp.name}: 200, no overflow, one h1, img alt+dimensions, no console errors`, problems.length === 0, problems.slice(0, 4).join('; '));
    await page.context().close();
  }

  await check('Layout', '404 page returns 404 with useful links', async () => {
    const page = await newPage();
    const res = await page.goto(`${BASE}/nope`);
    assert(res.status() === 404, `status ${res.status()}`);
    assert(await page.locator('a[href="/collections/all"]').count() > 0, 'no shop link');
    await page.context().close();
  });

  /* ---------------- Links ---------------- */
  await check('Links', 'All internal links resolve (no 4xx/5xx, no "#" placeholders)', async () => {
    const page = await newPage();
    const hrefs = new Set();
    for (const url of PAGES) {
      await page.goto(BASE + url);
      (await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))).forEach((h) => hrefs.add(h));
    }
    const bad = [];
    for (const h of hrefs) {
      if (h === '#') { bad.push('"#" link'); continue; }
      if (/^(mailto:|https?:\/\/(?!localhost))/.test(h) || h.startsWith('#')) continue;
      const r = await page.request.get(new URL(h, BASE).toString());
      if (r.status() >= 400) bad.push(`${h} → ${r.status()}`);
    }
    assert(bad.length === 0, bad.join(', '));
    await page.context().close();
    return `${hrefs.size} unique hrefs checked`;
  });

  /* ---------------- Accessibility (axe-core, WCAG 2.2 A/AA rules) ---------------- */
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    const page = await newPage({ viewport: { width: vp.width, height: vp.height } });
    const all = [];
    for (const url of ['/', '/collections/all', '/products/double-zip-hoodie', '/products/heavyweight-double-zip-up-navy', '/pages/fit-guide', '/pages/contact', '/cart', '/search?q=tee']) {
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: AXE });
      const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, target: v.nodes[0]?.target?.join(' ') })));
      r.forEach((v) => all.push(`${url}: ${v.id} (${v.impact}, ${v.n}) ${v.target}`));
    }
    record('Accessibility', `axe-core: 8 key pages at ${vp.name}, zero violations`, all.length === 0, all.slice(0, 6).join(' | '));
    await page.context().close();
  }

  await check('Accessibility', 'Skip link is the first Tab stop and moves focus to main content', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement.className);
    assert(first.includes('skip-link'), `first focus: ${first}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    const id = await page.evaluate(() => document.activeElement.id);
    assert(id === 'MainContent', `focus after skip: ${id}`);
    await page.context().close();
  });

  await check('Accessibility', 'Visible focus indicator on links, buttons and inputs', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const missing = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement; const cs = getComputedStyle(el);
        const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2;
        const shadow = cs.boxShadow && cs.boxShadow !== 'none';
        // custom-styled inputs show focus on a sibling (swatch / chip)
        const sib = el.matches('input') && el.nextElementSibling && getComputedStyle(el.nextElementSibling).outlineStyle !== 'none';
        return { ok: ring || shadow || sib, tag: el.tagName + '.' + el.className };
      });
      if (!info.ok) missing.push(info.tag);
    }
    assert(missing.length === 0, missing.join(', '));
  });

  /* ---------------- Garment Explorer (home) ---------------- */
  await check('Garment Explorer', 'Colour swatch swaps the photo set; unavailable views are hidden', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const ex = page.locator('garment-explorer').first();
    await ex.locator('label.swatch-option').nth(1).click();
    const color = await ex.locator('[data-slide][data-active]').getAttribute('data-color');
    assert(color === 'pink', `active colour ${color}`);
    assert(await ex.locator('[data-view-btn="back"]').isHidden(), 'Back should be hidden for pink (no back photo)');
    assert(await ex.locator('[data-view-btn="worn"]').isVisible(), 'Worn view should be offered for pink');
    assert((await ex.locator('[data-color-label]').textContent()).trim() === 'Pink', 'corner label not updated');
    await page.context().close();
  });

  await check('Garment Explorer', 'Detail markers and list stay in sync; list item switches view when needed', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const ex = page.locator('garment-explorer').first();
    await ex.locator('[data-slide][data-active] [data-marker="1"]').click();
    assert(await ex.locator('[data-detail="1"]').evaluate((el) => el.classList.contains('is-active')), 'list item 1 not active');
    assert((await ex.locator('[data-slide][data-active] [data-marker="1"]').getAttribute('aria-pressed')) === 'true', 'marker not pressed');
    await ex.locator('[data-detail-btn="4"]').click(); // "Clean back" lives on the back view
    assert((await ex.locator('[data-slide][data-active]').getAttribute('data-view')) === 'back', 'did not switch to back view');
    assert((await ex.locator('[data-view-btn="back"]').getAttribute('aria-pressed')) === 'true', 'Back button not pressed');
    await page.context().close();
  });

  await check('Garment Explorer', 'Keyboard: arrow keys move between views; markers are buttons with names', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const ex = page.locator('garment-explorer').first();
    await ex.locator('[data-view-btn="front"]').focus();
    await page.keyboard.press('ArrowRight');
    assert((await ex.locator('[data-slide][data-active]').getAttribute('data-view')) === 'back', 'ArrowRight did not switch to back');
    const focused = await page.evaluate(() => document.activeElement.dataset.viewBtn);
    assert(focused === 'back', `focus on ${focused}`);
    const name = await ex.locator('[data-slide][data-active] [data-marker]').first().getAttribute('aria-label');
    assert(/Detail \d+:/.test(name || ''), `marker name: ${name}`);
    await page.context().close();
  });

  await check('Garment Explorer', 'Zoom opens a modal dialog, Esc closes it and returns focus', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const btn = page.locator('garment-explorer [data-zoom]').first();
    await btn.click();
    assert(await page.locator('[data-zoom-dialog][open]').count() === 1, 'dialog not open');
    await page.keyboard.press('Escape');
    assert(await page.locator('[data-zoom-dialog][open]').count() === 0, 'dialog still open');
    const isBtn = await page.evaluate(() => document.activeElement.hasAttribute('data-zoom'));
    assert(isBtn, 'focus not returned to zoom button');
    await page.context().close();
  });

  /* ---------------- Product page ---------------- */
  await check('Product', 'Variant picker: colour updates explorer, price/stock text and URL', async () => {
    const page = await newPage();
    await page.goto(BASE + '/products/double-zip-hoodie');
    await page.locator('label.swatch-option--lg', { hasText: 'Navy Blue' }).click();
    const color = await page.locator('garment-explorer [data-slide][data-active]').getAttribute('data-color');
    assert(color === 'navy-blue', `explorer colour ${color}`);
    await page.locator('label.size-chip', { hasText: 'XL' }).first().click();
    assert(page.url().includes('variant='), 'URL not updated');
    const legend = (await page.locator('[data-option-value="2"]').textContent()).trim();
    assert(legend === 'XL', `size label ${legend}`);
    await page.context().close();
  });

  await check('Product', 'Add to bag: loading state, drawer opens only after confirmation, count updates; quantity and remove work', async () => {
    const page = await newPage();
    await page.goto(BASE + '/products/summer-edition-tee-white');
    await page.locator('label.size-chip', { hasText: 'M' }).first().click();
    const add = page.locator('[data-add-button]');
    const [busy] = await Promise.all([add.evaluate((b) => new Promise((res) => { const o = new MutationObserver(() => { if (b.getAttribute('aria-busy') === 'true') { o.disconnect(); res(true); } }); o.observe(b, { attributes: true }); setTimeout(() => res(false), 3000); })), add.click()]);
    assert(busy, 'no aria-busy loading state');
    await page.locator('#CartDrawer[open]').waitFor({ timeout: 4000 });
    assert((await page.locator('[data-cart-count]').first().textContent()).trim() === '1', 'bag count not 1');
    assert(await page.locator('#CartDrawer .cart-line').count() === 1, 'no line in drawer');
    assert((await page.locator('#CartDrawer [data-cart-status]').textContent()).includes('Added'), 'no confirmation text');
    await page.locator('#CartDrawer [data-qty-plus]').click();
    await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent.trim() === '2', null, { timeout: 4000 });
    await page.locator('#CartDrawer [data-line-remove]').click();
    await page.waitForFunction(() => document.querySelector('#CartDrawer .drawer__empty'), null, { timeout: 4000 });
    await page.keyboard.press('Escape');
    assert(await page.locator('#CartDrawer[open]').count() === 0, 'drawer did not close on Esc');
    await page.context().close();
  });

  await check('Product', 'Sold-out product: button disabled with text, restock form shown; server rejects sold-out adds', async () => {
    const page = await newPage();
    await page.goto(BASE + '/products/heavyweight-double-zip-up-navy');
    const add = page.locator('[data-add-button]');
    assert(await add.isDisabled(), 'add button enabled');
    assert((await add.textContent()).includes('Sold out'), 'no sold-out text');
    assert(await page.locator('[data-restock]').isVisible(), 'restock form hidden');
    const r = await page.request.post(`${BASE}/cart/add.js`, { multipart: { id: String(await page.locator('[data-variant-id]').inputValue()), quantity: '1' } });
    assert(r.status() === 422, `sold-out add returned ${r.status()}`);
    await page.context().close();
  });

  await check('Product', 'Mobile: sticky buy bar appears after the main button scrolls away', async () => {
    const page = await newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/products/off-shoulder-crop-top-black');
    assert(await page.locator('[data-sticky-buy]').isHidden(), 'visible before scrolling');
    await page.locator('.product__media .explorer__details').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert(await page.locator('[data-sticky-buy]').isVisible(), 'sticky bar not shown');
    await page.context().close();
  });

  await check('Product', 'Size guide opens as a dialog with the fit scale and brand fit note', async () => {
    const page = await newPage();
    await page.goto(BASE + '/products/off-shoulder-crop-top-white');
    await page.locator('[data-size-guide-open]').click();
    const dlg = page.locator('[data-size-guide][open]');
    assert(await dlg.count() === 1, 'not open');
    assert((await dlg.textContent()).includes('size down'), 'fit note missing');
    await page.keyboard.press('Escape');
    await page.context().close();
  });

  /* ---------------- Forms ---------------- */
  await check('Forms', 'Restock form: inline error on bad email; success only after the (simulated) Shopify response', async () => {
    const page = await newPage();
    await page.goto(BASE + '/products/heavyweight-double-zip-up-grey');
    const email = page.locator('#RestockForm-template--preview__main-email');
    await email.fill('not-an-email');
    await page.locator('#Restock [data-submit]').click();
    assert((await email.getAttribute('aria-invalid')) === 'true', 'no aria-invalid');
    assert(await page.locator('#RestockForm-template--preview__main-email-error').isVisible(), 'no error text');
    assert(page.url().indexOf('contact_posted') === -1, 'submitted despite error');
    await email.fill('shopper@example.com');
    await Promise.all([page.waitForNavigation(), page.locator('#Restock [data-submit]').click()]);
    assert(page.url().includes('contact_posted=true'), 'no Shopify-style redirect');
    assert(await page.locator('#Restock .form-status--success').isVisible(), 'no success message');
    await page.waitForLoadState('load');
    await page.waitForTimeout(200);
    const focused = await page.evaluate(() => document.activeElement.classList.contains('form-status'));
    assert(focused, 'confirmation not focused');
    await page.context().close();
  });

  await check('Forms', 'Contact form: required fields validated client-side and server-side', async () => {
    const page = await newPage();
    await page.goto(BASE + '/pages/contact');
    await page.locator('#ContactForm [data-submit]').click();
    assert(await page.locator('#ContactForm-email-error').isVisible(), 'email error missing');
    assert(await page.locator('#ContactForm-body-error').isVisible(), 'message error missing');
    assert((await page.evaluate(() => document.activeElement.id)) === 'ContactForm-email', 'focus not moved to first error');
    // bypass client validation to check the server path renders errors
    const res = await page.request.post(`${BASE}/contact`, { form: { form_type: 'contact', 'contact[email]': 'bad', 'contact[body]': 'hello there' }, headers: { referer: `${BASE}/pages/contact` } });
    assert((await res.text()).includes('form-status--error'), 'server errors not rendered');
    await page.locator('#ContactForm-email').fill('shopper@example.com');
    await page.locator('#ContactForm-body').fill('Does the boxy tee run large?');
    await Promise.all([page.waitForNavigation(), page.locator('#ContactForm [data-submit]').click()]);
    assert(await page.locator('#ContactForm .form-status--success').isVisible(), 'no success');
    await page.context().close();
  });

  await check('Forms', 'Newsletter: separate marketing consent text; success only after response', async () => {
    const page = await newPage();
    await page.goto(BASE + '/pages/story');
    assert((await page.locator('#NewsletterConsent').textContent()).includes('marketing emails'), 'consent text missing');
    await page.locator('#NewsletterEmail').fill('x');
    await page.locator('#NewsletterForm [data-submit]').click();
    assert(await page.locator('#NewsletterEmail-error').isVisible(), 'no error');
    await page.locator('#NewsletterEmail').fill('fan@example.com');
    await Promise.all([page.waitForNavigation(), page.locator('#NewsletterForm [data-submit]').click()]);
    assert(page.url().includes('customer_posted=true'), 'no customer_posted');
    assert(await page.locator('#NewsletterForm .form-status--success').isVisible(), 'no success');
    await page.context().close();
  });

  /* ---------------- Filters ---------------- */
  await check('Filters', 'Filtering updates grid without reload, announces count, adds removable chip, updates URL', async () => {
    const page = await newPage();
    await page.goto(BASE + '/collections/all');
    await page.evaluate(() => { window.__noReload = true; });
    await page.locator('label.facet-option', { hasText: 'Out of stock' }).click();
    await page.waitForFunction(() => document.querySelector('[data-count]').textContent.includes('3 products'));
    assert(await page.evaluate(() => window.__noReload === true), 'full page reload happened');
    assert(page.url().includes('filter.v.availability=0'), `url ${page.url()}`);
    assert(await page.locator('.product-grid--collection > li').count() === 3, 'grid not filtered');
    await page.waitForFunction(() => document.getElementById('LiveRegion').textContent.includes('3 products'), null, { timeout: 2000 });
    await page.locator('.active-filters .chip', { hasText: 'Out of stock' }).click();
    await page.waitForFunction(() => document.querySelector('[data-count]').textContent.includes('15 products'));
    await page.selectOption('#SortBy-template--preview__main', 'price-ascending');
    await page.waitForFunction(() => location.search.includes('sort_by=price-ascending'));
    const first = (await page.locator('.card__title').first().textContent()).trim();
    assert(first.includes('Crop Top'), `first after price sort: ${first}`);
    await page.goBack();
    await page.waitForFunction(() => !location.search.includes('price-ascending'));
    await page.waitForFunction(() => document.querySelector('[data-count]').textContent.includes('15 products'));
    await page.context().close();
  });

  await check('Filters', 'Mobile filter drawer: opens as a dialog, traps focus, Esc closes and returns focus', async () => {
    const page = await newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/collections/all');
    await page.locator('[data-facets-open]').click();
    const drawer = page.locator('[data-facets-drawer]');
    assert((await drawer.getAttribute('aria-modal')) === 'true', 'not modal');
    for (let i = 0; i < 60; i++) await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement.closest('[data-facets-drawer]'));
    assert(inside, 'focus escaped the drawer');
    await page.locator('label.facet-option--chip', { hasText: 'XL' }).first().click();
    await page.waitForFunction(() => location.search.includes('filter.v.option.size=XL'));
    assert(await drawer.evaluate((d) => d.classList.contains('is-open')), 'drawer closed after filtering');
    await page.keyboard.press('Escape');
    assert(!(await drawer.evaluate((d) => d.classList.contains('is-open'))), 'drawer still open');
    assert(await page.evaluate(() => document.activeElement.hasAttribute('data-facets-open')), 'focus not returned');
    await page.context().close();
  });

  /* ---------------- Navigation ---------------- */
  await check('Navigation', 'Mobile menu: dialog opens, aria-expanded updates, Esc closes and returns focus', async () => {
    const page = await newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/');
    const btn = page.locator('[data-menu-open]');
    await btn.click();
    assert(await page.locator('#MenuDrawer[open]').count() === 1, 'menu not open');
    assert((await btn.getAttribute('aria-expanded')) === 'true', 'aria-expanded not true');
    assert(await page.locator('#MenuDrawer .menu-drawer__link', { hasText: 'Fit guide' }).isVisible(), 'links not visible');
    await page.keyboard.press('Escape');
    assert(await page.locator('#MenuDrawer[open]').count() === 0, 'menu still open');
    await page.waitForFunction(() => document.querySelector('[data-menu-open]').getAttribute('aria-expanded') === 'false', null, { timeout: 1000 }).catch(() => { throw new Error('aria-expanded not reset'); });
    assert(await page.evaluate(() => document.activeElement.hasAttribute('data-menu-open')), 'focus not returned');
    await page.context().close();
  });

  await check('Navigation', 'Header search panel opens and focuses the field; search returns results', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    await page.locator('[data-search-open]').click();
    assert(await page.evaluate(() => document.activeElement.id === 'HeaderSearch'), 'search field not focused');
    await page.keyboard.type('crop');
    await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
    assert(await page.locator('.product-grid--collection > li').count() === 3, 'expected 3 crop tops');
    await page.context().close();
  });

  /* ---------------- Home interactions ---------------- */
  await check('Fit finder', 'Choosing a cut shows its explanation and matching products', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    await page.locator('label.fit-choice', { hasText: 'Cropped' }).click();
    const panel = page.locator('[data-fit-panel="cropped"]');
    assert(await panel.isVisible(), 'panel hidden');
    assert(await panel.locator('.mini-card').count() === 3, 'expected 3 cropped pieces');
    assert(await page.locator('[data-fit-panel="oversized"]').isHidden(), 'previous panel still visible');
    await page.context().close();
  });

  await check('Trail & Town', 'Marker opens a product card; Esc closes it; list under photo always present', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const marker = page.locator('[data-look-marker]').first();
    await marker.scrollIntoViewIfNeeded();
    await marker.click();
    assert((await marker.getAttribute('aria-expanded')) === 'true', 'not expanded');
    const card = page.locator(`#${await marker.getAttribute('aria-controls')}`);
    assert(await card.isVisible(), 'card hidden');
    await page.keyboard.press('Escape');
    assert(await card.isHidden(), 'card still visible');
    assert(await page.locator('.look__list li').count() >= 6, 'product lists missing');
    await page.context().close();
  });

  /* ---------------- Motion ---------------- */
  await check('Motion', 'prefers-reduced-motion: durations become 0 and explorer swaps instantly', async () => {
    const page = await newPage({ reducedMotion: 'reduce' });
    await page.goto(BASE + '/');
    const d = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dur-3').trim());
    assert(d === '0ms', `--dur-3 = ${d}`);
    const t = await page.locator('garment-explorer [data-slide][data-active]').first().evaluate((el) => getComputedStyle(el).animationDuration);
    assert(/^0s$/.test(t), `slide animation ${t}`);
    assert((await page.locator('[data-motion-btn]').getAttribute('aria-pressed')) === 'true', 'toggle does not reflect OS setting');
    await page.context().close();
  });

  await check('Motion', 'Site motion toggle: sets data-motion, persists across pages', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    await page.locator('[data-motion-btn]').click();
    assert((await page.evaluate(() => document.documentElement.dataset.motion)) === 'reduce', 'not set');
    await page.goto(BASE + '/collections/all');
    assert((await page.evaluate(() => document.documentElement.dataset.motion)) === 'reduce', 'not persisted');
    assert((await page.locator('[data-motion-btn]').getAttribute('aria-pressed')) === 'true', 'toggle state wrong');
    await page.context().close();
  });

  /* ---------------- Analytics events ---------------- */
  await check('Analytics', 'Interactions publish named custom events through Shopify.analytics.publish', async () => {
    const page = await newPage();
    await page.goto(BASE + '/');
    const ex = page.locator('garment-explorer').first();
    await ex.locator('label.swatch-option').nth(1).click();
    await ex.locator('[data-view-btn="worn"]').click();
    await ex.locator('[data-detail-btn="2"]').click();
    await page.locator('label.fit-choice', { hasText: 'Boxy' }).click();
    const names = await page.evaluate(() => (window.__shopifyEvents || []).map((e) => e.name));
    for (const n of ['ps_explorer_colour_changed', 'ps_explorer_view_changed', 'ps_explorer_detail_opened', 'ps_fit_selected']) assert(names.includes(n), `missing ${n} (got ${names.join(',')})`);
    await page.context().close();
    return names.join(', ');
  });

  /* ---------------- Layout stability ---------------- */
  await check('Performance', 'Cumulative layout shift during load (measured, not a Lighthouse score)', async () => {
    const out = [];
    for (const url of ['/', '/products/double-zip-hoodie', '/collections/all']) {
      for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
        const page = await newPage({ viewport: { width: vp.width, height: vp.height } });
        await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
        await page.goto(BASE + url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        const cls = await page.evaluate(() => window.__cls);
        out.push(`${url} @${vp.width}: ${cls.toFixed(3)}`);
        await page.context().close();
        if (cls > 0.1) throw new Error(`CLS ${cls.toFixed(3)} on ${url} @${vp.width}`);
      }
    }
    return out.join('; ');
  });
} finally {
  await browser.close();
  server.kill();
  const passed = results.filter((r) => r.ok).length;
  fs.writeFileSync(path.resolve('dev/tests/results.json'), JSON.stringify({ ranAt: new Date().toISOString(), passed, failed: results.length - passed, results }, null, 2));
  console.log(`\n${passed}/${results.length} checks passed`);
  process.exitCode = passed === results.length ? 0 : 1;
}
