/**
 * Element screenshot capture with padding and background fill.
 */

import type { ElementHandle, Page } from 'playwright';
import {
  calculateAnnotationPadding,
  injectAnnotationOverlay,
  removeAnnotationOverlay,
} from './annotationOverlay';
import { injectBorderOverlay, removeBorderOverlay } from './borderOverlay';
import { injectBorderRadiusMask, removeBorderRadiusMask } from './borderRadiusMask';
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
export type CaptureElementWithSelectorOptions = Omit<ElementCaptureOptions, 'element'> & {
  textOverrides?: Record<string, string>;
};

/**
 * Capture element with selector and optional text overrides.
 */
export async function captureElementWithOptions(
  options: CaptureElementWithSelectorOptions
): Promise<{ success: boolean; error?: string }> {
  const { page, selector, textOverrides, ...rest } = options;

  const element = await findElement(page, selector);
  if (!element) {
    return { success: false, error: `Element not found: ${selector}` };
  }

  if (textOverrides && Object.keys(textOverrides).length > 0) {
    await applyTextOverrides(page, selector, textOverrides);
  }

  return captureElementScreenshot({ page, element, selector, ...rest });
}

type PaddedCaptureOptions = {
  page: Page;
  element: ElementHandle;
  padding: { top: number; right: number; bottom: number; left: number };
  paddingFill: string | undefined;
  bgColor: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  needsTransparent: boolean;
  annotations: ElementCaptureOptions['annotations'];
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
};

/** Capture element with padding using clip region. */
async function captureWithPadding(
  options: PaddedCaptureOptions
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
    annotations,
    borderWidth,
    borderColor,
    borderRadius,
  } = options;
  const box = await element.boundingBox();
  if (!box) return { success: false, error: 'Could not get element bounding box' };

  if (paddingFill === 'solid') await injectPaddingMask(page, element, padding, bgColor);

  const hasAnnotations = annotations && annotations.length > 0;
  if (hasAnnotations) await injectAnnotationOverlay(page, element, annotations, padding);

  const clip = {
    x: Math.max(0, box.x - padding.left),
    y: Math.max(0, box.y - padding.top),
    width: box.width + padding.left + padding.right,
    height: box.height + padding.top + padding.bottom,
  };

  const hasBorder = borderWidth != null && borderWidth > 0 && borderColor != null;
  if (hasBorder) await injectBorderOverlay(page, clip, borderWidth, borderColor, borderRadius ?? 0);

  const hasBorderRadius = borderRadius != null && borderRadius > 0;
  if (hasBorderRadius) await injectBorderRadiusMask(page, clip, borderRadius);

  await takeScreenshot({
    target: page,
    outputPath,
    format,
    quality,
    clip,
    omitBackground: needsTransparent || hasBorderRadius,
  });

  if (hasBorderRadius) await removeBorderRadiusMask(page);
  if (hasBorder) await removeBorderOverlay(page);
  if (hasAnnotations) await removeAnnotationOverlay(page);
  if (paddingFill === 'solid') await removePaddingMask(page);

  return { success: true };
}

/** Expand padding to fit annotations that extend beyond current bounds. */
function expandPaddingForAnnotations(
  padding: { top: number; right: number; bottom: number; left: number },
  annotations: ElementCaptureOptions['annotations']
): { top: number; right: number; bottom: number; left: number } {
  if (!annotations || annotations.length === 0) return padding;
  const ap = calculateAnnotationPadding(annotations);
  return {
    top: Math.max(padding.top, ap.top),
    right: Math.max(padding.right, ap.right),
    bottom: Math.max(padding.bottom, ap.bottom),
    left: Math.max(padding.left, ap.left),
  };
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
    annotations,
    borderWidth,
    borderColor,
    borderRadius,
  } = options;

  const effectivePadding = expandPaddingForAnnotations(
    padding ?? { top: 0, right: 0, bottom: 0, left: 0 },
    annotations
  );
  const hasAnnotations = annotations && annotations.length > 0;
  const hasPadding =
    effectivePadding.top +
      effectivePadding.right +
      effectivePadding.bottom +
      effectivePadding.left >
    0;
  const needsTransparent =
    format === 'png' && (paddingFill === 'transparent' || elementFill === 'transparent');

  let bgColor = '#ffffff';
  if (paddingFill === 'solid' || elementFill === 'solid') {
    bgColor = await getElementBackgroundColor(page, selector);
  }

  if (elementFill === 'solid') {
    await applyElementBackground(page, selector, bgColor);
  } else if (elementFill === 'transparent') {
    await applyElementBackground(page, selector, 'transparent');
  }

  const hasBorderProperties =
    (borderRadius != null && borderRadius > 0) || (borderWidth != null && borderWidth > 0);
  if (hasPadding || hasAnnotations || hasBorderProperties) {
    const result = await captureWithPadding({
      page,
      element,
      padding: effectivePadding,
      paddingFill,
      bgColor,
      outputPath,
      format,
      quality,
      needsTransparent,
      annotations,
      borderWidth,
      borderColor,
      borderRadius,
    });
    if (!result.success) return result;
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
