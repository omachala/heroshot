/**
 * Heroshot Toolbar Entry Point
 *
 * Browser-injected UI for selecting elements and managing screenshots.
 * Injected by Playwright during `heroshot setup`.
 */

import { mount, unmount } from 'svelte';
import Toolbar from './components/Toolbar.svelte';

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

  // Create mount target with Shadow DOM
  // We use Shadow DOM to encapsulate styles - this toolbar is injected into
  // arbitrary websites, and without style isolation the host page's CSS could
  // override our styles. Shadow DOM provides complete style encapsulation,
  // eliminating the need for !important declarations.
  const host = document.createElement('div');
  host.id = 'heroshot-root';
  document.body.append(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // Mount Svelte component into shadow root
  const component = mount(Toolbar, {
    target: shadow,
    props: {
      initialScreenshots: [...globalThis.__heroshot.screenshots],
    },
  });

  /**
   * Cleanup function to remove toolbar
   */
  function cleanup(): void {
    void unmount(component);
    host.remove();

    if (globalThis.__heroshot) {
      globalThis.__heroshot.initialized = false;
    }
  }

  return cleanup;
}

// Auto-initialize when script loads
initToolbar();
