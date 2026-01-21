<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'vitepress' | 'docusaurus' | 'mkdocs'>('docusaurus');

const tabs = [
  { id: 'docusaurus', name: 'Docusaurus' },
  { id: 'vitepress', name: 'VitePress' },
  { id: 'mkdocs', name: 'MkDocs' },
] as const;

// Simple manual syntax highlighting with HTML spans
const codeBlocks = {
  vitepress: {
    step1: {
      lang: 'bash',
      raw: 'npm install heroshot\nheroshot',
      html: '<span class="hl-cmd">npm</span> install heroshot\nheroshot',
    },
    step2: {
      lang: 'ts',
      file: '.vitepress/config.ts',
      raw: `import { heroshot } from 'heroshot/plugins/vite';

export default defineConfig({
  vite: { plugins: [heroshot()] }
});`,
      html: `<span class="hl-keyword">import</span> { heroshot } <span class="hl-keyword">from</span> <span class="hl-string">'heroshot/plugins/vite'</span>;

<span class="hl-keyword">export default</span> <span class="hl-fn">defineConfig</span>({
  vite: { plugins: [<span class="hl-fn">heroshot</span>()] }
});`,
    },
    step3: {
      lang: 'vue',
      raw:
        '<' +
        `script setup>
import { Heroshot } from 'heroshot/vue';
</` +
        `script>

<Heroshot name="dashboard" alt="Dashboard" />`,
      html: `<span class="hl-tag">&lt;script setup&gt;</span>
<span class="hl-keyword">import</span> { Heroshot } <span class="hl-keyword">from</span> <span class="hl-string">'heroshot/vue'</span>;
<span class="hl-tag">&lt;/script&gt;</span>

<span class="hl-tag">&lt;Heroshot</span> <span class="hl-attr">name</span>=<span class="hl-string">"dashboard"</span> <span class="hl-attr">alt</span>=<span class="hl-string">"Dashboard"</span> <span class="hl-tag">/&gt;</span>`,
    },
  },
  docusaurus: {
    step1: {
      lang: 'bash',
      raw: 'npm install heroshot\nheroshot',
      html: '<span class="hl-cmd">npm</span> install heroshot\nheroshot',
    },
    step2: {
      lang: 'ts',
      file: 'docusaurus.config.ts',
      raw: `plugins: [
  ['heroshot/plugins/docusaurus', {}]
]`,
      html: `plugins: [
  [<span class="hl-string">'heroshot/plugins/docusaurus'</span>, {}]
]`,
    },
    step3: {
      lang: 'tsx',
      raw: `import { Heroshot } from 'heroshot/docusaurus';

<Heroshot name="dashboard" alt="Dashboard" />`,
      html: `<span class="hl-keyword">import</span> { Heroshot } <span class="hl-keyword">from</span> <span class="hl-string">'heroshot/docusaurus'</span>;

<span class="hl-tag">&lt;Heroshot</span> <span class="hl-attr">name</span>=<span class="hl-string">"dashboard"</span> <span class="hl-attr">alt</span>=<span class="hl-string">"Dashboard"</span> <span class="hl-tag">/&gt;</span>`,
    },
  },
  mkdocs: {
    step1: {
      lang: 'bash',
      raw: 'npm install heroshot\nheroshot',
      html: '<span class="hl-cmd">npm</span> install heroshot\nheroshot',
    },
    step2: {
      lang: 'yaml',
      file: 'mkdocs.yml',
      raw: `plugins:
  - macros:
      modules: [heroshot]`,
      html: `<span class="hl-attr">plugins</span>:
  - <span class="hl-attr">macros</span>:
      <span class="hl-attr">modules</span>: [heroshot]`,
    },
    step3: {
      lang: 'jinja',
      raw: '{{ heroshot("dashboard", "Dashboard overview") }}',
      html: '{{ <span class="hl-fn">heroshot</span>(<span class="hl-string">"dashboard"</span>, <span class="hl-string">"Dashboard overview"</span>) }}',
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
  <div class="integration-tabs">
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
      <!-- VitePress -->
      <div v-show="activeTab === 'vitepress'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.vitepress.step1.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.vitepress.step1.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.vitepress.step1.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Configure</p>
          <div class="code-block">
            <div class="code-header">
              <span class="file">{{ codeBlocks.vitepress.step2.file }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.vitepress.step2.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.vitepress.step2.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="3">Use</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.vitepress.step3.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.vitepress.step3.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.vitepress.step3.html"></code></pre>
          </div>
        </div>
        <a href="/docs/integrations/vitepress" class="learn-more">Full VitePress Guide</a>
      </div>

      <!-- Docusaurus -->
      <div v-show="activeTab === 'docusaurus'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.docusaurus.step1.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.docusaurus.step1.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.docusaurus.step1.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Configure</p>
          <div class="code-block">
            <div class="code-header">
              <span class="file">{{ codeBlocks.docusaurus.step2.file }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.docusaurus.step2.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.docusaurus.step2.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="3">Use</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.docusaurus.step3.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.docusaurus.step3.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.docusaurus.step3.html"></code></pre>
          </div>
        </div>
        <a href="/docs/integrations/docusaurus" class="learn-more">Full Docusaurus Guide</a>
      </div>

      <!-- MkDocs -->
      <div v-show="activeTab === 'mkdocs'" class="tab-panel">
        <div class="code-section">
          <p class="code-label" data-step="1">Install</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.mkdocs.step1.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.mkdocs.step1.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.mkdocs.step1.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="2">Configure</p>
          <div class="code-block">
            <div class="code-header">
              <span class="file">{{ codeBlocks.mkdocs.step2.file }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.mkdocs.step2.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.mkdocs.step2.html"></code></pre>
          </div>
        </div>
        <div class="code-section">
          <p class="code-label" data-step="3">Use</p>
          <div class="code-block">
            <div class="code-header">
              <span class="lang">{{ codeBlocks.mkdocs.step3.lang }}</span>
              <button
                class="copy"
                title="Copy Code"
                @click="copyCode(codeBlocks.mkdocs.step3.raw, $event)"
              ></button>
            </div>
            <pre><code v-html="codeBlocks.mkdocs.step3.html"></code></pre>
          </div>
        </div>
        <a href="/docs/integrations/mkdocs" class="learn-more">Full MkDocs Guide</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.integration-tabs {
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
}

.tab-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .tab-panel {
    grid-template-columns: 1fr;
  }
}

.code-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

/* Configure icon - gear */
.code-label[data-step='2']::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ea580c' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E");
}

/* Use icon - code brackets */
.code-label[data-step='3']::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ea580c' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'/%3E%3C/svg%3E");
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

.code-header .file {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
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
}

/* Simple syntax highlighting */
.code-block :deep(.hl-keyword) {
  color: #cf222e;
}
.code-block :deep(.hl-string) {
  color: #0a3069;
}
.code-block :deep(.hl-comment) {
  color: #6e7781;
}
.code-block :deep(.hl-fn) {
  color: #8250df;
}
.code-block :deep(.hl-cmd) {
  color: #0550ae;
}
.code-block :deep(.hl-tag) {
  color: #116329;
}
.code-block :deep(.hl-attr) {
  color: #0550ae;
}

.dark .code-block :deep(.hl-keyword) {
  color: #ff7b72;
}
.dark .code-block :deep(.hl-string) {
  color: #a5d6ff;
}
.dark .code-block :deep(.hl-comment) {
  color: #8b949e;
}
.dark .code-block :deep(.hl-fn) {
  color: #d2a8ff;
}
.dark .code-block :deep(.hl-cmd) {
  color: #79c0ff;
}
.dark .code-block :deep(.hl-tag) {
  color: #7ee787;
}
.dark .code-block :deep(.hl-attr) {
  color: #79c0ff;
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

@media (max-width: 900px) {
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
