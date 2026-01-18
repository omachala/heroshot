import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import Heroshot from '../../../integrations/vue/src/components/Heroshot.vue';
import { setManifest } from '../../../integrations/shared/manifestStore';
// @ts-expect-error - virtual module provided by heroshot plugin
import manifest from 'virtual:heroshot-manifest';
import './custom.css';
import './showcase.css';

// Register the manifest globally so Heroshot components can access it
setManifest(manifest);

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Heroshot', Heroshot);
  },
} satisfies Theme;
