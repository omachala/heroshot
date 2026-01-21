import { describe, expect, it } from 'vitest';
import { getColorSchemes } from '../getColorSchemes';

describe('getColorSchemes', () => {
  it('returns light only for light setting', () => {
    expect(getColorSchemes('light')).toEqual(['light']);
  });

  it('returns dark only for dark setting', () => {
    expect(getColorSchemes('dark')).toEqual(['dark']);
  });

  it('returns both for undefined (default behavior)', () => {
    const colorScheme: 'light' | 'dark' | undefined = undefined;
    expect(getColorSchemes(colorScheme)).toEqual(['light', 'dark']);
  });

  it('returns both for no argument', () => {
    expect(getColorSchemes()).toEqual(['light', 'dark']);
  });
});
