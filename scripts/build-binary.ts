#!/usr/bin/env bun

/**
 * Bun compile build script for heroshot
 * Creates standalone binaries for multiple platforms
 *
 * Usage:
 *   bun run scripts/build-binary.ts           # Build all platforms
 *   bun run scripts/build-binary.ts --single  # Build current platform only
 */

import path from 'node:path';
import { $ } from 'bun';
import type { BunPlugin } from 'bun';
import pkg from '../package.json';

/**
 * Bun plugin to patch Playwright's resolution of its own bundled JSON files.
 *
 * Playwright reads files relative to its install dir at module-load time:
 *   const packageRoot = path.join(__dirname, "..");
 *   require(path.join(packageRoot, "package.json"))   // its version
 *   new Registry(require(path.join(packageRoot, "browsers.json")))  // browser registry
 * When Bun compiles to a standalone binary, `__dirname` is frozen to the build
 * machine's absolute path (e.g. `/home/runner/work/...`). That path does not
 * exist on the end user's machine, so the binary crashes on startup with:
 *   "Cannot find module '.../playwright-core/<file>' from '/$bunfs/root/cli.js'"
 *
 * Fix: replace those eager requires with the file contents inlined at build
 * time, read dynamically from the installed playwright-core so they can never
 * drift out of sync with the dependency. Only `packageJSON.version` is read
 * anywhere in the library, so a `{ version }` stub is enough for package.json;
 * browsers.json needs its full content (it drives browser downloads).
 *
 * Note: `api.json` is also resolved this way (lib/coreBundle.js printApiJson),
 * but only from an internal debug command that never runs at startup and the
 * file isn't even shipped - so it's intentionally left alone.
 */

// Files in playwright-core/lib that resolve bundled JSON from packageRoot.
const PW_PATCH_FILES = /playwright-core[\\/]lib[\\/](package|serverRegistry|coreBundle)\.js$/;

// Matches: require(<ident>[.default].join(packageRoot, "<name>.json"))
// Anchored on `packageRoot` so runtime paths (linkTarget, referenceDir) are untouched.
const pwRequireFromRoot = (jsonName: string): RegExp =>
  new RegExp(
    `require\\(\\s*\\w+(?:\\.default)?\\.join\\(\\s*packageRoot\\s*,\\s*["']${jsonName}\\.json["']\\s*\\)\\s*\\)`,
    'g'
  );

const PW_REQUIRE_PACKAGE = pwRequireFromRoot('package');
const PW_REQUIRE_BROWSERS = pwRequireFromRoot('browsers');

/** Read a bundled JSON file from playwright-core's root, given a lib file's path. */
async function readPlaywrightJson(libFilePath: string, name: string): Promise<unknown> {
  // .../playwright-core/lib/<file>.js -> .../playwright-core/<name>
  const jsonPath = path.resolve(path.dirname(libFilePath), '..', name);
  return JSON.parse(await Bun.file(jsonPath).text());
}

function isRecord(value: unknown): value is { version: unknown } {
  return typeof value === 'object' && value !== null;
}

const playwrightPatchPlugin: BunPlugin = {
  name: 'playwright-patch',
  setup(build) {
    build.onLoad({ filter: PW_PATCH_FILES }, async args => {
      const original = await Bun.file(args.path).text();
      const pkg = await readPlaywrightJson(args.path, 'package.json');
      const version = isRecord(pkg) ? pkg.version : undefined;

      let contents = original.replaceAll(PW_REQUIRE_PACKAGE, `({ version: "${version}" })`);

      // browsers.json only appears in coreBundle.js; inline its full content there.
      // Plain substring gate (no stateful regex .test()) - the replaceAll regex is
      // anchored on packageRoot, so the runtime linkTarget read is left untouched.
      if (original.includes('browsers.json')) {
        const browsers = await readPlaywrightJson(args.path, 'browsers.json');
        contents = contents.replaceAll(PW_REQUIRE_BROWSERS, `(${JSON.stringify(browsers)})`);
      }

      // Fail loud if the upstream layout changed and our patch matched nothing.
      // This is what previously broke silently across a playwright upgrade.
      if (contents === original) {
        throw new Error(
          `playwright-patch: no packageRoot JSON require found in ${path.basename(args.path)}. ` +
            `Playwright internals likely changed - update the patterns in build-binary.ts.`
        );
      }
      return { contents, loader: 'js' };
    });
  },
};

// Use Bun's built-in import.meta.dirname for cross-platform support
const rootDir = path.resolve(import.meta.dirname, '..');

process.chdir(rootDir);

const singleFlag = process.argv.includes('--single');
// --target flag allows cross-compilation (e.g., --target=darwin-x64)
const targetArg = process.argv.find(arg => arg.startsWith('--target='));
const explicitTarget = targetArg?.split('=')[1];

// Target platforms for distribution
const allTargets: Array<{
  os: string;
  arch: 'arm64' | 'x64';
}> = [
  { os: 'linux', arch: 'arm64' },
  { os: 'linux', arch: 'x64' },
  { os: 'darwin', arch: 'arm64' },
  { os: 'darwin', arch: 'x64' },
  { os: 'win32', arch: 'x64' },
];

// Determine which targets to build
let targets: typeof allTargets;
if (explicitTarget) {
  // Cross-compile for explicit target (e.g., darwin-x64)
  const [os, arch] = explicitTarget.split('-');
  const osMap: Record<string, string> = { linux: 'linux', darwin: 'darwin', windows: 'win32' };
  targets = allTargets.filter(item => item.os === (osMap[os] ?? os) && item.arch === arch);
} else if (singleFlag) {
  // Build for current platform only
  targets = allTargets.filter(item => item.os === process.platform && item.arch === process.arch);
} else {
  // Build all platforms
  targets = allTargets;
}

if (targets.length === 0) {
  console.error(
    `No matching target for ${process.platform}-${process.arch}. Available targets:`,
    allTargets
  );
  process.exit(1);
}

// Clean dist directory
await $`rm -rf dist/binaries`;

const binaries: Record<string, string> = {};

for (const target of targets) {
  // Package name format: heroshot-{os}-{arch}
  // Use "windows" instead of "win32" for npm compatibility
  const osName = target.os === 'win32' ? 'windows' : target.os;
  const packageName = `heroshot-${osName}-${target.arch}`;
  const binaryName = target.os === 'win32' ? 'heroshot.exe' : 'heroshot';

  console.log(`Building ${packageName}...`);

  // Create output directory
  await $`mkdir -p dist/binaries/${packageName}/bin`;

  // Bun compile target format: bun-{os}-{arch}
  const bunTarget = `bun-${target.os}-${target.arch}`;

  // Build standalone binary
  // Note: Some Playwright optional dependencies (electron, chromium-bidi) are marked external
  // as they're not needed for basic Chrome/Chromium automation
  await Bun.build({
    entrypoints: ['./src/cli/cli.ts'],
    sourcemap: 'none',
    minify: true,
    plugins: [playwrightPatchPlugin],
    external: [
      'electron', // Optional Playwright dependency for Electron automation
      'chromium-bidi', // Optional BiDi protocol support (not needed for CDP)
    ],
    compile: {
      target: bunTarget as
        | 'bun-linux-arm64'
        | 'bun-linux-x64'
        | 'bun-darwin-arm64'
        | 'bun-darwin-x64'
        | 'bun-windows-x64',
      outfile: `dist/binaries/${packageName}/bin/${binaryName}`,
    },
    define: {
      HEROSHOT_VERSION: `'${pkg.version}'`,
    },
  });

  // Create platform-specific package.json
  await Bun.file(`dist/binaries/${packageName}/package.json`).write(
    JSON.stringify(
      {
        name: packageName,
        version: pkg.version,
        description: `Heroshot CLI binary for ${osName} ${target.arch}`,
        os: [target.os],
        cpu: [target.arch],
        bin: {
          heroshot: `./bin/${binaryName}`,
        },
      },
      null,
      2
    )
  );

  binaries[packageName] = pkg.version;
  console.log(`  -> dist/binaries/${packageName}/bin/${binaryName}`);
}

console.log('\nBuild complete!');
console.log('Packages:', Object.keys(binaries).join(', '));

export { binaries };
