/**
 * Smart Selector Generation E2E Tests
 *
 * Tests that the element picker generates stable, Playwright-compatible selectors.
 * Verifies preference order: data-testid > role > text > CSS
 */

import { expect, test } from 'playwright/test';
import {
  activatePickerAndSelectElement,
  clickConfirmButtonForElement,
  getEventsByType,
  injectToolbar,
} from './utils';

test.describe('Smart Selector Generation', () => {
  test('should prefer data-testid over CSS path', async ({ page }) => {
    await page.setContent(`
      <div id="container" style="padding: 100px;">
        <button data-testid="submit-btn" class="btn primary" style="padding: 20px;">Submit</button>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, '[data-testid="submit-btn"]');
    await clickConfirmButtonForElement(page, '[data-testid="submit-btn"]');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('data-testid');
    expect(selector).toBe('[data-testid="submit-btn"]');
  });

  test('should use role with accessible name for buttons', async ({ page }) => {
    await page.setContent(`
      <div id="container" style="padding: 100px;">
        <button class="btn" style="padding: 20px;">Submit Form</button>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'button');
    await clickConfirmButtonForElement(page, 'button');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('role=button');
    expect(selector).toContain('Submit Form');
  });

  test('should use role with aria-label', async ({ page }) => {
    // Use a button with text content (not SVG) so the click targets the button itself
    await page.setContent(`
      <div style="padding: 100px;">
        <button aria-label="Close dialog" style="padding: 30px;">
          Close
        </button>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'button');
    await clickConfirmButtonForElement(page, 'button');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toBe('role=button[name="Close dialog"]');
  });

  test('should use role for links with accessible name', async ({ page }) => {
    await page.setContent(`
      <nav style="padding: 100px;">
        <a href="/about" style="padding: 20px; display: inline-block;">About Us</a>
        <a href="/contact" style="padding: 20px; display: inline-block;">Contact</a>
      </nav>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'a[href="/about"]');
    await clickConfirmButtonForElement(page, 'a[href="/about"]');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('role=link');
    expect(selector).toContain('About Us');
  });

  test('should use text selector for elements without role', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 100px;">
        <span class="label" style="padding: 20px; display: inline-block;">Unique Label</span>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'span.label');
    await clickConfirmButtonForElement(page, 'span.label');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toBe('text="Unique Label"');
  });

  test('should use stable CSS ID when no better option exists', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 100px;">
        <div id="main-content" style="width: 200px; height: 100px; background: #eee;"></div>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, '#main-content');
    await clickConfirmButtonForElement(page, '#main-content');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toBe('#main-content');
  });

  test('should skip GUID-like IDs', async ({ page }) => {
    await page.setContent(`
      <div id="550e8400-e29b-41d4-a716-446655440000" style="padding: 100px;">
        <span style="padding: 20px; display: inline-block;">Content inside GUID div</span>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'span');
    await clickConfirmButtonForElement(page, 'span');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    // Should NOT contain the GUID
    expect(selector).not.toContain('550e8400');
  });

  test('should handle inputs with labels', async ({ page }) => {
    await page.setContent(`
      <form style="padding: 100px;">
        <label for="email">Email Address</label>
        <input id="email" type="email" style="padding: 10px; width: 200px;" />
      </form>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, '#email');
    await clickConfirmButtonForElement(page, '#email');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('role=textbox');
    expect(selector).toContain('Email Address');
  });

  test('should handle inputs with placeholder', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 100px;">
        <input type="text" placeholder="Search..." style="padding: 10px; width: 200px;" />
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'input');
    await clickConfirmButtonForElement(page, 'input');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('role=textbox');
    expect(selector).toContain('Search');
  });

  test('should handle checkboxes with labels', async ({ page }) => {
    await page.setContent(`
      <div style="padding: 100px;">
        <label style="padding: 20px; display: inline-block;">
          <input type="checkbox" /> Remember me
        </label>
      </div>
    `);

    await injectToolbar(page);
    await activatePickerAndSelectElement(page, 'input[type="checkbox"]');
    await clickConfirmButtonForElement(page, 'input[type="checkbox"]');
    await page.waitForTimeout(300);

    const events = await getEventsByType(page, 'screenshot-added');
    expect(events.length).toBe(1);

    const selector = events[0]?.data?.selector;
    expect(selector).toContain('role=checkbox');
    expect(selector).toContain('Remember me');
  });
});
