<script lang="ts">
  import ChevronDownIcon from '../icons/ChevronDownIcon.svelte';
  import ChevronUpIcon from '../icons/ChevronUpIcon.svelte';
  import GripIcon from '../icons/GripIcon.svelte';
  import TrashIcon from '../icons/TrashIcon.svelte';
  import type { ScreenshotItem } from '../types';

  interface Props {
    screenshots: ScreenshotItem[];
    /** Whether the content list is expanded */
    expanded: boolean;
    editingId: string | null;
    draftId: string | null;
    selectedId: string | null;
    /** Position of selected element (to determine which side to show sidebar) */
    selectedElementPosition: 'left' | 'right' | null;
    onToggle: () => void;
    onSelect: (screenshot: ScreenshotItem) => void;
    onRemove: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onEditingComplete: () => void;
    onDraftConfirm: (id: string) => void;
  }

  let {
    screenshots,
    expanded,
    editingId,
    draftId,
    selectedId,
    selectedElementPosition,
    onToggle,
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

  // Drag state for repositioning
  let isDragging = $state(false);
  let dragOffsetX = $state(0);
  let dragOffsetY = $state(0);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let dragStartOffsetX = $state(0);
  let dragStartOffsetY = $state(0);

  /**
   * Start dragging the sidebar
   */
  function handleDragStart(event: PointerEvent): void {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartOffsetX = dragOffsetX;
    dragStartOffsetY = dragOffsetY;
    if (event.target instanceof HTMLElement) {
      event.target.setPointerCapture(event.pointerId);
    }
  }

  /**
   * Handle drag movement
   */
  function handleDragMove(event: PointerEvent): void {
    if (!isDragging) return;
    dragOffsetX = dragStartOffsetX + (event.clientX - dragStartX);
    dragOffsetY = dragStartOffsetY + (event.clientY - dragStartY);
  }

  /**
   * End dragging
   */
  function handleDragEnd(event: PointerEvent): void {
    isDragging = false;
    if (event.target instanceof HTMLElement) {
      event.target.releasePointerCapture(event.pointerId);
    }
  }

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
      onToggle();
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

  // Position styles based on side and drag offset
  let dragTransform = $derived(
    dragOffsetX !== 0 || dragOffsetY !== 0
      ? `transform: translate(${dragOffsetX}px, ${dragOffsetY}px);`
      : ''
  );
  let positionStyle = $derived(
    side === 'right'
      ? `right: 16px; left: auto; ${dragTransform}`
      : `left: 16px; right: auto; ${dragTransform}`
  );
</script>

<!-- Floating sidebar panel -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="fixed top-4 z-[2147483646] pointer-events-auto {isDragging ? '' : 'transition-all duration-300'}"
  style="{positionStyle}"
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="complementary"
  aria-label="Screenshots panel"
>
  <div class="w-64 max-h-[calc(100vh-32px)] bg-slate-800 rounded-xl shadow-2xl font-sans text-white flex flex-col overflow-hidden">
    <div
      class="flex items-center justify-between px-3 py-2 {expanded ? 'border-b border-slate-700' : ''}"
      style="cursor: {isDragging ? 'grabbing' : 'grab'}; user-select: none; touch-action: none;"
      onpointerdown={handleDragStart}
      onpointermove={handleDragMove}
      onpointerup={handleDragEnd}
      onpointercancel={handleDragEnd}
    >
      <div class="flex items-center gap-1.5 pointer-events-none">
        <GripIcon size={12} />
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Screenshots</h3>
        {#if screenshots.length > 0}
          <span class="bg-slate-600 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{screenshots.length}</span>
        {/if}
      </div>
      <button
        type="button"
        class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        onclick={onToggle}
        onpointerdown={(event) => event.stopPropagation()}
        title={expanded ? 'Collapse list' : 'Expand list'}
      >
        {#if expanded}
          <ChevronUpIcon size={14} />
        {:else}
          <ChevronDownIcon size={14} />
        {/if}
      </button>
    </div>

    {#if expanded}
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
    {/if}
  </div>
</div>

<style>
  /* Only animation - everything else is Tailwind */
</style>
