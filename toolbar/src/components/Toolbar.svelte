<script lang="ts">
  import { deepElementFromPoint, getSelector } from '../lib/dom';
  import type { ScreenshotItem, ToolbarJob } from '../types';
  import ListDialog from './ListDialog.svelte';
  import NameModal from './NameModal.svelte';

  interface Props {
    initialScreenshots?: ScreenshotItem[];
    pendingJob?: ToolbarJob | null;
  }

  const props: Props = $props();

  // Emit event to CLI
  function emit(event: Parameters<typeof globalThis.__heroshot.emit>[0]): void {
    globalThis.__heroshot?.emit(event);
  }

  // State
  let isPickerActive = $state(false);
  let isHighlighting = $state(false); // True when showing highlight from job
  let currentElement = $state<Element | null>(null);
  let statusText = $state('Click crosshair to pick element');
  let screenshots = $state<ScreenshotItem[]>([...(props.initialScreenshots ?? [])]);
  let pendingPick = $state<{ url: string; selector: string } | null>(null);
  let showNameModal = $state(false);
  let showListDialog = $state(false);

  // Scroll position tracker - used to trigger overlay recalculation
  let scrollY = $state(globalThis.scrollY ?? 0);
  let scrollX = $state(globalThis.scrollX ?? 0);

  // Derived
  let screenshotCount = $derived(screenshots.length);
  let showOverlay = $derived((isPickerActive || isHighlighting) && overlayRects !== null);

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    isPickerActive = !isPickerActive;
    isHighlighting = false;

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
      } else if (isHighlighting) {
        // Clear highlight mode
        isHighlighting = false;
        currentElement = null;
        statusText = 'Click crosshair to pick element';
      }
    }
  }

  /**
   * Handle name modal save
   */
  function handleNameSave(name: string): void {
    if (!pendingPick) return;

    const screenshotData: ScreenshotItem = {
      id: generateUid(),
      name,
      url: pendingPick.url,
      selector: pendingPick.selector,
    };

    screenshots = [...screenshots, screenshotData];
    emit({ type: 'screenshot-added', data: screenshotData });

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
    emit({ type: 'screenshot-removed', id });
  }

  /**
   * Handle screenshot selection - tell CLI to navigate and highlight
   */
  function handleSelectScreenshot(screenshot: ScreenshotItem): void {
    showListDialog = false;
    emit({
      type: 'screenshot-selected',
      id: screenshot.id,
      url: screenshot.url,
      selector: screenshot.selector,
    });
  }

  /**
   * Query selector that pierces shadow DOM using >>> syntax
   * e.g., "host-element >>> .inner-class >>> span"
   */
  function querySelectorPiercing(selector: string): Element | null {
    const parts = selector.split('>>>').map(s => s.trim());
    let current: Element | Document = document;

    for (const part of parts) {
      if (!part) continue;

      // Query within current context (document or shadow root)
      const root = current instanceof Element
        ? (current.shadowRoot ?? current)
        : current;

      const found = root.querySelector(part);
      if (!found) {
        return null;
      }

      current = found;
    }

    return current instanceof Element ? current : null;
  }

  /**
   * Find and highlight an element by selector with retry
   */
  function highlightElement(selector: string, attempt = 1): void {
    const maxAttempts = 5;

    // Use shadow-piercing query for >>> selectors, regular querySelector otherwise
    const element = selector.includes('>>>')
      ? querySelectorPiercing(selector)
      : document.querySelector(selector);

    if (element) {
      currentElement = element;
      isHighlighting = true;
      statusText = selector;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emit({ type: 'job-complete' });
    } else if (attempt < maxAttempts) {
      // Retry after 1 second
      statusText = `Looking for element... (attempt ${attempt}/${maxAttempts})`;
      globalThis.setTimeout(() => highlightElement(selector, attempt + 1), 1000);
    } else {
      statusText = `Element not found: ${selector}`;
      emit({ type: 'job-complete' });
    }
  }

  /**
   * Execute pending job from CLI
   */
  function executePendingJob(job: ToolbarJob): void {
    // Both job types just highlight the selector
    // For navigate-and-highlight, CLI already navigated us here
    highlightElement(job.selector);
  }

  /**
   * Type guard for ToolbarJob
   */
  function isToolbarJob(value: unknown): value is ToolbarJob {
    return typeof value === 'object' && value !== null && 'type' in value && 'selector' in value;
  }

  /**
   * Handle new job events from CLI
   */
  function handleNewJob(event: Event): void {
    if (event instanceof CustomEvent && isToolbarJob(event.detail)) {
      executePendingJob(event.detail);
    }
  }

  // Check for pending job on init
  $effect(() => {
    const job = props.pendingJob;
    if (job) {
      // Small delay to ensure DOM is ready
      globalThis.setTimeout(() => executePendingJob(job), 100);
    }
  });

  // Listen for new jobs from CLI (when toolbar already running)
  $effect(() => {
    globalThis.addEventListener('heroshot-job', handleNewJob);
    return () => globalThis.removeEventListener('heroshot-job', handleNewJob);
  });


  /**
   * Handle done button - close toolbar and signal completion
   */
  function handleDone(): void {
    emit({ type: 'done' });
  }

  /**
   * Generate a random UID (8 chars)
   */
  function generateUid(): string {
    // eslint-disable-next-line sonarjs/pseudo-random -- Not used for security, just unique IDs
    return Math.random().toString(36).slice(2, 10);
  }

  /**
   * Handle scroll events to update overlay position
   */
  function handleScroll(): void {
    scrollY = globalThis.scrollY;
    scrollX = globalThis.scrollX;
  }

  /**
   * Calculate overlay rectangles for darkening around element
   * Dependencies on scrollX/scrollY ensure recalculation on scroll
   */
  function getOverlayRects(element: Element | null, _scrollX: number, _scrollY: number) {
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

  let overlayRects = $derived(getOverlayRects(currentElement, scrollX, scrollY));
</script>

<svelte:window onscroll={handleScroll} />

<svelte:document
  onmousemove={handleMouseMove}
  onclick={handleClick}
  onkeydown={handleKeyDown}
/>

<!-- Toolbar -->
<div class="toolbar">
  <button
    class="picker-btn"
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

  <span class="status">{statusText}</span>

  <button
    class="list-btn"
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
    class="done-btn"
    onclick={handleDone}
    title="Done - save and close"
  >
    Done
  </button>
</div>

<!-- Overlay for element highlighting -->
{#if showOverlay && overlayRects}
  <div class="overlay">
    <div
      class="overlay-dark"
      style="top:{overlayRects.top.top}px;left:{overlayRects.top.left}px;width:{overlayRects.top.width}px;height:{overlayRects.top.height}px;"
    ></div>
    <div
      class="overlay-dark"
      style="top:{overlayRects.bottom.top}px;left:{overlayRects.bottom.left}px;width:{overlayRects.bottom.width}px;height:{overlayRects.bottom.height}px;"
    ></div>
    <div
      class="overlay-dark"
      style="top:{overlayRects.left.top}px;left:{overlayRects.left.left}px;width:{overlayRects.left.width}px;height:{overlayRects.left.height}px;"
    ></div>
    <div
      class="overlay-dark"
      style="top:{overlayRects.right.top}px;left:{overlayRects.right.left}px;width:{overlayRects.right.width}px;height:{overlayRects.right.height}px;"
    ></div>
    <div
      class="highlight"
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
    onSelect={handleSelectScreenshot}
    onRemove={handleRemoveScreenshot}
    onClose={() => showListDialog = false}
  />
{/if}

<style>
  /*
   * Styles are encapsulated via Shadow DOM (see main.ts).
   * No !important needed - host page CSS cannot leak in.
   */

  .toolbar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    user-select: none;
  }

  .picker-btn,
  .list-btn {
    width: 36px;
    height: 36px;
    border: 2px solid transparent;
    border-radius: 6px;
    background: #2d2d44;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    position: relative;
  }

  .picker-btn:hover,
  .list-btn:hover {
    background: #3d3d5c;
  }

  .picker-btn.active {
    background: #22c55e;
    border-color: #16a34a;
    color: #fff;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  }

  .list-btn.has-items {
    background: #3b82f6;
  }

  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: bold;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .status {
    color: #aaa;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .done-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background: #22c55e;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .done-btn:hover {
    background: #16a34a;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483646;
    pointer-events: none;
  }

  .overlay-dark {
    position: fixed;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .highlight {
    position: fixed;
    border: 3px solid #22c55e;
    background: rgba(34, 197, 94, 0.1);
    pointer-events: none;
    box-sizing: border-box;
  }
</style>
