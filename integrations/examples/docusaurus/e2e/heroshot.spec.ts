import { test, expect } from '@playwright/test';
import { expectHeroshotLoaded, expectHeroshotAbsolutePath } from '../../test-utils';

test('heroshot image is visible on root page', async ({ page }) => {
  await page.goto('/');
  await expectHeroshotLoaded(page, expect);
  await expectHeroshotAbsolutePath(page, expect);
});

test('heroshot image is visible on nested route', async ({ page }) => {
  await page.goto('/examples/hero');
  await expectHeroshotLoaded(page, expect);
  await expectHeroshotAbsolutePath(page, expect);
});
