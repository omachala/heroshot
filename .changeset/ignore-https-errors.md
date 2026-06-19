---
'heroshot': minor
---

Add `--ignore-https-errors` CLI flag and `browser.ignoreHTTPSErrors` config option to capture local HTTPS endpoints with self-signed or untrusted certificates (e.g. Vite `https: true`, mkcert, Docker-proxied dev apps). Maps to Playwright's `ignoreHTTPSErrors` browser context option.
