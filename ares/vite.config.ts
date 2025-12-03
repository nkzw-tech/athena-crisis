import { basename, dirname, join } from 'node:path';
import babelPluginEmotion from '@emotion/babel-plugin';
import react from '@vitejs/plugin-react';
import reactCompiler from 'babel-plugin-react-compiler';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin as minifyHTMLPlugin } from 'vite-plugin-minify';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';

const root = process.cwd();

const htmlPlugin = {
  name: 'html-transform',
  transformIndexHtml(html: string) {
    return html.replaceAll(
      '${favicon}',
      `/athena-favicon-${process.env.NODE_ENV}.png`,
    );
  },
};

export default defineConfig({
  build: {
    assetsInlineLimit: 800,
    minify: false,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            // Ensure that translations are separated into their own segments.
            {
              name: (id) => `locale-${basename(id, '.json')}`,
              priority: 20,
              test: String.raw`/ares/src/generated/.*\.json$/`,
            },
            {
              maxSize: 100_000,
              minShareCount: 2,
              minSize: 10_000,
              name: 'shared',
              priority: 10,
            },
          ],
        },
        strictExecutionOrder: true,
      },
    },
    sourcemap: 'hidden',
  },
  define: {
    'process.env.IS_LANDING_PAGE': `1`,
  },
  plugins: [
    react({
      babel: {
        plugins: [reactCompiler, babelPluginEmotion],
        presets,
      },
    }),
    htmlPlugin,
    minifyHTMLPlugin(),
  ],
  resolve: {
    alias: [
      {
        customResolver(id, from) {
          if (id === 'athena-crisis:entry-point') {
            return join(
              from ? dirname(from) : '',
              process.env.IS_DEMO ? './ui/Demo.tsx' : './ui/Main.tsx',
            );
          }
          return null;
        },
        find: /^athena-crisis:entry-point$/,
        replacement: 'athena-crisis:entry-point',
      },
      createResolver(),
    ],
  },
  root,
  server: {
    host: true,
  },
});
