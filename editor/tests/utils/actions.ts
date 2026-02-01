/**
 * Toolbar Test Actions
 *
 * High-level actions for interacting with the toolbar during e2e tests.
 * Built on top of Playwright's page API.
 */

import type { Page } from 'playwright/test';
import { SIDEBAR_SELECTORS, TOOLBAR_SELECTORS } from './selectors';

/**
 * Click a toolbar button by its name
 */
export async function clickToolbarButton(
  page: Page,
  button: keyof typeof TOOLBAR_SELECTORS
): Promise<void> {
  await page.locator(TOOLBAR_SELECTORS[button]).click();
}

/**
 * Wait for sidebar transition to complete
 */
export async function waitForSidebar(page: Page, _visible: boolean): Promise<void> {
  await page.waitForTimeout(400);
}

/**
 * Expand the screenshot list (open sidebar)
 */
export async function openSidebar(page: Page): Promise<void> {
  // Check if already expanded by looking for collapse button
  const collapseButton = page.locator(TOOLBAR_SELECTORS.collapse);
  const isExpanded = (await collapseButton.count()) > 0;

  if (!isExpanded) {
    await clickToolbarButton(page, 'expand');
    await waitForSidebar(page, true);
  }
}

/**
 * Collapse the screenshot list (close sidebar)
 */
export async function closeSidebar(page: Page): Promise<void> {
  // Check if expanded by looking for collapse button
  const collapseButton = page.locator(TOOLBAR_SELECTORS.collapse);
  const isExpanded = (await collapseButton.count()) > 0;

  if (isExpanded) {
    await clickToolbarButton(page, 'collapse');
    await waitForSidebar(page, false);
  }
}

/**
 * Expand sidebar list (alias for openSidebar for backward compatibility)
 */
export async function expandSidebarList(page: Page): Promise<void> {
  await openSidebar(page);
}

/**
 * Click a sidebar item to select it
 */
export async function clickSidebarItem(page: Page, index: number): Promise<void> {
  await page.locator(SIDEBAR_SELECTORS.itemButton(index)).click();
}

/**
 * Click the delete button on a sidebar item
 */
export async function clickSidebarDeleteButton(page: Page, index: number): Promise<void> {
  await page.locator(SIDEBAR_SELECTORS.item(index)).hover();
  await page.waitForTimeout(100);
  await page.locator(SIDEBAR_SELECTORS.deleteButton(index)).click({ force: true });
}

/**
 * Click on the name to start editing a sidebar item
 */
export async function clickSidebarItemName(page: Page, index: number): Promise<void> {
  await page.locator(SIDEBAR_SELECTORS.itemNameSpan(index)).click();
}

/**
 * Get bounding rect of a page element
 */
export async function getElementRect(
  page: Page,
  selector: string
): Promise<{ top: number; left: number; width: number; height: number }> {
  const rect = await page.evaluate(sel => {
    const element = document.querySelector(sel);
    if (!element) return null;
    const domRect = element.getBoundingClientRect();
    return { top: domRect.top, left: domRect.left, width: domRect.width, height: domRect.height };
  }, selector);

  if (!rect) {
    throw new Error(`Element not found: ${selector}`);
  }

  return rect;
}

/**
 * Click on an element on the page (for element picking)
 * Note: We move the mouse first to trigger the mousemove handler
 * which highlights the element before clicking to select it.
 */
export async function clickPageElement(page: Page, selector: string): Promise<void> {
  const rect = await getElementRect(page, selector);
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  // Move mouse first to trigger mousemove handler (sets currentElement)
  await page.mouse.move(x, y);
  await page.waitForTimeout(100);
  // Then click to select
  await page.mouse.click(x, y);
}

/**
 * Activate picker mode and select an element
 */
export async function activatePickerAndSelectElement(page: Page, selector: string): Promise<void> {
  await clickToolbarButton(page, 'picker');
  await page.waitForTimeout(200);
  await clickPageElement(page, selector);
  await page.waitForTimeout(300);
}

/**
 * Confirm the draft screenshot by pressing Enter on the name input
 * This is the new workflow - when an element is picked, a draft is created
 * and the name input is focused. Pressing Enter confirms the draft.
 */
export async function confirmDraftScreenshot(page: Page): Promise<void> {
  // Wait for the sidebar input to appear (inside shadow DOM)
  // The input is auto-focused after element pick, so we find it and press Enter
  const input = page
    .locator('#heroshot-root >> [data-testid="sidebar-item"] input[type="text"]')
    .first();
  await input.waitFor({ state: 'visible', timeout: 5000 });
  await input.press('Enter');
  await page.waitForTimeout(100);
}

/**
 * Click the confirm button on the highlight overlay for a selected element
 * @deprecated Use confirmDraftScreenshot instead - the new UI auto-creates drafts
 */
export async function clickConfirmButtonForElement(page: Page, selector: string): Promise<void> {
  const rect = await getElementRect(page, selector);
  const confirmX = rect.left + rect.width / 2 + 20;
  const confirmY = rect.top + 90;
  await page.mouse.click(confirmX, confirmY);
}

/**
 * Click the cancel button on the highlight overlay for a selected element
 */
export async function clickCancelButtonForElement(page: Page, selector: string): Promise<void> {
  const rect = await getElementRect(page, selector);
  const cancelX = rect.left + rect.width / 2 + 20;
  const cancelY = rect.top + 125;
  await page.mouse.click(cancelX, cancelY);
}
