import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin as minifyHTMLPlugin } from 'vite-plugin-minify';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  define: {
    'process.env.CLIENT_URL':
      process.env.NODE_ENV === 'production'
        ? '"https://app.athenacrisis.com/"'
        : `"http://${
            execSync(`ifconfig | grep "inet " | grep -v 127.0.0.1`)
              .toString()
              .match(/inet\s+(\d.+)\s+netmask/i)?.[1] || 'localhost'
          }:3000"`,
  },
  plugins: [viteSingleFile(), minifyHTMLPlugin()],
});
