import { describe, expect, it } from 'vitest';
import { normalizeSelector } from '../elementFinder';

describe('normalizeSelector', () => {
  it('keeps simple CSS selectors unchanged', () => {
    expect(normalizeSelector('.button')).toBe('.button');
    expect(normalizeSelector('#header')).toBe('#header');
    expect(normalizeSelector('div > span.text')).toBe('div > span.text');
  });

  it('converts legacy >>> to Playwright >> syntax', () => {
    expect(normalizeSelector('host >>> .child')).toBe('host >> .child');
    expect(normalizeSelector('host>>>child')).toBe('host>>child');
    expect(normalizeSelector('a >>> b >>> c')).toBe('a >> b >> c');
  });

  it('preserves Playwright >> syntax', () => {
    expect(normalizeSelector('host >> .child')).toBe('host >> .child');
    expect(normalizeSelector('a >> b >> c')).toBe('a >> b >> c');
  });

  it('preserves Playwright selector prefixes', () => {
    expect(normalizeSelector('xpath=//button')).toBe('xpath=//button');
    expect(normalizeSelector('text=Submit')).toBe('text=Submit');
    expect(normalizeSelector('role=button[name="OK"]')).toBe('role=button[name="OK"]');
  });

  it('handles complex selectors with shadow DOM', () => {
    expect(normalizeSelector('my-component >>> .inner >>> button.submit')).toBe(
      'my-component >> .inner >> button.submit'
    );
  });
});
