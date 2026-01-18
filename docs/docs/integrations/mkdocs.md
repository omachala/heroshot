# MkDocs

[MkDocs](https://www.mkdocs.org/) is huge in the Python world. If you're documenting a Python project, chances are you're using MkDocs - probably with the [Material theme](https://squidfunk.github.io/mkdocs-material/) which is fantastic.

## The Magic: One Macro, All Variants

Here's the thing about screenshots in docs - you end up with a lot of them. Light mode, dark mode, different sizes... suddenly one screenshot becomes multiple files to manage.

The `heroshot` macro handles all of this for you:

::: v-pre

```jinja
{{ heroshot("dashboard", "Dashboard overview") }}
```

:::

That's it. One line. The macro automatically generates Material's theme-aware syntax - when users toggle dark mode, the screenshot switches instantly. Your markdown stays clean, six image variants served automatically.

### Setting It Up

Two steps. First, install the heroshot package:

```bash
pip install heroshot[mkdocs]
```

Then add the macro module to your `mkdocs.yml`:

```yaml
plugins:
  - macros:
      modules: [heroshot]
```

::: v-pre
Now you can use `{{ heroshot() }}` anywhere in your markdown:

```jinja
{{ heroshot("dashboard", "Dashboard overview") }}
{{ heroshot("hero", "Hero section", width="600") }}
{{ heroshot("sidebar", "Sidebar", align="right", width="300") }}
```

:::

Under the hood, the macro expands to Material's `#only-light` / `#only-dark` syntax:

```md
![Dashboard overview](assets/screenshots/dashboard-light.png#only-light)
![Dashboard overview](assets/screenshots/dashboard-dark.png#only-dark)
```

You don't have to think about it - just use the macro and Material handles the rest.

### Customizing the Macro

The defaults work for most setups, but you can tweak everything:

::: v-pre

```jinja
{{ heroshot("name", "alt text", path="images/screens", width="500") }}
```

:::

| Parameter      | Default                | When to change it                         |
| -------------- | ---------------------- | ----------------------------------------- |
| `name`         | required               | -                                         |
| `alt`          | `""`                   | Always set this for accessibility         |
| `path`         | `"assets/screenshots"` | If your screenshots live elsewhere        |
| `light_suffix` | `"-light"`             | If you use different naming               |
| `dark_suffix`  | `"-dark"`              | If you use different naming               |
| `width`        | `None`                 | To constrain large screenshots            |
| `align`        | `None`                 | For floating images (`"left"`, `"right"`) |

For screenshots without theme variants (diagrams, architecture charts), use `heroshot_single`:

::: v-pre

```jinja
{{ heroshot_single("architecture", "System architecture") }}
```

:::

## Getting Started

Navigate to your project root and run:

```bash
npx heroshot
```

This opens a browser with the visual picker. Start your MkDocs dev server (`mkdocs serve`), navigate to `http://localhost:8000` in the heroshot browser, click on elements you want to capture, and close when done.

## Where to Put Screenshots

MkDocs serves everything from the `docs/` folder. I'd suggest `docs/assets/screenshots/`:

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

Point heroshot at this folder in your config:

```json
{
  "outputDirectory": "docs/assets/screenshots",
  "screenshots": [...]
}
```

During development, I usually have two terminals open:

```bash
# Terminal 1
mkdocs serve

# Terminal 2
npx heroshot
```

Navigate to `http://localhost:8000`, click on stuff, done.

## Light & Dark Mode

If you're using the `heroshot` macro (you should!), theme switching is automatic.

For manual control, Material has this elegant syntax - just add `#only-light` or `#only-dark` to the image URL:

```md
![Dashboard](assets/screenshots/dashboard-light.png#only-light)
![Dashboard](assets/screenshots/dashboard-dark.png#only-dark)
```

Set heroshot's color scheme to "Both" in the toolbar and you get `-light.png` and `-dark.png` variants automatically.

## Material Theme Goodies

If you're using Material for MkDocs (and you should be), there's some nice stuff you can do.

### Clickable Images (Lightbox)

Material supports glightbox for image zoom:

```yaml
# mkdocs.yml
plugins:
  - glightbox
```

All your screenshots automatically become clickable to view full-size. Nice for detailed UI shots where users want to see the fine print.

### Sizing and Alignment

Material extends markdown with attributes:

```md
![Screenshot](assets/screenshots/feature.png){ width="500" }

![Screenshot](assets/screenshots/feature.png){ align="right" width="300" }
```

### Tabs for Viewport Variants

Say you're capturing desktop, tablet, and mobile variants. Material's tabs work great for this:

```md
=== "Desktop"

    ![Desktop](assets/screenshots/hero-desktop.png)

=== "Tablet"

    ![Tablet](assets/screenshots/hero-tablet.png)

=== "Mobile"

    ![Mobile](assets/screenshots/hero-mobile.png)
```

Users click through to see each variant without cluttering the page.

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

One command, all screenshots updated.

## CI/CD

Here's a GitHub Action that keeps screenshots fresh:

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

Trigger it manually whenever you want fresh screenshots, or add a schedule.

## ReadTheDocs

If you're hosting on RTD, screenshots need to be committed to your repo since RTD builds from source. The workflow is:

1. Run `npx heroshot` locally
2. Commit the screenshots
3. Push - RTD rebuilds automatically

For private RTD projects that need authentication, you can use heroshot's session key support in CI.
