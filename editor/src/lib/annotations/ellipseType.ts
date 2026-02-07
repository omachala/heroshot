import type { AnnotationTypeDefinition, BBox, ResizeHandle } from './types';
import { buildStyleString } from './types';

let nextId = 0;

export const ellipseType: AnnotationTypeDefinition = {
  type: 'ellipse',
  label: 'Ellipse',

  createFromDrag(startX, startY, endX, endY, shiftKey) {
    // Drag defines bounding box, ellipse inscribed
    let w = endX - startX;
    let h = endY - startY;
    if (shiftKey) {
      // Constrain to circle
      const size = Math.max(Math.abs(w), Math.abs(h));
      w = size * Math.sign(w || 1);
      h = size * Math.sign(h || 1);
    }
    // Normalize
    const x = w < 0 ? startX + w : startX;
    const y = h < 0 ? startY + h : startY;
    const absW = Math.abs(w);
    const absH = Math.abs(h);
    const cx = x + absW / 2;
    const cy = y + absH / 2;
    return {
      id: `ellipse-${String(++nextId)}`,
      type: 'ellipse',
      points: [Math.round(cx), Math.round(cy), Math.round(absW / 2), Math.round(absH / 2)],
    };
  },

  getBBox(annotation): BBox {
    const [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry };
  },

  getHandles(annotation): ResizeHandle[] {
    const [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    return [
      { id: 'top', x: cx, y: cy - ry, cursor: 'ns-resize' },
      { id: 'right', x: cx + rx, y: cy, cursor: 'ew-resize' },
      { id: 'bottom', x: cx, y: cy + ry, cursor: 'ns-resize' },
      { id: 'left', x: cx - rx, y: cy, cursor: 'ew-resize' },
    ];
  },

  applyResize(annotation, handle, deltaX, deltaY, shiftKey) {
    let [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    switch (handle.id) {
      case 'top': {
        cy += deltaY / 2;
        ry -= deltaY / 2;
        break;
      }
      case 'bottom': {
        cy += deltaY / 2;
        ry += deltaY / 2;
        break;
      }
      case 'left': {
        cx += deltaX / 2;
        rx -= deltaX / 2;
        break;
      }
      case 'right': {
        cx += deltaX / 2;
        rx += deltaX / 2;
        break;
      }
    }
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    if (shiftKey) {
      const r = Math.max(rx, ry);
      rx = r;
      ry = r;
    }
    return {
      ...annotation,
      points: [Math.round(cx), Math.round(cy), Math.round(rx), Math.round(ry)],
    };
  },

  applyMove(annotation, deltaX, deltaY) {
    const [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    return { ...annotation, points: [Math.round(cx + deltaX), Math.round(cy + deltaY), rx, ry] };
  },

  hitTest(annotation, px, py, tolerance) {
    const [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    if (rx === 0 || ry === 0) return false;
    // Check if point is near the ellipse boundary (between inner and outer tolerance rings)
    const outerRx = rx + tolerance;
    const outerRy = ry + tolerance;
    const innerRx = Math.max(0, rx - tolerance);
    const innerRy = Math.max(0, ry - tolerance);
    const outer =
      ((px - cx) * (px - cx)) / (outerRx * outerRx) + ((py - cy) * (py - cy)) / (outerRy * outerRy);
    const inner =
      innerRx > 0 && innerRy > 0
        ? ((px - cx) * (px - cx)) / (innerRx * innerRx) +
          ((py - cy) * (py - cy)) / (innerRy * innerRy)
        : 2; // If inner radii are 0, always consider "inside"
    return outer <= 1 && inner >= 1;
  },

  toSvgString(annotation) {
    const [cx = 0, cy = 0, rx = 0, ry = 0] = annotation.points;
    const style = buildStyleString(annotation);
    return `<ellipse cx="${String(cx)}" cy="${String(cy)}" rx="${String(rx)}" ry="${String(ry)}" style="${style}" />`;
  },
};
