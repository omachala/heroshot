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

// Track if site has explicit theme handling (detected on mount)
let siteHasThemeHandling = false;

/**
 * Dark mode detection priority:
 * 1. Site theme (.dark class) - VitePress/frameworks set this based on user choice
 * 2. System preference (prefers-color-scheme) - for sites without framework theme handling
 * 3. Default to light
 */
function detectDarkMode(): boolean {
  if (globalThis.window === undefined) return false;

  // 1. Check site theme (.dark class) - explicit user/framework choice
  if (document.documentElement.classList.contains('dark')) {
    return true;
  }

  // If site has theme handling (detected previously), absence of .dark = light mode
  if (siteHasThemeHandling) {
    return false;
  }

  // 2. Fall back to system preference for sites without theme handling
  if (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return true;
  }

  // 3. Default to light
  return false;
}

onMounted(() => {
  // Detect if site has theme handling by checking for VitePress-style class management
  // VitePress sets .dark class immediately on load based on saved/system preference
  // If we're in a VitePress site and there's no .dark class, it means light mode
  siteHasThemeHandling =
    document.documentElement.classList.length > 0 ||
    document.documentElement.dataset.theme !== undefined;

  isDark.value = detectDarkMode();

  // Watch for class changes on documentElement (site theme toggle)
  const observer = new MutationObserver(() => {
    // Once we see a class change, we know the site has theme handling
    siteHasThemeHandling = true;
    isDark.value = document.documentElement.classList.contains('dark');
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Listen for system preference changes
  const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    // If site has theme handling, it will update the class - just re-detect
    // If not, we use the system preference directly
    isDark.value = detectDarkMode();
  };
  mediaQuery?.addEventListener('change', handleMediaChange);

  onUnmounted(() => {
    observer.disconnect();
    mediaQuery?.removeEventListener('change', handleMediaChange);
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
  mobile: 430, // iPhone 15/16 Pro Max viewport
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
