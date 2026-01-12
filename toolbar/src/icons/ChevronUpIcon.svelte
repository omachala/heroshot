<script lang="ts">
  interface Props {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 16, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth}>
  <polyline points="18 15 12 9 6 15"/>
</svg>
