<script lang="ts">
  import { getAnnotationType } from '../lib/annotations/registry';
  import type { ResizeHandle } from '../lib/annotations/types';
  import { DEFAULT_STYLE } from '../lib/annotations/types';
  import type { Annotation } from '../types';
  import StyleEditor from './StyleEditor.svelte';

  type Props = {
    /** Annotations for the current screenshot */
    annotations: Annotation[];
    /** Current annotation tool type (null = not annotating) */
    activeTool: string | null;
    /** Element bounding rect (viewport coords) */
    elementRect: { top: number; left: number; width: number; height: number };
    /** Padding around element */
    padding: { top: number; right: number; bottom: number; left: number };
    /** Callback when annotations change */
    onAnnotationsChange: (annotations: Annotation[]) => void;
    /** Callback to deactivate the drawing tool */
    onToolDeactivate: () => void;
  };

  let { annotations, activeTool, elementRect, padding, onAnnotationsChange, onToolDeactivate }: Props = $props();

  // Selection state
  let selectedId = $state<string | null>(null);

  // Drawing state
  let isDrawing = $state(false);
  let drawStartX = $state(0);
  let drawStartY = $state(0);
  let drawCurrentX = $state(0);
  let drawCurrentY = $state(0);
  let drawShiftKey = $state(false);

  // Move state
  let isMoving = $state(false);
  let moveStartX = $state(0);
  let moveStartY = $state(0);
  let moveOriginal = $state<Annotation | null>(null);

  // Resize state
  let isResizing = $state(false);
  let resizeStartX = $state(0);
  let resizeStartY = $state(0);
  let resizeHandle = $state<ResizeHandle | null>(null);
  let resizeOriginal = $state<Annotation | null>(null);

  // Computed SVG position and size (element + padding area)
  let svgLeft = $derived(elementRect.left - padding.left);
  let svgTop = $derived(elementRect.top - padding.top);
  let svgWidth = $derived(elementRect.width + padding.left + padding.right);
  let svgHeight = $derived(elementRect.height + padding.top + padding.bottom);

  // The preview annotation while drawing
  let previewAnnotation = $derived.by(() => {
    if (!isDrawing || !activeTool) return null;
    const typeHandler = getAnnotationType(activeTool);
    if (!typeHandler) return null;
    return typeHandler.createFromDrag(drawStartX, drawStartY, drawCurrentX, drawCurrentY, drawShiftKey);
  });

  // Selected annotation
  let selectedAnnotation = $derived(
    selectedId ? annotations.find(a => a.id === selectedId) ?? null : null
  );

  // Resize handles for selected annotation
  let handles = $derived.by(() => {
    if (!selectedAnnotation) return [];
    const typeHandler = getAnnotationType(selectedAnnotation.type);
    return typeHandler?.getHandles(selectedAnnotation) ?? [];
  });

  /** Convert viewport coords to annotation coords (relative to element top-left) */
  function toAnnotationCoords(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: clientX - elementRect.left,
      y: clientY - elementRect.top,
    };
  }

  const HIT_TOLERANCE = 8;

  /** Attach global move/up listeners for drag operations */
  function startGlobalDrag(): void {
    globalThis.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
    globalThis.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });
  }

  /** Remove global move/up listeners */
  function stopGlobalDrag(): void {
    globalThis.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
    globalThis.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
  }

  function handleMouseDown(event: MouseEvent): void {
    // Only handle left clicks
    if (event.button !== 0) return;

    const { x, y } = toAnnotationCoords(event.clientX, event.clientY);

    // If we have a selected annotation, check for resize handles first
    if (selectedAnnotation && !activeTool) {
      const typeHandler = getAnnotationType(selectedAnnotation.type);
      if (typeHandler) {
        const annHandles = typeHandler.getHandles(selectedAnnotation);
        for (const handle of annHandles) {
          if (Math.hypot(x - handle.x, y - handle.y) <= HIT_TOLERANCE) {
            event.preventDefault();
            event.stopPropagation();
            isResizing = true;
            resizeStartX = event.clientX;
            resizeStartY = event.clientY;
            resizeHandle = handle;
            resizeOriginal = { ...selectedAnnotation, points: [...selectedAnnotation.points] };
            startGlobalDrag();
            return;
          }
        }
      }
    }

    // Check if clicking on an existing annotation (for selection/move)
    if (!activeTool) {
      // Hit test in reverse order (top-most first)
      for (let index = annotations.length - 1; index >= 0; index--) {
        const ann = annotations[index];
        if (!ann) continue;
        const typeHandler = getAnnotationType(ann.type);
        if (typeHandler?.hitTest(ann, x, y, HIT_TOLERANCE)) {
          event.preventDefault();
          event.stopPropagation();
          selectedId = ann.id;
          isMoving = true;
          moveStartX = event.clientX;
          moveStartY = event.clientY;
          moveOriginal = { ...ann, points: [...ann.points] };
          startGlobalDrag();
          return;
        }
      }
      // Clicked on empty space - deselect
      selectedId = null;
      return;
    }

    // Drawing mode
    event.preventDefault();
    event.stopPropagation();
    isDrawing = true;
    drawStartX = x;
    drawStartY = y;
    drawCurrentX = x;
    drawCurrentY = y;
    drawShiftKey = event.shiftKey;
    startGlobalDrag();
  }

  function handleGlobalMouseMove(event: MouseEvent): void {
    if (isDrawing) {
      const { x, y } = toAnnotationCoords(event.clientX, event.clientY);
      drawCurrentX = x;
      drawCurrentY = y;
      drawShiftKey = event.shiftKey;
    } else if (isMoving && moveOriginal) {
      const deltaX = event.clientX - moveStartX;
      const deltaY = event.clientY - moveStartY;
      const typeHandler = getAnnotationType(moveOriginal.type);
      if (typeHandler) {
        const moved = typeHandler.applyMove(moveOriginal, deltaX, deltaY);
        onAnnotationsChange(annotations.map(a => a.id === moved.id ? moved : a));
      }
    } else if (isResizing && resizeOriginal && resizeHandle) {
      const deltaX = event.clientX - resizeStartX;
      const deltaY = event.clientY - resizeStartY;
      const typeHandler = getAnnotationType(resizeOriginal.type);
      if (typeHandler) {
        const resized = typeHandler.applyResize(resizeOriginal, resizeHandle, deltaX, deltaY, event.shiftKey);
        onAnnotationsChange(annotations.map(a => a.id === resized.id ? resized : a));
      }
    }
  }

  function handleGlobalMouseUp(event: MouseEvent): void {
    if (isDrawing && activeTool) {
      const { x, y } = toAnnotationCoords(event.clientX, event.clientY);
      // Only create if drag was significant
      const distance = Math.hypot(x - drawStartX, y - drawStartY);
      if (distance > 5) {
        const typeHandler = getAnnotationType(activeTool);
        if (typeHandler) {
          const newAnnotation = typeHandler.createFromDrag(drawStartX, drawStartY, x, y, event.shiftKey);
          onAnnotationsChange([...annotations, newAnnotation]);
          selectedId = newAnnotation.id;
        }
      }
      isDrawing = false;
      onToolDeactivate();
    }
    if (isMoving) {
      isMoving = false;
      moveOriginal = null;
    }
    if (isResizing) {
      isResizing = false;
      resizeOriginal = null;
      resizeHandle = null;
    }
    stopGlobalDrag();
  }

  /** Delete selected annotation */
  export function deleteSelected(): boolean {
    if (selectedId) {
      onAnnotationsChange(annotations.filter(a => a.id !== selectedId));
      selectedId = null;
      return true;
    }
    return false;
  }

  /** Get the selected annotation for style editing */
  export function getSelectedAnnotation(): Annotation | null {
    return selectedAnnotation;
  }

  /** Update style on selected annotation */
  export function updateSelectedStyle(style: Record<string, string | number>): void {
    if (!selectedId) return;
    onAnnotationsChange(annotations.map(a =>
      a.id === selectedId ? { ...a, style: { ...a.style, ...style } } : a
    ));
  }

  /** Deselect current annotation */
  export function deselect(): void {
    selectedId = null;
  }

  // Style editor position (viewport coords, centered on selected annotation bbox)
  let styleEditorPos = $derived.by(() => {
    if (!selectedAnnotation || activeTool) return null;
    const typeHandler = getAnnotationType(selectedAnnotation.type);
    if (!typeHandler) return null;
    const bbox = typeHandler.getBBox(selectedAnnotation);
    return {
      x: elementRect.left + (bbox.minX + bbox.maxX) / 2,
      y: elementRect.top + bbox.maxY + 12,
    };
  });

  // Effective style for the selected annotation (merged with defaults)
  let selectedStyle = $derived.by(() => {
    if (!selectedAnnotation) return {};
    return { ...DEFAULT_STYLE, ...selectedAnnotation.style };
  });

  /** Handle style change from StyleEditor */
  function handleStyleChange(newStyle: Record<string, string | number>): void {
    if (!selectedId) return;
    // Remove entries that match defaults
    const cleaned: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(newStyle)) {
      if (String(DEFAULT_STYLE[key]) !== String(value)) {
        cleaned[key] = value;
      }
    }
    onAnnotationsChange(annotations.map(a =>
      a.id === selectedId ? { ...a, style: Object.keys(cleaned).length > 0 ? cleaned : undefined } : a
    ));
  }

  /** Render annotation SVG */
  function renderAnnotationSvg(ann: Annotation): string {
    const typeHandler = getAnnotationType(ann.type);
    return typeHandler?.toSvgString(ann) ?? '';
  }
</script>

<!-- SVG annotation overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed pointer-events-none"
  style="top:{svgTop}px;left:{svgLeft}px;width:{svgWidth}px;height:{svgHeight}px;z-index:2147483645;"
>
  <!-- Interaction layer - captures mouse events when annotations exist or drawing -->
  {#if activeTool || annotations.length > 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 pointer-events-auto"
      style="cursor:{activeTool ? 'crosshair' : 'default'};"
      onmousedown={handleMouseDown}
    ></div>
  {/if}

  <!-- SVG content -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={svgWidth}
    height={svgHeight}
    class="absolute inset-0 pointer-events-none overflow-visible"
  >
    <g transform="translate({padding.left},{padding.top})">
      <!-- Existing annotations -->
      {#each annotations as ann (ann.id)}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <g class:annotation-selected={selectedId === ann.id}>
          {@html renderAnnotationSvg(ann)}
        </g>
      {/each}

      <!-- Preview while drawing -->
      {#if previewAnnotation}
        <g style="opacity:0.6;">
          {@html renderAnnotationSvg(previewAnnotation)}
        </g>
      {/if}

      <!-- Resize handles for selected annotation -->
      {#if selectedAnnotation && !activeTool}
        {#each handles as handle (handle.id)}
          <circle
            cx={handle.x}
            cy={handle.y}
            r="5"
            fill="white"
            stroke="#555"
            stroke-width="1.5"
            class="pointer-events-none"
          />
        {/each}
      {/if}
    </g>
  </svg>
</div>

<!-- Style editor for selected annotation -->
{#if selectedAnnotation && styleEditorPos && !activeTool}
  <StyleEditor
    style={selectedStyle}
    onStyleChange={handleStyleChange}
    x={styleEditorPos.x}
    y={styleEditorPos.y}
  />
{/if}
