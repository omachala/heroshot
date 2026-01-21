---
'heroshot': minor
---

Refactor codebase into modular structure and improve CLI test coverage

- Extract browser.ts into modular `src/browser/` folder
- Extract CLI into modular `src/cli/` folder
- Extract sync into modular `src/sync/` folder
- Replace string-based page.evaluate with typed functions
- Expand CLI test coverage (9 → 24 tests)
- Remove dead CLI flags (`--omit-background`, `--timeout`) that were never wired through
