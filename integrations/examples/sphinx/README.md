# Sphinx + Heroshot Example

Minimal Sphinx setup with heroshot integration and Furo theme.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
sphinx-autobuild docs docs/_build/html
```

Open http://localhost:8000

## What's Included

- `heroshot.sphinx` extension with `.. heroshot::` directive
- Theme-aware screenshots (light/dark switching via CSS)
- Furo theme with dark mode toggle

> **Note:** `requirements.txt` currently references the local package (`../../python/`).
> Once published to PyPI, replace with `heroshot[sphinx]`.

## Capture Screenshots

```bash
npx heroshot
```
