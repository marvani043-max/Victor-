// Local preview server for the Peak Side Shopify theme.
//   npm run dev  →  http://localhost:4173
// Renders theme/ with LiquidJS and mock data, and emulates the Shopify endpoints the theme calls:
// cart AJAX API, Section Rendering API, storefront filtering, product recommendations, contact/customer forms.
// Everything Shopify-only (checkout, email delivery, inventory, analytics) is simulated and labelled.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  ROOT, THEME, createEngine, readSchema, resolveSettings, allProducts, buildProduct, findRaw, findVariant,
  buildCollection, COLLECTION_DEFS, PAGE_DEFS, POLICY_DEFS, menu, applyFilters, sortProducts, SORT_OPTIONS, imageObj, money,
} from './shopify.mjs';

const PORT = Number(process.env.PORT || 4173);
const engine = createEngine();
const carts = new Map(); // cookie id → { items: [{ variantId, quantity }], note }
const submissions = [];

const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.png': 'image/png', '.json': 'application/json' };

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const settingsSchema = () => readJSON(path.join(THEME, 'config/settings_schema.json'));
const settingsData = () => readJSON(path.join(THEME, 'config/settings_data.json')).current;

/* ------------------------------------------------------------------ cart */
function cartFor(req, res) {
  const cookie = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]));
  let id = cookie.ps_cart;
  if (!id || !carts.has(id)) {
    id = crypto.randomUUID();
    carts.set(id, { items: [], note: '' });
    res.setHeader('Set-Cookie', `ps_cart=${id}; Path=/; SameSite=Lax`);
  }
  return carts.get(id);
}
function cartObject(cart) {
  const items = cart.items.map((it, i) => {
    const found = findVariant(it.variantId);
    const product = buildProduct(found.raw, it.variantId);
    const v = found.variant;
    const colorMedia = product.media.find((m) => m.alt.toLowerCase().startsWith(v.option1.toLowerCase())) || product.media[0];
    return {
      key: `${v.id}:${i}`, id: v.id, variant_id: v.id, product_id: product.id, product, variant: v, title: `${product.title} - ${v.title}`,
      product_title: product.title, variant_title: v.title, quantity: it.quantity, price: v.price, final_price: v.price, line_price: v.price * it.quantity,
      final_line_price: v.price * it.quantity, url: `${product.url}?variant=${v.id}`, image: colorMedia?.preview_image || null, handle: product.handle,
      options_with_values: [{ name: 'Color', value: v.option1 }, { name: 'Size', value: v.option2 }],
    };
  });
  return {
    items, item_count: items.reduce((n, i) => n + i.quantity, 0), total_price: items.reduce((n, i) => n + i.final_line_price, 0),
    note: cart.note, currency: { iso_code: 'USD' }, requires_shipping: items.length > 0,
  };
}
const cartJSON = (c) => ({
  token: 'preview', note: c.note, item_count: c.item_count, total_price: c.total_price, currency: 'USD',
  items: c.items.map((i) => ({ key: i.key, id: i.id, variant_id: i.variant_id, product_id: i.product_id, title: i.title, product_title: i.product_title, variant_title: i.variant_title, quantity: i.quantity, price: i.price, final_line_price: i.final_line_price, url: i.url, handle: i.handle })),
});

/* ------------------------------------------------------------- rendering */
class Renderer {
  constructor(req, url, cart, extra = {}) {
    this.req = req; this.url = url; this.cart = cart; this.extra = extra;
    this.products = allProducts(extra.selected || {});
    this.byHandle = Object.fromEntries(this.products.map((p) => [p.handle, p]));
    const params = url.searchParams;
    this.collections = COLLECTION_DEFS.map((def) => buildCollection(def, this.products, { params, main: def.handle === extra.mainCollection }));
    this.collections.forEach((c) => { this.collections[c.handle] = c; });
    this.pages = Object.fromEntries(PAGE_DEFS.map((p) => [p.handle, { ...p, url: `/pages/${p.handle}`, id: p.handle.length }]));
    this.lookup = {
      collection: (h) => this.collections[h] || null,
      product: (h) => this.byHandle[h] || null,
      page: (h) => this.pages[h] || null,
      menu: (h) => menu(h, url.pathname),
    };
  }
  globals() {
    const settings = resolveSettings(settingsSchema().flatMap((g) => g.settings || []), settingsData(), this.lookup);
    const policies = POLICY_DEFS.map((p) => ({ ...p, url: `/policies/${p.handle}`, body: '' }));
    return {
      shop: {
        name: 'Peak Side', url: `http://localhost:${PORT}`, money_format: '${{amount}}', description: 'Hoodies, tees and crop tops from Reno, Nevada.',
        customer_accounts_enabled: true, policies, refund_policy: policies[1], password_message: '',
      },
      routes: {
        root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', search_url: '/search', account_url: '/account',
        all_products_collection_url: '/collections/all', product_recommendations_url: '/recommendations/products', collections_url: '/collections',
      },
      request: { locale: { iso_code: 'en' }, page_type: this.extra.pageType, path: this.url.pathname, design_mode: false, origin: `http://localhost:${PORT}` },
      template: { name: this.extra.templateName || this.extra.pageType, suffix: null },
      settings, cart: cartObject(this.cart), collections: this.collections, all_products: this.byHandle,
      localization: { available_countries: [{ iso_code: 'US', name: 'United States', currency: { iso_code: 'USD', symbol: '$' } }], country: { iso_code: 'US' } },
      linklists: { 'main-menu': menu('main-menu', this.url.pathname), footer: menu('footer', this.url.pathname) },
      canonical_url: `http://localhost:${PORT}${this.url.pathname}`, page_title: this.extra.pageTitle || 'Peak Side', page_description: this.extra.pageDescription || '',
      current_page: Number(this.url.searchParams.get('page') || 1), current_tags: null, page_image: this.extra.pageImage || null,
      customer: null, content_for_header: SHOPIFY_STUB,
      __formState: this.extra.formState || null, __request: { url: this.url.pathname + this.url.search, page: this.url.searchParams.get('page') },
      __renderer: this,
      ...this.extra.objects,
    };
  }
  async renderSection(type, id, data = {}) {
    const file = path.join(THEME, 'sections', `${type}.liquid`);
    const src = fs.readFileSync(file, 'utf8');
    const schema = readSchema(src);
    const settings = resolveSettings(schema.settings, data.settings || {}, this.lookup);
    const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
    const order = data.block_order || Object.keys(data.blocks || {});
    const blocks = order.map((bid) => {
      const b = data.blocks[bid];
      return { id: bid, type: b.type, settings: resolveSettings(blockDefs[b.type]?.settings, b.settings || {}, this.lookup), shopify_attributes: '' };
    });
    const section = { id, settings, blocks, shopify_attributes: '', block_order: order };
    const html = await engine.parseAndRender(src, { section }, { globals: this.globals() });
    return `<div id="shopify-section-${id}" class="shopify-section${schema.class ? ` ${schema.class}` : ''}">${html}</div>`;
  }
  async renderGroup(name) {
    const group = readJSON(path.join(THEME, 'sections', `${name}.json`));
    let out = `<!-- BEGIN sections: ${name} -->`;
    for (const key of group.order) out += await this.renderSection(group.sections[key].type, `sections--preview__${key}`, group.sections[key]);
    return `${out}<!-- END sections: ${name} -->`;
  }
  templateFile(name) {
    const p = path.join(THEME, 'templates', `${name}.json`);
    if (fs.existsSync(p)) return p;
    return path.join(THEME, 'templates', `${name.split('.')[0]}.json`);
  }
  async renderTemplate(name, onlySection) {
    const tpl = readJSON(this.templateFile(name));
    if (onlySection) {
      for (const key of tpl.order) {
        const id = `template--preview__${key}`;
        if (id === onlySection) return this.renderSection(tpl.sections[key].type, id, tpl.sections[key]);
      }
      if (onlySection === 'cart-drawer') return this.renderSection('cart-drawer', 'cart-drawer', {});
      return null;
    }
    let content = '';
    for (const key of tpl.order) content += await this.renderSection(tpl.sections[key].type, `template--preview__${key}`, tpl.sections[key]);
    const layout = fs.readFileSync(path.join(THEME, 'layout', `${tpl.layout || 'theme'}.liquid`), 'utf8');
    let html = await engine.parseAndRender(layout, { content_for_layout: content }, { globals: this.globals() });
    if (process.env.PREVIEW_BANNER !== '0') html = html.replace(/<body([^>]*)>/, `<body$1>${BANNER}`);
    return html;
  }
}

const BANNER = `<div data-preview-banner role="region" aria-label="Preview notice" style="background:#FBF0DC;color:#7A4A00;font:600 12px/1.4 'Overpass Mono',monospace;padding:6px 16px;text-align:center;border-bottom:1px solid #7A4A00">LOCAL PREVIEW of the Peak Side Shopify theme · mock data · checkout, emails and analytics are simulated</div>`;
// Stands in for Shopify's analytics loader so theme events can be observed in the preview.
const SHOPIFY_STUB = `<script>window.Shopify=window.Shopify||{};Shopify.analytics={publish:function(n,d){(window.__shopifyEvents=window.__shopifyEvents||[]).push({name:n,data:d});}};</script>`;

/* ----------------------------------------------------------------- routes */
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const buf = Buffer.concat(chunks);
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) return JSON.parse(buf.toString() || '{}');
  if (type.includes('multipart/form-data')) {
    const boundary = type.split('boundary=')[1];
    const out = {};
    for (const part of buf.toString('utf8').split(`--${boundary}`)) {
      const m = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }
  return Object.fromEntries(new URLSearchParams(buf.toString()));
}

function send(res, status, body, type = 'text/html; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function pageFor(url) {
  const p = url.pathname.replace(/\/$/, '') || '/';
  if (p === '/') return { pageType: 'index', template: 'index', pageTitle: 'Peak Side', pageDescription: 'Hoodies, tees and crop tops for days that start on a trail and end in town. Based in Reno, Nevada.' };
  let m;
  if ((m = p.match(/^\/(?:collections\/[\w-]+\/)?products\/([\w-]+)$/))) {
    const raw = findRaw(m[1]);
    if (!raw) return null;
    const product = buildProduct(raw, url.searchParams.get('variant'));
    return { pageType: 'product', template: 'product', pageTitle: product.title, pageDescription: product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160), product, selected: { [product.handle]: url.searchParams.get('variant') }, pageImage: product.featured_image };
  }
  if ((m = p.match(/^\/collections\/([\w-]+)$/))) {
    const def = COLLECTION_DEFS.find((c) => c.handle === m[1]);
    if (!def) return null;
    return { pageType: 'collection', template: 'collection', mainCollection: def.handle, pageTitle: def.title, pageDescription: def.description.replace(/<[^>]+>/g, '') };
  }
  if (p === '/collections') return { pageType: 'list-collections', template: 'list-collections', pageTitle: 'Collections' };
  if ((m = p.match(/^\/pages\/([\w-]+)$/))) {
    const page = PAGE_DEFS.find((x) => x.handle === m[1]);
    if (!page) return null;
    return { pageType: 'page', template: page.template_suffix ? `page.${page.template_suffix}` : 'page', templateName: 'page', pageTitle: page.title, page };
  }
  if (p === '/search') return { pageType: 'search', template: 'search', pageTitle: 'Search' };
  if (p === '/cart') return { pageType: 'cart', template: 'cart', pageTitle: 'Your bag' };
  return null;
}

function searchObject(url, products) {
  const terms = (url.searchParams.get('q') || '').trim();
  if (!terms) return { performed: false, terms: '', results: [], results_count: 0, filters: [], sort_options: SORT_OPTIONS, url: '/search' };
  const words = terms.toLowerCase().split(/\s+/);
  const hits = products.filter((p) => words.every((w) => `${p.title} ${p.type} ${p.tags.join(' ')} ${p.description}`.toLowerCase().includes(w.replace(/s$/, ''))));
  const { filtered, filters } = applyFilters(hits, url.searchParams, `/search`);
  const sorted = sortProducts(filtered, url.searchParams.get('sort_by') || 'relevance');
  return { performed: true, terms, results: sorted, results_count: sorted.length, products_count: sorted.length, filters, sort_options: [{ value: 'relevance', name: 'Relevance' }, ...SORT_OPTIONS.slice(1)], sort_by: url.searchParams.get('sort_by') || 'relevance', default_sort_by: 'relevance', url: '/search' };
}

async function renderPage(req, res, url, cart, formState, status = 200) {
  const info = pageFor(url);
  if (!info) {
    const r = new Renderer(req, url, cart, { pageType: '404', templateName: '404', pageTitle: 'Page not found' });
    return send(res, 404, await r.renderTemplate('404'));
  }
  const objects = {};
  const r = new Renderer(req, url, cart, { ...info, formState, objects });
  if (info.product) objects.product = r.byHandle[info.product.handle];
  if (info.mainCollection) objects.collection = r.collections[info.mainCollection];
  if (info.page) objects.page = r.pages[info.page.handle];
  if (info.pageType === 'search') objects.search = searchObject(url, r.products);
  if (info.pageType === 'list-collections') objects.collections = r.collections;
  objects.recommendations = { 'performed?': false, products: [], products_count: 0 };

  const sectionId = url.searchParams.get('section_id');
  if (sectionId) {
    const html = await r.renderTemplate(info.template, sectionId);
    return html ? send(res, 200, html) : send(res, 404, 'Section not found');
  }
  const sections = url.searchParams.get('sections');
  if (sections) {
    const out = {};
    for (const id of sections.split(',')) out[id] = await r.renderTemplate(info.template, id);
    return send(res, 200, JSON.stringify(out), 'application/json');
  }
  return send(res, status, await r.renderTemplate(info.template));
}

async function sectionsFor(req, url, cart, ids, sectionsUrl) {
  const out = {};
  const pageUrl = new URL(sectionsUrl || '/', url);
  for (const id of [].concat(ids || []).flatMap((s) => String(s).split(',')).filter(Boolean)) {
    const info = pageFor(pageUrl) || pageFor(new URL('/', url));
    const objects = { recommendations: { 'performed?': false, products: [] } };
    const r = new Renderer(req, pageUrl, cart, { ...info, objects });
    if (info.product) objects.product = r.byHandle[info.product.handle];
    out[id] = await r.renderTemplate(info.template, id);
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;
    // Static assets
    if (p.startsWith('/assets/') || p.startsWith('/images/')) {
      const base = p.startsWith('/assets/') ? path.join(THEME, 'assets') : path.join(ROOT, 'dev/images');
      const file = path.join(base, path.basename(p));
      if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream', { 'Cache-Control': 'public, max-age=60' });
    }
    if (p === '/favicon.ico') return send(res, 204, '');
    const cart = cartFor(req, res);

    if (req.method === 'GET' && p === '/cart.js') return send(res, 200, JSON.stringify(cartJSON(cartObject(cart))), 'application/json');

    if (req.method === 'POST' && (p === '/cart/add.js' || p === '/cart/add')) {
      const body = await readBody(req);
      const found = findVariant(body.id);
      const qty = Math.max(1, Number(body.quantity || 1));
      if (!found) return send(res, 404, JSON.stringify({ status: 404, message: 'Cart Error', description: 'Cannot find variant' }), 'application/json');
      if (!found.variant.available) {
        return send(res, 422, JSON.stringify({ status: 422, message: 'Cart Error', description: `The product '${found.raw.def.title} - ${found.variant.title}' is already sold out.` }), 'application/json');
      }
      const existing = cart.items.find((i) => String(i.variantId) === String(found.variant.id));
      if (existing) existing.quantity += qty; else cart.items.push({ variantId: found.variant.id, quantity: qty });
      if (p === '/cart/add') { res.writeHead(302, { Location: '/cart' }); return res.end(); }
      const c = cartObject(cart);
      const line = c.items.find((i) => String(i.variant_id) === String(found.variant.id));
      const out = { ...cartJSON({ ...c, items: [line] }).items[0] };
      if (body.sections) out.sections = await sectionsFor(req, url, cart, body.sections, body.sections_url);
      return send(res, 200, JSON.stringify(out), 'application/json');
    }

    if (req.method === 'POST' && (p === '/cart/change.js' || p === '/cart/change')) {
      const body = await readBody(req);
      const idx = Number(body.line) - 1;
      if (!cart.items[idx]) return send(res, 400, JSON.stringify({ status: 400, message: 'Cart Error', description: 'No item at that line.' }), 'application/json');
      const q = Math.max(0, Number(body.quantity));
      if (q === 0) cart.items.splice(idx, 1); else cart.items[idx].quantity = q;
      const out = cartJSON(cartObject(cart));
      if (body.sections) out.sections = await sectionsFor(req, url, cart, body.sections, body.sections_url);
      return send(res, 200, JSON.stringify(out), 'application/json');
    }

    if (req.method === 'POST' && p === '/cart') {
      const body = await readBody(req);
      if (body.note !== undefined) cart.note = body.note;
      if ('checkout' in body) return send(res, 200, `<!doctype html><meta charset="utf-8"><title>Checkout (preview)</title><body style="font-family:system-ui;padding:40px;max-width:640px"><h1>Checkout is Shopify's</h1><p>On the live store this button opens Shopify's hosted checkout. The local preview stops here: no payment is taken and no order is created.</p><p><a href="/cart">Back to the bag</a></p>`);
      res.writeHead(302, { Location: '/cart' }); return res.end();
    }

    if (req.method === 'POST' && p === '/contact') {
      const body = await readBody(req);
      const type = body.form_type === 'customer' ? 'customer' : 'contact';
      const email = (body['contact[email]'] || '').trim();
      const referer = new URL(req.headers.referer || '/', url);
      const errors = {};
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Email can't be blank or is invalid.";
      if (Object.keys(errors).length) {
        referer.search = '';
        return renderPage(req, res, referer, cart, { type, success: false, errors, values: { email, body: body['contact[body]'], name: body['contact[name]'] } });
      }
      submissions.push({ at: new Date().toISOString(), type, fields: body });
      console.log(`[preview] ${type} form received (simulated, nothing sent):`, JSON.stringify(body));
      referer.search = type === 'customer' ? '?customer_posted=true' : '?contact_posted=true';
      res.writeHead(302, { Location: referer.pathname + referer.search });
      return res.end();
    }

    if (req.method === 'GET' && p === '/__submissions') return send(res, 200, JSON.stringify(submissions), 'application/json');

    if (req.method === 'GET' && p === '/recommendations/products') {
      const raw = findRaw(r0(url.searchParams.get('product_id')));
      const limit = Number(url.searchParams.get('limit') || 4);
      const r = new Renderer(req, url, cart, { pageType: 'product', objects: {} });
      const self = raw ? r.byHandle[raw.def.handle] : null;
      const related = r.products.filter((x) => x !== self && x.available).sort((a, b) => (b.type === self?.type) - (a.type === self?.type)).slice(0, limit);
      r.extra.objects.recommendations = { 'performed?': true, products: related, products_count: related.length };
      r.extra.objects.product = self;
      const tpl = readJSON(path.join(THEME, 'templates/product.json'));
      const key = tpl.order.find((k) => tpl.sections[k].type === 'product-recommendations');
      return send(res, 200, await r.renderSection('product-recommendations', url.searchParams.get('section_id') || `template--preview__${key}`, tpl.sections[key]));
    }

    if (p.startsWith('/policies/') || p === '/account' || p === '/checkout') {
      const title = p === '/account' ? 'Customer accounts' : (POLICY_DEFS.find((x) => p.endsWith(x.handle))?.title || 'Not found');
      const r = new Renderer(req, url, cart, { pageType: 'page', templateName: 'page', pageTitle: title, objects: {} });
      r.extra.objects.page = { title, content: `<div class="placeholder-note"><span class="placeholder-note__flag mono">Shopify admin</span>${p === '/account' ? 'Customer accounts are provided by Shopify (Settings → Customer accounts).' : 'Policy text is written and published in Shopify admin → Settings → Policies. It is not part of the theme and must reflect Peak Side’s real practices (draft, needs review).'}</div>` };
      return send(res, 200, await r.renderTemplate('page'));
    }

    if (req.method === 'GET') {
      const posted = url.searchParams.get('contact_posted') ? { type: 'contact', success: true } : url.searchParams.get('customer_posted') ? { type: 'customer', success: true } : null;
      return renderPage(req, res, url, cart, posted);
    }
    send(res, 405, 'Method not allowed', 'text/plain');
  } catch (err) {
    console.error(err);
    send(res, 500, `<pre>${String(err.stack || err).replace(/</g, '&lt;')}</pre>`);
  }
});

function r0(productId) {
  const n = Number(productId);
  const all = allProducts();
  return all.find((p) => p.id === n)?.handle;
}

server.listen(PORT, () => console.log(`Peak Side theme preview: http://localhost:${PORT}`));
