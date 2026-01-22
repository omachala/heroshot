---
'heroshot': minor
---

Add standalone binary distribution via Bun compile

- Build standalone binaries for 5 platforms: linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64
- Auto-detect system browsers (Chrome, Edge, Chromium) with fallback to Playwright's bundled Chromium
- Binaries are built automatically on GitHub releases via the build-binaries workflow
- No Node.js required to run the standalone binary
