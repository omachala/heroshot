---
'heroshot': minor
---

Add --workers flag for parallel screenshot capture

- Add `--workers <count>` CLI flag to run multiple capture workers concurrently
- Speed up large screenshot collections at the cost of more system resources
- Default is 1 (sequential capture, same as before)
