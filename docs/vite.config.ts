import { fileURLToPath } from 'node:url';
import fbtee from '@nkzw/vite-plugin-fbtee';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { vocs } from 'vocs/vite';
import createResolver from '../infra/createResolver.tsx';
import fbteePluginOptions from '../infra/fbteePluginOptions.tsx';
import pixelarticonsPlugin from '../infra/pixelarticonsPlugin.ts';

export default defineConfig(async () => ({
  build: {
    target: 'esnext',
  },
  define: {
    'process.env.IS_LANDING_PAGE': `1`,
  },
  plugins: [
    createResolver(),
    pixelarticonsPlugin(),
    fbtee(fbteePluginOptions),
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
