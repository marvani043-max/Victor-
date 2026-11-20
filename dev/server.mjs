// Local preview server for the Peak Side Shopify theme.
//   npm run dev  →  http://localhost:4173
// Renders theme/ with LiquidJS and mock data, and emulates the Shopify endpoints the theme calls:
// cart AJAX API, Section Rendering API, storefront filtering, product recommendations, contact/customer forms.
// Everything Shopify-only (checkout, email delivery, inventory, analytics) is simulated and labelled.
// Route and render logic lives in dev/store.mjs (shared with the static artifact preview).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, THEME } from './shopify.mjs';
import { configure, newCart, renderGet, cartAdd, cartChange, contactErrors } from './store.mjs';

const PORT = Number(process.env.PORT || 4173);
configure({ origin: `http://localhost:${PORT}`, ...(process.env.PREVIEW_BANNER === '0' ? { banner: '' } : {}) });
const carts = new Map(); // cookie id → { items: [{ variantId, quantity }], note }
const submissions = [];

const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.png': 'image/png', '.json': 'application/json' };

function cartFor(req, res) {
  const cookie = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]));
  let id = cookie.ps_cart;
  if (!id || !carts.has(id)) {
    id = crypto.randomUUID();
    carts.set(id, newCart());
    res.setHeader('Set-Cookie', `ps_cart=${id}; Path=/; SameSite=Lax`);
  }
  return carts.get(id);
}

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
  res.writeHead(status, { 'Content-Type': type.includes('charset') || !type.startsWith('text/') ? type : `${type}; charset=utf-8`, 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
const sendResult = (res, r) => send(res, r.status, r.body, r.type);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;
    if (p.startsWith('/assets/') || p.startsWith('/images/')) {
      const base = p.startsWith('/assets/') ? path.join(THEME, 'assets') : path.join(ROOT, 'dev/images');
      const file = path.join(base, path.basename(p));
      if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream', { 'Cache-Control': 'public, max-age=60' });
    }
    if (p === '/favicon.ico') return send(res, 204, '');
    const cart = cartFor(req, res);

    if (req.method === 'POST' && (p === '/cart/add.js' || p === '/cart/add')) {
      const r = await cartAdd(cart, await readBody(req), url);
      if (p === '/cart/add' && r.status === 200) { res.writeHead(302, { Location: '/cart' }); return res.end(); }
      return send(res, r.status, JSON.stringify(r.json), 'application/json');
    }
    if (req.method === 'POST' && (p === '/cart/change.js' || p === '/cart/change')) {
      const r = await cartChange(cart, await readBody(req), url);
      return send(res, r.status, JSON.stringify(r.json), 'application/json');
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
      const referer = new URL(req.headers.referer || '/', url);
      const errors = contactErrors(body['contact[email]']);
      if (errors) {
        referer.search = '';
        return sendResult(res, await renderGet(referer, cart, { type, success: false, errors, values: { email: body['contact[email]'], body: body['contact[body]'], name: body['contact[name]'] } }));
      }
      submissions.push({ at: new Date().toISOString(), type, fields: body });
      console.log(`[preview] ${type} form received (simulated, nothing sent):`, JSON.stringify(body));
      referer.search = type === 'customer' ? '?customer_posted=true' : '?contact_posted=true';
      res.writeHead(302, { Location: referer.pathname + referer.search });
      return res.end();
    }
    if (req.method === 'GET' && p === '/__submissions') return send(res, 200, JSON.stringify(submissions), 'application/json');
    if (req.method === 'GET') return sendResult(res, await renderGet(url, cart));
    send(res, 405, 'Method not allowed', 'text/plain');
  } catch (err) {
    console.error(err);
    send(res, 500, `<pre>${String(err.stack || err).replace(/</g, '&lt;')}</pre>`);
  }
});

server.listen(PORT, () => console.log(`Peak Side theme preview: http://localhost:${PORT}`));
