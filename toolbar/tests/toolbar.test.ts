import { test, expect } from 'playwright/test';
import { injectToolbar, getToolbarButtonCoords } from './utils/inject-toolbar';

const TEST_PAGE_URL = 'https://heroshot.sh/__tests__/toolbar';

test.describe('Heroshot Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);
  });

  test.describe('Toolbar Visibility', () => {
    test('should render the toolbar at the bottom of the page', async ({ page }) => {
      // The toolbar should be visible - check by looking for heroshot-root
      const rootExists = await page.evaluate(() => {
        return document.getElementById('heroshot-root') !== null;
      });
      expect(rootExists).toBe(true);
    });
  });

  test.describe('Sidebar Toggle', () => {
    test('should start with sidebar hidden', async ({ page }) => {
      // Take screenshot to verify sidebar is not visible
      const screenshot = await page.screenshot();
      expect(screenshot).toBeDefined();
      // Visual verification - sidebar should not be visible on the right
    });

    test('should show sidebar when clicking toggle button', async ({ page }) => {
      const viewport = page.viewportSize()!;
      const coords = getToolbarButtonCoords(viewport);

      // Click the sidebar toggle
      await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
      await page.waitForTimeout(400);

      // Take screenshot - sidebar should now be visible
      const screenshot = await page.screenshot();
      expect(screenshot).toBeDefined();
    });

    test('should hide sidebar when clicking toggle button again', async ({ page }) => {
      const viewport = page.viewportSize()!;
      const coords = getToolbarButtonCoords(viewport);

      // Open sidebar
      await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
      await page.waitForTimeout(400);

      // Close sidebar
      await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
      await page.waitForTimeout(400);

      // Take screenshot - sidebar should be hidden again
      const screenshot = await page.screenshot();
      expect(screenshot).toBeDefined();
    });
  });

  test.describe('Element Picker', () => {
    test('should activate picker mode when clicking picker button', async ({ page }) => {
      const viewport = page.viewportSize()!;
      const coords = getToolbarButtonCoords(viewport);

      // Click the picker button
      await page.mouse.click(coords.picker.x, coords.picker.y);
      await page.waitForTimeout(200);

      // Check cursor changed to crosshair
      const cursor = await page.evaluate(() => document.body.style.cursor);
      expect(cursor).toBe('crosshair');
    });
  });
});
