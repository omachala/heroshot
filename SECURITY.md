# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

Only the latest published version of Heroshot receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email **ondrej@macha.la** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive an acknowledgment within **48 hours**
4. A fix will be prioritized and released as soon as possible

## Scope

Heroshot is a CLI tool that automates browser screenshots using Playwright. Security concerns may include:

- Command injection via config files or CLI arguments
- Arbitrary file write/overwrite through output paths
- Unsafe handling of user-provided URLs or selectors
- Dependencies with known vulnerabilities

## Disclosure

We follow coordinated disclosure. Once a fix is released, we will credit reporters (unless anonymity is requested) in the release notes.
