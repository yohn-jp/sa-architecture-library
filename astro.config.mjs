import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yohn-jp.github.io',
  base: '/sa-architecture-library',
  output: 'static',
  integrations: [mdx()],
});
