---
description: Heroshot is a free, open-source screenshot automation tool. Define screenshots once with a visual picker, regenerate them forever with one command.
---

# What is Heroshot?

**Screenshot automation for people who ship fast.**

You define your screenshots once - point and click, no CSS selectors to write - and heroshot regenerates them whenever you need. Landing pages, docs, pitch decks, whatever. One command keeps everything fresh.

## The Problem You Know Too Well

Your app evolves. Styles change. Features get redesigned. Meanwhile, the screenshots in your README and docs quietly become lies.

The manual fix is tedious: open browser, navigate, log in, find the right spot, screenshot, crop, save, commit. Now do that for every screenshot. Now do it again next month.

So you don't. The docs drift. Users get confused. And you feel bad every time someone asks "is this screenshot outdated?"

## Define Once, Regenerate Forever

```bash
npx heroshot
```

That's the whole workflow. Run it once to point-and-click your screenshots. Run it again whenever you need fresh ones. Heroshot remembers what to capture and handles the rest.

If you're set up for CI, `heroshot` runs headlessly - useful for automated docs pipelines.

## How It's Different from Visual Regression Testing

You might be thinking "isn't this what Playwright/Percy/BackstopJS does?" Not quite.

Visual regression testing catches _unintended_ UI changes - it alerts you when something looks different because that might be a bug.

Heroshot does the opposite. When your UI changes, that's expected - you _want_ new screenshots. The docs need to follow the product, not freeze it in time.

| Approach                  | Goal                               | When UI changes...          |
| ------------------------- | ---------------------------------- | --------------------------- |
| Visual Regression Testing | Alert when UI changed              | Bad (potential bug)         |
| Visual Fidelity           | Update screenshots when UI changed | Expected (docs must follow) |

## What Makes It Nice to Use

**Point and click, not CSS selectors.** Open the visual picker, click on what you want to capture, done. Heroshot figures out the selector for you.

**Light and dark mode in one run.** If your site has themes, heroshot captures both variants automatically. No duplicate config, no manual switching.

**Web components work too.** Shadow DOM piercing with `>>> .inner` syntax if you need it.

**Log in once, capture forever.** Heroshot saves your browser session (encrypted). Next time you run headlessly, it's already authenticated - no flaky login scripts.

**Your config is generated, not written.** The visual picker creates `.heroshot/config.json` for you. Edit it if you want, or just let the UI handle it.

## Who Actually Uses This

If you're shipping fast and your docs can't keep up - this is for you.

- You're building a SaaS and need product shots for the landing page
- You're an indie hacker who'd rather code than manually screenshot
- You're using AI to build faster than ever, but docs are the bottleneck
- You maintain open source and want the README to reflect reality
- You write tutorials and guides that need accurate visuals
