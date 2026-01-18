import { describe, expect, it } from 'vitest';
import { parseViewport } from '../parseViewport';

describe('parseViewport', () => {
  it('parses desktop preset', () => {
    expect(parseViewport('desktop')).toEqual({
      name: 'desktop',
      width: 1280,
      height: 800,
    });
  });

  it('parses tablet preset', () => {
    expect(parseViewport('tablet')).toEqual({
      name: 'tablet',
      width: 768,
      height: 1024,
    });
  });

  it('parses mobile preset', () => {
    expect(parseViewport('mobile')).toEqual({
      name: 'mobile',
      width: 375,
      height: 667,
    });
  });

  it('parses custom WIDTHxHEIGHT format', () => {
    expect(parseViewport('1920x1080')).toEqual({
      name: '1920x1080',
      width: 1920,
      height: 1080,
    });
  });

  it('parses small custom dimensions', () => {
    expect(parseViewport('400x300')).toEqual({
      name: '400x300',
      width: 400,
      height: 300,
    });
  });

  it('falls back to desktop for invalid format', () => {
    expect(parseViewport('invalid')).toEqual({
      name: 'desktop',
      width: 1280,
      height: 800,
    });
  });

  it('falls back to desktop for partial format', () => {
    expect(parseViewport('1920x')).toEqual({
      name: 'desktop',
      width: 1280,
      height: 800,
    });
  });
});
