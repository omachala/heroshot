/**
 * Visual regression tests for CLI screenshots
 * Compares captured screenshots against stored baselines using pixelmatch
 */
import { exec } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compareToBaseline } from './visual-regression';

const execAsync = promisify(exec);

const TEST_URL = 'https://heroshot.sh/__tests__/toolbar.html';
const TEST_OUTPUT_DIR = path.join(import.meta.dirname, '../../../.test-output-visual');
const CLI_PATH = path.join(import.meta.dirname, '../../../dist/cli/cli.js');

/** Run CLI command and return result */
async function runCli(args: string): Promise<{ success: boolean; output: string }> {
  try {
    // eslint-disable-next-line sonarjs/os-command -- Test file with controlled inputs
    const { stdout } = await execAsync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 60_000,
      cwd: TEST_OUTPUT_DIR,
    });
    return { success: true, output: stdout };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string };
    return { success: false, output: execError.stdout ?? execError.stderr ?? '' };
  }
}

describe('Visual regression tests', () => {
  beforeAll(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  it('full page screenshot matches baseline', async () => {
    const output = 'visual-fullpage.png';
    const outputPath = path.join(TEST_OUTPUT_DIR, output);

    const result = await runCli(`${TEST_URL} -o ${output} --light`);
    expect(result.success).toBe(true);
    expect(existsSync(outputPath)).toBe(true);

    const comparison = compareToBaseline(outputPath, 'fullpage-light');

    if (comparison.isNewBaseline) {
      console.log(`Created new baseline: ${comparison.baselinePath}`);
    }

    expect(comparison.match).toBe(true);
    if (!comparison.match) {
      console.log(`Diff pixels: ${comparison.diffPixels}`);
      if (comparison.diffPath) {
        console.log(`Diff saved to: ${comparison.diffPath}`);
      }
    }
  }, 60_000);

  it('element screenshot matches baseline', async () => {
    const output = 'visual-element.png';
    const outputPath = path.join(TEST_OUTPUT_DIR, output);

    const result = await runCli(`${TEST_URL} -o ${output} --selector "#test-form" --light`);
    expect(result.success).toBe(true);
    expect(existsSync(outputPath)).toBe(true);

    const comparison = compareToBaseline(outputPath, 'element-form');

    if (comparison.isNewBaseline) {
      console.log(`Created new baseline: ${comparison.baselinePath}`);
    }

    expect(comparison.match).toBe(true);
    if (!comparison.match) {
      console.log(`Diff pixels: ${comparison.diffPixels}`);
      if (comparison.diffPath) {
        console.log(`Diff saved to: ${comparison.diffPath}`);
      }
    }
  }, 60_000);

  it('mobile viewport matches baseline', async () => {
    const output = 'visual-mobile.png';
    const outputPath = path.join(TEST_OUTPUT_DIR, output);

    const result = await runCli(`${TEST_URL} -o ${output} --mobile --light`);
    expect(result.success).toBe(true);
    expect(existsSync(outputPath)).toBe(true);

    const comparison = compareToBaseline(outputPath, 'mobile-light');

    if (comparison.isNewBaseline) {
      console.log(`Created new baseline: ${comparison.baselinePath}`);
    }

    expect(comparison.match).toBe(true);
    if (!comparison.match) {
      console.log(`Diff pixels: ${comparison.diffPixels}`);
      if (comparison.diffPath) {
        console.log(`Diff saved to: ${comparison.diffPath}`);
      }
    }
  }, 60_000);
});
