import { defineConfig } from 'vitest/config';
import createResolver from './infra/createResolver.tsx';

export default defineConfig({
  resolve: {
    alias: [createResolver()],
  },
  test: {
    globalSetup: ['./tests/viteServer', './tests/playwrightServer'],
    setupFiles: ['./tests/setup'],
    testTimeout: (process.env.CI ? 2 : 1) * 25_000,
  },
});
