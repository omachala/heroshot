---
description: Keep your documentation screenshots in Git without bloating your repository. Learn Git LFS basics and best practices for managing binary files.
---

# Screenshots and Version Control

You've set up Heroshot. Screenshots are flowing. Your docs look great. Now you commit those images to Git, push, and... everything seems fine.

Six months later, cloning your repo takes forever. GitHub sends you a warning about repository size. A new contributor asks why they're downloading 800MB for a documentation project.

What happened? Let me show you.

## Why Screenshots Bloat Repositories

Let's say you have a simple docs project with 30 screenshots. You regenerate them weekly to keep docs fresh. Sounds reasonable.

Here's what Git sees:

```bash
# Week 1: Initial commit
heroshots/
├── dashboard-light.png    (120KB)
├── dashboard-dark.png     (115KB)
├── settings-light.png     (85KB)
├── settings-dark.png      (82KB)
└── ... (26 more files)

# Total: ~3MB of images
```

You run `npx heroshot` the next week. Maybe a button color changed, maybe nothing visible changed at all. But the screenshots are regenerated:

```bash
git add heroshots/
git commit -m "chore: update screenshots"
git push
```

Git stores all 30 images again. Not the differences - the entire files. Your `.git` folder is now 6MB.

Week 3? 9MB. Month 3? 36MB. After a year of weekly updates:

```
52 weeks × 3MB = 156MB just in screenshot history
```

And that's a small project. I've seen documentation repos with hundreds of screenshots hit gigabyte sizes.

## The Real-World Impact

Here's what this actually looks like:

```bash
# Clone a repo with bloated screenshot history
$ git clone git@github.com:yourcompany/docs.git
Cloning into 'docs'...
remote: Enumerating objects: 12847, done.
remote: Counting objects: 100% (12847/12847), done.
remote: Compressing objects: 100% (8234/8234), done.
Receiving objects: 100% (12847/12847), 847.23 MiB | 2.34 MiB/s, done.
# ☕ Go make coffee...
```

New contributor: "Is my internet broken?"

Now compare that to a repo using Git LFS:

```bash
$ git clone git@github.com:yourcompany/docs.git
Cloning into 'docs'...
remote: Enumerating objects: 1247, done.
Receiving objects: 100% (1247/1247), 12.34 MiB | 8.12 MiB/s, done.
Filtering content: 100% (127/127), 18.23 MiB | 6.45 MiB/s, done.
# Done in seconds
```

Same project. Same screenshots. Completely different experience.

## What Git LFS Actually Does

Instead of storing images directly, Git LFS stores a tiny pointer file:

```bash
# Without LFS: Git stores the full 120KB PNG
heroshots/dashboard-light.png  →  [120KB binary blob in .git]

# With LFS: Git stores a 130-byte pointer
heroshots/dashboard-light.png  →  [130-byte text file in .git]
                                    ↓
                                  [Actual PNG stored on GitHub's LFS server]
```

That pointer file looks like this:

```
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393
size 122880
```

When you checkout a branch, Git LFS fetches the actual files automatically. You don't notice the difference - files appear as normal. But your repository stays small.

## Setting It Up: A Walkthrough

Let's set up LFS for a real project. I'll use a typical Heroshot setup.

### Step 1: Install Git LFS

First time only - install the Git LFS extension:

```bash
# macOS
brew install git-lfs

# Ubuntu/Debian
sudo apt install git-lfs

# Windows (included with Git for Windows 2.40+)
# Or: choco install git-lfs
```

Then initialize it for your user:

```bash
$ git lfs install
Git LFS initialized.
```

This adds some hooks to your global Git config. You run this once, ever, on each machine you use.

### Step 2: Tell Git What to Track

Navigate to your project and tell Git which files should use LFS:

```bash
$ cd my-docs-project

$ git lfs track "heroshots/*.png"
Tracking "heroshots/*.png"

$ git lfs track "heroshots/*.jpg"
Tracking "heroshots/*.jpg"
```

This creates a `.gitattributes` file:

```bash
$ cat .gitattributes
heroshots/*.png filter=lfs diff=lfs merge=lfs -text
heroshots/*.jpg filter=lfs diff=lfs merge=lfs -text
```

**Important:** This file must be committed. It tells Git (and your teammates) which files use LFS:

```bash
$ git add .gitattributes
$ git commit -m "chore: track screenshots with Git LFS"
```

### Step 3: Commit Screenshots as Usual

Now just use Git normally:

```bash
$ npx heroshot
Capturing 30 screenshots...
✓ All screenshots captured

$ git add heroshots/
$ git commit -m "docs: add screenshots"
$ git push
Uploading LFS objects: 100% (30/30), 3.2 MB | 1.8 MB/s, done.
```

See that "Uploading LFS objects" line? That's Git LFS storing your images separately. Your repository stays lean.

### Step 4: Verify It's Working

Check what LFS is tracking:

```bash
$ git lfs ls-files
a4d7b214 * heroshots/dashboard-dark.png
b8c2e391 * heroshots/dashboard-light.png
c9f1a847 * heroshots/settings-dark.png
d2e4c562 * heroshots/settings-light.png
...
```

The asterisk means the file is stored in LFS. If you see files without asterisks, they were committed before LFS was configured.

## Migrating Existing Screenshots

Already have screenshots in your repo without LFS? Here's how to migrate them.

**Before:**

```bash
$ du -sh .git
847M    .git
# 😬 That's a lot
```

**Run the migration:**

```bash
$ git lfs migrate import --include="heroshots/*.png,heroshots/*.jpg"
migrate: Sorting commits: ..., done.
migrate: Rewriting commits: 100% (234/234), done.
  main    d4a7b21 -> f8c3e19
migrate: Updating refs: ..., done.
migrate: checkout: ..., done.
```

**After:**

```bash
$ du -sh .git
23M     .git
# 🎉 Much better
```

The migration rewrites history, moving all those binary blobs to LFS. Now push:

```bash
$ git push --force-with-lease
```

**Heads up:** This rewrites history. If teammates have local clones, they'll need to re-clone or run:

```bash
$ git fetch origin
$ git reset --hard origin/main
```

Worth coordinating before you do this on a team project.

## GitHub Actions with LFS

Using the [Automated Updates](/docs/guide/automated-updates) workflow? Add one line to enable LFS:

```yaml{5}
- uses: actions/checkout@v4
  with:
    lfs: true  # ← Add this
```

Here's a complete example:

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
        with:
          lfs: true

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Capture screenshots
        run: npx heroshot
        env:
          HEROSHOT_SESSION_KEY: ${{ secrets.HEROSHOT_SESSION_KEY }}

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add heroshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots"
          git push
```

When the workflow commits new screenshots, they automatically go through LFS. No extra steps needed.

## Real Examples

### Example 1: New Project Setup

You're starting fresh. No screenshots yet.

```bash
# Create project
$ mkdir my-docs && cd my-docs
$ git init

# Set up LFS before adding any screenshots
$ git lfs install
$ git lfs track "heroshots/*.png"
$ git add .gitattributes
$ git commit -m "chore: configure Git LFS for screenshots"

# Now capture screenshots
$ npx heroshot
✓ Created .heroshot/config.json
✓ Captured 12 screenshots

# Commit - they automatically use LFS
$ git add .
$ git commit -m "docs: initial screenshots"
$ git push -u origin main
Uploading LFS objects: 100% (12/12), 1.4 MB | 2.1 MB/s, done.
```

From now on, every screenshot regeneration stays efficient.

### Example 2: Existing Project with 6 Months of History

Your docs repo is 400MB. Time to fix it.

```bash
# Check current state
$ du -sh .git
412M    .git

# See where the size is coming from
$ git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | sort -rnk2 | head -10

4d7a21 122880 heroshots/dashboard-light.png
b8c2e3 118784 heroshots/dashboard-dark.png
...
# Yep, it's the screenshots

# Set up LFS
$ git lfs install
$ git lfs track "heroshots/*.png"
$ git lfs track "heroshots/*.jpg"
$ git add .gitattributes
$ git commit -m "chore: configure Git LFS"

# Migrate existing history
$ git lfs migrate import --include="heroshots/*.png,heroshots/*.jpg"
migrate: Rewriting commits: 100% (847/847), done.

# Check new size
$ du -sh .git
28M     .git
# 🎉 From 412MB to 28MB

# Push the rewritten history
$ git push --force-with-lease
```

Tell your team to re-clone or reset their local copies.

### Example 3: Multiple Screenshot Directories

Your project has screenshots in different places:

```
project/
├── docs/
│   └── images/
│       ├── getting-started/
│       │   └── *.png
│       └── reference/
│           └── *.png
├── website/
│   └── screenshots/
│       └── *.png
└── heroshots/
    └── *.png
```

Track them all:

```bash
$ git lfs track "docs/images/**/*.png"
$ git lfs track "website/screenshots/*.png"
$ git lfs track "heroshots/*.png"
```

The `**` pattern matches subdirectories too.

Your `.gitattributes`:

```
docs/images/**/*.png filter=lfs diff=lfs merge=lfs -text
website/screenshots/*.png filter=lfs diff=lfs merge=lfs -text
heroshots/*.png filter=lfs diff=lfs merge=lfs -text
```

## When Things Go Wrong

### "Encountered X file(s) that should have been pointers"

You committed files before setting up LFS:

```bash
$ git push
# ...
# hint: The following files should have been pointers, but weren't:
# hint:   heroshots/dashboard-light.png
```

Fix it by migrating:

```bash
$ git lfs migrate import --include="heroshots/*.png"
$ git push --force-with-lease
```

### Files Show as Text Instead of Images

You're seeing the pointer file, not the actual image:

```bash
$ cat heroshots/dashboard-light.png
version https://git-lfs.github.com/spec/v1
oid sha256:4d7a214...
size 122880
```

Pull the actual files:

```bash
$ git lfs pull
Downloading LFS objects: 100% (30/30), 3.2 MB | 4.1 MB/s
```

### Clone Doesn't Include LFS Files

By default, `git clone` fetches LFS files. But if they're missing:

```bash
$ git lfs fetch --all
$ git lfs checkout
```

Or for CI environments where you want to skip LFS:

```bash
$ GIT_LFS_SKIP_SMUDGE=1 git clone ...
```

### Check What's Actually in LFS

```bash
# Patterns being tracked
$ git lfs track
Listing tracked patterns
    heroshots/*.png (.gitattributes)
    heroshots/*.jpg (.gitattributes)

# Files currently in LFS
$ git lfs ls-files
a4d7b214 * heroshots/dashboard-dark.png
b8c2e391 * heroshots/dashboard-light.png
...

# LFS storage usage
$ git lfs env
Endpoint=https://github.com/yourcompany/docs.git/info/lfs
LocalMediaDir=/path/to/.git/lfs/objects
...
```

## Do You Actually Need LFS?

Quick checklist:

| Situation                     | Need LFS?    |
| ----------------------------- | ------------ |
| 5 screenshots, rarely updated | Probably not |
| 30+ screenshots               | Yes          |
| Weekly automated regeneration | Definitely   |
| Team of 5+ contributors       | Yes          |
| Open source with many cloners | Yes          |
| Personal project, just you    | Your call    |

If you're setting up [Automated Updates](/docs/guide/automated-updates), set up LFS too. The combination of frequent commits plus binary files is exactly where repos explode.

## GitHub LFS Limits

GitHub includes:

- **1GB storage** free
- **1GB bandwidth/month** free

After that, it's $5/month per 50GB. For context:

- Typical screenshot: 50-200KB
- 1GB storage = 5,000-20,000 screenshots
- 1GB bandwidth = cloning your full screenshot history ~300 times

Most documentation projects never hit these limits.

Check your usage: [github.com/settings/billing](https://github.com/settings/billing)

## Quick Reference

```bash
# First-time setup (once per machine)
git lfs install

# Configure what to track (once per repo)
git lfs track "heroshots/*.png"
git add .gitattributes
git commit -m "chore: configure Git LFS"

# Migrate existing files
git lfs migrate import --include="heroshots/*.png"
git push --force-with-lease

# Day-to-day (just use Git normally)
git add heroshots/
git commit -m "docs: update screenshots"
git push

# Troubleshooting
git lfs ls-files    # What's in LFS
git lfs pull        # Download LFS files
git lfs fetch --all # Fetch all LFS objects
```

## What's Next

With LFS configured, your screenshots are version-controlled without the bloat. Now you can:

- Set up [Automated Updates](/docs/guide/automated-updates) - CI keeps screenshots fresh
- Fine-tune your [Configuration](/docs/config) - control exactly what you capture
