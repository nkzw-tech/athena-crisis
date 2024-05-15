import { join } from 'node:path';
import babelPluginFbt from 'babel-plugin-fbt';
import babelPluginFbtImport from 'babel-plugin-fbt-import';
import babelPluginFbtRuntime from 'babel-plugin-fbt-runtime';
import isOpenSource from './isOpenSource.tsx';
import root from './root.ts';

const enumManifest = (() => {
  try {
    return require('../ares/.enum_manifest.json');
  } catch {
    if (!isOpenSource()) {
      throw new Error('babelPlugins: Missing enum manifest.');
    }
  }
  return {};
})();

export default [
  babelPluginFbtImport,
  [
    babelPluginFbt,
    {
      extraOptions: { __self: true },
      fbtCommonPath: join(root, 'i18n/Common.cjs'),
      fbtEnumManifest: enumManifest,
    },
  ],
  babelPluginFbtRuntime,
];
