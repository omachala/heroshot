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
 * Events tested:
 * - screenshot-added: Emitted when element is confirmed
 * - screenshot-updated: Emitted when name is edited
 * - done: Emitted when Done button is clicked
 */

import { expect, test } from 'playwright/test';
import {
  activatePickerAndSelectElement,
  clickConfirmButtonForElement,
  clickToolbarButton,
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

  // Step 2: Click confirm button
  await clickConfirmButtonForElement(page, '#hero');
  await page.waitForTimeout(500);

  // Visual regression: sidebar open with new item in edit mode
  await expect(page).toHaveScreenshot('sidebar-open-editing.png');

  // Step 3: Verify screenshot-added event was emitted
  const addedEvents = await getEventsByType(page, 'screenshot-added');
  expect(addedEvents.length).toBe(1);
  expect(addedEvents[0]?.data.selector).toMatch(/#hero/);
  expect(addedEvents[0]?.data.url).toContain('heroshot.sh');

  // Step 4: Edit the name
  await page.keyboard.type('My Hero Section');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Verify screenshot-updated event was emitted
  const updatedEvents = await getEventsByType(page, 'screenshot-updated');
  expect(updatedEvents.length).toBe(1);
  expect(updatedEvents[0]?.data.name).toBe('My Hero Section');

  // Visual regression: item renamed in sidebar
  await expect(page).toHaveScreenshot('item-renamed.png');

  // Step 5: Click Done button
  await clickToolbarButton(page, 'done');
  await page.waitForTimeout(300);

  // Verify done event was emitted
  const doneEvents = await getEventsByType(page, 'done');
  expect(doneEvents.length).toBe(1);
});
