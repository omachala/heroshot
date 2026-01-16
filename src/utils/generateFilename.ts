/**
 * Generate a filename from URL
 * e.g., "https://example.com/foo/bar" -> "example-com-foo-bar.png"
 */
export function generateFilename(url: string, format: 'png' | 'jpeg'): string {
  try {
    const parsed = new URL(url);
    const parts = [parsed.hostname, ...parsed.pathname.split('/').filter(Boolean)];
    const base = parts
      .join('-')
      .replaceAll(/[^\w-]/g, '-')
      .replaceAll(/-+/g, '-');
    return `${base || 'screenshot'}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  } catch {
    return `screenshot.${format === 'jpeg' ? 'jpg' : 'png'}`;
  }
}
