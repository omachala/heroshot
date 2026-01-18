---
layout: home

hero:
  name: HeroShot
  text: free, open-source screenshot automation framework
  tagline: Your UI changes constantly. Heroshot updates every screenshot in your docs with a single command.
  image:
    src: /logo.svg
    alt: Heroshot Logo
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/omachala/heroshot

features:
  - icon:
      src: /icons/refresh.svg
    title: Never Outdated
    details: Screenshots regenerate when your UI changes. Documentation that stays true to your product, automatically.
    link: /docs/guide/automated-updates
    linkText: Set up CI
  - icon:
      src: /icons/target.svg
    title: Point and Click
    details: Visual picker generates the config. No YAML files, no DevTools, no manual CSS selectors.
    link: /docs/getting-started
    linkText: Try the picker
  - icon:
      src: /icons/moon.svg
    title: Light & Dark Mode
    details: Capture both color schemes in one run. Pixel-perfect backgrounds that match your UI theme.
    link: /docs/config#color-scheme-values
    linkText: Color scheme options
  - icon:
      src: /icons/devices.svg
    title: Viewport Variants
    details: One config, multiple sizes. Desktop, tablet, mobile - all generated automatically from a single definition.
    link: /docs/config#viewports
    linkText: Viewport presets
  - icon:
      src: /icons/rocket.svg
    title: CI/CD Ready
    details: Run heroshot in your pipeline. Screenshots update on every deploy.
    link: /docs/guide/automated-updates
    linkText: GitHub Actions setup
  - icon:
      src: /icons/server.svg
    title: Self-Hosted
    details: Own your screenshots. No vendor lock-in, no monthly fees. Everything runs on your machine or CI.
    link: /docs/
    linkText: How it works
  - icon:
      src: /icons/lock.svg
    title: Persistent Auth
    details: Encrypted sessions let you log in once and capture protected pages headlessly.
    link: /docs/getting-started#sites-that-need-login
    linkText: Session handling
  - icon:
      src: /icons/sliders.svg
    title: Visual Editor
    details: Refine your screenshots with adjustable padding, margins, and borders - all without touching code.
    link: /docs/config#padding
    linkText: Padding & masking
---

<div class="showcase">
  <h2>See It In Action</h2>
  <p class="subtitle">This screenshot is captured by heroshot with responsive variants (desktop, tablet, mobile) and color scheme support (light/dark). Toggle the theme or resize your browser to see it switch automatically.</p>

  <div class="screenshot-showcase">
    <Heroshot name="Hero" alt="Heroshot landing page screenshot" class="hero-screenshot" />
  </div>

  <p class="showcase-note">That's 6 image variants from a <a href="https://github.com/omachala/heroshot/blob/main/docs/.heroshot/config.json" target="_blank">single config entry</a> - always in sync with the live site.</p>

  <div class="try-link">
    <a href="/docs/getting-started">Try it yourself</a>
  </div>
</div>
