import { describe, expect, it } from 'vitest';
import { configToScreenshotData } from '../configToScreenshotData';
import type { Screenshot } from '../../types';

describe('configToScreenshotData', () => {
  it('converts empty array', () => {
    const result = configToScreenshotData([]);
    expect(result).toEqual([]);
  });

  it('converts basic screenshot', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test-id',
        name: 'Test Screenshot',
        url: 'https://example.com',
        selector: '.hero',
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result).toEqual([
      {
        id: 'test-id',
        name: 'Test Screenshot',
        url: 'https://example.com',
        selector: '.hero',
        createdAt: 0,
      },
    ]);
  });

  it('uses index as createdAt for ordering', () => {
    const screenshots: Screenshot[] = [
      { id: 'first', name: 'First', url: 'https://example.com/1', selector: '' },
      { id: 'second', name: 'Second', url: 'https://example.com/2', selector: '' },
      { id: 'third', name: 'Third', url: 'https://example.com/3', selector: '' },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.createdAt).toBe(0);
    expect(result[1]?.createdAt).toBe(1);
    expect(result[2]?.createdAt).toBe(2);
  });

  it('defaults undefined selector to empty string', () => {
    const screenshots = [{ id: 'test', name: 'Test', url: 'https://example.com' }] as Screenshot[];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.selector).toBe('');
  });

  it('preserves padding', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        selector: '',
        padding: { top: 10, right: 20, bottom: 30, left: 40 },
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.padding).toEqual({ top: 10, right: 20, bottom: 30, left: 40 });
  });

  it('preserves scroll', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        selector: '',
        scroll: { x: 100, y: 200 },
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.scroll).toEqual({ x: 100, y: 200 });
  });

  it('preserves paddingFill', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        selector: '',
        paddingFill: 'transparent',
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.paddingFill).toBe('transparent');
  });

  it('preserves elementFill', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        selector: '',
        elementFill: 'solid',
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.elementFill).toBe('solid');
  });

  it('preserves textOverrides', () => {
    const screenshots: Screenshot[] = [
      {
        id: 'test',
        name: 'Test',
        url: 'https://example.com',
        selector: '',
        textOverrides: { h1: 'Custom Title' },
      },
    ];
    const result = configToScreenshotData(screenshots);
    expect(result[0]?.textOverrides).toEqual({ h1: 'Custom Title' });
  });
});
