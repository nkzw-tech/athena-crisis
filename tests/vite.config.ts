import fbtee from '@nkzw/vite-plugin-fbtee';
import react from '@vitejs/plugin-react';
import createResolver from '../infra/createResolver.tsx';
import fbteePluginOptions from '../infra/fbteePluginOptions.tsx';
import pixelarticonsPlugin from '../infra/pixelarticonsPlugin.ts';

const root = process.cwd();

export default {
  define: {
    'process.env.IS_LANDING_PAGE': `0`,
  },
  plugins: [
    createResolver(),
    pixelarticonsPlugin(),
    fbtee(fbteePluginOptions),
    react({ compiler: true }),
  ],
  root,
  server: {
    host: true,
  },
};
