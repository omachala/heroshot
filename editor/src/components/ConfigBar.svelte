<script lang="ts">
  import type { ElementFill, PaddingFill, SelectionContext } from '../types';

  type Props = {
    context: SelectionContext;
    position: { x: number; y: number };
    // Element properties
    paddingFill?: PaddingFill;
    elementFill?: ElementFill;
    onPaddingFillChange?: (fill: PaddingFill) => void;
    onElementFillChange?: (fill: ElementFill) => void;
    // Annotation properties
    annotationStyle?: Record<string, string | number>;
    onAnnotationStyleChange?: (style: Record<string, string | number>) => void;
  };

  let { context, position, paddingFill, elementFill, onPaddingFillChange, onElementFillChange, annotationStyle, onAnnotationStyleChange }: Props = $props();

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
    `left:${position.x}px;top:${position.y}px;transform:translateX(-50%);`
  );
</script>

{#if context.type === 'element' || context.type === 'annotation'}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed z-[2147483647] bg-slate-800 rounded-lg shadow-2xl border border-slate-600 pointer-events-auto font-sans text-white text-xs"
    style={barStyle}
    onkeydown={handleKeyDown}
    onkeyup={stopPropagation}
    onkeypress={stopPropagation}
    onmousedown={stopPropagation}
    onmousemove={stopPropagation}
  >
    {#if context.type === 'element'}
      <div class="px-2 py-1.5 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wide">
        Element
      </div>
      <div class="p-1.5 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <span class="w-24 px-1 py-0.5 text-slate-400 truncate">padding fill</span>
          <select
            class="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500"
            value={paddingFill ?? 'inherit'}
            onchange={(event) => {
              if (event.target instanceof HTMLSelectElement && isPaddingFill(event.target.value)) {
                onPaddingFillChange?.(event.target.value);
              }
            }}
          >
            <option value="inherit">inherit</option>
            <option value="solid">solid</option>
            <option value="transparent">transparent</option>
          </select>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-24 px-1 py-0.5 text-slate-400 truncate">element fill</span>
          <select
            class="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500"
            value={elementFill ?? 'original'}
            onchange={(event) => {
              if (event.target instanceof HTMLSelectElement && isElementFill(event.target.value)) {
                onElementFillChange?.(event.target.value);
              }
            }}
          >
            <option value="original">original</option>
            <option value="solid">solid</option>
            <option value="transparent">transparent</option>
          </select>
        </div>
      </div>
    {:else if context.type === 'annotation'}
      <div class="px-2 py-1.5 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wide">
        Annotation
      </div>
      <div class="p-1">
        {#each annotationRows as row (row.key)}
          <div class="flex items-center gap-1 mb-0.5">
            <span class="w-24 px-1.5 py-0.5 text-xs text-slate-400 truncate">{row.key}</span>
            {#if COLOR_PROPERTIES.has(row.key)}
              <input
                type="color"
                class="w-8 h-6 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
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
                class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
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
                class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
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
