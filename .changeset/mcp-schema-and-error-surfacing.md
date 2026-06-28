---
'heroshot': patch
---

Fix two issues that made the CLI hard to use:

- **MCP tool schemas were empty**: `tools/list` advertised `properties: {}` for every tool, and `heroshot_add`/`heroshot_remove` rejected valid input because arguments were silently dropped before reaching the handler. Tools now register their Zod schemas via the MCP SDK's native shape form, so inputs are parsed and forwarded correctly.
- **Errors surfaced as "Something went wrong"**: thrown errors during sync, config, or one-shot capture were caught by the spinner's exit hook and replaced with a generic message, often with exit code 0. The CLI now prints the actual error to stderr and exits with code 1. Use `--verbose` for the full stack trace.
