import { defineConfig } from 'vite';
import { ViteMinifyPlugin as minifyHTMLPlugin } from 'vite-plugin-minify';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile(), minifyHTMLPlugin()],
});
