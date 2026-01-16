<script lang="ts">
  import type { BrowserSettings, ColorScheme } from '../types';

  type Props = {
    visible: boolean;
    settings: BrowserSettings;
    onClose: () => void;
    onSave: (settings: BrowserSettings) => void;
  }

  const props: Props = $props();

  // Local state for editing - initialized from derived values
  let width = $state(0);
  let height = $state(0);
  let colorScheme = $state<ColorScheme | undefined>();
  let deviceScaleFactor = $state<number | undefined>();

  // Update local state when settings prop changes or modal opens
  $effect(() => {
    if (props.visible) {
      width = props.settings.viewport.width;
      height = props.settings.viewport.height;
      colorScheme = props.settings.colorScheme;
      deviceScaleFactor = props.settings.deviceScaleFactor;
    }
  });

  function handleSave(): void {
    props.onSave({
      viewport: { width, height },
      colorScheme,
      deviceScaleFactor,
    });
    props.onClose();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      props.onClose();
    }
  }

  // Set color scheme and preview on page
  function setColorScheme(scheme: ColorScheme | undefined): void {
    colorScheme = scheme;
    const preview = scheme === 'light' || scheme === 'dark' ? scheme : '';
    document.documentElement.style.colorScheme = preview;
  }
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

      <!-- Scale Factor -->
      <div class="mb-4">
        <span class="block text-sm text-slate-400 mb-2">Scale (Retina)</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {deviceScaleFactor === undefined || deviceScaleFactor === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => deviceScaleFactor = undefined}
          >
            1x
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {deviceScaleFactor === 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => deviceScaleFactor = 2}
          >
            2x
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {deviceScaleFactor === 3 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => deviceScaleFactor = 3}
          >
            3x
          </button>
        </div>
        <p class="text-xs text-slate-500 mt-2">Higher scale = sharper images, larger file size</p>
      </div>

      <!-- Color Scheme -->
      <div class="mb-6">
        <span class="block text-sm text-slate-400 mb-2">Color Scheme</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === undefined ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => setColorScheme(undefined)}
            title="Capture both light and dark versions (default)"
          >
            Both
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'auto' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => setColorScheme('auto')}
            title="Use browser's color scheme preference"
          >
            Auto
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => setColorScheme('light')}
          >
            Light
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {colorScheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => setColorScheme('dark')}
          >
            Dark
          </button>
        </div>
        {#if colorScheme === undefined}
          <p class="text-xs text-slate-500 mt-2">Will capture two screenshots: -light and -dark variants</p>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          onclick={props.onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          onclick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}
