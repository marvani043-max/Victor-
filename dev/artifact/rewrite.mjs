// Maps the store's absolute URLs (/products/x, /images/y.webp) to the flat relative files of the
// static artifact preview (product-x.html, images/y.webp), and back. Used at export time and in the browser.

const ROUTES = [
  [/^\/$/, () => 'index.html'],
  [/^\/collections\/?$/, () => 'collections.html'],
  [/^\/collections\/([\w-]+)\/products\/([\w-]+)\/?$/, (m) => `product-${m[2]}.html`],
  [/^\/collections\/([\w-]+)\/?$/, (m) => `collection-${m[1]}.html`],
  [/^\/products\/([\w-]+)\/?$/, (m) => `product-${m[1]}.html`],
  [/^\/pages\/([\w-]+)\/?$/, (m) => `page-${m[1]}.html`],
  [/^\/policies\/([\w-]+)\/?$/, (m) => `policy-${m[1]}.html`],
  [/^\/search\/?$/, () => 'search.html'],
  [/^\/cart\/?$/, () => 'cart.html'],
  [/^\/account\/?$/, () => 'account.html'],
  [/^\/(assets|images)\/(.+)$/, (m) => `${m[1]}/${m[2]}`],
];

/** '/products/x?variant=1#a' → 'product-x.html?variant=1#a'. Unknown routes (cart API, /contact) stay absolute. */
export function mapPath(url) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const m = url.match(/^([^?#]*)(.*)$/);
  for (const [re, fn] of ROUTES) {
    const hit = m[1].match(re);
    if (hit) return fn(hit) + m[2];
  }
  return url;
}

const FILES = [
  [/^index\.html$/, () => '/'],
  [/^collections\.html$/, () => '/collections'],
  [/^collection-([\w-]+)\.html$/, (m) => `/collections/${m[1]}`],
  [/^product-([\w-]+)\.html$/, (m) => `/products/${m[1]}`],
  [/^page-([\w-]+)\.html$/, (m) => `/pages/${m[1]}`],
  [/^policy-([\w-]+)\.html$/, (m) => `/policies/${m[1]}`],
  [/^search\.html$/, () => '/search'],
  [/^cart\.html$/, () => '/cart'],
  [/^account\.html$/, () => '/account'],
];

/** 'collection-all.html' → '/collections/all'; null when the name isn't a preview page. */
export function fileToPath(name) {
  for (const [re, fn] of FILES) {
    const hit = (name || '').match(re);
    if (hit) return fn(hit);
  }
  return null;
}

/** Rewrites href/src/srcset/action/data-* URLs and CSS url() in rendered HTML. Idempotent. */
export function rewriteHtml(html) {
  return html
    .replace(/\b(href|src|action|data-src|data-zoom-src)="(\/[^"]*)"/g, (_, attr, url) => `${attr}="${mapPath(url)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (_, list) => `srcset="${list.split(',').map((part) => part.trim().replace(/^(\S+)/, (u) => mapPath(u))).join(', ')}"`)
    .replace(/url\((['"]?)(\/(?:assets|images)\/[^'")]+)\1\)/g, (_, q, url) => `url(${q}${mapPath(url)}${q})`);
}
