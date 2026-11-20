// Builds dist/artifact/: a static, multi-page design preview of the theme for sharing as a private Claude Artifact.
//   node dev/artifact/build.mjs
// - Every page is rendered from the real theme with the mock catalogue, links rewritten to flat files.
// - preview-engine.js runs the same store logic in the browser (bag, filters, search, recommendations).
// - Every page carries a "Design preview · not the official store" banner and noindex; forms and checkout send nothing.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'dist/artifact');
const BUILD = path.join(ROOT, 'dist/artifact-build');
const MAX_WIDTH = 960;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });
fs.mkdirSync(BUILD, { recursive: true });

// 1. Image manifest trimmed to the widths the preview ships (keeps the upload small)
const fullManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'dev/data/image-manifest.json'), 'utf8'));
const manifest = Object.fromEntries(Object.entries(fullManifest).map(([name, m]) => {
  const widths = m.widths.filter((w) => w <= MAX_WIDTH);
  return [name, { ...m, widths: widths.length ? widths : [m.widths[0]] }];
}));
const manifestPath = path.join(BUILD, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
process.env.PS_MANIFEST = manifestPath;

const store = await import('../store.mjs');
const { rewriteHtml } = await import('./rewrite.mjs');
const { PRODUCTS, COLLECTIONS, PAGES, POLICIES } = await import('../data/products.mjs');

const BANNER = `<div data-preview-banner role="region" aria-label="Preview notice" style="background:var(--color-warning-bg);color:var(--color-warning);font:600 12px/1.45 'Overpass Mono',ui-monospace,monospace;padding:7px 16px;text-align:center;border-bottom:1px solid var(--color-warning)">DESIGN PREVIEW by Marvani Marketing · Peak Side Shopify theme · not the official store · sample data: nothing can be bought or sent</div>`;
store.configure({ origin: 'https://preview.local', banner: BANNER, transform: rewriteHtml });

const FRAME_CSS = `<style>.section-header{top:env(safe-area-inset-top,0px)}body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:41;background:var(--color-background)}</style>`;
const headInject = (route) => `<meta name="robots" content="noindex">\n<script>window.__PS_PATH=${JSON.stringify(route)};</script>\n<script src="preview-engine.js" defer></script>\n${FRAME_CSS}\n`;

// 2. Render every page
const routes = [
  '/', '/collections', ...COLLECTIONS.map((c) => `/collections/${c.handle}`), ...PRODUCTS.map((p) => `/products/${p.handle}`),
  ...PAGES.map((p) => `/pages/${p.handle}`), '/search', '/cart', '/account', ...POLICIES.map((p) => `/policies/${p.handle}`),
];
const { mapPath } = await import('./rewrite.mjs');
const images = new Set();
for (const route of routes) {
  const r = await store.renderGet(new URL(route, 'https://preview.local'), store.newCart());
  if (r.status !== 200) throw new Error(`${route} rendered ${r.status}`);
  let html = r.body.replace(/<head>/, `<head>\n${headInject(route)}`);
  for (const m of html.matchAll(/images\/([\w-]+?)-(\d+)\.webp/g)) images.add(m[1]);
  const file = mapPath(route);
  if (file === 'index.html') {
    // The artifact's main page is wrapped in a document skeleton at publish time: keep only head + body content.
    const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
      .replace(/<meta charset[^>]*>/i, '')
      .replace(/<meta http-equiv[^>]*>/i, '')
      .replace(/<meta name="viewport"[^>]*>/i, '')
      .replace(/<title>[\s\S]*?<\/title>/, '');
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
    html = `<title>Peak Side Theme Preview</title>\n<script>document.documentElement.classList.add('js');document.documentElement.lang='en';</script>\n${head}\n${body}`;
  }
  fs.writeFileSync(path.join(OUT, file), html);
}

// 3. Images (every trimmed width of every referenced photo) and theme assets
let imageBytes = 0;
for (const name of images) {
  for (const w of manifest[name]?.widths || []) {
    const src = path.join(ROOT, 'dev/images', `${name}-${w}.webp`);
    if (!fs.existsSync(src)) continue;
    fs.copyFileSync(src, path.join(OUT, 'images', `${name}-${w}.webp`));
    imageBytes += fs.statSync(src).size;
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'theme/assets'))) fs.copyFileSync(path.join(ROOT, 'theme/assets', f), path.join(OUT, 'assets', f));

// 4. Browser engine bundle: store logic + LiquidJS + theme files in memory
const virtualFiles = { '/repo/manifest.json': JSON.stringify(manifest) };
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
for (const f of walk(path.join(ROOT, 'theme'))) {
  if (/\.(liquid|json)$/.test(f)) virtualFiles[`/repo/${path.relative(ROOT, f)}`] = fs.readFileSync(f, 'utf8');
}
await esbuild.build({
  entryPoints: [path.join(ROOT, 'dev/artifact/entry.mjs')],
  outfile: path.join(OUT, 'preview-engine.js'),
  bundle: true, minify: true, format: 'iife', platform: 'browser', target: 'es2020', legalComments: 'none',
  define: { 'import.meta.url': '"file:///repo/dev/shopify.mjs"', 'process.env.PS_MANIFEST': '"/repo/manifest.json"' },
  plugins: [{
    name: 'preview-shims',
    setup(b) {
      b.onResolve({ filter: /^node:fs$/ }, () => ({ path: path.join(ROOT, 'dev/artifact/shim-fs.mjs') }));
      b.onResolve({ filter: /^node:path$/ }, () => ({ path: path.join(ROOT, 'dev/artifact/shim-path.mjs') }));
      b.onResolve({ filter: /^virtual:files$/ }, () => ({ path: 'files', namespace: 'virtual' }));
      b.onLoad({ filter: /.*/, namespace: 'virtual' }, () => ({ contents: JSON.stringify(virtualFiles), loader: 'json' }));
    },
  }],
  banner: { js: '/* Peak Side theme design preview engine (Marvani Marketing). Runs entirely in the browser; sends nothing. */' },
});

// 5. Publish map for the Artifact tool (everything except the main page)
const all = walk(OUT).map((f) => path.relative(OUT, f)).filter((f) => f !== 'index.html' && f !== 'files.json').sort();
const files = Object.fromEntries(all.map((f) => [f, path.relative(ROOT, path.join(OUT, f))]));
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(files, null, 2));
const total = walk(OUT).reduce((n, f) => n + fs.statSync(f).size, 0);
console.log(`Artifact preview: ${routes.length} pages, ${images.size} photos (${(imageBytes / 1048576).toFixed(1)} MB), ${all.length + 1} files, ${(total / 1048576).toFixed(1)} MB total`);
console.log(`Engine: ${(fs.statSync(path.join(OUT, 'preview-engine.js')).size / 1024).toFixed(0)} KB`);
