import type { AnnotationTypeDefinition, BBox, ResizeHandle } from './types';
import { buildStyleString } from './types';

let nextId = 0;

export const rectType: AnnotationTypeDefinition = {
  type: 'rect',
  label: 'Rectangle',

  createFromDrag(startX, startY, endX, endY, shiftKey) {
    let w = endX - startX;
    let h = endY - startY;
    if (shiftKey) {
      // Constrain to square
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = size * Math.sign(w || 1);
      h = size * Math.sign(h || 1);
    }
    // Normalize so width/height are positive
    const x = w < 0 ? startX + w : startX;
    const y = h < 0 ? startY + h : startY;
    return {
      id: `rect-${String(++nextId)}`,
      type: 'rect',
      points: [Math.round(x), Math.round(y), Math.round(Math.abs(w)), Math.round(Math.abs(h))],
    };
  },

  getBBox(annotation): BBox {
    const [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    return { minX: x, minY: y, maxX: x + w, maxY: y + h };
  },

  getHandles(annotation): ResizeHandle[] {
    const [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    return [
      { id: 'tl', x, y, cursor: 'nwse-resize' },
      { id: 'tr', x: x + w, y, cursor: 'nesw-resize' },
      { id: 'bl', x, y: y + h, cursor: 'nesw-resize' },
      { id: 'br', x: x + w, y: y + h, cursor: 'nwse-resize' },
    ];
  },

  applyResize(annotation, handle, deltaX, deltaY, shiftKey) {
    let [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    switch (handle.id) {
      case 'tl': {
        x += deltaX;
        y += deltaY;
        w -= deltaX;
        h -= deltaY;
        break;
      }
      case 'tr': {
        y += deltaY;
        w += deltaX;
        h -= deltaY;
        break;
      }
      case 'bl': {
        x += deltaX;
        w -= deltaX;
        h += deltaY;
        break;
      }
      case 'br': {
        w += deltaX;
        h += deltaY;
        break;
      }
    }
    if (shiftKey) {
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = size * Math.sign(w || 1);
      h = size * Math.sign(h || 1);
    }
    // Normalize negative dimensions
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }
    return { ...annotation, points: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)] };
  },

  applyMove(annotation, deltaX, deltaY) {
    const [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    return { ...annotation, points: [Math.round(x + deltaX), Math.round(y + deltaY), w, h] };
  },

  hitTest(annotation, px, py, tolerance) {
    const [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    // Check if point is near any edge of the rectangle
    const nearTop =
      py >= y - tolerance && py <= y + tolerance && px >= x - tolerance && px <= x + w + tolerance;
    const nearBottom =
      py >= y + h - tolerance &&
      py <= y + h + tolerance &&
      px >= x - tolerance &&
      px <= x + w + tolerance;
    const nearLeft =
      px >= x - tolerance && px <= x + tolerance && py >= y - tolerance && py <= y + h + tolerance;
    const nearRight =
      px >= x + w - tolerance &&
      px <= x + w + tolerance &&
      py >= y - tolerance &&
      py <= y + h + tolerance;
    return nearTop || nearBottom || nearLeft || nearRight;
  },

  toSvgString(annotation) {
    const [x = 0, y = 0, w = 0, h = 0] = annotation.points;
    const borderRadius = annotation.style?.['border-radius'] ?? 4;
    const style = buildStyleString(annotation);
    return `<rect x="${String(x)}" y="${String(y)}" width="${String(w)}" height="${String(h)}" rx="${String(borderRadius)}" style="${style}" />`;
  },
};
