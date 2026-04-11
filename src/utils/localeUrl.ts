/**
 * Apply locale to a URL by replacing the {locale} placeholder.
 * If the URL contains no placeholder, it is returned unchanged.
 *
 * @example
 * applyLocale('http://localhost:5173/{locale}/about', 'de')
 * // → 'http://localhost:5173/de/about'
 *
 * applyLocale('http://localhost:5173/about', 'de')
 * // → 'http://localhost:5173/about'
 */
export function applyLocale(url: string, locale: string): string {
  return url.replaceAll('{locale}', locale);
}
