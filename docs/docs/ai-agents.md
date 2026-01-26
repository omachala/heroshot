---
description: Use Heroshot with AI coding assistants like Claude Code, Cursor, and VS Code Copilot through MCP (Model Context Protocol).
---

# AI Agents

Heroshot includes an MCP (Model Context Protocol) server that lets AI coding assistants manage your screenshots directly. Ask your AI to "add a screenshot of the pricing page" and it handles the config, capture, and code snippet generation.

## What It Does

The MCP server exposes these tools to AI agents:

| Tool               | Description                               |
| ------------------ | ----------------------------------------- |
| `heroshot_sync`    | Capture all screenshots defined in config |
| `heroshot_add`     | Add a new screenshot definition           |
| `heroshot_list`    | List all configured screenshots           |
| `heroshot_snippet` | Generate HTML/Markdown code snippets      |
| `heroshot_remove`  | Remove a screenshot by ID                 |

## Claude Code

Add to your `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "npx",
      "args": ["-y", "heroshot-mcp"]
    }
  }
}
```

Or with a local installation:

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "node",
      "args": ["/path/to/node_modules/heroshot/dist/mcp/index.js"]
    }
  }
}
```

Restart Claude Code after editing.

## Cursor

Add to your Cursor MCP settings (Settings > MCP Servers > Add Server):

```json
{
  "heroshot": {
    "command": "npx",
    "args": ["-y", "heroshot-mcp"]
  }
}
```

Or add directly to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "npx",
      "args": ["-y", "heroshot-mcp"]
    }
  }
}
```

## VS Code with Copilot

For VS Code with GitHub Copilot, add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "heroshot": {
      "command": "npx",
      "args": ["-y", "heroshot-mcp"]
    }
  }
}
```

## Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "npx",
      "args": ["-y", "heroshot-mcp"]
    }
  }
}
```

## Example Prompts

Once configured, try these prompts with your AI assistant:

- "List all heroshot screenshots in this project"
- "Add a screenshot of the homepage hero section"
- "Generate HTML snippets for all screenshots"
- "Sync all heroshot screenshots"
- "Remove the old pricing screenshot"

The AI handles the MCP tool calls automatically.

## How It Works

The MCP server runs as a subprocess spawned by your AI assistant. It communicates over stdio using JSON-RPC. Each tool call maps to Heroshot's core functions:

- `heroshot_sync` calls the same capture logic as `npx heroshot`
- `heroshot_add` writes to `.heroshot/config.json`
- `heroshot_list` reads the config and returns screenshot metadata
- `heroshot_snippet` generates framework-specific code
- `heroshot_remove` updates the config to remove an entry

No additional authentication needed - the server uses your existing Heroshot config and session.

## Input Schemas

All tool inputs are validated with Zod schemas. The MCP server auto-derives JSON Schema at runtime using `z.toJSONSchema()`, so schema definitions stay in sync with Heroshot's core types.

Example input for `heroshot_add`:

```json
{
  "screenshot": {
    "name": "Dashboard Header",
    "url": "https://example.com/dashboard",
    "selector": "header.main",
    "viewports": ["desktop", "mobile"]
  }
}
```

See [Configuration Reference](/docs/config) for all screenshot options.
