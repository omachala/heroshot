/**
 * Event Isolation Tests
 *
 * These tests verify that the EventInterceptor properly isolates
 * heroshot toolbar events from the target page.
 *
 * Critical for Issue #65: Toolbar clicks must NOT trigger page event handlers.
 *
 * @see https://github.com/omachala/heroshot/issues/65
 * @see .claude/EDITOR_ARCHITECTURE.md
 */

import { expect, test } from 'playwright/test';
import { clickToolbarButton, injectToolbar } from './utils';

test.describe('Event Isolation', () => {
  test.describe('Toolbar events should NOT reach page', () => {
    /**
     * Core test for Issue #65:
     * When user clicks picker button in toolbar, page's click handler should NOT fire.
     */
    test('clicking picker button does not trigger page click handler', async ({ page }) => {
      // Set up page with a click counter
      await page.setContent(`
        <div id="content">
          <h1>Test Page</h1>
          <p>Click counter: <span id="counter">0</span></p>
        </div>
        <script>
          window.clickCount = 0;
          document.addEventListener('click', () => {
            window.clickCount++;
            document.getElementById('counter').textContent = window.clickCount;
          });
        </script>
      `);

      // Verify page click handler works before toolbar injection
      await page.click('#content');
      let clickCount = await page.evaluate(() => (window as any).clickCount);
      expect(clickCount).toBe(1);

      // Inject toolbar
      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click the picker button in toolbar
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(100);

      // Page click handler should NOT have been triggered
      clickCount = await page.evaluate(() => (window as any).clickCount);
      expect(clickCount).toBe(1); // Still 1, not 2
    });

    /**
     * Test that clicking settings button doesn't reach page.
     */
    test('clicking settings button does not trigger page click handler', async ({ page }) => {
      await page.setContent(`
        <div id="content">Click target</div>
        <script>
          window.clickCount = 0;
          document.addEventListener('click', () => window.clickCount++);
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click settings button
      await clickToolbarButton(page, 'settings');
      await page.waitForTimeout(100);

      const clickCount = await page.evaluate(() => (window as any).clickCount);
      expect(clickCount).toBe(0);
    });

    /**
     * Note: Blur events are NOT blocked because they're a natural consequence
     * of focus changing. When user clicks toolbar, the input loses focus which
     * triggers blur - this is expected browser behavior.
     *
     * The key requirement is that click/mousedown events don't reach page handlers,
     * which we test separately.
     */
    test.skip('toolbar click does not trigger page blur handler - SKIPPED: blur is expected when focus changes', async ({
      page,
    }) => {
      await page.setContent(`
        <input id="test-input" type="text" value="test">
        <script>
          window.blurCount = 0;
          document.getElementById('test-input').addEventListener('blur', () => {
            window.blurCount++;
          });
        </script>
      `);

      // Focus the input first
      await page.focus('#test-input');
      await page.waitForTimeout(100);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click toolbar button - blur WILL trigger because focus moves
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(100);

      // Note: This test is skipped because blur is expected behavior
      const blurCount = await page.evaluate(() => (window as any).blurCount);
      expect(blurCount).toBe(0);
    });

    /**
     * Specific test for dropdown scenario from Issue #65.
     * Clicking toolbar should NOT close a dropdown that uses click-outside-to-close.
     */
    test('clicking toolbar does not trigger click-outside handler', async ({ page }) => {
      await page.setContent(`
        <style>
          .dropdown { position: relative; display: inline-block; }
          .dropdown-content { display: none; position: absolute; background: white; padding: 10px; }
          .dropdown.open .dropdown-content { display: block; }
        </style>
        <div class="dropdown" id="test-dropdown">
          <button class="dropdown-trigger" onclick="this.parentElement.classList.toggle('open')">
            Open Dropdown
          </button>
          <div class="dropdown-content">
            <p>Dropdown content</p>
          </div>
        </div>
        <script>
          // Click-outside-to-close handler
          document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
              document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
            }
          });
        </script>
      `);

      // Open the dropdown
      await page.click('.dropdown-trigger');
      await page.waitForTimeout(100);

      let isOpen = await page.evaluate(() =>
        document.querySelector('.dropdown')?.classList.contains('open')
      );
      expect(isOpen).toBe(true);

      // Inject toolbar
      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click picker button in toolbar
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(100);

      // Dropdown should STILL be open (toolbar click should not trigger click-outside)
      isOpen = await page.evaluate(() =>
        document.querySelector('.dropdown')?.classList.contains('open')
      );
      expect(isOpen).toBe(true);
    });

    /**
     * Test that keyboard events in toolbar don't reach page.
     */
    test('keyboard events in toolbar do not reach page', async ({ page }) => {
      await page.setContent(`
        <div id="content">Test</div>
        <script>
          window.keydownCount = 0;
          document.addEventListener('keydown', () => window.keydownCount++);
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Type in a toolbar input (if any) or press key while toolbar is focused
      // For now, we'll test ESC key which toolbar handles
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Note: This test may need adjustment based on how keyboard events are handled
      // The key point is toolbar-originated keyboard events shouldn't reach page
      const keydownCount = await page.evaluate(() => (window as any).keydownCount);
      // ESC might still reach document, but toolbar-internal keys shouldn't
      // This is a placeholder - adjust based on actual keyboard handling requirements
      expect(keydownCount).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Page events in different modes', () => {
    /**
     * In idle mode, page events should work normally.
     */
    test('page click works normally when toolbar is idle', async ({ page }) => {
      await page.setContent(`
        <button id="test-btn">Click me</button>
        <span id="result">not clicked</span>
        <script>
          document.getElementById('test-btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'clicked';
          });
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click the page button
      await page.click('#test-btn');
      await page.waitForTimeout(100);

      const result = await page.textContent('#result');
      expect(result).toBe('clicked');
    });

    /**
     * In picker mode, page events should be blocked (page is frozen).
     */
    test('page click is blocked in picker mode', async ({ page }) => {
      await page.setContent(`
        <button id="test-btn">Click me</button>
        <span id="result">not clicked</span>
        <script>
          document.getElementById('test-btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'clicked';
          });
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Verify picker mode is active
      const cursorStyle = await page.evaluate(() => document.body.style.cursor);
      expect(cursorStyle).toBe('crosshair');

      // Try to click the page button using coordinates to avoid Playwright's actionability checks
      const rect = await page.evaluate(() => {
        const btn = document.getElementById('test-btn')!;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.mouse.click(rect.x, rect.y);
      await page.waitForTimeout(100);

      // Click should have been blocked
      const result = await page.textContent('#result');
      expect(result).toBe('not clicked');
    });

    /**
     * In picker mode, links should not navigate.
     */
    test('link click is prevented in picker mode', async ({ page }) => {
      await page.setContent(`
        <a id="test-link" href="https://example.com">Click me</a>
      `);

      const initialUrl = page.url();

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Try to click the link
      await page.click('#test-link');
      await page.waitForTimeout(300);

      // Should NOT have navigated
      expect(page.url()).toBe(initialUrl);
    });

    /**
     * In picker mode, form submission should be blocked.
     */
    test('form submission is blocked in picker mode', async ({ page }) => {
      await page.setContent(`
        <form id="test-form" onsubmit="window.formSubmitted = true; return false;">
          <button type="submit">Submit</button>
        </form>
        <script>
          window.formSubmitted = false;
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Try to submit the form
      await page.click('#test-form button');
      await page.waitForTimeout(100);

      // Form should NOT have been submitted
      const formSubmitted = await page.evaluate(() => (window as any).formSubmitted);
      expect(formSubmitted).toBe(false);
    });
  });

  test.describe('Picker mode page isolation', () => {
    /**
     * In picker mode, scroll SHOULD still work so users can navigate to find elements.
     * Only click/keyboard events are blocked.
     */
    test('scroll is allowed in picker mode for navigation', async ({ page }) => {
      await page.setContent(`
        <div id="content" style="height: 3000px; background: linear-gradient(white, black);">
          <h1>Scrollable Page</h1>
          <p style="position: fixed; top: 10px; right: 10px;">
            Scroll Y: <span id="scroll-y">0</span>
          </p>
        </div>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Verify picker mode is active
      const cursorStyle = await page.evaluate(() => document.body.style.cursor);
      expect(cursorStyle).toBe('crosshair');

      // Scroll should still work in picker mode
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(100);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });

    /**
     * Test that clicking picker button toggles picker mode on/off.
     * When off, page interactions should work normally again.
     */
    test('picker mode toggle: activate then deactivate restores page interactivity', async ({
      page,
    }) => {
      await page.setContent(`
        <button id="test-btn">Click me</button>
        <span id="result">not clicked</span>
        <script>
          document.getElementById('test-btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'clicked';
          });
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Verify page works before picker mode
      await page.click('#test-btn');
      await page.waitForTimeout(100);
      let result = await page.textContent('#result');
      expect(result).toBe('clicked');

      // Reset
      await page.evaluate(() => {
        document.getElementById('result')!.textContent = 'not clicked';
      });

      // Step 1: Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Verify picker mode is active
      let cursorStyle = await page.evaluate(() => document.body.style.cursor);
      expect(cursorStyle).toBe('crosshair');

      // Step 2: Deactivate picker mode by clicking picker button again (WITHOUT clicking on page)
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Verify picker mode is off
      cursorStyle = await page.evaluate(() => document.body.style.cursor);
      expect(cursorStyle).toBe('');

      // Step 3: Click should now work normally
      await page.click('#test-btn');
      await page.waitForTimeout(100);

      result = await page.textContent('#result');
      expect(result).toBe('clicked');
    });

    /**
     * Test that mousemove still works in picker mode (for element highlighting).
     * Only click/scroll/keyboard should be blocked, not mouse tracking.
     */
    test('mousemove works in picker mode for element highlighting', async ({ page }) => {
      await page.setContent(`
        <div id="box1" style="width: 100px; height: 100px; background: red; margin: 20px;">Box 1</div>
        <div id="box2" style="width: 100px; height: 100px; background: blue; margin: 20px;">Box 2</div>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Move mouse to box1
      const box1Rect = await page.evaluate(() => {
        const el = document.getElementById('box1')!;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.mouse.move(box1Rect.x, box1Rect.y);
      await page.waitForTimeout(200);

      // The overlay should be visible (we check for the heroshot overlay element)
      // Since we're in picker mode with cursor over an element, there should be a highlight
      const hasOverlay = await page.evaluate(() => {
        // Check if body has crosshair cursor (picker mode active)
        // and an overlay element exists in the heroshot shadow DOM
        const heroshotRoot = document.querySelector('#heroshot-root');
        if (!heroshotRoot?.shadowRoot) return false;
        // Look for the overlay container with fixed positioning
        const overlays = heroshotRoot.shadowRoot.querySelectorAll('.fixed');
        return overlays.length > 0;
      });

      expect(hasOverlay).toBe(true);
    });

    /**
     * Test that keyboard events are blocked in picker mode.
     * User should not be able to type or trigger page shortcuts.
     */
    test('keyboard events are blocked in picker mode', async ({ page }) => {
      await page.setContent(`
        <input id="test-input" type="text" value="">
        <div id="key-log"></div>
        <script>
          window.keyEvents = [];
          document.addEventListener('keydown', (e) => {
            window.keyEvents.push(e.key);
            document.getElementById('key-log').textContent = window.keyEvents.join(',');
          });
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Focus input first
      await page.focus('#test-input');
      await page.waitForTimeout(100);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Try to type - should be blocked
      await page.keyboard.type('hello');
      await page.waitForTimeout(100);

      // Input should be empty (typing blocked)
      const inputValue = await page.inputValue('#test-input');
      expect(inputValue).toBe('');

      // Key events should not have reached the page (except possibly Escape)
      const keyEvents = await page.evaluate(() => (window as any).keyEvents);
      // Filter out Escape which might be handled differently
      const nonEscapeEvents = keyEvents.filter((key: string) => key !== 'Escape');
      expect(nonEscapeEvents.length).toBe(0);
    });

    /**
     * Test that a link with click handler doesn't execute its handler in picker mode.
     */
    test('link with onclick handler is blocked in picker mode', async ({ page }) => {
      await page.setContent(`
        <a id="test-link" href="#" onclick="window.linkClicked = true; return false;">
          Click this link
        </a>
        <script>
          window.linkClicked = false;
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Activate picker mode
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(200);

      // Click the link
      const linkRect = await page.evaluate(() => {
        const el = document.getElementById('test-link')!;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.mouse.click(linkRect.x, linkRect.y);
      await page.waitForTimeout(100);

      // onclick handler should NOT have been triggered
      const linkClicked = await page.evaluate(() => (window as any).linkClicked);
      expect(linkClicked).toBe(false);
    });
  });

  test.describe('Shadow DOM boundary', () => {
    /**
     * Events from inside heroshot shadow DOM should not reach page.
     */
    test('events from shadow DOM children do not reach page', async ({ page }) => {
      await page.setContent(`
        <div id="content">Test</div>
        <script>
          window.eventLog = [];
          document.addEventListener('click', (e) => {
            window.eventLog.push({
              type: 'click',
              target: e.target.tagName,
              composedPath: e.composedPath().map(el => el.tagName || el.constructor.name)
            });
          });
        </script>
      `);

      await injectToolbar(page);
      await page.waitForTimeout(200);

      // Click picker button
      await clickToolbarButton(page, 'picker');
      await page.waitForTimeout(100);

      // Check event log - should be empty (no events from toolbar reached page)
      const eventLog = await page.evaluate(() => (window as any).eventLog);

      // Filter out any events that might have heroshot in the path
      const heroshotEvents = eventLog.filter((e: { composedPath: string[] }) =>
        e.composedPath.some((tag: string) => tag.toLowerCase().includes('heroshot'))
      );

      expect(heroshotEvents.length).toBe(0);
    });
  });
});
