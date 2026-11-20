// In-browser stand-ins for node:fs and node:path, backed by the theme files bundled at build time.
// The build aliases `node:fs` and `node:path` to this module for the artifact bundle only.
import FILES from 'virtual:files';

const norm = (p) => {
  const out = [];
  for (const seg of String(p).split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') out.pop(); else out.push(seg);
  }
  return `/${out.join('/')}`;
};

export const sep = '/';
export const join = (...parts) => norm(parts.filter(Boolean).join('/'));
export const resolve = (...parts) => {
  let acc = '';
  for (const p of parts) acc = String(p).startsWith('/') ? p : `${acc}/${p}`;
  return norm(acc || '/');
};
export const dirname = (p) => { const n = norm(p); return n.slice(0, n.lastIndexOf('/')) || '/'; };
export const basename = (p) => norm(p).split('/').pop();
export const extname = (p) => { const b = basename(p); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : ''; };
export const relative = (from, to) => norm(to).replace(`${norm(from)}/`, '');

export function existsSync(p) { return Object.prototype.hasOwnProperty.call(FILES, norm(p)); }
export function readFileSync(p) {
  const key = norm(p);
  if (!existsSync(key)) { const e = new Error(`ENOENT: ${key}`); e.code = 'ENOENT'; throw e; }
  return FILES[key];
}

const fsDefault = { existsSync, readFileSync };
const pathDefault = { sep, join, resolve, dirname, basename, extname, relative };
export { fsDefault, pathDefault };

/** LiquidJS FS interface for `{% render %}` snippet lookups. */
export const liquidFs = {
  existsSync, readFileSync,
  exists: async (p) => existsSync(p),
  readFile: async (p) => readFileSync(p),
  resolve: (dir, file, ext) => norm(`${dir}/${file}${file.endsWith(ext) ? '' : ext}`),
  contains: (root, file) => norm(file).startsWith(norm(root)),
  dirname, sep,
};
