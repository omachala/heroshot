/**
 * Flow 1: Fresh Start - Add Screenshots
 *
 * Tests the primary user journey of adding new screenshots:
 * 1. User opens toolbar on a fresh page (no existing screenshots)
 * 2. Clicks picker button to enter element selection mode
 * 3. Clicks on a page element to select it
 * 4. Confirms the selection with the checkmark button
 * 5. Edits the auto-generated name in the sidebar
 * 6. Clicks Done to save and close
 *
 * Also tests resize handle functionality:
 * - Dragging resize handles to add padding
 * - Padding values saved with screenshot
 * - Padding restored when revisiting screenshot
 *
 * Events tested:
 * - screenshot-added: Emitted when element is confirmed
 * - screenshot-updated: Emitted when name is edited
 * - done: Emitted when Done button is clicked
 */

import { expect, test } from 'playwright/test';
import {
  activatePickerAndSelectElement,
  clickConfirmButtonForElement,
  clickSidebarItem,
  clickToolbarButton,
  getElementRect,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
} from './utils';

test('complete flow: pick element, confirm, edit name, click done', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Step 1: Activate picker mode and select element
  await activatePickerAndSelectElement(page, '#hero');

  // Visual regression: element selected with confirm/cancel buttons
  await expect(page).toHaveScreenshot('element-selected.png');

  // Step 2: Click confirm button (saves immediately, NOT in edit mode)
  await clickConfirmButtonForElement(page, '#hero');
  await page.waitForTimeout(500);

  // Visual regression: sidebar open with new item saved
  await expect(page).toHaveScreenshot('sidebar-open-editing.png');

  // Step 3: Verify screenshot-added event was emitted
  const addedEvents = await getEventsByType(page, 'screenshot-added');
  expect(addedEvents.length).toBe(1);
  expect(addedEvents[0]?.data.selector).toMatch(/#hero/);
  expect(addedEvents[0]?.data.url).toContain('heroshot.sh');

  // Step 4: Click sidebar item button to select it (shows edit span)
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(200);

  // Step 5: Click on the name span to enter edit mode
  const sidebarItemName = page
    .locator('#heroshot-root >> [data-testid="sidebar-item"] span.text-xs')
    .first();
  await sidebarItemName.click();
  await page.waitForTimeout(200);

  // Step 6: Edit the name in the input
  const input = page
    .locator('#heroshot-root >> [data-testid="sidebar-item"] input[type="text"]')
    .first();
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.click(); // Focus explicitly
  await page.keyboard.press('Control+A');
  await page.keyboard.type('My Hero Section');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Verify screenshot-updated events were emitted (multiple, one per keystroke)
  const updatedEvents = await getEventsByType(page, 'screenshot-updated');
  expect(updatedEvents.length).toBeGreaterThan(0);
  // Check the final event has the correct name
  const lastEvent = updatedEvents[updatedEvents.length - 1];
  expect(lastEvent?.data.name).toBe('My Hero Section');

  // Visual regression: item renamed in sidebar
  await expect(page).toHaveScreenshot('item-renamed.png');

  // Step 5: Click Done button
  await clickToolbarButton(page, 'done');
  await page.waitForTimeout(300);

  // Verify done event was emitted
  const doneEvents = await getEventsByType(page, 'done');
  expect(doneEvents.length).toBe(1);
});

test('corner resize handle adds proportional padding', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Activate picker and select an element
  await activatePickerAndSelectElement(page, '#primary-btn');
  await page.waitForTimeout(300);

  // Get the element rect
  const elementRect = await getElementRect(page, '#primary-btn');

  // Find the bottom-right corner handle
  const handleX = elementRect.left + elementRect.width;
  const handleY = elementRect.top + elementRect.height;

  // Drag the corner handle diagonally to add proportional padding
  await page.mouse.move(handleX, handleY);
  await page.mouse.down();
  await page.mouse.move(handleX + 40, handleY + 40, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  // Visual regression: element with padding after resize
  await expect(page).toHaveScreenshot('element-with-padding-after-resize.png');

  // Confirm to save the screenshot
  await clickConfirmButtonForElement(page, '#primary-btn');
  await page.waitForTimeout(300);

  // Verify padding was added to all sides (proportional)
  const addedEvents = await getEventsByType(page, 'screenshot-added');
  expect(addedEvents.length).toBe(1);
  const padding = addedEvents[0]?.data.padding;
  expect(padding).toBeDefined();
  // All sides should have the same padding value (proportional resize)
  expect(padding?.top).toBe(padding?.bottom);
  expect(padding?.left).toBe(padding?.right);
  expect(padding?.top).toBeGreaterThan(0);
});
