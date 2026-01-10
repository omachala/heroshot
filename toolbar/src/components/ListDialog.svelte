<script lang="ts">
  import type { ScreenshotItem } from '../types';

  interface Props {
    screenshots: ScreenshotItem[];
    onSelect: (screenshot: ScreenshotItem) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
  }

  let { screenshots, onSelect, onRemove, onClose }: Props = $props();

  /**
   * Stop all keyboard events from reaching the page underneath.
   */
  function stopKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<div
  class="backdrop"
  onclick={onClose}
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="presentation"
>
  <div
    class="dialog"
    onclick={(event) => event.stopPropagation()}
    onkeydown={stopKeyboardEvent}
    onkeyup={(event) => event.stopPropagation()}
    onkeypress={(event) => event.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    tabindex="0"
  >
    <div class="header">
      <h3 id="dialog-title">Screenshots ({screenshots.length})</h3>
      <button class="close-btn" onclick={onClose} title="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="content">
      {#if screenshots.length === 0}
        <p class="empty">No screenshots added yet. Click the crosshair to pick an element.</p>
      {:else}
        <ul class="list">
          {#each screenshots as screenshot (screenshot.id)}
            <li class="list-item">
              <button
                class="item-info"
                onclick={() => onSelect(screenshot)}
                title="Navigate to this element"
              >
                <span class="item-name">{screenshot.name}</span>
                <span class="item-selector">{screenshot.selector}</span>
              </button>
              <button
                class="remove-btn"
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
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
  }

  .dialog {
    background: #1a1a2e;
    border-radius: 12px;
    min-width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #fff;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #2d2d44;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #aaa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #2d2d44;
    color: #fff;
  }

  .content {
    padding: 16px 24px 24px;
    overflow-y: auto;
    flex: 1;
  }

  .empty {
    color: #666;
    text-align: center;
    padding: 32px 0;
    margin: 0;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #2d2d44;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .list-item:hover {
    background: #3d3d5c;
  }

  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .item-info:hover .item-name {
    color: #3b82f6;
  }

  .item-name {
    font-weight: 600;
    color: #fff;
  }

  .item-selector {
    font-family: monospace;
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background: #ef4444;
    color: #fff;
  }
</style>
