/**
 * Flow 5: Settings Configuration
 *
 * Tests the settings modal for configuring browser options:
 * 1. User clicks settings button (gear icon) in toolbar
 * 2. Settings modal opens with current viewport and color scheme
 * 3. User can modify viewport dimensions (width/height)
 * 4. User can select color scheme (Auto/Light/Dark/Both)
 * 5. User saves changes - settings-updated event is emitted
 * 6. ESC key closes modal without saving
 *
 * Settings options:
 * - Viewport: Width (320-3840) and Height (200-2160) in pixels
 * - Color Scheme:
 *   - Auto: Use browser default
 *   - Light: Force light mode
 *   - Dark: Force dark mode
 *   - Both: Capture two screenshots (-light and -dark variants)
 *
 * Events tested:
 * - settings-updated: Emitted when settings are saved
 */

import { expect, test, type Page } from 'playwright/test';
import {
  clickToolbarButton,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
  TOOLBAR_SELECTORS,
} from './utils';

/** Selectors for settings modal elements */
const SETTINGS_SELECTORS = {
  modal: '#heroshot-root >> div[role="dialog"]',
  widthInput: '#heroshot-root >> input#viewport-width',
  heightInput: '#heroshot-root >> input#viewport-height',
  lightButton: '#heroshot-root >> div[role="dialog"] button:has-text("Light")',
  darkButton: '#heroshot-root >> div[role="dialog"] button:has-text("Dark")',
  saveButton: '#heroshot-root >> button:has-text("Save")',
  cancelButton: '#heroshot-root >> button:has-text("Cancel")',
} as const;

/** Common setup: navigate, inject toolbar, open settings */
async function openSettingsModal(page: Page): Promise<void> {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);
  await clickToolbarButton(page, 'settings');
  await page.waitForTimeout(300);
}

test('open and close settings modal', async ({ page }) => {
  await openSettingsModal(page);

  // Modal should be visible
  await expect(page.locator(SETTINGS_SELECTORS.modal)).toBeVisible();

  // Visual regression: settings modal open
  await expect(page).toHaveScreenshot('settings-modal-open.png');

  // Press ESC to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Modal should be hidden
  await expect(page.locator(SETTINGS_SELECTORS.modal)).not.toBeVisible();
});

test('change viewport dimensions', async ({ page }) => {
  await openSettingsModal(page);

  // Clear and set new width
  const widthInput = page.locator(SETTINGS_SELECTORS.widthInput);
  await widthInput.click();
  await widthInput.fill('1920');

  // Clear and set new height
  const heightInput = page.locator(SETTINGS_SELECTORS.heightInput);
  await heightInput.click();
  await heightInput.fill('1080');

  // Click Save
  await page.locator(SETTINGS_SELECTORS.saveButton).click();
  await page.waitForTimeout(300);

  // Verify settings-updated event with new viewport
  const settingsEvents = await getEventsByType(page, 'settings-updated');
  expect(settingsEvents.length).toBe(1);
  expect(settingsEvents[0]?.data.viewport.width).toBe(1920);
  expect(settingsEvents[0]?.data.viewport.height).toBe(1080);
});

test('color scheme defaults to Both and can be changed to Light or Dark', async ({ page }) => {
  await openSettingsModal(page);

  // Visual regression: both mode selected (default state)
  await expect(page).toHaveScreenshot('settings-both-selected.png');

  // Deselect Dark → only Light remains
  await page.locator(SETTINGS_SELECTORS.darkButton).click();
  await page.waitForTimeout(100);

  // Visual regression: light mode selected
  await expect(page).toHaveScreenshot('settings-light-selected.png');

  // Save and verify
  await page.locator(SETTINGS_SELECTORS.saveButton).click();
  await page.waitForTimeout(300);

  const settingsEvents = await getEventsByType(page, 'settings-updated');
  expect(settingsEvents.length).toBe(1);
  expect(settingsEvents[0]?.data.colorScheme).toBe('light');
});

test('cancel settings does not emit event', async ({ page }) => {
  await openSettingsModal(page);

  // Make changes
  const widthInput = page.locator(SETTINGS_SELECTORS.widthInput);
  await widthInput.click();
  await widthInput.fill('800');

  // Click Cancel
  await page.locator(SETTINGS_SELECTORS.cancelButton).click();
  await page.waitForTimeout(300);

  // Verify no settings-updated event was emitted
  const settingsEvents = await getEventsByType(page, 'settings-updated');
  expect(settingsEvents.length).toBe(0);

  // Modal should be closed
  await expect(page.locator(SETTINGS_SELECTORS.modal)).not.toBeVisible();
});

test('settings button shows active state when modal is open', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Settings button should not have active state initially
  const settingsButton = page.locator(TOOLBAR_SELECTORS.settings);
  await expect(settingsButton).not.toHaveClass(/bg-blue-600/);

  // Open settings
  await clickToolbarButton(page, 'settings');
  await page.waitForTimeout(300);

  // Settings button should have active state (blue background)
  await expect(settingsButton).toHaveClass(/bg-blue-600/);

  // Close settings
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Settings button should not have active state
  await expect(settingsButton).not.toHaveClass(/bg-blue-600/);
});
