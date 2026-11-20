// Alias target for `node:fs` in the artifact bundle.
import { fsDefault } from './fs-shims.mjs';
export { existsSync, readFileSync } from './fs-shims.mjs';
export default fsDefault;
