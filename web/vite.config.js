import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { seoPlugin } from './vite-seo-plugin.js';

export default defineConfig(({ mode }) => ({
  plugins: [solid(), seoPlugin()],
  base: mode === 'production' ? '/NV/' : '/',
  build: {
    target: 'esnext',
  },
}));
