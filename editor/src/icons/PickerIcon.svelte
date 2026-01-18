<script lang="ts">
  type Props = {
    size?: number;
    strokeWidth?: number;
  }

  let { size = 20, strokeWidth = 2 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth}>
  <circle cx="12" cy="12" r="10"/>
  <circle cx="12" cy="12" r="3"/>
  <line x1="12" y1="2" x2="12" y2="6"/>
  <line x1="12" y1="18" x2="12" y2="22"/>
  <line x1="2" y1="12" x2="6" y2="12"/>
  <line x1="18" y1="12" x2="22" y2="12"/>
</svg>
