<script lang="ts">
  import { deepElementFromPoint, getSelector } from '../lib/dom';
  import { findElementBySelector } from '../lib/selector';
  import type { Padding, ScreenshotItem, ScrollPosition } from '../types';

  interface Props {
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
    /** Callback when draft/edit is cancelled */
    onCancel: () => void;
    /** Callback when selection is cleared (clicking outside) */
    onDeselect: () => void;
  }

  const { active, screenshots, onToggle, onNewElement, onPaddingUpdate, onScrollUpdate, onCancel, onDeselect }: Props = $props();

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
    }
  }

  /**
   * Handle click - select element
   */
  function handleClick(event: MouseEvent): void {
    if (!active) return;

    const { target } = event;
    if (target instanceof Element && target.closest('#heroshot-root')) {
      return;
    }

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
      currentElement = null;

      // Deactivate picker mode and notify parent of new element
      onToggle();
      onNewElement(selector);
    }
  }

  /**
   * Handle keyboard - ESC to cancel/revert
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (selectedElement) {
        if (isNewElement) {
          // Cancel new element - remove draft
          handleCancel();
        } else if (editingScreenshotId) {
          // Revert to original padding for existing screenshot
          onPaddingUpdate(editingScreenshotId, originalPadding);
          clearSelection();
        }
      } else if (active) {
        onToggle();
      }
    }
  }

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
    selectedElement = null;
    selectedPadding = { ...defaultPadding };
    originalPadding = { ...defaultPadding };
    selectedScroll = { ...defaultScroll };
    editingScreenshotId = null;
    isNewElement = false;
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
   * Highlight element by selector (for sidebar selection)
   */
  export function highlightElement(selector: string, screenshotId?: string, attempt = 1): void {
    const maxAttempts = 5;
    const element = findElementBySelector(selector);

    if (element) {
      if (screenshotId) {
        // Editing existing screenshot - load saved padding and scroll
        const screenshot = screenshots.find(item => item.id === screenshotId);
        const padding = screenshot?.padding ? { ...screenshot.padding } : { ...defaultPadding };

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
        currentElement = null;
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
    selectedElement = null;
    selectedPadding = { ...defaultPadding };
    originalPadding = { ...defaultPadding };
    selectedScroll = { ...defaultScroll };
    editingScreenshotId = null;
    isNewElement = false;
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
   * Get which side of the viewport the selected element is on
   */
  export function getSelectedElementSide(): 'left' | 'right' | null {
    const element = selectedElement ?? currentElement;
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const viewportCenter = globalThis.innerWidth / 2;
    const elementCenter = rect.left + rect.width / 2;

    return elementCenter < viewportCenter ? 'left' : 'right';
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
   * Handle mouse move during resize drag
   */
  function handleResizeMouseMove(event: MouseEvent): void {
    if (!isDragging || !dragHandle) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    const newPadding = { ...dragStartPadding };

    if (dragHandle.includes('-')) {
      // Corner handle - proportional resize
      const [vertical, horizontal] = dragHandle.split('-');
      let expansion = 0;

      if (vertical === 'top') {
        expansion = -deltaY;
      } else if (vertical === 'bottom') {
        expansion = deltaY;
      }

      if (horizontal === 'left') {
        expansion = Math.max(expansion, -deltaX);
      } else if (horizontal === 'right') {
        expansion = Math.max(expansion, deltaX);
      }

      newPadding.top = Math.max(0, dragStartPadding.top + expansion);
      newPadding.right = Math.max(0, dragStartPadding.right + expansion);
      newPadding.bottom = Math.max(0, dragStartPadding.bottom + expansion);
      newPadding.left = Math.max(0, dragStartPadding.left + expansion);
    } else {
      // Edge handle - single direction
      const edgeDeltas: Record<string, { key: keyof Padding; delta: number }> = {
        top: { key: 'top', delta: -deltaY },
        bottom: { key: 'bottom', delta: deltaY },
        left: { key: 'left', delta: -deltaX },
        right: { key: 'right', delta: deltaX },
      };

      const edge = edgeDeltas[dragHandle];
      if (edge) {
        newPadding[edge.key] = Math.max(0, dragStartPadding[edge.key] + edge.delta);
      }
    }

    handlePaddingChange(newPadding);
  }

  /**
   * End resize drag
   */
  function handleResizeMouseUp(): void {
    isDragging = false;
    dragHandle = null;
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
  onkeydown={handleKeyDown}
/>

<!-- Overlay for element highlighting -->
{#if showOverlay && overlayRects}
  <div class="fixed inset-0 w-screen h-screen z-[2147483646] pointer-events-none">
    <!-- Dark overlay areas around element (clickable when element is selected) -->
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.top.top}px;left:{overlayRects.top.left}px;width:{overlayRects.top.width}px;height:{overlayRects.top.height}px;"
      onclick={handleOverlayClick}
    ></div>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.bottom.top}px;left:{overlayRects.bottom.left}px;width:{overlayRects.bottom.width}px;height:{overlayRects.bottom.height}px;"
      onclick={handleOverlayClick}
    ></div>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.left.top}px;left:{overlayRects.left.left}px;width:{overlayRects.left.width}px;height:{overlayRects.left.height}px;"
      onclick={handleOverlayClick}
    ></div>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="fixed bg-black/50 {selectedElement ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}"
      style="top:{overlayRects.right.top}px;left:{overlayRects.right.left}px;width:{overlayRects.right.width}px;height:{overlayRects.right.height}px;"
      onclick={handleOverlayClick}
    ></div>

    <!-- Element highlight -->
    {#if selectedElement !== null && expandedRect}
      <!-- Selected mode: padding overlays and resize handles -->

      <!-- Padding area overlays -->
      {#if hasPadding}
        {#if selectedPadding.top > 0}
          <div
            class="fixed bg-heroshot-primary/25 pointer-events-none flex items-center justify-center"
            style="top:{expandedRect.top}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.top}px;"
          >
            <span class="text-xs font-mono font-bold" style="color:#22c55e;">{selectedPadding.top}</span>
          </div>
        {/if}
        {#if selectedPadding.bottom > 0}
          <div
            class="fixed bg-heroshot-primary/25 pointer-events-none flex items-center justify-center"
            style="top:{overlayRects.highlight.top + overlayRects.highlight.height}px;left:{expandedRect.left}px;width:{expandedRect.width}px;height:{selectedPadding.bottom}px;"
          >
            <span class="text-xs font-mono font-bold" style="color:#22c55e;">{selectedPadding.bottom}</span>
          </div>
        {/if}
        {#if selectedPadding.left > 0}
          <div
            class="fixed bg-heroshot-primary/25 pointer-events-none flex items-center justify-center"
            style="top:{overlayRects.highlight.top}px;left:{expandedRect.left}px;width:{selectedPadding.left}px;height:{overlayRects.highlight.height}px;"
          >
            <span class="text-xs font-mono font-bold" style="color:#22c55e;">{selectedPadding.left}</span>
          </div>
        {/if}
        {#if selectedPadding.right > 0}
          <div
            class="fixed bg-heroshot-primary/25 pointer-events-none flex items-center justify-center"
            style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left + overlayRects.highlight.width}px;width:{selectedPadding.right}px;height:{overlayRects.highlight.height}px;"
          >
            <span class="text-xs font-mono font-bold" style="color:#22c55e;">{selectedPadding.right}</span>
          </div>
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
