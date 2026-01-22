import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: Sets up a one-time dialog handler for the next dialog */
export function executeHandleDialog(page: Page, action: Action): void {
  if (action.type !== 'handle_dialog') return;
  const { accept, promptText } = action;
  page.once('dialog', async dialog => {
    await (accept ? dialog.accept(promptText) : dialog.dismiss());
  });
}
