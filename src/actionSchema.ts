/**
 * Action Schemas — Pre-screenshot actions that run before capturing.
 * Vocabulary aligned with Playwright MCP but uses CSS selectors instead of ephemeral accessibility refs.
 * Reference: https://github.com/microsoft/playwright-mcp
 *
 * ROADMAP extensions (not in Playwright MCP):
 * hide, scroll, focus, blur, check, uncheck, set_text, add_class, remove_class,
 * set_attribute, storage, mock, emulate, date, each, if
 */

import { z } from 'zod';

export const clickActionSchema = z
  .object({
    type: z.literal('click'),
    selector: z.string().describe('CSS selector of the element to click'),
    doubleClick: z.boolean().optional().describe('Whether to perform a double click'),
    button: z
      .enum(['left', 'right', 'middle'])
      .optional()
      .describe('Mouse button to click, defaults to left'),
    modifiers: z
      .array(z.enum(['Alt', 'Control', 'ControlOrMeta', 'Meta', 'Shift']))
      .optional()
      .describe('Modifier keys to hold during click'),
  })
  .describe(
    'Click an element. Use to dismiss cookie banners, open menus, expand dropdowns, ' +
      'toggle UI state, or trigger any clickable interaction before capturing.'
  );

export const typeActionSchema = z
  .object({
    type: z.literal('type'),
    selector: z.string().describe('CSS selector of the input element'),
    text: z.string().describe('Text to type into the element'),
    submit: z.boolean().optional().describe('Whether to press Enter after typing (submit form)'),
    slowly: z
      .boolean()
      .optional()
      .describe(
        'Whether to type one character at a time. Useful for triggering key handlers or autocomplete.'
      ),
  })
  .describe(
    'Type text into an input, textarea, or contenteditable element. ' +
      'Use to populate forms with demo data, enter search queries, or fill in sample content for screenshots.'
  );

export const hoverActionSchema = z
  .object({
    type: z.literal('hover'),
    selector: z.string().describe('CSS selector of the element to hover over'),
  })
  .describe(
    'Hover over an element to trigger :hover states, show tooltips, or reveal hidden menus before capturing.'
  );

export const selectOptionActionSchema = z
  .object({
    type: z.literal('select_option'),
    selector: z.string().describe('CSS selector of the <select> element'),
    values: z
      .array(z.string())
      .describe('Option values to select. Supports multiple for multi-select elements.'),
  })
  .describe(
    'Select one or more options in a native <select> dropdown to show a specific selection state.'
  );

export const pressKeyActionSchema = z
  .object({
    type: z.literal('press_key'),
    key: z
      .string()
      .describe('Key to press, e.g. "Enter", "Escape", "ArrowDown", "Control+a", "Meta+Shift+k"'),
  })
  .describe(
    'Press a keyboard key or combination. Use to close modals (Escape), submit forms (Enter), ' +
      'navigate focus (Tab), trigger shortcuts, or activate keyboard-driven UI.'
  );

export const dragActionSchema = z
  .object({
    type: z.literal('drag'),
    from: z.string().describe('CSS selector of the element to drag'),
    to: z.string().describe('CSS selector of the drop target'),
  })
  .describe(
    'Drag an element and drop it onto another. Use to show reordering or drag-and-drop interaction mid-state.'
  );

export const waitActionSchema = z
  .object({
    type: z.literal('wait'),
    time: z.number().optional().describe('Time to wait in seconds (max 30s)'),
    text: z.string().optional().describe('Wait for this text to appear on the page'),
    textGone: z.string().optional().describe('Wait for this text to disappear from the page'),
  })
  .describe(
    'Pause execution until a condition is met. Wait for a fixed duration, for specific text ' +
      'to appear (e.g. after async loading), or for text to disappear (e.g. loading spinners).'
  );

export const navigateActionSchema = z
  .object({
    type: z.literal('navigate'),
    url: z.string().optional().describe('URL to navigate to (absolute or relative)'),
    back: z.boolean().optional().describe('Navigate back to the previous page'),
  })
  .describe(
    'Navigate to a different URL or go back in history. Use to reach a specific page state ' +
      'after login, follow a multi-step flow, or return to a previous page.'
  );

export const evaluateActionSchema = z
  .object({
    type: z.literal('evaluate'),
    function: z
      .string()
      .describe(
        'JavaScript function to evaluate. Use () => { ... } for page-level, or (el) => { ... } when selector is provided.'
      ),
    selector: z
      .string()
      .optional()
      .describe('CSS selector of element to pass as the first argument to the function'),
  })
  .describe(
    'Run arbitrary JavaScript in the browser context. Use as an escape hatch for DOM manipulation ' +
      'not covered by other actions: removing elements, changing styles, modifying text, or setting up complex page state.'
  );

export const fillFormActionSchema = z
  .object({
    type: z.literal('fill_form'),
    fields: z
      .array(
        z.object({
          selector: z.string().describe('CSS selector of the form field'),
          value: z
            .string()
            .describe(
              'Value to fill. For checkboxes use "true"/"false". For combobox use the option label text.'
            ),
          fieldType: z
            .enum(['textbox', 'checkbox', 'radio', 'combobox', 'slider'])
            .describe('Type of the form field'),
        })
      )
      .describe('Array of fields to fill'),
  })
  .describe(
    'Fill multiple form fields in one action. Supports text inputs, checkboxes, radio buttons, ' +
      'dropdowns (combobox), and sliders. Use to show a completed form state in screenshots.'
  );

export const handleDialogActionSchema = z
  .object({
    type: z.literal('handle_dialog'),
    accept: z.boolean().describe('Whether to accept the dialog'),
    promptText: z.string().optional().describe('Text to enter in case of a prompt dialog'),
  })
  .describe(
    'Set up a handler for the next browser dialog (alert, confirm, or prompt). ' +
      'Place this action BEFORE the action that triggers the dialog. It will automatically ' +
      'accept or dismiss when the dialog appears.'
  );

export const fileUploadActionSchema = z
  .object({
    type: z.literal('file_upload'),
    selector: z.string().describe('CSS selector of the file input element'),
    paths: z
      .array(z.string())
      .describe('File paths to upload (absolute or relative to config file)'),
  })
  .describe(
    'Upload one or more files through a file input element. ' +
      'Use to show file upload previews, populated upload zones, or attachment states.'
  );

export const resizeActionSchema = z
  .object({
    type: z.literal('resize'),
    width: z.number().int().positive().describe('Viewport width in pixels'),
    height: z.number().int().positive().describe('Viewport height in pixels'),
  })
  .describe(
    'Resize the browser viewport mid-flow. Use when you need a different viewport for ' +
      'a specific action (e.g. trigger responsive breakpoints) before capturing.'
  );

/**
 * Union of all supported action types.
 * Actions are executed sequentially before taking the screenshot.
 */
export const actionSchema = z.discriminatedUnion('type', [
  clickActionSchema,
  typeActionSchema,
  hoverActionSchema,
  selectOptionActionSchema,
  pressKeyActionSchema,
  dragActionSchema,
  waitActionSchema,
  navigateActionSchema,
  evaluateActionSchema,
  fillFormActionSchema,
  handleDialogActionSchema,
  fileUploadActionSchema,
  resizeActionSchema,
]);

/** Array of actions to execute sequentially before screenshot capture */
export const actionsSchema = z
  .array(actionSchema)
  .describe(
    'Ordered list of actions to execute before capturing the screenshot. ' +
      'Actions run sequentially — each completes before the next starts.'
  );
