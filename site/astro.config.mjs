// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tucsonwebdevelopment.net',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Blog covers are first-party SVGs in src/assets/blog/, rasterized to WebP and PNG at build time.
  // Safe here because no SVG on this site comes from users.
  image: { dangerouslyProcessSVG: true },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/(thanks|404)\/?$/.test(page),
    }),
  ],
});
