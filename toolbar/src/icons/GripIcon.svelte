<script lang="ts">
  type Props = {
    size?: number;
  }

  const { size = 16 }: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
  <circle cx="5" cy="3" r="1.5" />
  <circle cx="11" cy="3" r="1.5" />
  <circle cx="5" cy="8" r="1.5" />
  <circle cx="11" cy="8" r="1.5" />
  <circle cx="5" cy="13" r="1.5" />
  <circle cx="11" cy="13" r="1.5" />
</svg>
