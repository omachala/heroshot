/**
 * Browser context functions for DOM manipulation.
 * These functions execute in the browser via page.evaluate(fn, ...args).
 *
 * IMPORTANT: These functions run in browser context, not Node.js.
 * They cannot access Node modules or closures - all data must be passed as arguments.
 *
 * NOTE: Most functions that need nested helpers or module-level constants have been
 * moved to use string-based evaluation in their respective wrapper files to avoid
 * tsx __name wrapper issues. Only simple functions are exported here.
 */

/// <reference lib="dom" />

/**
 * Traverse a selector that may contain '>>>' or '>>' for shadow DOM piercing.
 * Supports both legacy '>>>' and Playwright-style '>>' syntax.
 * Returns the found element or null.
 */
export function querySelectorDeep(selector: string): Element | null {
  // Normalize >>> to >> then split on >>
  // This supports both legacy >>> and Playwright-style >> syntax
  const normalized = selector.replaceAll('>>>', '>>');
  const parts = normalized
    .split('>>')
    .map(p => p.trim())
    .filter(Boolean);
  let current: ParentNode = document;

  for (const part of parts) {
    if (!part) continue;
    const root: ParentNode =
      current instanceof Element && current.shadowRoot ? current.shadowRoot : current;
    const found: Element | null = root.querySelector(part);
    if (!found) return null;
    current = found;
  }

  return current instanceof Element ? current : null;
}

/**
 * Convert RGB/RGBA color string to hex format.
 */
function rgbToHex(bgColor: string): string {
  const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bgColor);
  if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
    const red = Number.parseInt(rgbMatch[1], 10);
    const green = Number.parseInt(rgbMatch[2], 10);
    const blue = Number.parseInt(rgbMatch[3], 10);
    return (
      '#' +
      red.toString(16).padStart(2, '0') +
      green.toString(16).padStart(2, '0') +
      blue.toString(16).padStart(2, '0')
    );
  }
  return bgColor;
}

/**
 * Check if a background color is opaque (not transparent).
 */
function isOpaqueColor(bgColor: string): boolean {
  return Boolean(bgColor && bgColor !== 'transparent' && !bgColor.startsWith('rgba(0, 0, 0, 0)'));
}

/**
 * Detect the visible background color by walking up the DOM tree.
 */
export function detectBackgroundColor(selector: string): string {
  const element = querySelectorDeep(selector);
  if (!element) return '#ffffff';

  let current: Element | null = element;
  while (current) {
    const { backgroundColor } = globalThis.getComputedStyle(current);

    if (isOpaqueColor(backgroundColor)) {
      return rgbToHex(backgroundColor);
    }

    const root = current.getRootNode();
    current = root instanceof ShadowRoot ? root.host : current.parentElement;
  }

  const { backgroundColor: bodyBg } = globalThis.getComputedStyle(document.body);
  if (isOpaqueColor(bodyBg)) return rgbToHex(bodyBg);

  const { backgroundColor: htmlBg } = globalThis.getComputedStyle(document.documentElement);
  if (isOpaqueColor(htmlBg)) return rgbToHex(htmlBg);

  return '#ffffff';
}

type ApplyBackgroundArguments = {
  selector: string;
  bgColor: string;
};

/**
 * Apply a background color to an element, storing the original.
 */
export function applyBackground({ selector, bgColor }: ApplyBackgroundArguments): void {
  const element = querySelectorDeep(selector);
  if (!element || !(element instanceof HTMLElement)) return;

  element.dataset['heroshotOriginalBg'] = element.style.backgroundColor;
  element.style.backgroundColor = bgColor;
}

/**
 * Restore the original background color on an element.
 */
export function restoreBackground(selector: string): void {
  const element = querySelectorDeep(selector);
  if (!element || !(element instanceof HTMLElement)) return;

  // eslint-disable-next-line prefer-destructuring -- false positive: we ARE destructuring
  const { heroshotOriginalBg } = element.dataset;
  if (heroshotOriginalBg !== undefined) {
    element.style.backgroundColor = heroshotOriginalBg;
    delete element.dataset['heroshotOriginalBg'];
  }
}

type ApplyTextOverridesArguments = {
  containerSelector: string;
  overrides: Record<string, string>;
};

/**
 * Apply text overrides to elements within a container.
 */
export function applyTextOverrides({
  containerSelector,
  overrides,
}: ApplyTextOverridesArguments): void {
  const container = querySelectorDeep(containerSelector);
  if (!container) return;

  for (const [relativeSelector, newText] of Object.entries(overrides)) {
    const textElement = container.querySelector(relativeSelector);
    if (textElement) {
      textElement.textContent = newText;
    }
  }
}

/**
 * Apply or remove dark mode class on document element.
 */
export function applyColorScheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
}

type ScrollToArguments = {
  x: number;
  y: number;
};

/**
 * Scroll the window to a specific position.
 */
export function scrollTo({ x, y }: ScrollToArguments): void {
  window.scrollTo(x, y);
}
