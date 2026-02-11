/**
 * Background fill management - handles applying and restoring element background styles
 * based on the selected fill mode (original, solid, transparent).
 */
import type { ElementFill } from '../types';

/** Checkered pattern CSS for transparent mode */
export const CHECKERED_PATTERN = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)';
export const CHECKERED_PATTERN_SIZE = '16px 16px';

/** Checkered pattern CSS for padding fill background */
export const CHECKERED_BACKGROUND = `${CHECKERED_PATTERN} 50% / ${CHECKERED_PATTERN_SIZE}`;

/** Original element styles to restore later */
type OriginalElementStyles = {
  bg: string;
  bgImage: string;
  bgSize: string;
};

/**
 * Creates a background fill manager that tracks and applies element
 * background styles based on the fill mode.
 */
export function createBackgroundFillManager() {
  let originalStyles: OriginalElementStyles | null = null;
  let styledElement: HTMLElement | null = null;

  /**
   * Apply element background based on fill mode.
   * Tracks original styles for restoration.
   */
  function applyElementFill(
    element: HTMLElement | null,
    fillMode: ElementFill,
    color: string | undefined,
    detectedBgColor: string
  ): void {
    // If element changed, restore previous element first
    if (styledElement && styledElement !== element && originalStyles) {
      styledElement.style.backgroundColor = originalStyles.bg;
      styledElement.style.backgroundImage = originalStyles.bgImage;
      styledElement.style.backgroundSize = originalStyles.bgSize;
      originalStyles = null;
      styledElement = null;
    }

    if (!element) return;

    // Store original on first selection
    if (!originalStyles) {
      originalStyles = {
        bg: element.style.backgroundColor,
        bgImage: element.style.backgroundImage,
        bgSize: element.style.backgroundSize,
      };
      styledElement = element;
    }

    switch (fillMode) {
      case 'original': {
        element.style.backgroundColor = originalStyles.bg;
        element.style.backgroundImage = originalStyles.bgImage;
        element.style.backgroundSize = originalStyles.bgSize;
        break;
      }
      case 'solid': {
        element.style.backgroundColor = color ?? detectedBgColor;
        element.style.backgroundImage = 'none';
        element.style.backgroundSize = '';
        break;
      }
      case 'transparent': {
        element.style.backgroundColor = 'transparent';
        element.style.backgroundImage = CHECKERED_PATTERN;
        element.style.backgroundSize = CHECKERED_PATTERN_SIZE;
        break;
      }
      // No default
    }
  }

  /**
   * Restore original styles and reset tracking.
   */
  function reset(): void {
    if (styledElement && originalStyles) {
      styledElement.style.backgroundColor = originalStyles.bg;
      styledElement.style.backgroundImage = originalStyles.bgImage;
      styledElement.style.backgroundSize = originalStyles.bgSize;
    }
    originalStyles = null;
    styledElement = null;
  }

  return {
    applyElementFill,
    reset,
  };
}
