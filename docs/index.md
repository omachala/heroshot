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

<style>
.showcase {
  max-width: 1152px;
  margin: 0 auto;
  padding: 64px 24px;
}
.showcase h2 {
  text-align: center;
  font-size: 28px;
  margin-bottom: 8px;
}
.showcase .subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
}
.theme-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}
.theme-tabs button {
  padding: 8px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.theme-tabs button.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}
.theme-tabs button:hover:not(.active) {
  border-color: var(--vp-c-brand-1);
}
.screenshot-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 0.6fr;
  gap: 16px;
  align-items: start;
}
.screenshot-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
.screenshot-item img {
  width: 100%;
  height: auto;
  display: block;
}
.screenshot-label {
  text-align: center;
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 8px;
}
@media (max-width: 768px) {
  .screenshot-grid {
    grid-template-columns: 1fr;
  }
}
.try-it {
  text-align: center;
  margin-top: 48px;
}
.try-it h3 {
  font-size: 20px;
  margin-bottom: 16px;
}
.terminal-window {
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.2);
  border: 1px solid var(--vp-c-divider);
  min-width: 480px;
}
.terminal-header {
  background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dark .terminal-header {
  background: linear-gradient(180deg, #3d3d3d 0%, #2d2d2d 100%);
}
.terminal-dots {
  display: flex;
  gap: 8px;
}
.terminal-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.terminal-dot.red { background: #ff5f56; }
.terminal-dot.yellow { background: #ffbd2e; }
.terminal-dot.green { background: #27ca40; }
.terminal-title {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-right: 62px;
  font-weight: 500;
}
.dark .terminal-title {
  color: #999;
}
.terminal-body {
  background: #1e1e1e;
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}
.terminal-body code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 20px;
  color: #f8f8f8;
  letter-spacing: 0.5px;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}
.terminal-body .prompt {
  color: #27ca40;
}
.terminal-body .copy-btn {
  padding: 10px 20px;
  border: 1px solid #444;
  border-radius: 8px;
  background: #2d2d2d;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.terminal-body .copy-btn:hover {
  border-color: #27ca40;
  color: #27ca40;
}
.terminal-body .copy-btn.copied {
  border-color: #27ca40;
  color: #27ca40;
}
@media (max-width: 560px) {
  .terminal-window {
    min-width: auto;
    width: 100%;
  }
}
</style>

<div class="showcase">
  <h2>See It In Action</h2>
  <p class="subtitle">This page is screenshotted by heroshot. <a href="https://github.com/omachala/heroshot/blob/main/.heroshot/config.json" target="_blank">One config</a>, 6 images.</p>

  <div class="theme-tabs">
    <button class="active" data-theme="light">Light Mode</button>
    <button data-theme="dark">Dark Mode</button>
  </div>

  <div id="light-screenshots" class="screenshot-grid">
    <div class="screenshot-item">
      <img src="/screenshots/hero-desktop-light.png" alt="Desktop - Light" />
      <p class="screenshot-label">Desktop (1280px)</p>
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-tablet-light.png" alt="Tablet - Light" />
      <p class="screenshot-label">Tablet (768px)</p>
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-mobile-light.png" alt="Mobile - Light" />
      <p class="screenshot-label">Mobile (375px)</p>
    </div>
  </div>

  <div id="dark-screenshots" class="screenshot-grid" style="display: none;">
    <div class="screenshot-item">
      <img src="/screenshots/hero-desktop-dark.png" alt="Desktop - Dark" />
      <p class="screenshot-label">Desktop (1280px)</p>
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-tablet-dark.png" alt="Tablet - Dark" />
      <p class="screenshot-label">Tablet (768px)</p>
    </div>
    <div class="screenshot-item">
      <img src="/screenshots/hero-mobile-dark.png" alt="Mobile - Dark" />
      <p class="screenshot-label">Mobile (375px)</p>
    </div>
  </div>

  <div class="try-it">
    <h3>Try it yourself</h3>
    <div class="terminal-window">
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="terminal-dot red"></span>
          <span class="terminal-dot yellow"></span>
          <span class="terminal-dot green"></span>
        </div>
        <span class="terminal-title">Terminal</span>
      </div>
      <div class="terminal-body">
        <code><span class="prompt">$</span> npx heroshot</code>
        <button class="copy-btn" data-copy="npx heroshot">Copy</button>
      </div>
    </div>
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

  const copyBtn = document.querySelector('.copy-btn[data-copy]')
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(copyBtn.dataset.copy)
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(() => {
        copyBtn.textContent = 'Copy'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  }
})
</script>
