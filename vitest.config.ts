// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config';
import resolver from './infra/resolver.tsx';

export default defineConfig({
  resolve: {
    alias: [resolver],
  },
  test: {
    globalSetup: ['./tests/viteServer', './tests/playwrightServer'],
    setupFiles: ['./tests/setup'],
    testTimeout: (process.env.CI ? 2 : 1) * 25_000,
  },
});
