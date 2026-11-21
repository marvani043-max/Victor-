// Environment-agnostic preview "store": routing, rendering and cart logic shared by
//   - dev/server.mjs (Node HTTP preview server)
//   - dev/artifact/entry.mjs (in-browser emulation for the static artifact preview)
// File access goes through node:fs / node:path, which the artifact build swaps for an in-memory bundle.
import fs from 'node:fs';
import path from 'node:path';
import {
  THEME, createEngine, readSchema, resolveSettings, allProducts, buildProduct, findRaw, findVariant,
  buildCollection, COLLECTION_DEFS, PAGE_DEFS, POLICY_DEFS, menu, applyFilters, sortProducts, SORT_OPTIONS,
} from './shopify.mjs';

export const DEFAULT_BANNER = `<div data-preview-banner role="region" aria-label="Preview notice" style="background:#FBF0DC;color:#7A4A00;font:600 12px/1.4 'Overpass Mono',monospace;padding:6px 16px;text-align:center;border-bottom:1px solid #7A4A00">LOCAL PREVIEW of the Peak Side Shopify theme · mock data · checkout, emails and analytics are simulated</div>`;
// Stands in for Shopify's analytics loader so theme events can be observed in the preview.
export const SHOPIFY_STUB = `<script>window.Shopify=window.Shopify||{};Shopify.analytics={publish:function(n,d){(window.__shopifyEvents=window.__shopifyEvents||[]).push({name:n,data:d});}};</script>`;

const config = { engine: null, origin: 'http://localhost:4173', banner: DEFAULT_BANNER, transform: (html) => html, demo: null };

// Local-preview-only template additions (photos for the lookbook and story). Deep-merged over the theme's templates.
const deepMerge = (base, extra) => {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra === undefined ? base : extra;
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(extra)) out[k] = deepMerge(out[k], v);
  return out;
};
export function configure(opts = {}) {
  Object.assign(config, opts);
  if (!config.engine) config.engine = createEngine(opts.engineOptions);
  return config;
}

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const settingsSchema = () => readJSON(path.join(THEME, 'config/settings_schema.json'));
const settingsData = () => readJSON(path.join(THEME, 'config/settings_data.json')).current;

/* ------------------------------------------------------------------ cart */
export const newCart = () => ({ items: [], note: '' });

export function cartObject(cart) {
  const items = cart.items.filter((it) => findVariant(it.variantId)).map((it, i) => {
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

export const cartJSON = (c) => ({
  token: 'preview', note: c.note, item_count: c.item_count, total_price: c.total_price, currency: 'USD',
  items: c.items.map((i) => ({ key: i.key, id: i.id, variant_id: i.variant_id, product_id: i.product_id, title: i.title, product_title: i.product_title, variant_title: i.variant_title, quantity: i.quantity, price: i.price, final_line_price: i.final_line_price, url: i.url, handle: i.handle })),
});

/* ------------------------------------------------------------- rendering */
export class Renderer {
  constructor(url, cart, extra = {}) {
    this.url = url; this.cart = cart; this.extra = extra;
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
        name: 'Peak Side', url: config.origin, money_format: '${{amount}}', description: 'Hoodies, tees and crop tops from Reno, Nevada.',
        customer_accounts_enabled: true, policies, refund_policy: policies[1], password_message: '',
      },
      routes: {
        root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', search_url: '/search', account_url: '/account',
        all_products_collection_url: '/collections/all', product_recommendations_url: '/recommendations/products', collections_url: '/collections',
      },
      request: { locale: { iso_code: 'en' }, page_type: this.extra.pageType, path: this.url.pathname, design_mode: false, origin: config.origin },
      template: { name: this.extra.templateName || this.extra.pageType, suffix: null },
      settings, cart: cartObject(this.cart), collections: this.collections, all_products: this.byHandle, pages: this.pages,
      localization: { available_countries: [{ iso_code: 'US', name: 'United States', currency: { iso_code: 'USD', symbol: '$' } }], country: { iso_code: 'US' } },
      linklists: { 'main-menu': menu('main-menu', this.url.pathname), footer: menu('footer', this.url.pathname) },
      canonical_url: `${config.origin}${this.url.pathname}`, page_title: this.extra.pageTitle || 'Peak Side', page_description: this.extra.pageDescription || '',
      current_page: Number(this.url.searchParams.get('page') || 1), current_tags: null, page_image: this.extra.pageImage || null,
      customer: null, content_for_header: SHOPIFY_STUB,
      __formState: this.extra.formState || null, __request: { url: this.url.pathname + this.url.search, page: this.url.searchParams.get('page') },
      __renderer: this,
      ...this.extra.objects,
    };
  }
  async renderSection(type, id, data = {}) {
    const src = fs.readFileSync(path.join(THEME, 'sections', `${type}.liquid`), 'utf8');
    const schema = readSchema(src);
    const settings = resolveSettings(schema.settings, data.settings || {}, this.lookup);
    const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
    const order = data.block_order || Object.keys(data.blocks || {});
    const blocks = order.map((bid) => {
      const b = data.blocks[bid];
      return { id: bid, type: b.type, settings: resolveSettings(blockDefs[b.type]?.settings, b.settings || {}, this.lookup), shopify_attributes: '' };
    });
    const section = { id, settings, blocks, shopify_attributes: '', block_order: order };
    const html = await config.engine.parseAndRender(src, { section }, { globals: this.globals() });
    return config.transform(`<div id="shopify-section-${id}" class="shopify-section${schema.class ? ` ${schema.class}` : ''}">${html}</div>`);
  }
  async renderGroup(name) {
    const group = readJSON(path.join(THEME, 'sections', `${name}.json`));
    let out = `<!-- BEGIN sections: ${name} -->`;
    for (const key of group.order) out += await this.renderSection(group.sections[key].type, `sections--preview__${key}`, group.sections[key]);
    return `${out}<!-- END sections: ${name} -->`;
  }
  readTemplate(name) {
    const tpl = readJSON(this.templateFile(name));
    return config.demo && config.demo[name] ? deepMerge(tpl, config.demo[name]) : tpl;
  }
  templateFile(name) {
    const p = path.join(THEME, 'templates', `${name}.json`);
    if (fs.existsSync(p)) return p;
    return path.join(THEME, 'templates', `${name.split('.')[0]}.json`);
  }
  async renderTemplate(name, onlySection) {
    const tpl = this.readTemplate(name);
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
    let html = await config.engine.parseAndRender(layout, { content_for_layout: content }, { globals: this.globals() });
    if (config.banner) html = html.replace(/<body([^>]*)>/, `<body$1>${config.banner}`);
    return config.transform(html);
  }
}

/* ----------------------------------------------------------------- routes */
export function pageFor(url) {
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

export function searchObject(url, products) {
  const terms = (url.searchParams.get('q') || '').trim();
  if (!terms) return { performed: false, terms: '', results: [], results_count: 0, filters: [], sort_options: SORT_OPTIONS, url: '/search' };
  const words = terms.toLowerCase().split(/\s+/);
  const hits = products.filter((p) => words.every((w) => `${p.title} ${p.type} ${p.tags.join(' ')} ${p.description}`.toLowerCase().includes(w.replace(/s$/, ''))));
  const { filtered, filters } = applyFilters(hits, url.searchParams, `/search`);
  const sorted = sortProducts(filtered, url.searchParams.get('sort_by') || 'relevance');
  return { performed: true, terms, results: sorted, results_count: sorted.length, products_count: sorted.length, filters, sort_options: [{ value: 'relevance', name: 'Relevance' }, ...SORT_OPTIONS.slice(1)], sort_by: url.searchParams.get('sort_by') || 'relevance', default_sort_by: 'relevance', url: '/search' };
}

const productIdToHandle = (productId) => allProducts().find((p) => p.id === Number(productId))?.handle;

/** Renders any GET route. Returns { status, type, body }. */
export async function renderGet(url, cart, formState = null) {
  const p = url.pathname;
  if (p === '/cart.js') return { status: 200, type: 'application/json', body: JSON.stringify(cartJSON(cartObject(cart))) };

  if (p === '/recommendations/products') {
    const raw = findRaw(productIdToHandle(url.searchParams.get('product_id')));
    const limit = Number(url.searchParams.get('limit') || 4);
    const r = new Renderer(url, cart, { pageType: 'product', objects: {} });
    const self = raw ? r.byHandle[raw.def.handle] : null;
    const related = r.products.filter((x) => x !== self && x.available).sort((a, b) => (b.type === self?.type) - (a.type === self?.type)).slice(0, limit);
    r.extra.objects.recommendations = { 'performed?': true, products: related, products_count: related.length };
    r.extra.objects.product = self;
    const tpl = readJSON(path.join(THEME, 'templates/product.json'));
    const key = tpl.order.find((k) => tpl.sections[k].type === 'product-recommendations');
    return { status: 200, type: 'text/html', body: await r.renderSection('product-recommendations', url.searchParams.get('section_id') || `template--preview__${key}`, tpl.sections[key]) };
  }

  if (p.startsWith('/policies/') || p === '/account' || p === '/checkout') {
    const title = p === '/account' ? 'Customer accounts' : (POLICY_DEFS.find((x) => p.endsWith(x.handle))?.title || 'Not found');
    const r = new Renderer(url, cart, { pageType: 'page', templateName: 'page', pageTitle: title, objects: {} });
    r.extra.objects.page = { title, content: `<div class="placeholder-note"><span class="placeholder-note__flag mono">Shopify admin</span>${p === '/account' ? 'Customer accounts are provided by Shopify (Settings → Customer accounts).' : 'Policy text is written and published in Shopify admin → Settings → Policies. It is not part of the theme and must reflect Peak Side’s real practices (draft, needs review).'}</div>` };
    return { status: 200, type: 'text/html', body: await r.renderTemplate('page') };
  }

  if (!formState) {
    formState = url.searchParams.get('contact_posted') ? { type: 'contact', success: true } : url.searchParams.get('customer_posted') ? { type: 'customer', success: true } : null;
  }
  const info = pageFor(url);
  if (!info) {
    const r = new Renderer(url, cart, { pageType: '404', templateName: '404', pageTitle: 'Page not found' });
    return { status: 404, type: 'text/html', body: await r.renderTemplate('404') };
  }
  const objects = {};
  const r = new Renderer(url, cart, { ...info, formState, objects });
  if (info.product) objects.product = r.byHandle[info.product.handle];
  if (info.mainCollection) objects.collection = r.collections[info.mainCollection];
  if (info.page) objects.page = r.pages[info.page.handle];
  if (info.pageType === 'search') objects.search = searchObject(url, r.products);
  if (info.pageType === 'list-collections') objects.collections = r.collections;
  objects.recommendations = { 'performed?': false, products: [], products_count: 0 };

  const sectionId = url.searchParams.get('section_id');
  if (sectionId) {
    const html = await r.renderTemplate(info.template, sectionId);
    return html ? { status: 200, type: 'text/html', body: html } : { status: 404, type: 'text/plain', body: 'Section not found' };
  }
  const sections = url.searchParams.get('sections');
  if (sections) {
    const out = {};
    for (const id of sections.split(',')) out[id] = await r.renderTemplate(info.template, id);
    return { status: 200, type: 'application/json', body: JSON.stringify(out) };
  }
  return { status: 200, type: 'text/html', body: await r.renderTemplate(info.template) };
}

export async function sectionsFor(url, cart, ids, sectionsUrl) {
  const out = {};
  const pageUrl = new URL(sectionsUrl || '/', url);
  for (const id of [].concat(ids || []).flatMap((s) => String(s).split(',')).filter(Boolean)) {
    const info = pageFor(pageUrl) || pageFor(new URL('/', url));
    const objects = { recommendations: { 'performed?': false, products: [] } };
    const r = new Renderer(pageUrl, cart, { ...info, objects });
    if (info.product) objects.product = r.byHandle[info.product.handle];
    out[id] = await r.renderTemplate(info.template, id);
  }
  return out;
}

/** POST /cart/add.js. Returns { status, json }. Mutates cart. */
export async function cartAdd(cart, body, url) {
  const found = findVariant(body.id);
  const qty = Math.max(1, Number(body.quantity || 1));
  if (!found) return { status: 404, json: { status: 404, message: 'Cart Error', description: 'Cannot find variant' } };
  if (!found.variant.available) return { status: 422, json: { status: 422, message: 'Cart Error', description: `The product '${found.raw.def.title} - ${found.variant.title}' is already sold out.` } };
  const existing = cart.items.find((i) => String(i.variantId) === String(found.variant.id));
  if (existing) existing.quantity += qty; else cart.items.push({ variantId: found.variant.id, quantity: qty });
  const c = cartObject(cart);
  const line = c.items.find((i) => String(i.variant_id) === String(found.variant.id));
  const json = { ...cartJSON({ ...c, items: [line] }).items[0] };
  if (body.sections) json.sections = await sectionsFor(url, cart, body.sections, body.sections_url);
  return { status: 200, json };
}

/** POST /cart/change.js. Returns { status, json }. Mutates cart. */
export async function cartChange(cart, body, url) {
  const idx = Number(body.line) - 1;
  if (!cart.items[idx]) return { status: 400, json: { status: 400, message: 'Cart Error', description: 'No item at that line.' } };
  const q = Math.max(0, Number(body.quantity));
  if (q === 0) cart.items.splice(idx, 1); else cart.items[idx].quantity = q;
  const json = cartJSON(cartObject(cart));
  if (body.sections) json.sections = await sectionsFor(url, cart, body.sections, body.sections_url);
  return { status: 200, json };
}

export const contactErrors = (email) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim()) ? null : { email: "Email can't be blank or is invalid." });
