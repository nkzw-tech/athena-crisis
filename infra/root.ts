import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line unicorn/prefer-import-meta-properties
export default dirname(dirname(fileURLToPath(import.meta.url)));
