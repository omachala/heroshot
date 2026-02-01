---
'heroshot': patch
---

Add EventInterceptor for toolbar event isolation (fixes #65)

- Toolbar clicks no longer propagate to page (prevents dropdown closing)
- Picker mode blocks page clicks/keyboard while allowing scroll
- Added smart selector generation with ARIA role support
- Added event recorder for action recording
