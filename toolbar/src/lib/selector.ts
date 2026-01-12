/**
 * CSS selector utilities
 */

/**
 * Query selector that pierces shadow DOM using >>> syntax
 * e.g., "host-element >>> .inner-class >>> span"
 */
export function querySelectorPiercing(selector: string): Element | null {
  const parts = selector.split('>>>').map(selectorPart => selectorPart.trim());
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
  return selector.includes('>>>')
    ? querySelectorPiercing(selector)
    : document.querySelector(selector);
}
