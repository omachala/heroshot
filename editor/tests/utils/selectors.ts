/**
 * Editor Bar Element Selectors
 *
 * Playwright selectors for interacting with EditorBar UI elements.
 * Uses shadow DOM piercing syntax (>>) to access elements inside the toolbar's shadow root.
 */

/**
 * Toolbar button selectors using title attributes
 */
export const TOOLBAR_SELECTORS = {
  picker: '#heroshot-root >> button[title="Pick element"]',
  hide: '#heroshot-root >> button[title="Hide element"]',
  settings: '#heroshot-root >> button[title="Settings"]',
  done: '#heroshot-root >> button[title="Done"]',
  expand: '#heroshot-root >> button[title="Expand list"]',
  collapse: '#heroshot-root >> button[title="Collapse list"]',
} as const;

/**
 * Sidebar (screenshot list) selectors using data-testid attributes
 */
export const SIDEBAR_SELECTORS = {
  item: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"]`,
  itemButton: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] button[title="Select to edit"]`,
  deleteButton: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] [data-testid="delete-button"]`,
  itemNameSpan: (index: number) =>
    `#heroshot-root >> [data-testid="sidebar-item"][data-item-index="${index}"] span.text-xs`,
} as const;
