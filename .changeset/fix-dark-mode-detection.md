---
'heroshot': patch
---

Fix dark mode detection in Vue and React components

Dark screenshots were incorrectly showing on mobile devices with dark OS preference, even when the user explicitly toggled the site to light mode.

The components now follow this priority for theme detection:

1. **Site theme first** - Check `.dark` class (VitePress) or `data-theme` attribute (Docusaurus)
2. **System preference second** - Only used if framework hasn't set explicit theme
3. **Default to light** - Fallback when nothing is detected

This ensures that when a user explicitly toggles the site theme, the correct screenshot variant is displayed regardless of their OS preference.
