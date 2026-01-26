/**
 * Tool definitions registry.
 * Schema-driven tool definitions where input schemas are auto-derived from Zod.
 */

import type { z } from 'zod';
import { addOptionsSchema } from '../schemas/add';
import { listOptionsSchema } from '../schemas/list';
import { removeOptionsSchema } from '../schemas/remove';
import { snippetOptionsSchema } from '../schemas/snippet';
import { syncOptionsSchema } from '../schemas/sync';
import { type AddResult, addHandler } from './add';
import { type ListResult, listHandler } from './list';
import { type RemoveResult, removeHandler } from './remove';
import { type SnippetResult, snippetHandler } from './snippet';
import { type SyncResult, syncHandler } from './sync';

export type ToolResult = {
  content: {
    type: 'text';
    text: string;
  }[];
  isError?: boolean;
};

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MCP SDK uses any for handler inputs
  handler: (input: any) => Promise<ToolResult>;
};

function formatResult(result: { success: boolean; error?: string }): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
    isError: !result.success,
  };
}

async function syncToolHandler(input: z.infer<typeof syncOptionsSchema>): Promise<ToolResult> {
  const result: SyncResult = await syncHandler(input);
  return formatResult(result);
}

// eslint-disable-next-line @typescript-eslint/require-await -- sync handler wrapped for MCP interface
async function addToolHandler(input: z.infer<typeof addOptionsSchema>): Promise<ToolResult> {
  const result: AddResult = addHandler(input);
  return formatResult(result);
}

// eslint-disable-next-line @typescript-eslint/require-await -- sync handler wrapped for MCP interface
async function listToolHandler(input: z.infer<typeof listOptionsSchema>): Promise<ToolResult> {
  const result: ListResult = listHandler(input);
  return formatResult(result);
}

// eslint-disable-next-line @typescript-eslint/require-await -- sync handler wrapped for MCP interface
async function snippetToolHandler(
  input: z.infer<typeof snippetOptionsSchema>
): Promise<ToolResult> {
  const result: SnippetResult = snippetHandler(input);
  return formatResult(result);
}

// eslint-disable-next-line @typescript-eslint/require-await -- sync handler wrapped for MCP interface
async function removeToolHandler(input: z.infer<typeof removeOptionsSchema>): Promise<ToolResult> {
  const result: RemoveResult = removeHandler(input);
  return formatResult(result);
}

export const tools: ToolDefinition[] = [
  {
    name: 'heroshot_sync',
    description:
      'Capture all screenshots defined in the heroshot config. ' +
      'Optionally filter by id/name/filename pattern, delete stale files, or run with multiple workers.',
    inputSchema: syncOptionsSchema,
    handler: syncToolHandler,
  },
  {
    name: 'heroshot_add',
    description:
      'Add a new screenshot definition to the heroshot config. ' +
      'Requires at least name and url. Optional: selector for element capture, actions for pre-capture steps.',
    inputSchema: addOptionsSchema,
    handler: addToolHandler,
  },
  {
    name: 'heroshot_list',
    description:
      'List all screenshots defined in the heroshot config. ' +
      'Returns id, name, url, and selector for each screenshot.',
    inputSchema: listOptionsSchema,
    handler: listToolHandler,
  },
  {
    name: 'heroshot_snippet',
    description:
      'Generate markdown/HTML snippets for embedding screenshots in documentation. ' +
      'Supports light/dark mode with <picture> elements.',
    inputSchema: snippetOptionsSchema,
    handler: snippetToolHandler,
  },
  {
    name: 'heroshot_remove',
    description: 'Remove a screenshot definition from the heroshot config by its ID.',
    inputSchema: removeOptionsSchema,
    handler: removeToolHandler,
  },
];
