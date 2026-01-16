# MkDocs

[MkDocs](https://www.mkdocs.org/) is huge in the Python world. If you're documenting a Python project, chances are you're using MkDocs - probably with the [Material theme](https://squidfunk.github.io/mkdocs-material/) which is fantastic.

The good news: heroshot works great with MkDocs. You just need Node.js installed (which you probably have anyway for frontend tooling).

## The Entry Point

Navigate to your project root and run:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your MkDocs dev server (`mkdocs serve`), then navigate to `http://localhost:8000` in the heroshot browser, click on elements you want to capture, and close when done. Heroshot saves a config and outputs screenshots wherever you specify.

## Where to Put Screenshots

MkDocs serves everything from the `docs/` folder. I'd suggest putting screenshots in `docs/assets/screenshots/`:

```
my-project/
├── docs/
│   ├── index.md
│   ├── getting-started.md
│   └── assets/
│       └── screenshots/    # heroshot outputs here
├── mkdocs.yml
└── requirements.txt
```

## Getting Started

Set your output directory:

```json
{
  "outputDirectory": "docs/assets/screenshots",
  "screenshots": [...]
}
```

Start MkDocs and run heroshot:

```bash
# Terminal 1
mkdocs serve

# Terminal 2
npx heroshot
```

Navigate to `http://localhost:8000`, click on stuff, done.

Then reference in markdown:

```md
![Dashboard](assets/screenshots/dashboard.png)
```

## Material Theme Goodies

If you're using Material for MkDocs (and you should be), there's some nice stuff you can do.

### Light/Dark Mode

Material has this really elegant syntax for theme-aware images. Just add `#only-light` or `#only-dark` to the image URL:

```md
![Dashboard](assets/screenshots/dashboard-light.png#only-light)
![Dashboard](assets/screenshots/dashboard-dark.png#only-dark)
```

That's it. Material handles the rest. Set heroshot's color scheme to "Both" and you get `-light.png` and `-dark.png` variants.

### Clickable Images (Lightbox)

Material supports glightbox for image zoom:

```yaml
# mkdocs.yml
plugins:
  - glightbox
```

All your screenshots automatically become clickable to view full-size. Nice for detailed UI shots.

### Sizing and Alignment

Material extends markdown with attributes:

```md
![Screenshot](assets/screenshots/feature.png){ width="500" }

![Screenshot](assets/screenshots/feature.png){ align="right" width="300" }
```

### Tabs for Viewport Variants

If you're capturing desktop/tablet/mobile variants, Material's tabs work well:

```md
=== "Desktop"

    ![Desktop](assets/screenshots/hero-desktop.png)

=== "Tablet"

    ![Tablet](assets/screenshots/hero-tablet.png)

=== "Mobile"

    ![Mobile](assets/screenshots/hero-mobile.png)
```

## Makefile Integration

Most Python projects have a Makefile. Here's a simple target:

```makefile
.PHONY: screenshots

screenshots:
	mkdocs serve &
	sleep 3
	npx heroshot
	pkill -f "mkdocs serve"
```

Then just:

```bash
make screenshots
```

## CI/CD

Here's a GitHub Action for MkDocs:

```yaml
# .github/workflows/screenshots.yml
name: Update Screenshots

on:
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: pip install mkdocs mkdocs-material

      - name: Capture screenshots
        run: |
          npx playwright install chromium
          mkdocs serve &
          sleep 5
          npx heroshot
          pkill -f "mkdocs serve"

      - name: Commit
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/assets/screenshots/
          git diff --staged --quiet || git commit -m "docs: update screenshots"
          git push
```

## ReadTheDocs

If you're hosting on RTD, screenshots need to be committed to your repo since RTD builds from source. The workflow is:

1. Run `npx heroshot` locally
2. Commit the screenshots
3. Push - RTD rebuilds automatically

For private RTD projects that need authentication, you can use heroshot's session key support in CI.
