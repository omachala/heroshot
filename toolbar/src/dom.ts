/**
 * DOM utility functions for the element picker
 */

/**
 * Get element from point, piercing shadow DOMs
 */
export function deepElementFromPoint(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  if (!el) return null;

  // Traverse into shadow roots
  while (el.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }

  return el;
}

/**
 * Get unique CSS selector for element, with shadow DOM support
 */
export function getSelector(el: Element): string {
  if (el.id && !el.id.startsWith('heroshot')) {
    return `#${el.id}`;
  }

  const path: string[] = [];
  let current: Element | null = el;

  for (let depth = 0; current?.nodeType === Node.ELEMENT_NODE && depth < 8; depth++) {
    let selector = current.tagName.toLowerCase();

    if (current.id && !current.id.startsWith('heroshot')) {
      path.unshift(`#${current.id}`);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .filter((cls) => cls && !cls.startsWith('heroshot'));
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.');
      }
    }

    // Add nth-of-type if there are siblings with same tag
    const parentNode: HTMLElement | null = current.parentElement;
    if (parentNode) {
      const currentTagName = current.tagName;
      const siblings: Element[] = [];
      for (const child of parentNode.children) {
        if (child.tagName === currentTagName) {
          siblings.push(child);
        }
      }
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);

    // Determine next element - check if we're inside a shadow root
    const root = current.getRootNode();
    if (root instanceof ShadowRoot) {
      // Add shadow DOM piercing indicator and continue from shadow host
      path.unshift('>>>');
      current = root.host;
    } else if (parentNode) {
      current = parentNode;
    } else {
      current = null;
    }
  }

  return path.join(' > ').replace(/> >>> >/g, ' >>> ');
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
export function updateOverlay(
  overlay: HTMLDivElement,
  rect: DOMRect | null
): void {
  // Clear previous overlay
  overlay.innerHTML = '';

  if (!rect) {
    overlay.style.display = 'none';
    return;
  }

  overlay.style.display = 'block';

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Top dark area
  const top = document.createElement('div');
  top.className = 'heroshot-overlay-dark';
  top.style.cssText = `top:0;left:0;width:${String(vw)}px;height:${String(rect.top)}px;`;
  overlay.appendChild(top);

  // Bottom dark area
  const bottom = document.createElement('div');
  bottom.className = 'heroshot-overlay-dark';
  bottom.style.cssText = `top:${String(rect.bottom)}px;left:0;width:${String(vw)}px;height:${String(vh - rect.bottom)}px;`;
  overlay.appendChild(bottom);

  // Left dark area
  const left = document.createElement('div');
  left.className = 'heroshot-overlay-dark';
  left.style.cssText = `top:${String(rect.top)}px;left:0;width:${String(rect.left)}px;height:${String(rect.height)}px;`;
  overlay.appendChild(left);

  // Right dark area
  const right = document.createElement('div');
  right.className = 'heroshot-overlay-dark';
  right.style.cssText = `top:${String(rect.top)}px;left:${String(rect.right)}px;width:${String(vw - rect.right)}px;height:${String(rect.height)}px;`;
  overlay.appendChild(right);

  // Highlight border around element
  const highlight = document.createElement('div');
  highlight.className = 'heroshot-highlight';
  highlight.style.cssText = `top:${String(rect.top)}px;left:${String(rect.left)}px;width:${String(rect.width)}px;height:${String(rect.height)}px;`;
  overlay.appendChild(highlight);
}
