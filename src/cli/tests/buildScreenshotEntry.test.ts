import { describe, expect, it } from 'vitest';
import { buildScreenshotEntry } from '../buildScreenshotEntry';

describe('buildScreenshotEntry', () => {
  it('creates screenshot with generated name from URL', () => {
    const result = buildScreenshotEntry('https://example.com/page', undefined);
    expect(result.url).toBe('https://example.com/page');
    expect(result.name).toBe('example-com-page');
    expect(result.id).toBeDefined();
    expect(result.selector).toBeUndefined();
  });

  it('uses output filename as name', () => {
    const result = buildScreenshotEntry('https://example.com', { output: 'my-screenshot.png' });
    expect(result.name).toBe('my-screenshot');
  });

  it('strips extension from output filename', () => {
    const result = buildScreenshotEntry('https://example.com', { output: 'path/to/image.jpg' });
    expect(result.name).toBe('image');
  });

  it('includes selector from options', () => {
    const result = buildScreenshotEntry('https://example.com', { selector: ['.hero'] });
    expect(result.selector).toBe('.hero');
  });

  it('uses first selector when multiple provided', () => {
    const result = buildScreenshotEntry('https://example.com', { selector: ['.hero', '.sidebar'] });
    expect(result.selector).toBe('.hero');
  });

  it('adds uniform padding when specified', () => {
    const result = buildScreenshotEntry('https://example.com', { padding: 20 });
    expect(result.padding).toEqual({
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    });
  });

  it('adds mobile viewport variant', () => {
    const result = buildScreenshotEntry('https://example.com', { mobile: true });
    expect(result.viewports).toEqual(['mobile']);
  });

  it('adds tablet viewport variant', () => {
    const result = buildScreenshotEntry('https://example.com', { tablet: true });
    expect(result.viewports).toEqual(['tablet']);
  });

  it('adds desktop viewport variant', () => {
    const result = buildScreenshotEntry('https://example.com', { desktop: true });
    expect(result.viewports).toEqual(['desktop']);
  });

  it('prefers mobile over tablet and desktop', () => {
    const result = buildScreenshotEntry('https://example.com', {
      mobile: true,
      tablet: true,
      desktop: true,
    });
    expect(result.viewports).toEqual(['mobile']);
  });

  it('generates unique IDs', () => {
    const result1 = buildScreenshotEntry('https://example.com', undefined);
    const result2 = buildScreenshotEntry('https://example.com', undefined);
    expect(result1.id).not.toBe(result2.id);
  });

  it('handles undefined options', () => {
    const result = buildScreenshotEntry('https://example.com', undefined);
    expect(result.url).toBe('https://example.com');
    expect(result.padding).toBeUndefined();
    expect(result.viewports).toBeUndefined();
  });

  it('includes selector in generated name when provided', () => {
    const result = buildScreenshotEntry('https://example.com', { selector: ['.hero-section'] });
    expect(result.name).toContain('hero-section');
  });
});
