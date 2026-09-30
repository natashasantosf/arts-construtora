// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

import playformInline from '@playform/inline';
import minifyHtml from './integrations/html-minify';

// https://astro.build/config
export default defineConfig({
  site: "https://artsconstrutora.com.br",

  // The original site's canonical URLs have no trailing slash (/servicos/pintura-predial).
  // "file" output (servicos/pintura-predial.html) is served at that exact path by Cloudflare.
  trailingSlash: "never",
  build: {
    format: "file",
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: "Montserrat",
      cssVariable: "--font-montserrat",
      weights: [400, 500, 600, 700, 900],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    sitemap({ filter: (page) => !page.includes("/design-system") }),
    mdx(),
    playformInline({}),
    minifyHtml(),
  ]
});
