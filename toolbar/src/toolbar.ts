/**
 * Heroshot Toolbar
 *
 * Browser-injected UI for selecting elements and managing screenshots.
 * Injected by Playwright during `heroshot setup`.
 */

import {
  createOverlay,
  createToolbar,
  deepElementFromPoint,
  getSelector,
  updateOverlay,
} from './lib/dom';
import type { ToolbarState } from './types';

/**
 * Initialize the toolbar
 */
export function initToolbar(): (() => void) | null {
  // Ensure __heroshot namespace exists
  if (!globalThis.__heroshot) {
    globalThis.__heroshot = {
      initialized: false,
      screenshots: [],
    };
  }

  // Prevent double initialization
  if (globalThis.__heroshot.initialized) return null;
  globalThis.__heroshot.initialized = true;

  // State - initialize with existing screenshots from global
  const state: ToolbarState = {
    isPickerActive: false,
    currentElement: null,
    screenshots: [...globalThis.__heroshot.screenshots],
    pendingPick: null,
  };

  // Create and append DOM elements
  const toolbar = createToolbar();
  const overlay = createOverlay();
  document.body.append(toolbar);
  document.body.append(overlay);

  // Get references to toolbar elements
  const pickerButton = toolbar.querySelector<HTMLButtonElement>('#heroshot-picker-btn');
  const statusElement = toolbar.querySelector<HTMLSpanElement>('#heroshot-status');

  if (!pickerButton || !statusElement) {
    throw new Error('Failed to initialize toolbar: elements not found');
  }

  // Re-assign after guard to ensure TypeScript knows these are non-null in closures
  const picker: HTMLButtonElement = pickerButton;
  const status: HTMLSpanElement = statusElement;

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    state.isPickerActive = !state.isPickerActive;

    if (state.isPickerActive) {
      picker.classList.add('active');
      status.textContent = 'Hover over element, click to select';
      document.body.style.cursor = 'crosshair';
    } else {
      picker.classList.remove('active');
      status.textContent = 'Click crosshair to pick element';
      document.body.style.cursor = '';
      updateOverlay(overlay, null);
      state.currentElement = null;
    }
  }

  /**
   * Handle mouse movement - highlight element under cursor
   */
  function onMouseMove(event: MouseEvent): void {
    if (!state.isPickerActive) return;

    const element = deepElementFromPoint(event.clientX, event.clientY);

    if (
      element &&
      !element.closest('#heroshot-toolbar') &&
      !element.closest('#heroshot-overlay')
    ) {
      state.currentElement = element;
      const rect = element.getBoundingClientRect();
      updateOverlay(overlay, rect);

      const selector = getSelector(element);
      status.textContent = selector;
    }
  }

  /**
   * Handle click - select element and notify Playwright
   */
  function onClick(event: MouseEvent): void {
    if (!state.isPickerActive) return;

    const { target } = event;
    if (target instanceof Element && target.closest('#heroshot-toolbar')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (state.currentElement) {
      const selector = getSelector(state.currentElement);
      const { href } = globalThis.location;

      // Store pending pick and show name modal
      state.pendingPick = { url: href, selector };

      // TODO: Show name modal instead of directly calling callback
      // For now, generate a simple name and call callback
      const name = `screenshot-${Date.now()}`;
      const id = generateId(name);

      const screenshotData = { id, name, url: href, selector };
      state.screenshots.push(screenshotData);

      // Call exposed function from Playwright
      if (globalThis.__heroshot?.onScreenshotAdded) {
        globalThis.__heroshot.onScreenshotAdded(screenshotData);
      }

      // Deactivate picker
      togglePicker();
    }
  }

  /**
   * Handle keyboard events - ESC to cancel
   */
  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && state.isPickerActive) {
      togglePicker();
    }
  }

  // Attach event listeners
  picker.addEventListener('click', togglePicker);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  /**
   * Cleanup function to remove toolbar
   */
  function cleanup(): void {
    picker.removeEventListener('click', togglePicker);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);

    toolbar.remove();
    overlay.remove();

    if (globalThis.__heroshot) {
      globalThis.__heroshot.initialized = false;
    }
  }

  return cleanup;
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

// Auto-initialize when script loads
initToolbar();
