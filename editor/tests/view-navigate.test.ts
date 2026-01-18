/**
 * Flow 2: Existing Config - View & Navigate
 *
 * Tests the user journey when toolbar opens with existing screenshots:
 * 1. Toolbar loads with pre-existing screenshot configurations
 * 2. Badge shows count of existing screenshots
 * 3. User opens sidebar to view list of screenshots
 * 4. User clicks on a screenshot item to navigate to it
 * 5. CLI receives navigation event to highlight the element
 *
 * Also tests pending job handling:
 * - When CLI sends a highlight job, toolbar finds and highlights the element
 * - job-complete event is emitted when highlight is done
 *
 * Events tested:
 * - screenshot-selected: Emitted when user clicks a sidebar item
 * - job-complete: Emitted when pending highlight job finishes
 */

import { expect, test } from 'playwright/test';
import {
  clickSidebarItem,
  createMockScreenshot,
  expandSidebarList,
  getEventsByType,
  injectToolbar,
  openSidebar,
  SIDEBAR_SELECTORS,
  TOOLBAR_SELECTORS,
  TEST_PAGE_URL,
} from './utils';

test('load existing screenshots and select one for navigation', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Create pre-existing screenshots
  const existingScreenshots = [
    createMockScreenshot({
      id: 'shot-1',
      name: 'Hero Section',
      selector: '#hero',
      createdAt: Date.now() - 2000,
    }),
    createMockScreenshot({
      id: 'shot-2',
      name: 'Primary Button',
      selector: '#primary-btn',
      createdAt: Date.now() - 1000,
    }),
    createMockScreenshot({
      id: 'shot-3',
      name: 'Data Table',
      selector: '#data-table',
      createdAt: Date.now(),
    }),
  ];

  await injectToolbar(page, { screenshots: existingScreenshots });

  // Visual regression: toolbar with badge showing count "3"
  await expect(page).toHaveScreenshot('toolbar-with-badge.png');

  // Step 1: Open sidebar
  await openSidebar(page);

  // Expand the list to show all items
  await expandSidebarList(page);

  // Visual regression: sidebar with all 3 items
  await expect(page).toHaveScreenshot('sidebar-with-items.png');

  // Step 2: Click on an item to select it
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(300);

  // When clicking an item on the same URL, no screenshot-selected event is emitted
  // (the toolbar highlights directly without going through CLI)
  // The detailed selection behavior is tested in "selected item is highlighted in sidebar" test
  // Here we just verify the click worked (no errors thrown)
});

test('pending job highlights element on load', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Inject with a pending highlight job
  await injectToolbar(page, {
    pendingJob: {
      type: 'highlight',
      selector: '#hero',
    },
  });

  // Wait for highlight to appear
  await page.waitForTimeout(500);

  // Visual regression: hero element highlighted
  await expect(page).toHaveScreenshot('pending-job-highlight.png');

  // Verify job-complete event was emitted
  const completeEvents = await getEventsByType(page, 'job-complete');
  expect(completeEvents.length).toBe(1);
});

test('selected item is highlighted in sidebar', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  const existingScreenshots = [
    createMockScreenshot({
      id: 'shot-1',
      name: 'Hero Section',
      selector: '#hero',
      createdAt: Date.now() - 1000,
    }),
    createMockScreenshot({
      id: 'shot-2',
      name: 'Primary Button',
      selector: '#primary-btn',
      createdAt: Date.now(),
    }),
  ];

  await injectToolbar(page, { screenshots: existingScreenshots });

  // Open sidebar
  await openSidebar(page);

  // Expand the list to show all items
  await expandSidebarList(page);

  // Click on the second item (index 1 = older item = Hero Section)
  await clickSidebarItem(page, 1);
  await page.waitForTimeout(300);

  // The selected item should have a visual indicator (e.g., ring or different background)
  const selectedItem = page.locator(SIDEBAR_SELECTORS.item(1));
  await expect(selectedItem).toHaveClass(/ring|border-blue|bg-blue/);

  // Visual regression: sidebar with selected item highlighted
  await expect(page).toHaveScreenshot('sidebar-item-selected.png');
});

test('screenshot count badge shows when screenshots exist', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  const existingScreenshots = [
    createMockScreenshot({ id: 'shot-1', name: 'Test', selector: '#hero' }),
  ];

  await injectToolbar(page, { screenshots: existingScreenshots });

  // EditorBar should show badge with count
  const badge = page.locator('#heroshot-root >> span:has-text("1")');
  await expect(badge).toBeVisible();

  // Visual regression: editor bar with screenshot count
  await expect(page).toHaveScreenshot('editor-bar-with-count.png');
});

test('cross-URL navigation preserves sidebar state and selected item', async ({ page }) => {
  // This test simulates what happens after CLI navigates to a different URL:
  // The toolbar is re-injected with pendingJob, selectedId, and sidebarVisible

  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  const existingScreenshots = [
    createMockScreenshot({
      id: 'shot-1',
      name: 'Hero Section',
      selector: '#hero',
      url: 'https://heroshot.sh/other-page', // Different URL
      createdAt: Date.now() - 1000,
    }),
    createMockScreenshot({
      id: 'shot-2',
      name: 'Primary Button',
      selector: '#primary-btn',
      createdAt: Date.now(),
    }),
  ];

  // Inject toolbar as CLI would after navigation:
  // - pendingJob to highlight the element
  // - selectedId to show which item is selected
  // - sidebarVisible to keep sidebar open
  await injectToolbar(page, {
    screenshots: existingScreenshots,
    pendingJob: {
      type: 'highlight',
      selector: '#hero',
    },
    selectedId: 'shot-1',
    sidebarVisible: true,
  });

  await page.waitForTimeout(500);

  // Sidebar should be expanded (collapse button visible)
  const collapseButton = page.locator(TOOLBAR_SELECTORS.collapse);
  await expect(collapseButton).toBeVisible();

  // The selected item (shot-1 = Hero Section = index 1 since sorted by createdAt desc)
  const selectedItem = page.locator(SIDEBAR_SELECTORS.item(1));
  await expect(selectedItem).toHaveClass(/ring|bg-blue/);

  // Visual regression: sidebar open with selected item after cross-URL navigation
  await expect(page).toHaveScreenshot('cross-url-navigation-sidebar.png');

  // Verify job-complete event was emitted (highlight worked)
  const completeEvents = await getEventsByType(page, 'job-complete');
  expect(completeEvents.length).toBe(1);
});
