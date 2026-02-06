<script lang="ts">
  type Props = {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 20, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
  <!-- Pencil body -->
  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  <path d="m15 5 4 4"/>
</svg>
