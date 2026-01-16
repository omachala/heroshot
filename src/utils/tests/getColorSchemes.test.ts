import { describe, expect, it } from 'vitest';
import { getColorSchemes } from '../getColorSchemes';

describe('getColorSchemes', () => {
  it('returns empty array for auto (browser preference)', () => {
    expect(getColorSchemes('auto')).toEqual([]);
  });

  it('returns light only for light setting', () => {
    expect(getColorSchemes('light')).toEqual(['light']);
  });

  it('returns dark only for dark setting', () => {
    expect(getColorSchemes('dark')).toEqual(['dark']);
  });

  it('returns both for undefined (default behavior)', () => {
    expect(getColorSchemes(undefined)).toEqual(['light', 'dark']);
  });

  it('returns both for no argument', () => {
    expect(getColorSchemes()).toEqual(['light', 'dark']);
  });
});
