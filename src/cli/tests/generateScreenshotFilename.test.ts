import { describe, expect, it } from 'vitest';
import { generateScreenshotFilename } from '../generateScreenshotFilename';

describe('generateScreenshotFilename', () => {
  it('generates filename from URL', () => {
    expect(generateScreenshotFilename('https://example.com/page')).toBe('example-com-page.png');
  });

  it('includes selector in filename', () => {
    expect(generateScreenshotFilename('https://example.com/page', '.hero')).toBe(
      'example-com-page--hero.png'
    );
  });

  it('truncates long selectors', () => {
    const longSelector = '.some-very-long-selector-name-that-should-be-truncated';
    const result = generateScreenshotFilename('https://example.com', longSelector);
    expect(result.length).toBeLessThan(60);
  });

  it('sanitizes special characters in selector', () => {
    expect(generateScreenshotFilename('https://example.com', '#main > div.content')).toBe(
      'example-com--main-div-content.png'
    );
  });

  it('returns fallback for invalid URL', () => {
    expect(generateScreenshotFilename('not-a-url')).toBe('screenshot.png');
  });
});
