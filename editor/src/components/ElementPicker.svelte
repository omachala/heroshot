<script lang="ts">
  import { deepElementFromPoint, getBackgroundColor, getSelector } from '../lib/dom';
  import { findElementBySelector } from '../lib/selector';
  import type { ElementFill, Padding, PaddingFill, ScreenshotItem, ScrollPosition } from '../types';

  type Props = {
    /** Whether picker mode is active */
    active: boolean;
    /** Screenshots list (for loading saved padding) */
    screenshots: ScreenshotItem[];
    /** Callback when picker mode should toggle */
    onToggle: () => void;
    /** Callback when new element is picked (creates draft) */
    onNewElement: (selector: string) => void;
    /** Callback when existing screenshot padding is updated */
    onPaddingUpdate: (id: string, padding: Padding) => void;
    /** Callback when existing screenshot scroll position is updated */
    onScrollUpdate: (id: string, scroll: ScrollPosition) => void;
    /** Callback when existing screenshot paddingFill is updated */
    onPaddingFillUpdate: (id: string, paddingFill: PaddingFill) => void;
    /** Callback when existing screenshot elementFill is updated */
    onElementFillUpdate: (id: string, elementFill: ElementFill) => void;
    /** Callback when text override is updated */
    onTextOverrideUpdate: (id: string, selector: string, text: string) => void;
    /** Callback when draft/edit is cancelled */
    onCancel: () => void;
    /** Callback when selection is cleared (clicking outside) */
    onDeselect: () => void;
  }

  const { active, screenshots, onToggle, onNewElement, onPaddingUpdate, onScrollUpdate, onPaddingFillUpdate, onElementFillUpdate, onTextOverrideUpdate, onCancel, onDeselect }: Props = $props();

  // Default padding
  const defaultPadding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };
  const defaultScroll: ScrollPosition = { x: 0, y: 0 };

  // State
  let currentElement = $state<Element | null>(null); // Element under cursor (picker mode)
  let selectedElement = $state<Element | null>(null); // Selected element for editing
  let selectedPadding = $state<Padding>({ ...defaultPadding });
  let originalPadding = $state<Padding>({ ...defaultPadding }); // For revert on Esc
  let selectedScroll = $state<ScrollPosition>({ ...defaultScroll });
  let editingScreenshotId = $state<string | null>(null); // ID if editing existing screenshot
  let isNewElement = $state(false); // True if this is a new pick (not editing existing)
  let paddingFill = $state<PaddingFill>('inherit'); // Background fill mode for padding
  let originalPaddingFill = $state<PaddingFill>('inherit'); // For revert on Esc
  let elementFill = $state<ElementFill>('original'); // Background fill mode for element
  let originalElementFill = $state<ElementFill>('original'); // For revert on Esc

  // Detected background color for the selected element (computed when element changes)
  let detectedBgColor = $derived(selectedElement ? getBackgroundColor(selectedElement) : '#ffffff');

  // Track original element styles for restoration
  let originalElementStyles: { bg: string; bgImage: string; bgSize: string } | null = null;
  let styledElement: HTMLElement | null = null;

  // Apply element background based on elementFill mode
  $effect(() => {
    const element = selectedElement instanceof HTMLElement ? selectedElement : null;

    // If element changed, restore previous element first
    if (styledElement && styledElement !== element && originalElementStyles) {
      styledElement.style.backgroundColor = originalElementStyles.bg;
      styledElement.style.backgroundImage = originalElementStyles.bgImage;
      styledElement.style.backgroundSize = originalElementStyles.bgSize;
      originalElementStyles = null;
      styledElement = null;
    }

    if (element) {
      // Store original on first selection
      if (!originalElementStyles) {
        originalElementStyles = {
          bg: element.style.backgroundColor,
          bgImage: element.style.backgroundImage,
          bgSize: element.style.backgroundSize,
        };
        styledElement = element;
      }

      // Apply background based on mode
      switch (elementFill) {
      case 'original': {
        element.style.backgroundColor = originalElementStyles.bg;
        element.style.backgroundImage = originalElementStyles.bgImage;
        element.style.backgroundSize = originalElementStyles.bgSize;
      
      break;
      }
      case 'solid': {
        element.style.backgroundColor = detectedBgColor;
        element.style.backgroundImage = 'none';
        element.style.backgroundSize = '';
      
      break;
      }
      case 'transparent': {
        // Show checkered pattern as background
        element.style.backgroundColor = 'transparent';
        element.style.backgroundImage = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)';
        element.style.backgroundSize = '16px 16px';
      
      break;
      }
      // No default
      }
    }
  });

  // Track highlighted text elements for cleanup
  let highlightedTextElements: HTMLElement[] = [];
  let editingTextElement: HTMLElement | null = null;
  let editingTextOriginal = '';
  let hoverOverlay: HTMLElement | null = null;
  let hoveredTextElement: HTMLElement | null = null;

  /**
   * Create overlay over text element to intercept clicks
   */
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
      z-index: 2147483645;
      cursor: default;
      outline: 2px solid #ec4899;
      outline-offset: 2px;
    `;
    overlay.dataset.heroshotOverlay = 'true';

    overlay.addEventListener('mouseleave', handleTextOverlayMouseLeave);
    overlay.addEventListener('mousemove', handleTextOverlayMouseMove);
    overlay.addEventListener('click', handleTextOverlayClick);

    document.body.append(overlay);
    hoverOverlay = overlay;
    hoveredTextElement = element;
  }

  /**
   * Remove hover overlay
   */
  function removeHoverOverlay(): void {
    if (hoverOverlay) {
      hoverOverlay.remove();
      hoverOverlay = null;
    }
    hoveredTextElement = null;
    tooltipData = null;
  }

  /**
   * Handle text element hover - create overlay
   */
  function handleTextMouseEnter(event: MouseEvent): void {
    // eslint-disable-next-line no-restricted-syntax -- event.currentTarget type narrowing
    const element = event.currentTarget as HTMLElement;
    if (editingTextElement === element) return;

    createHoverOverlay(element);
    tooltipData = { text: 'Click to edit' };
    tooltipX = event.clientX;
    tooltipY = event.clientY;
  }

  /**
   * Handle text overlay mouse move - update tooltip
   */
  function handleTextOverlayMouseMove(event: MouseEvent): void {
    tooltipX = event.clientX;
    tooltipY = event.clientY;
  }

  /**
   * Handle text overlay mouse leave - remove overlay
   */
  function handleTextOverlayMouseLeave(): void {
    removeHoverOverlay();
  }

  /**
   * Handle text overlay click - enter edit mode on the text element
   */
  function handleTextOverlayClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const element = hoveredTextElement;
    if (!element) return;

    // Remove overlay first
    removeHoverOverlay();

    // Exit previous edit if any
    if (editingTextElement && editingTextElement !== element) {
      exitTextEdit(editingTextElement);
    }

    editingTextElement = element;
    editingTextOriginal = element.textContent ?? '';
    element.contentEditable = 'true';
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = globalThis.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    tooltipData = null;
  }

  /**
   * Generate a selector for textEl relative to containerEl
   */
  function getRelativeSelector(textElement: Element, containerElement: Element): string {
    // Build path from textEl up to containerEl
    const parts: string[] = [];
    let current: Element | null = textElement;

    while (current && current !== containerElement) {
      let selector = current.tagName.toLowerCase();

      // Add id if present
      if (current.id) {
        selector = `#${current.id}`;
        parts.unshift(selector);
        break; // ID is unique enough
      }

      // Add classes
      if (current.classList.length > 0) {
        selector += '.' + [...current.classList].join('.');
      }

      // Add nth-child if needed for uniqueness
      const parent = current.parentElement;
      if (parent) {
        const currentTagName = current.tagName;
        const siblings = [...parent.children].filter(
          (child) => child.tagName === currentTagName
        );
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
   * Handle blur on text element - exit edit mode and save if changed
   */
  function handleTextBlur(event: FocusEvent): void {
    // eslint-disable-next-line no-restricted-syntax -- event.currentTarget type narrowing
    const element = event.currentTarget as HTMLElement;
    const newText = element.textContent ?? '';

    // Check if text changed and we have a valid context
    if (newText !== editingTextOriginal && selectedElement && editingScreenshotId) {
      const relativeSelector = getRelativeSelector(element, selectedElement);
      onTextOverrideUpdate(editingScreenshotId, relativeSelector, newText);
    }

    exitTextEdit(element);
  }

  /**
   * Handle keydown on text element
   */
  function handleTextKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      // eslint-disable-next-line no-restricted-syntax -- event.currentTarget type narrowing
      const element = event.currentTarget as HTMLElement;
      element.blur();
    }
  }

  /**
   * Exit text edit mode
   */
  function exitTextEdit(element: HTMLElement): void {
    element.contentEditable = 'false';
    if (editingTextElement === element) {
      editingTextElement = null;
    }
  }

  /**
   * Find and highlight all text elements inside the selected element
   */
  function highlightTextElements(container: Element): void {
    clearTextHighlights();

    // Find all elements that directly contain text
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          if (!text) return NodeFilter.FILTER_REJECT;
          // Skip if parent is script/style
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- not reactive, local to function
    const textParents = new Set<Element>();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (parent && !parent.closest('#heroshot-root')) {
        textParents.add(parent);
      }
    }

    // Add event handlers to each text-containing element (border shown on hover only)
    for (const element of textParents) {
      // eslint-disable-next-line no-restricted-syntax -- Element to HTMLElement narrowing
      const htmlElement = element as HTMLElement;
      htmlElement.dataset.heroshotTextHighlight = 'true';
      htmlElement.style.outlineOffset = '2px';

      // Add event listeners
      htmlElement.addEventListener('mouseenter', handleTextMouseEnter);
      htmlElement.addEventListener('blur', handleTextBlur);
      htmlElement.addEventListener('keydown', handleTextKeyDown);

      highlightedTextElements.push(htmlElement);
    }
  }

  /**
   * Remove text highlights
   */
  function clearTextHighlights(): void {
    removeHoverOverlay();

    for (const element of highlightedTextElements) {
      // Remove event listeners
      element.removeEventListener('mouseenter', handleTextMouseEnter);
      element.removeEventListener('blur', handleTextBlur);
      element.removeEventListener('keydown', handleTextKeyDown);

      // Reset styles
      delete element.dataset.heroshotTextHighlight;
      element.style.outlineOffset = '';
      element.contentEditable = 'false';
    }
    highlightedTextElements = [];
    editingTextElement = null;
  }

  // Highlight text elements when selection changes
  $effect(() => {
    if (selectedElement) {
      highlightTextElements(selectedElement);
    } else {
      clearTextHighlights();
    }
  });

  // Scroll tracking for overlay repositioning
  let scrollY = $state(globalThis.scrollY ?? 0);
  let scrollX = $state(globalThis.scrollX ?? 0);

  // Derived
  let showOverlay = $derived(
    (active && currentElement !== null) ||
    selectedElement !== null
  );
  let activeElement = $derived(selectedElement ?? currentElement);

  // Update cursor when active changes
  $effect(() => {
    document.body.style.cursor = active ? 'crosshair' : '';
  });

  // Clear tooltip when picker mode deactivates
  $effect(() => {
    if (!active) {
      tooltipData = null;
    }
  });

  /**
   * Check if a point is within the element bounds (not padding)
   */
  function isPointInElement(clientX: number, clientY: number): boolean {
    if (!selectedElement) return false;
    const rect = selectedElement.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right &&
           clientY >= rect.top && clientY <= rect.bottom;
  }

  /**
   * Check if a point is within the padding area (but not element)
   */
  function isPointInPadding(clientX: number, clientY: number): boolean {
    if (!selectedElement || !expandedRect) return false;
    const rect = selectedElement.getBoundingClientRect();
    // Check if in expanded area but not in element area
    const inExpanded = clientX >= expandedRect.left && clientX <= expandedRect.left + expandedRect.width &&
                       clientY >= expandedRect.top && clientY <= expandedRect.top + expandedRect.height;
    const inElement = clientX >= rect.left && clientX <= rect.right &&
                      clientY >= rect.top && clientY <= rect.bottom;
    return inExpanded && !inElement;
  }

  /**
   * Handle mouse movement - highlight element under cursor
   */
  function handleMouseMove(event: MouseEvent): void {
    // If we have a selected element and we're in the element area (not text, not padding)
    if (selectedElement && !active && !hoveredTextElement && !editingTextElement) {
      if (isPointInElement(event.clientX, event.clientY)) {
        // Check if we're over a text element (which has its own handlers)
        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const isOverText = targetElement?.closest('[data-heroshot-text-highlight]');
        if (!isOverText) {
          tooltipData = { element: getElementFillLabel(elementFill) };
          tooltipX = event.clientX;
          tooltipY = event.clientY;
          return;
        }
      } else if (isPointInPadding(event.clientX, event.clientY)) {
        tooltipData = { padding: getPaddingFillLabel(paddingFill) };
        tooltipX = event.clientX;
        tooltipY = event.clientY;
        return;
      }
    }

    if (!active) return;

    const element = deepElementFromPoint(event.clientX, event.clientY);

    if (
      element &&
      !element.closest('#heroshot-root') &&
      !element.closest('#heroshot-overlay')
    ) {
      currentElement = element;
      // Update tooltip with size + path
      const rect = element.getBoundingClientRect();
      tooltipData = {
        size: `${Math.round(rect.width)} x ${Math.round(rect.height)}`,
        path: getSelector(element),
      };
      tooltipX = event.clientX;
      tooltipY = event.clientY;
    }
  }

  /**
   * Handle click - select element or cycle element fill
   */
  function handleClick(event: MouseEvent): void {
    const { target } = event;

    // Always skip heroshot UI elements
    if (target instanceof Element && target.closest('#heroshot-root')) {
      return;
    }

    // If we have a selected element (not in picker mode), handle element/padding clicks
    if (selectedElement && !active) {
      // Check if clicking on a text element (has its own handlers via overlay)
      if (target instanceof Element && target.closest('[data-heroshot-text-highlight]')) {
        return; // Let text handler deal with it
      }

      // Check if clicking in element area (not padding)
      if (isPointInElement(event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopPropagation();

        // Cycle element fill mode
        elementFill = cycleNextElementFill(elementFill);
        tooltipData = { element: getElementFillLabel(elementFill) };

        // Auto-save for existing screenshots (not new drafts)
        if (editingScreenshotId && !isNewElement) {
          onElementFillUpdate(editingScreenshotId, elementFill);
        }
        return;
      }

      // Padding area clicks are handled by the padding overlay divs
      return;
    }

    // Picker mode - select element
    if (!active) return;

    event.preventDefault();
    event.stopPropagation();

    if (currentElement) {
      const selector = getSelector(currentElement);

      selectedElement = currentElement;
      selectedPadding = { ...defaultPadding };
      originalPadding = { ...defaultPadding };
      selectedScroll = { x: globalThis.scrollX, y: globalThis.scrollY };
      editingScreenshotId = null;
      isNewElement = true;
      paddingFill = 'inherit';
      originalPaddingFill = 'inherit';
      elementFill = 'original';
      originalElementFill = 'original';
      currentElement = null;
      tooltipData = null; // Clear tooltip

      // Deactivate picker mode and notify parent of new element
      onToggle();
      onNewElement(selector);
    }
  }

  /**
   * Handle ESC key for canceling selection or picker mode
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (selectedElement) {
        if (isNewElement) {
          // Cancel new element - remove draft
          handleCancel();
        } else if (editingScreenshotId) {
          // Revert to original padding and fill modes for existing screenshot
          onPaddingUpdate(editingScreenshotId, originalPadding);
          onPaddingFillUpdate(editingScreenshotId, originalPaddingFill);
          onElementFillUpdate(editingScreenshotId, originalElementFill);
          clearSelection();
        }
        event.stopPropagation();
      } else if (active) {
        onToggle();
        event.stopPropagation();
      }
    }
  }

  // Use capture phase for ESC handling so it works even if EditorBar stops propagation
  $effect(() => {
    globalThis.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => globalThis.removeEventListener('keydown', handleKeyDown, true);
  });

  /**
   * Handle scroll for overlay repositioning and tracking
   */
  function handleScroll(): void {
    scrollY = globalThis.scrollY;
    scrollX = globalThis.scrollX;

    // Update scroll position for selected element
    if (selectedElement) {
      const newScroll = { x: scrollX, y: scrollY };
      selectedScroll = newScroll;

      // Auto-save for existing screenshots (not new drafts)
      if (editingScreenshotId && !isNewElement) {
        onScrollUpdate(editingScreenshotId, newScroll);
      }
    }
  }

  /**
   * Handle cancel
   */
  function handleCancel(): void {
    clearTextHighlights();
    selectedElement = null;
    selectedPadding = { ...defaultPadding };
    originalPadding = { ...defaultPadding };
    selectedScroll = { ...defaultScroll };
    editingScreenshotId = null;
    isNewElement = false;
    paddingFill = 'inherit';
    originalPaddingFill = 'inherit';
    elementFill = 'original';
    originalElementFill = 'original';
    currentElement = null;
    onCancel();
  }

  /**
   * Handle clicking on dark overlay - deselect current element
   */
  function handleOverlayClick(): void {
    if (selectedElement && !isNewElement) {
      // Clear selection for existing screenshot
      clearSelection();
      onDeselect();
    } else if (selectedElement && isNewElement) {
      // Cancel new element draft
      handleCancel();
    }
  }

  /**
   * Handle padding change - auto-save for existing screenshots
   */
  function handlePaddingChange(newPadding: Padding): void {
    selectedPadding = newPadding;

    // Auto-save for existing screenshots (not new drafts)
    if (editingScreenshotId && !isNewElement) {
      onPaddingUpdate(editingScreenshotId, newPadding);
    }
  }

  /**
   * Get tooltip label for padding fill mode
   */
  function getPaddingFillLabel(fill: PaddingFill): string {
    switch (fill) {
      case 'inherit': { return 'inherit';
      }
      case 'solid': { return 'solid';
      }
      case 'transparent': { return 'transparent';
      }
    }
  }

  /**
   * Get tooltip label for element fill mode
   */
  function getElementFillLabel(fill: ElementFill): string {
    switch (fill) {
      case 'original': { return 'original';
      }
      case 'solid': { return 'solid';
      }
      case 'transparent': { return 'transparent';
      }
    }
  }

  /**
   * Cycle to next padding fill mode: inherit -> solid -> inherit
   * NOTE: transparent mode not enabled yet
   * To re-enable: solid -> transparent, transparent -> inherit
   */
  function cycleNextPaddingFill(current: PaddingFill): PaddingFill {
    switch (current) {
      case 'inherit': { return 'solid';
      }
      case 'solid': { return 'inherit'; // TODO: return 'transparent' to enable transparent mode
      }
      case 'transparent': { return 'inherit';
      }
    }
  }

  /**
   * Cycle to next element fill mode: original -> solid -> original
   * NOTE: transparent mode not enabled yet
   * To re-enable: solid -> transparent, transparent -> original
   */
  function cycleNextElementFill(current: ElementFill): ElementFill {
    switch (current) {
      case 'original': { return 'solid';
      }
      case 'solid': { return 'original'; // TODO: return 'transparent' to enable transparent mode
      }
      case 'transparent': { return 'original';
      }
    }
  }

  /**
   * Cycle padding fill mode and update state
   */
  function cyclePaddingFill(): void {
    paddingFill = cycleNextPaddingFill(paddingFill);

    // Update tooltip immediately
    tooltipData = {
      padding: getPaddingFillLabel(paddingFill),
    };

    // Auto-save for existing screenshots (not new drafts)
    if (editingScreenshotId && !isNewElement) {
      onPaddingFillUpdate(editingScreenshotId, paddingFill);
    }
  }

  /**
   * Handle padding area click - cycle through fill modes
   */
  function handlePaddingClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    cyclePaddingFill();
  }

  /**
   * Handle padding area mouse enter/move - show and update tooltip
   */
  function handlePaddingMouseMove(event: MouseEvent): void {
    tooltipData = {
      padding: getPaddingFillLabel(paddingFill),
    };
    tooltipX = event.clientX;
    tooltipY = event.clientY;
  }

  /**
   * Handle padding area mouse leave - hide tooltip
   */
  function handlePaddingMouseLeave(): void {
    tooltipData = null;
  }

  /**
   * Apply text overrides to the DOM
   */
  function applyTextOverrides(containerElement: Element, textOverrides: Record<string, string>): void {
    for (const [relativeSelector, newText] of Object.entries(textOverrides)) {
      const textElement = containerElement.querySelector(relativeSelector);
      if (textElement) {
        textElement.textContent = newText;
      }
    }
  }

  /**
   * Highlight element by selector (for sidebar selection)
   */
  export function highlightElement(selector: string, screenshotId?: string, attempt = 1): void {
    const maxAttempts = 5;
    const element = findElementBySelector(selector);

    if (element) {
      if (screenshotId) {
        // Editing existing screenshot - load saved padding, scroll, and fill modes
        const screenshot = screenshots.find(item => item.id === screenshotId);
        const padding = screenshot?.padding ? { ...screenshot.padding } : { ...defaultPadding };
        const savedPaddingFill: PaddingFill = screenshot?.paddingFill ?? 'inherit';
        const savedElementFill: ElementFill = screenshot?.elementFill ?? 'original';

        // Restore saved scroll position, or scroll element into view if none saved
        if (screenshot?.scroll) {
          globalThis.scrollTo({ left: screenshot.scroll.x, top: screenshot.scroll.y, behavior: 'smooth' });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        selectedElement = element;
        selectedPadding = padding;
        originalPadding = { ...padding }; // Store for revert
        selectedScroll = screenshot?.scroll ? { ...screenshot.scroll } : { x: globalThis.scrollX, y: globalThis.scrollY };
        editingScreenshotId = screenshotId;
        isNewElement = false;
        paddingFill = savedPaddingFill;
        originalPaddingFill = savedPaddingFill;
        elementFill = savedElementFill;
        originalElementFill = savedElementFill;
        currentElement = null;

        // Apply text overrides to the DOM
        if (screenshot?.textOverrides && Object.keys(screenshot.textOverrides).length > 0) {
          applyTextOverrides(element, screenshot.textOverrides);
        }
      } else {
        // Just highlighting (no edit mode) - scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentElement = element;
      }
    } else if (attempt < maxAttempts) {
      globalThis.setTimeout(() => highlightElement(selector, screenshotId, attempt + 1), 1000);
    }
  }

  /**
   * Get the ID of the screenshot being edited (if any)
   */
  export function getEditingScreenshotId(): string | null {
    return editingScreenshotId;
  }

  /**
   * Clear any selection (without triggering cancel callback)
   */
  export function clearSelection(): void {
    clearTextHighlights();
    selectedElement = null;
    selectedPadding = { ...defaultPadding };
    originalPadding = { ...defaultPadding };
    selectedScroll = { ...defaultScroll };
    editingScreenshotId = null;
    isNewElement = false;
    paddingFill = 'inherit';
    originalPaddingFill = 'inherit';
    elementFill = 'original';
    originalElementFill = 'original';
    currentElement = null;
  }

  /**
   * Convert current draft to saved screenshot (keeps selection visible)
   */
  export function confirmDraft(screenshotId: string): void {
    if (isNewElement && selectedElement) {
      editingScreenshotId = screenshotId;
      isNewElement = false;
      originalPadding = { ...selectedPadding };
      originalPaddingFill = paddingFill;
      originalElementFill = elementFill;
    }
  }

  /**
   * Get current padding for draft items
   */
  export function getCurrentPadding(): Padding {
    return { ...selectedPadding };
  }

  /**
   * Get current scroll position for draft items
   */
  export function getCurrentScroll(): ScrollPosition {
    return { ...selectedScroll };
  }

  /**
   * Check if currently editing a new element (draft)
   */
  export function isEditingNewElement(): boolean {
    return isNewElement;
  }

  /**
   * Get current paddingFill for draft items
   */
  export function getCurrentPaddingFill(): PaddingFill {
    return paddingFill;
  }

  /**
   * Get current elementFill for draft items
   */
  export function getCurrentElementFill(): ElementFill {
    return elementFill;
  }

  /**
   * Calculate overlay rectangles
   */
  function getOverlayRects(element: Element | null, _scrollX: number, _scrollY: number, padding?: Padding) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const { innerWidth, innerHeight } = globalThis;

    const expandedTop = rect.top - (padding?.top ?? 0);
    const expandedLeft = rect.left - (padding?.left ?? 0);
    const expandedRight = rect.right + (padding?.right ?? 0);
    const expandedBottom = rect.bottom + (padding?.bottom ?? 0);
    const expandedHeight = expandedBottom - expandedTop;

    return {
      top: { top: 0, left: 0, width: innerWidth, height: expandedTop },
      bottom: { top: expandedBottom, left: 0, width: innerWidth, height: innerHeight - expandedBottom },
      left: { top: expandedTop, left: 0, width: expandedLeft, height: expandedHeight },
      right: { top: expandedTop, left: expandedRight, width: innerWidth - expandedRight, height: expandedHeight },
      highlight: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };
  }

  let overlayPadding = $derived(selectedElement ? selectedPadding : undefined);
  let overlayRects = $derived(getOverlayRects(activeElement, scrollX, scrollY, overlayPadding));

  // Resize handle state
  let isDragging = $state(false);
  let dragHandle = $state<string | null>(null);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let dragStartPadding = $state<Padding>({ top: 0, right: 0, bottom: 0, left: 0 });

  // Cursor tooltip state
  type TooltipData = {
    size?: string;    // e.g., "300 x 400"
    path?: string;    // e.g., "div.container >>> ha-card"
    padding?: string; // e.g., "24" or "inherit/solid/transparent"
    element?: string; // e.g., "original/solid/transparent"
    text?: string;    // e.g., "Click to edit"
  }
  let tooltipData = $state<TooltipData | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  // Handle sizes
  const edgeLong = 20;
  const edgeShort = 10;
  const cornerSize = 10;
  const cornerInset = 2;

  // Computed expanded rect (element + padding) for resize handles
  let expandedRect = $derived(
    overlayRects
      ? {
          top: overlayRects.highlight.top - selectedPadding.top,
          left: overlayRects.highlight.left - selectedPadding.left,
          width: overlayRects.highlight.width + selectedPadding.left + selectedPadding.right,
          height: overlayRects.highlight.height + selectedPadding.top + selectedPadding.bottom,
        }
      : null
  );

  let hasPadding = $derived(
    selectedPadding.top > 0 || selectedPadding.right > 0 || selectedPadding.bottom > 0 || selectedPadding.left > 0
  );

  // Checkered pattern for transparent mode (gray/white checkerboard)
  const checkeredPattern = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 16px 16px';

  // Background styles for different fill modes
  let paddingBackground = $derived.by(() => {
    switch (paddingFill) {
      case 'inherit': { return 'rgba(34, 197, 94, 0.25)';
      } // Green tint to show it's the padding area
      case 'solid': { return detectedBgColor;
      }
      case 'transparent': { return checkeredPattern;
      }
    }
  });


  /**
   * Start dragging a resize handle
   */
  function handleResizeMouseDown(event: MouseEvent, handle: string): void {
    event.preventDefault();
    event.stopPropagation();

    isDragging = true;
    dragHandle = handle;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartPadding = { ...selectedPadding };

    globalThis.addEventListener('mousemove', handleResizeMouseMove);
    globalThis.addEventListener('mouseup', handleResizeMouseUp);
  }

  /**
   * Calculate corner resize padding based on drag deltas
   */
  function calculateCornerResize(
    handle: string,
    deltaX: number,
    deltaY: number,
    startPadding: Padding,
    shiftHeld: boolean
  ): Padding {
    const newPadding = { ...startPadding };
    const [vertical, horizontal] = handle.split('-');

    if (shiftHeld) {
      // Shift: only resize the 2 paddings of this corner
      if (vertical === 'top') newPadding.top = Math.max(0, startPadding.top - deltaY);
      if (vertical === 'bottom') newPadding.bottom = Math.max(0, startPadding.bottom + deltaY);
      if (horizontal === 'left') newPadding.left = Math.max(0, startPadding.left - deltaX);
      if (horizontal === 'right') newPadding.right = Math.max(0, startPadding.right + deltaX);
    } else {
      // Default: proportional resize (all 4 sides equally)
      let expansion = vertical === 'top' ? -deltaY : deltaY;
      if (horizontal === 'left') expansion = Math.max(expansion, -deltaX);
      if (horizontal === 'right') expansion = Math.max(expansion, deltaX);

      newPadding.top = Math.max(0, startPadding.top + expansion);
      newPadding.right = Math.max(0, startPadding.right + expansion);
      newPadding.bottom = Math.max(0, startPadding.bottom + expansion);
      newPadding.left = Math.max(0, startPadding.left + expansion);
    }
    return newPadding;
  }

  /**
   * Calculate edge resize padding based on drag deltas
   */
  function calculateEdgeResize(
    handle: string,
    deltaX: number,
    deltaY: number,
    startPadding: Padding,
    shiftHeld: boolean
  ): Padding {
    const newPadding = { ...startPadding };
    const edgeDeltas: Record<string, { key: keyof Padding; opposite: keyof Padding; delta: number }> = {
      top: { key: 'top', opposite: 'bottom', delta: -deltaY },
      bottom: { key: 'bottom', opposite: 'top', delta: deltaY },
      left: { key: 'left', opposite: 'right', delta: -deltaX },
      right: { key: 'right', opposite: 'left', delta: deltaX },
    };

    const edge = edgeDeltas[handle];
    if (edge) {
      newPadding[edge.key] = Math.max(0, startPadding[edge.key] + edge.delta);
      if (!shiftHeld) {
        newPadding[edge.opposite] = Math.max(0, startPadding[edge.opposite] + edge.delta);
      }
    }
    return newPadding;
  }

  /**
   * Clamp padding to document boundaries
   */
  function clampPaddingToBounds(padding: Padding, elementRect: DOMRect): Padding {
    const documentWidth = document.documentElement.scrollWidth;
    const documentHeight = document.documentElement.scrollHeight;
    const elementLeft = elementRect.left + globalThis.scrollX;
    const elementTop = elementRect.top + globalThis.scrollY;
    const elementRight = elementRect.right + globalThis.scrollX;
    const elementBottom = elementRect.bottom + globalThis.scrollY;

    return {
      top: Math.min(padding.top, elementTop),
      left: Math.min(padding.left, elementLeft),
      bottom: Math.min(padding.bottom, documentHeight - elementBottom),
      right: Math.min(padding.right, documentWidth - elementRight),
    };
  }

  /**
   * Generate padding string for tooltip display
   */
  function getPaddingTooltipString(padding: Padding, handle: string): string {
    if (handle.includes('-')) {
      const allSame = padding.top === padding.right &&
                      padding.right === padding.bottom &&
                      padding.bottom === padding.left;
      return allSame
        ? `${padding.top}`
        : `${padding.top} ${padding.right} ${padding.bottom} ${padding.left}`;
    }
    if (handle === 'top' || handle === 'right' || handle === 'bottom' || handle === 'left') {
      return `${padding[handle]}`;
    }
    return '';
  }

  /**
   * Handle mouse move during resize drag
   */
  function handleResizeMouseMove(event: MouseEvent): void {
    if (!isDragging || !dragHandle || !selectedElement) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const shiftHeld = event.shiftKey;

    // Calculate new padding based on handle type
    const isCorner = dragHandle.includes('-');
    let newPadding = isCorner
      ? calculateCornerResize(dragHandle, deltaX, deltaY, dragStartPadding, shiftHeld)
      : calculateEdgeResize(dragHandle, deltaX, deltaY, dragStartPadding, shiftHeld);

    // Clamp to document boundaries
    const rect = selectedElement.getBoundingClientRect();
    newPadding = clampPaddingToBounds(newPadding, rect);

    // Update tooltip
    const totalWidth = Math.round(rect.width + newPadding.left + newPadding.right);
    const totalHeight = Math.round(rect.height + newPadding.top + newPadding.bottom);

    tooltipData = {
      size: `${totalWidth} x ${totalHeight}`,
      padding: getPaddingTooltipString(newPadding, dragHandle),
    };
    tooltipX = event.clientX;
    tooltipY = event.clientY;

    handlePaddingChange(newPadding);
  }

  /**
   * End resize drag
   */
  function handleResizeMouseUp(): void {
    isDragging = false;
    dragHandle = null;
    tooltipData = null; // Clear tooltip
    globalThis.removeEventListener('mousemove', handleResizeMouseMove);
    globalThis.removeEventListener('mouseup', handleResizeMouseUp);
  }

  const cursorMap: Record<string, string> = {
    'top': 'ns-resize',
    'bottom': 'ns-resize',
    'left': 'ew-resize',
    'right': 'ew-resize',
    'top-left': 'nwse-resize',
    'bottom-right': 'nwse-resize',
    'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize',
  };

  function getCursor(handle: string): string {
    return cursorMap[handle] ?? 'move';
  }
</script>

<svelte:window onscroll={handleScroll} />

<svelte:document
  onmousemove={handleMouseMove}
  onclick={handleClick}
/>

<!-- Overlay for element highlighting -->
{#if showOverlay && overlayRects}
  <div class="fixed inset-0 w-screen h-screen z-[2147483646] pointer-events-none">
    <!-- Dark overlay areas around element (clickable when element is selected) -->
    <div
      role="button"
      tabindex="-1"
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.top.top}px;left:{overlayRects.top.left}px;width:{overlayRects.top.width}px;height:{overlayRects.top.height}px;"
      onclick={handleOverlayClick}
      onkeydown={(event) => event.key === 'Enter' && handleOverlayClick()}
    ></div>
    <div
      role="button"
      tabindex="-1"
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.bottom.top}px;left:{overlayRects.bottom.left}px;width:{overlayRects.bottom.width}px;height:{overlayRects.bottom.height}px;"
      onclick={handleOverlayClick}
      onkeydown={(event) => event.key === 'Enter' && handleOverlayClick()}
    ></div>
    <div
      role="button"
      tabindex="-1"
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.left.top}px;left:{overlayRects.left.left}px;width:{overlayRects.left.width}px;height:{overlayRects.left.height}px;"
      onclick={handleOverlayClick}
      onkeydown={(event) => event.key === 'Enter' && handleOverlayClick()}
    ></div>
    <div
      role="button"
      tabindex="-1"
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.right.top}px;left:{overlayRects.right.left}px;width:{overlayRects.right.width}px;height:{overlayRects.right.height}px;"
      onclick={handleOverlayClick}
      onkeydown={(event) => event.key === 'Enter' && handleOverlayClick()}
    ></div>

    <!-- Element highlight -->
    {#if selectedElement !== null && expandedRect}
      <!-- Selected mode: padding overlays and resize handles -->

      <!-- Padding area overlays (clickable to cycle fill mode) -->
      {#if hasPadding}
        {#if selectedPadding.top > 0}
          <div
            role="button"
            tabindex="-1"
            class="fixed pointer-events-auto cursor-pointer"
            style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.top}px;background:{paddingBackground};"
            onclick={handlePaddingClick}
            onkeydown={(event) => event.key === 'Enter' && cyclePaddingFill()}
            onmouseenter={handlePaddingMouseMove}
            onmousemove={handlePaddingMouseMove}
            onmouseleave={handlePaddingMouseLeave}
          ></div>
        {/if}
        {#if selectedPadding.bottom > 0}
          <div
            role="button"
            tabindex="-1"
            class="fixed pointer-events-auto cursor-pointer"
            style="top:{overlayRects.highlight.top + overlayRects.highlight.height}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.bottom}px;background:{paddingBackground};"
            onclick={handlePaddingClick}
            onkeydown={(event) => event.key === 'Enter' && cyclePaddingFill()}
            onmouseenter={handlePaddingMouseMove}
            onmousemove={handlePaddingMouseMove}
            onmouseleave={handlePaddingMouseLeave}
          ></div>
        {/if}
        {#if selectedPadding.left > 0}
          <div
            role="button"
            tabindex="-1"
            class="fixed pointer-events-auto cursor-pointer"
            style="top:{overlayRects.highlight.top}px;left:{expandedRect.left}px;width:{selectedPadding.left}px;height:{overlayRects.highlight.height}px;background:{paddingBackground};"
            onclick={handlePaddingClick}
            onkeydown={(event) => event.key === 'Enter' && cyclePaddingFill()}
            onmouseenter={handlePaddingMouseMove}
            onmousemove={handlePaddingMouseMove}
            onmouseleave={handlePaddingMouseLeave}
          ></div>
        {/if}
        {#if selectedPadding.right > 0}
          <div
            role="button"
            tabindex="-1"
            class="fixed pointer-events-auto cursor-pointer"
            style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left + overlayRects.highlight.width}px;width:{selectedPadding.right}px;height:{overlayRects.highlight.height}px;background:{paddingBackground};"
            onclick={handlePaddingClick}
            onkeydown={(event) => event.key === 'Enter' && cyclePaddingFill()}
            onmouseenter={handlePaddingMouseMove}
            onmousemove={handlePaddingMouseMove}
            onmouseleave={handlePaddingMouseLeave}
          ></div>
        {/if}

        <!-- Original element border edges -->
        {#if selectedPadding.top > 0}
          <div class="fixed h-0.5 bg-heroshot-primary/50 pointer-events-none" style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left}px;width:{overlayRects.highlight.width}px;"></div>
        {/if}
        {#if selectedPadding.bottom > 0}
          <div class="fixed h-0.5 bg-heroshot-primary/50 pointer-events-none" style="top:{overlayRects.highlight.top + overlayRects.highlight.height}px;left:{overlayRects.highlight.left}px;width:{overlayRects.highlight.width}px;"></div>
        {/if}
        {#if selectedPadding.left > 0}
          <div class="fixed w-0.5 bg-heroshot-primary/50 pointer-events-none" style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left}px;height:{overlayRects.highlight.height}px;"></div>
        {/if}
        {#if selectedPadding.right > 0}
          <div class="fixed w-0.5 bg-heroshot-primary/50 pointer-events-none" style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left + overlayRects.highlight.width}px;height:{overlayRects.highlight.height}px;"></div>
        {/if}
      {/if}

      <!-- Element area - no overlay, clicks handled via document handler to allow text editing -->
      <!-- Text elements get mouseenter/click handlers directly, element clicks detected by exclusion -->

      <!-- Expanded area border -->
      <div
        class="fixed pointer-events-none box-border" class:border-dashed={hasPadding}
        style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{expandedRect.height}px;border:1px solid #22c55e;"
      ></div>

      <!-- Resize handles - edge handles -->
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{edgeLong}px;height:{edgeShort}px;top:{expandedRect.top}px;left:{expandedRect.left + expandedRect.width / 2}px;cursor:{getCursor('top')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'top')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{edgeLong}px;height:{edgeShort}px;top:{expandedRect.top + expandedRect.height}px;left:{expandedRect.left + expandedRect.width / 2}px;cursor:{getCursor('bottom')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'bottom')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{edgeShort}px;height:{edgeLong}px;top:{expandedRect.top + expandedRect.height / 2}px;left:{expandedRect.left}px;cursor:{getCursor('left')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'left')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{edgeShort}px;height:{edgeLong}px;top:{expandedRect.top + expandedRect.height / 2}px;left:{expandedRect.left + expandedRect.width}px;cursor:{getCursor('right')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'right')}
        role="button"
        tabindex="0"
      ></div>
      <!-- Resize handles - corner handles -->
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{cornerSize}px;height:{cornerSize}px;top:{expandedRect.top + cornerInset}px;left:{expandedRect.left + cornerInset}px;cursor:{getCursor('top-left')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'top-left')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{cornerSize}px;height:{cornerSize}px;top:{expandedRect.top + cornerInset}px;left:{expandedRect.left + expandedRect.width - cornerInset}px;cursor:{getCursor('top-right')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'top-right')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{cornerSize}px;height:{cornerSize}px;top:{expandedRect.top + expandedRect.height - cornerInset}px;left:{expandedRect.left + cornerInset}px;cursor:{getCursor('bottom-left')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'bottom-left')}
        role="button"
        tabindex="0"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{cornerSize}px;height:{cornerSize}px;top:{expandedRect.top + expandedRect.height - cornerInset}px;left:{expandedRect.left + expandedRect.width - cornerInset}px;cursor:{getCursor('bottom-right')};"
        onmousedown={(event) => handleResizeMouseDown(event, 'bottom-right')}
        role="button"
        tabindex="0"
      ></div>
    {:else}
      <!-- Picker mode: simple cyan border -->
      <div
        class="fixed border-[3px] pointer-events-none box-border border-heroshot-primary bg-heroshot-primary/10"
        style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left}px;width:{overlayRects.highlight.width}px;height:{overlayRects.highlight.height}px;"
      ></div>
    {/if}
  </div>
{/if}

<!-- Cursor tooltip -->
{#if tooltipData}
  <div
    class="fixed z-[2147483647] pointer-events-none bg-black/85 text-xs font-mono px-2 py-1.5 rounded flex flex-col gap-0.5"
    style="left:{tooltipX}px;top:{tooltipY - 10}px;transform:translateX(-50%) translateY(-100%);"
  >
    {#if tooltipData.size}
      <span style="color:#fbbf24;">{tooltipData.size}</span>
    {/if}
    {#if tooltipData.path}
      <span style="color:#67e8f9;">{tooltipData.path}</span>
    {/if}
    {#if tooltipData.padding}
      <span style="color:#22c55e;">padding: {tooltipData.padding}</span>
    {/if}
    {#if tooltipData.element}
      <span style="color:#3b82f6;">element: {tooltipData.element}</span>
    {/if}
    {#if tooltipData.text}
      <span style="color:#ec4899;">{tooltipData.text}</span>
    {/if}
  </div>
{/if}
