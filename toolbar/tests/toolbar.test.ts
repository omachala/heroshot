import { test, expect } from 'playwright/test';
import {
  injectToolbar,
  getEvents,
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
  test('complete flow: pick element, confirm, edit name, add another, click done', async ({ page }) => {
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

    // Take screenshot - should show highlight with confirm/cancel buttons
    await page.screenshot({ path: 'test-results/flow1-element-selected.png' });

    // Step 3: Click confirm button (above the highlighted element)
    // The confirm/cancel buttons are positioned -top-10 (40px above) the highlight
    // They're centered horizontally with gap-2 between them
    // Confirm (tick) is left, Cancel (X) is right
    const heroRect = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });

    expect(heroRect).not.toBeNull();

    // The confirm button is at center+20, top+90 based on debug testing
    // Note: clicking on #hero actually selects a child element (the <p>)
    const confirmX = heroRect!.left + heroRect!.width / 2 + 20;
    const confirmY = heroRect!.top + 90;
    await page.mouse.click(confirmX, confirmY);
    await page.waitForTimeout(500);

    // Take screenshot - sidebar should now be open with new item in edit mode
    await page.screenshot({ path: 'test-results/flow1-sidebar-open-editing.png' });

    // Step 4: Verify screenshot-added event was emitted
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(1);
    // The selector might be #hero or a child element depending on where exactly the click landed
    expect(addedEvents[0].data.selector).toMatch(/#hero/);
    expect(addedEvents[0].data.url).toContain('heroshot.sh');

    // Step 5: Edit the name (press Enter to save - input should be focused and selected)
    await page.keyboard.type('My Hero Section');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Verify screenshot-updated event was emitted
    const updatedEvents = await getEventsByType(page, 'screenshot-updated');
    expect(updatedEvents.length).toBe(1);
    expect(updatedEvents[0].data.name).toBe('My Hero Section');

    // Take screenshot showing item in sidebar
    await page.screenshot({ path: 'test-results/flow1-one-item.png' });

    // Step 6: Click Done button
    await page.mouse.click(coords.done.x, coords.done.y);
    await page.waitForTimeout(300);

    // Verify done event was emitted
    const doneEvents = await getEventsByType(page, 'done');
    expect(doneEvents.length).toBe(1);

    // Final screenshot
    await page.screenshot({ path: 'test-results/flow1-complete.png' });
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

    // Take screenshot - should show badge with count "3" on sidebar button
    await page.screenshot({ path: 'test-results/flow2-initial-with-badge.png' });

    // Step 1: Open sidebar
    await page.mouse.click(coords.sidebar.x, coords.sidebar.y);
    await waitForSidebar(page, true);

    // Take screenshot - sidebar should show all 3 items (newest first)
    await page.screenshot({ path: 'test-results/flow2-sidebar-with-items.png' });

    // Step 2: Click on an item to trigger navigation
    // Items are in the sidebar on the right side
    // The sidebar is 288px wide (w-72), positioned at right-0
    // Each item is clickable and should emit screenshot-selected event
    const sidebarItemX = viewport.width - 144; // Center of sidebar
    const sidebarItemY = 150; // Approximate position of first item

    await page.mouse.click(sidebarItemX, sidebarItemY);
    await page.waitForTimeout(300);

    // Verify screenshot-selected event was emitted
    const selectedEvents = await getEventsByType(page, 'screenshot-selected');
    expect(selectedEvents.length).toBeGreaterThanOrEqual(1);

    // The event should contain the screenshot data
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

    // Take screenshot - hero should be highlighted
    await page.screenshot({ path: 'test-results/flow2-pending-job-highlight.png' });

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

    await page.screenshot({ path: 'test-results/flow3-initial.png' });

    // Sidebar layout:
    // - Header (SCREENSHOTS + close button): ~56px tall (p-4 = 16px padding, text ~24px)
    // - Items area starts below header
    // - Each item: p-2 (8px) padding, name + filename ~48px total height
    // - Sidebar is w-72 (288px) positioned at right-0

    // Step 1: Click on the name text to start editing
    // First item (newest = "To Be Deleted") is at approximately y=100 (after header)
    const sidebarCenterX = viewport.width - 144; // Center of 288px sidebar
    const firstItemY = 100;

    // Click on the name to start editing (click slightly left of center)
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

    await page.screenshot({ path: 'test-results/flow3-after-rename.png' });

    // Step 2: Delete the second item (hover to show delete button, then click)
    // Second item is approximately 60px below the first
    const secondItemY = 160;

    // Move mouse to item to show delete button (hover state)
    await page.mouse.move(sidebarCenterX, secondItemY);
    await page.waitForTimeout(300);

    // Take screenshot to see the hover state
    await page.screenshot({ path: 'test-results/flow3-hover-delete.png' });

    // Delete button is w-6 (24px) at the right edge of the item
    // Sidebar padding is p-3 (12px), item has padding too
    // Delete button should be at approximately viewport.width - 12 - 12 = viewport.width - 24
    const deleteButtonX = viewport.width - 28;
    await page.mouse.click(deleteButtonX, secondItemY);
    await page.waitForTimeout(300);

    // Verify screenshot-removed event
    const removedEvents = await getEventsByType(page, 'screenshot-removed');
    expect(removedEvents.length).toBe(1);

    await page.screenshot({ path: 'test-results/flow3-after-delete.png' });
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

    await page.screenshot({ path: 'test-results/flow4-before-cancel.png' });

    // Click cancel button (right button, +20px from center)
    const heroRect = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });

    // Cancel button is 20px right of center, positioned inside the hero
    const cancelX = heroRect!.left + heroRect!.width / 2 + 20;
    const cancelY = heroRect!.top + 125; // Same as confirm button Y
    await page.mouse.click(cancelX, cancelY);
    await page.waitForTimeout(300);

    // Verify no screenshot-added event was emitted
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(0);

    // Cursor should be back to normal
    const cursor = await page.evaluate(() => document.body.style.cursor);
    expect(cursor).toBe('');

    await page.screenshot({ path: 'test-results/flow4-after-cancel.png' });
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

    await page.screenshot({ path: 'test-results/flow4-sidebar-open.png' });

    // Press ESC
    await page.keyboard.press('Escape');
    await waitForSidebar(page, false);

    await page.screenshot({ path: 'test-results/flow4-sidebar-closed-esc.png' });
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
