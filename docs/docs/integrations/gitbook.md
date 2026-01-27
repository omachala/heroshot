---
title: GitBook Screenshot Integration
description: Use Heroshot with GitBook. Automated screenshots for GitBook documentation via Git Sync.
---

title: GitBook Screenshot Integration

# GitBook

[GitBook](https://www.gitbook.com/) is a bit different from the other frameworks here - it's a SaaS platform, not a static site generator. But if you're using Git Sync (where GitBook syncs with your GitHub repo), heroshot works great.

## The Basic Idea

The entry point is always the same. Navigate to your project root and run:

```bash
npx heroshot
```

This opens the visual picker where you can navigate to whatever you're documenting, click on elements, and save. Heroshot creates a config file and outputs screenshots to wherever you specify.

Since GitBook syncs with your Git repo, you just commit the screenshots and GitBook pulls them in.

## Where to Put Screenshots

GitBook typically uses `.gitbook/assets/` for images:

```
my-docs/
├── .gitbook.yaml
├── README.md
├── SUMMARY.md
└── .gitbook/
    └── assets/
        └── screenshots/    # heroshot outputs here
```

## Getting Started

From your project root:

```bash
npx heroshot
```

When the browser opens, you can navigate to:

- Your live app (production or staging)
- Your local dev server if you're building a web app
- GitBook's preview URL if documenting the docs themselves

Click on elements you want to capture, name them, set the output directory to `.gitbook/assets/screenshots/`, and close the browser when done.

## Using Screenshots

Standard markdown:

```md
![Dashboard](.gitbook/assets/screenshots/dashboard.png)
```

GitBook also has some special blocks if you're editing in their web UI:

```md
{% raw %}
{% tabs %}
{% tab title="Desktop" %}
![](.gitbook/assets/screenshots/hero-desktop.png)
{% endtab %}

{% tab title="Mobile" %}
![](.gitbook/assets/screenshots/hero-mobile.png)
{% endtab %}
{% endtabs %}
{% endraw %}
```

## Dark Mode

GitBook has dark mode, but unlike Material for MkDocs or Docusaurus, there's no built-in syntax for theme-aware images. Your options:

1. **Use screenshots that work in both modes** - avoid pure white backgrounds
2. **Just use light screenshots** - they're readable either way
3. **Embed a `<picture>` element** - but HTML support varies by plan

Most people just go with option 1 or 2.

## Keeping Things Updated

The workflow with GitBook is simple:

1. Run `npx heroshot` locally
2. Commit and push
3. GitBook syncs automatically (usually within a few minutes)

For CI automation:

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

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npx playwright install chromium

      - run: npx heroshot

      - name: Commit
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .gitbook/assets/screenshots/
          git diff --staged --quiet || git commit -m "docs: update screenshots"
          git push
```

## One-Shot Mode for Quick Captures

If you just need a quick screenshot without setting up a full config, you can use one-shot mode:

```bash
npx heroshot https://api.yourapp.com/docs -o .gitbook/assets/screenshots/api-explorer.png --selector ".api-response"
```

Handy for API docs where you want to capture specific response panels.

## Limitations

GitBook is a SaaS, so you have less control than with static site generators:

- No local preview (their legacy CLI is deprecated)
- Can't hook into the build process
- Limited custom components compared to MDX

But for team documentation and knowledge bases, it works well. And since heroshot just outputs image files that you commit to Git, the integration is straightforward.
