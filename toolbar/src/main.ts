/**
 * Heroshot Toolbar Entry Point
 *
 * Browser-injected UI for selecting elements and managing screenshots.
 * Injected by Playwright during `heroshot setup`.
 */

import { mount, unmount } from 'svelte';
import Toolbar from './Toolbar.svelte';

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

  // Create mount target
  const target = document.createElement('div');
  target.id = 'heroshot-root';
  document.body.append(target);

  // Mount Svelte component
  const component = mount(Toolbar, {
    target,
    props: {
      initialScreenshots: [...globalThis.__heroshot.screenshots],
    },
  });

  /**
   * Cleanup function to remove toolbar
   */
  function cleanup(): void {
    void unmount(component);
    target.remove();

    if (globalThis.__heroshot) {
      globalThis.__heroshot.initialized = false;
    }
  }

  return cleanup;
}

// Auto-initialize when script loads
initToolbar();
