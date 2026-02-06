<script lang="ts">
  type Props = {
    /** Current style key-value pairs */
    style: Record<string, string | number>;
    /** Callback when style changes */
    onStyleChange: (style: Record<string, string | number>) => void;
    /** Callback when mouse enters the editor */
    onMouseEnter: () => void;
    /** Position (viewport coords) */
    x: number;
    y: number;
  };

  let { style, onStyleChange, onMouseEnter, x, y }: Props = $props();

  // Convert style to editable rows (no empty row — keys are fixed)
  let rows = $derived.by(() => {
    return Object.entries(style).map(([key, value]) => ({ key, value: String(value) }));
  });

  function handleValueChange(index: number, newValue: string): void {
    const entries = Object.entries(style);
    if (index < entries.length) {
      const key = entries[index]?.[0] ?? '';
      // Try to parse as number
      const numberValue = Number(newValue);
      const parsedValue = !Number.isNaN(numberValue) && newValue.trim() !== '' ? numberValue : newValue;
      onStyleChange({ ...style, [key]: parsedValue });
    }
  }

  function handleValueBlur(index: number, event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      handleValueChange(index, event.target.value.trim());
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' && event.target instanceof HTMLInputElement) {
      event.target.blur();
    }
  }

  /** Properties that should use a color picker */
  const COLOR_PROPERTIES = new Set(['stroke', 'fill']);

  function isColorProperty(key: string): boolean {
    return COLOR_PROPERTIES.has(key);
  }

  /** Properties that should use a number input */
  const NUMBER_PROPERTIES = new Set(['stroke-width', 'opacity']);

  function isNumberProperty(key: string): boolean {
    return NUMBER_PROPERTIES.has(key);
  }

  function getNumberStep(key: string): string {
    return key === 'opacity' ? '0.1' : '1';
  }

  function getNumberMin(_key: string): string {
    return '0';
  }

  function getNumberMax(key: string): string | undefined {
    return key === 'opacity' ? '1' : undefined;
  }

  function handleInputChange(index: number, event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      handleValueChange(index, event.target.value);
    }
  }

  // Position the editor near the annotation, but keep it in viewport
  let editorStyle = $derived(
    `left:${x}px;top:${y}px;transform:translateX(-50%);`
  );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed z-[2147483647] bg-slate-800 rounded-lg shadow-2xl border border-slate-600 pointer-events-auto font-sans text-white text-xs"
  style={editorStyle}
  onkeydown={handleKeyDown}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  onmousedown={(event) => event.stopPropagation()}
  onmouseenter={() => onMouseEnter()}
  onmousemove={(event) => event.stopPropagation()}
>
  <div class="px-2 py-1.5 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wide">
    Style
  </div>
  <div class="p-1">
    {#each rows as row, index (row.key)}
      <div class="flex items-center gap-1 mb-0.5">
        <span class="w-24 px-1.5 py-0.5 text-xs text-slate-400 truncate">{row.key}</span>
        {#if isColorProperty(row.key)}
          <input
            type="color"
            class="w-8 h-6 bg-slate-700 border border-slate-600 rounded cursor-pointer p-0"
            value={row.value || '#ef4444'}
            oninput={(event) => handleInputChange(index, event)}
          />
        {:else if isNumberProperty(row.key)}
          <input
            type="number"
            class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            value={row.value}
            step={getNumberStep(row.key)}
            min={getNumberMin(row.key)}
            max={getNumberMax(row.key)}
            oninput={(event) => handleInputChange(index, event)}
            onkeydown={handleKeyDown}
          />
        {:else}
          <input
            type="text"
            class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            value={row.value}
            placeholder="value"
            onblur={(event) => handleValueBlur(index, event)}
            onkeydown={handleKeyDown}
          />
        {/if}
      </div>
    {/each}
  </div>
</div>
