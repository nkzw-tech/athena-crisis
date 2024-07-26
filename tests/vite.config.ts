import babelPluginEmotion from '@emotion/babel-plugin';
import react from '@vitejs/plugin-react';
import babelPlugins from '../infra/babelPlugins.tsx';
import createResolver from '../infra/createResolver.tsx';

const root = process.cwd();

export default {
  define: {
    'process.env.IS_LANDING_PAGE': `0`,
  },
  plugins: [
    react({
      babel: {
        plugins: [...babelPlugins, babelPluginEmotion],
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
