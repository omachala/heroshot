import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.fill / setChecked / check / selectOption per field type */
export async function executeFillForm(page: Page, action: Action): Promise<void> {
  if (action.type !== 'fill_form') return;
  for (const field of action.fields) {
    const locator = page.locator(field.selector);
    if (action.timeout) {
      const options = { timeout: action.timeout };
      const fieldActions: Record<string, () => Promise<unknown>> = {
        textbox: async () => locator.fill(field.value, options),
        checkbox: async () => locator.setChecked(field.value === 'true', options),
        radio: async () => locator.check(options),
        combobox: async () => locator.selectOption({ label: field.value }, options),
        slider: async () => locator.fill(field.value, options),
      };
      await fieldActions[field.fieldType]?.();
    } else {
      const fieldActions: Record<string, () => Promise<unknown>> = {
        textbox: async () => locator.fill(field.value),
        checkbox: async () => locator.setChecked(field.value === 'true'),
        radio: async () => locator.check(),
        combobox: async () => locator.selectOption({ label: field.value }),
        slider: async () => locator.fill(field.value),
      };
      await fieldActions[field.fieldType]?.();
    }
  }
}
