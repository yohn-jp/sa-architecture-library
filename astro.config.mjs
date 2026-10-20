import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://architect.library.yohn.jp',
  base: '/',
  output: 'static',
  integrations: [mdx()],
});
