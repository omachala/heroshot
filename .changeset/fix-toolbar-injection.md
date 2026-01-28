---
'heroshot': patch
---

Fixed toolbar not appearing when running heroshot (#47). Multiple root causes identified and fixed:

1. **EDITOR_DIR path bug**: Path resolved incorrectly when running from bundled `dist/` directory, going outside the package and failing to find `editor/dist/editor.js`

2. **Missing explicit injection**: The `domcontentloaded` event listener could miss the first page load, leaving users with no toolbar on initial navigation

3. **tsx \_\_name serialization issue**: Development mode (`pnpm dev`) was broken due to esbuild adding `__name()` wrappers to nested function properties, which don't exist in browser context

4. **Silent error swallowing**: Injection errors were caught but not logged, making debugging impossible

**Additional fixes:**

5. **Version flag returning 0.0.0 (#45)**: Path to package.json was going up 1 level from `dist/cli/` but needed 2 levels to reach package root

6. **Action timeout option (#48)**: Added optional `timeout` parameter to `click`, `type`, `hover`, `select_option`, `drag`, and `fill_form` actions for complex component libraries

Added comprehensive tests and documentation to prevent regression.
