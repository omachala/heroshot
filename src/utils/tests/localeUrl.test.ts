import { describe, expect, it } from 'vitest';
import { applyLocale } from '../localeUrl';

describe('applyLocale', () => {
  it('replaces {locale} placeholder in URL path', () => {
    expect(applyLocale('http://localhost:5173/{locale}/about', 'de')).toBe(
      'http://localhost:5173/de/about'
    );
  });

  it('replaces {locale} at the end of path', () => {
    expect(applyLocale('http://localhost:5173/{locale}/', 'fr')).toBe('http://localhost:5173/fr/');
  });

  it('returns URL unchanged when no placeholder present', () => {
    expect(applyLocale('http://localhost:5173/about', 'de')).toBe('http://localhost:5173/about');
  });

  it('replaces multiple occurrences of {locale}', () => {
    expect(applyLocale('http://localhost:5173/{locale}/{locale}/page', 'de')).toBe(
      'http://localhost:5173/de/de/page'
    );
  });

  it('works with production URLs', () => {
    expect(applyLocale('https://docs.example.com/{locale}/getting-started', 'ja')).toBe(
      'https://docs.example.com/ja/getting-started'
    );
  });

  it('works with URLs that have query strings', () => {
    expect(applyLocale('http://localhost:5173/{locale}/page?q=1', 'de')).toBe(
      'http://localhost:5173/de/page?q=1'
    );
  });

  it('preserves en locale (default/empty prefix)', () => {
    expect(applyLocale('http://localhost:5173/{locale}/home', 'en')).toBe(
      'http://localhost:5173/en/home'
    );
  });
});
