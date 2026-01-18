<script lang="ts">
  import { tick } from 'svelte';
  import TrashIcon from '../icons/TrashIcon.svelte';
  import type { ScreenshotItem } from '../types';

  type Props = {
    screenshot: ScreenshotItem;
    /** Index in the sorted list (for testing) */
    index: number;
    /** Whether this item is selected */
    selected: boolean;
    /** Whether this item is a draft (not yet saved) */
    isDraft: boolean;
    /** Whether we're currently editing the name */
    isEditing: boolean;
    /** Current edit value (controlled by parent) */
    editValue: string;
    onSelect: () => void;
    onRemove: () => void;
    onStartEditing: () => void;
    onEditValueChange: (value: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
  }

  let {
    screenshot,
    index,
    selected,
    isDraft,
    isEditing,
    editValue,
    onSelect,
    onRemove,
    onStartEditing,
    onEditValueChange,
    onSaveEdit,
    onCancelEdit,
  }: Props = $props();

  // Local input element reference
  let inputElement = $state<HTMLInputElement | null>(null);

  // Focus and select input when editing starts
  $effect(() => {
    if (isEditing) {
      void (async () => {
        await tick();
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
        }
      })();
    }
  });

  /**
   * Get CSS class for list item based on state
   */
  let itemClass = $derived.by(() => {
    if (isDraft) {
      return 'bg-green-700 ring-2 ring-green-400';
    }
    if (selected) {
      return 'bg-blue-600 ring-2 ring-blue-400';
    }
    return 'bg-slate-700/50 hover:bg-slate-600';
  });

  /**
   * Handle keydown in input
   */
  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      onSaveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelEdit();
    }
  }
</script>

<li
  class="group flex items-center gap-1.5 p-1.5 rounded-lg transition-colors {itemClass}"
  data-testid="sidebar-item"
  data-item-index={index}
>
  {#if isEditing}
    <input
      bind:this={inputElement}
      value={editValue}
      oninput={(event) => onEditValueChange(event.currentTarget.value)}
      type="text"
      class="flex-1 min-w-0 px-1.5 py-0.5 bg-slate-900 border border-blue-500 rounded text-xs text-white outline-none"
      onblur={onSaveEdit}
      onkeydown={handleKeyDown}
    />
  {:else if selected && !isDraft}
    <span
      class="flex-1 min-w-0 text-xs text-white truncate px-1.5 py-0.5 hover:bg-white/10 rounded cursor-text transition-colors"
      onclick={onStartEditing}
      role="button"
      tabindex="0"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onStartEditing();
        }
      }}
    >
      {screenshot.name}
    </span>
  {:else}
    <button
      type="button"
      class="flex-1 min-w-0 text-xs text-white text-left truncate px-1.5 py-0.5"
      onclick={onSelect}
      title="Select to edit"
    >
      {screenshot.name}
    </button>
  {/if}
  <button
    type="button"
    class="w-5 h-5 rounded flex items-center justify-center text-slate-400 opacity-60 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
    onclick={(event) => {
      event.stopPropagation();
      onRemove();
    }}
    title="Remove screenshot"
    data-testid="delete-button"
  >
    <TrashIcon size={12} />
  </button>
</li>
