import fbtee from '@nkzw/vite-plugin-fbtee';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import createResolver from '../infra/createResolver.tsx';
import fbteePluginOptions from '../infra/fbteePluginOptions.tsx';
import pixelarticonsPlugin from '../infra/pixelarticonsPlugin.ts';

export default defineConfig({
  build: {
    target: 'esnext',
  },
  define: {
    // Lets game UI with links and navigation work without the app's router,
    // the same way the docs playground runs.
    'process.env.IS_LANDING_PAGE': `1`,
  },
  plugins: [createResolver(), pixelarticonsPlugin(), fbtee(fbteePluginOptions), react()],
  resolve: {
    alias: [
      // Palette swapping uses `canvas`, which needs its browser build here.
      { find: 'canvas', replacement: 'canvas/browser.js' },
    ],
  },
  server: {
    host: true,
  },
});
