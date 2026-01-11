<script lang="ts">
  import type { BrowserSettings } from '../types';

  interface Props {
    visible: boolean;
    settings: BrowserSettings;
    onClose: () => void;
    onSave: (settings: BrowserSettings) => void;
  }

  const props: Props = $props();

  // Local state for editing - initialized from derived values
  let width = $state(0);
  let height = $state(0);
  let colorScheme = $state<'light' | 'dark' | 'both' | undefined>();

  // Update local state when settings prop changes or modal opens
  $effect(() => {
    if (props.visible) {
      width = props.settings.viewport.width;
      height = props.settings.viewport.height;
      colorScheme = props.settings.colorScheme;
    }
  });

  function handleSave(): void {
    props.onSave({
      viewport: { width, height },
      colorScheme,
    });
    props.onClose();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      props.onClose();
    }
  }

  // Apply color scheme to page for preview
  function applyColorScheme(scheme: 'light' | 'dark' | undefined): void {
    document.documentElement.style.colorScheme = scheme || '';
  }

  // Preview color scheme when changed
  $effect(() => {
    if (props.visible && colorScheme && colorScheme !== 'both') {
      applyColorScheme(colorScheme);
    }
  });
</script>

<svelte:document onkeydown={handleKeyDown} />

{#if props.visible}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-[2147483647] flex items-center justify-center pointer-events-auto"
    onclick={props.onClose}
    onkeydown={(event) => event.key === 'Enter' && props.onClose()}
    role="button"
    tabindex="0"
  >
    <!-- Modal -->
    <div
      class="bg-slate-800 rounded-lg p-6 w-80 shadow-2xl"
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      tabindex="-1"
    >
      <h2 class="text-lg font-semibold text-white mb-4">Settings</h2>

      <!-- Viewport -->
      <div class="mb-4">
        <span class="block text-sm text-slate-400 mb-2">Viewport Size</span>
        <div class="flex gap-2 items-center">
          <label class="sr-only" for="viewport-width">Width</label>
          <input
            id="viewport-width"
            type="number"
            bind:value={width}
            class="w-20 px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            min="320"
            max="3840"
          />
          <span class="text-slate-400">x</span>
          <label class="sr-only" for="viewport-height">Height</label>
          <input
            id="viewport-height"
            type="number"
            bind:value={height}
            class="w-20 px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            min="200"
            max="2160"
          />
          <span class="text-slate-500 text-sm">px</span>
        </div>
      </div>

      <!-- Color Scheme -->
      <div class="mb-6">
        <span class="block text-sm text-slate-400 mb-2">Color Scheme</span>
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === undefined ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => { colorScheme = undefined; applyColorScheme(); }}
          >
            Auto
          </button>
          <button
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => { colorScheme = 'light'; applyColorScheme('light'); }}
          >
            Light
          </button>
          <button
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => { colorScheme = 'dark'; applyColorScheme('dark'); }}
          >
            Dark
          </button>
          <button
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'both' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => colorScheme = 'both'}
            title="Capture both light and dark versions"
          >
            Both
          </button>
        </div>
        {#if colorScheme === 'both'}
          <p class="text-xs text-slate-500 mt-2">Will capture two screenshots: -light and -dark variants</p>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          onclick={props.onClose}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          onclick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
