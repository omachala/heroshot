---
'heroshot': patch
---

Fixed toolbar not appearing when running heroshot. Root causes were:

1. Page scripts used module-level variables that don't exist when serialized for browser evaluation
2. Editor path resolved incorrectly when running from bundled distribution
3. Injection errors were silently swallowed, making debugging impossible
