---
layout: home

hero:
  name: HeroShot
  text: Screenshots that stay true
  tagline: Documentation screenshot automation. Define once, regenerate forever.
  image:
    src: /logo.svg
    alt: Heroshot Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/omachala/heroshot

features:
  - icon:
      src: /icons/refresh.svg
    title: Never Outdated
    details: Screenshots regenerate when your UI changes. Documentation that stays true to your product, automatically.
  - icon:
      src: /icons/target.svg
    title: Point and Click
    details: Visual picker generates the config. No YAML files, no DevTools, no manual CSS selectors.
  - icon:
      src: /icons/moon.svg
    title: Light & Dark Mode
    details: Capture both color schemes in one run. Pixel-perfect backgrounds that match your UI theme.
  - icon:
      src: /icons/devices.svg
    title: Viewport Variants
    details: One config, multiple sizes. Desktop, tablet, mobile - all generated automatically from a single definition.
  - icon:
      src: /icons/rocket.svg
    title: CI/CD Ready
    details: Run heroshot sync in your pipeline. Screenshots update on every deploy.
---

<div class="showcase">
  <h2>See It In Action</h2>
  <p class="subtitle">The hero section above is captured by heroshot across three viewport sizes, in both light and dark mode. That's 6 screenshots from a <a href="https://github.com/omachala/heroshot/blob/main/.heroshot/config.json" target="_blank">single config entry</a> — always in sync with the live site.</p>

  <div class="theme-tabs">
    <button class="active" data-theme="light">Light Mode</button>
    <button data-theme="dark">Dark Mode</button>
  </div>

  <div id="light-screenshots" class="screenshot-grid">
    <div class="screenshot-item">
      <img src="/screenshots/hero-desktop-light.png" alt="Desktop - Light" />
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-tablet-light.png" alt="Tablet - Light" />
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-mobile-light.png" alt="Mobile - Light" />
    </div>
  </div>

  <div id="dark-screenshots" class="screenshot-grid" style="display: none;">
    <div class="screenshot-item">
      <img src="/screenshots/hero-desktop-dark.png" alt="Desktop - Dark" />
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-tablet-dark.png" alt="Tablet - Dark" />
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-mobile-dark.png" alt="Mobile - Dark" />
    </div>
  </div>

  <div class="try-link">
    <a href="/guide/getting-started">Try it yourself</a>
  </div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const buttons = document.querySelectorAll('.theme-tabs button[data-theme]')
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme
      document.getElementById('light-screenshots').style.display = theme === 'light' ? 'grid' : 'none'
      document.getElementById('dark-screenshots').style.display = theme === 'dark' ? 'grid' : 'none'
      buttons.forEach(b => b.classList.toggle('active', b.dataset.theme === theme))
    })
  })
})
</script>
