<script lang="ts">
  import { DEFAULT_BORDER_COLOR } from '../constants';
  import { eventInterceptor } from '../lib/eventInterceptor';
  import { generateSmartName, generateUid } from '../lib/naming';
  import { queryElements } from '../lib/selectorGenerator';
  import type { Annotation, BrowserSettings, ElementFill, Padding, PaddingFill, ScreenshotItem, ScrollPosition, SelectionContext, ToolbarJob } from '../types';
  import ConfigBar from './ConfigBar.svelte';
  import EditorBar from './EditorBar.svelte';
  import ElementPicker from './ElementPicker.svelte';
  import SettingsModal from './SettingsModal.svelte';

  type Props = {
    initialScreenshots?: ScreenshotItem[];
    initialSettings?: BrowserSettings;
    pendingJob?: ToolbarJob | null;
    initialSelectedId?: string | null;
    initialSidebarExpanded?: boolean;
    initialHiddenElements?: Record<string, string[]>;
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

  // Hidden elements state (per domain)
  let hiddenElements = $state<Record<string, string[]>>({ ...props.initialHiddenElements });
  let isHideMode = $state(false);
  let currentDomain = $derived((() => { try { return new URL(globalThis.location.href).hostname; } catch { return ''; } })());
  let currentHiddenSelectors = $derived(hiddenElements[currentDomain] ?? []);

  // Selection tracking for ConfigBar
  let selectedAnnotationId = $state<string | null>(null);
  let isTextEditing = $state(false);
  let pickerEditingId = $state<string | null>(null);
  let pickerExpandedRect = $state<{ top: number; left: number; width: number; height: number } | null>(null);

  // Reference to ElementPicker for calling methods
  let elementPicker: ElementPicker;

  // Derive selection context (uses $state pickerEditingId pushed via callback, not method call)
  let selectionContext = $derived.by((): SelectionContext => {
    if (!pickerEditingId) return { type: 'none' };
    if (isTextEditing) return { type: 'text', screenshotId: pickerEditingId };
    if (selectedAnnotationId) return { type: 'annotation', screenshotId: pickerEditingId, annotationId: selectedAnnotationId };
    return { type: 'element', screenshotId: pickerEditingId };
  });

  // Derive config bar position (uses $state pickerExpandedRect pushed via callback)
  let configBarPosition = $derived.by((): { x: number; y: number; placement: 'left' | 'right' } | null => {
    if (selectionContext.type === 'annotation') {
      const annotationLayer = elementPicker?.getAnnotationLayer();
      if (annotationLayer) {
        return annotationLayer.getSelectedBBoxPosition();
      }
      return null;
    }
    if (selectionContext.type === 'element' && pickerExpandedRect) {
      const viewportWidth = globalThis.innerWidth;
      const elementCenterX = pickerExpandedRect.left + pickerExpandedRect.width / 2;
      const placeRight = elementCenterX < viewportWidth / 2;
      return {
        x: placeRight
          ? pickerExpandedRect.left + pickerExpandedRect.width + 12
          : pickerExpandedRect.left - 12,
        y: pickerExpandedRect.top + pickerExpandedRect.height / 2,
        placement: placeRight ? 'right' : 'left',
      };
    }
    return null;
  });

  // Current paddingFill/elementFill from the screenshots array (reactive)
  let currentPaddingFill = $derived.by((): PaddingFill => {
    if (selectionContext.type !== 'element' && selectionContext.type !== 'annotation') return 'inherit';
    const screenshot = screenshots.find(s => s.id === selectionContext.screenshotId);
    return screenshot?.paddingFill ?? 'inherit';
  });

  let currentElementFill = $derived.by((): ElementFill => {
    if (selectionContext.type !== 'element' && selectionContext.type !== 'annotation') return 'original';
    const screenshot = screenshots.find(s => s.id === selectionContext.screenshotId);
    return screenshot?.elementFill ?? 'original';
  });

  // Current colors and border from the screenshots array (reactive)
  let currentScreenshot = $derived.by((): ScreenshotItem | undefined => {
    if (selectionContext.type !== 'element' && selectionContext.type !== 'annotation') return undefined;
    return screenshots.find(s => s.id === selectionContext.screenshotId);
  });

  let currentPaddingColor = $derived(currentScreenshot?.paddingColor);
  let currentElementColor = $derived(currentScreenshot?.elementColor);
  let currentBorderWidth = $derived(currentScreenshot?.borderWidth ?? 0);
  let currentBorderColor = $derived(currentScreenshot?.borderColor ?? DEFAULT_BORDER_COLOR);
  let currentBorderRadius = $derived(currentScreenshot?.borderRadius ?? 0);

  // Current annotation style (from annotation layer)
  let currentAnnotationStyle = $derived.by((): Record<string, string | number> | undefined => {
    if (selectionContext.type !== 'annotation') return undefined;
    const annotationLayer = elementPicker?.getAnnotationLayer();
    return annotationLayer?.getSelectedStyle();
  });

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
    // Deactivate hide mode if active
    if (isHideMode) {
      isHideMode = false;
    }
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
    elementPicker.setDraftId(id); // Associate element with draft so ConfigBar shows
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
   * Handle editing screenshot ID change from ElementPicker
   */
  function handleEditingScreenshotChange(id: string | null): void {
    pickerEditingId = id;
  }

  /**
   * Handle expanded rect change from ElementPicker (for ConfigBar positioning)
   */
  function handleExpandedRectChange(rect: { top: number; left: number; width: number; height: number } | null): void {
    pickerExpandedRect = rect;
  }

  /**
   * Handle annotation selection change from ElementPicker
   */
  function handleAnnotationSelectionChange(annotationId: string | null): void {
    selectedAnnotationId = annotationId;
  }

  /**
   * Handle text edit state change from ElementPicker
   */
  function handleTextEditChange(editing: boolean): void {
    isTextEditing = editing;
  }

  /**
   * Handle paddingFill change from ConfigBar
   */
  function handleConfigPaddingFillChange(fill: PaddingFill): void {
    elementPicker.setPaddingFill(fill);
  }

  /**
   * Handle elementFill change from ConfigBar
   */
  function handleConfigElementFillChange(fill: ElementFill): void {
    elementPicker.setElementFill(fill);
  }

  /**
   * Generic screenshot property update from ConfigBar
   */
  function updateCurrentScreenshot(updates: Partial<ScreenshotItem>): void {
    const id = selectionContext.type === 'element' || selectionContext.type === 'annotation'
      ? selectionContext.screenshotId
      : null;
    if (!id) return;

    screenshots = screenshots.map(s => s.id === id ? { ...s, ...updates } : s);

    const updated = screenshots.find(s => s.id === id);
    if (updated && id !== draftId) {
      emit({ type: 'screenshot-updated', data: updated });
    }
  }

  /**
   * Handle annotation style change from ConfigBar
   */
  function handleConfigAnnotationStyleChange(style: Record<string, string | number>): void {
    const annotationLayer = elementPicker?.getAnnotationLayer();
    annotationLayer?.updateStyle(style);
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
      const draftPaddingFill = elementPicker.getCurrentPaddingFill();
      const draftElementFill = elementPicker.getCurrentElementFill();
      const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

      screenshots = screenshots.map((screenshot) =>
        screenshot.id === id
          ? {
              ...screenshot,
              padding: hasPadding ? { ...padding } : undefined,
              scroll: { ...scroll },
              paddingFill: draftPaddingFill === 'inherit' ? undefined : draftPaddingFill,
              elementFill: draftElementFill === 'original' ? undefined : draftElementFill,
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
   * Toggle hide mode - activates picker in hide mode
   */
  function toggleHideMode(): void {
    isHideMode = !isHideMode;
    if (isHideMode) {
      // Deactivate normal picker if active
      if (isPickerActive) {
        isPickerActive = false;
      }
      // Clear current selection
      selectedScreenshotId = null;
      elementPicker.clearSelection();
      // Activate picker for hide mode
      isPickerActive = true;
      eventInterceptor.setMode('picker');
    } else {
      // Deactivate picker when exiting hide mode
      if (isPickerActive) {
        isPickerActive = false;
        eventInterceptor.setMode('idle');
      }
    }
  }

  /**
   * Handle element hidden from picker
   */
  function handleHideElement(selector: string): void {
    const domain = currentDomain;
    if (!domain) return;

    const existing = hiddenElements[domain] ?? [];
    if (existing.includes(selector)) return;

    hiddenElements = { ...hiddenElements, [domain]: [...existing, selector] };
    emit({ type: 'hidden-elements-updated', domain, selectors: hiddenElements[domain] ?? [] });

    // Deactivate hide mode after hiding
    isHideMode = false;
    isPickerActive = false;
    eventInterceptor.setMode('idle');
  }

  /**
   * Handle element unhidden from sidebar list
   */
  function handleUnhideElement(selector: string): void {
    const domain = currentDomain;
    if (!domain) return;

    const existing = hiddenElements[domain] ?? [];
    const updated = existing.filter(s => s !== selector);

    hiddenElements = updated.length === 0
      ? Object.fromEntries(Object.entries(hiddenElements).filter(([key]) => key !== domain))
      : { ...hiddenElements, [domain]: updated };

    // Restore element visibility in DOM
    for (const element of queryElements(selector)) {
      if (element instanceof HTMLElement) {
        element.style.removeProperty('visibility');
      }
    }

    emit({ type: 'hidden-elements-updated', domain, selectors: updated });
  }

  // Apply hidden elements to DOM whenever they change
  $effect(() => {
    const selectors = currentHiddenSelectors;
    for (const selector of selectors) {
      for (const element of queryElements(selector)) {
        if (element instanceof HTMLElement) {
          element.style.setProperty('visibility', 'hidden', 'important');
        }
      }
    }
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
  hideMode={isHideMode}
  {screenshots}
  {annotationTool}
  onToggle={togglePicker}
  onNewElement={handleNewElement}
  onHideElement={handleHideElement}
  onPaddingUpdate={handlePaddingUpdate}
  onScrollUpdate={handleScrollUpdate}
  onPaddingFillUpdate={handlePaddingFillUpdate}
  onElementFillUpdate={handleElementFillUpdate}
  onTextOverrideUpdate={handleTextOverrideUpdate}
  onAnnotationsUpdate={handleAnnotationsUpdate}
  onAnnotationToolDeactivate={() => { annotationTool = null; }}
  onCancel={handleElementCancel}
  onDeselect={handleDeselect}
  onAnnotationSelectionChange={handleAnnotationSelectionChange}
  onTextEditChange={handleTextEditChange}
  onEditingScreenshotChange={handleEditingScreenshotChange}
  onExpandedRectChange={handleExpandedRectChange}
/>

<!-- Floating Config Bar -->
{#if configBarPosition && (selectionContext.type === 'element' || selectionContext.type === 'annotation')}
  <ConfigBar
    context={selectionContext}
    position={configBarPosition}
    paddingFill={currentPaddingFill}
    paddingColor={currentPaddingColor}
    elementFill={currentElementFill}
    elementColor={currentElementColor}
    borderWidth={currentBorderWidth}
    borderColor={currentBorderColor}
    borderRadius={currentBorderRadius}
    detectedBgColor={elementPicker?.getDetectedBgColor()}
    annotationStyle={currentAnnotationStyle}
    onPaddingFillChange={handleConfigPaddingFillChange}
    onPaddingColorChange={(color) => updateCurrentScreenshot({ paddingColor: color })}
    onElementFillChange={handleConfigElementFillChange}
    onElementColorChange={(color) => updateCurrentScreenshot({ elementColor: color })}
    onBorderWidthChange={(w) => updateCurrentScreenshot({ borderWidth: w || undefined })}
    onBorderColorChange={(c) => updateCurrentScreenshot({ borderColor: c })}
    onBorderRadiusChange={(r) => updateCurrentScreenshot({ borderRadius: r || undefined })}
    onAnnotationStyleChange={handleConfigAnnotationStyleChange}
  />
{/if}

<!-- Editor Bar (combined toolbar + screenshot list) -->
<EditorBar
  {screenshots}
  pickerActive={isPickerActive}
  {isHideMode}
  expanded={sidebarExpanded}
  {settingsVisible}
  {editingId}
  {draftId}
  selectedId={selectedScreenshotId}
  {annotationTool}
  hiddenSelectors={currentHiddenSelectors}
  onTogglePicker={togglePicker}
  onToggleHideMode={toggleHideMode}
  onToggleExpanded={toggleSidebar}
  onToggleSettings={toggleSettings}
  onDone={handleDone}
  onSelect={handleSelectScreenshot}
  onRemove={handleRemoveScreenshot}
  onRename={handleRenameScreenshot}
  onEditingComplete={() => editingId = null}
  onDraftConfirm={handleDraftConfirm}
  onToggleAnnotationTool={toggleAnnotationTool}
  onUnhideElement={handleUnhideElement}
/>

<!-- Settings Modal -->
<SettingsModal
  visible={settingsVisible}
  {settings}
  onClose={() => settingsVisible = false}
  onSave={handleSaveSettings}
/>

