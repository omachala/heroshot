/**
 * DOM utility functions for the element picker
 */

/** Check if background color is non-transparent */
const isOpaqueColor = (bgColor: string): boolean =>
  Boolean(bgColor && bgColor !== 'transparent' && !bgColor.startsWith('rgba(0, 0, 0, 0)'));

/** Convert rgb/rgba color string to hex format */
const colorToHex = (bgColor: string): string => {
  const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bgColor);
  if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
    const red = Number.parseInt(rgbMatch[1], 10);
    const green = Number.parseInt(rgbMatch[2], 10);
    const blue = Number.parseInt(rgbMatch[3], 10);
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  }
  return bgColor;
};

/**
 * Get the visible background color of an element by walking up the DOM tree.
 * Returns the first non-transparent background color found, or white as fallback.
 */
export function getBackgroundColor(element: Element): string {
  // Start from the element itself (it may have the background we want)
  let current: Element | null = element;

  while (current) {
    const style = globalThis.getComputedStyle(current);
    const bgColor = style.backgroundColor;

    if (isOpaqueColor(bgColor)) {
      return colorToHex(bgColor);
    }

    // Move up: if at shadow root boundary, pierce to host
    const root = current.getRootNode();
    current = root instanceof ShadowRoot ? root.host : current.parentElement;
  }

  // Fallback to white if nothing found
  return '#ffffff';
}

/**
 * Get element from point, piercing shadow DOMs
 */
export function deepElementFromPoint(x: number, y: number): Element | null {
  let element = document.elementFromPoint(x, y);
  if (!element) return null;

  // Traverse into shadow roots
  while (element?.shadowRoot) {
    const inner: Element | null = element.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === element) break;
    element = inner;
  }

  return element;
}

/**
 * Get unique CSS selector for element, with shadow DOM support
 */
export function getSelector(element: Element): string {
  // Quick return for light DOM elements with ID
  const elementRoot = element.getRootNode();
  if (element.id && !element.id.startsWith('heroshot') && !(elementRoot instanceof ShadowRoot)) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  for (let depth = 0; current?.nodeType === Node.ELEMENT_NODE && depth < 20; depth++) {
    const root = current.getRootNode();
    const isInShadow = root instanceof ShadowRoot;
    const parent: HTMLElement | null = current.parentElement;

    let selector = current.tagName.toLowerCase();

    // Use ID if available
    if (current.id && !current.id.startsWith('heroshot')) {
      selector = `#${current.id}`;
      // In light DOM, ID is unique - we can stop here
      if (!isInShadow) {
        path.unshift(selector);
        break;
      }
      // In shadow DOM, ID is scoped - use it but continue building path
    } else {
      // Add classes for non-ID elements
      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter(cls => cls && !cls.startsWith('heroshot'));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }
    }

    // Add nth-of-type to disambiguate siblings with same tag
    // Get siblings from parent, or from shadow root for top-level shadow elements
    const siblingContainer: ParentNode | null =
      parent ?? (root instanceof ShadowRoot ? root : null);

    if (siblingContainer) {
      const currentTagName: string = current.tagName;
      const siblings: Element[] = [...siblingContainer.children].filter(
        child => child.tagName === currentTagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);

    // Determine next element
    if (parent) {
      // Continue up the tree (works both in light DOM and within shadow DOM)
      current = parent;
    } else if (root instanceof ShadowRoot) {
      // Reached top of shadow tree, pierce to host
      path.unshift('>>');
      current = root.host;
    } else {
      current = null;
    }
  }

  // Join path and clean up shadow DOM syntax
  return path.join(' > ').replaceAll('> >> >', ' >> ');
}

/**
 * Create the toolbar HTML element
 */
export function createToolbar(): HTMLDivElement {
  const toolbar = document.createElement('div');
  toolbar.id = 'heroshot-toolbar';
  toolbar.innerHTML = `
    <button id="heroshot-picker-btn" title="Pick element">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    </button>
    <span id="heroshot-status">Click crosshair to pick element</span>
  `;
  return toolbar;
}

/**
 * Create the overlay container element
 */
export function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'heroshot-overlay';
  overlay.style.display = 'none';
  return overlay;
}

/**
 * Update overlay to show dark areas around element
 */
export function updateOverlay(overlay: HTMLDivElement, rect: DOMRect | null): void {
  // Clear previous overlay
  overlay.innerHTML = '';

  if (!rect) {
    overlay.style.display = 'none';
    return;
  }

  overlay.style.display = 'block';

  const { innerWidth, innerHeight } = globalThis;

  // Top dark area
  const top = document.createElement('div');
  top.className = 'heroshot-overlay-dark';
  top.style.cssText = `top:0;left:0;width:${String(innerWidth)}px;height:${String(rect.top)}px;`;
  overlay.append(top);

  // Bottom dark area
  const bottom = document.createElement('div');
  bottom.className = 'heroshot-overlay-dark';
  bottom.style.cssText = `top:${String(rect.bottom)}px;left:0;width:${String(innerWidth)}px;height:${String(innerHeight - rect.bottom)}px;`;
  overlay.append(bottom);

  // Left dark area
  const left = document.createElement('div');
  left.className = 'heroshot-overlay-dark';
  left.style.cssText = `top:${String(rect.top)}px;left:0;width:${String(rect.left)}px;height:${String(rect.height)}px;`;
  overlay.append(left);

  // Right dark area
  const right = document.createElement('div');
  right.className = 'heroshot-overlay-dark';
  right.style.cssText = `top:${String(rect.top)}px;left:${String(rect.right)}px;width:${String(innerWidth - rect.right)}px;height:${String(rect.height)}px;`;
  overlay.append(right);

  // Highlight border around element
  const highlight = document.createElement('div');
  highlight.className = 'heroshot-highlight';
  highlight.style.cssText = `top:${String(rect.top)}px;left:${String(rect.left)}px;width:${String(rect.width)}px;height:${String(rect.height)}px;`;
  overlay.append(highlight);
}
