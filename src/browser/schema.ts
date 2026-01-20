/**
 * Zod schemas for browser module types.
 * Used to validate data coming from the toolbar via page.exposeFunction.
 */

import { z } from 'zod';
import type { BrowserSettings, ScreenshotData, ToolbarEvent } from './types';

/** Schema for screenshot data from toolbar */
export const screenshotDataSchema: z.ZodType<ScreenshotData> = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  selector: z.string(),
  createdAt: z.number(),
  padding: z
    .object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number(),
    })
    .optional(),
  scroll: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  paddingFill: z.enum(['inherit', 'solid', 'transparent']).optional(),
  elementFill: z.enum(['original', 'solid', 'transparent']).optional(),
  textOverrides: z.record(z.string(), z.string()).optional(),
});

/** Schema for browser settings from toolbar */
export const browserSettingsSchema: z.ZodType<BrowserSettings> = z.object({
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
  colorScheme: z.enum(['light', 'dark']).optional(),
  deviceScaleFactor: z.number().optional(),
});

/** Schema for toolbar events (discriminated union) */
export const toolbarEventSchema: z.ZodType<ToolbarEvent> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('screenshot-added'),
    data: screenshotDataSchema,
  }),
  z.object({
    type: z.literal('screenshot-updated'),
    data: screenshotDataSchema,
  }),
  z.object({
    type: z.literal('screenshot-selected'),
    id: z.string(),
    url: z.string(),
    selector: z.string(),
  }),
  z.object({
    type: z.literal('screenshot-removed'),
    id: z.string(),
  }),
  z.object({
    type: z.literal('settings-updated'),
    data: browserSettingsSchema,
  }),
  z.object({
    type: z.literal('job-complete'),
  }),
  z.object({
    type: z.literal('done'),
  }),
]);
