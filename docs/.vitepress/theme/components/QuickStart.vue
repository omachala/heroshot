<script setup lang="ts">
import { ref } from 'vue';

const platforms = [
  { id: 'npx', label: 'npx', command: 'npx heroshot' },
  { id: 'npm', label: 'npm', command: 'npm install -g heroshot' },
  { id: 'curl', label: 'curl', command: 'curl -fsSL https://heroshot.sh/install.sh | bash' },
  { id: 'brew', label: 'Homebrew', command: 'brew install heroshot' },
  { id: 'docker', label: 'Docker', command: 'docker run -it heroshot/heroshot' },
];

const activePlatform = ref('npx');
const copied = ref(false);

const activeCommand = () => {
  return platforms.find(p => p.id === activePlatform.value)?.command || '';
};

const copyCommand = async () => {
  await navigator.clipboard.writeText(activeCommand());
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <div class="quick-start">
    <div class="platform-tabs">
      <button
        v-for="platform in platforms"
        :key="platform.id"
        :class="{ active: activePlatform === platform.id }"
        @click="activePlatform = platform.id"
      >
        {{ platform.label }}
      </button>
    </div>
    <div class="command-box">
      <code class="command">{{ activeCommand() }}</code>
      <button class="copy-btn" @click="copyCommand" :title="copied ? 'Copied!' : 'Copy'">
        <svg
          v-if="!copied"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.quick-start {
  max-width: 700px;
  margin: 0 auto 48px;
  padding: 0 24px;
  text-align: center;
}

.platform-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.platform-tabs button {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.platform-tabs button:hover {
  color: var(--vp-c-text-1);
}

.platform-tabs button.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.command-box {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px 20px;
}

.command {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 26px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: -0.5px;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .command {
    font-size: 18px;
  }

  .command-box {
    padding: 12px 16px;
  }

  .platform-tabs button {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>
