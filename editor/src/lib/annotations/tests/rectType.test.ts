import { describe, expect, it } from 'vitest';
import { rectType } from '../rectType';

describe('rectType', () => {
  describe('createFromDrag', () => {
    it('should create a rect with positive dimensions', () => {
      const rect = rectType.createFromDrag(10, 20, 110, 120, false);
      expect(rect.type).toBe('rect');
      expect(rect.id).toMatch(/^rect-/);
      expect(rect.points).toEqual([10, 20, 100, 100]);
    });

    it('should normalize negative width (drag left)', () => {
      const rect = rectType.createFromDrag(100, 20, 10, 120, false);
      expect(rect.points).toEqual([10, 20, 90, 100]);
    });

    it('should normalize negative height (drag up)', () => {
      const rect = rectType.createFromDrag(10, 120, 110, 20, false);
      expect(rect.points).toEqual([10, 20, 100, 100]);
    });

    it('should constrain to square with shift', () => {
      const rect = rectType.createFromDrag(0, 0, 100, 60, true);
      const [, , w, h] = rect.points;
      expect(w).toBe(h);
      expect(w).toBe(100); // max of 100, 60
    });

    it('should handle zero-size drag', () => {
      const rect = rectType.createFromDrag(50, 50, 50, 50, false);
      expect(rect.points).toEqual([50, 50, 0, 0]);
    });

    it('should generate unique IDs', () => {
      const r1 = rectType.createFromDrag(0, 0, 10, 10, false);
      const r2 = rectType.createFromDrag(0, 0, 20, 20, false);
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('getBBox', () => {
    it('should return bounding box', () => {
      const bbox = rectType.getBBox({ id: 'r', type: 'rect', points: [10, 20, 100, 50] });
      expect(bbox).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
    });

    it('should handle zero-size rect', () => {
      const bbox = rectType.getBBox({ id: 'r', type: 'rect', points: [10, 20, 0, 0] });
      expect(bbox).toEqual({ minX: 10, minY: 20, maxX: 10, maxY: 20 });
    });

    it('should default missing points to 0', () => {
      const bbox = rectType.getBBox({ id: 'r', type: 'rect', points: [] });
      expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    });
  });

  describe('getHandles', () => {
    it('should return 4 corner handles', () => {
      const handles = rectType.getHandles({ id: 'r', type: 'rect', points: [10, 20, 100, 50] });
      expect(handles).toHaveLength(4);
      expect(handles[0]).toEqual({ id: 'tl', x: 10, y: 20, cursor: 'nwse-resize' });
      expect(handles[1]).toEqual({ id: 'tr', x: 110, y: 20, cursor: 'nesw-resize' });
      expect(handles[2]).toEqual({ id: 'bl', x: 10, y: 70, cursor: 'nesw-resize' });
      expect(handles[3]).toEqual({ id: 'br', x: 110, y: 70, cursor: 'nwse-resize' });
    });
  });

  describe('applyResize', () => {
    const annotation = { id: 'r', type: 'rect', points: [10, 20, 100, 50] };

    it('should resize from top-left', () => {
      const result = rectType.applyResize(
        annotation,
        { id: 'tl', x: 10, y: 20, cursor: 'nwse-resize' },
        10,
        5,
        false
      );
      expect(result.points).toEqual([20, 25, 90, 45]);
    });

    it('should resize from bottom-right', () => {
      const result = rectType.applyResize(
        annotation,
        { id: 'br', x: 110, y: 70, cursor: 'nwse-resize' },
        10,
        5,
        false
      );
      expect(result.points).toEqual([10, 20, 110, 55]);
    });

    it('should resize from top-right', () => {
      const result = rectType.applyResize(
        annotation,
        { id: 'tr', x: 110, y: 20, cursor: 'nesw-resize' },
        10,
        -5,
        false
      );
      expect(result.points).toEqual([10, 15, 110, 55]);
    });

    it('should resize from bottom-left', () => {
      const result = rectType.applyResize(
        annotation,
        { id: 'bl', x: 10, y: 70, cursor: 'nesw-resize' },
        -5,
        10,
        false
      );
      expect(result.points).toEqual([5, 20, 105, 60]);
    });

    it('should normalize negative dimensions after resize', () => {
      // Drag top-left past bottom-right
      const result = rectType.applyResize(
        annotation,
        { id: 'tl', x: 10, y: 20, cursor: 'nwse-resize' },
        200,
        200,
        false
      );
      // w and h should be positive after normalization
      expect(result.points[2]).toBeGreaterThanOrEqual(0);
      expect(result.points[3]).toBeGreaterThanOrEqual(0);
    });

    it('should constrain to square with shift', () => {
      const result = rectType.applyResize(
        annotation,
        { id: 'br', x: 110, y: 70, cursor: 'nwse-resize' },
        10,
        30,
        true
      );
      const [, , w, h] = result.points;
      expect(w).toBe(h);
    });

    it('should not mutate original', () => {
      const original = { id: 'r', type: 'rect', points: [10, 20, 100, 50] };
      rectType.applyResize(
        original,
        { id: 'br', x: 110, y: 70, cursor: 'nwse-resize' },
        10,
        5,
        false
      );
      expect(original.points).toEqual([10, 20, 100, 50]);
    });
  });

  describe('applyMove', () => {
    it('should move position without changing size', () => {
      const annotation = { id: 'r', type: 'rect', points: [10, 20, 100, 50] };
      const result = rectType.applyMove(annotation, 5, -10);
      expect(result.points).toEqual([15, 10, 100, 50]);
    });

    it('should not mutate original', () => {
      const original = { id: 'r', type: 'rect', points: [10, 20, 100, 50] };
      rectType.applyMove(original, 5, -10);
      expect(original.points).toEqual([10, 20, 100, 50]);
    });
  });

  describe('hitTest', () => {
    const annotation = { id: 'r', type: 'rect', points: [0, 0, 100, 100] };

    it('should hit on top edge', () => {
      expect(rectType.hitTest(annotation, 50, 0, 8)).toBe(true);
    });

    it('should hit on bottom edge', () => {
      expect(rectType.hitTest(annotation, 50, 100, 8)).toBe(true);
    });

    it('should hit on left edge', () => {
      expect(rectType.hitTest(annotation, 0, 50, 8)).toBe(true);
    });

    it('should hit on right edge', () => {
      expect(rectType.hitTest(annotation, 100, 50, 8)).toBe(true);
    });

    it('should miss in center (not filled)', () => {
      expect(rectType.hitTest(annotation, 50, 50, 8)).toBe(false);
    });

    it('should miss far outside', () => {
      expect(rectType.hitTest(annotation, 200, 200, 8)).toBe(false);
    });

    it('should hit within tolerance of edge', () => {
      expect(rectType.hitTest(annotation, 50, 7, 8)).toBe(true);
    });

    it('should hit corners', () => {
      expect(rectType.hitTest(annotation, 0, 0, 8)).toBe(true);
      expect(rectType.hitTest(annotation, 100, 100, 8)).toBe(true);
    });
  });

  describe('toSvgString', () => {
    it('should return rect SVG element', () => {
      const svg = rectType.toSvgString({ id: 'r', type: 'rect', points: [10, 20, 100, 50] });
      expect(svg).toContain('<rect');
      expect(svg).toContain('x="10"');
      expect(svg).toContain('y="20"');
      expect(svg).toContain('width="100"');
      expect(svg).toContain('height="50"');
    });

    it('should include border-radius', () => {
      const svg = rectType.toSvgString({
        id: 'r',
        type: 'rect',
        points: [0, 0, 100, 100],
        style: { 'border-radius': 8 },
      });
      expect(svg).toContain('rx="8"');
    });

    it('should use default border-radius of 4', () => {
      const svg = rectType.toSvgString({ id: 'r', type: 'rect', points: [0, 0, 100, 100] });
      expect(svg).toContain('rx="4"');
    });
  });
});
