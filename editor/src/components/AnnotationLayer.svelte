<script lang="ts">
  import { getAnnotationType } from '../lib/annotations/registry';
  import type { ResizeHandle } from '../lib/annotations/types';
  import { DEFAULT_STYLE } from '../lib/annotations/types';
  import type { Annotation } from '../types';

  type Props = {
    /** Annotations for the current screenshot */
    annotations: Annotation[];
    /** Current annotation tool type (null = not annotating) */
    activeTool: string | null;
    /** Element bounding rect (viewport coords) */
    elementRect: { top: number; left: number; width: number; height: number };
    /** Padding around element */
    padding: { top: number; right: number; bottom: number; left: number };
    /** Border radius for clipping */
    borderRadius?: number;
    /** Callback when annotations change */
    onAnnotationsChange: (annotations: Annotation[]) => void;
    /** Callback to deactivate the drawing tool */
    onToolDeactivate: () => void;
    /** Callback when annotation selection changes */
    onSelectionChange: (annotationId: string | null) => void;
  };

  let { annotations, activeTool, elementRect, padding, borderRadius = 0, onAnnotationsChange, onToolDeactivate, onSelectionChange }: Props = $props();

  // Selection state
  let selectedId = $state<string | null>(null);

  // Notify parent when selection changes
  $effect(() => {
    onSelectionChange(selectedId);
  });

  // Brush style - persists across annotations so new shapes inherit the last-used style
  let brushStyle = $state<Record<string, string | number>>({});

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

  /** Handle mousedown on the drawing interaction layer (only active when activeTool is set) */
  function handleDrawingMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    const { x, y } = toAnnotationCoords(event.clientX, event.clientY);

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

  /** Handle mousedown on an annotation shape (for selection/move) */
  function handleAnnotationMouseDown(event: MouseEvent, ann: Annotation): void {
    if (event.button !== 0 || activeTool) return;

    event.preventDefault();
    event.stopPropagation();
    selectedId = ann.id;
    isMoving = true;
    moveStartX = event.clientX;
    moveStartY = event.clientY;
    moveOriginal = { ...ann, points: [...ann.points] };
    startGlobalDrag();
  }

  /** Handle mousedown on a resize handle */
  function handleHandleMouseDown(event: MouseEvent, handle: ResizeHandle): void {
    if (event.button !== 0 || !selectedAnnotation) return;

    event.preventDefault();
    event.stopPropagation();
    isResizing = true;
    resizeStartX = event.clientX;
    resizeStartY = event.clientY;
    resizeHandle = handle;
    resizeOriginal = { ...selectedAnnotation, points: [...selectedAnnotation.points] };
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
          // Apply brush style (last-used style) to new annotations
          const styledAnnotation = Object.keys(brushStyle).length > 0
            ? { ...newAnnotation, style: { ...brushStyle } }
            : newAnnotation;
          onAnnotationsChange([...annotations, styledAnnotation]);
          selectedId = styledAnnotation.id;
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

  /** Type-specific default styles shown in the editor */
  const TYPE_DEFAULTS: Record<string, Record<string, string | number>> = {
    rect: { 'border-radius': 4 },
  };

  // Effective style for the selected annotation (merged with defaults)
  let selectedStyle = $derived.by(() => {
    if (!selectedAnnotation) return {};
    const typeDefaults = TYPE_DEFAULTS[selectedAnnotation.type] ?? {};
    return { ...DEFAULT_STYLE, ...typeDefaults, ...selectedAnnotation.style };
  });

  /** Get the merged style for the currently selected annotation */
  export function getSelectedStyle(): Record<string, string | number> {
    return selectedStyle;
  }

  /** Get position for the config bar (viewport coords, centered below annotation bbox) */
  export function getSelectedBBoxPosition(): { x: number; y: number } | null {
    if (!selectedAnnotation || activeTool) return null;
    const typeHandler = getAnnotationType(selectedAnnotation.type);
    if (!typeHandler) return null;
    const bbox = typeHandler.getBBox(selectedAnnotation);
    return {
      x: elementRect.left + (bbox.minX + bbox.maxX) / 2,
      y: elementRect.top + bbox.maxY + 12,
    };
  }

  /** Handle style change from ConfigBar */
  export function updateStyle(newStyle: Record<string, string | number>): void {
    if (!selectedId || !selectedAnnotation) return;
    // Merge all defaults for this type
    const typeDefaults = TYPE_DEFAULTS[selectedAnnotation.type] ?? {};
    const allDefaults = { ...DEFAULT_STYLE, ...typeDefaults };
    // Remove entries that match defaults
    const cleaned: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(newStyle)) {
      if (String(allDefaults[key]) !== String(value)) {
        cleaned[key] = value;
      }
    }
    // Update brush style so next annotations inherit these values
    brushStyle = { ...cleaned };
    onAnnotationsChange(annotations.map(a =>
      a.id === selectedId ? { ...a, style: Object.keys(cleaned).length > 0 ? cleaned : undefined } : a
    ));
  }

  /** Render annotation SVG */
  function renderAnnotationSvg(ann: Annotation): string {
    const typeHandler = getAnnotationType(ann.type);
    return typeHandler?.toSvgString(ann) ?? '';
  }

  /** Build an invisible hit-area for an annotation (wider stroke, transparent) */
  function renderHitArea(ann: Annotation): string {
    const typeHandler = getAnnotationType(ann.type);
    if (!typeHandler) return '';
    const bbox = typeHandler.getBBox(ann);
    // For arrows, use a wide transparent line as hit area
    if (ann.type === 'arrow') {
      const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = ann.points;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="${HIT_TOLERANCE * 2}" fill="none" />`;
    }
    // For shapes, use a transparent rect over the bbox
    return `<rect x="${bbox.minX}" y="${bbox.minY}" width="${bbox.maxX - bbox.minX}" height="${bbox.maxY - bbox.minY}" fill="transparent" stroke="transparent" stroke-width="${HIT_TOLERANCE * 2}" />`;
  }
</script>

<!-- SVG annotation overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed pointer-events-none overflow-hidden"
  style="top:{svgTop}px;left:{svgLeft}px;width:{svgWidth}px;height:{svgHeight}px;z-index:2147483645;{borderRadius > 0 ? `border-radius:${borderRadius}px;` : ''}"
>
  <!-- Drawing interaction layer - ONLY shown when a drawing tool is active -->
  {#if activeTool !== null}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 pointer-events-auto"
      style="cursor:crosshair;"
      onmousedown={handleDrawingMouseDown}
    ></div>
  {/if}

  <!-- SVG content -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={svgWidth}
    height={svgHeight}
    class="absolute inset-0 pointer-events-none overflow-hidden"
  >
    <g transform="translate({padding.left},{padding.top})">
      <!-- Existing annotations - each has its own hit area for selection/move -->
      {#each annotations as ann (ann.id)}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <g class:annotation-selected={selectedId === ann.id}>
          {@html renderAnnotationSvg(ann)}
        </g>
        <!-- Invisible hit area for clicking/dragging this annotation -->
        {#if !activeTool}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <g
            style="pointer-events:auto;cursor:grab;"
            onmousedown={(event) => handleAnnotationMouseDown(event, ann)}
          >
            {@html renderHitArea(ann)}
          </g>
        {/if}
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
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <circle
            cx={handle.x}
            cy={handle.y}
            r="7"
            fill="transparent"
            style="pointer-events:auto;cursor:{handle.cursor};"
            onmousedown={(event) => handleHandleMouseDown(event, handle)}
          />
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

