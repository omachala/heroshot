<script lang="ts">
  type Props = {
    /** Current viewports array (undefined = use global default) */
    value: string[] | undefined;
    /** Callback when value changes */
    onChange: (value: string[] | undefined) => void;
    /** Label for the field */
    label?: string;
  }

  let { value, onChange, label = 'Viewports' }: Props = $props();

  type Preset = { id: string; label: string; dims: string };

  const presets: Preset[] = [
    { id: 'desktop', label: 'Desktop', dims: '1280×800' },
    { id: 'tablet', label: 'Tablet', dims: '768×1024' },
    { id: 'mobile', label: 'Mobile', dims: '375×667' },
  ];

  /** Check if a preset is selected */
  function isSelected(presetId: string): boolean {
    return value?.includes(presetId) ?? false;
  }

  /** Toggle a preset on/off */
  function togglePreset(presetId: string): void {
    const current = value ?? [];

    if (current.includes(presetId)) {
      // Remove it
      const newValue = current.filter(v => v !== presetId);
      onChange(newValue.length > 0 ? newValue : undefined);
    } else {
      // Add it
      onChange([...current, presetId]);
    }
  }
</script>

<div class="space-y-1.5">
  <span class="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
  <div class="flex flex-wrap gap-1">
    {#each presets as preset (preset.id)}
      <button
        type="button"
        class="px-2 py-1 text-[10px] rounded border transition-colors {isSelected(preset.id)
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}"
        onclick={() => togglePreset(preset.id)}
        title={preset.dims}
      >
        {preset.label}
      </button>
    {/each}
  </div>
  {#if !value || value.length === 0}
    <p class="text-[9px] text-slate-500">Using global viewport</p>
  {/if}
</div>
