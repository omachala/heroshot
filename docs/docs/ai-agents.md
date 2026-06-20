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
      "args": ["--package=heroshot", "-y", "heroshot-mcp"]
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
      "args": ["./node_modules/heroshot/dist/mcp/index.js"]
    }
  }
}
```

Or with a standalone binary from [GitHub Releases](https://github.com/omachala/heroshot/releases) (no Node.js required):

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "/usr/local/bin/heroshot",
      "args": ["mcp"]
    }
  }
}
```

Use this for CI runners, Docker images, or any environment where you want to pin to an exact binary version without a package manager. If `heroshot` is on `$PATH`, you can drop the absolute path and use `"command": "heroshot"`.

Restart Claude Code after editing.

## Cursor

Add to your Cursor MCP settings (Settings > MCP Servers > Add Server):

```json
{
  "heroshot": {
    "command": "npx",
    "args": ["--package=heroshot", "-y", "heroshot-mcp"]
  }
}
```

Or add directly to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "heroshot": {
      "command": "npx",
      "args": ["--package=heroshot", "-y", "heroshot-mcp"]
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
      "args": ["--package=heroshot", "-y", "heroshot-mcp"]
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
      "args": ["--package=heroshot", "-y", "heroshot-mcp"]
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
