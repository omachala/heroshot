<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import {
  getScreenshot,
  getVariantPaths,
  getManifest,
  type Manifest,
  type VariantPaths,
} from '../../../shared';

interface Props {
  /** Screenshot name (as defined in heroshot config) */
  name: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Manifest data - optional if using heroshot vite plugin */
  manifest?: Manifest;
  /** CSS class to apply to the image */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
});

// Use prop manifest or fall back to global manifest (set by plugin)
const activeManifest = computed(() => props.manifest ?? getManifest());

// Dark mode detection
const isDark = ref(false);

function detectDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.classList.contains('dark')) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

onMounted(() => {
  isDark.value = detectDarkMode();

  const observer = new MutationObserver(() => {
    isDark.value = detectDarkMode();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    if (!document.documentElement.classList.contains('dark')) {
      isDark.value = mediaQuery.matches;
    }
  };
  mediaQuery.addEventListener('change', handleMediaChange);

  onUnmounted(() => {
    observer.disconnect();
    mediaQuery.removeEventListener('change', handleMediaChange);
  });
});

// Get screenshot from manifest
const screenshot = computed(() => {
  if (!activeManifest.value) return null;
  return getScreenshot(activeManifest.value, props.name);
});

// Get all variant paths
const paths = computed((): VariantPaths | null => {
  if (!screenshot.value || !activeManifest.value) return null;
  return getVariantPaths(activeManifest.value, screenshot.value);
});

// Current theme-based src
const themeSrc = computed(() => {
  if (!paths.value) return '';
  const { light, dark } = paths.value;
  if (isDark.value && dark) return dark;
  if (!isDark.value && light) return light;
  return paths.value.default;
});

// Generate srcset for responsive images
const srcset = computed(() => {
  if (!paths.value || !screenshot.value) return '';
  const { viewports } = paths.value;
  const viewportNames = Object.keys(viewports);

  if (viewportNames.length === 0) return '';

  const widthMap: Record<string, number> = {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
  };

  const parts: string[] = [];
  for (const viewport of viewportNames) {
    const vpPaths = viewports[viewport];
    if (!vpPaths) continue;

    const path = isDark.value && vpPaths.dark ? vpPaths.dark : vpPaths.light || vpPaths.default;
    const width = widthMap[viewport] || parseInt(viewport.split('x')[0] || '1280', 10);
    parts.push(`${path} ${width}w`);
  }

  return parts.join(', ');
});

const sizes = computed(() => {
  if (!srcset.value) return '';
  return '(max-width: 375px) 375px, (max-width: 768px) 768px, 1280px';
});

// Warning messages
const warning = computed(() => {
  if (!activeManifest.value) {
    return 'Heroshot: No manifest found. Add heroshot() plugin to vite config or pass manifest prop.';
  }
  if (!screenshot.value) {
    return `Heroshot: Screenshot "${props.name}" not found in config`;
  }
  return null;
});

if (warning.value && typeof console !== 'undefined') {
  console.warn(warning.value);
}
</script>

<template>
  <img
    v-if="screenshot"
    :src="themeSrc"
    :srcset="srcset || undefined"
    :sizes="sizes || undefined"
    :alt="alt"
    :class="props.class"
    loading="lazy"
  />
  <span v-else style="color: red; font-size: 12px">{{ warning }}</span>
</template>
