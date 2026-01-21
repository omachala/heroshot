import { describe, expect, it } from 'vitest';
import { toConfigScreenshot } from '../toConfigScreenshot';
import type { ScreenshotData } from '../types';

describe('toConfigScreenshot', () => {
  const baseData: ScreenshotData = {
    id: 'test-id',
    name: 'Test Screenshot',
    url: 'https://example.com',
    selector: '.hero',
    createdAt: 1234567890,
  };

  it('converts basic screenshot data', () => {
    const result = toConfigScreenshot(baseData);
    expect(result).toEqual({
      id: 'test-id',
      name: 'Test Screenshot',
      url: 'https://example.com',
      selector: '.hero',
    });
  });

  it('excludes createdAt from config', () => {
    const result = toConfigScreenshot(baseData);
    expect(result).not.toHaveProperty('createdAt');
  });

  it('includes padding when present', () => {
    const data: ScreenshotData = {
      ...baseData,
      padding: { top: 10, right: 20, bottom: 30, left: 40 },
    };
    const result = toConfigScreenshot(data);
    expect(result.padding).toEqual({ top: 10, right: 20, bottom: 30, left: 40 });
  });

  it('includes scroll when present', () => {
    const data: ScreenshotData = {
      ...baseData,
      scroll: { x: 100, y: 200 },
    };
    const result = toConfigScreenshot(data);
    expect(result.scroll).toEqual({ x: 100, y: 200 });
  });

  it('includes paddingFill when present', () => {
    const data: ScreenshotData = {
      ...baseData,
      paddingFill: 'solid',
    };
    const result = toConfigScreenshot(data);
    expect(result.paddingFill).toBe('solid');
  });

  it('includes elementFill when present', () => {
    const data: ScreenshotData = {
      ...baseData,
      elementFill: 'transparent',
    };
    const result = toConfigScreenshot(data);
    expect(result.elementFill).toBe('transparent');
  });

  it('includes textOverrides when non-empty', () => {
    const data: ScreenshotData = {
      ...baseData,
      textOverrides: { h1: 'New Title' },
    };
    const result = toConfigScreenshot(data);
    expect(result.textOverrides).toEqual({ h1: 'New Title' });
  });

  it('excludes empty textOverrides', () => {
    const data: ScreenshotData = {
      ...baseData,
      textOverrides: {},
    };
    const result = toConfigScreenshot(data);
    expect(result).not.toHaveProperty('textOverrides');
  });

  it('excludes undefined optional fields', () => {
    const result = toConfigScreenshot(baseData);
    expect(result).not.toHaveProperty('padding');
    expect(result).not.toHaveProperty('scroll');
    expect(result).not.toHaveProperty('paddingFill');
    expect(result).not.toHaveProperty('elementFill');
    expect(result).not.toHaveProperty('textOverrides');
  });
});
