<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'npm' | 'curl' | 'brew' | 'docker' | 'npx'>('npm');

const tabs = [
  { id: 'npm', name: 'npm' },
  { id: 'curl', name: 'curl' },
  { id: 'brew', name: 'Homebrew' },
  { id: 'docker', name: 'Docker' },
  { id: 'npx', name: 'npx' },
] as const;

const codeBlocks = {
  npm: {
    install: {
      raw: 'npm install -g heroshot',
      html: '<span class="hl-cmd">npm</span> install -g heroshot',
    },
    run: {
      raw: 'heroshot',
      html: '<span class="hl-cmd">heroshot</span>                  <span class="hl-comment"># opens visual editor</span>',
    },
  },
  curl: {
    install: {
      raw: 'curl -fsSL https://heroshot.sh/install.sh | sh',
      html: '<span class="hl-cmd">curl</span> -fsSL https://heroshot.sh/install.sh | sh',
    },
    run: {
      raw: 'heroshot',
      html: '<span class="hl-cmd">heroshot</span>                  <span class="hl-comment"># opens visual editor</span>',
    },
  },
  npx: {
    install: {
      raw: 'npx heroshot https://example.com',
      html: '<span class="hl-cmd">npx</span> heroshot https://example.com',
    },
    run: {
      raw: 'npx heroshot https://example.com -o screenshot.png --light',
      html: '<span class="hl-cmd">npx</span> heroshot https://example.com -o screenshot.png --light',
    },
  },
  brew: {
    install: {
      raw: 'brew install omachala/heroshot/heroshot',
      html: '<span class="hl-cmd">brew</span> install omachala/heroshot/heroshot',
    },
    run: {
      raw: 'heroshot',
      html: '<span class="hl-cmd">heroshot</span>                  <span class="hl-comment"># opens visual editor</span>',
    },
  },
  docker: {
    install: {
      raw: 'docker pull heroshot/heroshot',
      html: '<span class="hl-cmd">docker</span> pull heroshot/heroshot',
    },
    run: {
      raw: 'docker run --rm -v $(pwd):/work heroshot/heroshot sync',
      html: '<span class="hl-cmd">docker</span> run --rm -v $(pwd):/work heroshot/heroshot sync',
    },
  },
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
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="tabs-content">
      <div v-show="activeTab === 'npm'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.npm.install.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.npm.install.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Run</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.npm.run.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.npm.run.html"></code></pre>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'curl'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.curl.install.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.curl.install.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Run</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.curl.run.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.curl.run.html"></code></pre>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'brew'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.brew.install.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.brew.install.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Run</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.brew.run.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.brew.run.html"></code></pre>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'docker'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.docker.install.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.docker.install.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Run</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.docker.run.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.docker.run.html"></code></pre>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'npx'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.npx.install.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.npx.install.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Run</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">shell</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.npx.run.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.npx.run.html"></code></pre>
          </div>
        </div>
      </div>

      <a href="/docs/getting-started" class="learn-more">Full guide</a>
    </div>

    <p class="install-note">
      No config needed. Heroshot opens a browser, you point and click to select elements,
      screenshots are saved automatically.
    </p>
  </div>
</template>

<style scoped>
.install-tabs {
  margin-top: 24px;
}

.tabs-header {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  cursor: pointer;
  font-weight: 500;
  font-size: 15px;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.tab-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.tab-button.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tabs-content {
  position: relative;
  background: var(--vp-c-bg);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.tab-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  min-width: 0;
}

@media (max-width: 768px) {
  .tab-panel {
    grid-template-columns: 1fr;
  }
}

.code-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.code-section .code-block {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.code-section .code-block pre {
  flex: 1;
}

.code-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
}

.code-label::before {
  content: '';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--vp-c-brand-soft);
  border-radius: 8px;
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 16px;
}

/* Install icon - download arrow */
.code-label[data-step='1']::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ea580c' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'/%3E%3C/svg%3E");
}

/* Run icon - play */
.code-label[data-step='2']::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ea580c' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3C/svg%3E");
}

.code-block {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-code-block-bg);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
}

.dark .code-header {
  background: rgba(255, 255, 255, 0.05);
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
  padding: 16px;
  overflow-x: auto;
}

.code-block code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  white-space: pre;
  display: block;
}

/* Simple syntax highlighting */
.code-block :deep(.hl-cmd) {
  color: #0550ae;
}
.code-block :deep(.hl-string) {
  color: #0a3069;
}
.code-block :deep(.hl-comment) {
  color: #6e7781;
}

.dark .code-block :deep(.hl-cmd) {
  color: #79c0ff;
}
.dark .code-block :deep(.hl-string) {
  color: #a5d6ff;
}
.dark .code-block :deep(.hl-comment) {
  color: #8b949e;
}

.learn-more {
  position: absolute;
  top: 24px;
  right: 24px;
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

.install-note {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .learn-more {
    position: static;
    display: block;
    margin-top: 16px;
    text-align: right;
  }
}

@media (max-width: 640px) {
  .tabs-header {
    gap: 6px;
  }

  .tab-button {
    padding: 10px 14px;
    font-size: 13px;
  }

  .tabs-content {
    padding: 16px;
  }

  .code-block code {
    font-size: 12px;
  }
}
</style>
