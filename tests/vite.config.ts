import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';
import pixelarticonsPlugin from '../infra/pixelarticonsPlugin.ts';

const root = process.cwd();

export default {
  define: {
    'process.env.IS_LANDING_PAGE': `0`,
  },
  plugins: [
    createResolver(),
    pixelarticonsPlugin(),
    babel({
      presets,
    }),
    react({ compiler: true }),
  ],
  root,
  server: {
    host: true,
  },
};
