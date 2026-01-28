---
'heroshot': patch
---

Fixed toolbar not appearing when running heroshot (#47). Multiple root causes identified and fixed:

1. **EDITOR_DIR path bug**: Path resolved incorrectly when running from bundled `dist/` directory, going outside the package and failing to find `editor/dist/editor.js`

2. **Missing explicit injection**: The `domcontentloaded` event listener could miss the first page load, leaving users with no toolbar on initial navigation

3. **tsx \_\_name serialization issue**: Development mode (`pnpm dev`) was broken due to esbuild adding `__name()` wrappers to nested function properties, which don't exist in browser context

4. **Silent error swallowing**: Injection errors were caught but not logged, making debugging impossible

Added comprehensive tests and documentation to prevent regression.
