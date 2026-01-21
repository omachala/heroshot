/**
 * Padding mask injection for element screenshots.
 * Handles temporary DOM elements to fill padding areas with background color.
 */

import type { ElementHandle, Page } from 'playwright';
import {
  injectPaddingMask as injectPaddingMaskBrowser,
  removePaddingMask as removePaddingMaskBrowser,
} from './browserFunctions';
import type { Padding } from './types';

/**
 * Inject temporary mask divs to fill padding areas with background color.
 */
export async function injectPaddingMask(
  page: Page,
  element: ElementHandle,
  padding: Padding,
  bgColor: string
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) return;

  await page.evaluate(injectPaddingMaskBrowser, { box, padding, bgColor });
}

/**
 * Remove injected padding mask.
 */
export async function removePaddingMask(page: Page): Promise<void> {
  await page.evaluate(removePaddingMaskBrowser);
}
