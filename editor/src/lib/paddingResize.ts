/**
 * Padding resize module - handles drag-to-resize padding on the element overlay.
 * Contains pure geometry functions and a stateful resize manager using callbacks.
 */
import type { Padding } from '../types';

/** Tooltip data for resize operations */
export type ResizeTooltip = {
  size: string;
  padding: string;
  x: number;
  y: number;
};

/** Resize handle cursor map */
export const CURSOR_MAP: Record<string, string> = {
  top: 'ns-resize',
  bottom: 'ns-resize',
  left: 'ew-resize',
  right: 'ew-resize',
  'top-left': 'nwse-resize',
  'bottom-right': 'nwse-resize',
  'top-right': 'nesw-resize',
  'bottom-left': 'nesw-resize',
};

/** Handle sizes (px) */
export const EDGE_LONG = 20;
export const EDGE_SHORT = 10;
export const CORNER_SIZE = 10;
export const CORNER_INSET = 2;

export function getCursor(handle: string): string {
  return CURSOR_MAP[handle] ?? 'move';
}

/**
 * Calculate corner resize padding based on drag deltas.
 * Default: proportional resize (all 4 sides equally).
 * Shift: only resize the 2 paddings of the corner.
 */
export function calculateCornerResize(
  handle: string,
  deltaX: number,
  deltaY: number,
  startPadding: Padding,
  shiftHeld: boolean
): Padding {
  const newPadding = { ...startPadding };
  const [vertical, horizontal] = handle.split('-');

  if (shiftHeld) {
    if (vertical === 'top') newPadding.top = Math.max(0, Math.round(startPadding.top - deltaY));
    if (vertical === 'bottom')
      newPadding.bottom = Math.max(0, Math.round(startPadding.bottom + deltaY));
    if (horizontal === 'left')
      newPadding.left = Math.max(0, Math.round(startPadding.left - deltaX));
    if (horizontal === 'right')
      newPadding.right = Math.max(0, Math.round(startPadding.right + deltaX));
  } else {
    let expansion = vertical === 'top' ? -deltaY : deltaY;
    if (horizontal === 'left') expansion = Math.max(expansion, -deltaX);
    if (horizontal === 'right') expansion = Math.max(expansion, deltaX);
    expansion = Math.round(expansion);

    newPadding.top = Math.max(0, startPadding.top + expansion);
    newPadding.right = Math.max(0, startPadding.right + expansion);
    newPadding.bottom = Math.max(0, startPadding.bottom + expansion);
    newPadding.left = Math.max(0, startPadding.left + expansion);
  }
  return newPadding;
}

/**
 * Calculate edge resize padding based on drag deltas.
 * Default: resize both sides of the axis.
 * Shift: resize only the dragged side.
 */
export function calculateEdgeResize(
  handle: string,
  deltaX: number,
  deltaY: number,
  startPadding: Padding,
  shiftHeld: boolean
): Padding {
  const newPadding = { ...startPadding };
  const edgeDeltas: Record<string, { key: keyof Padding; opposite: keyof Padding; delta: number }> =
    {
      top: { key: 'top', opposite: 'bottom', delta: Math.round(-deltaY) },
      bottom: { key: 'bottom', opposite: 'top', delta: Math.round(deltaY) },
      left: { key: 'left', opposite: 'right', delta: Math.round(-deltaX) },
      right: { key: 'right', opposite: 'left', delta: Math.round(deltaX) },
    };

  const edge = edgeDeltas[handle];
  if (edge) {
    newPadding[edge.key] = Math.max(0, startPadding[edge.key] + edge.delta);
    if (!shiftHeld) {
      newPadding[edge.opposite] = Math.max(0, startPadding[edge.opposite] + edge.delta);
    }
  }
  return newPadding;
}

/**
 * Clamp padding so expanded area does not exceed document bounds.
 */
export function clampPaddingToBounds(padding: Padding, elementRect: DOMRect): Padding {
  const documentWidth = document.documentElement.scrollWidth;
  const documentHeight = document.documentElement.scrollHeight;
  const elementLeft = elementRect.left + globalThis.scrollX;
  const elementTop = elementRect.top + globalThis.scrollY;
  const elementRight = elementRect.right + globalThis.scrollX;
  const elementBottom = elementRect.bottom + globalThis.scrollY;

  return {
    top: Math.round(Math.min(padding.top, elementTop)),
    left: Math.round(Math.min(padding.left, elementLeft)),
    bottom: Math.round(Math.min(padding.bottom, documentHeight - elementBottom)),
    right: Math.round(Math.min(padding.right, documentWidth - elementRight)),
  };
}

/**
 * Generate human-readable padding string for tooltip display.
 */
export function getPaddingTooltipString(padding: Padding, handle: string): string {
  if (handle.includes('-')) {
    const allSame =
      padding.top === padding.right &&
      padding.right === padding.bottom &&
      padding.bottom === padding.left;
    return allSame
      ? `${padding.top}`
      : `${padding.top} ${padding.right} ${padding.bottom} ${padding.left}`;
  }
  if (handle === 'top' || handle === 'right' || handle === 'bottom' || handle === 'left') {
    return `${padding[handle]}`;
  }
  return '';
}

type ResizeCallbacks = {
  onPaddingChange: (padding: Padding) => void;
  onTooltipChange: (tooltip: ResizeTooltip | null) => void;
  getSelectedElement: () => Element | null;
};

/**
 * Creates a padding resize manager that handles mouse drag operations
 * on resize handles (edges and corners). State is communicated via callbacks.
 */
export function createPaddingResizeManager(callbacks: ResizeCallbacks) {
  let isDragging = false;
  let dragHandle: string | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartPadding: Padding = { top: 0, right: 0, bottom: 0, left: 0 };

  function handleResizeMouseMove(event: MouseEvent): void {
    const selectedElement = callbacks.getSelectedElement();
    if (!isDragging || !dragHandle || !selectedElement) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const shiftHeld = event.shiftKey;

    const isCorner = dragHandle.includes('-');
    let newPadding = isCorner
      ? calculateCornerResize(dragHandle, deltaX, deltaY, dragStartPadding, shiftHeld)
      : calculateEdgeResize(dragHandle, deltaX, deltaY, dragStartPadding, shiftHeld);

    const rect = selectedElement.getBoundingClientRect();
    newPadding = clampPaddingToBounds(newPadding, rect);

    const totalWidth = Math.round(rect.width + newPadding.left + newPadding.right);
    const totalHeight = Math.round(rect.height + newPadding.top + newPadding.bottom);

    callbacks.onTooltipChange({
      size: `${totalWidth} x ${totalHeight}`,
      padding: getPaddingTooltipString(newPadding, dragHandle),
      x: event.clientX,
      y: event.clientY,
    });

    callbacks.onPaddingChange(newPadding);
  }

  function handleResizeMouseUp(): void {
    isDragging = false;
    dragHandle = null;
    callbacks.onTooltipChange(null);
    globalThis.removeEventListener('mousemove', handleResizeMouseMove, { capture: true });
    globalThis.removeEventListener('mouseup', handleResizeMouseUp, { capture: true });
  }

  function startResize(event: MouseEvent, handle: string, currentPadding: Padding): void {
    event.preventDefault();
    event.stopPropagation();

    isDragging = true;
    dragHandle = handle;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartPadding = { ...currentPadding };

    globalThis.addEventListener('mousemove', handleResizeMouseMove, { capture: true });
    globalThis.addEventListener('mouseup', handleResizeMouseUp, { capture: true });
  }

  return {
    startResize,
  };
}
