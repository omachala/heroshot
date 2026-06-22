---
'heroshot': patch
---

Complete the standalone binary startup fix: Playwright also reads `browsers.json` from its install dir at load time, which (like `package.json`) baked the build machine's absolute path into the binary and crashed on any other machine. Both files' contents are now inlined at build time. The CI binary smoke test (which runs each binary with `node_modules` removed) caught this case that release 0.19.1's binaries missed.
