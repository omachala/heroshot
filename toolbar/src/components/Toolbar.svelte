<script lang="ts">
  import PickerIcon from '../icons/PickerIcon.svelte';
  import SettingsIcon from '../icons/SettingsIcon.svelte';
  import SidebarIcon from '../icons/SidebarIcon.svelte';
  import { generateSmartName, generateUid } from '../lib/naming';
  import type { BrowserSettings, Padding, ScreenshotItem, ScrollPosition, ToolbarJob } from '../types';
  import ElementPicker from './ElementPicker.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import Sidebar from './Sidebar.svelte';

  interface Props {
    initialScreenshots?: ScreenshotItem[];
    initialSettings?: BrowserSettings;
    pendingJob?: ToolbarJob | null;
    initialSelectedId?: string | null;
    initialSidebarVisible?: boolean;
  }

  const props: Props = $props();

  // Default settings
  const defaultSettings: BrowserSettings = {
    viewport: { width: 1280, height: 800 },
    colorScheme: undefined,
  };

  // Emit event to CLI
  type EmitEvent = Parameters<NonNullable<typeof globalThis.__heroshot>['emit']>[0];
  function emit(event: EmitEvent): void {
    globalThis.__heroshot?.emit(event);
  }

  // State
  let isPickerActive = $state(false);
  let screenshots = $state<ScreenshotItem[]>([...(props.initialScreenshots ?? [])]);
  let settings = $state<BrowserSettings>({ ...defaultSettings, ...props.initialSettings });
  let sidebarVisible = $state(props.initialSidebarVisible ?? false);
  let settingsVisible = $state(false);
  let editingId = $state<string | null>(null);
  let draftId = $state<string | null>(null); // ID of draft item (not yet saved)
  let selectedScreenshotId = $state<string | null>(props.initialSelectedId ?? null);
  let selectedElementPosition = $state<'left' | 'right' | null>(null);

  // Reference to ElementPicker for calling methods
  let elementPicker: ElementPicker;

  // Derived
  let screenshotCount = $derived(screenshots.length);
  let sidebarButtonClass = $derived(sidebarVisible ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600');

  /**
   * Toggle picker mode
   */
  function togglePicker(): void {
    isPickerActive = !isPickerActive;
  }

  /**
   * Handle new element picked - create draft
   */
  function handleNewElement(selector: string): void {
    const { href } = globalThis.location;
    const smartName = generateSmartName(selector);
    const id = generateUid();

    const screenshotData: ScreenshotItem = {
      id,
      name: smartName,
      url: href,
      selector,
      createdAt: Date.now(),
      scroll: { x: globalThis.scrollX, y: globalThis.scrollY },
    };

    // Add as draft (at the beginning for visibility)
    screenshots = [screenshotData, ...screenshots];
    draftId = id;
    sidebarVisible = true;
    editingId = id; // Focus the name input
    selectedElementPosition = elementPicker.getSelectedElementSide();
  }

  /**
   * Handle padding update for existing screenshot
   */
  function handlePaddingUpdate(id: string, padding: Padding): void {
    const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id
        ? { ...screenshot, padding: hasPadding ? { ...padding } : undefined }
        : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      // Only emit for non-draft items
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle scroll position update for existing screenshot
   */
  function handleScrollUpdate(id: string, scroll: ScrollPosition): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id
        ? { ...screenshot, scroll: { ...scroll } }
        : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      // Only emit for non-draft items
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle cancel - remove draft if exists
   */
  function handleElementCancel(): void {
    if (draftId) {
      // Remove draft item
      screenshots = screenshots.filter((screenshot) => screenshot.id !== draftId);
      draftId = null;
      editingId = null;
    }
    selectedScreenshotId = null;
    selectedElementPosition = null;
  }

  /**
   * Handle deselect - clear selection without removing draft
   */
  function handleDeselect(): void {
    selectedScreenshotId = null;
    selectedElementPosition = null;
  }

  /**
   * Handle draft confirmed (name submitted)
   */
  function handleDraftConfirm(id: string): void {
    if (id === draftId) {
      // Get current padding and scroll from picker and update the screenshot
      const padding = elementPicker.getCurrentPadding();
      const scroll = elementPicker.getCurrentScroll();
      const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

      screenshots = screenshots.map((screenshot) =>
        screenshot.id === id
          ? { ...screenshot, padding: hasPadding ? { ...padding } : undefined, scroll: { ...scroll } }
          : screenshot
      );

      const saved = screenshots.find((screenshot) => screenshot.id === id);
      if (saved) {
        emit({ type: 'screenshot-added', data: saved });
      }

      draftId = null;
      editingId = null;
      selectedScreenshotId = id; // Keep it selected
      elementPicker.confirmDraft(id); // Convert to existing (keeps element visible)
    }
  }

  /**
   * Handle screenshot removal from sidebar
   */
  function handleRemoveScreenshot(id: string): void {
    screenshots = screenshots.filter((screenshot) => screenshot.id !== id);
    emit({ type: 'screenshot-removed', id });
  }

  /**
   * Handle screenshot rename from sidebar
   */
  function handleRenameScreenshot(id: string, newName: string): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id ? { ...screenshot, name: newName } : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated) {
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle screenshot selection from sidebar
   */
  function handleSelectScreenshot(screenshot: ScreenshotItem): void {
    selectedScreenshotId = screenshot.id;

    const currentUrl = globalThis.location.href;
    if (screenshot.url === currentUrl) {
      // Same page - highlight directly
      elementPicker.highlightElement(screenshot.selector, screenshot.id);
      // Update position after element is found (give time for scrollIntoView)
      globalThis.setTimeout(() => {
        selectedElementPosition = elementPicker.getSelectedElementSide();
      }, 200);
    } else {
      // Different page - tell CLI to navigate
      emit({
        type: 'screenshot-selected',
        id: screenshot.id,
        url: screenshot.url,
        selector: screenshot.selector,
      });
    }
  }

  /**
   * Execute pending job from CLI
   */
  function executePendingJob(job: ToolbarJob): void {
    elementPicker.highlightElement(job.selector, job.screenshotId);
    // Update position after element is found
    globalThis.setTimeout(() => {
      selectedElementPosition = elementPicker.getSelectedElementSide();
    }, 200);
    emit({ type: 'job-complete' });
  }

  /**
   * Type guard for ToolbarJob
   */
  function isToolbarJob(value: unknown): value is ToolbarJob {
    return typeof value === 'object' && value !== null && 'type' in value && 'selector' in value;
  }

  /**
   * Handle new job events from CLI
   */
  function handleNewJob(event: Event): void {
    if (event instanceof CustomEvent && isToolbarJob(event.detail)) {
      executePendingJob(event.detail);
    }
  }

  // Check for pending job on init
  $effect(() => {
    const job = props.pendingJob;
    if (job) {
      globalThis.setTimeout(() => executePendingJob(job), 100);
    }
  });

  // Listen for new jobs from CLI
  $effect(() => {
    globalThis.addEventListener('heroshot-job', handleNewJob);
    return () => globalThis.removeEventListener('heroshot-job', handleNewJob);
  });

  /**
   * Handle done button
   */
  function handleDone(): void {
    emit({ type: 'done' });
  }

  /**
   * Toggle sidebar
   */
  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
  }

  /**
   * Toggle settings
   */
  function toggleSettings(): void {
    settingsVisible = !settingsVisible;
  }

  /**
   * Handle settings save
   */
  function handleSaveSettings(newSettings: BrowserSettings): void {
    settings = newSettings;
    emit({ type: 'settings-updated', data: newSettings });
  }
</script>

<!-- Element Picker (handles picking, overlay, selection) -->
<ElementPicker
  bind:this={elementPicker}
  active={isPickerActive}
  {screenshots}
  onToggle={togglePicker}
  onNewElement={handleNewElement}
  onPaddingUpdate={handlePaddingUpdate}
  onScrollUpdate={handleScrollUpdate}
  onCancel={handleElementCancel}
  onDeselect={handleDeselect}
/>

<!-- Toolbar -->
<div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2147483647] bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2 font-sans text-sm text-white shadow-xl select-none pointer-events-auto">
  <button
    type="button"
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors {isPickerActive ? 'bg-green-500 animate-pulse-green' : 'bg-slate-700 hover:bg-slate-600'}"
    onclick={togglePicker}
    title="Pick element"
  >
    <PickerIcon size={20} />
  </button>

  <button
    type="button"
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors relative {sidebarButtonClass}"
    onclick={toggleSidebar}
    title="Toggle screenshots sidebar"
  >
    <SidebarIcon />
    {#if screenshotCount > 0}
      <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{screenshotCount}</span>
    {/if}
  </button>

  <button
    type="button"
    class="w-9 h-9 rounded-md flex items-center justify-center transition-colors {settingsVisible ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}"
    onclick={toggleSettings}
    title="Settings"
  >
    <SettingsIcon />
  </button>

  <button
    type="button"
    class="px-4 py-2 rounded-md text-white font-semibold transition-colors bg-green-500 hover:bg-green-600"
    onclick={handleDone}
    title="Done - save and close"
  >
    Done
  </button>
</div>

<!-- Sidebar -->
<Sidebar
  {screenshots}
  visible={sidebarVisible}
  {editingId}
  {draftId}
  selectedId={selectedScreenshotId}
  {selectedElementPosition}
  onClose={() => sidebarVisible = false}
  onOpen={() => sidebarVisible = true}
  onSelect={handleSelectScreenshot}
  onRemove={handleRemoveScreenshot}
  onRename={handleRenameScreenshot}
  onEditingComplete={() => editingId = null}
  onDraftConfirm={handleDraftConfirm}
/>

<!-- Settings Modal -->
<SettingsModal
  visible={settingsVisible}
  {settings}
  onClose={() => settingsVisible = false}
  onSave={handleSaveSettings}
/>

<style>
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  }
  .animate-pulse-green {
    animation: pulse 1s infinite;
  }
</style>
