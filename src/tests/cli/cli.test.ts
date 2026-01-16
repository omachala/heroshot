/**
 * CLI integration tests
 * Tests the actual CLI binary with various flag combinations
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

const TEST_URL = 'https://heroshot.sh/__tests__/toolbar.html';
const TEST_OUTPUT_DIR = path.join(import.meta.dirname, '../../../.test-output-cli');
const CLI_PATH = path.join(import.meta.dirname, '../../../dist/cli.js');

/** Run CLI command and return result */
function runCli(args: string): { success: boolean; output: string } {
  try {
    const output = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 60_000,
      cwd: TEST_OUTPUT_DIR,
    });
    return { success: true, output };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string };
    return { success: false, output: execError.stdout ?? execError.stderr ?? '' };
  }
}

/** Get image dimensions using sharp */
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

describe('CLI URL capture', () => {
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
    it('captures full page with default viewport', async () => {
      const output = 'full-page.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      // Use --light to get single file (no color scheme = both light & dark)
      const result = runCli(`${TEST_URL} -o ${output} --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(1280);
    }, 60_000);

    it('captures with mobile viewport', async () => {
      const output = 'mobile.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = runCli(`${TEST_URL} -o ${output} --mobile --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile viewport is 375, but scrollbar width varies by platform
      expect(dimensions.width).toBeGreaterThanOrEqual(375);
      expect(dimensions.width).toBeLessThan(420);
    }, 60_000);

    it('captures with custom dimensions', async () => {
      const output = 'custom.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = runCli(`${TEST_URL} -o ${output} -w 1024 --height 768 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(1024);
    }, 60_000);
  });

  describe('element screenshots', () => {
    it('captures element by selector', async () => {
      const output = 'element.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = runCli(`${TEST_URL} -o ${output} --selector "#hero" --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBeLessThanOrEqual(1280);
      expect(dimensions.height).toBeLessThan(800);
    }, 60_000);

    it('captures element with padding', async () => {
      const output = 'element-padded.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      // First without padding
      runCli(`${TEST_URL} -o element-no-padding.png --selector "#hero" --light`);
      // Then with padding
      const result = runCli(`${TEST_URL} -o ${output} --selector "#hero" -p 20 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimWithout = await getImageDimensions(
        path.join(TEST_OUTPUT_DIR, 'element-no-padding.png')
      );
      const dimWith = await getImageDimensions(outputPath);

      expect(dimWith.width).toBe(dimWithout.width + 40);
      expect(dimWith.height).toBe(dimWithout.height + 40);
    }, 120_000);
  });

  describe('scale factor', () => {
    it('captures with retina scale', async () => {
      const output = 'retina.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = runCli(`${TEST_URL} -o ${output} --mobile --retina --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile (375) at 2x = 750, but scrollbar width varies by platform
      expect(dimensions.width).toBeGreaterThanOrEqual(750);
      expect(dimensions.width).toBeLessThan(840);
    }, 60_000);
  });

  describe('output format', () => {
    it('outputs JPEG with quality setting', async () => {
      const output = 'format.jpg';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = runCli(`${TEST_URL} -o ${output} -q 85 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const metadata = await sharp(outputPath).metadata();
      expect(metadata.format).toBe('jpeg');
    }, 60_000);
  });

  describe('filename generation', () => {
    it('auto-generates filename from URL', async () => {
      const result = runCli(TEST_URL);

      expect(result.success).toBe(true);

      // Should create a file with heroshot in the name
      const files = require('node:fs')
        .readdirSync(TEST_OUTPUT_DIR)
        .filter((f: string) => f.includes('heroshot'));
      expect(files.length).toBeGreaterThan(0);
    }, 60_000);
  });
});
