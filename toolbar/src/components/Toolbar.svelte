<script lang="ts">
  import { CheckIcon, CloseIcon, PickerIcon, SettingsIcon, SidebarIcon } from '../icons';
  import { deepElementFromPoint, getSelector } from '../lib/dom';
  import type { BrowserSettings, ScreenshotItem, ToolbarJob } from '../types';
  import SettingsModal from './SettingsModal.svelte';
  import Sidebar from './Sidebar.svelte';

  interface Props {
    initialScreenshots?: ScreenshotItem[];
    initialSettings?: BrowserSettings;
    pendingJob?: ToolbarJob | null;
    /** ID of selected screenshot (for cross-URL navigation persistence) */
    initialSelectedId?: string | null;
    /** Whether sidebar should be open on init */
    initialSidebarVisible?: boolean;
  }

  const props: Props = $props();

  // Default settings
  const defaultSettings: BrowserSettings = {
    viewport: { width: 1280, height: 800 },
    colorScheme: undefined,
  };

  // Emit event to CLI
  type EmitEvent = Parameters<NonNullable<typeof globalThis.__heroshot>['emit']>[0];
  function emit(event: EmitEvent): void {
    globalThis.__heroshot?.emit(event);
  }

  // State
  let isPickerActive = $state(false);
  let isHighlighting = $state(false); // True when showing highlight from job
  let currentElement = $state<Element | null>(null);
  let selectedElement = $state<Element | null>(null); // Element selected and awaiting confirmation
  let selectedSelector = $state<string | null>(null);
  let screenshots = $state<ScreenshotItem[]>([...(props.initialScreenshots ?? [])]);
  let settings = $state<BrowserSettings>({ ...defaultSettings, ...props.initialSettings });
  let sidebarVisible = $state(props.initialSidebarVisible ?? false);
  let settingsVisible = $state(false);
  let editingId = $state<string | null>(null); // ID of newly added item being edited
  let selectedScreenshotId = $state<string | null>(props.initialSelectedId ?? null); // ID of selected screenshot in sidebar

  // Scroll position tracker - used to trigger overlay recalculation
  let scrollY = $state(globalThis.scrollY ?? 0);
  let scrollX = $state(globalThis.scrollX ?? 0);

  // Derived
  let screenshotCount = $derived(screenshots.length);
  let showOverlay = $derived(
    (isPickerActive && currentElement !== null) ||
    (selectedElement !== null) ||
    isHighlighting
  );
  let activeElement = $derived(selectedElement ?? currentElement);

  // Compute sidebar button class - only blue when sidebar is open
  let sidebarButtonClass = $derived.by(() => {
    if (sidebarVisible) return 'bg-blue-600';
    return 'bg-slate-700 hover:bg-slate-600';
  });

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    isPickerActive = !isPickerActive;
    isHighlighting = false;

    if (isPickerActive) {
      document.body.style.cursor = 'crosshair';
      // Clear any selected element when entering picker mode
      selectedElement = null;
      selectedSelector = null;
    } else {
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
    }
  }

  /**
   * Handle click - select element and keep it selected (awaiting confirmation)
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

      // Select the element (keep it highlighted with confirm button)
      selectedElement = currentElement;
      selectedSelector = selector;

      // Deactivate picker mode
      isPickerActive = false;
      document.body.style.cursor = '';
      currentElement = null;
    }
  }

  /**
   * Handle confirmation - add screenshot and open sidebar for naming
   */
  function handleConfirm(): void {
    if (!selectedElement || !selectedSelector) return;

    const { href } = globalThis.location;
    const smartName = generateSmartName(selectedSelector);

    const screenshotData: ScreenshotItem = {
      id: generateUid(),
      name: smartName,
      url: href,
      selector: selectedSelector,
      createdAt: Date.now(),
    };

    screenshots = [...screenshots, screenshotData];
    emit({ type: 'screenshot-added', data: screenshotData });

    // Clear selection
    selectedElement = null;
    selectedSelector = null;

    // Open sidebar with the new item in edit mode
    sidebarVisible = true;
    editingId = screenshotData.id;
  }

  /**
   * Cancel selection
   */
  function handleCancelSelection(): void {
    selectedElement = null;
    selectedSelector = null;
    isHighlighting = false;
    currentElement = null;
  }

  /**
   * Generate a smart name from page title and selector
   * e.g., "Heroshot.sh - hero-section" or "Dashboard - card 3"
   */
  function generateSmartName(selector: string): string {
    // Get page title, clean it up
    let pageTitle = document.title || 'Page';
    // Truncate long titles
    if (pageTitle.length > 30) {
      pageTitle = pageTitle.slice(0, 30).trim();
    }

    // Extract meaningful part from selector
    const selectorPart = extractSelectorName(selector);

    return `${pageTitle} - ${selectorPart}`;
  }

  /**
   * Extract a human-readable name from a CSS selector
   * e.g., ".hero-section" → "hero-section"
   *       "#contact-form" → "contact-form"
   *       "div.card:nth-of-type(3)" → "card 3"
   */
  function extractSelectorName(selector: string): string {
    // Get the last part of the selector (most specific)
    // Split on >>> or > with optional single space around them
    const parts = selector.split(/ ?(?:>>>|>) ?/);
    const lastPart = parts.at(-1) ?? selector;

    // Try to extract ID
    const idMatch = /#([a-z0-9_-]+)/i.exec(lastPart);
    if (idMatch?.[1]) {
      return idMatch[1].replaceAll('-', ' ').replaceAll('_', ' ');
    }

    // Try to extract class name
    const classMatch = /\.([a-z0-9_-]+)/i.exec(lastPart);
    if (classMatch?.[1]) {
      const className = classMatch[1].replaceAll('-', ' ').replaceAll('_', ' ');

      // Check for nth-of-type
      const nthMatch = /:nth-of-type\((\d+)\)/.exec(lastPart);
      if (nthMatch?.[1]) {
        return `${className} ${nthMatch[1]}`;
      }

      return className;
    }

    // Fall back to tag name
    const tagMatch = /^([a-z0-9]+)/i.exec(lastPart);
    if (tagMatch?.[1]) {
      const tagName = tagMatch[1];
      const nthMatch = /:nth-of-type\((\d+)\)/.exec(lastPart);
      if (nthMatch?.[1]) {
        return `${tagName} ${nthMatch[1]}`;
      }
      return tagName;
    }

    return 'element';
  }

  /**
   * Handle keyboard events - ESC to cancel
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (sidebarVisible) {
        sidebarVisible = false;
      } else if (selectedElement) {
        handleCancelSelection();
      } else if (isPickerActive) {
        togglePicker();
      } else if (isHighlighting) {
        // Clear highlight mode
        isHighlighting = false;
        currentElement = null;
      }
    }
  }

  /**
   * Handle screenshot removal from sidebar
   */
  function handleRemoveScreenshot(id: string): void {
    screenshots = screenshots.filter((screenshot) => screenshot.id !== id);
    emit({ type: 'screenshot-removed', id });
  }

  /**
   * Handle screenshot rename from sidebar
   */
  function handleRenameScreenshot(id: string, newName: string): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id ? { ...screenshot, name: newName } : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated) {
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle screenshot selection - tell CLI to navigate and highlight
   */
  function handleSelectScreenshot(screenshot: ScreenshotItem): void {
    selectedScreenshotId = screenshot.id;
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
    const parts = selector.split('>>>').map(selectorPart => selectorPart.trim());
    let foundElement: Element | null = null;

    for (const part of parts) {
      if (!part) continue;

      // Query within current context (document or shadow root)
      let root: ParentNode;
      if (foundElement === null) {
        root = document;
      } else if (foundElement.shadowRoot) {
        root = foundElement.shadowRoot;
      } else {
        root = foundElement;
      }

      const result = root.querySelector(part);
      if (!result) {
        return null;
      }

      foundElement = result;
    }

    return foundElement;
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
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emit({ type: 'job-complete' });
    } else if (attempt < maxAttempts) {
      // Retry after 1 second
      globalThis.setTimeout(() => highlightElement(selector, attempt + 1), 1000);
    } else {
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
   * Toggle sidebar visibility
   */
  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
  }

  /**
   * Toggle settings modal
   */
  function toggleSettings(): void {
    settingsVisible = !settingsVisible;
  }

  /**
   * Handle settings save
   */
  function handleSaveSettings(newSettings: BrowserSettings): void {
    settings = newSettings;
    emit({ type: 'settings-updated', data: newSettings });
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

  let overlayRects = $derived(getOverlayRects(activeElement, scrollX, scrollY));
</script>

<svelte:window onscroll={handleScroll} />

<svelte:document
  onmousemove={handleMouseMove}
  onclick={handleClick}
  onkeydown={handleKeyDown}
/>

<!-- Toolbar -->
<div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2147483647] bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 font-sans text-sm text-white shadow-xl select-none pointer-events-auto">
  <button
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors {isPickerActive ? 'bg-green-500 animate-pulse-green' : 'bg-slate-700 hover:bg-slate-600'}"
    onclick={togglePicker}
    title="Pick element"
  >
    <PickerIcon size={20} />
  </button>

  <button
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors relative {sidebarButtonClass}"
    onclick={toggleSidebar}
    title="Toggle screenshots sidebar"
  >
    <SidebarIcon />
    {#if screenshotCount > 0}
      <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{screenshotCount}</span>
    {/if}
  </button>

  <button
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors {settingsVisible ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}"
    onclick={toggleSettings}
    title="Settings"
  >
    <SettingsIcon />
  </button>

  <button
    class="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
    onclick={handleDone}
    title="Done - save and close"
  >
    Done
  </button>
</div>

<!-- Overlay for element highlighting -->
{#if showOverlay && overlayRects}
  <div class="fixed inset-0 w-screen h-screen z-[2147483646] pointer-events-none">
    <div
      class="fixed bg-black/50 pointer-events-none"
      style="top:{overlayRects.top.top}px;left:{overlayRects.top.left}px;width:{overlayRects.top.width}px;height:{overlayRects.top.height}px;"
    ></div>
    <div
      class="fixed bg-black/50 pointer-events-none"
      style="top:{overlayRects.bottom.top}px;left:{overlayRects.bottom.left}px;width:{overlayRects.bottom.width}px;height:{overlayRects.bottom.height}px;"
    ></div>
    <div
      class="fixed bg-black/50 pointer-events-none"
      style="top:{overlayRects.left.top}px;left:{overlayRects.left.left}px;width:{overlayRects.left.width}px;height:{overlayRects.left.height}px;"
    ></div>
    <div
      class="fixed bg-black/50 pointer-events-none"
      style="top:{overlayRects.right.top}px;left:{overlayRects.right.left}px;width:{overlayRects.right.width}px;height:{overlayRects.right.height}px;"
    ></div>
    <div
      class="fixed border-3 pointer-events-none box-border {selectedElement === null ? 'border-heroshot-primary bg-heroshot-primary/10' : 'border-heroshot-secondary bg-heroshot-secondary/10'}"
      style="top:{overlayRects.highlight.top}px;left:{overlayRects.highlight.left}px;width:{overlayRects.highlight.width}px;height:{overlayRects.highlight.height}px;"
    >
      <!-- Confirm/Cancel buttons when element is selected -->
      {#if selectedElement !== null}
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
          <button
            class="w-8 h-8 border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 shadow-md bg-heroshot-primary text-white hover:bg-heroshot-primary-hover hover:scale-110"
            onclick={handleConfirm}
            title="Confirm selection"
          >
            <CheckIcon />
          </button>
          <button
            class="w-8 h-8 border-none rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 shadow-md bg-heroshot-danger text-white hover:bg-heroshot-danger-hover hover:scale-110"
            onclick={handleCancelSelection}
            title="Cancel selection"
          >
            <CloseIcon />
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Sidebar -->
<Sidebar
  {screenshots}
  visible={sidebarVisible}
  {editingId}
  selectedId={selectedScreenshotId}
  onClose={() => sidebarVisible = false}
  onSelect={handleSelectScreenshot}
  onRemove={handleRemoveScreenshot}
  onRename={handleRenameScreenshot}
  onEditingComplete={() => editingId = null}
/>

<!-- Settings Modal -->
<SettingsModal
  visible={settingsVisible}
  {settings}
  onClose={() => settingsVisible = false}
  onSave={handleSaveSettings}
/>

<style>
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  }
  .animate-pulse-green {
    animation: pulse 1s infinite;
  }
</style>
