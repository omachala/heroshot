#!/usr/bin/env bun

/**
 * Bun compile build script for heroshot
 * Creates standalone binaries for multiple platforms
 *
 * Usage:
 *   bun run scripts/build-binary.ts           # Build all platforms
 *   bun run scripts/build-binary.ts --single  # Build current platform only
 */

import path from 'path';
import { $ } from 'bun';
import pkg from '../package.json';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.resolve(__dirname, '..');

process.chdir(rootDir);

const singleFlag = process.argv.includes('--single');

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

// Filter to current platform if --single flag
const targets = singleFlag
  ? allTargets.filter(item => item.os === process.platform && item.arch === process.arch)
  : allTargets;

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
  await Bun.build({
    entrypoints: ['./src/cli.ts'],
    sourcemap: 'none',
    minify: true,
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
