import { describe, it, expect } from 'vitest';
import type { HeroshotConfig, ScreenshotDefinition } from '../src/types.js';

describe('types', () => {
  it('should allow valid screenshot definition', () => {
    const definition: ScreenshotDefinition = {
      id: 'test',
      url: 'http://localhost:3000',
      output: 'test.png',
      selector: '.main',
    };

    expect(definition.id).toBe('test');
    expect(definition.url).toBe('http://localhost:3000');
  });

  it('should allow config with multiple screenshots', () => {
    const config: HeroshotConfig = {
      screenshots: [
        { id: 'one', url: 'http://localhost:3000', output: 'one.png' },
        { id: 'two', file: 'src/index.ts', lines: [1, 10], output: 'two.png' },
      ],
    };

    expect(config.screenshots).toHaveLength(2);
  });

  it('should allow beautify options', () => {
    const definition: ScreenshotDefinition = {
      id: 'styled',
      url: 'http://localhost:3000',
      output: 'styled.png',
      beautify: {
        shadow: true,
        radius: 12,
        background: '#1a1a2e',
        padding: 16,
      },
    };

    expect(definition.beautify?.shadow).toBe(true);
    expect(definition.beautify?.radius).toBe(12);
  });
});
