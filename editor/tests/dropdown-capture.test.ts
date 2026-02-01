/**
 * Issue #65: Taking screenshot of dropdown is not possible
 *
 * Tests the user journey of trying to capture a dropdown element:
 * 1. User opens toolbar
 * 2. Clicks picker button to enter element selection mode
 * 3. Tries to capture an open dropdown
 *
 * The problem: When trying to click on the dropdown with the crosshair picker,
 * the dropdown closes because:
 * - CSS hover-based dropdowns close when mouse moves away
 * - Click-to-open dropdowns close on blur/click-outside
 * - Native <select> elements have special browser behavior
 *
 * @see https://github.com/omachala/heroshot/issues/65
 */

import { expect, test } from 'playwright/test';
import {
  activatePickerAndSelectElement,
  clickToolbarButton,
  confirmDraftScreenshot,
  getElementRect,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
} from './utils';

test.describe('Issue #65: Dropdown capture', () => {
  /**
   * This test reproduces the exact user-reported issue:
   * "I open the dropdown, then try to click on the crosshair, the dropdown closes"
   *
   * The user workflow:
   * 1. Opens a dropdown (it's visible)
   * 2. Clicks the crosshair picker button in the toolbar
   * 3. The dropdown closes because clicking the toolbar button causes blur
   */
  test('dropdown closes when clicking picker button after opening it', async ({ page }) => {
    // Create a page with a click-to-open dropdown
    await page.setContent(`
      <style>
        .dropdown { position: relative; display: inline-block; }
        .dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ccc;
          padding: 10px;
          min-width: 150px;
          z-index: 1000;
        }
        .dropdown.open .dropdown-content { display: block; }
        .dropdown-trigger { padding: 10px 20px; background: #4CAF50; color: white; cursor: pointer; }
      </style>
      <div class="dropdown" id="test-dropdown">
        <div class="dropdown-trigger" onclick="this.parentElement.classList.toggle('open')">Click Me</div>
        <div class="dropdown-content" id="dropdown-content">
          <div>Option 1</div>
          <div>Option 2</div>
          <div>Option 3</div>
        </div>
      </div>
      <script>
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
          }
        });
      </script>
    `);

    await injectToolbar(page);

    // Step 1: Open the dropdown by clicking the trigger
    await page.click('.dropdown-trigger');
    await page.waitForTimeout(200);

    // Verify dropdown is open
    let isOpen = await page.evaluate(() =>
      document.querySelector('.dropdown')?.classList.contains('open')
    );
    expect(isOpen).toBe(true);

    // Step 2: Click the picker button in the toolbar
    // This is where the bug manifests - clicking the toolbar causes
    // the click-outside handler to close the dropdown
    await clickToolbarButton(page, 'picker');
    await page.waitForTimeout(200);

    // Step 3: Check if dropdown is still open
    isOpen = await page.evaluate(() =>
      document.querySelector('.dropdown')?.classList.contains('open')
    );

    // FIXED: With EventInterceptor, toolbar clicks no longer reach page handlers
    // The dropdown should remain open because click-outside handler was NOT triggered
    expect(isOpen).toBe(true);

    // Visual evidence of the fix
    await expect(page).toHaveScreenshot('dropdown-stays-open-after-picker-click.png');
  });

  /**
   * This test demonstrates the fundamental problem:
   * CSS hover-based dropdowns close when the mouse moves to click elsewhere
   */
  test('CSS hover dropdown closes when mouse moves to click picker button', async ({ page }) => {
    // Create a page with a CSS hover dropdown
    await page.setContent(`
      <style>
        .dropdown { position: relative; display: inline-block; padding: 10px; }
        .dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ccc;
          padding: 10px;
          min-width: 150px;
          z-index: 1000;
        }
        .dropdown:hover .dropdown-content { display: block; }
        .dropdown-trigger { padding: 10px 20px; background: #4CAF50; color: white; cursor: pointer; }
      </style>
      <div class="dropdown" id="test-dropdown">
        <div class="dropdown-trigger">Hover Me</div>
        <div class="dropdown-content" id="dropdown-content">
          <div>Option 1</div>
          <div>Option 2</div>
          <div>Option 3</div>
        </div>
      </div>
    `);

    await injectToolbar(page);

    // First verify the dropdown works: hover to open it
    const triggerRect = await getElementRect(page, '.dropdown-trigger');
    await page.mouse.move(triggerRect.left + 10, triggerRect.top + 10);
    await page.waitForTimeout(200);

    // Verify dropdown is visible
    let dropdownVisible = await page.evaluate(() => {
      const content = document.querySelector('#dropdown-content');
      return content ? getComputedStyle(content).display !== 'none' : false;
    });
    expect(dropdownVisible).toBe(true);

    // Now enter picker mode
    await clickToolbarButton(page, 'picker');
    await page.waitForTimeout(200);

    // Move mouse back to dropdown to keep it open
    await page.mouse.move(triggerRect.left + 10, triggerRect.top + 10);
    await page.waitForTimeout(200);

    // Verify dropdown is still visible after entering picker mode
    dropdownVisible = await page.evaluate(() => {
      const content = document.querySelector('#dropdown-content');
      return content ? getComputedStyle(content).display !== 'none' : false;
    });
    expect(dropdownVisible).toBe(true);

    // Now try to click on the dropdown content to select it
    // This is where the bug manifests: clicking causes mouse to be at click position,
    // but the dropdown closes because we're no longer hovering over the trigger
    const dropdownContentRect = await getElementRect(page, '#dropdown-content');
    await page.mouse.click(
      dropdownContentRect.left + dropdownContentRect.width / 2,
      dropdownContentRect.top + dropdownContentRect.height / 2
    );
    await page.waitForTimeout(300);

    // The dropdown should have been captured, let's check if it was selected
    // After selection, we need to confirm it
    // But here's the bug: we can't confirm because the dropdown-content element
    // is no longer visible/detectable at the click coordinates

    // Check what was actually selected (if anything)
    const cursorStyle = await page.evaluate(() => document.body.style.cursor);

    // If picker mode is still active (crosshair), nothing was selected
    // If picker mode is off, something was selected
    // The bug is that either:
    // 1. Nothing gets selected (dropdown closes before click registers)
    // 2. The wrong element gets selected (the trigger, not the content)

    // This test documents the current broken behavior
    // The dropdown content cannot be captured because it closes on click
    await expect(page).toHaveScreenshot('hover-dropdown-after-click-attempt.png');
  });

  /**
   * This test shows that clicking directly on a native <select> works,
   * but you can only capture the closed state, not the expanded options
   */
  test('native select can only be captured in closed state', async ({ page }) => {
    await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
    await injectToolbar(page);

    // Scroll to make select visible
    await page.evaluate(() => {
      document.querySelector('#country')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(200);

    // Use the standard picker flow - this creates a draft in the sidebar
    await activatePickerAndSelectElement(page, '#country');
    await page.waitForTimeout(300);

    // Confirm the draft by pressing Enter on the name input in sidebar
    await confirmDraftScreenshot(page);
    await page.waitForTimeout(500);

    // Verify screenshot was added
    const addedEvents = await getEventsByType(page, 'screenshot-added');
    expect(addedEvents.length).toBe(1);
    // Smart selector uses role=combobox for select elements
    expect(addedEvents[0]?.data.selector).toMatch(/combobox|#country/);

    // The screenshot captures the <select> in closed state
    // There's no way to capture it with the dropdown options expanded
    // because opening the dropdown steals focus from the picker
    await expect(page).toHaveScreenshot('native-select-captured-closed.png');
  });

  test.describe('workaround suggestions', () => {
    test.skip('feature request: keyboard shortcut to capture hovered element', async ({ page }) => {
      // Potential solution: while in picker mode, pressing a key (e.g., Space/Enter)
      // captures whatever element is currently highlighted under the cursor
      // This would allow users to:
      // 1. Enter picker mode
      // 2. Hover over dropdown to open it
      // 3. Move cursor to the dropdown content
      // 4. Press Space/Enter to capture without clicking

      await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
      expect(true).toBe(true); // Placeholder for future implementation
    });

    test.skip('feature request: delayed/timer capture mode', async ({ page }) => {
      // Potential solution: add a timer mode where:
      // 1. User clicks a "capture in 3 seconds" button
      // 2. User has 3 seconds to prepare the page state (open dropdowns, hover states, etc.)
      // 3. After 3 seconds, capture happens automatically for element under cursor

      await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
      expect(true).toBe(true); // Placeholder for future implementation
    });
  });
});
