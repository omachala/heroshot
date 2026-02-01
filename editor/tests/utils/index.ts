/**
 * Test Utilities
 *
 * Re-exports all test utilities for convenient importing.
 */

// Toolbar injection and event handling
export {
  clearEvents,
  createMockScreenshot,
  getEvents,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
  type BrowserSettings,
  type InjectOptions,
  type ScreenshotItem,
  type ToolbarEvent,
} from './inject-toolbar';

// UI element selectors
export { SIDEBAR_SELECTORS, TOOLBAR_SELECTORS } from './selectors';

// Test actions
export {
  activatePickerAndSelectElement,
  clickCancelButtonForElement,
  clickConfirmButtonForElement,
  clickPageElement,
  clickSidebarDeleteButton,
  clickSidebarItem,
  clickSidebarItemName,
  clickToolbarButton,
  closeSidebar,
  confirmDraftScreenshot,
  expandSidebarList,
  getElementRect,
  openSidebar,
  waitForSidebar,
} from './actions';
