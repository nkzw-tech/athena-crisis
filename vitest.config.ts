import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';
import presets from './infra/babelPresets.tsx';
import createResolver from './infra/createResolver.tsx';

const root = process.cwd();

dotenv.config({
  path: join(root, 'artemis', '.env'),
  quiet: true,
});

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets,
      },
    }),
  ],
  resolve: {
    alias: [createResolver()],
  },
  test: {
    globalSetup: ['./tests/viteServer', './tests/playwrightServer'],
    setupFiles: ['./tests/setup'],
    testTimeout: (process.env.CI ? 2 : 1) * 25_000,
  },
});
