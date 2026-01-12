<script lang="ts">
  interface Props {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 16, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth}>
  <polyline points="6 9 12 15 18 9"/>
</svg>
