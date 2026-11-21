// Browser entry for the static artifact preview.
// Runs the same store logic as dev/server.mjs inside the page, so the theme's own JavaScript
// (cart drawer, filters, recommendations, search) works without a server. Nothing leaves the browser:
// no orders, no form submissions, no analytics.
import { configure, newCart, renderGet, cartAdd, cartChange } from '../store.mjs';
import { liquidFs } from './fs-shims.mjs';
import { rewriteHtml, fileToPath } from './rewrite.mjs';
import demo from '../data/demo-content.json';

const ORIGIN = 'https://preview.local';
configure({ origin: ORIGIN, banner: '', transform: rewriteHtml, demo, engineOptions: { fs: liquidFs } });

/* ---------- cart, kept in this browser only ---------- */
const CART_KEY = 'ps-preview-cart';
let memoryCart = null;
function loadCart() {
  if (memoryCart) return memoryCart;
  try { memoryCart = JSON.parse(localStorage.getItem(CART_KEY) || 'null'); } catch (e) { memoryCart = null; }
  if (!memoryCart || !Array.isArray(memoryCart.items)) memoryCart = newCart();
  return memoryCart;
}
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(memoryCart)); } catch (e) { /* memory only */ } }

/* ---------- which store page is this file? ---------- */
const lastSegment = (pathname) => decodeURIComponent(pathname.split('/').pop() || '');
const pagePathFor = (url) => fileToPath(lastSegment(url.pathname)) || window.__PS_PATH || '/';
const emu = (path, search = '') => new URL(path + search, ORIGIN);

/* ---------- history calls can be refused in some frames; never let that break the page ---------- */
for (const m of ['pushState', 'replaceState']) {
  const orig = history[m].bind(history);
  history[m] = (...args) => { try { orig(...args); } catch (e) { /* keep going without URL updates */ } };
}

/* ---------- fetch: answer the Shopify endpoints locally ---------- */
const realFetch = window.fetch.bind(window);
const respond = (status, body, type) => new Response(body, { status, headers: { 'Content-Type': type } });
const toObject = (body) => {
  if (!body) return {};
  if (typeof body === 'string') { try { return JSON.parse(body); } catch (e) { return Object.fromEntries(new URLSearchParams(body)); } }
  if (body instanceof FormData || body instanceof URLSearchParams) return Object.fromEntries(body);
  return body;
};
const fixSectionsUrl = (obj) => {
  if (obj.sections_url) obj.sections_url = pagePathFor(new URL(obj.sections_url, location.href));
  return obj;
};

window.fetch = async (input, init = {}) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  const p = url.pathname;
  try {
    if (p.endsWith('/cart/add.js')) {
      const cart = loadCart();
      const r = await cartAdd(cart, fixSectionsUrl(toObject(init.body)), emu('/'));
      saveCart();
      return respond(r.status, JSON.stringify(r.json), 'application/json');
    }
    if (p.endsWith('/cart/change.js')) {
      const cart = loadCart();
      const r = await cartChange(cart, fixSectionsUrl(toObject(init.body)), emu('/'));
      saveCart();
      return respond(r.status, JSON.stringify(r.json), 'application/json');
    }
    if (p.endsWith('/cart.js')) {
      const r = await renderGet(emu('/cart.js'), loadCart());
      return respond(r.status, r.body, r.type);
    }
    if (p.endsWith('/recommendations/products')) {
      const r = await renderGet(emu('/recommendations/products', url.search), loadCart());
      return respond(r.status, r.body, r.type);
    }
    if (url.searchParams.has('section_id') || url.searchParams.has('sections')) {
      const r = await renderGet(emu(pagePathFor(url), url.search), loadCart());
      return respond(r.status, r.body, r.type);
    }
  } catch (err) {
    console.error('[preview]', err);
    return respond(500, JSON.stringify({ status: 500, description: 'Preview error' }), 'application/json');
  }
  return realFetch(input, init);
};

/* ---------- forms: nothing is sent from a preview ---------- */
function notice(target, text) {
  let box = target.querySelector('[data-preview-notice]');
  if (!box) {
    box = document.createElement('div');
    box.setAttribute('data-preview-notice', '');
    box.setAttribute('role', 'status');
    box.tabIndex = -1;
    box.className = 'form-status';
    box.style.cssText = 'background:var(--color-warning-bg);color:var(--color-warning);border-left-color:var(--color-warning);margin-top:var(--space-3)';
    target.appendChild(box);
  }
  box.textContent = text;
  box.focus({ preventScroll: false });
}
window.addEventListener('submit', (e) => {
  if (e.defaultPrevented) return;
  const form = e.target;
  const type = form.querySelector('input[name="form_type"]')?.value;
  if (type === 'contact' || type === 'customer') {
    e.preventDefault();
    const btn = form.querySelector('[data-submit]');
    if (btn) {
      btn.removeAttribute('aria-busy');
      const label = btn.querySelector('[data-submit-label]');
      if (label && btn.dataset.label) label.textContent = btn.dataset.label;
    }
    notice(form, type === 'customer'
      ? 'Design preview: nothing was sent. On the live store, Shopify adds the email to Peak Side’s subscribers and then shows a confirmation.'
      : 'Design preview: nothing was sent. On the live store, Shopify emails this to Peak Side and then shows a confirmation.');
    return;
  }
  if ((form.getAttribute('method') || '').toLowerCase() === 'post' && /cart\.html$|\/cart$/.test(form.getAttribute('action') || '')) {
    e.preventDefault();
    notice(form, 'Design preview: checkout is not available here. On the live store this opens Shopify’s secure checkout.');
  }
});
// Remember submit labels so they can be restored after the preview notice
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('[data-submit]');
  const label = btn?.querySelector('[data-submit-label]');
  if (btn && label && !btn.dataset.label) btn.dataset.label = label.textContent;
}, true);

/* ---------- restore state on page load ---------- */
async function replaceSection(id, path, search = '') {
  const el = document.getElementById(`shopify-section-${id}`);
  if (!el) return;
  const qs = new URLSearchParams(search);
  qs.set('section_id', id);
  const r = await renderGet(emu(path, `?${qs}`), loadCart());
  if (r.status === 200) el.outerHTML = r.body;
}

window.addEventListener('DOMContentLoaded', async () => {
  const here = window.__PS_PATH || pagePathFor(new URL(location.href));
  try {
    const cart = loadCart();
    if (cart.items.length) {
      const r = await renderGet(emu(here, '?section_id=cart-drawer'), cart);
      document.querySelector('cart-drawer')?.renderSections({ 'cart-drawer': r.body });
      if (here === '/cart') await replaceSection('template--preview__main', '/cart');
    }
    const params = new URLSearchParams(location.search);
    if (here === '/search' && params.get('q')) await replaceSection('template--preview__main', '/search', location.search);
    if (here.startsWith('/collections/') && [...params.keys()].some((k) => k.startsWith('filter.') || k === 'sort_by')) {
      document.querySelector('facet-filters')?.load(new URL(location.href), false);
    }
  } catch (err) {
    console.error('[preview]', err);
  }
});
