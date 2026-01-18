/**
 * Maps color scheme setting to array of schemes to capture
 * - 'light' = force light mode, capture once
 * - 'dark' = force dark mode, capture once
 * - undefined = both (light and dark)
 */
export function getColorSchemes(setting?: 'light' | 'dark'): ('light' | 'dark')[] {
  if (setting === 'light') return ['light'];
  if (setting === 'dark') return ['dark'];
  // Default: capture both
  return ['light', 'dark'];
}
