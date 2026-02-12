<script lang="ts">
  import type { BrowserSettings } from '../types';

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
  let lightSelected = $state(true);
  let darkSelected = $state(true);
  let deviceScaleFactor = $state<number | undefined>();
  let outputDirectory = $state('heroshots');
  let outputFormat = $state<'png' | 'jpeg'>('png');
  let jpegQuality = $state(80);
  let workers = $state<number | undefined>();

  // Update local state when settings prop changes or modal opens
  $effect(() => {
    if (props.visible) {
      width = props.settings.viewport.width;
      height = props.settings.viewport.height;
      deviceScaleFactor = props.settings.deviceScaleFactor;
      outputDirectory = props.settings.outputDirectory ?? 'heroshots';
      outputFormat = props.settings.outputFormat ?? 'png';
      jpegQuality = props.settings.jpegQuality ?? 80;
      workers = props.settings.workers;

      // Convert colorScheme to selection state
      const scheme = props.settings.colorScheme;
      if (scheme === 'light') {
        lightSelected = true;
        darkSelected = false;
      } else if (scheme === 'dark') {
        lightSelected = false;
        darkSelected = true;
      } else {
        // undefined or 'auto' → both selected
        lightSelected = true;
        darkSelected = true;
      }
    }
  });

  /**
   * Toggle light mode selection (ensure at least one is selected)
   */
  function toggleLight(): void {
    if (lightSelected && !darkSelected) return; // Can't deselect if it's the only one
    lightSelected = !lightSelected;
    updateColorSchemePreview();
  }

  /**
   * Toggle dark mode selection (ensure at least one is selected)
   */
  function toggleDark(): void {
    if (darkSelected && !lightSelected) return; // Can't deselect if it's the only one
    darkSelected = !darkSelected;
    updateColorSchemePreview();
  }

  /**
   * Update page preview based on selection
   */
  function updateColorSchemePreview(): void {
    // Preview first selected scheme
    const preview = lightSelected ? 'light' : 'dark';
    document.documentElement.style.colorScheme = preview;
  }

  /**
   * Convert selection state to colorScheme value
   */
  function getColorSchemeValue(): 'light' | 'dark' | undefined {
    if (lightSelected && darkSelected) return undefined; // Both = capture both
    if (lightSelected) return 'light';
    return 'dark';
  }

  function handleSave(): void {
    props.onSave({
      viewport: { width, height },
      colorScheme: getColorSchemeValue(),
      deviceScaleFactor,
      outputDirectory: outputDirectory || undefined,
      outputFormat: outputFormat === 'png' ? undefined : outputFormat,
      jpegQuality: outputFormat === 'jpeg' ? jpegQuality : undefined,
      workers,
    });
    props.onClose();
  }

  // Use capture phase to handle ESC before other handlers can stop propagation
  $effect(() => {
    if (!props.visible) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        props.onClose();
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => globalThis.removeEventListener('keydown', handleKeyDown, true);
  });
</script>

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
      </div>

      <!-- Color Scheme -->
      <div class="mb-4">
        <span class="block text-sm text-slate-400 mb-2">Color Scheme</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {lightSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={toggleLight}
          >
            Light
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {darkSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={toggleDark}
          >
            Dark
          </button>
        </div>
      </div>

      <!-- Divider -->
      <hr class="border-slate-600 my-4" />

      <!-- Output Directory -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2" for="output-directory">Output Directory</label>
        <input
          id="output-directory"
          type="text"
          bind:value={outputDirectory}
          class="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
          placeholder="heroshots"
        />
      </div>

      <!-- Output Format -->
      <div class="mb-4">
        <span class="block text-sm text-slate-400 mb-2">Output Format</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {outputFormat === 'png' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => outputFormat = 'png'}
          >
            PNG
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded text-sm transition-colors {outputFormat === 'jpeg' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
            onclick={() => outputFormat = 'jpeg'}
          >
            JPEG
          </button>
        </div>
      </div>

      <!-- JPEG Quality (shown only when format is jpeg) -->
      {#if outputFormat === 'jpeg'}
        <div class="mb-4">
          <label class="block text-sm text-slate-400 mb-2" for="jpeg-quality">JPEG Quality</label>
          <input
            id="jpeg-quality"
            type="number"
            bind:value={jpegQuality}
            class="w-20 px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            min="1"
            max="100"
          />
        </div>
      {/if}

      <!-- Workers -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2" for="workers">Workers</label>
        <input
          id="workers"
          type="number"
          bind:value={workers}
          class="w-20 px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          min="1"
          placeholder="1"
        />
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
