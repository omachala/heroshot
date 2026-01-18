import { describe, expect, it } from 'vitest';
import { generateUid } from '../generateUid';

describe('generateUid', () => {
  it('generates an 8-character string', () => {
    const uid = generateUid();
    expect(uid).toHaveLength(8);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUid()));
    expect(ids.size).toBe(100);
  });

  it('generates alphanumeric IDs', () => {
    const uid = generateUid();
    expect(uid).toMatch(/^[\da-f]+$/);
  });
});
