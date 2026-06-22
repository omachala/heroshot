---
'heroshot': patch
---

Fix standalone binaries crashing on startup with "Cannot find module '.../playwright-core/package.json'". The Bun build baked the build machine's absolute path into the binary because the Playwright patch targeted an outdated playwright-core file layout and silently stopped applying after a Playwright upgrade. The patch now targets the current layout, derives the version dynamically, and fails the build if it no longer matches. CI also smoke-tests each built binary with `node_modules` removed so this can't ship broken again.
