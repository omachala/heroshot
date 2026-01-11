import { test, expect } from 'playwright/test';
import {
  injectToolbar,
  getEventsByType,
  getToolbarButtonCoords,
  createMockScreenshot,
  clickPageElement,
  waitForSidebar,
  TEST_PAGE_URL,
} from './utils/inject-toolbar';

/**
 * Flow 1: Fresh Start → Add Screenshots → Done
 *
 * User journey: Opens toolbar fresh, picks elements, names them, clicks Done
 */
test.describe('Flow 1: Fresh Start → Add Screenshots → Done', () => {
  test('complete flow: pick element, confirm, edit name, click done', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Step 1: Activate picker mode
    await page.mouse.click(coords.picker.x, coords.picker.y);
    await page.waitForTimeout(200);

    // Verify cursor changed to crosshair
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('crosshair');

    // Step 2: Click on #hero element to select it
    await clickPageElement(page, '#hero');
    await page.waitForTimeout(300);

    // Visual regression: element selected with confirm/cancel buttons
    await expect(page).toHaveScreenshot('flow1-element-selected.png');

    // Step 3: Click confirm button
    const heroRect = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });

    expect(heroRect).not.toBeNull();

    // The confirm button is at center+20, top+90 based on debug testing
    const confirmX = heroRect!.left + heroRect!.width / 2 + 20;
    const confirmY = heroRect!.top + 90;
    await page.mouse.click(confirmX, confirmY);
    await page.waitForTimeout(500);

    // Visual regression: sidebar open with new item in edit mode
    await expect(page).toHaveScreenshot('flow1-sidebar-open-editing.png');

    // Step 4: Verify screenshot-added event was emitted
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(1);
    expect(addedEvents[0].data.selector).toMatch(/#hero/);
    expect(addedEvents[0].data.url).toContain('heroshot.sh');

    // Step 5: Edit the name
    await page.keyboard.type('My Hero Section');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify screenshot-updated event was emitted
    const updatedEvents = await getEventsByType(page, 'screenshot-updated');
    expect(updatedEvents.length).toBe(1);
    expect(updatedEvents[0].data.name).toBe('My Hero Section');

    // Visual regression: item renamed in sidebar
    await expect(page).toHaveScreenshot('flow1-item-renamed.png');

    // Step 6: Click Done button
    await page.mouse.click(coords.done.x, coords.done.y);
    await page.waitForTimeout(300);

    // Verify done event was emitted
    const doneEvents = await getEventsByType(page, 'done');
    expect(doneEvents.length).toBe(1);
  });
});

/**
 * Flow 2: Existing Config → View & Navigate
 *
 * User journey: Has existing screenshots, browses them, clicks to navigate
 */
test.describe('Flow 2: Existing Config → View & Navigate', () => {
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

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Visual regression: toolbar with badge showing count "3"
    await expect(page).toHaveScreenshot('flow2-toolbar-with-badge.png');

    // Step 1: Open sidebar
    await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
    await waitForSidebar(page, true);

    // Visual regression: sidebar with all 3 items
    await expect(page).toHaveScreenshot('flow2-sidebar-with-items.png');

    // Step 2: Click on an item to trigger navigation
    const sidebarItemX = viewport.width - 144;
    const sidebarItemY = 150;

    await page.mouse.click(sidebarItemX, sidebarItemY);
    await page.waitForTimeout(300);

    // Verify screenshot-selected event was emitted
    const selectedEvents = await getEventsByType(page, 'screenshot-selected');
    expect(selectedEvents.length).toBeGreaterThanOrEqual(1);

    const lastSelected = selectedEvents.at(-1)!;
    expect(lastSelected.id).toBeDefined();
    expect(lastSelected.selector).toBeDefined();
    expect(lastSelected.url).toBeDefined();
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
    await expect(page).toHaveScreenshot('flow2-pending-job-highlight.png');

    // Verify job-complete event was emitted
    const completeEvents = await getEventsByType(page, 'job-complete');
    expect(completeEvents.length).toBe(1);
  });
});

/**
 * Flow 3: Manage Existing Screenshots
 *
 * User journey: Edits and deletes existing screenshots
 */
test.describe('Flow 3: Manage Existing Screenshots', () => {
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

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Open sidebar
    await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
    await waitForSidebar(page, true);

    // Visual regression: initial sidebar state
    await expect(page).toHaveScreenshot('flow3-sidebar-initial.png');

    const sidebarCenterX = viewport.width - 144;
    const firstItemY = 100;

    // Step 1: Click on the name to start editing
    await page.mouse.click(sidebarCenterX - 50, firstItemY);
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
    await expect(page).toHaveScreenshot('flow3-after-rename.png');

    // Step 2: Delete the second item
    const secondItemY = 160;

    // Hover to show delete button
    await page.mouse.move(sidebarCenterX, secondItemY);
    await page.waitForTimeout(300);

    // Visual regression: hover state with delete button visible
    await expect(page).toHaveScreenshot('flow3-hover-delete-button.png');

    // Click delete button
    const deleteButtonX = viewport.width - 28;
    await page.mouse.click(deleteButtonX, secondItemY);
    await page.waitForTimeout(300);

    // Verify screenshot-removed event
    const removedEvents = await getEventsByType(page, 'screenshot-removed');
    expect(removedEvents.length).toBe(1);

    // Visual regression: after delete (only one item remains)
    await expect(page).toHaveScreenshot('flow3-after-delete.png');
  });
});

/**
 * Flow 4: Cancellation & Edge Cases
 *
 * User journey: Tests cancellation flows and edge cases
 */
test.describe('Flow 4: Cancellation & Edge Cases', () => {
  test('cancel element selection with X button', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Activate picker and select element
    await page.mouse.click(coords.picker.x, coords.picker.y);
    await page.waitForTimeout(200);

    await clickPageElement(page, '#hero');
    await page.waitForTimeout(300);

    // Visual regression: element selected before cancel
    await expect(page).toHaveScreenshot('flow4-before-cancel.png');

    // Click cancel button
    const heroRect = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });

    const cancelX = heroRect!.left + heroRect!.width / 2 + 20;
    const cancelY = heroRect!.top + 125;
    await page.mouse.click(cancelX, cancelY);
    await page.waitForTimeout(300);

    // Verify no screenshot-added event was emitted
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(0);

    // Cursor should be back to normal
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');

    // Visual regression: after cancel (no highlight)
    await expect(page).toHaveScreenshot('flow4-after-cancel.png');
  });

  test('ESC key closes sidebar', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page, {
      screenshots: [createMockScreenshot()],
    });

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Open sidebar
    await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
    await waitForSidebar(page, true);

    // Visual regression: sidebar open
    await expect(page).toHaveScreenshot('flow4-sidebar-open.png');

    // Press ESC
    await page.keyboard.press('Escape');
    await waitForSidebar(page, false);

    // Visual regression: sidebar closed
    await expect(page).toHaveScreenshot('flow4-sidebar-closed.png');
  });

  test('ESC key cancels picker mode', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Activate picker
    await page.mouse.click(coords.picker.x, coords.picker.y);
    await page.waitForTimeout(200);

    let cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('crosshair');

    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Cursor should be back to normal
    cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');
  });

  test('ESC key cancels element selection', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);

    const viewport = page.viewportSize()!;
    const coords = getToolbarButtonCoords(viewport);

    // Activate picker and select element
    await page.mouse.click(coords.picker.x, coords.picker.y);
    await page.waitForTimeout(200);

    await clickPageElement(page, '#hero');
    await page.waitForTimeout(300);

    // Press ESC to cancel selection
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify no screenshot-added event
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(0);
  });
});
