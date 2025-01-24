import { join } from 'node:path';
import fbteePreset from '@nkzw/babel-preset-fbtee';
import fbtCommon from '../i18n/Common.ts';
import isOpenSource from './isOpenSource.tsx';

const manifestFile = join(process.cwd(), './ares/.enum_manifest.json');
const getEnumManifest = async () => {
  try {
    return await import(manifestFile, { with: { type: 'json' } });
  } catch {
    if (!isOpenSource()) {
      throw new Error('babelPresets: Missing enum manifest.');
    }
  }
  return {};
};

export default [
  [
    fbteePreset,
    {
      extraOptions: { __self: true },
      fbtCommon,
      fbtEnumManifest: await getEnumManifest(),
    },
  ],
];
