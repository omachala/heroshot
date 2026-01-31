/**
 * Action Schemas — Pre-screenshot actions that run before capturing.
 * Uses Playwright locator API, supporting all selector formats: CSS, XPath, text, role, shadow DOM.
 * Reference: https://github.com/microsoft/playwright-mcp
 *
 * ROADMAP extensions (not in Playwright MCP):
 * scroll, focus, blur, check, uncheck, set_text, add_class, remove_class,
 * set_attribute, storage, mock, emulate, date, each, if
 */
import { z } from 'zod';

export const clickActionSchema = z
  .object({
    type: z.literal('click'),
    selector: z.string().describe('Element selector (CSS, XPath, text, role, or shadow DOM)'),
    doubleClick: z.boolean().optional().describe('Whether to perform a double click'),
    button: z.enum(['left', 'right', 'middle']).optional().describe('Mouse button to click'),
    modifiers: z
      .array(z.enum(['Alt', 'Control', 'ControlOrMeta', 'Meta', 'Shift']))
      .optional()
      .describe('Modifier keys to hold during click'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds'),
  })
  .describe('Click an element. Use to dismiss cookie banners, open menus, expand dropdowns.');

export const typeActionSchema = z
  .object({
    type: z.literal('type'),
    selector: z.string().describe('Input element selector (CSS, XPath, text, role, or shadow DOM)'),
    text: z.string().describe('Text to type into the element'),
    submit: z.boolean().optional().describe('Whether to press Enter after typing (submit form)'),
    slowly: z.boolean().optional().describe('Type one character at a time for key handlers'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds'),
  })
  .describe('Type text into an input, textarea, or contenteditable element.');

export const hoverActionSchema = z
  .object({
    type: z.literal('hover'),
    selector: z.string().describe('Element selector (CSS, XPath, text, role, or shadow DOM)'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds'),
  })
  .describe('Hover over an element to trigger :hover states, show tooltips, or reveal menus.');

export const selectOptionActionSchema = z
  .object({
    type: z.literal('select_option'),
    selector: z
      .string()
      .describe('Select element selector (CSS, XPath, text, role, or shadow DOM)'),
    values: z.array(z.string()).describe('Option values to select. Supports multiple.'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds'),
  })
  .describe('Select one or more options in a native <select> dropdown.');

export const pressKeyActionSchema = z
  .object({
    type: z.literal('press_key'),
    key: z.string().describe('Key to press, e.g. "Enter", "Escape", "Control+a"'),
  })
  .describe('Press a keyboard key or combination. Use to close modals, submit forms, etc.');

export const dragActionSchema = z
  .object({
    type: z.literal('drag'),
    from: z.string().describe('Selector of the element to drag'),
    to: z.string().describe('Selector of the drop target'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds'),
  })
  .describe('Drag an element and drop it onto another.');

export const waitActionSchema = z
  .object({
    type: z.literal('wait'),
    time: z.number().optional().describe('Time to wait in seconds (max 30s)'),
    text: z.string().optional().describe('Wait for this text to appear on the page'),
    textGone: z.string().optional().describe('Wait for this text to disappear from the page'),
  })
  .describe('Pause execution until a condition is met.');

export const navigateActionSchema = z
  .object({
    type: z.literal('navigate'),
    url: z.string().optional().describe('URL to navigate to (absolute or relative)'),
    back: z.boolean().optional().describe('Navigate back to the previous page'),
  })
  .describe('Navigate to a different URL or go back in history.');

export const evaluateActionSchema = z
  .object({
    type: z.literal('evaluate'),
    function: z.string().describe('JavaScript function: () => { ... } or (el) => { ... }'),
    selector: z.string().optional().describe('Element selector to pass to function'),
  })
  .describe('Run arbitrary JavaScript in the browser context. Escape hatch for DOM manipulation.');

export const fillFormActionSchema = z
  .object({
    type: z.literal('fill_form'),
    fields: z
      .array(
        z.object({
          selector: z.string().describe('Form field selector'),
          value: z.string().describe('Value to fill. Checkboxes: "true"/"false"'),
          fieldType: z
            .enum(['textbox', 'checkbox', 'radio', 'combobox', 'slider'])
            .describe('Type of the form field'),
        })
      )
      .describe('Array of fields to fill'),
    timeout: z.number().int().positive().optional().describe('Timeout in milliseconds per field'),
  })
  .describe('Fill multiple form fields in one action.');

export const handleDialogActionSchema = z
  .object({
    type: z.literal('handle_dialog'),
    accept: z.boolean().describe('Whether to accept the dialog'),
    promptText: z.string().optional().describe('Text to enter in case of a prompt dialog'),
  })
  .describe('Set up handler for browser dialog. Place BEFORE action that triggers dialog.');

export const fileUploadActionSchema = z
  .object({
    type: z.literal('file_upload'),
    selector: z.string().describe('File input element selector'),
    paths: z.array(z.string()).describe('File paths to upload (absolute or relative to config)'),
  })
  .describe('Upload one or more files through a file input element.');

export const resizeActionSchema = z
  .object({
    type: z.literal('resize'),
    width: z.number().int().positive().describe('Viewport width in pixels'),
    height: z.number().int().positive().describe('Viewport height in pixels'),
  })
  .describe('Resize the browser viewport mid-flow.');

export const hideActionSchema = z
  .object({
    type: z.literal('hide'),
    selectors: z.array(z.string()).describe('Element selectors to hide (display: none)'),
  })
  .describe('Hide elements from screenshot. Use to remove cookie banners, chat widgets, ads.');

/** Union of all supported action types. Actions execute sequentially before screenshot. */
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
  hideActionSchema,
]);

/** Array of actions to execute sequentially before screenshot capture */
export const actionsSchema = z
  .array(actionSchema)
  .describe('Ordered list of actions to execute before capturing. Actions run sequentially.');
