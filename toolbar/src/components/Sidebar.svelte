<script lang="ts">
  import ChevronLeftIcon from '../icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '../icons/ChevronRightIcon.svelte';
  import TrashIcon from '../icons/TrashIcon.svelte';
  import type { ScreenshotItem } from '../types';

  interface Props {
    screenshots: ScreenshotItem[];
    visible: boolean;
    editingId: string | null;
    draftId: string | null;
    selectedId: string | null;
    /** Position of selected element (to determine which side to show sidebar) */
    selectedElementPosition: 'left' | 'right' | null;
    onClose: () => void;
    onOpen: () => void;
    onSelect: (screenshot: ScreenshotItem) => void;
    onRemove: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onEditingComplete: () => void;
    onDraftConfirm: (id: string) => void;
  }

  let {
    screenshots,
    visible,
    editingId,
    draftId,
    selectedId,
    selectedElementPosition,
    onClose,
    onOpen,
    onSelect,
    onRemove,
    onRename,
    onEditingComplete,
    onDraftConfirm,
  }: Props = $props();

  // Determine which side to show sidebar (opposite of element position, default to right)
  let side = $derived<'left' | 'right'>(
    selectedElementPosition === 'right' ? 'left' : 'right'
  );

  let localEditingId = $state<string | null>(null);
  let editValue = $state('');
  let inputElement = $state<HTMLInputElement | null>(null);

  // Sort screenshots by createdAt (newest first)
  let sortedScreenshots = $derived(
    screenshots.toSorted((a, b) => b.createdAt - a.createdAt)
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

      // If this is a draft, confirm it (save to CLI)
      if (localEditingId === draftId) {
        onDraftConfirm(localEditingId);
      }
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

  /**
   * Get CSS class for list item based on state
   */
  function getItemClass(screenshotId: string): string {
    if (screenshotId === draftId) {
      return 'bg-green-700 ring-2 ring-green-400';
    }
    if (selectedId === screenshotId) {
      return 'bg-blue-600 ring-2 ring-blue-400';
    }
    return 'bg-slate-700/50 hover:bg-slate-600';
  }

  // Position styles based on side
  let visibleOffset = $derived(visible ? '16px' : '-260px');
  let positionStyle = $derived(
    side === 'right'
      ? `right: ${visibleOffset}; left: auto;`
      : `left: ${visibleOffset}; right: auto;`
  );

  // Collapsed tab position
  let tabPositionStyle = $derived(
    side === 'right'
      ? 'right: 0; left: auto;'
      : 'left: 0; right: auto;'
  );

  // Tab border radius based on side
  let tabBorderRadius = $derived(
    side === 'right'
      ? 'border-radius: 8px 0 0 8px;'
      : 'border-radius: 0 8px 8px 0;'
  );
</script>

<!-- Collapsed tab (bookmark) - only show when not visible -->
{#if !visible}
  <button
    type="button"
    class="fixed top-1/2 -translate-y-1/2 z-[2147483646] bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center shadow-lg pointer-events-auto"
    style="{tabPositionStyle} {tabBorderRadius} width: 24px; height: 48px;"
    onclick={onOpen}
    title="Open screenshots"
  >
    {#if side === 'right'}
      <ChevronLeftIcon size={16} />
    {:else}
      <ChevronRightIcon size={16} />
    {/if}
    {#if screenshots.length > 0}
      <span class="absolute -top-1 {side === 'right' ? '-left-1' : '-right-1'} bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{screenshots.length}</span>
    {/if}
  </button>
{/if}

<!-- Floating bar -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed top-4 z-[2147483646] transition-all duration-300 pointer-events-auto"
  style="{positionStyle}"
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="complementary"
  aria-label="Screenshots panel"
>
  <div class="w-64 max-h-[calc(100vh-32px)] bg-slate-800 rounded-xl shadow-2xl font-sans text-white flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-3 py-2 border-b border-slate-700">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Screenshots</h3>
      <button
        type="button"
        class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        onclick={onClose}
        title="Collapse panel"
      >
        {#if side === 'right'}
          <ChevronRightIcon size={14} />
        {:else}
          <ChevronLeftIcon size={14} />
        {/if}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      {#if sortedScreenshots.length === 0}
        <p class="text-slate-500 text-center py-6 text-xs">No screenshots yet.<br/>Click the picker to add one.</p>
      {:else}
        <ul class="space-y-1">
          <!-- eslint-disable @typescript-eslint/no-unsafe-argument -- Svelte each variable typing issue -->
          {#each sortedScreenshots as screenshot, index (screenshot.id)}
            <li
              class="group flex items-center gap-1.5 p-1.5 rounded-lg transition-colors {getItemClass(screenshot.id)}"
              data-testid="sidebar-item"
              data-item-index={index}
            >
              {#if localEditingId === screenshot.id || (selectedId === screenshot.id && screenshot.id !== draftId)}
                <!-- Selected or editing: show editable name -->
                <div class="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                  {#if localEditingId === screenshot.id}
                    <input
                      bind:this={inputElement}
                      bind:value={editValue}
                      type="text"
                      class="w-full px-1 py-0.5 bg-slate-900 border border-blue-500 rounded text-xs text-white outline-none"
                      onblur={handleBlur}
                      onkeydown={handleKeyDown}
                    />
                  {:else}
                    <span
                      class="text-xs text-white hover:bg-white/10 px-1 py-0.5 -mx-1 rounded cursor-text transition-colors truncate max-w-full"
                      onclick={() => startEditing(screenshot)}
                      role="button"
                      tabindex="0"
                      onkeydown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          startEditing(screenshot);
                        }
                      }}
                    >
                      {screenshot.name}
                    </span>
                  {/if}
                  <span class="text-[10px] text-slate-500 font-mono truncate max-w-full">{getFilename(screenshot.name)}</span>
                </div>
              {:else}
                <!-- Not selected: clicking anywhere selects -->
                <button
                  type="button"
                  class="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left"
                  onclick={() => onSelect(screenshot)}
                  title="Navigate to this element"
                >
                  <span class="text-xs text-white truncate max-w-full px-1 py-0.5 -mx-1">
                    {screenshot.name}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono truncate max-w-full">{getFilename(screenshot.name)}</span>
                </button>
              {/if}
              <button
                type="button"
                class="w-5 h-5 rounded flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                onclick={(event) => {
                  event.stopPropagation();
                  onRemove(screenshot.id);
                }}
                title="Remove screenshot"
                data-testid="delete-button"
              >
                <TrashIcon size={12} />
              </button>
            </li>
          {/each}
          <!-- eslint-enable @typescript-eslint/no-unsafe-argument -->
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Only animation - everything else is Tailwind */
</style>
