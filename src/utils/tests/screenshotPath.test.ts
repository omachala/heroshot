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

  it('preserves forward slashes as subdirectory paths', () => {
    expect(generateScreenshotFilename({ name: 'registry/login-01' })).toBe('registry/login-01.png');
  });

  it('adds color scheme suffix to filename, not directory', () => {
    expect(generateScreenshotFilename({ name: 'registry/login-01', colorScheme: 'dark' })).toBe(
      'registry/login-01-dark.png'
    );
  });

  it('adds viewport suffix to filename, not directory', () => {
    expect(generateScreenshotFilename({ name: 'examples/dashboard', viewport: 'mobile' })).toBe(
      'examples/dashboard-mobile.png'
    );
  });

  it('handles deeply nested paths', () => {
    expect(
      generateScreenshotFilename({ name: 'docs/static/img/login', colorScheme: 'light' })
    ).toBe('docs/static/img/login-light.png');
  });

  it('handles trailing and leading slashes', () => {
    expect(generateScreenshotFilename({ name: '/registry/login/' })).toBe('registry/login.png');
  });

  it('prepends locale as directory prefix', () => {
    expect(generateScreenshotFilename({ name: 'Home', locale: 'de' })).toBe('de/home.png');
  });

  it('no locale prefix when locale is not set', () => {
    expect(generateScreenshotFilename({ name: 'Home' })).toBe('home.png');
  });

  it('combines locale directory with viewport suffix', () => {
    expect(generateScreenshotFilename({ name: 'Home', locale: 'de', viewport: 'mobile' })).toBe(
      'de/home-mobile.png'
    );
  });

  it('combines locale directory with color scheme suffix', () => {
    expect(generateScreenshotFilename({ name: 'Home', locale: 'fr', colorScheme: 'dark' })).toBe(
      'fr/home-dark.png'
    );
  });

  it('combines locale directory with viewport and color scheme', () => {
    expect(
      generateScreenshotFilename({
        name: 'Home',
        locale: 'de',
        viewport: 'mobile',
        colorScheme: 'dark',
      })
    ).toBe('de/home-mobile-dark.png');
  });

  it('locale directory is outermost prefix, before name subdirectory', () => {
    expect(generateScreenshotFilename({ name: 'docs/home', locale: 'de' })).toBe(
      'de/docs/home.png'
    );
  });
});
