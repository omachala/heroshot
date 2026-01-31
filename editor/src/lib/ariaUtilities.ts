/**
 * ARIA Utilities
 *
 * Functions for detecting ARIA roles and computing accessible names.
 * Used by SelectorGenerator to create stable, semantic selectors.
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/
 * @see https://www.w3.org/TR/accname-1.2/
 */

/**
 * Implicit role mappings for HTML elements.
 * Based on ARIA in HTML specification.
 * @see https://www.w3.org/TR/html-aria/
 */
const IMPLICIT_ROLES: Record<string, string | ((element: Element) => string | null)> = {
  button: 'button',
  a: element => (element.hasAttribute('href') ? 'link' : null),
  input: element => {
    const inputElement = element instanceof HTMLInputElement ? element : null;
    const type = inputElement?.type || 'text';
    switch (type) {
      case 'button':
      case 'submit':
      case 'reset':
      case 'image': {
        return 'button';
      }
      case 'checkbox': {
        return 'checkbox';
      }
      case 'radio': {
        return 'radio';
      }
      case 'range': {
        return 'slider';
      }
      case 'search': {
        return 'searchbox';
      }
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
      case '': {
        return 'textbox';
      }
      default: {
        return 'textbox';
      }
    }
  },
  textarea: 'textbox',
  select: element => {
    const selectElement = element instanceof HTMLSelectElement ? element : null;
    return selectElement?.multiple ? 'listbox' : 'combobox';
  },
  img: element => (element.hasAttribute('alt') ? 'img' : null),
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  nav: 'navigation',
  main: 'main',
  article: 'article',
  aside: 'complementary',
  header: 'banner',
  footer: 'contentinfo',
  form: 'form',
  section: 'region',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  table: 'table',
  tr: 'row',
  th: 'columnheader',
  td: 'cell',
  dialog: 'dialog',
  menu: 'menu',
  menuitem: 'menuitem',
  progress: 'progressbar',
  meter: 'meter',
};

/**
 * Get the ARIA role of an element.
 * Returns explicit role if set, otherwise computes implicit role from HTML semantics.
 */
export function getAriaRole(element: Element): string | null {
  // Check for explicit role attribute
  const explicitRole = element.getAttribute('role');
  if (explicitRole) {
    return explicitRole;
  }

  // Check for implicit role based on element type
  const tagName = element.tagName.toLowerCase();
  const implicitRole = IMPLICIT_ROLES[tagName];

  if (typeof implicitRole === 'function') {
    return implicitRole(element);
  }

  return implicitRole ?? null;
}

/**
 * Get name from aria-labelledby attribute
 */
function getNameFromLabelledBy(element: Element): string | null {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (!labelledBy) return null;

  const names = labelledBy
    .split(/\s+/)
    .map(id => {
      const labelElement = document.querySelector(`#${id}`);
      return labelElement?.textContent?.trim() ?? '';
    })
    .filter(Boolean);

  return names.length > 0 ? names.join(' ') : null;
}

/**
 * Get name from associated label for input/textarea
 */
function getNameFromInputLabel(element: HTMLInputElement | HTMLTextAreaElement): string | null {
  // Check for label[for="id"]
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return normalizeWhitespace(label.textContent ?? '');
    }
  }

  // Check for wrapping label
  const wrappingLabel = element.closest('label');
  if (wrappingLabel) {
    const clone = wrappingLabel.cloneNode(true);
    if (!(clone instanceof HTMLElement)) {
      return null;
    }
    const inputs = clone.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      input.remove();
    }
    return normalizeWhitespace(clone.textContent ?? '');
  }

  // Check placeholder
  if (element.placeholder) {
    return element.placeholder;
  }

  return null;
}

/**
 * Get name from input element (image alt, button value)
 */
function getNameFromInputValue(element: HTMLInputElement): string | null {
  if (element.type === 'image' && element.alt) {
    return element.alt;
  }

  const buttonTypes = ['submit', 'button', 'reset'];
  if (buttonTypes.includes(element.type) && element.value) {
    return element.value;
  }

  return null;
}

/**
 * Get the accessible name of an element.
 * Follows the accessible name computation algorithm (simplified).
 * @see https://www.w3.org/TR/accname-1.2/
 */
export function getAccessibleName(element: Element): string {
  // 1. aria-labelledby takes highest priority
  const labelledByName = getNameFromLabelledBy(element);
  if (labelledByName) return labelledByName;

  // 2. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // 3. For inputs, check associated label
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const labelName = getNameFromInputLabel(element);
    if (labelName) return labelName;
  }

  // 4. For images, use alt text
  if (element instanceof HTMLImageElement && element.alt) {
    return element.alt;
  }

  // 5. For inputs, check alt (image) and value (buttons)
  if (element instanceof HTMLInputElement) {
    const inputName = getNameFromInputValue(element);
    if (inputName) return inputName;
  }

  // 6. title attribute as fallback
  const title = element.getAttribute('title');
  if (title) return title;

  // 7. Text content for buttons, links, and other elements
  const textContent = element.textContent;
  if (textContent) {
    return normalizeWhitespace(textContent);
  }

  return '';
}

/**
 * Normalize whitespace in a string.
 * Collapses multiple spaces/newlines into single spaces and trims.
 */
function normalizeWhitespace(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

/**
 * Check if an ID looks like a GUID, UUID, or auto-generated ID.
 * These IDs are unstable and should not be used in selectors.
 */
export function isGuidLike(id: string): boolean {
  // Empty IDs are not GUID-like
  if (!id) {
    return false;
  }

  // UUID pattern: 8-4-4-4-12 hex digits with or without dashes
  const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) {
    return true;
  }

  // React useId pattern: :r1:, :R2a:, etc.
  const reactIdPattern = /^:[rR][0-9a-z]*:$/;
  if (reactIdPattern.test(id)) {
    return true;
  }

  // Purely numeric IDs are likely auto-generated
  if (/^\d+$/.test(id)) {
    return true;
  }

  // Long hex strings (12+ chars of only hex digits)
  if (/^[0-9a-f]{12,}$/i.test(id)) {
    return true;
  }

  // IDs that are mostly numbers with some structure (like el_123_456 or component_1234567)
  // Count digits vs letters
  const digits = (id.match(/\d/g) || []).length;
  const letters = (id.match(/[a-zA-Z]/g) || []).length;

  // If more than 50% digits and has 4+ digits, likely auto-generated
  if (digits >= 4 && digits / (digits + letters) > 0.5) {
    return true;
  }

  return false;
}
