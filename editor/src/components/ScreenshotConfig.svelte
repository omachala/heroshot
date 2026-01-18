<script lang="ts">
  import MaskPaddingField from './fields/MaskPaddingField.svelte';
  import ViewportsField from './fields/ViewportsField.svelte';

  type Props = {
    /** Whether to mask padding with background color */
    maskPadding: boolean | undefined;
    /** Viewport variants */
    viewports: string[] | undefined;
    /** Callback when maskPadding changes */
    onMaskPaddingChange: (value: boolean | undefined) => void;
    /** Callback when viewports change */
    onViewportsChange: (value: string[] | undefined) => void;
  }

  let { maskPadding, viewports, onMaskPaddingChange, onViewportsChange }: Props = $props();
</script>

<div class="space-y-3 pt-2 mt-2 border-t border-slate-600/50">
  <MaskPaddingField
    value={maskPadding}
    onChange={onMaskPaddingChange}
    label="Fill padding with background"
  />
  <ViewportsField
    value={viewports}
    onChange={onViewportsChange}
  />
</div>
