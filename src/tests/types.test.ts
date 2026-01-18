import { describe, it, expect } from 'vitest';
import type { Config, Screenshot } from '../types';

describe('types', () => {
  it('should allow valid screenshot definition', () => {
    const screenshot: Screenshot = {
      id: 'test',
      name: 'Test Screenshot',
      url: 'http://localhost:3000',
      selector: '.main',
    };

    expect(screenshot.id).toBe('test');
    expect(screenshot.url).toBe('http://localhost:3000');
  });

  it('should allow config with multiple screenshots', () => {
    const config: Config = {
      outputDirectory: './screenshots',
      jpegQuality: 80,
      screenshots: [
        { id: 'one', name: 'One', url: 'http://localhost:3000' },
        { id: 'two', name: 'Two', url: 'http://localhost:3000/page' },
      ],
    };

    expect(config.screenshots).toHaveLength(2);
  });

  it('should allow browser settings', () => {
    const config: Config = {
      outputDirectory: '.',
      jpegQuality: 80,
      browser: {
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
      },
      screenshots: [],
    };

    expect(config.browser?.viewport?.width).toBe(1920);
    expect(config.browser?.colorScheme).toBe('dark');
  });
});
