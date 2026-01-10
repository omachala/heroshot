<script lang="ts">
  import { deepElementFromPoint, getSelector } from './dom';
  import ListDialog from './ListDialog.svelte';
  import NameModal from './NameModal.svelte';
  import type { ScreenshotItem } from './types';

  interface Props {
    initialScreenshots?: ScreenshotItem[];
  }

  const props: Props = $props();

  // State
  let isPickerActive = $state(false);
  let currentElement = $state<Element | null>(null);
  let statusText = $state('Click crosshair to pick element');
  let screenshots = $state<ScreenshotItem[]>([...(props.initialScreenshots ?? [])]);
  let pendingPick = $state<{ url: string; selector: string } | null>(null);
  let showNameModal = $state(false);
  let showListDialog = $state(false);

  // Derived
  let screenshotCount = $derived(screenshots.length);

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    isPickerActive = !isPickerActive;

    if (isPickerActive) {
      statusText = 'Hover over element, click to select';
      document.body.style.cursor = 'crosshair';
    } else {
      statusText = 'Click crosshair to pick element';
      document.body.style.cursor = '';
      currentElement = null;
    }
  }

  /**
   * Handle mouse movement - highlight element under cursor
   */
  function handleMouseMove(event: MouseEvent): void {
    if (!isPickerActive) return;

    const element = deepElementFromPoint(event.clientX, event.clientY);

    if (
      element &&
      !element.closest('#heroshot-root') &&
      !element.closest('#heroshot-overlay')
    ) {
      currentElement = element;
      const selector = getSelector(element);
      statusText = selector;
    }
  }

  /**
   * Handle click - select element and show name modal
   */
  function handleClick(event: MouseEvent): void {
    if (!isPickerActive) return;

    const { target } = event;
    if (target instanceof Element && target.closest('#heroshot-root')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (currentElement) {
      const selector = getSelector(currentElement);
      const { href } = globalThis.location;

      pendingPick = { url: href, selector };
      showNameModal = true;

      // Deactivate picker
      isPickerActive = false;
      document.body.style.cursor = '';
    }
  }

  /**
   * Handle keyboard events - ESC to cancel
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (showNameModal) {
        showNameModal = false;
        pendingPick = null;
      } else if (showListDialog) {
        showListDialog = false;
      } else if (isPickerActive) {
        togglePicker();
      }
    }
  }

  /**
   * Handle name modal save
   */
  function handleNameSave(name: string): void {
    if (!pendingPick) return;

    const id = generateId(name);
    const screenshotData: ScreenshotItem = {
      id,
      name,
      url: pendingPick.url,
      selector: pendingPick.selector,
    };

    screenshots = [...screenshots, screenshotData];

    // Call exposed function from Playwright
    if (globalThis.__heroshot?.onScreenshotAdded) {
      globalThis.__heroshot.onScreenshotAdded(screenshotData);
    }

    showNameModal = false;
    pendingPick = null;
    currentElement = null;
    statusText = 'Click crosshair to pick element';
  }

  /**
   * Handle name modal cancel
   */
  function handleNameCancel(): void {
    showNameModal = false;
    pendingPick = null;
    currentElement = null;
    statusText = 'Click crosshair to pick element';
  }

  /**
   * Handle screenshot removal from list
   */
  function handleRemoveScreenshot(id: string): void {
    screenshots = screenshots.filter((s) => s.id !== id);

    if (globalThis.__heroshot?.onScreenshotRemoved) {
      globalThis.__heroshot.onScreenshotRemoved(id);
    }
  }

  /**
   * Handle done button - close toolbar and signal completion
   */
  function handleDone(): void {
    if (globalThis.__heroshot?.onDone) {
      globalThis.__heroshot.onDone();
    }
  }

  /**
   * Generate a simple ID from name
   */
  function generateId(name: string): string {
    return name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(?:^-|-$)/g, '');
  }

  /**
   * Calculate overlay rectangles for darkening around element
   */
  function getOverlayRects(element: Element | null) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const { innerWidth, innerHeight } = globalThis;

    return {
      top: { top: 0, left: 0, width: innerWidth, height: rect.top },
      bottom: { top: rect.bottom, left: 0, width: innerWidth, height: innerHeight - rect.bottom },
      left: { top: rect.top, left: 0, width: rect.left, height: rect.height },
      right: { top: rect.top, left: rect.right, width: innerWidth - rect.right, height: rect.height },
      highlight: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };
  }

  let overlayRects = $derived(getOverlayRects(currentElement));
</script>

<svelte:document
  onmousemove={handleMouseMove}
  onclick={handleClick}
  onkeydown={handleKeyDown}
/>

<!-- Toolbar -->
<div id="heroshot-toolbar">
  <button
    id="heroshot-picker-btn"
    class:active={isPickerActive}
    onclick={togglePicker}
    title="Pick element"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  </button>

  <span id="heroshot-status">{statusText}</span>

  <button
    id="heroshot-list-btn"
    class:has-items={screenshotCount > 0}
    onclick={() => showListDialog = true}
    title="View screenshots"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
    {#if screenshotCount > 0}
      <span class="badge">{screenshotCount}</span>
    {/if}
  </button>

  <button
    id="heroshot-done-btn"
    onclick={handleDone}
    title="Done - save and close"
  >
    Done
  </button>
</div>

<!-- Overlay for element highlighting -->
{#if isPickerActive && overlayRects}
  <div id="heroshot-overlay">
    <div
      class="heroshot-overlay-dark"
      style="top:{overlayRects.top.top}px;left:{overlayRects.top.left}px;width:{overlayRects.top.width}px;height:{overlayRects.top.height}px;"
    ></div>
    <div
      class="heroshot-overlay-dark"
      style="top:{overlayRects.bottom.top}px;left:{overlayRects.bottom.left}px;width:{overlayRects.bottom.width}px;height:{overlayRects.bottom.height}px;"
    ></div>
    <div
      class="heroshot-overlay-dark"
      style="top:{overlayRects.left.top}px;left:{overlayRects.left.left}px;width:{overlayRects.left.width}px;height:{overlayRects.left.height}px;"
    ></div>
    <div
      class="heroshot-overlay-dark"
      style="top:{overlayRects.right.top}px;left:{overlayRects.right.left}px;width:{overlayRects.right.width}px;height:{overlayRects.right.height}px;"
    ></div>
    <div
      class="heroshot-highlight"
      style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left}px;width:{overlayRects.highlight.width}px;height:{overlayRects.highlight.height}px;"
    ></div>
  </div>
{/if}

<!-- Name Modal -->
{#if showNameModal && pendingPick}
  <NameModal
    selector={pendingPick.selector}
    onSave={handleNameSave}
    onCancel={handleNameCancel}
  />
{/if}

<!-- List Dialog -->
{#if showListDialog}
  <ListDialog
    {screenshots}
    onRemove={handleRemoveScreenshot}
    onClose={() => showListDialog = false}
  />
{/if}

<style>
  #heroshot-toolbar {
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    z-index: 2147483647 !important;
    background: #1a1a2e !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 13px !important;
    color: #fff !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    user-select: none !important;
  }

  #heroshot-picker-btn,
  #heroshot-list-btn {
    width: 36px !important;
    height: 36px !important;
    border: 2px solid transparent !important;
    border-radius: 6px !important;
    background: #2d2d44 !important;
    color: #fff !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s !important;
    position: relative !important;
  }

  #heroshot-picker-btn:hover,
  #heroshot-list-btn:hover {
    background: #3d3d5c !important;
  }

  #heroshot-picker-btn.active {
    background: #22c55e !important;
    border-color: #16a34a !important;
    color: #fff !important;
    animation: heroshot-pulse 1s infinite !important;
  }

  @keyframes heroshot-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  }

  #heroshot-list-btn.has-items {
    background: #3b82f6 !important;
  }

  .badge {
    position: absolute !important;
    top: -6px !important;
    right: -6px !important;
    background: #ef4444 !important;
    color: #fff !important;
    font-size: 10px !important;
    font-weight: bold !important;
    min-width: 16px !important;
    height: 16px !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 4px !important;
  }

  #heroshot-status {
    color: #aaa !important;
    max-width: 400px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  #heroshot-done-btn {
    padding: 8px 16px !important;
    border: none !important;
    border-radius: 6px !important;
    background: #22c55e !important;
    color: #fff !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
  }

  #heroshot-done-btn:hover {
    background: #16a34a !important;
  }

  #heroshot-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483646 !important;
    pointer-events: none !important;
  }

  .heroshot-overlay-dark {
    position: fixed !important;
    background: rgba(0, 0, 0, 0.5) !important;
    pointer-events: none !important;
  }

  .heroshot-highlight {
    position: fixed !important;
    border: 3px solid #22c55e !important;
    background: rgba(34, 197, 94, 0.1) !important;
    pointer-events: none !important;
    box-sizing: border-box !important;
  }
</style>
