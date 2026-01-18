/**
 * Generate screenshot filename from name, viewport, and color scheme.
 *
 * This is the single source of truth for filename generation.
 * The filename is derived deterministically - never stored in config.
 *
 * Format: {slugified-name}[-{viewport}][-{colorScheme}].{extension}
 *
 * Examples:
 *   - "Hero Section" -> "hero-section.png"
 *   - "Hero Section" + mobile -> "hero-section-mobile.png"
 *   - "Hero Section" + dark -> "hero-section-dark.png"
 *   - "Hero Section" + mobile + dark -> "hero-section-mobile-dark.png"
 */

type ScreenshotPathOptions = {
  /** Screenshot name (will be slugified) */
  name: string;
  /** Viewport variant name (e.g., "mobile", "tablet", "1024x768") */
  viewport?: string;
  /** Color scheme variant */
  colorScheme?: 'light' | 'dark';
  /** Output format */
  format?: 'png' | 'jpeg';
};

/**
 * Slugify a string for use in filenames
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(?:^-|-$)/g, '');
}

/**
 * Generate screenshot filename
 */
export function generateScreenshotFilename(options: ScreenshotPathOptions): string {
  const { name, viewport, colorScheme, format = 'png' } = options;

  const parts = [slugify(name)];

  if (viewport) {
    parts.push(viewport);
  }

  if (colorScheme) {
    parts.push(colorScheme);
  }

  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `${parts.join('-')}.${extension}`;
}
