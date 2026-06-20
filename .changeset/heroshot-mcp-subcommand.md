---
'heroshot': minor
---

Add `heroshot mcp` subcommand that starts the MCP (Model Context Protocol) server over stdio. This lets you wire MCP-enabled agents (Claude Code, Cursor, Windsurf, VS Code Copilot) to the standalone binary from GitHub Releases, with no Node.js required — useful for CI runners, Docker images, and restricted environments.
