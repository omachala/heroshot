/**
 * MCP server end-to-end test.
 *
 * Regression guard for #104: prior to the fix the SDK silently dropped the
 * `inputSchema` (because we passed a JSON Schema object instead of a Zod
 * shape), causing `tools/list` to advertise empty `properties` and tool calls
 * to receive empty input. We exercise the built server via stdio so the
 * SDK's real wire path is covered, not just the handler unit logic.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI_BIN = path.resolve(import.meta.dirname, '../../../dist/cli/cli.js');

type JsonRpcResponse = {
  id?: number;
  result?: {
    tools?: { name: string; inputSchema?: { properties?: Record<string, unknown> } }[];
    content?: { type: string; text: string }[];
    isError?: boolean;
  };
  error?: unknown;
};

async function callMcp(messages: object[]): Promise<JsonRpcResponse[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [CLI_BIN, 'mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => {
      stdout += String(chunk);
    });
    proc.stderr.on('data', chunk => {
      stderr += String(chunk);
    });

    proc.on('error', reject);
    proc.on('close', () => {
      try {
        const responses = stdout
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => JSON.parse(line) as JsonRpcResponse);
        resolve(responses);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse MCP output. stderr=${stderr}\nstdout=${stdout}\n${String(error)}`
          )
        );
      }
    });

    for (const message of messages) {
      proc.stdin.write(`${JSON.stringify(message)}\n`);
    }
    proc.stdin.end();
  });
}

describe('MCP server (e2e via stdio)', () => {
  it('advertises non-empty inputSchema.properties for every tool', async () => {
    const responses = await callMcp([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ]);

    const toolsList = responses.find(r => r.id === 2);
    expect(toolsList?.result?.tools).toBeDefined();
    const tools = toolsList?.result?.tools ?? [];
    expect(tools).toHaveLength(5);
    for (const tool of tools) {
      const props = tool.inputSchema?.properties ?? {};
      expect(Object.keys(props).length, `${tool.name} should expose properties`).toBeGreaterThan(0);
    }
  }, 30_000);

  it('parses arguments for heroshot_add and reaches the handler', async () => {
    const responses = await callMcp([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'heroshot_add',
          arguments: {
            configPath: '/tmp/heroshot-mcp-e2e-nonexistent.json',
            screenshot: { name: 'login', url: 'https://example.com' },
          },
        },
      },
    ]);

    const callResult = responses.find(r => r.id === 3);
    const text = callResult?.result?.content?.[0]?.text ?? '';
    // Either the handler succeeds, or it surfaces a real semantic error
    // (e.g. config file missing) — but it must NOT report missing required
    // fields, which was the symptom of the original schema-stripping bug.
    expect(text).not.toContain('expected string, received undefined');
    expect(text).not.toContain('"path": [\n      "name"\n    ]');
  }, 30_000);
});
