import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { Heroshot } from 'heroshot/vitepress';
import 'virtual:heroshot-manifest'; // Auto-registers manifest

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Heroshot', Heroshot);
  },
} satisfies Theme;
