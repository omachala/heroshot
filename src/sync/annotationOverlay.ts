/**
 * Annotation overlay injection for element screenshots.
 * Renders SVG annotations over captured elements during screenshot capture.
 *
 * Uses string-based page.evaluate() for the same reasons as paddingMask.ts:
 * - Module-level constants aren't available in serialized functions
 * - esbuild __name wrappers don't exist in the browser
 */

import type { ElementHandle, Page } from 'playwright';

const OVERLAY_ID = 'heroshot-annotation-overlay';

/** Annotation data passed to the browser */
type AnnotationData = {
  type: string;
  points: number[];
  style?: Record<string, string | number>;
};

/** Default style values */
const DEFAULT_STYLE: Record<string, string | number> = {
  stroke: '#ef4444',
  'stroke-width': 3,
  opacity: 1,
  fill: 'none',
};

/**
 * Calculate the required padding expansion for annotations that extend beyond element bounds.
 */
export function calculateAnnotationPadding(
  annotations: AnnotationData[],
  tolerance = 20
): { top: number; right: number; bottom: number; left: number } {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;

  for (const ann of annotations) {
    const bbox = getAnnotationBBox(ann);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  }

  return {
    top: Math.max(0, -(minY - tolerance)),
    right: Math.max(0, tolerance), // Will be adjusted with element width at call site
    bottom: Math.max(0, tolerance), // Will be adjusted with element height at call site
    left: Math.max(0, -(minX - tolerance)),
  };
}

/** Get bounding box for a single annotation */
function getAnnotationBBox(ann: AnnotationData): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { points } = ann;
  switch (ann.type) {
    case 'arrow': {
      const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = points;
      return {
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2),
      };
    }
    case 'rect': {
      const [x = 0, y = 0, w = 0, h = 0] = points;
      return { minX: x, minY: y, maxX: x + w, maxY: y + h };
    }
    case 'ellipse': {
      const [cx = 0, cy = 0, rx = 0, ry = 0] = points;
      return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry };
    }
    default: {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
  }
}

/**
 * Inject SVG annotation overlay at element position.
 */
export async function injectAnnotationOverlay(
  page: Page,
  element: ElementHandle,
  annotations: AnnotationData[],
  padding: { top: number; right: number; bottom: number; left: number }
): Promise<void> {
  if (annotations.length === 0) return;

  const box = await element.boundingBox();
  if (!box) return;

  await page.evaluate(
    `(function(config) {
      var OVERLAY_ID = ${JSON.stringify(OVERLAY_ID)};
      var DEFAULT_STYLE = ${JSON.stringify(DEFAULT_STYLE)};
      var box = config.box;
      var annotations = config.annotations;
      var padding = config.padding;

      // Remove existing overlay
      var existing = document.querySelector('#' + OVERLAY_ID);
      if (existing) existing.remove();

      function buildStyle(ann) {
        var merged = {};
        for (var k in DEFAULT_STYLE) merged[k] = DEFAULT_STYLE[k];
        if (ann.style) {
          for (var k in ann.style) merged[k] = ann.style[k];
        }
        var parts = [];
        for (var k in merged) parts.push(k + ':' + merged[k]);
        return parts.join(';');
      }

      function renderAnnotation(ann) {
        var style = buildStyle(ann);
        switch (ann.type) {
          case 'arrow': {
            var x1 = ann.points[0] || 0, y1 = ann.points[1] || 0;
            var x2 = ann.points[2] || 0, y2 = ann.points[3] || 0;
            var angle = Math.atan2(y2 - y1, x2 - x1);
            var headLen = 12;
            var a1x = x2 - headLen * Math.cos(angle - Math.PI / 6);
            var a1y = y2 - headLen * Math.sin(angle - Math.PI / 6);
            var a2x = x2 - headLen * Math.cos(angle + Math.PI / 6);
            var a2y = y2 - headLen * Math.sin(angle + Math.PI / 6);
            var strokeColor = (ann.style && ann.style.stroke) || '#ef4444';
            var opacity = (ann.style && ann.style.opacity) || 1;
            return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" style="' + style + '" />'
              + '<polygon points="' + x2 + ',' + y2 + ' ' + a1x + ',' + a1y + ' ' + a2x + ',' + a2y + '" '
              + 'fill="' + strokeColor + '" style="opacity:' + opacity + '" />';
          }
          case 'rect': {
            var x = ann.points[0] || 0, y = ann.points[1] || 0;
            var w = ann.points[2] || 0, h = ann.points[3] || 0;
            return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" style="' + style + '" />';
          }
          case 'ellipse': {
            var cx = ann.points[0] || 0, cy = ann.points[1] || 0;
            var rx = ann.points[2] || 0, ry = ann.points[3] || 0;
            return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" style="' + style + '" />';
          }
          default:
            return '';
        }
      }

      // Create container at element position
      var container = document.createElement('div');
      container.id = OVERLAY_ID;
      container.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;'
        + 'top:' + (box.y - padding.top) + 'px;'
        + 'left:' + (box.x - padding.left) + 'px;'
        + 'width:' + (box.width + padding.left + padding.right) + 'px;'
        + 'height:' + (box.height + padding.top + padding.bottom) + 'px;';

      // Build SVG content
      var svgParts = [];
      var svgWidth = box.width + padding.left + padding.right;
      var svgHeight = box.height + padding.top + padding.bottom;
      svgParts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '" style="overflow:visible;">');
      // Translate so (0,0) = element top-left
      svgParts.push('<g transform="translate(' + padding.left + ',' + padding.top + ')">');
      for (var i = 0; i < annotations.length; i++) {
        svgParts.push(renderAnnotation(annotations[i]));
      }
      svgParts.push('</g></svg>');

      container.innerHTML = svgParts.join('');
      document.body.appendChild(container);
    })(${JSON.stringify({ box, annotations, padding })})`
  );
}

/**
 * Remove injected annotation overlay.
 */
export async function removeAnnotationOverlay(page: Page): Promise<void> {
  await page.evaluate(
    `(function() {
      var OVERLAY_ID = ${JSON.stringify(OVERLAY_ID)};
      var existing = document.querySelector('#' + OVERLAY_ID);
      if (existing) existing.remove();
    })()`
  );
}
