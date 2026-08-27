import { join } from 'node:path';
import fbtee from '@nkzw/vite-plugin-fbtee';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';
import createResolver from './infra/createResolver.tsx';
import fbteePluginOptions from './infra/fbteePluginOptions.tsx';

const root = process.cwd();

dotenv.config({
  path: join(root, 'artemis', '.env'),
  quiet: true,
});

export default defineConfig({
  plugins: [createResolver(), fbtee(fbteePluginOptions), react()],
  test: {
    globalSetup: ['./tests/viteServer', './tests/playwrightServer'],
    setupFiles: ['./tests/setup'],
    testTimeout: (process.env.CI ? 2 : 1) * 25_000,
  },
});
