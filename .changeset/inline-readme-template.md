---
'heroshot': patch
---

Fix `Something went wrong` crash on `heroshot config` in the standalone binary. The README template was read from disk at runtime, but Bun's compile step didn't bundle the `templates/` directory into the binary's virtual filesystem, so the first capture/config command crashed with `ENOENT: ... /$bunfs/root/templates/heroshotReadme.txt`. Template is now inlined as a TypeScript constant so it ships with the binary.
