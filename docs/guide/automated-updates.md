# Automated Updates

Keep your screenshots always up to date by running heroshot in CI. Whenever your UI changes, a workflow can regenerate screenshots and commit them back to your repository.

## How It Works

1. **Configure locally** - Run `npx heroshot` to set up screenshots interactively
2. **Commit config** - The `.heroshot/` folder contains your config and encrypted session
3. **Add workflow** - Create a GitHub Action that runs heroshot
4. **Stay updated** - Trigger manually or on schedule to refresh screenshots

## Session Key

If your screenshots require authentication (login), heroshot encrypts your browser session locally. To use it in CI:

### Get Your Session Key

```bash
npx heroshot session-key
```

This prints your session key (a 20-character string). Keep it secret.

### Add as GitHub Secret

```bash
gh secret set HEROSHOT_SESSION_KEY
```

Paste your session key when prompted.

## GitHub Actions Workflow

Create `.github/workflows/heroshot.yaml`:

```yaml
name: Heroshot

on:
  workflow_dispatch: # Manual trigger from Actions tab

jobs:
  screenshots:
    name: Update Screenshots
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Heroshot
        run: npx heroshot --session-key=${{ secrets.HEROSHOT_SESSION_KEY }}

      - name: Commit and push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add heroshots/
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: update heroshot screenshots"
            git push
          fi
```

## Trigger Options

### Manual Only

```yaml
on:
  workflow_dispatch:
```

Trigger from the Actions tab whenever you want.

### On Schedule

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC
```

### On Push to Main

```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
```

## What Gets Committed

The workflow commits only the `heroshots/` folder (your screenshot images). The encrypted session in `.heroshot/session.enc` is already in your repo and doesn't change during CI runs.

## Security

- **Session key** - Stored as a GitHub secret, never logged
- **Encrypted session** - The `.heroshot/session.enc` file is encrypted with AES-256-GCM
- **Safe to commit** - Config and encrypted session contain no plaintext secrets
