<script lang="ts">
  import { eventInterceptor } from '../lib/eventInterceptor';
  import { generateSmartName, generateUid } from '../lib/naming';
  import type { Annotation, BrowserSettings, ElementFill, Padding, PaddingFill, ScreenshotItem, ScrollPosition, ToolbarJob } from '../types';
  import EditorBar from './EditorBar.svelte';
  import ElementPicker from './ElementPicker.svelte';
  import SettingsModal from './SettingsModal.svelte';

  type Props = {
    initialScreenshots?: ScreenshotItem[];
    initialSettings?: BrowserSettings;
    pendingJob?: ToolbarJob | null;
    initialSelectedId?: string | null;
    initialSidebarExpanded?: boolean;
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
  // Auto-expand sidebar if there are screenshots (but don't select any)
  let sidebarExpanded = $state(props.initialSidebarExpanded || (props.initialScreenshots?.length ?? 0) > 0);
  let settingsVisible = $state(false);
  let editingId = $state<string | null>(null);
  let draftId = $state<string | null>(null); // ID of draft item (not yet saved)
  let selectedScreenshotId = $state<string | null>(props.initialSelectedId ?? null);

  // Annotation state
  let annotationTool = $state<string | null>(null); // null = not annotating, 'arrow' | 'rect' | 'ellipse'

  // Reference to ElementPicker for calling methods
  let elementPicker: ElementPicker;

  // Highlight initially selected screenshot on mount (run once)
  let initialHighlightDone = false;
  $effect(() => {
    if (!initialHighlightDone && props.initialSelectedId && elementPicker) {
      initialHighlightDone = true;
      const screenshot = screenshots.find(s => s.id === props.initialSelectedId);
      if (screenshot?.selector) {
        elementPicker.highlightElement(screenshot.selector, screenshot.id);
      }
    }
  });

  /**
   * Toggle picker mode
   */
  function togglePicker(): void {
    // Clear selection when activating picker so screen is ready for new pick
    if (!isPickerActive) {
      selectedScreenshotId = null;
      elementPicker.clearSelection();
    }
    isPickerActive = !isPickerActive;

    // Sync with EventInterceptor - picker mode blocks all page events
    eventInterceptor.setMode(isPickerActive ? 'picker' : 'idle');
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
    sidebarExpanded = true;
    editingId = id; // Focus the name input
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
   * Handle paddingFill update for existing screenshot
   */
  function handlePaddingFillUpdate(id: string, fill: PaddingFill): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id
        ? { ...screenshot, paddingFill: fill === 'inherit' ? undefined : fill }
        : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      // Only emit for non-draft items
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle elementFill update for existing screenshot
   */
  function handleElementFillUpdate(id: string, fill: ElementFill): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id
        ? { ...screenshot, elementFill: fill === 'original' ? undefined : fill }
        : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      // Only emit for non-draft items
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle text override update for existing screenshot
   */
  function handleTextOverrideUpdate(id: string, selector: string, text: string): void {
    screenshots = screenshots.map((screenshot) => {
      if (screenshot.id !== id) return screenshot;

      const textOverrides = { ...screenshot.textOverrides, [selector]: text };
      return { ...screenshot, textOverrides };
    });

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      // Only emit for non-draft items
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle annotations update for a screenshot
   */
  function handleAnnotationsUpdate(id: string, newAnnotations: Annotation[]): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id
        ? { ...screenshot, annotations: newAnnotations.length > 0 ? newAnnotations : undefined }
        : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Toggle annotation tool
   */
  function toggleAnnotationTool(tool: string): void {
    annotationTool = annotationTool === tool ? null : tool;
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
  }

  /**
   * Handle deselect - clear selection without removing draft
   */
  function handleDeselect(): void {
    selectedScreenshotId = null;
  }

  /**
   * Handle draft confirmed (name submitted)
   */
  function handleDraftConfirm(id: string): void {
    if (id === draftId) {
      // Get current padding, scroll, and fill modes from picker and update the screenshot
      const padding = elementPicker.getCurrentPadding();
      const scroll = elementPicker.getCurrentScroll();
      const currentPaddingFill = elementPicker.getCurrentPaddingFill();
      const currentElementFill = elementPicker.getCurrentElementFill();
      const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

      screenshots = screenshots.map((screenshot) =>
        screenshot.id === id
          ? {
              ...screenshot,
              padding: hasPadding ? { ...padding } : undefined,
              scroll: { ...scroll },
              paddingFill: currentPaddingFill === 'inherit' ? undefined : currentPaddingFill,
              elementFill: currentElementFill === 'original' ? undefined : currentElementFill,
            }
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
    const wasDraft = id === draftId;
    screenshots = screenshots.filter((screenshot) => screenshot.id !== id);

    if (wasDraft) {
      // Draft was never saved, just clean up state
      draftId = null;
      editingId = null;
      selectedScreenshotId = null;
    } else {
      // Normal removal - emit event
      emit({ type: 'screenshot-removed', id });
    }
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
   * Handle viewports update for existing screenshot
   */
  function _handleViewportsUpdate(id: string, viewports: string[] | undefined): void {
    screenshots = screenshots.map((screenshot) =>
      screenshot.id === id ? { ...screenshot, viewports } : screenshot
    );

    const updated = screenshots.find((screenshot) => screenshot.id === id);
    if (updated && id !== draftId) {
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
   * Toggle sidebar expanded/collapsed
   */
  function toggleSidebar(): void {
    sidebarExpanded = !sidebarExpanded;
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
  {annotationTool}
  onToggle={togglePicker}
  onNewElement={handleNewElement}
  onPaddingUpdate={handlePaddingUpdate}
  onScrollUpdate={handleScrollUpdate}
  onPaddingFillUpdate={handlePaddingFillUpdate}
  onElementFillUpdate={handleElementFillUpdate}
  onTextOverrideUpdate={handleTextOverrideUpdate}
  onAnnotationsUpdate={handleAnnotationsUpdate}
  onAnnotationToolDeactivate={() => { annotationTool = null; }}
  onCancel={handleElementCancel}
  onDeselect={handleDeselect}
/>

<!-- Editor Bar (combined toolbar + screenshot list) -->
<EditorBar
  {screenshots}
  pickerActive={isPickerActive}
  expanded={sidebarExpanded}
  {settingsVisible}
  {editingId}
  {draftId}
  selectedId={selectedScreenshotId}
  {annotationTool}
  onTogglePicker={togglePicker}
  onToggleExpanded={toggleSidebar}
  onToggleSettings={toggleSettings}
  onDone={handleDone}
  onSelect={handleSelectScreenshot}
  onRemove={handleRemoveScreenshot}
  onRename={handleRenameScreenshot}
  onEditingComplete={() => editingId = null}
  onDraftConfirm={handleDraftConfirm}
  onToggleAnnotationTool={toggleAnnotationTool}
/>

<!-- Settings Modal -->
<SettingsModal
  visible={settingsVisible}
  {settings}
  onClose={() => settingsVisible = false}
  onSave={handleSaveSettings}
/>

