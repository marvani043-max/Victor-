// Runs Shopify's Theme Check (the same checks as `shopify theme check`) against theme/.
import path from 'node:path';
import { themeCheckRun } from '@shopify/theme-check-node';

const root = path.resolve('theme');
const { offenses } = await themeCheckRun(root, undefined, () => {});
const sev = ['error', 'warning', 'info'];
const rows = offenses.map((o) => ({ severity: sev[o.severity] ?? o.severity, check: o.check, file: path.relative(root, o.uri.replace('file://', '')), line: (o.start?.line ?? 0) + 1, message: o.message }));
rows.sort((a, b) => sev.indexOf(a.severity) - sev.indexOf(b.severity) || a.file.localeCompare(b.file));
for (const r of rows) console.log(`${r.severity.padEnd(7)} ${r.check.padEnd(28)} ${r.file}:${r.line}  ${r.message}`);
const counts = rows.reduce((m, r) => ((m[r.severity] = (m[r.severity] || 0) + 1), m), {});
console.log(`\nTheme Check: ${rows.length} offenses`, JSON.stringify(counts));
process.exitCode = counts.error ? 1 : 0;
