import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import {
  getScreenshot,
  getVariantPaths,
  getManifest,
  type Manifest,
  type VariantPaths,
} from '../../../shared';

// Context for providing manifest to components
const HeroshotContext = createContext<Manifest | null>(null);

/**
 * Provider component for heroshot manifest.
 * Wrap your app with this if not using the Vite plugin.
 */
export function HeroshotProvider({
  manifest,
  children,
}: Readonly<{
  manifest: Manifest;
  children: React.ReactNode;
}>) {
  return <HeroshotContext.Provider value={manifest}>{children}</HeroshotContext.Provider>;
}

interface HeroshotProps {
  /** Screenshot name (as defined in heroshot config) */
  name: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Manifest data - optional if using heroshot vite plugin or HeroshotProvider */
  manifest?: Manifest;
  /** CSS class to apply to the image */
  className?: string;
}

/**
 * Hook to detect dark mode
 */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (globalThis.window === undefined) return false;

    // Check Docusaurus data-theme attribute
    const { theme: dataTheme } = document.documentElement.dataset;
    if (dataTheme) return dataTheme === 'dark';

    // Check class-based (.dark class)
    if (document.documentElement.classList.contains('dark')) return true;

    // Fall back to prefers-color-scheme
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const { theme: dataTheme } = document.documentElement.dataset;
      if (!dataTheme && !document.documentElement.classList.contains('dark')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const observer = new MutationObserver(() => {
      const { theme: dataTheme } = document.documentElement.dataset;
      if (dataTheme) {
        setIsDark(dataTheme === 'dark');
      } else if (document.documentElement.classList.contains('dark')) {
        setIsDark(true);
      } else {
        setIsDark(globalThis.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);

  return isDark;
}

/** Viewport width mapping */
const VIEWPORT_WIDTHS: Record<string, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

interface SourceEntry {
  viewport: string;
  srcset: string;
  width: number;
  media: string | undefined;
}

export function Heroshot({
  name,
  alt = '',
  manifest: manifestProp,
  className,
}: Readonly<HeroshotProps>) {
  const isDark = useIsDark();
  const contextManifest = useContext(HeroshotContext);

  // Use prop manifest, context manifest, or global manifest (in that order)
  const manifest = manifestProp ?? contextManifest ?? getManifest();

  // Get screenshot from manifest
  const screenshot = useMemo(() => {
    if (!manifest) return null;
    return getScreenshot(manifest, name);
  }, [manifest, name]);

  // Get all variant paths
  const paths = useMemo((): VariantPaths | null => {
    if (!screenshot || !manifest) return null;
    return getVariantPaths(manifest, screenshot);
  }, [manifest, screenshot]);

  // Current theme-based src (fallback for no viewports)
  const themeSrc = useMemo(() => {
    if (!paths) return '';
    const { light, dark } = paths;
    if (isDark && dark) return dark;
    if (!isDark && light) return light;
    return paths.default;
  }, [paths, isDark]);

  // Generate sources for <picture> element (sorted by width ascending - smallest first for max-width matching)
  // Theme switching is done via JavaScript (isDark), not CSS media queries (prefers-color-scheme)
  // This allows Docusaurus theme toggle to work properly
  const sources = useMemo((): SourceEntry[] => {
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
        const currentSrc = isDark ? darkSrc : lightSrc;

        return {
          viewport,
          srcset: currentSrc,
          width,
          media: isLast ? undefined : `(max-width: ${width}px)`,
        };
      })
      .filter((s): s is SourceEntry => s !== null);
  }, [paths, screenshot, isDark]);

  const hasViewports = sources.length > 0;

  // Warning for missing manifest
  if (!manifest) {
    const warning =
      'Heroshot: No manifest found. Add heroshot() plugin to vite config, use HeroshotProvider, or pass manifest prop.';
    if (typeof console !== 'undefined') {
      console.warn(warning);
    }
    return <span style={{ color: 'red', fontSize: '12px' }}>{warning}</span>;
  }

  // Warning for missing screenshot
  if (!screenshot) {
    const warning = `Heroshot: Screenshot "${name}" not found in config`;
    if (typeof console !== 'undefined') {
      console.warn(warning);
    }
    return <span style={{ color: 'red', fontSize: '12px' }}>{warning}</span>;
  }

  // Use <picture> for responsive viewport switching
  // Theme switching is JS-based (isDark state), viewport switching is CSS-based (media queries)
  if (hasViewports) {
    return (
      <picture className={className}>
        {sources.map(source => (
          <source
            key={`${source.viewport}-${isDark}`}
            srcSet={source.srcset}
            media={source.media}
          />
        ))}
        <img src={themeSrc} alt={alt} loading="lazy" />
      </picture>
    );
  }

  // Fallback to simple img for no viewports
  return <img src={themeSrc} alt={alt} className={className} loading="lazy" />;
}
