import { describe, expect, it } from 'vitest';
import { generateFilename } from '../generateFilename';

describe('generateFilename', () => {
  it('generates filename from simple URL', () => {
    expect(generateFilename('https://example.com', 'png')).toBe('example-com.png');
  });

  it('generates filename from URL with path', () => {
    expect(generateFilename('https://example.com/foo/bar', 'png')).toBe('example-com-foo-bar.png');
  });

  it('generates .jpg extension for jpeg format', () => {
    expect(generateFilename('https://example.com/page', 'jpeg')).toBe('example-com-page.jpg');
  });

  it('sanitizes special characters', () => {
    expect(generateFilename('https://my-site.io/path_to/page', 'png')).toBe(
      'my-site-io-path_to-page.png'
    );
  });

  it('collapses multiple dashes', () => {
    expect(generateFilename('https://example.com/foo//bar', 'png')).toBe('example-com-foo-bar.png');
  });

  it('handles URL with query params (ignores them)', () => {
    expect(generateFilename('https://example.com/page?foo=bar', 'png')).toBe(
      'example-com-page.png'
    );
  });

  it('handles URL with port (port is part of host)', () => {
    // Note: URL.hostname excludes port, URL.host includes it
    expect(generateFilename('https://localhost:3000/dashboard', 'png')).toBe(
      'localhost-dashboard.png'
    );
  });

  it('returns fallback for invalid URL', () => {
    expect(generateFilename('not-a-url', 'png')).toBe('screenshot.png');
    expect(generateFilename('not-a-url', 'jpeg')).toBe('screenshot.jpg');
  });

  it('handles root URL without path', () => {
    expect(generateFilename('https://example.com/', 'png')).toBe('example-com.png');
  });
});
