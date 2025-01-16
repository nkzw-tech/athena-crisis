import fbteePreset from '@nkzw/babel-preset-fbtee';
import fbtCommon from '../i18n/Common.ts';
import isOpenSource from './isOpenSource.tsx';

const getEnumManifest = async () => {
  try {
    return await import('../ares/.enum_manifest.json');
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
