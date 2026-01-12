/**
 * Name generation utilities for screenshots
 */

/**
 * Extract a human-readable name from a CSS selector
 * e.g., ".hero-section" → "hero-section"
 *       "#contact-form" → "contact-form"
 *       "div.card:nth-of-type(3)" → "card 3"
 */
export function extractSelectorName(selector: string): string {
  // Get the last part of the selector (most specific)
  // Split on >>> or > with optional single space around them
  const parts = selector.split(/ ?(?:>>>|>) ?/);
  const lastPart = parts.at(-1) ?? selector;

  // Try to extract ID
  const idMatch = /#([a-z0-9_-]+)/i.exec(lastPart);
  if (idMatch?.[1]) {
    return idMatch[1].replaceAll('-', ' ').replaceAll('_', ' ');
  }

  // Try to extract class name
  const classMatch = /\.([a-z0-9_-]+)/i.exec(lastPart);
  if (classMatch?.[1]) {
    const className = classMatch[1].replaceAll('-', ' ').replaceAll('_', ' ');

    // Check for nth-of-type
    const nthMatch = /:nth-of-type\((\d+)\)/.exec(lastPart);
    if (nthMatch?.[1]) {
      return `${className} ${nthMatch[1]}`;
    }

    return className;
  }

  // Fall back to tag name
  const tagMatch = /^([a-z0-9]+)/i.exec(lastPart);
  if (tagMatch?.[1]) {
    const tagName = tagMatch[1];
    const nthMatch = /:nth-of-type\((\d+)\)/.exec(lastPart);
    if (nthMatch?.[1]) {
      return `${tagName} ${nthMatch[1]}`;
    }
    return tagName;
  }

  return 'element';
}

/**
 * Generate a smart name from page title and selector
 * e.g., "Heroshot.sh - hero-section" or "Dashboard - card 3"
 */
export function generateSmartName(selector: string): string {
  // Get page title, clean it up
  let pageTitle = document.title || 'Page';
  // Truncate long titles
  if (pageTitle.length > 30) {
    pageTitle = pageTitle.slice(0, 30).trim();
  }

  // Extract meaningful part from selector
  const selectorPart = extractSelectorName(selector);

  return `${pageTitle} - ${selectorPart}`;
}

/**
 * Generate a random UID (8 chars)
 */
export function generateUid(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- Not used for security, just unique IDs
  return Math.random().toString(36).slice(2, 10);
}
