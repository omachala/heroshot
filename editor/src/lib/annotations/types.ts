import type { Annotation } from '../../types';

/** Bounding box for an annotation */
export type BBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/** Resize handle for interactive editing */
export type ResizeHandle = {
  id: string;
  x: number;
  y: number;
  cursor: string;
};

/** Definition for an annotation type */
export type AnnotationTypeDefinition = {
  type: string;
  label: string;
  createFromDrag(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    shiftKey: boolean
  ): Annotation;
  getBBox(annotation: Annotation): BBox;
  getHandles(annotation: Annotation): ResizeHandle[];
  applyResize(
    annotation: Annotation,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    shiftKey: boolean
  ): Annotation;
  applyMove(annotation: Annotation, deltaX: number, deltaY: number): Annotation;
  hitTest(annotation: Annotation, x: number, y: number, tolerance: number): boolean;
  toSvgString(annotation: Annotation): string;
};

/** Default style values applied when style is omitted */
export const DEFAULT_STYLE: Record<string, string | number> = {
  stroke: '#ef4444',
  'stroke-width': 3,
  opacity: 1,
  fill: 'none',
};

/** Get effective style value, falling back to defaults */
export function getStyleValue(annotation: Annotation, key: string): string {
  const value = annotation.style?.[key] ?? DEFAULT_STYLE[key];
  return value === undefined ? '' : String(value);
}

/** Build SVG style attribute string from annotation style */
export function buildStyleString(annotation: Annotation): string {
  const merged = { ...DEFAULT_STYLE, ...annotation.style };
  return Object.entries(merged)
    .map(([k, v]) => `${k}:${String(v)}`)
    .join(';');
}
