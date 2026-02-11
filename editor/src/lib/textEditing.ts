/**
 * Text editing module - handles inline text editing, highlights, and hover overlays
 * for text elements within the selected screenshot element.
 *
 * All functions are pure or use DOM manipulation only (no Svelte runes).
 * Reactive state is managed by the parent component via callbacks.
 */
import { TEXT_EDIT_HIGHLIGHT_COLOR, Z_INDEX_ANNOTATION } from '../constants';

/** Tooltip data exposed to the parent component */
export type TextTooltip = {
  text: string;
  x: number;
  y: number;
};

/**
 * Generate a CSS selector for textElement relative to containerElement.
 * Builds a path from textElement up to containerElement using tags, IDs, classes,
 * and nth-of-type for uniqueness.
 */
export function getRelativeSelector(textElement: Element, containerElement: Element): string {
  const parts: string[] = [];
  let current: Element | null = textElement;

  while (current && current !== containerElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }

    if (current.classList.length > 0) {
      selector += '.' + [...current.classList].join('.');
    }

    const parent = current.parentElement;
    if (parent) {
      const currentTagName = current.tagName;
      const siblings = [...parent.children].filter(child => child.tagName === currentTagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(' > ');
}

/**
 * Apply text overrides to DOM elements within a container.
 */
export function applyTextOverrides(
  containerElement: Element,
  textOverrides: Record<string, string>
): void {
  for (const [relativeSelector, newText] of Object.entries(textOverrides)) {
    const textElement = containerElement.querySelector(relativeSelector);
    if (textElement) {
      textElement.textContent = newText;
    } else {
      globalThis.console.warn(`[heroshot] Text override target not found: ${relativeSelector}`);
    }
  }
}

type TextEditCallbacks = {
  onTextEditChange: (editing: boolean) => void;
  onTextOverrideUpdate: (screenshotId: string, selector: string, text: string) => void;
  onTooltipChange: (tooltip: TextTooltip | null) => void;
  /** Get current selected element and editing screenshot ID */
  getContext: () => { selectedElement: Element | null; editingScreenshotId: string | null };
};

/**
 * Creates a text editing manager that handles:
 * - Highlighting text elements within a container
 * - Hover overlays for text elements
 * - Inline contentEditable text editing
 * - Saving text overrides via callbacks
 *
 * Returns an object with highlight/clear methods. Parent manages reactive state.
 */
export function createTextEditingManager(callbacks: TextEditCallbacks) {
  let highlightedTextElements: HTMLElement[] = [];
  let editingTextElement: HTMLElement | null = null;
  let editingTextOriginal = '';
  let hoverOverlay: HTMLElement | null = null;
  let hoveredTextElement: HTMLElement | null = null;

  function removeHoverOverlay(): void {
    if (hoverOverlay) {
      hoverOverlay.remove();
      hoverOverlay = null;
    }
    hoveredTextElement = null;
    callbacks.onTooltipChange(null);
  }

  function exitTextEdit(element: HTMLElement): void {
    element.contentEditable = 'false';
    if (editingTextElement === element) {
      editingTextElement = null;
    }
    callbacks.onTextEditChange(false);
  }

  function handleTextOverlayMouseMove(event: MouseEvent): void {
    callbacks.onTooltipChange({ text: 'Click to edit', x: event.clientX, y: event.clientY });
  }

  function handleTextOverlayMouseLeave(): void {
    removeHoverOverlay();
  }

  function handleTextOverlayClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const element = hoveredTextElement;
    if (!element) return;

    removeHoverOverlay();

    if (editingTextElement && editingTextElement !== element) {
      exitTextEdit(editingTextElement);
    }

    editingTextElement = element;
    editingTextOriginal = element.textContent ?? '';
    element.contentEditable = 'true';
    element.focus();

    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = globalThis.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    callbacks.onTooltipChange(null);
    callbacks.onTextEditChange(true);
  }

  function createHoverOverlay(element: HTMLElement): void {
    removeHoverOverlay();

    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: ${Z_INDEX_ANNOTATION};
      cursor: text;
      outline: 2px solid ${TEXT_EDIT_HIGHLIGHT_COLOR};
      outline-offset: 2px;
      background: transparent;
      pointer-events: auto;
    `;
    overlay.dataset['heroshotOverlay'] = 'true';

    overlay.addEventListener('mouseleave', handleTextOverlayMouseLeave);
    overlay.addEventListener('mousemove', handleTextOverlayMouseMove);
    overlay.addEventListener('click', handleTextOverlayClick);

    document.body.append(overlay);
    hoverOverlay = overlay;
    hoveredTextElement = element;
  }

  function handleTextMouseEnter(event: MouseEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    const element = event.currentTarget;
    if (editingTextElement === element) return;

    createHoverOverlay(element);
    callbacks.onTooltipChange({ text: 'Click to edit', x: event.clientX, y: event.clientY });
  }

  function handleTextBlur(event: FocusEvent): void {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    const element = event.currentTarget;
    const newText = element.textContent ?? '';

    const { selectedElement, editingScreenshotId } = callbacks.getContext();
    if (newText !== editingTextOriginal && selectedElement && editingScreenshotId) {
      const relativeSelector = getRelativeSelector(element, selectedElement);
      callbacks.onTextOverrideUpdate(editingScreenshotId, relativeSelector, newText);
    }

    exitTextEdit(element);
  }

  function handleTextKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.blur();
      }
    }
  }

  function highlightTextElements(container: Element): void {
    clearHighlights();

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const text = node.textContent?.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tagName = parent.tagName.toLowerCase();
        if (tagName === 'script' || tagName === 'style') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textParents = new Set<Element>();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (parent && !parent.closest('#heroshot-root')) {
        textParents.add(parent);
      }
    }

    for (const element of textParents) {
      if (!(element instanceof HTMLElement)) continue;
      element.dataset['heroshotTextHighlight'] = 'true';
      element.style.outlineOffset = '2px';

      element.addEventListener('mouseenter', handleTextMouseEnter);
      element.addEventListener('blur', handleTextBlur);
      element.addEventListener('keydown', handleTextKeyDown);

      highlightedTextElements.push(element);
    }
  }

  function clearHighlights(): void {
    removeHoverOverlay();

    for (const element of highlightedTextElements) {
      element.removeEventListener('mouseenter', handleTextMouseEnter);
      element.removeEventListener('blur', handleTextBlur);
      element.removeEventListener('keydown', handleTextKeyDown);

      delete element.dataset['heroshotTextHighlight'];
      element.style.outlineOffset = '';
      element.contentEditable = 'false';
    }
    highlightedTextElements = [];
    editingTextElement = null;
  }

  return {
    highlightTextElements,
    clearHighlights,
  };
}
