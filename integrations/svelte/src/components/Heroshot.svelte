<script lang="ts">
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

const { name, alt = '', manifest: manifestProp, class: className }: Props = $props();

// Use prop manifest or fall back to global manifest (set by plugin)
const activeManifest: Manifest | null = $derived(manifestProp ?? getManifest());

// Dark mode detection
let isDark = $state(false);

// Track if site has explicit theme handling (detected on mount)
let siteHasThemeHandling = false;

/**
 * Dark mode detection priority:
 * 1. Site theme (.dark class) - SvelteKit/frameworks set this based on user choice
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

$effect(() => {
  // Detect if site has theme handling by checking for class management
  siteHasThemeHandling =
    document.documentElement.classList.length > 0 ||
    document.documentElement.dataset.theme !== undefined;

  isDark = detectDarkMode();

  // Watch for class changes on documentElement (site theme toggle)
  const observer = new MutationObserver(() => {
    // Once we see a class change, we know the site has theme handling
    siteHasThemeHandling = true;
    isDark = document.documentElement.classList.contains('dark');
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Listen for system preference changes
  const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    isDark = detectDarkMode();
  };
  mediaQuery?.addEventListener('change', handleMediaChange);

  return () => {
    observer.disconnect();
    mediaQuery?.removeEventListener('change', handleMediaChange);
  };
});

// Get screenshot from manifest
const screenshot = $derived(activeManifest ? getScreenshot(activeManifest, name) : undefined);

// Get all variant paths
const paths: VariantPaths | null = $derived(
  screenshot && activeManifest ? getVariantPaths(activeManifest, screenshot) : null
);

// Current theme-based src (fallback for no viewports)
const themeSrc = $derived.by(() => {
  if (!paths) return '';
  const { light, dark } = paths;
  if (isDark && dark) return dark;
  if (!isDark && light) return light;
  return paths.default;
});

// Viewport width mapping for media queries
const VIEWPORT_WIDTHS: Record<string, number> = {
  mobile: 430, // iPhone 15/16 Pro Max viewport
  tablet: 768,
  desktop: 1280,
};

interface SourceEntry {
  viewport: string;
  srcset: string;
  width: number;
  media: string | undefined;
}

// Generate sources for <picture> element (sorted by width ascending)
const sources: SourceEntry[] = $derived.by(() => {
  if (!paths || !screenshot) return [];
  const { viewports } = paths;
  const viewportNames = Object.keys(viewports);

  if (viewportNames.length === 0) return [];

  // Sort viewports by width ascending (smallest first - browser picks FIRST matching source)
  const sorted = [...viewportNames].sort((a, b) => {
    const widthA = VIEWPORT_WIDTHS[a] || Number.parseInt(a.split('x')[0] || '1280', 10);
    const widthB = VIEWPORT_WIDTHS[b] || Number.parseInt(b.split('x')[0] || '1280', 10);
    return widthA - widthB;
  });

  return sorted
    .map((viewport, index): SourceEntry | null => {
      const vpPaths = viewports[viewport];
      if (!vpPaths) return null;

      const lightSrc = vpPaths.light || vpPaths.default;
      const darkSrc = vpPaths.dark || vpPaths.light || vpPaths.default;
      const width =
        VIEWPORT_WIDTHS[viewport] || Number.parseInt(viewport.split('x')[0] || '1280', 10);

      // Last (largest) viewport doesn't need a max-width constraint - it's the fallback
      const isLast = index === sorted.length - 1;

      // Use isDark to pick the correct src (JavaScript-based theme detection)
      const currentSrc = isDark ? darkSrc : lightSrc;

      return {
        viewport,
        srcset: currentSrc,
        width,
        media: isLast ? undefined : `(max-width: ${width}px)`,
      };
    })
    .filter((s): s is SourceEntry => s !== null);
});

// Check if we have viewport variants
const hasViewports = $derived(sources.length > 0);

// Warning message
const warning = $derived.by(() => {
  if (!activeManifest) {
    return 'Heroshot: No manifest found. Add heroshot() plugin to vite config or pass manifest prop.';
  }
  if (!screenshot) {
    return `Heroshot: Screenshot "${name}" not found in config`;
  }
  return null;
});

if (warning && typeof console !== 'undefined') {
  console.warn(warning);
}
</script>

<!-- Use <picture> for responsive viewport switching -->
<!-- Theme switching is JS-based (isDark reactive), viewport switching is CSS-based (media queries) -->
{#if screenshot && hasViewports}
  <picture class={className}>
    {#each sources as source (`${source.viewport}-${isDark}`)}
      <source srcset={source.srcset} media={source.media} />
    {/each}
    <img src={themeSrc} {alt} loading="lazy" />
  </picture>
<!-- Fallback to simple img for no viewports -->
{:else if screenshot}
  <img src={themeSrc} {alt} class={className} loading="lazy" />
{:else}
  <span style="color: red; font-size: 12px">{warning}</span>
{/if}
