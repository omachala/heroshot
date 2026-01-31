/**
 * CSS selector utilities
 */

/**
 * Query selector that pierces shadow DOM using >>> or >> syntax
 * e.g., "host-element >>> .inner-class >>> span"
 * e.g., "host-element >> .inner-class >> span" (Playwright-style)
 */
export function querySelectorPiercing(selector: string): Element | null {
  // Normalize >>> to >> then split on >>
  // This supports both legacy >>> and Playwright-style >> syntax
  const normalized = selector.replaceAll('>>>', '>>');
  const parts = normalized
    .split('>>')
    .map(p => p.trim())
    .filter(Boolean);
  let foundElement: Element | null = null;

  for (const part of parts) {
    if (!part) continue;

    // Query within current context (document or shadow root)
    let root: ParentNode;
    if (foundElement === null) {
      root = document;
    } else if (foundElement.shadowRoot) {
      root = foundElement.shadowRoot;
    } else {
      root = foundElement;
    }

    const result = root.querySelector(part);
    if (!result) {
      return null;
    }

    foundElement = result;
  }

  return foundElement;
}

/**
 * Find element by selector, with shadow DOM support
 */
export function findElementBySelector(selector: string): Element | null {
  return selector.includes('>>>') || selector.includes('>>')
    ? querySelectorPiercing(selector)
    : document.querySelector(selector);
}
