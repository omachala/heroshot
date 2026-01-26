<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'npm' | 'curl' | 'brew' | 'docker'>('npm');

const installCommands = {
  npm: {
    raw: 'npm install -g heroshot',
    html: '<span class="hl-cmd">npm</span> install -g heroshot',
  },
  curl: {
    raw: 'curl -fsSL https://heroshot.sh/install.sh | sh',
    html: '<span class="hl-cmd">curl</span> -fsSL https://heroshot.sh/install.sh | sh',
  },
  brew: {
    raw: 'brew install omachala/heroshot/heroshot',
    html: '<span class="hl-cmd">brew</span> install omachala/heroshot/heroshot',
  },
  docker: {
    raw: 'docker pull heroshot/heroshot',
    html: '<span class="hl-cmd">docker</span> pull heroshot/heroshot',
  },
};

const quickStart = {
  raw: 'npx heroshot',
  html: '<span class="hl-cmd">npx</span> heroshot',
};

function copyCode(code: string, event: MouseEvent) {
  navigator.clipboard.writeText(code);
  const button = event.currentTarget as HTMLButtonElement;
  button.classList.add('copied');
  setTimeout(() => button.classList.remove('copied'), 2000);
}
</script>

<template>
  <div class="install-tabs">
    <!-- Quick Start -->
    <div class="quick-start">
      <p class="quick-label">Try it now <span class="no-install">— no install needed</span></p>
      <div class="code-block featured">
        <div class="code-header">
          <span class="lang">shell</span>
          <button class="copy" title="Copy Code" @click="copyCode(quickStart.raw, $event)"></button>
        </div>
        <pre><code v-html="quickStart.html"></code></pre>
      </div>
    </div>

    <!-- Install options -->
    <div class="install-options">
      <p class="install-label">Or install permanently:</p>
      <div class="tabs-row">
        <button :class="['tab-btn', { active: activeTab === 'npm' }]" @click="activeTab = 'npm'">
          npm
        </button>
        <button :class="['tab-btn', { active: activeTab === 'curl' }]" @click="activeTab = 'curl'">
          curl
        </button>
        <button :class="['tab-btn', { active: activeTab === 'brew' }]" @click="activeTab = 'brew'">
          Homebrew
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'docker' }]"
          @click="activeTab = 'docker'"
        >
          Docker
        </button>
      </div>

      <div v-show="activeTab === 'npm'" class="code-block">
        <div class="code-header">
          <span class="lang">shell</span>
          <button
            class="copy"
            title="Copy Code"
            @click="copyCode(installCommands.npm.raw, $event)"
          ></button>
        </div>
        <pre><code v-html="installCommands.npm.html"></code></pre>
      </div>
      <div v-show="activeTab === 'curl'" class="code-block">
        <div class="code-header">
          <span class="lang">shell</span>
          <button
            class="copy"
            title="Copy Code"
            @click="copyCode(installCommands.curl.raw, $event)"
          ></button>
        </div>
        <pre><code v-html="installCommands.curl.html"></code></pre>
      </div>
      <div v-show="activeTab === 'brew'" class="code-block">
        <div class="code-header">
          <span class="lang">shell</span>
          <button
            class="copy"
            title="Copy Code"
            @click="copyCode(installCommands.brew.raw, $event)"
          ></button>
        </div>
        <pre><code v-html="installCommands.brew.html"></code></pre>
      </div>
      <div v-show="activeTab === 'docker'" class="code-block">
        <div class="code-header">
          <span class="lang">shell</span>
          <button
            class="copy"
            title="Copy Code"
            @click="copyCode(installCommands.docker.raw, $event)"
          ></button>
        </div>
        <pre><code v-html="installCommands.docker.html"></code></pre>
      </div>
    </div>

    <a href="/docs/getting-started" class="learn-more">Full getting started guide</a>
  </div>
</template>

<style scoped>
.install-tabs {
  max-width: 600px;
  margin: 32px auto 0;
  padding: 32px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(42, 85, 128, 0.06);
}

.dark .install-tabs {
  background: rgba(22, 45, 74, 0.4);
  border-color: rgba(61, 106, 153, 0.3);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

/* Quick Start */
.quick-start {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.quick-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 12px 0;
}

.quick-label::before {
  content: '⚡';
  font-size: 18px;
}

.quick-label .no-install {
  font-weight: 400;
  color: var(--vp-c-text-2);
}

/* Install options */
.install-options {
  margin-bottom: 16px;
}

.install-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin: 0 0 12px 0;
}

.tabs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1.5px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.tab-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.tab-btn.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
}

/* Code blocks */
.code-block {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
  border: 1px solid var(--vp-c-divider);
}

.code-block.featured {
  border: 2px solid var(--vp-c-brand-1);
  box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid var(--vp-c-divider);
}

.dark .code-header {
  background: rgba(255, 255, 255, 0.04);
}

.code-header .lang {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
}

.code-header .copy {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' height='20' width='20' stroke='rgba(128,128,128,1)' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px;
}

.code-header .copy:hover {
  opacity: 1;
}

.code-header .copy.copied {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' height='20' width='20' stroke='%2310b981' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
  opacity: 1;
}

.code-block pre {
  margin: 0;
  padding: 12px 16px;
  overflow-x: auto;
}

.code-block code {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
  white-space: pre;
  display: block;
}

.code-block.featured code {
  font-size: 15px;
}

/* Syntax highlighting */
.code-block :deep(.hl-cmd) {
  color: #0550ae;
}
.code-block :deep(.hl-comment) {
  color: #6e7781;
}

.dark .code-block :deep(.hl-cmd) {
  color: #79c0ff;
}
.dark .code-block :deep(.hl-comment) {
  color: #8b949e;
}

.learn-more {
  display: inline-block;
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.learn-more:hover {
  text-decoration: underline;
}

.learn-more::after {
  content: ' \2192';
}

@media (max-width: 640px) {
  .tab-btn {
    padding: 5px 10px;
    font-size: 12px;
  }

  .code-block pre {
    padding: 10px;
  }

  .code-block code {
    font-size: 12px;
  }

  .code-block.featured code {
    font-size: 13px;
  }
}
</style>
