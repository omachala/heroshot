<script lang="ts">
  type Props = {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 20, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
  <!-- Arrow line -->
  <line x1="5" y1="19" x2="19" y2="5" />
  <!-- Arrowhead -->
  <polyline points="13 5 19 5 19 11" />
</svg>
