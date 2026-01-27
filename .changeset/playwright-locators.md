---
'heroshot': major
---

Switch to Playwright locator API for full selector format support

**Breaking Change:** Shadow DOM piercing syntax is now `>>` (Playwright standard). Legacy `>>>` syntax still works and is auto-converted.

**New selector formats supported:**

- CSS (default): `.button`, `#header`
- Shadow DOM: `host >> .child`
- XPath: `xpath=//button[@id="submit"]`
- Text: `text=Submit`
- Role: `role=button[name="OK"]`
- Chained: `.modal >> role=button[name="Close"]`
