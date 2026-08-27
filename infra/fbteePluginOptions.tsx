import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FbteeVitePluginOptions } from '@nkzw/vite-plugin-fbtee';
import fbtCommon from '../i18n/Common.ts';
import isOpenSource from './isOpenSource.tsx';

const cwd = process.cwd();
const repositoryRoot = existsSync(join(cwd, 'ares')) ? cwd : join(cwd, '..');
const manifestFile = join(repositoryRoot, 'ares/.enum_manifest.json');
const getEnumManifest = async () => {
  try {
    return (
      await import(manifestFile, {
        with: { type: 'json' },
      })
    ).default;
  } catch {
    if (!isOpenSource()) {
      throw new Error('fbteePluginOptions: Missing enum manifest.');
    }
  }
  return {};
};

export default {
  fbtCommon,
  fbtEnumManifest: await getEnumManifest(),
} satisfies FbteeVitePluginOptions;
