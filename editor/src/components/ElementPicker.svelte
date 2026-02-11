<script lang="ts">
  import { DEFAULT_BORDER_COLOR, HIGHLIGHT_MAX_ATTEMPTS, HIGHLIGHT_RETRY_DELAY } from '../constants';
  import { CHECKERED_BACKGROUND, createBackgroundFillManager } from '../lib/backgroundFill';
  import { deepElementFromPoint, getBackgroundColor, getSelector } from '../lib/dom';
  import { getOverlayRects } from '../lib/overlayGeometry';
  import type { ResizeTooltip } from '../lib/paddingResize';
  import { CORNER_INSET, CORNER_SIZE, EDGE_LONG, EDGE_SHORT, createPaddingResizeManager, getCursor } from '../lib/paddingResize';
  import { findElementBySelector } from '../lib/selector';
  import type { TextTooltip } from '../lib/textEditing';
  import { applyTextOverrides, createTextEditingManager } from '../lib/textEditing';
  import type { Annotation, ElementFill, Padding, PaddingFill, ScreenshotItem, ScrollPosition } from '../types';
  import AnnotationLayer from './AnnotationLayer.svelte';

  type Props = {
    /** Whether picker mode is active */
    active: boolean;
    /** Screenshots list (for loading saved padding) */
    screenshots: ScreenshotItem[];
    /** Active annotation tool (null = not annotating) */
    annotationTool: string | null;
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
    /** Callback when annotations are updated */
    onAnnotationsUpdate: (id: string, annotations: Annotation[]) => void;
    /** Callback to deactivate annotation tool after drawing */
    onAnnotationToolDeactivate: () => void;
    /** Callback when draft/edit is cancelled */
    onCancel: () => void;
    /** Callback when selection is cleared (clicking outside) */
    onDeselect: () => void;
    /** Callback when annotation selection changes */
    onAnnotationSelectionChange: (annotationId: string | null) => void;
    /** Callback when text editing state changes */
    onTextEditChange: (editing: boolean) => void;
    /** Callback when editing screenshot ID changes */
    onEditingScreenshotChange: (id: string | null) => void;
    /** Callback when expanded rect changes (for ConfigBar positioning) */
    onExpandedRectChange: (rect: { top: number; left: number; width: number; height: number } | null) => void;
  }

  const { active, screenshots, annotationTool, onToggle, onNewElement, onPaddingUpdate, onScrollUpdate, onPaddingFillUpdate, onElementFillUpdate, onTextOverrideUpdate, onAnnotationsUpdate, onAnnotationToolDeactivate, onCancel, onDeselect, onAnnotationSelectionChange, onTextEditChange, onEditingScreenshotChange, onExpandedRectChange }: Props = $props();

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

  // Annotation layer reference
  let annotationLayer: AnnotationLayer;

  // Current annotations for the selected screenshot
  let currentAnnotations = $derived.by(() => {
    if (!editingScreenshotId) return [];
    const screenshot = screenshots.find(item => item.id === editingScreenshotId);
    return screenshot?.annotations ?? [];
  });

  // Detected background color for the selected element (computed when element changes)
  let detectedBgColor = $derived(selectedElement ? getBackgroundColor(selectedElement) : '#ffffff');

  // --- Extracted modules ---

  // Background fill manager
  const bgFillManager = createBackgroundFillManager();

  // Apply element background based on elementFill mode
  $effect(() => {
    const element = selectedElement instanceof HTMLElement ? selectedElement : null;
    bgFillManager.applyElementFill(element, elementFill, currentElementColor, detectedBgColor);
  });

  // Text editing tooltip (set via callback from text manager)
  let textTooltip = $state<TextTooltip | null>(null);

  // Text editing manager
  const textManager = createTextEditingManager({
    onTextEditChange: (editing) => onTextEditChange(editing),
    onTextOverrideUpdate: (id, sel, text) => onTextOverrideUpdate(id, sel, text),
    onTooltipChange: (t) => { textTooltip = t; },
    getContext: () => ({ selectedElement, editingScreenshotId }),
  });

  // Highlight text elements when selection changes
  $effect(() => {
    if (selectedElement) {
      textManager.highlightTextElements(selectedElement);
    } else {
      textManager.clearHighlights();
    }
  });

  // Resize tooltip (set via callback from resize manager)
  let resizeTooltip = $state<ResizeTooltip | null>(null);

  // Padding resize manager
  const resizeManager = createPaddingResizeManager({
    onPaddingChange: handlePaddingChange,
    onTooltipChange: (t) => { resizeTooltip = t; },
    getSelectedElement: () => selectedElement,
  });

  // Push editingScreenshotId changes to parent (Svelte 5 can't track reads through methods)
  $effect(() => {
    onEditingScreenshotChange(editingScreenshotId);
  });

  // Push expandedRect changes to parent for ConfigBar positioning
  $effect(() => {
    onExpandedRectChange(expandedRect);
  });

  // Scroll tracking for overlay repositioning (RAF-throttled)
  let scrollY = $state(globalThis.scrollY ?? 0);
  let scrollX = $state(globalThis.scrollX ?? 0);
  let scrollRafPending = false;

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

  // Cursor tooltip state — merges picker tooltip, text tooltip, and resize tooltip
  type TooltipData = {
    size?: string;
    path?: string;
    padding?: string;
    text?: string;
  }
  let pickerTooltipData = $state<TooltipData | null>(null);
  let pickerTooltipX = $state(0);
  let pickerTooltipY = $state(0);

  // Clear tooltip when picker mode deactivates
  $effect(() => {
    if (!active) {
      pickerTooltipData = null;
    }
  });

  // Unified tooltip: resize > text > picker
  let tooltipData = $derived.by<TooltipData | null>(() => {
    if (resizeTooltip) {
      return { size: resizeTooltip.size, padding: resizeTooltip.padding };
    }
    if (textTooltip) {
      return { text: textTooltip.text };
    }
    return pickerTooltipData;
  });
  let tooltipX = $derived(resizeTooltip?.x ?? textTooltip?.x ?? pickerTooltipX);
  let tooltipY = $derived(resizeTooltip?.y ?? textTooltip?.y ?? pickerTooltipY);

  /**
   * Handle mouse movement - highlight element under cursor
   */
  function handleMouseMove(event: MouseEvent): void {
    if (!active) return;

    const element = deepElementFromPoint(event.clientX, event.clientY);

    if (
      element &&
      !element.closest('#heroshot-root') &&
      !element.closest('#heroshot-overlay')
    ) {
      currentElement = element;
      const rect = element.getBoundingClientRect();
      pickerTooltipData = {
        size: `${Math.round(rect.width)} x ${Math.round(rect.height)}`,
        path: getSelector(element),
      };
      pickerTooltipX = event.clientX;
      pickerTooltipY = event.clientY;
    }
  }

  /**
   * Handle click - select element or cycle element fill
   */
  function handleClick(event: MouseEvent): void {
    const { target } = event;

    // Always skip heroshot UI elements (including text edit overlays)
    if (target instanceof Element && target.closest('#heroshot-root')) {
      return;
    }
    if (target instanceof HTMLElement && target.dataset.heroshotOverlay === 'true') {
      return;
    }

    // In picker mode, ALWAYS prevent default and stop propagation first to avoid link navigation
    if (active) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    // If we have a selected element (not in picker mode), deselect annotation and skip
    if (selectedElement && !active) {
      if (annotationLayer) {
        annotationLayer.deselect();
      }
      return;
    }

    // Picker mode - select element
    if (!active) return;

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
      pickerTooltipData = null;

      // Deactivate picker mode and notify parent of new element
      onToggle();
      onNewElement(selector);
    }
  }

  /**
   * Handle ESC key for canceling selection or picker mode
   * Handle Delete/Backspace for deleting selected annotation
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Don't intercept when typing in an input field (e.g., ConfigBar)
      // Use composedPath to pierce shadow DOM boundary (event.target is retargeted to shadow host)
      const origin = event.composedPath()[0];
      if (origin instanceof HTMLInputElement || origin instanceof HTMLTextAreaElement) return;
      if (annotationLayer?.deleteSelected()) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
    }
    if (event.key === 'Escape') {
      // First try to deselect annotation
      if (annotationLayer) {
        annotationLayer.deselect();
      }
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

  // Use capture phase for click handling so we can intercept clicks before they reach links
  $effect(() => {
    document.addEventListener('click', handleClick, true); // capture phase
    return () => document.removeEventListener('click', handleClick, true);
  });

  /**
   * Handle scroll for overlay repositioning and tracking.
   * Throttled via requestAnimationFrame to avoid excessive state updates.
   */
  function handleScroll(): void {
    if (scrollRafPending) return;
    scrollRafPending = true;
    globalThis.requestAnimationFrame(() => {
      scrollRafPending = false;
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
    });
  }

  /**
   * Handle cancel
   */
  function handleCancel(): void {
    textManager.clearHighlights();
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
      clearSelection();
      onDeselect();
    } else if (selectedElement && isNewElement) {
      handleCancel();
    }
  }

  /**
   * Handle keyboard resize on padding handles (arrow keys adjust padding by 1px)
   */
  type ResizeEdge = 'top' | 'bottom' | 'left' | 'right';
  function handleResizeKeyDown(event: KeyboardEvent, edge: ResizeEdge): void {
    const step = event.shiftKey ? 10 : 1;
    let delta = 0;
    if (edge === 'top' || edge === 'bottom') {
      if (event.key === 'ArrowUp') delta = -step;
      else if (event.key === 'ArrowDown') delta = step;
      else return;
    } else {
      if (event.key === 'ArrowLeft') delta = -step;
      else if (event.key === 'ArrowRight') delta = step;
      else return;
    }
    event.preventDefault();
    // For top/left: grow means delta > 0, shrink means delta < 0
    // For bottom/right: same convention
    const newPadding = { ...selectedPadding };
    newPadding[edge] = Math.max(0, newPadding[edge] + delta);
    handlePaddingChange(newPadding);
  }

  /**
   * Handle annotation changes
   */
  function handleAnnotationsChange(newAnnotations: Annotation[]): void {
    if (editingScreenshotId) {
      onAnnotationsUpdate(editingScreenshotId, newAnnotations);
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
   * Highlight element by selector (for sidebar selection)
   */
  export function highlightElement(selector: string, screenshotId?: string, attempt = 1): void {
    const element = findElementBySelector(selector);

    if (element) {
      // Always scroll element into view - the scroll handler will auto-save the position
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (screenshotId) {
        // Editing existing screenshot - load saved padding and fill modes
        const screenshot = screenshots.find(item => item.id === screenshotId);
        const padding = screenshot?.padding ? { ...screenshot.padding } : { ...defaultPadding };
        const savedPaddingFill: PaddingFill = screenshot?.paddingFill ?? 'inherit';
        const savedElementFill: ElementFill = screenshot?.elementFill ?? 'original';

        selectedElement = element;
        selectedPadding = padding;
        originalPadding = { ...padding }; // Store for revert
        selectedScroll = { x: globalThis.scrollX, y: globalThis.scrollY };
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
        // Just highlighting (no edit mode)
        currentElement = element;
      }
    } else if (attempt < HIGHLIGHT_MAX_ATTEMPTS) {
      globalThis.setTimeout(() => highlightElement(selector, screenshotId, attempt + 1), HIGHLIGHT_RETRY_DELAY);
    } else {
      globalThis.console.warn(`[heroshot] Element not found after ${HIGHLIGHT_MAX_ATTEMPTS} attempts: ${selector}`);
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
    textManager.clearHighlights();
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
   * Set paddingFill from external source (ConfigBar)
   */
  export function setPaddingFill(fill: PaddingFill): void {
    paddingFill = fill;
    if (editingScreenshotId) {
      onPaddingFillUpdate(editingScreenshotId, fill);
    }
  }

  /**
   * Set elementFill from external source (ConfigBar)
   */
  export function setElementFill(fill: ElementFill): void {
    elementFill = fill;
    if (editingScreenshotId) {
      onElementFillUpdate(editingScreenshotId, fill);
    }
  }

  /**
   * Set editing screenshot ID for a new draft (before confirmation)
   */
  export function setDraftId(id: string): void {
    editingScreenshotId = id;
  }

  /**
   * Get the expanded rect (element + padding) for config bar positioning
   */
  export function getExpandedRect(): { top: number; left: number; width: number; height: number } | null {
    return expandedRect;
  }

  /**
   * Get the element highlight rect for config bar positioning
   */
  export function getElementRect(): { top: number; left: number; width: number; height: number } | null {
    if (!overlayRects) return null;
    return overlayRects.highlight;
  }

  /**
   * Get the annotation layer component reference
   */
  export function getAnnotationLayer(): AnnotationLayer | undefined {
    return annotationLayer;
  }

  /**
   * Get the detected background color of the selected element
   */
  export function getDetectedBgColor(): string {
    return detectedBgColor;
  }

  let overlayPadding = $derived(selectedElement ? selectedPadding : undefined);
  let overlayRects = $derived(getOverlayRects(activeElement, scrollX, scrollY, overlayPadding));

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

  // Derive custom colors and border properties from the screenshots prop
  let currentPaddingColor = $derived.by(() => {
    const screenshot = editingScreenshotId ? screenshots.find(item => item.id === editingScreenshotId) : null;
    return screenshot?.paddingColor;
  });

  let currentElementColor = $derived.by(() => {
    const screenshot = editingScreenshotId ? screenshots.find(item => item.id === editingScreenshotId) : null;
    return screenshot?.elementColor;
  });

  let currentBorderWidth = $derived.by(() => {
    if (!editingScreenshotId) return 0;
    const screenshot = screenshots.find(item => item.id === editingScreenshotId);
    return screenshot?.borderWidth ?? 0;
  });

  let currentBorderColor = $derived.by(() => {
    if (!editingScreenshotId) return DEFAULT_BORDER_COLOR;
    const screenshot = screenshots.find(item => item.id === editingScreenshotId);
    return screenshot?.borderColor ?? DEFAULT_BORDER_COLOR;
  });

  let currentBorderRadius = $derived.by(() => {
    if (!editingScreenshotId) return 0;
    const screenshot = screenshots.find(item => item.id === editingScreenshotId);
    return screenshot?.borderRadius ?? 0;
  });

  // Background styles for different fill modes
  let paddingBackground = $derived.by(() => {
    switch (paddingFill) {
      case 'inherit': { return 'rgba(34, 197, 94, 0.25)';
      }
      case 'solid': { return currentPaddingColor ?? detectedBgColor;
      }
      case 'transparent': { return CHECKERED_BACKGROUND;
      }
    }
  });
</script>

<svelte:window onscroll={handleScroll} />

<svelte:document
  onmousemove={handleMouseMove}
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

      <!-- Padding area overlays (visual only - config bar controls fill mode) -->
      {#if hasPadding}
        {#if selectedPadding.top > 0}
          <div
            class="fixed pointer-events-none"
            style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.top}px;background:{paddingBackground};"
          ></div>
        {/if}
        {#if selectedPadding.bottom > 0}
          <div
            class="fixed pointer-events-none"
            style="top:{overlayRects.highlight.top + overlayRects.highlight.height}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.bottom}px;background:{paddingBackground};"
          ></div>
        {/if}
        {#if selectedPadding.left > 0}
          <div
            class="fixed pointer-events-none"
            style="top:{overlayRects.highlight.top}px;left:{expandedRect.left}px;width:{selectedPadding.left}px;height:{overlayRects.highlight.height}px;background:{paddingBackground};"
          ></div>
        {/if}
        {#if selectedPadding.right > 0}
          <div
            class="fixed pointer-events-none"
            style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left + overlayRects.highlight.width}px;width:{selectedPadding.right}px;height:{overlayRects.highlight.height}px;background:{paddingBackground};"
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

      <!-- Checkered corners indicator (shows what will be transparent in PNG) -->
      {#if currentBorderRadius > 0}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="fixed pointer-events-none"
          style="top:{expandedRect.top}px;left:{expandedRect.left}px;"
          width={expandedRect.width}
          height={expandedRect.height}
        >
          <defs>
            <pattern id="heroshot-checkered" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#ccc" />
              <rect x="8" y="8" width="8" height="8" fill="#ccc" />
              <rect x="8" width="8" height="8" fill="#fff" />
              <rect y="8" width="8" height="8" fill="#fff" />
            </pattern>
            <mask id="heroshot-corner-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect width="100%" height="100%" rx={currentBorderRadius} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroshot-checkered)" mask="url(#heroshot-corner-mask)" />
        </svg>
      {/if}

      <!-- User's border (visual preview) -->
      {#if currentBorderWidth > 0}
        <div
          class="fixed pointer-events-none box-border"
          style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{expandedRect.height}px;border:{currentBorderWidth}px solid {currentBorderColor};border-radius:{currentBorderRadius}px;"
        ></div>
      {/if}
      <!-- Expanded area border (editor indicator) -->
      <div
        class="fixed pointer-events-none box-border" class:border-dashed={hasPadding}
        style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{expandedRect.height}px;border:1px solid #22c55e;border-radius:{currentBorderRadius}px;"
      ></div>

      <!-- Resize handles - edge handles (arrow keys adjust padding, Shift+arrow for 10px) -->
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{EDGE_LONG}px;height:{EDGE_SHORT}px;top:{expandedRect.top}px;left:{expandedRect.left + expandedRect.width / 2}px;cursor:{getCursor('top')};"
        onmousedown={(event) => resizeManager.startResize(event, 'top', selectedPadding)}
        onkeydown={(event) => handleResizeKeyDown(event, 'top')}
        role="button"
        tabindex="0"
        aria-label="Resize top padding ({selectedPadding.top}px)"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{EDGE_LONG}px;height:{EDGE_SHORT}px;top:{expandedRect.top + expandedRect.height}px;left:{expandedRect.left + expandedRect.width / 2}px;cursor:{getCursor('bottom')};"
        onmousedown={(event) => resizeManager.startResize(event, 'bottom', selectedPadding)}
        onkeydown={(event) => handleResizeKeyDown(event, 'bottom')}
        role="button"
        tabindex="0"
        aria-label="Resize bottom padding ({selectedPadding.bottom}px)"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{EDGE_SHORT}px;height:{EDGE_LONG}px;top:{expandedRect.top + expandedRect.height / 2}px;left:{expandedRect.left}px;cursor:{getCursor('left')};"
        onmousedown={(event) => resizeManager.startResize(event, 'left', selectedPadding)}
        onkeydown={(event) => handleResizeKeyDown(event, 'left')}
        role="button"
        tabindex="0"
        aria-label="Resize left padding ({selectedPadding.left}px)"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{EDGE_SHORT}px;height:{EDGE_LONG}px;top:{expandedRect.top + expandedRect.height / 2}px;left:{expandedRect.left + expandedRect.width}px;cursor:{getCursor('right')};"
        onmousedown={(event) => resizeManager.startResize(event, 'right', selectedPadding)}
        onkeydown={(event) => handleResizeKeyDown(event, 'right')}
        role="button"
        tabindex="0"
        aria-label="Resize right padding ({selectedPadding.right}px)"
      ></div>
      <!-- Resize handles - corner handles -->
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{CORNER_SIZE}px;height:{CORNER_SIZE}px;top:{expandedRect.top + CORNER_INSET}px;left:{expandedRect.left + CORNER_INSET}px;cursor:{getCursor('top-left')};"
        onmousedown={(event) => resizeManager.startResize(event, 'top-left', selectedPadding)}
        role="button"
        tabindex="0"
        aria-label="Resize top-left corner"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{CORNER_SIZE}px;height:{CORNER_SIZE}px;top:{expandedRect.top + CORNER_INSET}px;left:{expandedRect.left + expandedRect.width - CORNER_INSET}px;cursor:{getCursor('top-right')};"
        onmousedown={(event) => resizeManager.startResize(event, 'top-right', selectedPadding)}
        role="button"
        tabindex="0"
        aria-label="Resize top-right corner"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{CORNER_SIZE}px;height:{CORNER_SIZE}px;top:{expandedRect.top + expandedRect.height - CORNER_INSET}px;left:{expandedRect.left + CORNER_INSET}px;cursor:{getCursor('bottom-left')};"
        onmousedown={(event) => resizeManager.startResize(event, 'bottom-left', selectedPadding)}
        role="button"
        tabindex="0"
        aria-label="Resize bottom-left corner"
      ></div>
      <div
        class="fixed bg-white rounded-sm pointer-events-auto -translate-x-1/2 -translate-y-1/2"
        style="border:1px solid #555;width:{CORNER_SIZE}px;height:{CORNER_SIZE}px;top:{expandedRect.top + expandedRect.height - CORNER_INSET}px;left:{expandedRect.left + expandedRect.width - CORNER_INSET}px;cursor:{getCursor('bottom-right')};"
        onmousedown={(event) => resizeManager.startResize(event, 'bottom-right', selectedPadding)}
        role="button"
        tabindex="0"
        aria-label="Resize bottom-right corner"
      ></div>
      <!-- Annotation layer -->
      {#if expandedRect && editingScreenshotId}
        <AnnotationLayer
          bind:this={annotationLayer}
          annotations={currentAnnotations}
          activeTool={annotationTool}
          elementRect={{ top: overlayRects.highlight.top, left: overlayRects.highlight.left, width: overlayRects.highlight.width, height: overlayRects.highlight.height }}
          padding={selectedPadding}
          borderRadius={currentBorderRadius}
          onAnnotationsChange={handleAnnotationsChange}
          onToolDeactivate={onAnnotationToolDeactivate}
          onSelectionChange={onAnnotationSelectionChange}
        />
      {/if}
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
    {#if tooltipData.text}
      <span style="color:#ec4899;">{tooltipData.text}</span>
    {/if}
  </div>
{/if}
