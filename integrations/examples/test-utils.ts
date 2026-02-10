/**
 * Shared test utilities for integration example e2e tests.
 *
 * Functions accept `page` and `expect` from the caller because this file
 * lives outside each example's node_modules.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Verify a heroshot image is visible and physically loaded (not a broken image).
 * Uses naturalWidth > 0 to confirm the image data was actually fetched.
 */
export async function expectHeroshotLoaded(page: any, expect: any, alt = 'Hero screenshot') {
  const img = page.locator(`img[alt="${alt}"]`);
  await expect(img).toBeVisible({ timeout: 15_000 });
  const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
}

/**
 * Verify a heroshot image has an absolute src path (starts with /).
 * Catches the relative-path bug fixed in 0.14.2.
 */
export async function expectHeroshotAbsolutePath(page: any, expect: any, alt = 'Hero screenshot') {
  const img = page.locator(`img[alt="${alt}"]`);
  const src = await img.getAttribute('src');
  expect(src).toBeTruthy();
  expect(src!.startsWith('/')).toBe(true);
}
