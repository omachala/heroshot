import { useState, useEffect, useMemo, createContext, useContext } from 'react';
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
}: {
  manifest: Manifest;
  children: React.ReactNode;
}) {
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
    if (typeof window === 'undefined') return false;

    // Check Docusaurus data-theme attribute
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme) return dataTheme === 'dark';

    // Check class-based (.dark class)
    if (document.documentElement.classList.contains('dark')) return true;

    // Fall back to prefers-color-scheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      if (!dataTheme && !document.documentElement.classList.contains('dark')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const observer = new MutationObserver(() => {
      const dataTheme = document.documentElement.getAttribute('data-theme');
      if (dataTheme) {
        setIsDark(dataTheme === 'dark');
      } else if (document.documentElement.classList.contains('dark')) {
        setIsDark(true);
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
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

export function Heroshot({ name, alt = '', manifest: manifestProp, className }: HeroshotProps) {
  const isDark = useIsDark();
  const contextManifest = useContext(HeroshotContext);

  // Use prop manifest, context manifest, or global manifest (in that order)
  const manifest = manifestProp ?? contextManifest ?? getManifest();

  // Warning for missing manifest
  if (!manifest) {
    const warning =
      'Heroshot: No manifest found. Add heroshot() plugin to vite config, use HeroshotProvider, or pass manifest prop.';
    if (typeof console !== 'undefined') {
      console.warn(warning);
    }
    return <span style={{ color: 'red', fontSize: '12px' }}>{warning}</span>;
  }

  // Get screenshot from manifest
  const screenshot = useMemo(() => {
    return getScreenshot(manifest, name);
  }, [manifest, name]);

  // Get all variant paths
  const paths = useMemo((): VariantPaths | null => {
    if (!screenshot) return null;
    return getVariantPaths(manifest, screenshot);
  }, [manifest, screenshot]);

  // Current theme-based src
  const themeSrc = useMemo(() => {
    if (!paths) return '';
    const { light, dark } = paths;
    if (isDark && dark) return dark;
    if (!isDark && light) return light;
    return paths.default;
  }, [paths, isDark]);

  // Generate srcset for responsive images
  const srcset = useMemo(() => {
    if (!paths || !screenshot) return '';
    const { viewports } = paths;
    const viewportNames = Object.keys(viewports);

    if (viewportNames.length === 0) return '';

    const parts: string[] = [];
    for (const viewport of viewportNames) {
      const vpPaths = viewports[viewport];
      if (!vpPaths) continue;

      const path = isDark && vpPaths.dark ? vpPaths.dark : vpPaths.light || vpPaths.default;
      const width = VIEWPORT_WIDTHS[viewport] || parseInt(viewport.split('x')[0] || '1280', 10);
      parts.push(`${path} ${width}w`);
    }

    return parts.join(', ');
  }, [paths, screenshot, isDark]);

  const sizes = srcset ? '(max-width: 375px) 375px, (max-width: 768px) 768px, 1280px' : undefined;

  // Warning for missing screenshot
  if (!screenshot) {
    const warning = `Heroshot: Screenshot "${name}" not found in config`;
    if (typeof console !== 'undefined') {
      console.warn(warning);
    }
    return <span style={{ color: 'red', fontSize: '12px' }}>{warning}</span>;
  }

  return (
    <img
      src={themeSrc}
      srcSet={srcset || undefined}
      sizes={sizes}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

export default Heroshot;
