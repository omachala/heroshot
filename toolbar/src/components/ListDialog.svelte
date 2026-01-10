<script lang="ts">
  import type { ScreenshotItem } from '../types';

  interface Props {
    screenshots: ScreenshotItem[];
    onRemove: (id: string) => void;
    onClose: () => void;
  }

  let { screenshots, onRemove, onClose }: Props = $props();

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  }
</script>

<div class="heroshot-modal-backdrop" onclick={onClose} onkeydown={handleKeyDown} role="presentation">
  <div
    class="heroshot-dialog"
    onclick={(event) => event.stopPropagation()}
    onkeydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="0"
  >
    <div class="heroshot-dialog-header">
      <h3 id="dialog-title">Screenshots ({screenshots.length})</h3>
      <button class="heroshot-close-btn" onclick={onClose} title="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="heroshot-dialog-content">
      {#if screenshots.length === 0}
        <p class="heroshot-empty">No screenshots added yet. Click the crosshair to pick an element.</p>
      {:else}
        <ul class="heroshot-list">
          {#each screenshots as screenshot (screenshot.id)}
            <li class="heroshot-list-item">
              <div class="heroshot-item-info">
                <span class="heroshot-item-name">{screenshot.name}</span>
                <span class="heroshot-item-selector">{screenshot.selector}</span>
              </div>
              <button
                class="heroshot-remove-btn"
                onclick={() => onRemove(screenshot.id)}
                title="Remove screenshot"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  .heroshot-modal-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 2147483647 !important;
  }

  .heroshot-dialog {
    background: #1a1a2e !important;
    border-radius: 12px !important;
    min-width: 500px !important;
    max-width: 90vw !important;
    max-height: 80vh !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #fff !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .heroshot-dialog-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 20px 24px !important;
    border-bottom: 1px solid #2d2d44 !important;
  }

  h3 {
    margin: 0 !important;
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  .heroshot-close-btn {
    width: 32px !important;
    height: 32px !important;
    border: none !important;
    border-radius: 6px !important;
    background: transparent !important;
    color: #aaa !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s !important;
  }

  .heroshot-close-btn:hover {
    background: #2d2d44 !important;
    color: #fff !important;
  }

  .heroshot-dialog-content {
    padding: 16px 24px 24px !important;
    overflow-y: auto !important;
    flex: 1 !important;
  }

  .heroshot-empty {
    color: #666 !important;
    text-align: center !important;
    padding: 32px 0 !important;
    margin: 0 !important;
  }

  .heroshot-list {
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
  }

  .heroshot-list-item {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 12px 16px !important;
    background: #2d2d44 !important;
    border-radius: 8px !important;
    transition: background 0.2s !important;
  }

  .heroshot-list-item:hover {
    background: #3d3d5c !important;
  }

  .heroshot-item-info {
    flex: 1 !important;
    min-width: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
  }

  .heroshot-item-name {
    font-weight: 600 !important;
    color: #fff !important;
  }

  .heroshot-item-selector {
    font-family: monospace !important;
    font-size: 12px !important;
    color: #888 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .heroshot-remove-btn {
    width: 32px !important;
    height: 32px !important;
    border: none !important;
    border-radius: 6px !important;
    background: transparent !important;
    color: #666 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s !important;
    flex-shrink: 0 !important;
  }

  .heroshot-remove-btn:hover {
    background: #ef4444 !important;
    color: #fff !important;
  }
</style>
