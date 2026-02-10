import { defineConfig } from 'vitepress';
import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  title: 'Heroshot Example',
  description: 'Minimal VitePress + Heroshot setup',
  vite: {
    plugins: [heroshot()],
  },
  themeConfig: {
    nav: [{ text: 'Home', link: '/' }],
  },
});
