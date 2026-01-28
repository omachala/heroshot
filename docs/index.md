---
layout: home
title: Screenshot Automation for Documentation
description: Free, open-source CLI tool that automates documentation screenshots. Define once with a visual picker, regenerate forever with one command. Works with VitePress, Docusaurus, MkDocs, and more.
head:
  - - meta
    - name: keywords
      content: screenshot automation, documentation screenshots, automated screenshots, docs screenshots, screenshot tool, documentation tool, vitepress screenshots, docusaurus screenshots, mkdocs screenshots, playwright screenshots
  - - script
    - type: application/ld+json
    - |
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How do I automate documentation screenshots?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Install Heroshot with 'npx heroshot', use the visual picker to select elements you want to capture, and run 'npx heroshot' anytime to regenerate all screenshots. You can also set it up in CI/CD to update screenshots automatically on every deploy."
            }
          },
          {
            "@type": "Question",
            "name": "Is Heroshot free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Heroshot is completely free and open-source under the MIT license. There are no usage limits, no accounts required, and no paid tiers. Everything runs locally on your machine or CI."
            }
          },
          {
            "@type": "Question",
            "name": "What documentation platforms does Heroshot support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Heroshot works with VitePress, Docusaurus, MkDocs, Sphinx, GitBook, and any static site generator. It also provides React and Vue components for framework-specific integration with automatic light/dark mode switching."
            }
          },
          {
            "@type": "Question",
            "name": "How do I capture screenshots of pages that require login?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Heroshot supports persistent authentication. Run 'npx heroshot --login' to open a browser, log into your site manually, then Heroshot encrypts and saves your session. Future captures will use this session automatically, even in headless CI environments."
            }
          },
          {
            "@type": "Question",
            "name": "Can I capture both light and dark mode screenshots?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Heroshot can capture both color schemes in a single run. Set 'colorScheme' to 'both' in your config, and Heroshot generates separate light and dark variants. The React/Vue components automatically show the right variant based on the user's theme preference."
            }
          },
          {
            "@type": "Question",
            "name": "How do I set up screenshot automation in GitHub Actions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Add a workflow that runs 'npx heroshot' after your site builds. Heroshot provides a ready-to-use GitHub Actions workflow that captures screenshots, commits changes, and creates a PR automatically. Works with any CI provider."
            }
          },
          {
            "@type": "Question",
            "name": "How do I capture mobile and tablet screenshots?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Use the viewports option in your config or pass --viewports via CLI. Heroshot supports presets like 'desktop', 'tablet', 'mobile', or custom dimensions. One config entry generates all viewport variants automatically."
            }
          },
          {
            "@type": "Question",
            "name": "Can AI assistants like Claude or Cursor manage my screenshots?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Heroshot includes an MCP server that lets AI coding assistants capture and update screenshots directly. Claude Code, Cursor, Windsurf, and GitHub Copilot can all use Heroshot through the Model Context Protocol."
            }
          },
          {
            "@type": "Question",
            "name": "How do I keep screenshots up to date when my UI changes?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Run 'npx heroshot' locally to regenerate all screenshots, or set up CI automation to update them on every deploy. Screenshots are stored as regular image files in your project, so changes show up in git diffs for easy review."
            }
          },
          {
            "@type": "Question",
            "name": "What is Heroshot and how does it work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Heroshot is a CLI tool that automates documentation screenshots. You define what to capture once using a visual picker, then regenerate all screenshots with one command. It uses Playwright under the hood for reliable, cross-browser captures."
            }
          }
        ]
      }

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
      src: /icons/robot.svg
    title: AI Agent Ready
    details: MCP server lets Claude Code, Cursor, and Copilot manage screenshots directly. Just ask.
    link: /docs/ai-agents
    linkText: Configure MCP
  - icon:
      src: /icons/sliders.svg
    title: Visual Editor
    details: Refine your screenshots with adjustable padding, margins, and borders - all without touching code.
    link: /docs/config#padding
    linkText: Padding & masking
---

<div class="picker-section">
  <PickerCarousel />
</div>

<div class="showcase">
  <h2>One Config, Many Variants</h2>
  <p class="subtitle">This screenshot of the hero section above is captured by Heroshot - desktop, tablet, mobile, light and dark.<br>Resize your browser or toggle the theme - the matching variant loads automatically.</p>

  <div class="screenshot-showcase">
    <Heroshot name="Hero" alt="Heroshot landing page screenshot" class="hero-screenshot" />
  </div>

  <p class="showcase-note">That's 6 image variants from a <a href="https://github.com/omachala/heroshot/blob/main/docs/.heroshot/config.json" target="_blank">single config entry</a> - always in sync with the live site.</p>

  <div class="try-link">
    <a href="/docs/getting-started">Try it yourself</a>
  </div>
</div>

<div class="integrations-section">
  <h2>Works With Your Docs</h2>

  <IntegrationTabs />
</div>

<div class="faq-section">
  <h2>Frequently Asked Questions</h2>

  <div class="faq-list">
    <details class="faq-item">
      <summary>How do I automate documentation screenshots?</summary>
      <p>Install Heroshot with <code>npx heroshot</code>, use the visual picker to select elements you want to capture, and run <code>npx heroshot</code> anytime to regenerate all screenshots. You can also <a href="/docs/guide/automated-updates">set it up in CI/CD</a> to update screenshots automatically on every deploy.</p>
    </details>

    <details class="faq-item">
      <summary>Is Heroshot free?</summary>
      <p>Yes, Heroshot is completely free and open-source under the MIT license. There are no usage limits, no accounts required, and no paid tiers. Everything runs locally on your machine or CI.</p>
    </details>

    <details class="faq-item">
      <summary>What documentation platforms does Heroshot support?</summary>
      <p>Heroshot works with <a href="/docs/integrations/vitepress">VitePress</a>, <a href="/docs/integrations/docusaurus">Docusaurus</a>, <a href="/docs/integrations/mkdocs">MkDocs</a>, <a href="/docs/integrations/sphinx">Sphinx</a>, <a href="/docs/integrations/gitbook">GitBook</a>, and any static site generator. It also provides <a href="/docs/integrations/react">React</a> and <a href="/docs/integrations/vue">Vue</a> components for automatic light/dark mode switching.</p>
    </details>

    <details class="faq-item">
      <summary>How do I capture screenshots of pages that require login?</summary>
      <p>Heroshot supports persistent authentication. Run <code>npx heroshot --login</code> to open a browser, log into your site manually, then Heroshot encrypts and saves your session. Future captures will use this session automatically, even in headless CI environments. <a href="/docs/getting-started#sites-that-need-login">Learn more</a>.</p>
    </details>

    <details class="faq-item">
      <summary>Can I capture both light and dark mode screenshots?</summary>
      <p>Yes, set <code>colorScheme</code> to <code>"both"</code> in your config, and Heroshot generates separate light and dark variants in a single run. The React/Vue components automatically show the right variant based on the user's theme preference. <a href="/docs/config#color-scheme-values">See color scheme options</a>.</p>
    </details>

    <details class="faq-item">
      <summary>How do I set up screenshot automation in GitHub Actions?</summary>
      <p>Add a workflow that runs <code>npx heroshot</code> after your site builds. Heroshot provides a <a href="/docs/guide/automated-updates">ready-to-use GitHub Actions workflow</a> that captures screenshots, commits changes, and creates a PR automatically. Works with any CI provider.</p>
    </details>

    <details class="faq-item">
      <summary>How do I capture mobile and tablet screenshots?</summary>
      <p>Use the <a href="/docs/config#viewports">viewports option</a> in your config or pass <code>--viewports</code> via CLI. Heroshot supports presets like <code>desktop</code>, <code>tablet</code>, <code>mobile</code>, or custom dimensions. One config entry generates all viewport variants automatically.</p>
    </details>

    <details class="faq-item">
      <summary>Can AI assistants like Claude or Cursor manage my screenshots?</summary>
      <p>Yes, Heroshot includes an <a href="/docs/ai-agents">MCP server</a> that lets AI coding assistants capture and update screenshots directly. Claude Code, Cursor, Windsurf, and GitHub Copilot can all use Heroshot through the Model Context Protocol.</p>
    </details>

    <details class="faq-item">
      <summary>How do I keep screenshots up to date when my UI changes?</summary>
      <p>Run <code>npx heroshot</code> locally to regenerate all screenshots, or <a href="/docs/guide/automated-updates">set up CI automation</a> to update them on every deploy. Screenshots are stored as regular image files in your project, so changes show up in git diffs for easy review.</p>
    </details>

    <details class="faq-item">
      <summary>What is Heroshot and how does it work?</summary>
      <p>Heroshot is a CLI tool that automates documentation screenshots. You define what to capture once using a <a href="/docs/getting-started">visual picker</a>, then regenerate all screenshots with one command. It uses Playwright under the hood for reliable, cross-browser captures.</p>
    </details>

  </div>
</div>
