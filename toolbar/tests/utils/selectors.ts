/**
 * Toolbar Element Selectors
 *
 * Playwright selectors for interacting with toolbar UI elements.
 * Uses shadow DOM piercing syntax (>>) to access elements inside the toolbar's shadow root.
 */

/**
 * Toolbar button selectors using title attributes
 */
export const TOOLBAR_SELECTORS = {
  picker: '#heroshot-root >> button[title="Pick element"]',
  sidebar: '#heroshot-root >> button[title="Toggle screenshots sidebar"]',
  settings: '#heroshot-root >> button[title="Settings"]',
  done: '#heroshot-root >> button[title="Done - save and close"]',
} as const;

/**
 * Sidebar selectors using data-testid attributes
 */
export const SIDEBAR_SELECTORS = {
  expandButton: '#heroshot-root >> button[title="Expand list"]',
  item: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"]`,
  itemButton: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] button[title="Navigate to this element"]`,
  deleteButton: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] [data-testid="delete-button"]`,
  itemNameSpan: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] span.text-xs`,
} as const;
