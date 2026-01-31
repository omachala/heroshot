import { describe, expect, it } from 'vitest';
import { generateScreenshotFilename } from '../screenshotPath';

describe('generateScreenshotFilename', () => {
  it('generates filename from name only', () => {
    expect(generateScreenshotFilename({ name: 'Hero Section' })).toBe('hero-section.png');
  });

  it('slugifies name with special characters', () => {
    expect(generateScreenshotFilename({ name: 'Hello World!' })).toBe('hello-world.png');
  });

  it('handles multiple spaces and special chars', () => {
    expect(generateScreenshotFilename({ name: '  Contact   Form  ' })).toBe('contact-form.png');
  });

  it('includes viewport suffix', () => {
    expect(generateScreenshotFilename({ name: 'Hero', viewport: 'mobile' })).toBe(
      'hero-mobile.png'
    );
  });

  it('includes color scheme suffix', () => {
    expect(generateScreenshotFilename({ name: 'Hero', colorScheme: 'dark' })).toBe('hero-dark.png');
  });

  it('includes both viewport and color scheme', () => {
    expect(
      generateScreenshotFilename({
        name: 'Hero Section',
        viewport: 'tablet',
        colorScheme: 'light',
      })
    ).toBe('hero-section-tablet-light.png');
  });

  it('uses jpg extension for jpeg format', () => {
    expect(generateScreenshotFilename({ name: 'Hero', format: 'jpeg' })).toBe('hero.jpg');
  });

  it('uses png extension by default', () => {
    expect(generateScreenshotFilename({ name: 'Hero', format: 'png' })).toBe('hero.png');
  });

  it('handles viewport with dimensions', () => {
    expect(generateScreenshotFilename({ name: 'Hero', viewport: '1024x768' })).toBe(
      'hero-1024x768.png'
    );
  });

  it('handles very long screenshot names', () => {
    const longName = 'A'.repeat(300);
    const result = generateScreenshotFilename({ name: longName });
    // Should not crash, produces a valid filename
    expect(result).toMatch(/\.png$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles unicode characters in name', () => {
    expect(generateScreenshotFilename({ name: '日本語 Test' })).toBe('test.png');
    expect(generateScreenshotFilename({ name: 'Café Menu' })).toBe('caf-menu.png');
  });

  it('handles empty name gracefully', () => {
    expect(generateScreenshotFilename({ name: '' })).toBe('.png');
  });

  it('handles name with only special characters', () => {
    expect(generateScreenshotFilename({ name: '!@#$%' })).toBe('.png');
  });

  it('handles name with numbers', () => {
    expect(generateScreenshotFilename({ name: 'Page 123' })).toBe('page-123.png');
  });
});
