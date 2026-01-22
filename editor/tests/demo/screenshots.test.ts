/**
 * Demo Screenshots
 *
 * Captures screenshots of heroshot editor in action for documentation.
 * Uses heroshot.sh landing page as example of picking elements (meta!).
 *
 * This test is NOT part of the regular test suite - it runs separately via
 * the "Update Demo Screenshots" workflow which commits updated snapshots.
 *
 * Run locally: pnpm test:editor:demo
 * Update snapshots: pnpm test:editor:demo --update-snapshots
 */

import { expect, test } from 'playwright/test';
import { createMockScreenshot, injectToolbar } from '../utils';

const HEROSHOT_URL = 'https://heroshot.sh';

// Selector for the second feature card ("Point and Click") on the landing page
// Each VPFeature is wrapped in a .item div inside .items container
const FEATURE_SELECTOR = '.items > .item:nth-of-type(2) .VPFeature';

test('demo: pick element on heroshot.sh landing page with padding', async ({ page }) => {
  test.setTimeout(60000);
  // Navigate to heroshot.sh and wait for load
  await page.goto(HEROSHOT_URL, { waitUntil: 'networkidle' });

  // Scroll to top to ensure consistent positioning
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Create a mock screenshot that targets the feature element
  const demoScreenshot = createMockScreenshot({
    id: 'demo-shot',
    name: 'Heroshot Feature Card',
    url: HEROSHOT_URL,
    selector: FEATURE_SELECTOR,
  });

  // Inject toolbar with pending highlight job - this will automatically select and highlight the element
  await injectToolbar(page, {
    screenshots: [demoScreenshot],
    pendingJob: {
      type: 'highlight',
      selector: FEATURE_SELECTOR,
    },
    selectedId: 'demo-shot',
    sidebarVisible: true,
  });

  await page.waitForTimeout(500);

  // Screenshot 1: Element selected (before resize) - full viewport
  await expect(page).toHaveScreenshot('demo-element-selected.png', { fullPage: false });

  // Step 2: Get element rect and drag corner to add padding (~80px for more visible effect)
  const featureElement = page.locator(FEATURE_SELECTOR).first();
  await featureElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const elementRect = await featureElement.boundingBox();
  if (!elementRect) throw new Error('Could not get element bounding box');

  // Bottom-right corner handle position
  const handleX = elementRect.x + elementRect.width;
  const handleY = elementRect.y + elementRect.height;

  // Drag corner handle to add more padding (80px)
  await page.mouse.move(handleX, handleY);
  await page.mouse.down();
  await page.mouse.move(handleX + 80, handleY + 80, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Screenshot 2: Element with padding after resize
  await expect(page).toHaveScreenshot('demo-element-with-padding.png', { fullPage: false });

  // Step 3: Click in the padding area to activate the mask (white background)
  const paddingClickX = elementRect.x + elementRect.width + 40;
  const paddingClickY = elementRect.y + elementRect.height / 2;
  await page.mouse.click(paddingClickX, paddingClickY);
  await page.waitForTimeout(300);

  // Move mouse outside the padding area to hide the tooltip
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  // Screenshot 3: Element with white mask visible
  await expect(page).toHaveScreenshot('demo-element-with-mask.png', { fullPage: false });
});
