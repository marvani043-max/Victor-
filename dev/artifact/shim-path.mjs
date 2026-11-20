// Alias target for `node:path` in the artifact bundle.
import { pathDefault } from './fs-shims.mjs';
export { sep, join, resolve, dirname, basename, extname, relative } from './fs-shims.mjs';
export default pathDefault;
