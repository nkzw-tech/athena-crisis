import babelPluginEmotion from '@emotion/babel-plugin';
import react from '@vitejs/plugin-react';
import reactCompiler from 'babel-plugin-react-compiler';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';

const root = process.cwd();

export default {
  define: {
    'process.env.IS_LANDING_PAGE': `0`,
  },
  plugins: [
    react({
      babel: {
        plugins: [reactCompiler, babelPluginEmotion],
        presets,
      },
    }),
  ],
  resolve: {
    alias: [createResolver()],
  },
  root,
  server: {
    host: true,
  },
};
