/**
 * CLI one-shot mode tests
 * Tests the oneshot function with various flag combinations
 * Verifies files are created with correct names and dimensions
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { oneshot } from '../../oneshot';

const TEST_URL = 'https://heroshot.sh/__tests__/toolbar.html';
const TEST_OUTPUT_DIR = path.join(import.meta.dirname, '../../../.test-output');

/** Get image dimensions using sharp */
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

describe('oneshot CLI', () => {
  beforeAll(() => {
    // Create test output directory
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test output directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  describe('full page screenshots', () => {
    it('captures full page with default viewport (desktop 1280x800)', async () => {
      const output = 'full-page-desktop.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Default viewport is 1280x800, scale 1
      expect(dimensions.width).toBe(1280);
    }, 60_000);

    it('captures full page with mobile viewport (375x667)', async () => {
      const output = 'full-page-mobile.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        mobile: true,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(375);
    }, 60_000);

    it('captures full page with tablet viewport (768x1024)', async () => {
      const output = 'full-page-tablet.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        tablet: true,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(768);
    }, 60_000);

    it('captures full page with custom dimensions', async () => {
      const output = 'full-page-custom.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        width: 1024,
        height: 768,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(1024);
    }, 60_000);
  });

  describe('element screenshots', () => {
    it('captures element by selector', async () => {
      const output = 'element-hero.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        selector: ['#hero'],
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Hero section should be captured, not full page
      // Width should be less than or equal to viewport
      expect(dimensions.width).toBeLessThanOrEqual(1280);
      // Height should be reasonable for a hero section
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.height).toBeLessThan(800);
    }, 60_000);

    it('captures element with padding', async () => {
      const output = 'element-hero-padded.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      // First capture without padding
      const resultWithoutPadding = await oneshot({
        url: TEST_URL,
        output: 'element-hero-no-padding.png',
        outputDirectory: TEST_OUTPUT_DIR,
        selector: ['#hero'],
      });

      // Then capture with padding
      const resultWithPadding = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        selector: ['#hero'],
        padding: 20,
      });

      expect(resultWithoutPadding.success).toBe(true);
      expect(resultWithPadding.success).toBe(true);

      const dimWithout = await getImageDimensions(
        path.join(TEST_OUTPUT_DIR, 'element-hero-no-padding.png')
      );
      const dimWith = await getImageDimensions(outputPath);

      // With 20px padding on each side, width should be 40px wider
      expect(dimWith.width).toBe(dimWithout.width + 40);
      expect(dimWith.height).toBe(dimWithout.height + 40);
    }, 60_000);
  });

  describe('color schemes', () => {
    it('captures light mode only', async () => {
      const output = 'color-light.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        light: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(existsSync(outputPath)).toBe(true);
    }, 60_000);

    it('captures dark mode only', async () => {
      const output = 'color-dark.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        dark: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(existsSync(outputPath)).toBe(true);
    }, 60_000);

    it('captures both light and dark with --light --dark flags', async () => {
      const output = 'color-both.png';

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        light: true,
        dark: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);

      // Should create -light and -dark suffixed files
      const lightPath = path.join(TEST_OUTPUT_DIR, 'color-both-light.png');
      const darkPath = path.join(TEST_OUTPUT_DIR, 'color-both-dark.png');

      expect(existsSync(lightPath)).toBe(true);
      expect(existsSync(darkPath)).toBe(true);
    }, 60_000);
  });

  describe('scale factor', () => {
    it('captures with retina (2x) scale', async () => {
      const output = 'scale-retina.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        retina: true,
        mobile: true, // Use mobile for predictable dimensions
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile viewport (375x667) at 2x scale = 750 width
      expect(dimensions.width).toBe(750);
    }, 60_000);

    it('captures with explicit scale factor', async () => {
      const output = 'scale-3x.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        scale: 3,
        width: 400,
        height: 300,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Custom viewport (400x300) at 3x scale = 1200 width
      expect(dimensions.width).toBe(1200);
    }, 60_000);
  });

  describe('output format', () => {
    it('outputs JPEG with quality setting', async () => {
      const output = 'format-jpeg.jpg';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
        quality: 85,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      // Verify it's actually a JPEG
      const metadata = await sharp(outputPath).metadata();
      expect(metadata.format).toBe('jpeg');
    }, 60_000);

    it('outputs PNG by default', async () => {
      const output = 'format-png.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await oneshot({
        url: TEST_URL,
        output,
        outputDirectory: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const metadata = await sharp(outputPath).metadata();
      expect(metadata.format).toBe('png');
    }, 60_000);
  });

  describe('filename generation', () => {
    it('auto-generates filename from URL when not specified', async () => {
      const result = await oneshot({
        url: TEST_URL,
        outputDirectory: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);

      // Generated filename should be based on URL
      const filename = path.basename(result.files[0]!);
      expect(filename).toContain('heroshot');
      expect(filename.endsWith('.png')).toBe(true);
    }, 60_000);
  });

  describe('error handling', () => {
    it('fails gracefully with invalid selector', async () => {
      const result = await oneshot({
        url: TEST_URL,
        output: 'error-invalid-selector.png',
        outputDirectory: TEST_OUTPUT_DIR,
        selector: ['#nonexistent-element-12345'],
        timeout: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error should mention timeout or not found
      expect(result.error?.includes('Timeout') || result.error?.includes('not found')).toBe(true);
    }, 30_000);

    it('fails gracefully with invalid URL', async () => {
      const result = await oneshot({
        url: 'https://this-domain-definitely-does-not-exist-12345.com',
        output: 'error-invalid-url.png',
        outputDirectory: TEST_OUTPUT_DIR,
        timeout: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 30_000);
  });
});
