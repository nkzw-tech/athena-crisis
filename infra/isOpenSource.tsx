import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const hasInternalFiles = existsSync(join(root, 'art/Variants.nkzw.tsx'));

export default function isOpenSource() {
  return !hasInternalFiles;
}
