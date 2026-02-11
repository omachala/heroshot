<script lang="ts">
  import AnnotateIcon from '../icons/AnnotateIcon.svelte';
  import ChevronDownIcon from '../icons/ChevronDownIcon.svelte';
  import ChevronUpIcon from '../icons/ChevronUpIcon.svelte';
  import GripIcon from '../icons/GripIcon.svelte';
  import PickerIcon from '../icons/PickerIcon.svelte';
  import SettingsIcon from '../icons/SettingsIcon.svelte';
  import type { ScreenshotItem } from '../types';
  import ScreenshotItemComponent from './ScreenshotItem.svelte';

  type Props = {
    screenshots: ScreenshotItem[];
    /** Whether picker mode is active */
    pickerActive: boolean;
    /** Whether the screenshot list is expanded */
    expanded: boolean;
    /** Whether settings modal is visible */
    settingsVisible: boolean;
    editingId: string | null;
    draftId: string | null;
    selectedId: string | null;
    /** Active annotation tool type (null = not annotating) */
    annotationTool: string | null;
    onTogglePicker: () => void;
    onToggleExpanded: () => void;
    onToggleSettings: () => void;
    onDone: () => void;
    onSelect: (screenshot: ScreenshotItem) => void;
    onRemove: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onEditingComplete: () => void;
    onDraftConfirm: (id: string) => void;
    onToggleAnnotationTool: (tool: string) => void;
  }

  let {
    screenshots,
    pickerActive,
    expanded,
    settingsVisible,
    editingId,
    draftId,
    selectedId,
    annotationTool,
    onTogglePicker,
    onToggleExpanded,
    onToggleSettings,
    onDone,
    onSelect,
    onRemove,
    onRename,
    onEditingComplete,
    onDraftConfirm,
    onToggleAnnotationTool,
  }: Props = $props();

  let localEditingId = $state<string | null>(null);
  let editValue = $state('');
  let annotationDropdownOpen = $state(false);

  // Whether an element is selected (annotation button only visible when selected)
  let hasSelectedElement = $derived(selectedId !== null);

  const annotationTools = [
    { type: 'arrow', label: 'Arrow' },
    { type: 'rect', label: 'Rectangle' },
    { type: 'ellipse', label: 'Ellipse' },
  ];

  // Drag state for repositioning
  let isDragging = $state(false);
  let dragOffsetX = $state(0);
  let dragOffsetY = $state(0);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let dragStartOffsetX = $state(0);
  let dragStartOffsetY = $state(0);

  // Reference to the bar element for measuring
  let barElement: HTMLDivElement | null = $state(null);

  // Adjust position to ensure toolbar is fully visible on mount
  $effect(() => {
    if (!barElement) return;

    // Wait a tick for the element to be fully rendered
    globalThis.requestAnimationFrame(() => {
      if (!barElement) return;

      const rect = barElement.getBoundingClientRect();
      const viewportWidth = globalThis.innerWidth;
      const viewportHeight = globalThis.innerHeight;

      // Check if right edge is off screen
      if (rect.right > viewportWidth) {
        // Move left so the toolbar fits
        dragOffsetX = viewportWidth - rect.right - 8; // 8px margin
      }

      // Check if left edge is off screen
      if (rect.left < 0) {
        dragOffsetX = -rect.left + 8; // 8px margin
      }

      // Check if bottom edge is off screen
      if (rect.bottom > viewportHeight) {
        dragOffsetY = viewportHeight - rect.bottom - 8; // 8px margin
      }

      // Check if top edge is off screen
      if (rect.top < 0) {
        dragOffsetY = -rect.top + 8; // 8px margin
      }
    });
  });

  /**
   * Start dragging the editor bar
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
  // eslint-disable-next-line unicorn/no-array-sort -- toSorted not available in all targets
  let sortedScreenshots = $derived([...screenshots].sort((a, b) => b.createdAt - a.createdAt));

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
  function saveEdit(id: string): void {
    // Don't save if editing was already cancelled (e.g., by ESC key)
    if (localEditingId === null) return;

    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      onRename(id, trimmedValue);

      // If this is a draft, confirm it (save to CLI)
      if (id === draftId) {
        onDraftConfirm(id);
      }
    }

    localEditingId = null;
    onEditingComplete();
  }

  /**
   * Cancel editing - if editing a draft, remove it entirely
   */
  function cancelEdit(): void {
    // If canceling edit on a draft, remove the draft entirely
    if (localEditingId === draftId && draftId !== null) {
      onRemove(draftId);
    }
    localEditingId = null;
    onEditingComplete();
  }

  /**
   * Stop keyboard events from propagating to the host page
   */
  function stopKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    // Don't handle ESC if settings modal is open (modal handles it) or if editing
    if (event.key === 'Escape' && !localEditingId && !settingsVisible) {
      onToggleExpanded();
    }
  }

  // Position styles with drag offset
  let dragTransform = $derived(
    dragOffsetX !== 0 || dragOffsetY !== 0
      ? `transform: translate(${dragOffsetX}px, ${dragOffsetY}px);`
      : ''
  );
  let positionStyle = $derived(`right: 16px; left: auto; ${dragTransform}`);
</script>

<!-- Editor Bar - draggable panel with toolbar and screenshot list -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  bind:this={barElement}
  class="fixed top-4 z-[2147483647] pointer-events-auto {isDragging ? '' : 'transition-all duration-300'}"
  style="{positionStyle}"
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="complementary"
  aria-label="Heroshot editor panel"
>
  <div class="w-64 max-h-[calc(100vh-32px)] bg-slate-800 rounded-xl shadow-2xl font-sans text-white flex flex-col overflow-hidden">
    <!-- Header with drag handle and toolbar buttons -->
    <div
      class="flex items-center justify-between px-2 py-2 border-b border-slate-700"
      style="cursor: {isDragging ? 'grabbing' : 'grab'}; user-select: none; touch-action: none;"
      onpointerdown={handleDragStart}
      onpointermove={handleDragMove}
      onpointerup={handleDragEnd}
      onpointercancel={handleDragEnd}
    >
      <!-- Left: drag handle -->
      <div class="flex items-center gap-1 pointer-events-none text-slate-500">
        <GripIcon size={12} />
      </div>

      <!-- Center: action buttons -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="w-8 h-8 rounded-md flex items-center justify-center transition-colors {pickerActive ? 'bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}"
          onclick={onTogglePicker}
          onpointerdown={(event) => event.stopPropagation()}
          title="Pick element"
          aria-label="Pick element"
          aria-pressed={pickerActive}
        >
          <PickerIcon size={18} />
        </button>

        {#if hasSelectedElement}
          <div class="relative">
            <div class="flex">
              <button
                type="button"
                class="w-7 h-8 rounded-l-md flex items-center justify-center transition-colors {annotationTool ? 'bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'}"
                onclick={() => onToggleAnnotationTool(annotationTool ?? 'arrow')}
                onpointerdown={(event) => event.stopPropagation()}
                title="Annotate ({annotationTool ?? 'arrow'})"
                aria-label="Annotate ({annotationTool ?? 'arrow'})"
              >
                <AnnotateIcon size={16} />
              </button>
              <button
                type="button"
                class="w-5 h-8 rounded-r-md flex items-center justify-center transition-colors border-l border-slate-600 {annotationTool ? 'bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'}"
                onclick={() => { annotationDropdownOpen = !annotationDropdownOpen; }}
                onpointerdown={(event) => event.stopPropagation()}
                title="Choose annotation type"
                aria-label="Choose annotation type"
                aria-expanded={annotationDropdownOpen}
              >
                <ChevronDownIcon size={10} />
              </button>
            </div>
            {#if annotationDropdownOpen}
              <div class="absolute top-9 left-0 bg-slate-700 rounded-md shadow-lg border border-slate-600 py-1 min-w-28 z-10">
                {#each annotationTools as tool (tool.type)}
                  <button
                    type="button"
                    class="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-600 transition-colors {annotationTool === tool.type ? 'text-orange-400' : 'text-white'}"
                    onclick={() => { onToggleAnnotationTool(tool.type); annotationDropdownOpen = false; }}
                    onpointerdown={(event) => event.stopPropagation()}
                  >
                    {tool.label}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <button
          type="button"
          class="w-8 h-8 rounded-md flex items-center justify-center transition-colors {settingsVisible ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}"
          onclick={onToggleSettings}
          onpointerdown={(event) => event.stopPropagation()}
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon size={18} />
        </button>

        <button
          type="button"
          class="h-8 px-2.5 rounded-md flex items-center justify-center transition-colors bg-slate-600 hover:bg-slate-500 text-sm font-medium"
          onclick={onDone}
          onpointerdown={(event) => event.stopPropagation()}
          title="Done"
        >
          Done
        </button>
      </div>

      <!-- Right: expand/collapse -->
      <button
        type="button"
        class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        onclick={onToggleExpanded}
        onpointerdown={(event) => event.stopPropagation()}
        title={expanded ? 'Collapse list' : 'Expand list'}
        aria-label={expanded ? 'Collapse screenshot list' : 'Expand screenshot list'}
        aria-expanded={expanded}
      >
        {#if expanded}
          <ChevronUpIcon size={14} />
        {:else}
          <ChevronDownIcon size={14} />
        {/if}
      </button>
    </div>

    <!-- Screenshot list (collapsible) -->
    {#if expanded}
    <div class="flex-1 overflow-y-auto">
      <!-- List header -->
      <div class="flex items-center gap-1.5 px-3 py-2 border-b border-slate-700/50">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Screenshots</h3>
        {#if screenshots.length > 0}
          <span class="bg-slate-600 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{screenshots.length}</span>
        {/if}
      </div>

      <div class="p-2">
        {#if sortedScreenshots.length === 0}
          <p class="text-slate-500 text-center py-6 text-xs">No screenshots yet.<br/>Click the picker to add one.</p>
        {:else}
          <ul class="space-y-1">
            {#each sortedScreenshots as screenshot, index (screenshot.id)}
              <ScreenshotItemComponent
                {screenshot}
                {index}
                selected={selectedId === screenshot.id}
                isDraft={draftId === screenshot.id}
                isEditing={localEditingId === screenshot.id}
                {editValue}
                onSelect={() => onSelect(screenshot)}
                onRemove={() => onRemove(screenshot.id)}
                onStartEditing={() => startEditing(screenshot)}
                onEditValueChange={(value) => editValue = value}
                onSaveEdit={() => saveEdit(screenshot.id)}
                onCancelEdit={cancelEdit}
              />
            {/each}
          </ul>
        {/if}
      </div>
    </div>
    {/if}
  </div>
</div>

