import { describe, expect, it } from 'vitest';
import { arrowType } from '../arrowType';

describe('arrowType', () => {
  describe('createFromDrag', () => {
    it('should create an arrow with rounded coordinates', () => {
      const arrow = arrowType.createFromDrag(10.5, 20.3, 100.7, 200.9, false);
      expect(arrow.type).toBe('arrow');
      expect(arrow.id).toMatch(/^arrow-/);
      expect(arrow.points).toEqual([11, 20, 101, 201]);
    });

    it('should constrain to 45-degree increments with shift', () => {
      // Drag roughly at 30 degrees - should snap to 0 degrees (horizontal)
      const arrow = arrowType.createFromDrag(0, 0, 100, 30, true);
      expect(arrow.points[3]).toBe(0); // y2 should be 0 (horizontal)
    });

    it('should constrain diagonal with shift', () => {
      // Drag at ~45 degrees
      const arrow = arrowType.createFromDrag(0, 0, 100, 100, true);
      // Should snap to exact 45 degrees
      expect(arrow.points[2]).toBe(arrow.points[3]); // x2 === y2
    });

    it('should generate unique IDs', () => {
      const a1 = arrowType.createFromDrag(0, 0, 10, 10, false);
      const a2 = arrowType.createFromDrag(0, 0, 20, 20, false);
      expect(a1.id).not.toBe(a2.id);
    });
  });

  describe('getBBox', () => {
    it('should return bounding box for left-to-right arrow', () => {
      const bbox = arrowType.getBBox({ id: 'a', type: 'arrow', points: [10, 20, 100, 200] });
      expect(bbox).toEqual({ minX: 10, minY: 20, maxX: 100, maxY: 200 });
    });

    it('should handle reversed arrow (right to left)', () => {
      const bbox = arrowType.getBBox({ id: 'a', type: 'arrow', points: [100, 200, 10, 20] });
      expect(bbox).toEqual({ minX: 10, minY: 20, maxX: 100, maxY: 200 });
    });

    it('should handle zero-length arrow', () => {
      const bbox = arrowType.getBBox({ id: 'a', type: 'arrow', points: [50, 50, 50, 50] });
      expect(bbox).toEqual({ minX: 50, minY: 50, maxX: 50, maxY: 50 });
    });

    it('should default missing points to 0', () => {
      const bbox = arrowType.getBBox({ id: 'a', type: 'arrow', points: [] });
      expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    });
  });

  describe('getHandles', () => {
    it('should return start and end handles', () => {
      const handles = arrowType.getHandles({ id: 'a', type: 'arrow', points: [10, 20, 100, 200] });
      expect(handles).toHaveLength(2);
      expect(handles[0]).toEqual({ id: 'start', x: 10, y: 20, cursor: 'move' });
      expect(handles[1]).toEqual({ id: 'end', x: 100, y: 200, cursor: 'move' });
    });
  });

  describe('applyResize', () => {
    const annotation = { id: 'a', type: 'arrow', points: [10, 20, 100, 200] };

    it('should move start handle', () => {
      const result = arrowType.applyResize(
        annotation,
        { id: 'start', x: 10, y: 20, cursor: 'move' },
        5,
        10,
        false
      );
      expect(result.points).toEqual([15, 30, 100, 200]);
    });

    it('should move end handle', () => {
      const result = arrowType.applyResize(
        annotation,
        { id: 'end', x: 100, y: 200, cursor: 'move' },
        -5,
        -10,
        false
      );
      expect(result.points).toEqual([10, 20, 95, 190]);
    });

    it('should not mutate original', () => {
      const original = { id: 'a', type: 'arrow', points: [10, 20, 100, 200] };
      arrowType.applyResize(original, { id: 'start', x: 10, y: 20, cursor: 'move' }, 5, 10, false);
      expect(original.points).toEqual([10, 20, 100, 200]);
    });
  });

  describe('applyMove', () => {
    it('should move both endpoints', () => {
      const annotation = { id: 'a', type: 'arrow', points: [10, 20, 100, 200] };
      const result = arrowType.applyMove(annotation, 5, -10);
      expect(result.points).toEqual([15, 10, 105, 190]);
    });

    it('should not mutate original', () => {
      const original = { id: 'a', type: 'arrow', points: [10, 20, 100, 200] };
      arrowType.applyMove(original, 5, -10);
      expect(original.points).toEqual([10, 20, 100, 200]);
    });
  });

  describe('hitTest', () => {
    const annotation = { id: 'a', type: 'arrow', points: [0, 0, 100, 0] };

    it('should hit on the line', () => {
      expect(arrowType.hitTest(annotation, 50, 0, 8)).toBe(true);
    });

    it('should hit within tolerance', () => {
      expect(arrowType.hitTest(annotation, 50, 7, 8)).toBe(true);
    });

    it('should miss outside tolerance', () => {
      expect(arrowType.hitTest(annotation, 50, 20, 8)).toBe(false);
    });

    it('should hit at endpoints', () => {
      expect(arrowType.hitTest(annotation, 0, 0, 8)).toBe(true);
      expect(arrowType.hitTest(annotation, 100, 0, 8)).toBe(true);
    });

    it('should handle zero-length arrow', () => {
      const point = { id: 'a', type: 'arrow', points: [50, 50, 50, 50] };
      expect(arrowType.hitTest(point, 50, 50, 8)).toBe(true);
      expect(arrowType.hitTest(point, 60, 60, 8)).toBe(false);
    });
  });

  describe('toSvgString', () => {
    it('should return SVG with line and arrowhead', () => {
      const svg = arrowType.toSvgString({ id: 'a', type: 'arrow', points: [0, 0, 100, 0] });
      expect(svg).toContain('<g style="opacity:1">');
      expect(svg).toContain('<line');
      expect(svg).toContain('<polygon');
      expect(svg).toContain('</g>');
    });

    it('should use custom stroke color', () => {
      const svg = arrowType.toSvgString({
        id: 'a',
        type: 'arrow',
        points: [0, 0, 100, 0],
        style: { stroke: '#00ff00' },
      });
      expect(svg).toContain('#00ff00');
    });

    it('should use custom opacity', () => {
      const svg = arrowType.toSvgString({
        id: 'a',
        type: 'arrow',
        points: [0, 0, 100, 0],
        style: { opacity: 0.5 },
      });
      expect(svg).toContain('opacity:0.5');
    });
  });
});
