---
'heroshot': patch
---

Fix Node 18 compatibility by replacing `import.meta.dirname` with `fileURLToPath(import.meta.url)`
