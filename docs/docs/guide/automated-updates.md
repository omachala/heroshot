---
description: Automate screenshot updates with GitHub Actions. Set up CI/CD to regenerate documentation screenshots on every deploy.
---

# Automated Updates

You've defined your screenshots locally. They capture your app perfectly. But your app keeps changing - new features, design tweaks, bug fixes. Running `npx heroshot` manually every time gets old fast.

The solution: let CI do it. Set up a workflow that regenerates screenshots automatically, commits them, and you never think about it again.

## The Flow

Here's what happens:

1. You set up screenshots locally with `npx heroshot` (the visual picker)
2. You commit `.heroshot/config.json` to your repo
3. A GitHub Action runs `heroshot` whenever you want
4. Fresh screenshots get committed back to your repo

If your site needs login, there's one extra step - exporting your session key so CI can authenticate. More on that below.

## Basic Setup (No Auth Required)

If your screenshots are on public pages, setup is simple. Create `.github/workflows/heroshot.yml`:

```yaml
name: Update Screenshots

on:
  workflow_dispatch: # Manual trigger from Actions tab

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Capture screenshots
        run: npx heroshot

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add heroshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots"
          git push
```

That's it. Go to Actions → Update Screenshots → Run workflow. Your screenshots regenerate and commit.

## Sites That Need Login

Here's where heroshot really shines. When you run `heroshot config` locally and log into your app, that session gets encrypted and saved to `.heroshot/session.enc`. The encryption key is derived from your machine by default.

For CI to decrypt that session, you need to export the key:

```bash
npx heroshot session-key
```

This prints a ~44 character string. That's your session key - treat it like a password.

### Add It to GitHub Secrets

Using the GitHub CLI:

```bash
gh secret set HEROSHOT_SESSION_KEY
# Paste your key when prompted
```

Or manually: Repository → Settings → Secrets and variables → Actions → New repository secret.

### Update the Workflow

Pass the key to heroshot:

```yaml
- name: Capture screenshots
  run: npx heroshot
  env:
    HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}
```

Now CI can restore your authenticated session. No login scripts, no credential management, no flaky waits for login forms.

## When to Trigger

### Manual Only

Start here. Trigger from the Actions tab when you know things changed:

```yaml
on:
  workflow_dispatch:
```

### On a Schedule

Once you trust the setup, run it automatically. Daily, weekly, whatever fits:

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * 1' # Every Monday at 6 AM UTC
```

### After Deployments

If you deploy via GitHub Actions, trigger screenshots after:

```yaml
on:
  workflow_dispatch:
  workflow_run:
    workflows: ['Deploy']
    types: [completed]
```

### On Push to Main

Aggressive, but ensures screenshots are always current:

```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'src/**' # Only when source changes
      - '!src/**/*.md' # Ignore docs
```

## Full Workflow Example

Here's a complete workflow with auth, error handling, and PR creation instead of direct push:

```yaml
name: Update Screenshots

on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * 1' # Weekly on Monday

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Capture screenshots
        run: npx heroshot --clean
        env:
          HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}

      - name: Check for changes
        id: changes
        run: |
          git add heroshots/
          if git diff --staged --quiet; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.changes.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: update screenshots'
          title: 'Update screenshots'
          body: 'Automated screenshot refresh by Heroshot'
          branch: heroshot-updates
```

This creates a PR instead of pushing directly - useful if you want to review changes before merging.

## What Gets Committed

Only your screenshot images (the `heroshots/` folder by default). The encrypted session file `.heroshot/session.enc` is already in your repo from when you first set things up - it doesn't change during CI runs.

## Security Notes

**Your session key** is stored as a GitHub secret. It never appears in logs. Without it, the encrypted session file is useless.

**The session file** (`.heroshot/session.enc`) uses AES-256-GCM encryption. It's safe to commit - it contains no plaintext credentials.

**Session expiry** - If your app's sessions expire (most do eventually), you'll need to re-authenticate locally and commit the new session file. Run `heroshot config --reset` to clear the old session and log in fresh.

## Debugging

If screenshots aren't updating as expected:

```yaml
- name: Capture screenshots
  run: npx heroshot -v # Verbose output
  env:
    HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}
```

The `-v` flag shows what heroshot is doing - which URLs it's visiting, which selectors it's finding, what files it's writing.

## Local Testing

Before pushing your workflow, test that the session key works:

```bash
# Pretend to be CI - use the key explicitly instead of machine-derived
npx heroshot --session-key="your-key-here"
```

If this works locally, it'll work in CI.
