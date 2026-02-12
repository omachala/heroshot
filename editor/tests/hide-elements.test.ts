/**
 * Per-Domain Element Hiding
 *
 * Tests the element hiding feature:
 * 1. Activate hide mode via hide button
 * 2. Click an element to hide it (display: none)
 * 3. Hidden elements appear in sidebar "Hidden" section
 * 4. Unhide elements via eye icon button
 * 5. Pre-loaded hidden elements are applied on init
 *
 * Events tested:
 * - hidden-elements-updated: Emitted when elements are hidden/unhidden
 */

import { expect, test, type Page } from 'playwright/test';
import {
  activateHideModeAndHideElement,
  clickToolbarButton,
  getEventsByType,
  injectToolbar,
  openSidebar,
  TEST_PAGE_URL,
  TOOLBAR_SELECTORS,
} from './utils';

/** Selectors for hidden elements UI */
const HIDDEN_SELECTORS = {
  section: '#heroshot-root >> h3:has-text("Hidden")',
  unhideButton: (index: number) => `#heroshot-root >> button[title="Show element"] >> nth=${index}`,
} as const;

/** Check whether a page element is visible (visibility !== hidden) */
async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  return page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element || !(element instanceof HTMLElement)) return false;
    return element.style.visibility !== 'hidden';
  }, selector);
}

test('hide button activates hide mode with red highlight', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Hide button should not have active state initially
  const hideButton = page.locator(TOOLBAR_SELECTORS.hide);
  await expect(hideButton).not.toHaveClass(/bg-red-500/);

  // Click hide button
  await clickToolbarButton(page, 'hide');
  await page.waitForTimeout(200);

  // Hide button should have red active state
  await expect(hideButton).toHaveClass(/bg-red-500/);

  // Picker button should NOT be green (green only in normal picker mode)
  const pickerButton = page.locator(TOOLBAR_SELECTORS.picker);
  await expect(pickerButton).not.toHaveClass(/bg-green-500/);
});

test('clicking element in hide mode hides it and emits event', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Verify the element is visible before hiding
  expect(await isElementVisible(page, '#hero')).toBe(true);

  // Activate hide mode and click on hero section
  await activateHideModeAndHideElement(page, '#hero');

  // Verify hidden-elements-updated event was emitted
  const events = await getEventsByType(page, 'hidden-elements-updated');
  expect(events.length).toBe(1);
  expect(events[0]?.domain).toBe('heroshot.sh');
  expect(events[0]?.selectors.length).toBe(1);
  expect(events[0]?.selectors[0]).toBeTruthy();
});

test('hide mode deactivates after hiding an element', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Activate hide mode and hide an element
  await activateHideModeAndHideElement(page, '#hero');

  // Hide button should no longer be active
  const hideButton = page.locator(TOOLBAR_SELECTORS.hide);
  await expect(hideButton).not.toHaveClass(/bg-red-500/);
});

test('hidden elements appear in sidebar list', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Hide an element
  await activateHideModeAndHideElement(page, '#hero');

  // Open sidebar
  await openSidebar(page);
  await page.waitForTimeout(200);

  // The "Hidden" section heading should be visible
  await expect(page.locator(HIDDEN_SELECTORS.section)).toBeVisible();

  // Visual regression: sidebar with hidden elements section
  await expect(page).toHaveScreenshot('sidebar-hidden-elements.png');
});

test('unhide element restores visibility and emits event', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Hide the hero element
  await activateHideModeAndHideElement(page, '#hero');

  // Verify first event
  const hideEvents = await getEventsByType(page, 'hidden-elements-updated');
  expect(hideEvents.length).toBe(1);

  // Open sidebar to see hidden elements list
  await openSidebar(page);
  await page.waitForTimeout(200);

  // Click the "Hidden" section header to expand it
  await page.locator(HIDDEN_SELECTORS.section).click();
  await page.waitForTimeout(200);

  // Click the unhide (eye) button for the first hidden element
  await page.locator(HIDDEN_SELECTORS.unhideButton(0)).click();
  await page.waitForTimeout(300);

  // Verify updated event emitted with empty selectors
  const allEvents = await getEventsByType(page, 'hidden-elements-updated');
  expect(allEvents.length).toBe(2); // hide + unhide
  const lastEvent = allEvents.at(-1);
  expect(lastEvent?.domain).toBe('heroshot.sh');
  expect(lastEvent?.selectors.length).toBe(0);

  // Hidden section should disappear when no hidden elements remain
  await expect(page.locator(HIDDEN_SELECTORS.section)).not.toBeVisible();
});

test('pre-loaded hidden elements are applied on init', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Inject toolbar with pre-existing hidden elements for the test domain
  await injectToolbar(page, {
    hiddenElements: { 'heroshot.sh': ['#hero', '#primary-btn'] },
  });

  // Wait for $effect to apply
  await page.waitForTimeout(300);

  // Both elements should be hidden (these are CSS selectors, so direct check works)
  expect(await isElementVisible(page, '#hero')).toBe(false);
  expect(await isElementVisible(page, '#primary-btn')).toBe(false);

  // Open sidebar and check hidden section
  await openSidebar(page);
  await page.waitForTimeout(200);

  // Hidden section should be visible
  await expect(page.locator(HIDDEN_SELECTORS.section)).toBeVisible();
});

test('hide multiple elements', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Hide first element
  await activateHideModeAndHideElement(page, '#hero');

  // Hide second element
  await activateHideModeAndHideElement(page, '#primary-btn');

  // Verify two events emitted with cumulative selectors
  const events = await getEventsByType(page, 'hidden-elements-updated');
  expect(events.length).toBe(2);
  expect(events[1]?.selectors.length).toBe(2);
});

test('toggling hide mode on and off', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  const hideButton = page.locator(TOOLBAR_SELECTORS.hide);

  // Activate hide mode
  await clickToolbarButton(page, 'hide');
  await page.waitForTimeout(200);
  await expect(hideButton).toHaveClass(/bg-red-500/);

  // Deactivate hide mode by clicking again
  await clickToolbarButton(page, 'hide');
  await page.waitForTimeout(200);
  await expect(hideButton).not.toHaveClass(/bg-red-500/);
});

test('clicking picker deactivates hide mode', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Activate hide mode
  await clickToolbarButton(page, 'hide');
  await page.waitForTimeout(200);
  await expect(page.locator(TOOLBAR_SELECTORS.hide)).toHaveClass(/bg-red-500/);

  // Click picker button — this deactivates hide mode (and also toggles picker off since it was on)
  await clickToolbarButton(page, 'picker');
  await page.waitForTimeout(200);

  // Hide mode should be deactivated
  await expect(page.locator(TOOLBAR_SELECTORS.hide)).not.toHaveClass(/bg-red-500/);
});
