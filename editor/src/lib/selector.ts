/**
 * CSS and Playwright selector utilities
 *
 * Supports:
 * - CSS: `.class`, `#id`, `div > span`
 * - Role: `role=button[name="Submit"]`
 * - Text: `text="Submit"`
 * - Shadow DOM: `host >> inner` (Playwright-style) or `host >>> inner` (legacy)
 */

import { getAccessibleName, getAriaRole } from './ariaUtilities';

/**
 * Query by role selector: role=button[name="Submit"]
 */
function queryByRole(selector: string, root: ParentNode = document): Element | null {
  const match = /^role=(\w+)(?:\[name="([^"]+)"\])?$/.exec(selector);
  if (!match?.[1]) return null;

  const role = match[1];
  const name = match[2];

  const elements = root.querySelectorAll('*');
  for (const element of elements) {
    const elementRole = getAriaRole(element);
    if (elementRole !== role) continue;

    if (name) {
      const elementName = getAccessibleName(element);
      if (elementName !== name) continue;
    }

    return element;
  }

  return null;
}

/**
 * Query by text selector: text="Submit"
 */
function queryByText(selector: string, root: ParentNode = document): Element | null {
  const match = /^text="([^"]+)"$/.exec(selector);
  if (!match?.[1]) return null;

  const targetText = match[1];
  const rootNode = root instanceof Node ? root : document;
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);

  let node = walker.nextNode();
  while (node) {
    if (node instanceof Text) {
      const text = (node.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
      if (text === targetText && node.parentElement) {
        return node.parentElement;
      }
    }
    node = walker.nextNode();
  }

  return null;
}

/**
 * Query for a single selector part (handles role=, text=, or CSS)
 */
function querySelectorPart(part: string, root: ParentNode): Element | null {
  if (part.startsWith('role=')) {
    return queryByRole(part, root);
  }
  if (part.startsWith('text=')) {
    return queryByText(part, root);
  }
  // Standard CSS selector
  try {
    return root.querySelector(part);
  } catch {
    return null;
  }
}

/**
 * Query selector that pierces shadow DOM using >>> or >> syntax
 * Supports Playwright-format selectors (role=, text=) in each part.
 *
 * e.g., "host-element >> role=button[name='Submit']"
 * e.g., "host-element >>> .inner-class >>> span" (legacy)
 */
export function querySelectorPiercing(selector: string): Element | null {
  // Normalize >>> to >> then split on >>
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

    const result = querySelectorPart(part, root);
    if (!result) {
      return null;
    }

    foundElement = result;
  }

  return foundElement;
}

/**
 * Find element by selector, with shadow DOM and Playwright selector support
 *
 * Supports:
 * - CSS: document.querySelector compatible
 * - role=button[name="Submit"]: ARIA role with optional name
 * - text="Submit": exact text content match
 * - Shadow DOM: >> or >>> syntax for piercing
 */
export function findElementBySelector(selector: string): Element | null {
  // Playwright-style selectors (role=, text=) or shadow DOM piercing
  if (
    selector.includes('>>>') ||
    selector.includes('>>') ||
    selector.startsWith('role=') ||
    selector.startsWith('text=')
  ) {
    return querySelectorPiercing(selector);
  }

  // Standard CSS selector
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}
