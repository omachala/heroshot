# What is Heroshot?

**Create professional screenshots, not only for documentation.**

Define once, keep them alive forever. Beautiful product shots for landing pages, docs, social media, pitch decks - anywhere you present your product.

## The Problem

Documentation screenshots rot.

Your product evolves. Styles change. Features get redesigned. The screenshots in your README, docs, and tutorials silently become lies.

The manual process is painful: open browser, navigate, log in, find the element, screenshot, crop, save, commit. Repeat for every screenshot.

So documentation drifts from reality. Users get confused. Trust erodes.

## The Solution

Screenshots should be **defined once and regenerated automatically** - like code, not like assets.

```bash
npx heroshot sync
```

Heroshot treats screenshots as code - declarative, versionable, automatable.

## Visual Fidelity, Not Regression Testing

Heroshot ensures **Visual Fidelity** - keeping screenshots faithful to the actual UI.

This is distinct from Visual Regression Testing (Playwright, Percy, BackstopJS) which detects unintended UI changes:

| Approach                  | Goal                               | When UI changes...          |
| ------------------------- | ---------------------------------- | --------------------------- |
| Visual Regression Testing | Alert when UI changed              | Bad (potential bug)         |
| Visual Fidelity           | Update screenshots when UI changed | Expected (docs must follow) |

Regression testing asks: "Did the UI break?"
Visual fidelity asks: "Are the docs still true?"

## Key Features

- **Visual Picker** - Point and click to select elements, not manual CSS selectors
- **Light & Dark Mode** - Capture both color schemes in one run with pixel-perfect backgrounds
- **Shadow DOM Piercing** - Works with web components (`>>> .inner` syntax)
- **Persistent Auth** - Log in once, reuse sessions for headless captures
- **CI/CD Integration** - `heroshot check` fails if screenshots are stale
- **Config Generated** - The visual picker creates `heroshot.json` for you

## Who Is It For?

- **Indie hackers** - Ship fast, need screenshots for landing pages and docs
- **AI-assisted coders** - Building rapidly, docs can't keep up manually
- **Engineers** - README files, technical documentation
- **Documentation teams** - Markdown/MDX workflows
- **DevRel** - Tutorials, guides, blog posts
