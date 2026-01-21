/**
 * Demo Screenshots
 *
 * NOT a real test - captures screenshots of heroshot in action for documentation.
 * Uses BBC homepage as a realistic example of picking elements.
 *
 * Run with: pnpm test:editor:e2e
 * Update snapshots with: pnpm test:editor:e2e --update-snapshots
 */

import { expect, test } from 'playwright/test';
import { createMockScreenshot, injectToolbar } from './utils';

const BBC_URL = 'https://www.bbc.co.uk';

// Selector for the second promo card (smaller article card in the second LI)
const PROMO_SELECTOR = 'li:nth-child(2) [data-testid="promo"]';

test('demo: pick element on BBC homepage with padding', async ({ page }) => {
  test.setTimeout(60000); // BBC takes a while to load
  // Navigate to BBC and wait for full load
  await page.goto(BBC_URL, { waitUntil: 'networkidle' });

  // Dismiss cookie banner - wait for it and click
  try {
    const rejectCookiesButton = page.getByRole('button', { name: 'Reject additional cookies' });
    await rejectCookiesButton.waitFor({ state: 'visible', timeout: 5000 });
    await rejectCookiesButton.click();
    await page.waitForTimeout(1000); // Wait for banner to fully disappear
  } catch {
    // Cookie banner may not appear if already dismissed
  }

  // Scroll to top to ensure consistent positioning
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Create a mock screenshot that targets the promo element
  const demoScreenshot = createMockScreenshot({
    id: 'demo-shot',
    name: 'BBC Promo Card',
    url: BBC_URL,
    selector: PROMO_SELECTOR,
  });

  // Inject toolbar with pending highlight job - this will automatically select and highlight the element
  await injectToolbar(page, {
    screenshots: [demoScreenshot],
    pendingJob: {
      type: 'highlight',
      selector: PROMO_SELECTOR,
    },
    selectedId: 'demo-shot',
    sidebarVisible: true,
  });

  await page.waitForTimeout(500);

  // Screenshot 1: Element selected (before resize) - full viewport
  await expect(page).toHaveScreenshot('demo-element-selected.png', { fullPage: false });

  // Step 2: Get element rect and drag corner to add padding (~80px for more visible effect)
  const promoElement = page.locator(PROMO_SELECTOR).first();
  const elementRect = await promoElement.boundingBox();
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
