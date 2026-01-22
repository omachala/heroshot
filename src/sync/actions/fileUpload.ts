import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.setInputFiles(paths) */
export async function executeFileUpload(page: Page, action: Action): Promise<void> {
  if (action.type !== 'file_upload') return;
  await page.locator(action.selector).setInputFiles(action.paths);
}
