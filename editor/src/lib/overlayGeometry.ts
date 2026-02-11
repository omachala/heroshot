/**
 * Overlay geometry - pure functions for calculating overlay rectangles
 * used by the element picker to darken the area around the selected element.
 */
import type { Padding } from '../types';

/** A positioned rectangle in viewport coordinates */
export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** All overlay rectangles surrounding the selected element */
export type OverlayRects = {
  top: Rect;
  bottom: Rect;
  left: Rect;
  right: Rect;
  highlight: Rect;
};

/**
 * Calculate the overlay rectangles that surround an element,
 * optionally expanded by padding.
 *
 * Returns null if no element is provided.
 * The _scrollX and _scrollY parameters force recalculation when scroll changes.
 */
export function getOverlayRects(
  element: Element | null,
  _scrollX: number,
  _scrollY: number,
  padding?: Padding
): OverlayRects | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const { innerWidth, innerHeight } = globalThis;

  const expandedTop = rect.top - (padding?.top ?? 0);
  const expandedLeft = rect.left - (padding?.left ?? 0);
  const expandedRight = rect.right + (padding?.right ?? 0);
  const expandedBottom = rect.bottom + (padding?.bottom ?? 0);
  const expandedHeight = expandedBottom - expandedTop;

  return {
    top: { top: 0, left: 0, width: innerWidth, height: expandedTop },
    bottom: {
      top: expandedBottom,
      left: 0,
      width: innerWidth,
      height: innerHeight - expandedBottom,
    },
    left: { top: expandedTop, left: 0, width: expandedLeft, height: expandedHeight },
    right: {
      top: expandedTop,
      left: expandedRight,
      width: innerWidth - expandedRight,
      height: expandedHeight,
    },
    highlight: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
  };
}
