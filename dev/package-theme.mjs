// Zips theme/ into dist/peak-side-field-tag-theme.zip for Shopify admin → Online Store → Themes → Add theme → Upload zip.
// (Or use Shopify CLI: `shopify theme push --path theme --unpublished`.)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync('dist', { recursive: true });
const out = path.resolve('dist/peak-side-field-tag-theme.zip');
if (fs.existsSync(out)) fs.unlinkSync(out);
execFileSync('zip', ['-r', '-q', out, 'assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates', '-x', '*.DS_Store'], { cwd: path.resolve('theme') });
console.log(`Theme package: ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
