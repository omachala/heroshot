import { describe, expect, it } from 'vitest';
import { ellipseType } from '../ellipseType';

describe('ellipseType', () => {
  describe('createFromDrag', () => {
    it('should create an ellipse inscribed in the drag bounding box', () => {
      // Drag from (0,0) to (100,60) -> bbox is 100x60 -> cx=50, cy=30, rx=50, ry=30
      const ellipse = ellipseType.createFromDrag(0, 0, 100, 60, false);
      expect(ellipse.type).toBe('ellipse');
      expect(ellipse.id).toMatch(/^ellipse-/);
      expect(ellipse.points).toEqual([50, 30, 50, 30]);
    });

    it('should normalize negative dimensions (drag up-left)', () => {
      const ellipse = ellipseType.createFromDrag(100, 60, 0, 0, false);
      expect(ellipse.points).toEqual([50, 30, 50, 30]);
    });

    it('should constrain to circle with shift', () => {
      const ellipse = ellipseType.createFromDrag(0, 0, 100, 60, true);
      const [, , rx, ry] = ellipse.points;
      expect(rx).toBe(ry);
      expect(rx).toBe(50); // max(100/2, 60/2) = 50
    });

    it('should handle zero-size drag', () => {
      const ellipse = ellipseType.createFromDrag(50, 50, 50, 50, false);
      expect(ellipse.points).toEqual([50, 50, 0, 0]);
    });

    it('should generate unique IDs', () => {
      const e1 = ellipseType.createFromDrag(0, 0, 10, 10, false);
      const e2 = ellipseType.createFromDrag(0, 0, 20, 20, false);
      expect(e1.id).not.toBe(e2.id);
    });
  });

  describe('getBBox', () => {
    it('should return bounding box from center and radii', () => {
      const bbox = ellipseType.getBBox({ id: 'e', type: 'ellipse', points: [50, 30, 50, 30] });
      expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 60 });
    });

    it('should handle zero-size ellipse', () => {
      const bbox = ellipseType.getBBox({ id: 'e', type: 'ellipse', points: [50, 50, 0, 0] });
      expect(bbox).toEqual({ minX: 50, minY: 50, maxX: 50, maxY: 50 });
    });

    it('should default missing points to 0', () => {
      const bbox = ellipseType.getBBox({ id: 'e', type: 'ellipse', points: [] });
      expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    });
  });

  describe('getHandles', () => {
    it('should return 4 cardinal handles', () => {
      const handles = ellipseType.getHandles({
        id: 'e',
        type: 'ellipse',
        points: [50, 30, 50, 30],
      });
      expect(handles).toHaveLength(4);
      expect(handles[0]).toEqual({ id: 'top', x: 50, y: 0, cursor: 'ns-resize' });
      expect(handles[1]).toEqual({ id: 'right', x: 100, y: 30, cursor: 'ew-resize' });
      expect(handles[2]).toEqual({ id: 'bottom', x: 50, y: 60, cursor: 'ns-resize' });
      expect(handles[3]).toEqual({ id: 'left', x: 0, y: 30, cursor: 'ew-resize' });
    });
  });

  describe('applyResize', () => {
    const annotation = { id: 'e', type: 'ellipse', points: [50, 50, 40, 30] };

    it('should resize from top handle', () => {
      const result = ellipseType.applyResize(
        annotation,
        { id: 'top', x: 50, y: 20, cursor: 'ns-resize' },
        0,
        -10,
        false
      );
      expect(result.points).toEqual([50, 45, 40, 35]); // cy moves up, ry increases
    });

    it('should resize from bottom handle', () => {
      const result = ellipseType.applyResize(
        annotation,
        { id: 'bottom', x: 50, y: 80, cursor: 'ns-resize' },
        0,
        10,
        false
      );
      expect(result.points).toEqual([50, 55, 40, 35]); // cy moves down, ry increases
    });

    it('should resize from left handle', () => {
      const result = ellipseType.applyResize(
        annotation,
        { id: 'left', x: 10, y: 50, cursor: 'ew-resize' },
        -10,
        0,
        false
      );
      expect(result.points).toEqual([45, 50, 45, 30]); // cx moves left, rx increases
    });

    it('should resize from right handle', () => {
      const result = ellipseType.applyResize(
        annotation,
        { id: 'right', x: 90, y: 50, cursor: 'ew-resize' },
        10,
        0,
        false
      );
      expect(result.points).toEqual([55, 50, 45, 30]); // cx moves right, rx increases
    });

    it('should constrain to circle with shift', () => {
      const result = ellipseType.applyResize(
        annotation,
        { id: 'right', x: 90, y: 50, cursor: 'ew-resize' },
        20,
        0,
        true
      );
      const [, , rx, ry] = result.points;
      expect(rx).toBe(ry);
    });

    it('should handle negative radius by taking absolute value', () => {
      // Push top handle below center
      const result = ellipseType.applyResize(
        annotation,
        { id: 'top', x: 50, y: 20, cursor: 'ns-resize' },
        0,
        100,
        false
      );
      expect(result.points[3]).toBeGreaterThanOrEqual(0); // ry is non-negative
    });

    it('should not mutate original', () => {
      const original = { id: 'e', type: 'ellipse', points: [50, 50, 40, 30] };
      ellipseType.applyResize(
        original,
        { id: 'top', x: 50, y: 20, cursor: 'ns-resize' },
        0,
        -10,
        false
      );
      expect(original.points).toEqual([50, 50, 40, 30]);
    });
  });

  describe('applyMove', () => {
    it('should move center without changing radii', () => {
      const annotation = { id: 'e', type: 'ellipse', points: [50, 50, 40, 30] };
      const result = ellipseType.applyMove(annotation, 10, -5);
      expect(result.points).toEqual([60, 45, 40, 30]);
    });

    it('should not mutate original', () => {
      const original = { id: 'e', type: 'ellipse', points: [50, 50, 40, 30] };
      ellipseType.applyMove(original, 10, -5);
      expect(original.points).toEqual([50, 50, 40, 30]);
    });
  });

  describe('hitTest', () => {
    const annotation = { id: 'e', type: 'ellipse', points: [50, 50, 40, 30] };

    it('should hit on the boundary', () => {
      // Point on the right side of ellipse (cx + rx, cy)
      expect(ellipseType.hitTest(annotation, 90, 50, 8)).toBe(true);
    });

    it('should hit on the top boundary', () => {
      // Point on top of ellipse (cx, cy - ry)
      expect(ellipseType.hitTest(annotation, 50, 20, 8)).toBe(true);
    });

    it('should miss far inside (only boundary hit)', () => {
      // Center of the ellipse - should miss because hitTest checks boundary only
      expect(ellipseType.hitTest(annotation, 50, 50, 8)).toBe(false);
    });

    it('should miss far outside', () => {
      expect(ellipseType.hitTest(annotation, 200, 200, 8)).toBe(false);
    });

    it('should return false for zero-size ellipse', () => {
      const point = { id: 'e', type: 'ellipse', points: [50, 50, 0, 0] };
      expect(ellipseType.hitTest(point, 50, 50, 8)).toBe(false);
    });

    it('should hit within tolerance of boundary', () => {
      // Slightly outside the boundary
      expect(ellipseType.hitTest(annotation, 95, 50, 8)).toBe(true);
    });
  });

  describe('toSvgString', () => {
    it('should return ellipse SVG element', () => {
      const svg = ellipseType.toSvgString({ id: 'e', type: 'ellipse', points: [50, 50, 40, 30] });
      expect(svg).toContain('<ellipse');
      expect(svg).toContain('cx="50"');
      expect(svg).toContain('cy="50"');
      expect(svg).toContain('rx="40"');
      expect(svg).toContain('ry="30"');
    });

    it('should include style attributes', () => {
      const svg = ellipseType.toSvgString({
        id: 'e',
        type: 'ellipse',
        points: [50, 50, 40, 30],
        style: { stroke: '#00ff00', 'stroke-width': 5 },
      });
      expect(svg).toContain('stroke:#00ff00');
      expect(svg).toContain('stroke-width:5');
    });
  });
});
