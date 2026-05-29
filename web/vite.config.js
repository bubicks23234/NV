import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { seoPlugin } from './vite-seo-plugin.js';

export default defineConfig(({ mode }) => ({
  plugins: [solid(), seoPlugin()],
  // По умолчанию `/` — для Render и обычного хостинга.
  // GitHub Pages: VITE_BASE=/NV/ (см. npm run deploy)
  base: process.env.VITE_BASE || '/',
  build: {
    target: 'esnext',
  },
}));
