---
'heroshot': patch
---

Support subdirectory paths in screenshot names. Forward slashes in the `name` field (e.g., `"registry/login-01"`) now create subdirectories in the output, producing `registry/login-01-light.png` instead of `registry-login-01-light.png`.
