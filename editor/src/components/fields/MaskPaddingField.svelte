<script lang="ts">
  type Props = {
    /** Current value */
    value: boolean | undefined;
    /** Callback when value changes */
    onChange: (value: boolean | undefined) => void;
    /** Label for the field */
    label?: string;
  }

  let { value, onChange, label = 'Mask padding' }: Props = $props();

  function handleChange(event: Event): void {
    // eslint-disable-next-line no-restricted-syntax -- event.target type narrowing
    const checked = (event.target as HTMLInputElement).checked;
    onChange(checked || undefined);
  }
</script>

<label class="flex items-center gap-2 cursor-pointer group">
  <input
    type="checkbox"
    checked={value ?? false}
    onchange={handleChange}
    class="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
  />
  <span class="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
</label>
