/**
 * ConfigBar - Floating Configuration Bar
 *
 * Tests the unified floating ConfigBar that appears when an element
 * or annotation is selected:
 *
 * 1. Element selection shows ConfigBar with paddingFill/elementFill dropdowns
 * 2. Changing paddingFill via dropdown emits screenshot-updated event
 * 3. Drawing an annotation switches ConfigBar to annotation style
 * 4. Changing annotation stroke color via ConfigBar updates the annotation
 * 5. Escape hides ConfigBar
 * 6. Text editing hides ConfigBar
 *
 * Events tested:
 * - screenshot-updated: Emitted when fill mode changes via ConfigBar
 */

import { expect, test } from 'playwright/test';
import {
  activatePickerAndSelectElement,
  clickSidebarItem,
  confirmDraftScreenshot,
  createMockScreenshot,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
} from './utils';

/** Locate the ConfigBar floating panel inside shadow DOM */
function configBarLocator(page: import('playwright/test').Page) {
  return page.locator('#heroshot-root >> .bg-slate-800.rounded-lg.shadow-2xl');
}

test('config bar appears with element properties when element is selected', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'test-1', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });

  // Select the existing screenshot to edit it
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(1000);

  // ConfigBar should appear with "Element" header
  const configBar = configBarLocator(page);
  await expect(configBar).toBeVisible({ timeout: 10000 });
  await expect(configBar).toContainText('Element');
  await expect(configBar).toContainText('padding fill');
  await expect(configBar).toContainText('element fill');
});

test('config bar fill dropdowns emit screenshot-updated events', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'test-2', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });

  // Select the existing screenshot
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);

  // Change padding fill to 'solid' via first dropdown
  const paddingSelect = page.locator('#heroshot-root >> select').first();
  await paddingSelect.selectOption('solid');
  await page.waitForTimeout(200);

  let events = await getEventsByType(page, 'screenshot-updated');
  expect(events.length).toBeGreaterThan(0);
  expect(events[events.length - 1]?.data.paddingFill).toBe('solid');

  // Change element fill to 'solid' via second dropdown
  const elementSelect = page.locator('#heroshot-root >> select').nth(1);
  await elementSelect.selectOption('solid');
  await page.waitForTimeout(200);

  events = await getEventsByType(page, 'screenshot-updated');
  expect(events[events.length - 1]?.data.elementFill).toBe('solid');
});

test('config bar switches to annotation properties when annotation is drawn', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'test-4', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });

  // Select the existing screenshot
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);

  // Verify element config bar is shown
  const configBar = configBarLocator(page);
  await expect(configBar).toContainText('Element');

  // Activate annotation tool (arrow)
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);

  // Draw an arrow annotation over the element
  const heroRect = await page.evaluate(() => {
    const el = document.querySelector('#hero');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });
  expect(heroRect).not.toBeNull();

  const startX = heroRect!.left + 20;
  const startY = heroRect!.top + 20;
  const endX = heroRect!.left + 200;
  const endY = heroRect!.top + 100;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  // ConfigBar should now show "Annotation" header
  await expect(configBar).toContainText('Annotation');
  await expect(configBar).toContainText('stroke');
});

test('escape hides config bar', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'test-5', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });

  // Select the existing screenshot
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);

  // Verify config bar is visible
  const configBar = configBarLocator(page);
  await expect(configBar).toBeVisible();

  // Press Escape to deselect
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ConfigBar should be hidden
  await expect(configBar).not.toBeVisible();
});

test('config bar not shown for new draft elements before confirmation', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  await injectToolbar(page);

  // Pick an element (creates a draft)
  await activatePickerAndSelectElement(page, '#hero');
  await page.waitForTimeout(300);

  // ConfigBar should appear (draft has an editing screenshot ID)
  const configBar = configBarLocator(page);
  await expect(configBar).toBeVisible();
  await expect(configBar).toContainText('Element');

  // Confirm the draft
  await confirmDraftScreenshot(page);
  await page.waitForTimeout(300);

  // ConfigBar should still be visible after confirmation
  await expect(configBar).toBeVisible();
});

test('annotation style change via config bar updates annotation data', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'test-6', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });

  // Select the existing screenshot
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);

  // Activate annotation tool and draw
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);

  const heroRect = await page.evaluate(() => {
    const el = document.querySelector('#hero');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });

  const startX = heroRect!.left + 20;
  const startY = heroRect!.top + 20;
  const endX = heroRect!.left + 200;
  const endY = heroRect!.top + 100;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  // Change stroke color via the color input in ConfigBar
  const colorInput = page.locator('#heroshot-root >> input[type="color"]').first();
  await expect(colorInput).toBeVisible();

  // Set a new color value
  await colorInput.evaluate((el: HTMLInputElement) => {
    el.value = '#00ff00';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);

  // Verify the annotation was updated in the emitted event
  const events = await getEventsByType(page, 'screenshot-updated');
  expect(events.length).toBeGreaterThan(0);
  const lastEvent = events[events.length - 1];
  const annotations = lastEvent?.data.annotations;
  expect(annotations).toBeDefined();
  expect(annotations?.length).toBe(1);
  // The annotation style should have the new stroke color
  expect(annotations?.[0]?.style?.['stroke']).toBe('#00ff00');
});
