import { fileURLToPath } from 'node:url';
import babelPluginEmotion from '@emotion/babel-plugin';
import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { vocs } from 'vocs/vite';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';

export default defineConfig(async () => ({
  build: {
    target: 'esnext',
  },
  define: {
    'process.env.IS_LANDING_PAGE': `1`,
  },
  plugins: [
    createResolver(),
    babel({
      plugins: [babelPluginEmotion],
      presets,
    }),
    react(),
    await vocs(),
  ],
  resolve: {
    alias: [
      {
        find: 'canvas',
        replacement: 'canvas/browser.js',
      },
      {
        find: 'vocs/waku/middleware',
        replacement: fileURLToPath(new URL('./wakuMiddleware.ts', import.meta.url)),
      },
    ],
  },
}));
