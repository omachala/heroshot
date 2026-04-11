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

  it('adds locale prefix', () => {
    expect(buildDisplayName('Hero Section', undefined, undefined, 'de')).toBe('Hero Section (de)');
  });

  it('combines locale with viewport and color scheme', () => {
    expect(buildDisplayName('Hero Section', 'mobile', 'dark', 'de')).toBe(
      'Hero Section (de-mobile-dark)'
    );
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

  it('returns locale only', () => {
    expect(buildVariantSuffix(undefined, undefined, 'de')).toBe('de');
  });

  it('combines locale with viewport and color scheme', () => {
    expect(buildVariantSuffix('mobile', 'dark', 'de')).toBe('de-mobile-dark');
  });

  it('locale comes first in combined suffix', () => {
    expect(buildVariantSuffix(undefined, 'dark', 'fr')).toBe('fr-dark');
  });
});
