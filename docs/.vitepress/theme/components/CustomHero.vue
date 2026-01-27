<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

// Load JetBrains Mono font for terminal
onMounted(() => {
  if (!document.querySelector('link[href*="JetBrains+Mono"]')) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
});

const platforms = [
  { id: 'npx', label: 'npx', command: 'npx heroshot' },
  { id: 'npm', label: 'npm', command: 'npm install -g heroshot' },
  { id: 'curl', label: 'curl', command: 'curl -fsSL https://heroshot.sh/install.sh | bash' },
  { id: 'brew', label: 'brew', command: 'brew install heroshot' },
  { id: 'docker', label: 'docker', command: 'docker run -it heroshot/heroshot' },
  {
    id: 'mcp',
    label: 'MCP',
    command: `{
  "heroshot": {
    "command": "npx",
    "args": ["-y", "heroshot-mcp"]
  }
}`,
    multiline: true,
  },
];

const activePlatform = ref('npx');
const copied = ref(false);
const terminalBody = ref<HTMLElement | null>(null);

const activeCommand = () => {
  return platforms.find(p => p.id === activePlatform.value)?.command || '';
};

const switchPlatform = async (id: string) => {
  if (!terminalBody.value) {
    activePlatform.value = id;
    return;
  }

  // Get current height
  const startHeight = terminalBody.value.offsetHeight;
  terminalBody.value.style.height = startHeight + 'px';

  // Change platform
  activePlatform.value = id;

  // Wait for DOM update
  await nextTick();

  // Get new height
  terminalBody.value.style.height = 'auto';
  const endHeight = terminalBody.value.offsetHeight;
  terminalBody.value.style.height = startHeight + 'px';

  // Trigger reflow
  terminalBody.value.offsetHeight;

  // Animate to new height
  terminalBody.value.style.height = endHeight + 'px';

  // Clean up after animation
  setTimeout(() => {
    if (terminalBody.value) {
      terminalBody.value.style.height = 'auto';
    }
  }, 300);
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
  <div class="custom-hero">
    <div class="hero-left">
      <div class="text-section">
        <h1 class="title">
          <img src="/logo.svg" alt="" class="title-logo" />
          <span class="brand">Heroshot</span>
        </h1>
        <p class="tagline">free, open-source screenshot automation</p>
        <p class="description">
          Your UI changes constantly. Heroshot updates every screenshot in your docs with a single
          command.
        </p>
        <div class="actions">
          <a href="/docs/getting-started" class="action-btn primary">Get Started</a>
          <a href="https://github.com/omachala/heroshot" class="action-btn secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>

    <div class="hero-right">
      <div class="terminal-wrapper">
        <div class="terminal">
          <div class="terminal-header">
            <div class="terminal-tabs">
              <button
                v-for="platform in platforms"
                :key="platform.id"
                :class="['terminal-tab', { active: activePlatform === platform.id }]"
                @click="switchPlatform(platform.id)"
              >
                <template v-if="false">
                  <svg
                    v-if="platform.id === 'npx'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <!-- npm -->
                  <svg
                    v-if="platform.id === 'npm'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
                    />
                  </svg>
                  <!-- curl -->
                  <svg
                    v-if="platform.id === 'curl'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M.803 14.8169c0-.5342.433-.9665.9665-.9665.5335 0 .9665.4323.9665.9665 0 .5335-.433.9657-.9665.9657-.5335 0-.9666-.4322-.9666-.9657m2.736 0c0-.1963-.0532-.376-.1119-.5525-.2344-.7024-.876-1.2169-1.6575-1.2169-.1249 0-.2344.0465-.3524.0708C.6149 13.2865 0 13.9646 0 14.817c0 .9764.7923 1.7694 1.7695 1.7694.9772 0 1.7694-.793 1.7694-1.7694m-1.7694-7.149c.5335 0 .9665.433.9665.9665 0 .5335-.433.9665-.9665.9665-.5343 0-.9666-.433-.9666-.9665 0-.5335.4323-.9665.9666-.9665m0 2.7359c.9772 0 1.7694-.7923 1.7694-1.7694 0-.1956-.0532-.376-.1119-.5525-.2344-.7024-.8767-1.2169-1.6575-1.2169-.1249 0-.2344.0465-.3524.0716C.6149 7.104 0 7.782 0 8.6344c0 .9771.7923 1.7694 1.7695 1.7694m13.221-5.694c-.5342 0-.9665-.433-.9665-.9664a.966.966 0 01.9666-.9665c.5335 0 .9658.4322.9658.9665 0 .5334-.4323.9664-.9658.9664m-9.6 16.5133c-.5335 0-.9666-.433-.9666-.9665 0-.5342.433-.9665.9666-.9665a.966.966 0 01.9665.9665c0 .5335-.4323.9665-.9665.9665m9.6-19.2491c-.978 0-1.7695.7922-1.7695 1.7694 0 .2085.0525.4025.1187.5882L5.039 18.5581c-.803.1681-1.4179.8462-1.4179 1.6985 0 .9772.7923 1.7694 1.7695 1.7694.9772 0 1.7694-.7922 1.7694-1.7694 0-.1963-.0525-.3759-.111-.5525l8.3427-14.2728c.7778-.1865 1.3683-.8531 1.3683-1.688 0-.977-.793-1.7693-1.7694-1.7693m7.24 2.7359c-.5343 0-.9666-.433-.9666-.9665a.966.966 0 01.9665-.9665c.5335 0 .9666.4322.9666.9665 0 .5334-.433.9665-.9666.9665M12.6313 21.223c-.5343 0-.9665-.433-.9665-.9665a.966.966 0 01.9665-.9665c.5335 0 .9658.4323.9658.9665 0 .5335-.4323.9665-.9658.9665M22.2305 1.974c-.9772 0-1.7694.7922-1.7694 1.7694 0 .2085.0525.4025.1187.5882l-8.3009 14.2265c-.8021.1681-1.417.8462-1.417 1.6985 0 .9772.7922 1.7694 1.7694 1.7694.9764 0 1.7687-.7922 1.7687-1.7694 0-.1963-.0525-.3759-.1111-.5525l8.3427-14.2728C23.4094 5.2448 24 4.5782 24 3.7433c0-.977-.7923-1.7693-1.7695-1.7693"
                    />
                  </svg>
                  <!-- Homebrew -->
                  <svg
                    v-if="platform.id === 'brew'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M7.938 0a.214.214 0 0 0-.206.156c-.316 1.104.179 2.15.838 2.935.153.181.313.347.476.501a2.039 2.039 0 0 0-.665.02c-1.184.233-2.193.985-2.74 2.532a3.893 3.893 0 0 0-.2 1.466 1.565 1.565 0 0 0-1.156 1.504 1.59 1.59 0 0 0 1.227 1.541l.026 12.046c0 .195.1.377.264.482a.214.214 0 0 0 .008.005c.537.31 2.047.812 5.21.812 3.238 0 4.7-.678 5.181-1.04a.214.214 0 0 0 .008-.007.571.571 0 0 0 .206-.439c.002-.344.002-1.136.002-1.604a.143.143 0 0 1 .147-.144c.397.006.869.006 1.318.005a1.826 1.826 0 0 0 1.832-1.825v-5.804a1.826 1.826 0 0 0-1.825-1.826H16.56a.14.14 0 0 1-.143-.144V10.6h.007v-.001a1.573 1.573 0 0 0 1.356-1.556c0-.816-.627-1.489-1.424-1.563-.025-1.438-.437-2.126-.736-2.58a.214.214 0 0 0-.005-.007c-.364-.51-1.193-1.282-2.275-1.316-.503-.016-.842.124-1.125.254-.217.1-.42.177-.67.22.002-1.286.945-1.981.945-1.981a.214.214 0 0 0 .05-.298s-.087-.122-.21-.26c-.121-.136-.269-.294-.47-.378a.214.214 0 0 0-.079-.017.214.214 0 0 0-.145.055 4.308 4.308 0 0 0-.875 1.101 3.42 3.42 0 0 0-.133.273 3.497 3.497 0 0 0-.381-.846C9.794.978 9.063.436 8.017.016A.214.214 0 0 0 7.939 0zm.156.524c.85.378 1.43.83 1.79 1.403.274.438.426.962.484 1.584a3.07 3.07 0 0 0-.012.462 6.897 6.897 0 0 1-.168-.052 5.487 5.487 0 0 1-1.29-1.106c-.551-.657-.935-1.46-.804-2.291zM11.8 1.618c.07.054.141.101.212.18.034.039.032.04.058.073-.332.308-1.07 1.144-.952 2.453a.214.214 0 0 0 .222.195c.469-.017.782-.172 1.056-.299.273-.126.508-.228.931-.214.875.027 1.639.715 1.939 1.134.295.449.65 1 .663 2.36a1.66 1.66 0 0 0-.41.142 1.938 1.938 0 0 0-1.77-1.16 1.94 1.94 0 0 0-1.87 1.448 1.783 1.783 0 0 0-1.356-.64c-.484 0-.91.205-1.233.517a1.873 1.873 0 0 0-1.85-1.625c-.649 0-1.218.335-1.552.84a3.1 3.1 0 0 1 .157-.735c.51-1.437 1.355-2.045 2.42-2.254.367-.073.664-.011.99.095.325.106.671.262 1.094.342a.214.214 0 0 0 .252-.245c-.112-.67.073-1.266.336-1.744a3.71 3.71 0 0 1 .663-.863zM7.44 6.611a1.442 1.442 0 0 1 1.363 1.925.214.214 0 0 0 .168.283h.005a.214.214 0 0 0 .238-.146 1.373 1.373 0 0 1 2.613-.01.214.214 0 0 0 .417-.09 1.509 1.509 0 0 1 1.504-1.664c.678 0 1.249.445 1.442 1.056a.214.214 0 0 0 .259.143l.15-.04a.214.214 0 0 0 .051-.02 1.139 1.139 0 0 1 1.702.995 1.14 1.14 0 0 1-.985 1.131.214.214 0 0 0-.001 0 2.215 2.215 0 0 0-.485.126 10.65 10.65 0 0 1-1.176.365.214.214 0 0 0-.162.186 1.276 1.276 0 0 1-.146.478 2.07 2.07 0 0 0-.239 1.111l.001.151a.438.438 0 0 1-.16.36.665.665 0 0 1-.43.14.586.586 0 0 1-.588-.59.803.803 0 0 0-.38-.681.214.214 0 0 0-.002-.002c-.24-.145-.43-.37-.532-.636a.214.214 0 0 0-.207-.138 19.469 19.469 0 0 1-5.37-.6l-.003-.002a9.007 9.007 0 0 0-.838-.194h.003a1.16 1.16 0 0 1-.937-1.134c0-.619.488-1.118 1.101-1.14a.214.214 0 0 0 .204-.176 1.443 1.443 0 0 1 1.42-1.187zm8.549 4.106v.455c0 .314.259.573.572.573h1.329a1.397 1.397 0 0 1 1.397 1.397v5.804a1.396 1.396 0 0 1-1.402 1.396.214.214 0 0 0-.002 0c-.448.002-.918 0-1.31-.005a.573.573 0 0 0-.584.573c0 .468 0 1.262-.002 1.603a.214.214 0 0 0 0 .001c0 .042-.019.08-.05.107-.346.26-1.75.95-4.915.95-3.107 0-4.587-.52-4.99-.752a.143.143 0 0 1-.065-.118l-.025-11.955c.145.033.288.07.431.11a.214.214 0 0 0 .003 0c.115.031.246.064.383.097v10.37c0 .129.069.247.18.31.453.217 1.767.732 4.071.732 2.32 0 3.595-.626 4.022-.884a.357.357 0 0 0 .164-.3l.001-10.21c.267-.075.531-.158.792-.254zm-7.99.894a.493.493 0 0 1 .494.493v8.578a.493.493 0 0 1-.493.493.493.493 0 0 1-.494-.493v-8.578A.493.493 0 0 1 8 11.611zm8.652 1.14a.663.663 0 0 0-.662.662v5.208a.663.663 0 0 0 .662.662h1.14a.663.663 0 0 0 .662-.662v-5.209a.663.663 0 0 0-.662-.662zm0 .428h1.14a.233.233 0 0 1 .233.233v5.21a.233.233 0 0 1-.233.232h-1.14a.233.233 0 0 1-.233-.233v-5.209a.233.233 0 0 1 .233-.233z"
                    />
                  </svg>
                  <!-- Docker -->
                  <svg
                    v-if="platform.id === 'docker'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
                    />
                  </svg>
                  <!-- MCP -->
                  <svg
                    v-if="platform.id === 'mcp'"
                    class="tab-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect width="18" height="10" x="3" y="11" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" x2="8" y1="16" y2="16" />
                    <line x1="16" x2="16" y1="16" y2="16" />
                  </svg>
                </template>
                {{ platform.label }}
              </button>
            </div>
          </div>
          <div class="terminal-body" ref="terminalBody">
            <div class="command-line">
              <span v-if="activePlatform !== 'mcp'" class="prompt">$</span>
              <code
                :class="[
                  'command',
                  { 'command-small': activePlatform === 'curl' || activePlatform === 'mcp' },
                  { 'command-mcp': activePlatform === 'mcp' },
                ]"
                >{{ activeCommand() }}</code
              >
              <button class="copy-btn" @click="copyCommand" :title="copied ? 'Copied!' : 'Copy'">
                <svg
                  v-if="!copied"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
                  width="18"
                  height="18"
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
        </div>
      </div>
      <div class="platforms">
        <a href="/docs/integrations/vitepress" class="platform">
          <img src="/icons/vitepress.svg" alt="VitePress" />
          <span>VitePress</span>
        </a>
        <a href="/docs/integrations/docusaurus" class="platform">
          <img src="/icons/docusaurus.svg" alt="Docusaurus" />
          <span>Docusaurus</span>
        </a>
        <a href="/docs/integrations/mkdocs" class="platform">
          <img src="/icons/mkdocs.svg" alt="MkDocs" />
          <span>MkDocs</span>
        </a>
        <a href="/docs/integrations/sphinx" class="platform">
          <img src="/icons/sphinx.svg" alt="Sphinx" />
          <span>Sphinx</span>
        </a>
        <span class="platform-divider"></span>
        <a href="/docs/integrations/react" class="platform">
          <img src="/icons/react.svg" alt="React" />
          <span>React</span>
        </a>
        <a href="/docs/integrations/vue" class="platform">
          <img src="/icons/vue.svg" alt="Vue" />
          <span>Vue</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-hero {
  display: flex;
  align-items: center;
  gap: 48px;
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

.hero-left {
  flex: 1;
}

.text-section {
  max-width: 500px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px;
  font-size: 3.5rem;
  line-height: 1.1;
  transition: none;
}

.title-logo {
  width: 3.5rem;
  height: 3.5rem;
}

.brand {
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 700;
  font-style: italic;
  color: #ea580c;
}

.tagline {
  margin: 0 0 12px;
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 700;
  font-style: italic;
  font-size: 2.5rem;
  color: var(--navy-base);
  line-height: 1.2;
}

.description {
  margin: 0 0 24px;
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  text-decoration: none;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #ea580c;
  color: white;
}

.action-btn.primary:hover {
  background: #c2410c;
}

.action-btn.secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.action-btn.secondary:hover {
  border-color: var(--vp-c-brand-1);
}

/* Terminal */
.hero-right {
  flex-shrink: 0;
  width: 560px;
}

.terminal-wrapper {
  position: relative;
}

/* Orange glow effect */
.terminal-wrapper::before {
  content: '';
  position: absolute;
  inset: -50px;
  background: radial-gradient(
    ellipse at center,
    rgba(234, 88, 12, 0.3) 0%,
    rgba(251, 146, 60, 0.18) 35%,
    rgba(42, 85, 128, 0.08) 55%,
    transparent 75%
  );
  filter: blur(45px);
  z-index: 0;
  pointer-events: none;
  animation: terminal-glow 4s ease-in-out infinite alternate;
}

@keyframes terminal-glow {
  0% {
    opacity: 0.7;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.terminal {
  position: relative;
  z-index: 1;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #e9ecef;
  border-bottom: 1px solid var(--vp-c-divider);
}

.terminal-tabs {
  display: flex;
  flex: 1;
  gap: 2px;
}

.terminal-tabs button:last-child {
  margin-left: auto;
}

.terminal-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.terminal-tabs button:hover {
  color: var(--vp-c-text-1);
}

.terminal-tabs button.active {
  background: white;
  color: var(--vp-c-text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.terminal-body {
  padding: 40px 32px;
  transition: all 0.3s ease;
}

.command-line {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.prompt {
  color: var(--vp-c-brand-1);
  font-family:
    'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 20px;
  font-weight: 600;
}

.command {
  flex: 1;
  min-width: 0;
  font-family:
    'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 20px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: none;
  white-space: pre;
}

.command-small {
  font-size: 14px;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

/* Platforms */
.platforms {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 28px;
  margin-top: 32px;
}

.platform {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--vp-c-text-2);
  transition: color 0.2s;
}

.platform:hover {
  color: var(--vp-c-brand-1);
}

.platform img {
  width: 36px;
  height: 36px;
}

.platform span {
  font-size: 14px;
  font-weight: 500;
}

.platform-divider {
  width: 1px;
  height: 40px;
  background: var(--vp-c-divider);
  margin: 0 4px;
}

/* Responsive */
@media (max-width: 960px) {
  .custom-hero {
    flex-direction: column;
    text-align: center;
  }

  .hero-left {
    flex-direction: column;
  }

  .hero-right {
    width: 100%;
    max-width: 560px;
  }

  .actions {
    justify-content: center;
  }

  .title {
    justify-content: center;
  }

  .command-mcp {
    text-align: left;
  }
}

@media (max-width: 640px) {
  .hero-logo {
    width: 80px;
    height: 80px;
  }

  .title {
    font-size: 2rem;
  }

  .tagline {
    font-size: 1.1rem;
  }

  .terminal-tabs {
    flex-wrap: wrap;
  }

  .command {
    font-size: 16px;
  }

  .prompt {
    font-size: 16px;
  }
}
</style>
