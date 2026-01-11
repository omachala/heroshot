<script lang="ts">
  import type { ScreenshotItem } from '../types';

  interface Props {
    screenshots: ScreenshotItem[];
    visible: boolean;
    editingId: string | null;
    onClose: () => void;
    onSelect: (screenshot: ScreenshotItem) => void;
    onRemove: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onEditingComplete: () => void;
  }

  let {
    screenshots,
    visible,
    editingId,
    onClose,
    onSelect,
    onRemove,
    onRename,
    onEditingComplete,
  }: Props = $props();

  let localEditingId = $state<string | null>(null);
  let editValue = $state('');
  let inputElement = $state<HTMLInputElement | null>(null);

  // Sort screenshots by createdAt (newest first)
  let sortedScreenshots = $derived(
    [...screenshots].sort((a, b) => b.createdAt - a.createdAt)
  );

  // Sync external editingId to local state
  $effect(() => {
    if (editingId && editingId !== localEditingId) {
      const screenshot = screenshots.find(s => s.id === editingId);
      if (screenshot) {
        localEditingId = editingId;
        editValue = screenshot.name;
      }
    }
  });

  // Focus and select input when editing starts
  $effect(() => {
    if (localEditingId && inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });

  /**
   * Generate filename from name (slug + .png)
   */
  function getFilename(name: string): string {
    return (
      name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/(?:^-|-$)/g, '') + '.png'
    );
  }

  /**
   * Start editing a screenshot name
   */
  function startEditing(screenshot: ScreenshotItem): void {
    localEditingId = screenshot.id;
    editValue = screenshot.name;
  }

  /**
   * Save the edited name
   */
  function saveEdit(): void {
    if (!localEditingId) return;

    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      onRename(localEditingId, trimmedValue);
    }

    localEditingId = null;
    onEditingComplete();
  }

  /**
   * Handle input blur - save edit
   */
  function handleBlur(): void {
    saveEdit();
  }

  /**
   * Handle keydown in input
   */
  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      localEditingId = null;
      onEditingComplete();
    }
  }

  /**
   * Stop keyboard events from propagating to the host page
   */
  function stopKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape' && !localEditingId) {
      onClose();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed top-0 right-0 h-screen z-[2147483646] transition-transform duration-300"
  class:pointer-events-none={!visible}
  class:pointer-events-auto={visible}
  style="transform: translateX({visible ? '0' : '100%'})"
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="complementary"
  aria-label="Screenshots sidebar"
>
  <div class="h-full w-72 bg-slate-800 shadow-xl font-sans text-white flex flex-col">
    <div class="flex items-center justify-between p-4 border-b border-slate-700">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Screenshots</h3>
      <button
        class="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        onclick={onClose}
        title="Collapse sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      {#if sortedScreenshots.length === 0}
        <p class="text-slate-500 text-center py-8 text-sm">No screenshots yet.<br/>Click the picker to add one.</p>
      {:else}
        <ul class="space-y-1">
          {#each sortedScreenshots as screenshot (screenshot.id)}
            <li class="group flex items-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
              <button
                class="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left"
                onclick={() => onSelect(screenshot)}
                title="Navigate to this element"
              >
                {#if localEditingId === screenshot.id}
                  <input
                    bind:this={inputElement}
                    bind:value={editValue}
                    type="text"
                    class="w-full px-1 py-0.5 bg-slate-900 border border-blue-500 rounded text-sm text-white outline-none"
                    onblur={handleBlur}
                    onkeydown={handleKeyDown}
                    onclick={(event) => event.stopPropagation()}
                  />
                {:else}
                  <span
                    class="text-sm text-white hover:bg-white/10 px-1 py-0.5 -mx-1 rounded cursor-text transition-colors"
                    onclick={(event) => {
                      event.stopPropagation();
                      startEditing(screenshot);
                    }}
                    role="button"
                    tabindex="0"
                    onkeydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.stopPropagation();
                        startEditing(screenshot);
                      }
                    }}
                  >
                    {screenshot.name}
                  </span>
                {/if}
                <span class="text-xs text-slate-500 font-mono">{getFilename(screenshot.name)}</span>
              </button>
              <button
                class="w-6 h-6 rounded flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                onclick={(event) => {
                  event.stopPropagation();
                  onRemove(screenshot.id);
                }}
                title="Remove screenshot"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Only animation - everything else is Tailwind */
</style>
