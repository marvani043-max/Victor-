// Minimal Shopify Liquid emulation for previewing and testing the theme locally.
// This is a development tool, not Shopify. It implements the objects, filters and tags this theme uses,
// with mock data from dev/data/products.mjs. Behaviour that only Shopify can provide (checkout, real form
// delivery, real inventory, Markets, analytics) is simulated and labelled as such in the preview banner.
import fs from 'node:fs';
import path from 'node:path';
import { Liquid } from 'liquidjs';
import { PRODUCTS, COLLECTIONS, MENUS, PAGES, POLICIES } from './data/products.mjs';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const THEME = path.join(ROOT, 'theme');
// PS_MANIFEST lets the artifact build point at a manifest trimmed to the image widths it ships.
const MANIFEST = JSON.parse(fs.readFileSync(process.env.PS_MANIFEST || path.join(ROOT, 'dev/data/image-manifest.json'), 'utf8'));
const LOCALE = JSON.parse(fs.readFileSync(path.join(THEME, 'locales/en.default.json'), 'utf8'));
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

/* ------------------------------------------------------------------ data model */
export const handleize = (s) => String(s ?? '').toLowerCase().trim().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cents = (n) => Math.round(n * 100);

let imageId = 1000;
export function imageObj(name, alt = '') {
  const m = MANIFEST[name];
  if (!m) return null;
  return { id: imageId++, src: name, width: m.w, height: m.h, aspect_ratio: +(m.w / m.h).toFixed(4), alt, presentation: null, toString() { return `/images/${name}.webp`; } };
}

let variantId = 40000000;
const RAW = PRODUCTS.map((def, pi) => {
  const id = 7000000 + pi;
  const media = def.media.map(([name, alt], i) => {
    const img = imageObj(name, alt);
    return { id: id * 10 + i, media_type: 'image', alt, position: i + 1, preview_image: img, src: img };
  }).filter((m) => m.preview_image);
  const variants = [];
  for (const color of def.colors) {
    for (const size of def.sizes) {
      variants.push({
        id: variantId++, title: `${color} / ${size}`, option1: color, option2: size, option3: null, options: [color, size],
        available: def.available, price: cents(def.price), compare_at_price: null, sku: '', requires_shipping: true,
        featured_media: null, url: `/products/${def.handle}?variant=${variantId - 1}`,
      });
    }
  }
  const details = def.details.map((d) => ({ label: { value: d.label }, note: { value: d.note }, view: { value: d.view }, x: { value: d.x }, y: { value: d.y } }));
  return { def, id, media, variants, details };
});

export function buildProduct(raw, selectedVariantId) {
  const { def, id, media, variants, details } = raw;
  const selected = variants.find((v) => String(v.id) === String(selectedVariantId)) || variants.find((v) => v.available) || variants[0];
  const optionNames = ['Color', 'Size'];
  const options_with_values = optionNames.map((name, i) => {
    const values = (i === 0 ? def.colors : def.sizes).map((v) => ({
      name: v, swatch: null, available: variants.some((x) => x.options[i] === v && x.available), selected: selected.options[i] === v,
      toString() { return v; },
    }));
    return { name, position: i + 1, values, selected_value: selected.options[i] };
  });
  const metafields = { custom: {} };
  if (def.fit) metafields.custom.fit_profile = { value: def.fit };
  if (def.fitNote) metafields.custom.fit_note = { value: def.fitNote };
  if (details.length) metafields.custom.details = { value: details };
  const product = {
    id, handle: def.handle, title: def.title, type: def.type, vendor: 'Peak Side', tags: def.tags, description: def.description,
    url: `/products/${def.handle}`, available: def.available, price: cents(def.price), price_min: cents(def.price), price_max: cents(def.price),
    price_varies: false, compare_at_price: null, media, images: media.map((m) => m.preview_image), featured_media: media[0] || null,
    featured_image: media[0]?.preview_image || null, variants, first_available_variant: variants.find((v) => v.available) || null,
    selected_variant: selectedVariantId ? selected : null, selected_or_first_available_variant: selected, options: optionNames,
    options_with_values, has_only_default_variant: false, metafields, object_type: 'product', requires_selling_plan: false,
    collections: [], wixSlug: def.wixSlug,
  };
  product.toJSON = () => ({
    id, title: def.title, handle: def.handle, description: def.description, type: def.type, vendor: 'Peak Side', tags: def.tags,
    price: product.price, available: product.available, options: optionNames,
    variants: variants.map(({ id, title, option1, option2, option3, options, available, price, compare_at_price, sku }) => ({ id, title, option1, option2, option3, options, available, price, compare_at_price, sku })),
    media: media.map((m) => ({ id: m.id, alt: m.alt, position: m.position, media_type: 'image' })),
  });
  return product;
}

export const allProducts = (selected = {}) => RAW.map((r) => buildProduct(r, selected[r.def.handle]));
export const findRaw = (handle) => RAW.find((r) => r.def.handle === handle);
export const findVariant = (vid) => {
  for (const r of RAW) { const v = r.variants.find((x) => String(x.id) === String(vid)); if (v) return { raw: r, variant: v }; }
  return null;
};

/* --------------------------------------------------------------- filtering */
const FIT_LABEL = { cropped: 'Cropped', regular: 'Regular', boxy: 'Boxy', oversized: 'Oversized' };
const FILTER_DEFS = [
  { label: 'Availability', param: 'filter.v.availability', values: (p) => [p.available ? '1' : '0'], valueLabel: (v) => (v === '1' ? 'In stock' : 'Out of stock'), order: ['1', '0'] },
  { label: 'Product type', param: 'filter.p.product_type', values: (p) => [p.type] },
  { label: 'Color', param: 'filter.v.option.color', values: (p) => p.options_with_values[0].values.map((v) => v.name), presentation: 'swatch' },
  { label: 'Size', param: 'filter.v.option.size', values: (p) => p.options_with_values[1].values.map((v) => v.name), order: SIZE_ORDER },
  { label: 'Fit', param: 'filter.p.m.custom.fit_profile', values: (p) => (p.metafields.custom.fit_profile ? [p.metafields.custom.fit_profile.value] : []), valueLabel: (v) => FIT_LABEL[v] || v, order: Object.keys(FIT_LABEL) },
];

function urlWith(base, params, mutate) {
  const p = new URLSearchParams(params.toString());
  p.delete('page'); p.delete('section_id');
  mutate(p);
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

export function applyFilters(products, params, baseUrl) {
  const active = {};
  for (const def of FILTER_DEFS) active[def.param] = params.getAll(def.param);
  const gte = params.get('filter.v.price.gte'); const lte = params.get('filter.v.price.lte');
  const priceOk = (p) => (!gte || p.price >= Number(gte) * 100) && (!lte || p.price <= Number(lte) * 100);
  const passes = (p, skip) => FILTER_DEFS.every((def) => def.param === skip || !active[def.param].length || def.values(p).some((v) => active[def.param].includes(v))) && (skip === 'price' || priceOk(p));
  const filtered = products.filter((p) => passes(p));

  const filters = FILTER_DEFS.map((def) => {
    const pool = products.filter((p) => passes(p, def.param));
    const all = new Set(products.flatMap(def.values));
    let vals = [...all];
    if (def.order) vals.sort((a, b) => def.order.indexOf(a) - def.order.indexOf(b)); else vals.sort();
    const values = vals.map((v) => {
      const isActive = active[def.param].includes(v);
      return {
        label: def.valueLabel ? def.valueLabel(v) : v, value: v, param_name: def.param, count: pool.filter((p) => def.values(p).includes(v)).length, active: isActive,
        swatch: null,
        url_to_add: urlWith(baseUrl, params, (p) => p.append(def.param, v)),
        url_to_remove: urlWith(baseUrl, params, (p) => { const keep = p.getAll(def.param).filter((x) => x !== v); p.delete(def.param); keep.forEach((k) => p.append(def.param, k)); }),
      };
    });
    return {
      label: def.label, type: 'list', param_name: def.param, presentation: def.presentation || 'text', values,
      active_values: values.filter((v) => v.active), inactive_values: values.filter((v) => !v.active),
      url_to_remove: urlWith(baseUrl, params, (p) => p.delete(def.param)),
    };
  });
  const maxPrice = Math.max(...products.map((p) => p.price), 0);
  filters.push({
    label: 'Price', type: 'price_range', param_name: 'filter.v.price', presentation: null, values: [], active_values: [], inactive_values: [],
    min_value: { param_name: 'filter.v.price.gte', value: gte ? Number(gte) * 100 : null },
    max_value: { param_name: 'filter.v.price.lte', value: lte ? Number(lte) * 100 : null },
    range_max: maxPrice,
    url_to_remove: urlWith(baseUrl, params, (p) => { p.delete('filter.v.price.gte'); p.delete('filter.v.price.lte'); }),
  });
  return { filtered, filters };
}

export const SORT_OPTIONS = [
  { value: 'manual', name: 'Featured' },
  { value: 'title-ascending', name: 'Alphabetically, A–Z' },
  { value: 'title-descending', name: 'Alphabetically, Z–A' },
  { value: 'price-ascending', name: 'Price, low to high' },
  { value: 'price-descending', name: 'Price, high to low' },
];
export function sortProducts(list, sort) {
  const l = [...list];
  if (sort === 'title-ascending') l.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'title-descending') l.sort((a, b) => b.title.localeCompare(a.title));
  else if (sort === 'price-ascending') l.sort((a, b) => a.price - b.price);
  else if (sort === 'price-descending') l.sort((a, b) => b.price - a.price);
  return l;
}

export function buildCollection(def, products, { params, main = false } = {}) {
  const members = products.filter((p) => def.match(p));
  const base = { id: def.handle.length * 1000, handle: def.handle, title: def.title, description: def.description, url: `/collections/${def.handle}`, featured_image: null, all_products_count: members.length, default_sort_by: 'manual', sort_options: SORT_OPTIONS };
  if (!main) return { ...base, products: members, products_count: members.length, filters: [], sort_by: 'manual' };
  const { filtered, filters } = applyFilters(members, params, base.url);
  const sort = params.get('sort_by') || 'manual';
  const sorted = sortProducts(filtered, sort);
  return { ...base, products: sorted, products_count: sorted.length, filters, sort_by: sort };
}
export const COLLECTION_DEFS = COLLECTIONS;
export const MENU_DEFS = MENUS;
export const PAGE_DEFS = PAGES;
export const POLICY_DEFS = POLICIES;

export function menu(handle, currentPath) {
  const items = MENUS[handle] || [];
  return { handle, title: handle, links: items.map(([title, url]) => ({ title, url, current: currentPath === url, active: currentPath === url, links: [] })) };
}

/* -------------------------------------------------------------------- liquid */
function locale(key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), LOCALE);
}

export function money(c) {
  const v = Number(c || 0) / 100;
  return `$${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function namedArgs(args) {
  const out = {};
  for (const a of args) if (Array.isArray(a)) out[a[0]] = a[1];
  return out;
}

function imageUrl(img, width) {
  if (!img) return '';
  let name = typeof img === 'string' ? img : img.src;
  if (typeof name === 'object' && name?.src) name = name.src;
  if (typeof name !== 'string') return '';
  const m = MANIFEST[name];
  if (!m) return `/images/${name}`;
  const w = m.widths.find((x) => x >= (width || 960)) ?? m.widths[m.widths.length - 1];
  return `/images/${name}-${w}.webp`;
}

// Parse a Liquid argument list like: 'contact', id: 'X', class: 'a b', data-validate: '', novalidate: 'novalidate'
function splitArgs(str) {
  const parts = []; let cur = ''; let q = null; let depth = 0;
  for (const ch of str) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

export function createEngine(opts = {}) {
  const liquid = new Liquid({
    root: [path.join(THEME, 'snippets')],
    extname: '.liquid',
    strictFilters: true,
    cache: !!opts.fs,
    ...(opts.fs ? { fs: opts.fs } : {}),
  });

  // --- filters
  liquid.registerFilter('asset_url', (name) => `/assets/${name}`);
  liquid.registerFilter('stylesheet_tag', (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`);
  liquid.registerFilter('preload_tag', (url, ...args) => {
    const a = namedArgs(args);
    return `<link href="${url}" rel="preload"${Object.entries(a).map(([k, v]) => ` ${k}="${v}"`).join('')}>`;
  });
  liquid.registerFilter('script_tag', (url) => `<script src="${url}" type="text/javascript"></script>`);
  liquid.registerFilter('image_url', (img, ...args) => imageUrl(img, namedArgs(args).width));
  liquid.registerFilter('money', money);
  liquid.registerFilter('money_with_currency', (c) => `${money(c)} USD`);
  liquid.registerFilter('money_without_currency', (c) => (Number(c || 0) / 100).toFixed(2));
  liquid.registerFilter('money_without_trailing_zeros', (c) => money(c).replace(/\.00$/, ''));
  liquid.registerFilter('handle', handleize);
  liquid.registerFilter('handleize', handleize);
  liquid.registerFilter('remove_last', (s, sub) => { s = String(s ?? ''); const i = s.lastIndexOf(sub); return i < 0 ? s : s.slice(0, i) + s.slice(i + sub.length); });
  liquid.registerFilter('t', function (key, ...args) {
    const params = namedArgs(args);
    let str = locale(key);
    if (str && typeof str === 'object') str = params.count === 1 ? str.one : str.other;
    if (str === undefined) return `translation missing: en.${key}`;
    return String(str).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (params[k] !== undefined ? params[k] : ''));
  });
  liquid.registerFilter('default_errors', (errors) => {
    if (!errors?.messages) return '';
    return `<ul>${Object.values(errors.messages).map((m) => `<li>${m}</li>`).join('')}</ul>`;
  });
  liquid.registerFilter('structured_data', (p) => {
    if (!p?.handle) return '{}';
    return JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.title, url: `http://localhost${p.url}`, brand: { '@type': 'Brand', name: p.vendor },
      image: p.media.map((m) => imageUrl(m.preview_image, 1200)), description: p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      offers: p.variants.map((v) => ({ '@type': 'Offer', sku: String(v.id), price: (v.price / 100).toFixed(2), priceCurrency: 'USD', availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' })),
    });
  });
  liquid.registerFilter('format_code', (s) => s);

  // --- tags
  const rawBlock = (name) => ({
    parse(token, remain) {
      this.content = [];
      let t;
      while ((t = remain.shift())) {
        if (t.name === `end${name}`) return;
        this.content.push(t.getText ? t.getText() : '');
      }
      throw new Error(`tag ${name} not closed`);
    },
    render() { return name === 'style' ? `<style>${this.content.join('')}</style>` : ''; },
  });
  liquid.registerTag('schema', rawBlock('schema'));
  liquid.registerTag('javascript', rawBlock('javascript'));
  liquid.registerTag('stylesheet', rawBlock('stylesheet'));
  liquid.registerTag('layout', { parse() {}, render() { return ''; } });

  liquid.registerTag('form', {
    parse(token, remain) {
      this.args = splitArgs(token.args);
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('tag:endform', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('form not closed'); });
      stream.start();
    },
    *render(ctx, emitter) {
      const type = this.liquid.evalValueSync(this.args[0], ctx);
      const attrs = {};
      for (const a of this.args.slice(1)) {
        const m = a.match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
        if (m) attrs[m[1]] = this.liquid.evalValueSync(m[2], ctx);
      }
      const state = ctx.getSync(['__formState']) || {};
      const id = attrs.id || `${type}_form`;
      const action = { product: '/cart/add', contact: '/contact', customer: '/contact', localization: '/localization', storefront_password: '/password' }[type] || '/';
      const mine = state.type === type && (!state.id || state.id === id);
      const form = {
        'posted_successfully?': !!(mine && state.success), errors: mine && state.errors ? { messages: state.errors } : null,
        email: mine ? state.values?.email || '' : '', body: mine ? state.values?.body || '' : '', name: mine ? state.values?.name || '' : '', id,
      };
      const attrStr = Object.entries(attrs).filter(([k]) => k !== 'id').map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
      emitter.write(`<form method="post" action="${action}${type === 'contact' || type === 'customer' ? `#${id}` : ''}" id="${id}" accept-charset="UTF-8"${type === 'product' ? ' enctype="multipart/form-data"' : ''}${attrStr}><input type="hidden" name="form_type" value="${type}"><input type="hidden" name="utf8" value="✓">`);
      ctx.push({ form });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    },
  });

  liquid.registerTag('paginate', {
    parse(token, remain) {
      const m = token.args.match(/^\s*([\w.]+)\s+by\s+([\w.]+)\s*$/);
      this.expr = m[1]; this.by = m[2];
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream.on('tag:endpaginate', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('paginate not closed'); });
      stream.start();
    },
    *render(ctx, emitter) {
      const [baseName, prop] = this.expr.split('.');
      const base = ctx.getSync([baseName]);
      const list = (base && base[prop]) || [];
      const size = Number(this.liquid.evalValueSync(this.by, ctx)) || 24;
      const req = ctx.getSync(['__request']) || {};
      const page = Math.max(1, Number(req.page || 1));
      const pages = Math.max(1, Math.ceil(list.length / size));
      const slice = list.slice((page - 1) * size, page * size);
      const pageUrl = (n) => { const u = new URL(req.url || '/', 'http://x'); u.searchParams.set('page', n); return u.pathname + u.search; };
      const paginate = {
        current_page: page, pages, items: list.length, page_size: size, current_offset: (page - 1) * size,
        previous: page > 1 ? { url: pageUrl(page - 1), is_link: true, title: '«' } : null,
        next: page < pages ? { url: pageUrl(page + 1), is_link: true, title: '»' } : null,
        parts: Array.from({ length: pages }, (_, i) => (i + 1 === page ? { title: i + 1, is_link: false } : { title: i + 1, is_link: true, url: pageUrl(i + 1) })),
      };
      ctx.push({ [baseName]: { ...base, [prop]: slice }, paginate });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
    },
  });

  liquid.registerTag('section', {
    parse(token) { this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); },
    *render(ctx, emitter) {
      const r = ctx.getSync(['__renderer']);
      emitter.write(yield r.renderSection(this.name, this.name, {}, ctx.getAll ? null : null));
    },
  });
  liquid.registerTag('sections', {
    parse(token) { this.name = token.args.trim().replace(/^['"]|['"]$/g, ''); },
    *render(ctx, emitter) {
      const r = ctx.getSync(['__renderer']);
      emitter.write(yield r.renderGroup(this.name));
    },
  });
  return liquid;
}

/* ------------------------------------------------------- settings resolution */
export function readSchema(src) {
  const m = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  return m ? JSON.parse(m[1]) : {};
}

export function resolveValue(type, value, lookup) {
  if (value === undefined || value === null || value === '') return type === 'link_list' || type === 'collection' || type === 'product' || type === 'image_picker' || type === 'page' ? null : value;
  switch (type) {
    case 'collection': return lookup.collection(value);
    case 'product': return lookup.product(value);
    case 'page': return lookup.page(value);
    case 'link_list': return lookup.menu(value);
    case 'image_picker': {
      const name = String(value).replace('shopify://shop_images/', '').replace(/\.(jpe?g|png|webp)$/i, '');
      return imageObj(name);
    }
    case 'url': {
      const s = String(value);
      if (s.startsWith('shopify://collections/')) return `/collections/${s.split('/').pop()}`;
      if (s.startsWith('shopify://pages/')) return `/pages/${s.split('/').pop()}`;
      if (s.startsWith('shopify://products/')) return `/products/${s.split('/').pop()}`;
      if (s.startsWith('shopify://policies/')) return `/policies/${s.split('/').pop()}`;
      return s;
    }
    default: return value;
  }
}

export function resolveSettings(defs = [], values = {}, lookup) {
  const out = {};
  for (const d of defs) {
    if (!d.id) continue;
    const v = values[d.id] !== undefined ? values[d.id] : d.default;
    out[d.id] = resolveValue(d.type, v, lookup);
  }
  return out;
}

export { SIZE_ORDER, MANIFEST };
