/**
 * Action Executor
 *
 * Dispatches pre-screenshot actions to individual handler functions.
 * Each handler uses the same Playwright operations as Playwright MCP.
 *
 * Reference: https://github.com/microsoft/playwright-mcp
 */

import type { Page } from 'playwright';
import { verbose } from '../../ui';
import { executeClick } from './click';
import { executeDrag } from './drag';
import { executeEvaluate } from './evaluate';
import { executeFileUpload } from './fileUpload';
import { executeFillForm } from './fillForm';
import { executeHandleDialog } from './handleDialog';
import { executeHide } from './hide';
import { executeHover } from './hover';
import { executeNavigate } from './navigate';
import { executePressKey } from './pressKey';
import { executeResize } from './resize';
import { executeSelectOption } from './selectOption';
import { executeType } from './type';
import type { Action, ActionHandler } from './types';
import { executeWait } from './wait';

/** Dispatch map: action type -> handler function */
const actionHandlers: Record<Action['type'], ActionHandler> = {
  click: executeClick,
  type: executeType,
  hover: executeHover,
  select_option: executeSelectOption,
  press_key: executePressKey,
  drag: executeDrag,
  wait: executeWait,
  navigate: executeNavigate,
  evaluate: executeEvaluate,
  fill_form: executeFillForm,
  handle_dialog: executeHandleDialog,
  file_upload: executeFileUpload,
  resize: executeResize,
  hide: executeHide,
};

/**
 * Execute a sequence of actions on the page.
 * Actions run sequentially in order.
 */
export async function executeActions(page: Page, actions: Action[]): Promise<void> {
  for (const action of actions) {
    verbose(`Action: ${action.type}`);
    await actionHandlers[action.type](page, action);
  }
}
