# Heroshot

Screenshot automation CLI tool. See [IDEA.md](./IDEA.md) for project vision and roadmap. See [TOOLBAR.md](./TOOLBAR.md) for toolbar/picker component details. See [DEPLOY.md](./DEPLOY.md) for heroshot.sh website deployment. See [TESTING.md](./TESTING.md) for unit and e2e test documentation.

## Conventions

- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation
  - `refactor:` code refactoring
  - `test:` adding tests
  - `chore:` maintenance
  - **NEVER include AI attribution**: No "Generated with Claude", "Co-Authored-By: Claude", emojis like 🤖, or any AI/Claude mentions in commits. Ever.
  - **No proactive push**: Commits are fine anytime, but only push when user explicitly asks

- **Pull Requests**: Use conventional PR titles (same prefixes as commits)

- **Code Style**:
  - Use descriptive variable names, never single characters (e.g., `screenshot` not `s`, `event` not `e`)
  - Exception: loop indices `i`, `j`, `k` are acceptable in simple loops

- **Test Structure**:
  - Unit tests live inside `src/tests/` alongside the code (e.g., `src/tests/dom.test.ts` for `src/dom.ts`)
  - Root-level `tests/` folder is for integration/functional tests
  - Tests must pass typecheck but are excluded from ESLint (for flexibility)

---

## Related Documentation

System-level **[~/CLAUDE.md](~/CLAUDE.md)** contains Google Drive (`rclone gdrive:`), iCloud (`idrive` CLI), and cloud transfer functions.

- **[~/docs/CLAUDE.md](~/docs/CLAUDE.md)** - Home network, servers, services (HA, Node-RED, Pi-hole, SWAG, Wireguard)
- **[~/projects/trading/.claude/CLAUDE.md](~/projects/trading/.claude/CLAUDE.md)** - Trading 212 ISA investment tracker
- **[~/projects/ha-treemap-card/.claude/CLAUDE.md](~/projects/ha-treemap-card/.claude/CLAUDE.md)** - HA treemap Lovelace card
