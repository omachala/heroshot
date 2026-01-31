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

  it('trims whitespace from selectors', () => {
    expect(normalizeSelector('  .button  ')).toBe('.button');
    expect(normalizeSelector('  #header >> .child  ')).toBe('#header >> .child');
  });

  it('collapses double spaces', () => {
    expect(normalizeSelector('div  span')).toBe('div span');
    expect(normalizeSelector('div >>  span')).toBe('div >> span');
  });

  it('handles empty string', () => {
    expect(normalizeSelector('')).toBe('');
  });

  it('preserves single > (CSS child combinator)', () => {
    expect(normalizeSelector('div > span > p')).toBe('div > span > p');
  });

  it('handles mixed >>> and >> in same selector', () => {
    expect(normalizeSelector('host >>> inner >> .child')).toBe('host >> inner >> .child');
  });
});

/**
 * Note: findElement() function is tested via CLI integration tests (src/tests/cli/cli.test.ts)
 * as it requires a real Playwright page and browser context.
 * Tests cover:
 * - Element location with various selector types (#id, .class, tag)
 * - Shadow DOM piercing via >> syntax
 * - Error handling for unfound elements (CLI reports "element not found")
 */
