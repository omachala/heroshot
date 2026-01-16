import { describe, expect, it } from 'vitest';
import { addSuffix } from '../addSuffix';

describe('addSuffix', () => {
  it('adds suffix before extension', () => {
    expect(addSuffix('output.png', '-dark')).toBe('output-dark.png');
  });

  it('handles different extensions', () => {
    expect(addSuffix('photo.jpg', '-light')).toBe('photo-light.jpg');
    expect(addSuffix('image.jpeg', '-mobile')).toBe('image-mobile.jpeg');
  });

  it('handles files with directory path', () => {
    expect(addSuffix('screenshots/hero.png', '-dark')).toBe('screenshots/hero-dark.png');
  });

  it('handles nested directory paths', () => {
    expect(addSuffix('docs/images/hero.png', '-tablet')).toBe('docs/images/hero-tablet.png');
  });

  it('handles files without extension', () => {
    expect(addSuffix('README', '-backup')).toBe('README-backup');
  });

  it('handles empty suffix', () => {
    expect(addSuffix('output.png', '')).toBe('output.png');
  });

  it('handles filenames with dots', () => {
    expect(addSuffix('hero.section.png', '-dark')).toBe('hero.section-dark.png');
  });

  it('handles current directory prefix', () => {
    expect(addSuffix('./output.png', '-dark')).toBe('output-dark.png');
  });
});
