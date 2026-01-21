import { describe, expect, it } from 'vitest';
import { browserSettingsSchema, screenshotDataSchema, toolbarEventSchema } from '../schema';

describe('screenshotDataSchema', () => {
  const validScreenshot = {
    id: 'test-id',
    name: 'Test Screenshot',
    url: 'https://example.com',
    selector: '.hero',
    createdAt: 1234567890,
  };

  it('validates minimal screenshot data', () => {
    const result = screenshotDataSchema.safeParse(validScreenshot);
    expect(result.success).toBe(true);
  });

  it('validates screenshot with all optional fields', () => {
    const full = {
      ...validScreenshot,
      padding: { top: 10, right: 20, bottom: 30, left: 40 },
      scroll: { x: 100, y: 200 },
      paddingFill: 'solid',
      elementFill: 'transparent',
      textOverrides: { h1: 'Custom Title' },
    };
    const result = screenshotDataSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = screenshotDataSchema.safeParse({ id: 'test' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid paddingFill value', () => {
    const result = screenshotDataSchema.safeParse({
      ...validScreenshot,
      paddingFill: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid elementFill value', () => {
    const result = screenshotDataSchema.safeParse({
      ...validScreenshot,
      elementFill: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('browserSettingsSchema', () => {
  it('validates minimal settings', () => {
    const result = browserSettingsSchema.safeParse({
      viewport: { width: 1280, height: 800 },
    });
    expect(result.success).toBe(true);
  });

  it('validates settings with all optional fields', () => {
    const result = browserSettingsSchema.safeParse({
      viewport: { width: 1920, height: 1080 },
      colorScheme: 'dark',
      deviceScaleFactor: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid colorScheme', () => {
    const result = browserSettingsSchema.safeParse({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'sepia',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing viewport', () => {
    const result = browserSettingsSchema.safeParse({
      colorScheme: 'light',
    });
    expect(result.success).toBe(false);
  });
});

describe('toolbarEventSchema', () => {
  const validScreenshot = {
    id: 'test-id',
    name: 'Test',
    url: 'https://example.com',
    selector: '.hero',
    createdAt: 123,
  };

  it('validates screenshot-added event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'screenshot-added',
      data: validScreenshot,
    });
    expect(result.success).toBe(true);
  });

  it('validates screenshot-updated event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'screenshot-updated',
      data: validScreenshot,
    });
    expect(result.success).toBe(true);
  });

  it('validates screenshot-selected event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'screenshot-selected',
      id: 'test-id',
      url: 'https://example.com',
      selector: '.hero',
    });
    expect(result.success).toBe(true);
  });

  it('validates screenshot-removed event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'screenshot-removed',
      id: 'test-id',
    });
    expect(result.success).toBe(true);
  });

  it('validates settings-updated event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'settings-updated',
      data: {
        viewport: { width: 1280, height: 800 },
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates job-complete event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'job-complete',
    });
    expect(result.success).toBe(true);
  });

  it('validates done event', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'done',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown event type', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'unknown-event',
    });
    expect(result.success).toBe(false);
  });

  it('rejects event with wrong data shape', () => {
    const result = toolbarEventSchema.safeParse({
      type: 'screenshot-added',
      data: { invalid: true },
    });
    expect(result.success).toBe(false);
  });
});
