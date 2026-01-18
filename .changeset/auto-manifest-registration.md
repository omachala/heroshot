---
'heroshot': patch
---

Simplify framework integration setup with auto-manifest registration

- Vite plugin now auto-registers manifest when virtual module is imported
- Docusaurus plugin injects client module that auto-registers manifest
- Updated docs and examples with simplified setup patterns
- Examples now use published npm package instead of workspace link
- Added cache clearing to docs:dev script
