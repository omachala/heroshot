<script lang="ts">
  interface Props {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 18, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth}>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <line x1="15" y1="3" x2="15" y2="21"/>
</svg>
