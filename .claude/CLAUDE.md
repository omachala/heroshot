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
  - **Roadmap sync**: Before committing a `feat:` change, review [ROADMAP.md](./ROADMAP.md) and:
    - If the feature exists in roadmap, mark it as done `[x]`
    - If the feature is missing from roadmap, add it and mark as done
    - This ensures roadmap always reflects actual implemented features

- **Pull Requests**: Use conventional PR titles (same prefixes as commits)
  - **Description**: Bullet points only, no fluff - just what matters

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
