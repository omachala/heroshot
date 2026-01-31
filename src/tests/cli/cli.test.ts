/**
 * CLI integration tests
 * Tests the actual CLI binary with various flag combinations
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

const TEST_URL = 'https://heroshot.sh/__tests__/toolbar.html';
const TEST_OUTPUT_DIR = path.join(import.meta.dirname, '../../../.test-output-cli');
const CLI_PATH = path.join(import.meta.dirname, '../../../dist/cli/cli.js');

/** Run CLI command and return result */
async function runCli(
  args: string,
  cwd: string = TEST_OUTPUT_DIR
): Promise<{ success: boolean; output: string }> {
  try {
    // eslint-disable-next-line sonarjs/os-command -- Test file with controlled inputs
    const { stdout } = await execAsync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      timeout: 60_000,
      cwd,
    });
    return { success: true, output: stdout };
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

describe.concurrent('CLI URL capture', () => {
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
      const result = await runCli(`${TEST_URL} -o ${output} --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(1280);
    }, 60_000);

    it('captures with mobile viewport', async () => {
      const output = 'mobile.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --mobile --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile viewport is 430, but scrollbar width varies by platform
      expect(dimensions.width).toBeGreaterThanOrEqual(430);
      expect(dimensions.width).toBeLessThan(475);
    }, 60_000);

    it('captures with custom dimensions', async () => {
      const output = 'custom.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} -w 1024 --height 768 --light`);

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

      const result = await runCli(`${TEST_URL} -o ${output} --selector "#hero" --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBeLessThanOrEqual(1280);
      expect(dimensions.height).toBeLessThan(800);
    }, 60_000);

    it('captures element with padding', async () => {
      const testId = Date.now() + '-' + Math.random().toString(36).slice(2);
      const outputNoPad = `element-no-padding-${testId}.png`;
      const outputPadded = `element-padded-${testId}.png`;
      const outputPathNoPad = path.join(TEST_OUTPUT_DIR, outputNoPad);
      const outputPathPadded = path.join(TEST_OUTPUT_DIR, outputPadded);

      // First without padding
      await runCli(`${TEST_URL} -o ${outputNoPad} --selector "#hero" --light`);
      // Then with padding
      const result = await runCli(
        `${TEST_URL} -o ${outputPadded} --selector "#hero" -p 20 --light`
      );

      expect(result.success).toBe(true);
      expect(existsSync(outputPathPadded)).toBe(true);

      const dimWithout = await getImageDimensions(outputPathNoPad);
      const dimWith = await getImageDimensions(outputPathPadded);

      expect(dimWith.width).toBe(dimWithout.width + 40);
      expect(dimWith.height).toBe(dimWithout.height + 40);
    }, 120_000);
  });

  describe('scale factor', () => {
    it('captures with retina scale', async () => {
      const output = 'retina.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --mobile --retina --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile (430) at 2x = 860, but scrollbar width varies by platform
      expect(dimensions.width).toBeGreaterThanOrEqual(860);
      expect(dimensions.width).toBeLessThan(950);
    }, 60_000);
  });

  describe('output format', () => {
    it('outputs JPEG with quality setting', async () => {
      const output = 'format.jpg';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} -q 85 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const metadata = await sharp(outputPath).metadata();
      expect(metadata.format).toBe('jpeg');
    }, 60_000);
  });

  describe('filename generation', () => {
    it('auto-generates filename from URL', async () => {
      const result = await runCli(TEST_URL);

      expect(result.success).toBe(true);

      // Should create a file with heroshot in the name
      const files = readdirSync(TEST_OUTPUT_DIR).filter((f: string) => f.includes('heroshot'));
      expect(files.length).toBeGreaterThan(0);
    }, 60_000);
  });

  describe('viewport presets', () => {
    it('captures with tablet viewport (768x1024)', async () => {
      const output = 'tablet.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --tablet --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Tablet viewport is 768
      expect(dimensions.width).toBeGreaterThanOrEqual(768);
      expect(dimensions.width).toBeLessThan(820);
    }, 60_000);

    it('captures with desktop viewport (1280x800)', async () => {
      const output = 'desktop.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --desktop --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(1280);
    }, 60_000);
  });

  describe('color scheme', () => {
    it('captures dark mode only with --dark flag', async () => {
      const output = 'dark-only.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --dark`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);
      // Should NOT create a -light variant
      expect(existsSync(path.join(TEST_OUTPUT_DIR, 'dark-only-light.png'))).toBe(false);
    }, 60_000);

    it('captures both light and dark variants when both flags specified', async () => {
      const result = await runCli(`${TEST_URL} -o both-schemes.png --light --dark`);

      expect(result.success).toBe(true);
      // Should create both variants with suffixes
      expect(existsSync(path.join(TEST_OUTPUT_DIR, 'both-schemes-light.png'))).toBe(true);
      expect(existsSync(path.join(TEST_OUTPUT_DIR, 'both-schemes-dark.png'))).toBe(true);
    }, 60_000);
  });

  describe('scale factor', () => {
    it('captures with --scale 1 (standard DPI)', async () => {
      const output = 'scale-1.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --mobile --scale 1 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile (430) at 1x
      expect(dimensions.width).toBeGreaterThanOrEqual(430);
      expect(dimensions.width).toBeLessThan(475);
    }, 60_000);

    it('captures with --scale 3 (high DPI)', async () => {
      const output = 'scale-3.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --mobile --scale 3 --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Mobile (430) at 3x = 1290
      expect(dimensions.width).toBeGreaterThanOrEqual(1290);
      expect(dimensions.width).toBeLessThan(1425);
    }, 60_000);
  });

  describe('capture modes', () => {
    it('captures viewport only with --viewport-only', async () => {
      const output = 'viewport-only.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --viewport-only --light`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Default viewport is 1280x800, so height should be exactly 800
      expect(dimensions.width).toBe(1280);
      expect(dimensions.height).toBe(800);
    }, 60_000);
  });

  describe('global options', () => {
    it('shows version with --version', async () => {
      const result = await runCli('--version');

      expect(result.success).toBe(true);
      const version = result.output.trim();
      // Version should be a semver-like string
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
      // Must not be fallback 0.0.0 - indicates broken version detection
      expect(version).not.toBe('0.0.0');
    });

    it('shows verbose output with -v flag', async () => {
      const output = 'verbose-test.png';

      const result = await runCli(`${TEST_URL} -o ${output} --light -v`);

      expect(result.success).toBe(true);
      // Verbose output should contain additional details
      expect(result.output).toContain('heroshot');
    }, 60_000);
  });

  describe('error handling', () => {
    it('fails gracefully with invalid selector', async () => {
      const result = await runCli(
        `${TEST_URL} -o invalid-selector.png --selector "#nonexistent-element-xyz" --light`
      );

      // Should fail (element not found)
      expect(result.success).toBe(false);
    }, 60_000);
  });

  describe('flag combinations', () => {
    it('combines tablet + retina + dark mode', async () => {
      const output = 'combo-tablet-retina-dark.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(`${TEST_URL} -o ${output} --tablet --retina --dark`);

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      // Tablet (768) at 2x = 1536
      expect(dimensions.width).toBeGreaterThanOrEqual(1536);
      expect(dimensions.width).toBeLessThan(1640);
    }, 60_000);

    it('combines selector + padding + mobile', async () => {
      const output = 'combo-selector-padding-mobile.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(
        `${TEST_URL} -o ${output} --selector "#hero" -p 10 --mobile --light`
      );

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      // Element should be captured with padding on mobile viewport
      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBeLessThanOrEqual(450); // 430 + 20 padding
    }, 60_000);

    it('combines viewport-only + custom dimensions', async () => {
      const output = 'combo-viewport-custom.png';
      const outputPath = path.join(TEST_OUTPUT_DIR, output);

      const result = await runCli(
        `${TEST_URL} -o ${output} --viewport-only -w 800 --height 600 --light`
      );

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    }, 60_000);
  });

  describe('config integration', () => {
    it('saves screenshot to config with --save flag', async () => {
      const testId = Date.now() + '-' + Math.random().toString(36).slice(2);
      const testDir = path.join(TEST_OUTPUT_DIR, `save-test-${testId}`);
      const configDir = path.join(testDir, '.heroshot');
      const configPath = path.join(configDir, 'config.json');
      mkdirSync(testDir, { recursive: true });

      const result = await runCli(
        `${TEST_URL} -o save-test.png --selector "#hero" --light --save`,
        testDir
      );

      expect(result.success).toBe(true);
      expect(existsSync(configPath)).toBe(true);

      // Verify config contains the screenshot
      const config = JSON.parse(require('node:fs').readFileSync(configPath, 'utf8'));
      expect(config.screenshots).toHaveLength(1);
      expect(config.screenshots[0].url).toBe(TEST_URL);
      expect(config.screenshots[0].selector).toBe('#hero');
    }, 60_000);

    it('uses custom config path with -c flag', async () => {
      const testId = Date.now() + '-' + Math.random().toString(36).slice(2);
      // Create a unique .heroshot subdirectory to mimic standard structure
      const heroshotDir = path.join(TEST_OUTPUT_DIR, `.heroshot-custom-${testId}`);
      mkdirSync(heroshotDir, { recursive: true });
      const customConfigPath = path.join(heroshotDir, 'config.json');

      // Create a minimal config file with colorScheme set to light (sync mode uses config's colorScheme)
      const config = {
        outputDirectory: 'custom-output',
        browser: {
          colorScheme: 'light',
        },
        screenshots: [
          {
            id: 'test-1',
            name: 'custom-config-test',
            url: TEST_URL,
          },
        ],
      };
      writeFileSync(customConfigPath, JSON.stringify(config, null, 2));

      // Run sync with custom config
      const result = await runCli(`-c ${customConfigPath}`);

      // Should succeed and create the screenshot in outputDirectory relative to project root
      expect(result.success).toBe(true);
      expect(
        existsSync(path.join(TEST_OUTPUT_DIR, 'custom-output', 'custom-config-test.png'))
      ).toBe(true);
    }, 60_000);

    it('errors when custom config file not found', async () => {
      const result = await runCli('-c nonexistent-config.json');

      expect(result.success).toBe(false);
      expect(result.output).toContain('not found');
    });
  });

  describe('actions', () => {
    it('executes actions before capturing screenshot', async () => {
      const testId = `actions-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const actionsConfigDir = path.join(TEST_OUTPUT_DIR, `.heroshot-${testId}`);
      const actionsConfigPath = path.join(actionsConfigDir, 'config.json');
      const actionsOutputDir = path.join(TEST_OUTPUT_DIR, `output-${testId}`);
      mkdirSync(actionsConfigDir, { recursive: true });

      const config = {
        outputDirectory: actionsOutputDir,
        browser: { colorScheme: 'light' },
        screenshots: [
          {
            id: 'actions-test',
            name: 'actions-result',
            url: TEST_URL,
            selector: '#test-form',
            actions: [
              { type: 'click', selector: '#primary-btn' },
              { type: 'type', selector: '#username', text: 'heroshot-user' },
              { type: 'type', selector: '#email', text: 'test@heroshot.sh' },
              { type: 'select_option', selector: '#country', values: ['cz'] },
              { type: 'press_key', key: 'Tab' },
              {
                type: 'evaluate',
                selector: '#message',
                function: "(el) => { el.value = 'Actions work!' }",
              },
            ],
          },
        ],
      };
      writeFileSync(actionsConfigPath, JSON.stringify(config, null, 2));

      const result = await runCli(`-c ${actionsConfigPath}`);

      expect(result.success).toBe(true);
      const outputPath = path.join(actionsOutputDir, 'actions-result.png');
      expect(existsSync(outputPath)).toBe(true);

      // Verify we got a reasonable element screenshot
      const dimensions = await getImageDimensions(outputPath);
      expect(dimensions.width).toBeGreaterThan(100);
      expect(dimensions.height).toBeGreaterThan(50);
    }, 60_000);

    it('reports failure when action targets missing element', async () => {
      const testId = `actions-fail-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const actionsConfigDir = path.join(TEST_OUTPUT_DIR, `.heroshot-${testId}`);
      const actionsConfigPath = path.join(actionsConfigDir, 'config.json');
      const actionsOutputDir = path.join(TEST_OUTPUT_DIR, `output-${testId}`);
      mkdirSync(actionsConfigDir, { recursive: true });

      const config = {
        outputDirectory: actionsOutputDir,
        browser: { colorScheme: 'light' },
        screenshots: [
          {
            id: 'actions-fail',
            name: 'actions-fail',
            url: TEST_URL,
            actions: [{ type: 'click', selector: '#nonexistent-element' }],
          },
        ],
      };
      writeFileSync(actionsConfigPath, JSON.stringify(config, null, 2));

      const result = await runCli(`-c ${actionsConfigPath}`);

      // CLI exits with non-zero when any screenshot fails
      expect(result.success).toBe(false);
    }, 120_000);
  });

  describe('snippet command', () => {
    const snippetConfigDir = path.join(TEST_OUTPUT_DIR, '.heroshot-snippet');
    const snippetConfigPath = path.join(snippetConfigDir, 'config.json');

    beforeAll(() => {
      // Create config with test screenshots
      if (!existsSync(snippetConfigDir)) {
        mkdirSync(snippetConfigDir, { recursive: true });
      }
      const config = {
        outputDirectory: 'heroshots',
        screenshots: [
          { id: 'abc123', name: 'Dashboard', url: 'https://example.com/dashboard' },
          { id: 'def456', name: 'Hero Section', url: 'https://example.com' },
          { id: 'ghi789', name: 'Settings Panel', url: 'https://example.com/settings' },
        ],
      };
      writeFileSync(snippetConfigPath, JSON.stringify(config, null, 2));
    });

    it('shows help for snippet command', async () => {
      const result = await runCli('snippet --help');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Generate markdown/HTML snippets');
    });

    it('generates snippets for all screenshots when no pattern', async () => {
      const result = await runCli(`snippet -c ${snippetConfigPath}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Dashboard');
      expect(result.output).toContain('Hero Section');
      expect(result.output).toContain('Settings Panel');
    });

    it('filters screenshots by name pattern', async () => {
      const result = await runCli(`snippet dashboard -c ${snippetConfigPath}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Dashboard');
      expect(result.output).not.toContain('Hero Section');
      expect(result.output).not.toContain('Settings Panel');
    });

    it('filters screenshots by id', async () => {
      const result = await runCli(`snippet ghi789 -c ${snippetConfigPath}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Settings Panel');
      expect(result.output).not.toContain('Dashboard');
    });

    it('generates <picture> element for light/dark variants', async () => {
      const result = await runCli(`snippet dashboard -c ${snippetConfigPath}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('<picture>');
      expect(result.output).toContain('prefers-color-scheme: dark');
      expect(result.output).toContain('dashboard-light.png');
      expect(result.output).toContain('dashboard-dark.png');
    });

    it('uses custom path prefix', async () => {
      const result = await runCli(
        `snippet dashboard -c ${snippetConfigPath} --path-prefix ./images/`
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain('./images/dashboard-light.png');
    });

    it('fails when no config exists', async () => {
      const result = await runCli('snippet -c nonexistent.json');
      expect(result.success).toBe(false);
      expect(result.output).toContain('not found');
    });

    it('fails when no screenshots match pattern', async () => {
      const result = await runCli(`snippet nonexistent -c ${snippetConfigPath}`);
      expect(result.success).toBe(false);
      expect(result.output).toContain('No screenshots matching');
    });
  });
});
