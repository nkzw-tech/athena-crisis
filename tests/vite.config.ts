import babelPluginEmotion from '@emotion/babel-plugin';
import react from '@vitejs/plugin-react';
import babelFbtPlugins from '../infra/babelFbtPlugins.tsx';
import resolver from '../infra/resolver.tsx';

const root = process.cwd();

export default {
  define: {
    'process.env.IS_LANDING_PAGE': `0`,
  },
  plugins: [
    react({
      babel: {
        plugins: [...babelFbtPlugins, babelPluginEmotion],
      },
    }),
  ],
  resolve: {
    alias: [resolver],
  },
  root,
  server: {
    host: true,
  },
};
