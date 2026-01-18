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
  if (globalThis.window === undefined) return false;
  if (document.documentElement.classList.contains('dark')) return true;
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
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

  const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
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

// Current theme-based src (fallback for no viewports)
const themeSrc = computed(() => {
  if (!paths.value) return '';
  const { light, dark } = paths.value;
  if (isDark.value && dark) return dark;
  if (!isDark.value && light) return light;
  return paths.value.default;
});

// Viewport width mapping for media queries
const VIEWPORT_WIDTHS: Record<string, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

// Generate sources for <picture> element (sorted by width ascending - smallest first for max-width matching)
// Theme switching is done via JavaScript (isDark), not CSS media queries (prefers-color-scheme)
// This allows VitePress theme toggle to work properly
const sources = computed(() => {
  if (!paths.value || !screenshot.value) return [];
  const { viewports } = paths.value;
  const viewportNames = Object.keys(viewports);

  if (viewportNames.length === 0) return [];

  // Sort viewports by width ascending (smallest first - browser picks FIRST matching source)
  const sorted = [...viewportNames].sort((a, b) => {
    const widthA = VIEWPORT_WIDTHS[a] || Number.parseInt(a.split('x')[0] || '1280', 10);
    const widthB = VIEWPORT_WIDTHS[b] || Number.parseInt(b.split('x')[0] || '1280', 10);
    return widthA - widthB;
  });

  return sorted
    .map((viewport, index) => {
      const vpPaths = viewports[viewport];
      if (!vpPaths) return null;

      const lightSrc = vpPaths.light || vpPaths.default;
      const darkSrc = vpPaths.dark || vpPaths.light || vpPaths.default;
      const width =
        VIEWPORT_WIDTHS[viewport] || Number.parseInt(viewport.split('x')[0] || '1280', 10);

      // Last (largest) viewport doesn't need a max-width constraint - it's the fallback
      const isLast = index === sorted.length - 1;

      // Use isDark to pick the correct src (JavaScript-based theme detection)
      const currentSrc = isDark.value ? darkSrc : lightSrc;

      return {
        viewport,
        srcset: currentSrc,
        width,
        // Media query: max-width for this viewport (except for largest which is fallback)
        media: isLast ? undefined : `(max-width: ${width}px)`,
      };
    })
    .filter(Boolean);
});

// Check if we have viewport variants
const hasViewports = computed(() => sources.value.length > 0);

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
  <!-- Use <picture> for responsive viewport switching -->
  <!-- Theme switching is JS-based (isDark reactive), viewport switching is CSS-based (media queries) -->
  <picture v-if="screenshot && hasViewports" :class="props.class">
    <source
      v-for="source in sources"
      :key="`${source.viewport}-${isDark}`"
      :srcset="source.srcset"
      :media="source.media"
    />
    <img :src="themeSrc" :alt="alt" loading="lazy" />
  </picture>
  <!-- Fallback to simple img for no viewports -->
  <img v-else-if="screenshot" :src="themeSrc" :alt="alt" :class="props.class" loading="lazy" />
  <span v-else style="color: red; font-size: 12px">{{ warning }}</span>
</template>
