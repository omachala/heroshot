/**
 * Heroshot Element Picker
 *
 * Browser-injected UI for selecting elements and generating CSS selectors.
 * Injected by Playwright during `heroshot setup`.
 */

import type { PickerState } from './types';
import {
  createOverlay,
  createToolbar,
  deepElementFromPoint,
  getSelector,
  updateOverlay,
} from './dom';
import './picker.css';

/**
 * Initialize the element picker
 */
export function initPicker(): (() => void) | null {
  // Prevent double initialization
  if (window.__heroshotPickerInit) return null;
  window.__heroshotPickerInit = true;

  // State
  const state: PickerState = {
    isActive: false,
    currentElement: null,
  };

  // Create and append DOM elements
  const toolbar = createToolbar();
  const overlay = createOverlay();
  document.body.appendChild(toolbar);
  document.body.appendChild(overlay);

  // Get references to toolbar elements (non-null since we just created them)
  const btnEl = toolbar.querySelector<HTMLButtonElement>('#heroshot-picker-btn');
  const statusEl = toolbar.querySelector<HTMLSpanElement>('#heroshot-status');

  if (!btnEl || !statusEl) {
    throw new Error('Failed to initialize picker: toolbar elements not found');
  }

  // Re-assign after guard to ensure TypeScript knows these are non-null in closures
  const btn: HTMLButtonElement = btnEl;
  const status: HTMLSpanElement = statusEl;

  /**
   * Toggle picker mode on/off
   */
  function togglePicker(): void {
    state.isActive = !state.isActive;

    if (state.isActive) {
      btn.classList.add('active');
      status.textContent = 'Hover over element, click to select';
      document.body.style.cursor = 'crosshair';
    } else {
      btn.classList.remove('active');
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

    const el = deepElementFromPoint(event.clientX, event.clientY);

    if (
      el &&
      !el.closest('#heroshot-toolbar') &&
      !el.closest('#heroshot-overlay')
    ) {
      state.currentElement = el;
      const rect = el.getBoundingClientRect();
      updateOverlay(overlay, rect);

      const selector = getSelector(el);
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
      const url = window.location.href;

      // Call exposed function from Playwright
      if (window.onElementPicked) {
        window.onElementPicked({ url, selector });
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
  btn.addEventListener('click', togglePicker);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  /**
   * Cleanup function to remove picker
   */
  function cleanup(): void {
    btn.removeEventListener('click', togglePicker);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);

    toolbar.remove();
    overlay.remove();

    window.__heroshotPickerInit = false;
  }

  return cleanup;
}

// Auto-initialize when script loads
initPicker();
