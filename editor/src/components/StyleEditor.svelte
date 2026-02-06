<script lang="ts">
  type Props = {
    /** Current style key-value pairs */
    style: Record<string, string | number>;
    /** Callback when style changes */
    onStyleChange: (style: Record<string, string | number>) => void;
    /** Position (viewport coords) */
    x: number;
    y: number;
  };

  let { style, onStyleChange, x, y }: Props = $props();

  // Convert style to editable rows
  let rows = $derived.by(() => {
    const entries = Object.entries(style);
    // Always add empty row at bottom
    return [...entries.map(([key, value]) => ({ key, value: String(value) })), { key: '', value: '' }];
  });

  function handleKeyChange(index: number, newKey: string): void {
    const entries = Object.entries(style);
    if (index < entries.length) {
      // Renaming existing key
      const oldKey = entries[index]?.[0] ?? '';
      if (newKey === '') {
        // Delete row - rebuild without the old key
        const newStyle: Record<string, string | number> = {};
        for (const [k, v] of entries) {
          if (k !== oldKey) newStyle[k] = v;
        }
        onStyleChange(newStyle);
      } else if (newKey !== oldKey) {
        const newStyle: Record<string, string | number> = {};
        for (const [k, v] of entries) {
          newStyle[k === oldKey ? newKey : k] = v;
        }
        onStyleChange(newStyle);
      }
    } else if (newKey) {
      // Adding new row
      onStyleChange({ ...style, [newKey]: '' });
    }
  }

  function handleValueChange(index: number, newValue: string): void {
    const entries = Object.entries(style);
    if (index < entries.length) {
      const key = entries[index]?.[0] ?? '';
      if (newValue === '' && !key) return;
      // Try to parse as number
      const numberValue = Number(newValue);
      const parsedValue = !Number.isNaN(numberValue) && newValue.trim() !== '' ? numberValue : newValue;
      onStyleChange({ ...style, [key]: parsedValue });
    }
  }

  function handleKeyBlur(index: number, event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      handleKeyChange(index, event.target.value.trim());
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
>
  <div class="px-2 py-1.5 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wide">
    Style
  </div>
  <div class="p-1">
    {#each rows as row, index (index)}
      <div class="flex gap-1 mb-0.5">
        <input
          type="text"
          class="w-24 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          value={row.key}
          placeholder="property"
          onblur={(event) => handleKeyBlur(index, event)}
          onkeydown={handleKeyDown}
        />
        <input
          type="text"
          class="w-20 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          value={row.value}
          placeholder="value"
          onblur={(event) => handleValueBlur(index, event)}
          onkeydown={handleKeyDown}
        />
      </div>
    {/each}
  </div>
</div>
