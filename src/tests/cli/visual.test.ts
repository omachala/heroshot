/**
 * Visual regression tests for CLI screenshots
 * Runs heroshot with test config and compares output against baselines.
 *
 * Note: These tests run only on CI for consistent font rendering.
 * Baselines are generated via the "Update Visual Baselines" workflow.
 */
import { exec } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compareToBaseline } from './visual-regression';

const execAsync = promisify(exec);

/** Visual tests only run on CI for consistent font rendering */
const isCI = process.env['CI'] === 'true';

const TEST_DIR = import.meta.dirname;
const HEROSHOTS_DIR = path.join(TEST_DIR, 'heroshots');
const CLI_PATH = path.join(TEST_DIR, '../../../dist/cli/cli.js');

/** Run heroshot CLI with test config */
async function runHeroshot(): Promise<{ success: boolean; output: string }> {
  try {
    // eslint-disable-next-line sonarjs/os-command -- Test file with controlled inputs
    const { stdout } = await execAsync(`node ${CLI_PATH}`, {
      encoding: 'utf8',
      timeout: 120_000,
      cwd: TEST_DIR,
    });
    return { success: true, output: stdout };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string };
    return { success: false, output: execError.stdout ?? execError.stderr ?? '' };
  }
}

/** Assert visual comparison result */
function assertComparison(
  comparison: ReturnType<typeof compareToBaseline>,
  baselineName: string
): void {
  if (comparison.baselineMissing) {
    throw new Error(
      `Baseline missing: ${comparison.baselinePath}\n` +
        `Run the "Update Visual Baselines" workflow to generate the "${baselineName}" baseline.`
    );
  }

  if (comparison.isNewBaseline) {
    console.log(`Updated baseline: ${comparison.baselinePath}`);
  }

  if (!comparison.match) {
    console.log(`Diff pixels: ${comparison.diffPixels}`);
    if (comparison.diffPath) {
      console.log(`Diff saved to: ${comparison.diffPath}`);
    }
  }

  expect(comparison.match).toBe(true);
}

describe('Visual regression tests', () => {
  beforeAll(async () => {
    // Clean up previous heroshots
    if (existsSync(HEROSHOTS_DIR)) {
      rmSync(HEROSHOTS_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up heroshots after tests (keep for debugging if needed)
    // if (existsSync(HEROSHOTS_DIR)) {
    //   rmSync(HEROSHOTS_DIR, { recursive: true });
    // }
  });

  it.skipIf(!isCI)(
    'heroshot generates screenshots matching baselines',
    async () => {
      // Run heroshot with test config
      const result = await runHeroshot();
      expect(result.success).toBe(true);
      expect(existsSync(HEROSHOTS_DIR)).toBe(true);

      // Get all generated screenshots
      const screenshots = readdirSync(HEROSHOTS_DIR).filter(f => f.endsWith('.png'));
      expect(screenshots.length).toBeGreaterThan(0);

      // Compare each screenshot against its baseline
      for (const screenshot of screenshots) {
        const screenshotPath = path.join(HEROSHOTS_DIR, screenshot);
        const baselineName = screenshot.replace('.png', '');
        const comparison = compareToBaseline(screenshotPath, baselineName);
        assertComparison(comparison, baselineName);
      }
    },
    120_000
  );
});
