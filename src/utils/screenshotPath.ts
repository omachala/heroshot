/**
 * Generate screenshot filename from name, viewport, color scheme, and locale.
 *
 * This is the single source of truth for filename generation.
 * The filename is derived deterministically - never stored in config.
 *
 * Format: [{locale}/]{slugified-name}[-{viewport}][-{colorScheme}].{extension}
 *
 * Examples:
 *   - "Hero Section" -> "hero-section.png"
 *   - "Hero Section" + mobile -> "hero-section-mobile.png"
 *   - "Hero Section" + dark -> "hero-section-dark.png"
 *   - "Hero Section" + mobile + dark -> "hero-section-mobile-dark.png"
 *   - "Hero Section" + locale "de" -> "de/hero-section.png"
 *   - "Hero Section" + locale "de" + mobile -> "de/hero-section-mobile.png"
 */

type ScreenshotPathOptions = {
  /** Screenshot name (will be slugified) */
  name: string;
  /** Viewport variant name (e.g., "mobile", "tablet", "1024x768") */
  viewport?: string;
  /** Color scheme variant */
  colorScheme?: 'light' | 'dark';
  /** Locale code — when set, output goes into a subdirectory named after the locale */
  locale?: string;
  /** Output format */
  format?: 'png' | 'jpeg';
};

/**
 * Slugify a single path segment for use in filenames
 */
function slugifySegment(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(?:^-|-$)/g, '');
}

/**
 * Generate screenshot filename.
 * Supports subdirectory paths via forward slashes in the name (e.g., "registry/login-01").
 */
export function generateScreenshotFilename(options: ScreenshotPathOptions): string {
  const { name, viewport, colorScheme, locale, format = 'png' } = options;

  const segments = name.split('/').map(slugifySegment).filter(Boolean);
  const directory = segments.length > 1 ? segments.slice(0, -1).join('/') : '';
  const baseName = segments.at(-1) ?? '';

  const parts = [baseName];

  if (viewport) {
    parts.push(viewport);
  }

  if (colorScheme) {
    parts.push(colorScheme);
  }

  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const filename = `${parts.join('-')}.${extension}`;
  const pathWithDirectory = directory ? `${directory}/${filename}` : filename;
  return locale ? `${locale}/${pathWithDirectory}` : pathWithDirectory;
}
