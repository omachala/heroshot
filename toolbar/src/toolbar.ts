/**
 * Heroshot Element Picker
 *
 * Browser-injected UI for selecting elements and generating CSS selectors.
 * Injected by Playwright during `heroshot setup`.
 */

import {
  createOverlay,
  createToolbar,
  deepElementFromPoint,
  getSelector,
  updateOverlay,
} from './dom';
import type { PickerState } from './types';
import './toolbar.css';

/**
 * Initialize the element picker
 */
export function initToolbar(): (() => void) | null {
  // Prevent double initialization
  if (globalThis.__heroshotToolbarInit) return null;
  globalThis.__heroshotToolbarInit = true;

  // State
  const state: PickerState = {
    isActive: false,
    currentElement: null,
  };

  // Create and append DOM elements
  const toolbar = createToolbar();
  const overlay = createOverlay();
  document.body.append(toolbar);
  document.body.append(overlay);

  // Get references to toolbar elements (non-null since we just created them)
  const buttonElement = toolbar.querySelector<HTMLButtonElement>('#heroshot-picker-btn');
  const statusElement = toolbar.querySelector<HTMLSpanElement>('#heroshot-status');

  if (!buttonElement || !statusElement) {
    throw new Error('Failed to initialize picker: toolbar elements not found');
  }

  // Re-assign after guard to ensure TypeScript knows these are non-null in closures
  const button: HTMLButtonElement = buttonElement;
  const status: HTMLSpanElement = statusElement;

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    state.isActive = !state.isActive;

    if (state.isActive) {
      button.classList.add('active');
      status.textContent = 'Hover over element, click to select';
      document.body.style.cursor = 'crosshair';
    } else {
      button.classList.remove('active');
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
    if (!state.isActive) return;

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
    if (!state.isActive) return;

    const { target } = event;
    if (target instanceof Element && target.closest('#heroshot-toolbar')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (state.currentElement) {
      const selector = getSelector(state.currentElement);
      // eslint-disable-next-line prefer-destructuring -- Nested destructuring would reduce readability
      const { href: url } = globalThis.location;

      // Call exposed function from Playwright
      const { onElementPicked } = globalThis;
      if (onElementPicked) {
        onElementPicked({ url, selector });
      }

      // Deactivate picker
      togglePicker();
    }
  }

  /**
   * Handle keyboard events - ESC to cancel
   */
  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && state.isActive) {
      togglePicker();
    }
  }

  // Attach event listeners
  button.addEventListener('click', togglePicker);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  /**
   * Cleanup function to remove picker
   */
  function cleanup(): void {
    button.removeEventListener('click', togglePicker);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);

    toolbar.remove();
    overlay.remove();

    globalThis.__heroshotToolbarInit = false;
  }

  return cleanup;
}

// Auto-initialize when script loads
initToolbar();
