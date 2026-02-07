import type { AnnotationTypeDefinition, BBox, ResizeHandle } from './types';

/** Distance from a point to a line segment */
function pointToSegmentDistance(
  px: number,
  py: number,
  segment: { x1: number; y1: number; x2: number; y2: number }
): number {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - segment.x1, py - segment.y1);

  let t = ((px - segment.x1) * dx + (py - segment.y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (segment.x1 + t * dx), py - (segment.y1 + t * dy));
}

let nextId = 0;

export const arrowType: AnnotationTypeDefinition = {
  type: 'arrow',
  label: 'Arrow',

  createFromDrag(startX, startY, endX, endY, shiftKey) {
    let ex = endX;
    let ey = endY;
    if (shiftKey) {
      // Constrain to 45-degree increments
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.hypot(dx, dy);
      ex = startX + length * Math.cos(snapped);
      ey = startY + length * Math.sin(snapped);
    }
    return {
      id: `arrow-${String(++nextId)}`,
      type: 'arrow',
      points: [Math.round(startX), Math.round(startY), Math.round(ex), Math.round(ey)],
    };
  },

  getBBox(annotation): BBox {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
  },

  getHandles(annotation): ResizeHandle[] {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;
    return [
      { id: 'start', x: x1, y: y1, cursor: 'move' },
      { id: 'end', x: x2, y: y2, cursor: 'move' },
    ];
  },

  applyResize(annotation, handle, deltaX, deltaY) {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;
    if (handle.id === 'start') {
      return { ...annotation, points: [Math.round(x1 + deltaX), Math.round(y1 + deltaY), x2, y2] };
    }
    return { ...annotation, points: [x1, y1, Math.round(x2 + deltaX), Math.round(y2 + deltaY)] };
  },

  applyMove(annotation, deltaX, deltaY) {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;
    return {
      ...annotation,
      points: [
        Math.round(x1 + deltaX),
        Math.round(y1 + deltaY),
        Math.round(x2 + deltaX),
        Math.round(y2 + deltaY),
      ],
    };
  },

  hitTest(annotation, x, y, tolerance) {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;
    return pointToSegmentDistance(x, y, { x1, y1, x2, y2 }) <= tolerance;
  },

  toSvgString(annotation) {
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = annotation.points;

    // Scale arrowhead with stroke-width
    const strokeWidth = Number(annotation.style?.['stroke-width'] ?? 3);
    const headLength = 8 + strokeWidth * 2;
    const headAngle = Math.PI / 7;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Wing points
    const a1x = x2 - headLength * Math.cos(angle - headAngle);
    const a1y = y2 - headLength * Math.sin(angle - headAngle);
    const a2x = x2 - headLength * Math.cos(angle + headAngle);
    const a2y = y2 - headLength * Math.sin(angle + headAngle);

    // End line at arrowhead base to avoid overlap at low opacity
    const baseFactor = Math.cos(headAngle);
    const baseX = x2 - headLength * baseFactor * Math.cos(angle);
    const baseY = y2 - headLength * baseFactor * Math.sin(angle);

    const strokeColor = String(annotation.style?.['stroke'] ?? '#ef4444');
    const opacity = String(annotation.style?.['opacity'] ?? 1);
    const lineStyle = `stroke:${strokeColor};stroke-width:${String(strokeWidth)};fill:none`;

    // Group opacity so line+head don't double-blend
    return (
      `<g style="opacity:${opacity}">` +
      `<line x1="${String(x1)}" y1="${String(y1)}" x2="${String(baseX)}" y2="${String(baseY)}" style="${lineStyle}" />` +
      `<polygon points="${String(x2)},${String(y2)} ${String(a1x)},${String(a1y)} ${String(a2x)},${String(a2y)}" ` +
      `fill="${strokeColor}" />` +
      `</g>`
    );
  },
};
