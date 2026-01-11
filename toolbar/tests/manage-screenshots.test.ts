/**
 * Flow 3: Manage Existing Screenshots
 *
 * Tests editing and deleting existing screenshot configurations:
 * 1. Toolbar loads with existing screenshots
 * 2. User opens sidebar and clicks on a screenshot name to edit it
 * 3. User types a new name and presses Enter to save
 * 4. User hovers over an item to reveal the delete button
 * 5. User clicks delete button to remove the screenshot
 *
 * Events tested:
 * - screenshot-updated: Emitted when screenshot name is changed
 * - screenshot-removed: Emitted when screenshot is deleted
 */

import { expect, test } from 'playwright/test';
import {
  clickSidebarDeleteButton,
  clickSidebarItemName,
  createMockScreenshot,
  getEventsByType,
  injectToolbar,
  openSidebar,
  TEST_PAGE_URL,
} from './utils';

test('rename and delete screenshots', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  const existingScreenshots = [
    createMockScreenshot({
      id: 'rename-me',
      name: 'Old Name',
      selector: '#hero',
      createdAt: Date.now() - 1000,
    }),
    createMockScreenshot({
      id: 'delete-me',
      name: 'To Be Deleted',
      selector: '#primary-btn',
      createdAt: Date.now(),
    }),
  ];

  await injectToolbar(page, { screenshots: existingScreenshots });

  // Open sidebar
  await openSidebar(page);

  // Visual regression: initial sidebar state
  await expect(page).toHaveScreenshot('sidebar-initial.png');

  // Step 1: Click on the name to start editing (item 1 = "Old Name" - older item)
  await clickSidebarItemName(page, 1);
  await page.waitForTimeout(300);

  // Clear existing text and type new name
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Brand New Name');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Verify screenshot-updated event
  const updatedEvents = await getEventsByType(page, 'screenshot-updated');
  expect(updatedEvents.length).toBeGreaterThanOrEqual(1);

  // Visual regression: after rename
  await expect(page).toHaveScreenshot('after-rename.png');

  // Step 2: Delete the first item (item 0 = "To Be Deleted" - newer item)
  await clickSidebarDeleteButton(page, 0);
  await page.waitForTimeout(300);

  // Verify screenshot-removed event
  const removedEvents = await getEventsByType(page, 'screenshot-removed');
  expect(removedEvents.length).toBe(1);

  // Visual regression: after delete (only one item remains)
  await expect(page).toHaveScreenshot('after-delete.png');
});
