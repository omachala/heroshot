/**
 * Generate a filename from URL and optional selector
 * e.g., "https://example.com/foo/bar" + ".hero" -> "example-com-foo-bar--hero.png"
 */
export function generateScreenshotFilename(url: string, selector?: string): string {
  try {
    const parsed = new URL(url);
    const parts = [parsed.hostname, ...parsed.pathname.split('/').filter(Boolean)];
    let base = parts
      .join('-')
      .replaceAll(/[^\w-]/g, '-')
      .replaceAll(/-+/g, '-');
    if (selector) {
      const selectorPart = selector
        .replaceAll(/[^\w-]/g, '-')
        .replaceAll(/-+/g, '-')
        .slice(0, 20);
      base = `${base}-${selectorPart}`;
    }
    return `${base || 'screenshot'}.png`;
  } catch {
    return 'screenshot.png';
  }
}
