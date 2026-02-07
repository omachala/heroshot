<script lang="ts">
  import type { ElementFill, PaddingFill, SelectionContext } from '../types';

  type Props = {
    context: SelectionContext;
    position: { x: number; y: number };
    // Element properties
    paddingFill?: PaddingFill;
    paddingColor?: string;
    elementFill?: ElementFill;
    elementColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    detectedBgColor?: string;
    onPaddingFillChange?: (fill: PaddingFill) => void;
    onPaddingColorChange?: (color: string) => void;
    onElementFillChange?: (fill: ElementFill) => void;
    onElementColorChange?: (color: string) => void;
    onBorderWidthChange?: (width: number) => void;
    onBorderColorChange?: (color: string) => void;
    onBorderRadiusChange?: (radius: number) => void;
    // Annotation properties
    annotationStyle?: Record<string, string | number>;
    onAnnotationStyleChange?: (style: Record<string, string | number>) => void;
  };

  let {
    context, position,
    paddingFill, paddingColor, elementFill, elementColor,
    borderWidth, borderColor, borderRadius, detectedBgColor,
    onPaddingFillChange, onPaddingColorChange, onElementFillChange, onElementColorChange,
    onBorderWidthChange, onBorderColorChange, onBorderRadiusChange,
    annotationStyle, onAnnotationStyleChange,
  }: Props = $props();

  // Drag state — offset from default position
  let dragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });
  let isDragging = $state(false);
  let dragStartMouse = $state({ x: 0, y: 0 });
  let dragStartOffset = $state({ x: 0, y: 0 });

  // Reset drag offset when selection context changes (new element/annotation selected)
  let lastContextKey = $state('');
  $effect(() => {
    const key = context.type === 'annotation' && 'annotationId' in context
      ? `annotation-${context.annotationId}`
      : context.type;
    if (key !== lastContextKey) {
      lastContextKey = key;
      dragOffset = { x: 0, y: 0 };
    }
  });

  function handleGripMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    isDragging = true;
    dragStartMouse = { x: event.clientX, y: event.clientY };
    dragStartOffset = { ...dragOffset };
    globalThis.addEventListener('mousemove', handleDragMove, { capture: true });
    globalThis.addEventListener('mouseup', handleDragUp, { capture: true });
  }

  function handleDragMove(event: MouseEvent): void {
    dragOffset = {
      x: dragStartOffset.x + (event.clientX - dragStartMouse.x),
      y: dragStartOffset.y + (event.clientY - dragStartMouse.y),
    };
  }

  function handleDragUp(): void {
    isDragging = false;
    globalThis.removeEventListener('mousemove', handleDragMove, { capture: true });
    globalThis.removeEventListener('mouseup', handleDragUp, { capture: true });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' && event.target instanceof HTMLElement) {
      event.target.blur();
    }
  }

  function stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // Annotation style helpers
  const COLOR_PROPERTIES = new Set(['stroke', 'fill']);
  const NUMBER_PROPERTIES = new Set(['stroke-width', 'opacity']);

  function getNumberStep(key: string): string {
    return key === 'opacity' ? '0.1' : '1';
  }

  function getNumberMin(_key: string): string {
    return '0';
  }

  function getNumberMax(key: string): string | undefined {
    return key === 'opacity' ? '1' : undefined;
  }

  function handleAnnotationValueChange(key: string, newValue: string): void {
    if (!annotationStyle || !onAnnotationStyleChange) return;
    const numberValue = Number(newValue);
    const parsedValue = !Number.isNaN(numberValue) && newValue.trim() !== '' ? numberValue : newValue;
    onAnnotationStyleChange({ ...annotationStyle, [key]: parsedValue });
  }

  let annotationRows = $derived.by(() => {
    if (!annotationStyle) return [];
    return Object.entries(annotationStyle).map(([key, value]) => ({ key, value: String(value) }));
  });

  function isPaddingFill(value: string): value is PaddingFill {
    return value === 'inherit' || value === 'solid' || value === 'transparent';
  }

  function isElementFill(value: string): value is ElementFill {
    return value === 'original' || value === 'solid' || value === 'transparent';
  }

  let barStyle = $derived(
    `left:${position.x + dragOffset.x}px;top:${position.y + dragOffset.y}px;transform:translateX(-50%);`
  );
</script>

{#if context.type === 'element' || context.type === 'annotation'}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed z-[2147483647] bg-slate-800 rounded-lg shadow-2xl border border-slate-600 pointer-events-auto font-sans text-sm"
    style={barStyle}
    onkeydown={handleKeyDown}
    onkeyup={stopPropagation}
    onkeypress={stopPropagation}
    onmousedown={stopPropagation}
    onmousemove={stopPropagation}
  >
    {#if context.type === 'element'}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="px-3 py-1.5 border-b border-slate-700 text-slate-300 font-semibold uppercase tracking-wide text-xs flex items-center gap-1.5 cursor-grab select-none"
        class:cursor-grabbing={isDragging}
        onmousedown={handleGripMouseDown}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" class="text-slate-500 flex-shrink-0">
          <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="1.5" r="1" fill="currentColor" />
          <circle cx="1.5" cy="5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="5" r="1" fill="currentColor" />
          <circle cx="1.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
        Element
      </div>
      <div class="p-2 flex flex-col gap-1.5">
        <!-- Padding fill -->
        <div class="flex items-center gap-2">
          <span class="w-24 text-slate-300">padding fill</span>
          <select
            class="bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            value={paddingFill ?? 'inherit'}
            onchange={(event) => {
              if (event.target instanceof HTMLSelectElement && isPaddingFill(event.target.value)) {
                onPaddingFillChange?.(event.target.value);
                if (event.target.value === 'solid' && !paddingColor) {
                  onPaddingColorChange?.(detectedBgColor ?? '#ffffff');
                }
              }
            }}
          >
            <option value="inherit">inherit</option>
            <option value="solid">color</option>
            <option value="transparent">transparent</option>
          </select>
          {#if paddingFill === 'solid'}
            <input
              type="color"
              class="w-7 h-7 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
              value={paddingColor ?? detectedBgColor ?? '#ffffff'}
              oninput={(event) => {
                if (event.target instanceof HTMLInputElement) {
                  onPaddingColorChange?.(event.target.value);
                }
              }}
            />
          {/if}
        </div>
        <!-- Element fill -->
        <div class="flex items-center gap-2">
          <span class="w-24 text-slate-300">element fill</span>
          <select
            class="bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            value={elementFill ?? 'original'}
            onchange={(event) => {
              if (event.target instanceof HTMLSelectElement && isElementFill(event.target.value)) {
                onElementFillChange?.(event.target.value);
                if (event.target.value === 'solid' && !elementColor) {
                  onElementColorChange?.(detectedBgColor ?? '#ffffff');
                }
              }
            }}
          >
            <option value="original">original</option>
            <option value="solid">color</option>
            <!-- transparent not supported yet -->
          </select>
          {#if elementFill === 'solid'}
            <input
              type="color"
              class="w-7 h-7 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
              value={elementColor ?? detectedBgColor ?? '#ffffff'}
              oninput={(event) => {
                if (event.target instanceof HTMLInputElement) {
                  onElementColorChange?.(event.target.value);
                }
              }}
            />
          {/if}
        </div>
        <!-- Border -->
        <div class="flex items-center gap-2">
          <span class="w-24 text-slate-300">border</span>
          <input
            type="number"
            class="w-14 bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            value={borderWidth ?? 0}
            min="0"
            max="20"
            step="1"
            title="Border width (px)"
            oninput={(event) => {
              if (event.target instanceof HTMLInputElement) {
                onBorderWidthChange?.(Number(event.target.value));
              }
            }}
            onkeydown={handleKeyDown}
          />
          <input
            type="color"
            class="w-7 h-7 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
            value={borderColor ?? '#000000'}
            title="Border color"
            oninput={(event) => {
              if (event.target instanceof HTMLInputElement) {
                onBorderColorChange?.(event.target.value);
              }
            }}
          />
        </div>
        <!-- Border radius -->
        <div class="flex items-center gap-2">
          <span class="w-24 text-slate-300">radius</span>
          <input
            type="number"
            class="w-14 bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            value={borderRadius ?? 0}
            min="0"
            max="100"
            step="1"
            title="Border radius (px)"
            oninput={(event) => {
              if (event.target instanceof HTMLInputElement) {
                onBorderRadiusChange?.(Number(event.target.value));
              }
            }}
            onkeydown={handleKeyDown}
          />
        </div>
      </div>
    {:else if context.type === 'annotation'}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="px-3 py-1.5 border-b border-slate-700 text-slate-300 font-semibold uppercase tracking-wide text-xs flex items-center gap-1.5 cursor-grab select-none"
        class:cursor-grabbing={isDragging}
        onmousedown={handleGripMouseDown}
      >
        <svg width="6" height="10" viewBox="0 0 6 10" class="text-slate-500 flex-shrink-0">
          <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="1.5" r="1" fill="currentColor" />
          <circle cx="1.5" cy="5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="5" r="1" fill="currentColor" />
          <circle cx="1.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="4.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
        Annotation
      </div>
      <div class="p-2">
        {#each annotationRows as row (row.key)}
          <div class="flex items-center gap-2 mb-1">
            <span class="w-24 text-slate-300 truncate">{row.key}</span>
            {#if COLOR_PROPERTIES.has(row.key)}
              <input
                type="color"
                class="w-7 h-7 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
                value={row.value || '#ef4444'}
                oninput={(event) => {
                  if (event.target instanceof HTMLInputElement) {
                    handleAnnotationValueChange(row.key, event.target.value);
                  }
                }}
              />
            {:else if NUMBER_PROPERTIES.has(row.key)}
              <input
                type="number"
                class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                value={row.value}
                step={getNumberStep(row.key)}
                min={getNumberMin(row.key)}
                max={getNumberMax(row.key)}
                oninput={(event) => {
                  if (event.target instanceof HTMLInputElement) {
                    handleAnnotationValueChange(row.key, event.target.value);
                  }
                }}
                onkeydown={handleKeyDown}
              />
            {:else}
              <input
                type="text"
                class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                value={row.value}
                placeholder="value"
                onblur={(event) => {
                  if (event.target instanceof HTMLInputElement) {
                    handleAnnotationValueChange(row.key, event.target.value.trim());
                  }
                }}
                onkeydown={handleKeyDown}
              />
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
