/**
 * Annotations - Drawing, Moving, Resizing, Deleting
 *
 * Tests the full annotation lifecycle for each shape type:
 *
 * 1. Draw arrow, rect, ellipse annotations
 * 2. Move an annotation by dragging
 * 3. Resize an annotation via handles
 * 4. Delete an annotation with Delete key
 * 5. Multiple annotations coexist
 * 6. Click to select/deselect annotations
 *
 * Events tested:
 * - screenshot-updated: Emitted when annotations change
 */

import { expect, test } from 'playwright/test';
import {
  clickSidebarItem,
  createMockScreenshot,
  getEventsByType,
  injectToolbar,
  TEST_PAGE_URL,
} from './utils';

/** Get bounding rect of the #hero element */
async function getHeroRect(page: import('playwright/test').Page) {
  const rect = await page.evaluate(() => {
    const el = document.querySelector('#hero');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });
  expect(rect).not.toBeNull();
  return rect!;
}

/** Set up a page with a selected screenshot ready for annotation */
async function setupForAnnotation(page: import('playwright/test').Page) {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });
  const screenshot = createMockScreenshot({ id: 'ann-test', selector: '#hero' });
  await injectToolbar(page, { screenshots: [screenshot] });
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);
}

/** Activate a specific annotation tool via the dropdown */
async function activateAnnotationTool(page: import('playwright/test').Page, tool: string) {
  // Click the dropdown chevron to open tool list
  const dropdown = page.locator('#heroshot-root >> button[title="Choose annotation type"]');
  await dropdown.click();
  await page.waitForTimeout(100);

  // Click the specific tool
  const toolButton = page.locator(`#heroshot-root >> button:text("${tool}")`);
  await toolButton.click();
  await page.waitForTimeout(100);
}

/** Draw an annotation by dragging from start to end (relative to hero element) */
async function drawAnnotation(
  page: import('playwright/test').Page,
  heroRect: { top: number; left: number; width: number; height: number },
  startOffsetX: number,
  startOffsetY: number,
  endOffsetX: number,
  endOffsetY: number
) {
  const startX = heroRect.left + startOffsetX;
  const startY = heroRect.top + startOffsetY;
  const endX = heroRect.left + endOffsetX;
  const endY = heroRect.top + endOffsetY;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

/** Get the latest annotations from emitted events */
async function getLatestAnnotations(page: import('playwright/test').Page) {
  const events = await getEventsByType(page, 'screenshot-updated');
  const lastEvent = events.at(-1);
  return lastEvent?.data.annotations ?? [];
}

test('draw arrow annotation', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Activate arrow tool
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);

  // Draw arrow
  await drawAnnotation(page, heroRect, 20, 20, 200, 100);

  // Verify annotation was created
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
  expect(annotations[0].type).toBe('arrow');
  expect(annotations[0].points).toHaveLength(4);
});

test('draw rectangle annotation', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Activate rectangle tool
  await activateAnnotationTool(page, 'Rectangle');

  // Draw rectangle
  await drawAnnotation(page, heroRect, 30, 30, 150, 100);

  // Verify annotation was created
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
  expect(annotations[0].type).toBe('rect');
  expect(annotations[0].points).toHaveLength(4);
});

test('draw ellipse annotation', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Activate ellipse tool
  await activateAnnotationTool(page, 'Ellipse');

  // Draw ellipse
  await drawAnnotation(page, heroRect, 40, 40, 180, 120);

  // Verify annotation was created
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
  expect(annotations[0].type).toBe('ellipse');
  expect(annotations[0].points).toHaveLength(4);
});

test('delete annotation with Delete key', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Draw an arrow
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 20, 20, 200, 100);

  // Verify annotation exists
  let annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);

  // The annotation should be selected after drawing — press Delete
  await page.keyboard.press('Delete');
  await page.waitForTimeout(200);

  // Verify annotation was deleted
  annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(0);
});

test('delete annotation with Backspace key', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Draw an arrow
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 20, 20, 200, 100);

  // The annotation should be selected after drawing — press Backspace
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);

  // Verify annotation was deleted
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(0);
});

test('move annotation by dragging', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Draw an arrow
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 50, 50, 200, 100);

  // Get original annotation points
  let annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
  const originalPoints = [...annotations[0].points];

  // Move annotation by dragging from center of the annotation
  const centerX = heroRect.left + (50 + 200) / 2;
  const centerY = heroRect.top + (50 + 100) / 2;
  const moveX = 30;
  const moveY = 20;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + moveX, centerY + moveY, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  // Verify points changed (moved)
  annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
  // Arrow points are [x1, y1, x2, y2] — both endpoints should shift by moveX/moveY
  expect(annotations[0].points[0]).toBeCloseTo(originalPoints[0] + moveX, 0);
  expect(annotations[0].points[1]).toBeCloseTo(originalPoints[1] + moveY, 0);
  expect(annotations[0].points[2]).toBeCloseTo(originalPoints[2] + moveX, 0);
  expect(annotations[0].points[3]).toBeCloseTo(originalPoints[3] + moveY, 0);
});

test('multiple annotations coexist', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Draw first arrow
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 20, 20, 150, 60);

  // Activate arrow tool again for second annotation
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 30, 100, 180, 150);

  // Both annotations should exist
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(2);
  expect(annotations[0].type).toBe('arrow');
  expect(annotations[1].type).toBe('arrow');
  // They should have different IDs
  expect(annotations[0].id).not.toBe(annotations[1].id);
});

test('escape deselects annotation without deleting', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Draw an arrow
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 20, 20, 200, 100);

  // Annotation should be selected — ConfigBar should show "Annotation"
  const configBar = page.locator('#heroshot-root >> .bg-slate-800.rounded-lg.shadow-2xl');
  await expect(configBar).toContainText('Annotation');

  // Press Escape — deselects annotation AND element (both handled in one keydown)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // ConfigBar should be hidden (element is deselected too)
  await expect(configBar).not.toBeVisible();

  // Annotation should still exist (not deleted) — check the last emitted event with annotations
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(1);
});

test('draw annotation with pre-existing annotations preserves them', async ({ page }) => {
  await page.goto(TEST_PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Create screenshot with an existing annotation
  const screenshot = createMockScreenshot({
    id: 'ann-existing',
    selector: '#hero',
    annotations: [{ id: 'existing-1', type: 'arrow', points: [10, 10, 100, 50] }],
  });
  await injectToolbar(page, { screenshots: [screenshot] });
  await clickSidebarItem(page, 0);
  await page.waitForTimeout(500);

  const heroRect = await getHeroRect(page);

  // Draw a new annotation
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);
  await drawAnnotation(page, heroRect, 50, 80, 200, 130);

  // Both annotations should exist
  const annotations = await getLatestAnnotations(page);
  expect(annotations).toHaveLength(2);
  expect(annotations[0].id).toBe('existing-1');
});

test('small drag does not create annotation', async ({ page }) => {
  await setupForAnnotation(page);
  const heroRect = await getHeroRect(page);

  // Activate arrow tool
  const annotateButton = page.locator('#heroshot-root >> button[title^="Annotate"]');
  await annotateButton.click();
  await page.waitForTimeout(200);

  // Do a very small drag (less than 5px threshold)
  await drawAnnotation(page, heroRect, 50, 50, 52, 51);

  // No annotation should be created
  const events = await getEventsByType(page, 'screenshot-updated');
  const annotationEvents = events.filter(e => e.data.annotations && e.data.annotations.length > 0);
  expect(annotationEvents).toHaveLength(0);
});
