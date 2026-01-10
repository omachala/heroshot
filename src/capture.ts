import type { ScreenshotDefinition } from './types.js';

export async function capture(_definition: ScreenshotDefinition): Promise<Buffer> {
  // TODO: Implement capture logic with Playwright
  await Promise.resolve();
  throw new Error('Not implemented');
}
