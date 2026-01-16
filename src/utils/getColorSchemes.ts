/**
 * Maps color scheme setting to array of schemes to capture
 * - 'auto' = browser preference, capture once (empty array = no override)
 * - 'light' = force light mode, capture once
 * - 'dark' = force dark mode, capture once
 * - undefined/null/anything else = both (light and dark)
 */
export function getColorSchemes(setting?: 'auto' | 'light' | 'dark'): ('light' | 'dark')[] {
  if (setting === 'auto') return [];
  if (setting === 'light') return ['light'];
  if (setting === 'dark') return ['dark'];
  // Default: capture both
  return ['light', 'dark'];
}
