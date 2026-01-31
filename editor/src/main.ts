/**
 * Heroshot Toolbar Entry Point
 *
 * Browser-injected UI for selecting elements and managing screenshots.
 * Injected by Playwright during `heroshot setup`.
 */

import { mount, unmount } from 'svelte';
import Toolbar from './components/Toolbar.svelte';
import { getBackgroundColor } from './lib/dom';
import { eventInterceptor } from './lib/eventInterceptor';
import styles from './styles.css?inline';

/**
 * Initialize the toolbar
 */
export function initToolbar(): (() => void) | null {
  // Initialize event interceptor FIRST - before any DOM changes
  // This ensures toolbar events are blocked from reaching page handlers
  eventInterceptor.init();

  // Ensure __heroshot namespace exists
  if (globalThis.__heroshot) {
    // Ensure utils is always available
    globalThis.__heroshot.utils = { getBackgroundColor };
  } else {
    globalThis.__heroshot = {
      initialized: false,
      screenshots: [],
      settings: { viewport: { width: 1280, height: 800 } },
      pendingJob: null,
      selectedId: null,
      sidebarVisible: false,
      emit: () => {
        // No-op if not injected by CLI
      },
      utils: {
        getBackgroundColor,
      },
    };
  }

  const heroshot = globalThis.__heroshot;

  // Prevent double initialization
  if (heroshot.initialized) {
    return null;
  }
  heroshot.initialized = true;

  // Create mount target with Shadow DOM
  // We use Shadow DOM to encapsulate styles - this toolbar is injected into
  // arbitrary websites, and without style isolation the host page's CSS could
  // override our styles. Shadow DOM provides complete style encapsulation,
  // eliminating the need for !important declarations.
  const host = document.createElement('div');
  host.id = 'heroshot-root';
  // Make the host cover the entire viewport so fixed-position children render correctly.
  // pointer-events:none allows clicks to pass through to the page beneath.
  // Children (toolbar, sidebar) have pointer-events:auto to receive their own clicks.
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;';
  document.body.append(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Detect system color scheme and apply OPPOSITE for contrast
  // Dark page → light toolbar, Light page → dark toolbar
  const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const toolbarTheme = prefersDark ? 'light' : 'dark';

  // Create a wrapper div for theme scoping
  const themeWrapper = document.createElement('div');
  themeWrapper.dataset['theme'] = toolbarTheme;
  shadow.append(themeWrapper);

  // Inject Tailwind styles into shadow root
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  themeWrapper.append(styleElement);

  // Mount Svelte component into theme wrapper
  let component: ReturnType<typeof mount>;
  try {
    component = mount(Toolbar, {
      target: themeWrapper,
      props: {
        initialScreenshots: [...heroshot.screenshots],
        initialSettings: heroshot.settings,
        pendingJob: heroshot.pendingJob,
        initialSelectedId: heroshot.selectedId,
        initialSidebarVisible: heroshot.sidebarVisible,
      },
    });
  } catch {
    return null;
  }

  /**
   * Cleanup function to remove toolbar
   */
  function cleanup(): void {
    void unmount(component);
    host.remove();
    eventInterceptor.destroy();

    if (globalThis.__heroshot) {
      globalThis.__heroshot.initialized = false;
    }
  }

  return cleanup;
}

// Auto-initialize when script loads
initToolbar();
