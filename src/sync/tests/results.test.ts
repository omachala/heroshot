import { describe, expect, it } from 'vitest';
import { buildDisplayName, buildVariantSuffix } from '../results';

describe('buildDisplayName', () => {
  it('returns name without suffix when no variant', () => {
    expect(buildDisplayName('Hero Section')).toBe('Hero Section');
  });

  it('adds viewport suffix', () => {
    expect(buildDisplayName('Hero Section', 'mobile')).toBe('Hero Section (mobile)');
  });

  it('adds color scheme suffix', () => {
    expect(buildDisplayName('Hero Section', undefined, 'dark')).toBe('Hero Section (dark)');
  });

  it('combines viewport and color scheme', () => {
    expect(buildDisplayName('Hero Section', 'mobile', 'dark')).toBe('Hero Section (mobile-dark)');
  });

  it('handles empty strings', () => {
    expect(buildDisplayName('Test', '', '')).toBe('Test');
  });
});

describe('buildVariantSuffix', () => {
  it('returns empty string when no variant', () => {
    expect(buildVariantSuffix()).toBe('');
  });

  it('returns viewport only', () => {
    expect(buildVariantSuffix('mobile')).toBe('mobile');
  });

  it('returns color scheme only', () => {
    expect(buildVariantSuffix(undefined, 'dark')).toBe('dark');
  });

  it('combines viewport and color scheme', () => {
    expect(buildVariantSuffix('mobile', 'dark')).toBe('mobile-dark');
  });

  it('handles empty strings', () => {
    expect(buildVariantSuffix('', '')).toBe('');
  });
});
