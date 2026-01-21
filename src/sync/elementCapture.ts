/**
 * Element screenshot capture with padding and background fill.
 */

import type { ElementHandle, Page } from 'playwright';
import { findElement } from './elementFinder';
import { injectPaddingMask, removePaddingMask } from './paddingMask';
import {
  applyElementBackground,
  applyTextOverrides,
  getElementBackgroundColor,
  restoreElementBackground,
} from './pageScripts';
import { takeScreenshot } from './screenshot';
import type { ElementCaptureOptions } from './types';

/** Options for capturing an element with selector */
export type CaptureElementWithSelectorOptions = {
  page: Page;
  selector: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  paddingFill?: 'inherit' | 'solid' | 'transparent';
  elementFill?: 'original' | 'solid' | 'transparent';
  textOverrides?: Record<string, string>;
};

/**
 * Capture element with selector and optional text overrides.
 */
export async function captureElementWithOptions(
  options: CaptureElementWithSelectorOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    page,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
    textOverrides,
  } = options;

  const element = await findElement(page, selector);
  if (!element) {
    return { success: false, error: `Element not found: ${selector}` };
  }

  if (textOverrides && Object.keys(textOverrides).length > 0) {
    await applyTextOverrides(page, selector, textOverrides);
  }

  return captureElementScreenshot({
    page,
    element,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
  });
}

/** Options for capturing with padding */
type CaptureWithPaddingOptions = {
  page: Page;
  element: ElementHandle;
  padding: { top: number; right: number; bottom: number; left: number };
  paddingFill: 'inherit' | 'solid' | 'transparent' | undefined;
  bgColor: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  needsTransparent: boolean;
};

/**
 * Capture element with padding using clip region.
 */
async function captureWithPadding(
  options: CaptureWithPaddingOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    page,
    element,
    padding,
    paddingFill,
    bgColor,
    outputPath,
    format,
    quality,
    needsTransparent,
  } = options;

  const box = await element.boundingBox();
  if (!box) {
    return { success: false, error: 'Could not get element bounding box' };
  }

  if (paddingFill === 'solid') {
    await injectPaddingMask(page, element, padding, bgColor);
  }

  const clip = {
    x: Math.max(0, box.x - padding.left),
    y: Math.max(0, box.y - padding.top),
    width: box.width + padding.left + padding.right,
    height: box.height + padding.top + padding.bottom,
  };

  await takeScreenshot({
    target: page,
    outputPath,
    format,
    quality,
    clip,
    omitBackground: needsTransparent,
  });

  if (paddingFill === 'solid') {
    await removePaddingMask(page);
  }

  return { success: true };
}

/**
 * Capture element screenshot with optional padding and background fill modes.
 */
export async function captureElementScreenshot(
  options: ElementCaptureOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    page,
    element,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
  } = options;
  const hasPadding =
    padding && (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0);

  const needsTransparent =
    format === 'png' && (paddingFill === 'transparent' || elementFill === 'transparent');

  const needsBgColor = paddingFill === 'solid' || elementFill === 'solid';
  let bgColor = '#ffffff';
  if (needsBgColor) {
    bgColor = await getElementBackgroundColor(page, selector);
  }

  if (elementFill === 'solid') {
    await applyElementBackground(page, selector, bgColor);
  } else if (elementFill === 'transparent') {
    await applyElementBackground(page, selector, 'transparent');
  }

  if (hasPadding && padding) {
    const result = await captureWithPadding({
      page,
      element,
      padding,
      paddingFill,
      bgColor,
      outputPath,
      format,
      quality,
      needsTransparent,
    });
    if (!result.success) {
      return result;
    }
  } else {
    await takeScreenshot({
      target: element,
      outputPath,
      format,
      quality,
      omitBackground: needsTransparent,
    });
  }

  if (elementFill === 'solid' || elementFill === 'transparent') {
    await restoreElementBackground(page, selector);
  }

  return { success: true };
}
