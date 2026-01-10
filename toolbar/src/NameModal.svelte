<script lang="ts">
  interface Props {
    selector: string;
    onSave: (name: string) => void;
    onCancel: () => void;
  }

  let { selector, onSave, onCancel }: Props = $props();

  let name = $state('');
  let inputElement = $state<HTMLInputElement | null>(null);

  // Focus input on mount
  $effect(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });

  function handleSubmit(event: Event): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
  }
</script>

<div class="heroshot-modal-backdrop" onclick={onCancel} onkeydown={handleKeyDown} role="presentation">
  <div
    class="heroshot-modal"
    onclick={(event) => event.stopPropagation()}
    onkeydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <h3 id="modal-title">Name this screenshot</h3>
    <p class="selector-preview">{selector}</p>

    <form onsubmit={handleSubmit}>
      <input
        bind:this={inputElement}
        bind:value={name}
        type="text"
        placeholder="e.g., hero-section, login-button"
        class="heroshot-input"
      />

      <div class="heroshot-modal-actions">
        <button type="button" class="heroshot-btn-secondary" onclick={onCancel}>
          Cancel
        </button>
        <button type="submit" class="heroshot-btn-primary" disabled={!name.trim()}>
          Save
        </button>
      </div>
    </form>
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

  .heroshot-modal {
    background: #1a1a2e !important;
    border-radius: 12px !important;
    padding: 24px !important;
    min-width: 400px !important;
    max-width: 90vw !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: #fff !important;
  }

  h3 {
    margin: 0 0 12px !important;
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  .selector-preview {
    margin: 0 0 20px !important;
    padding: 8px 12px !important;
    background: #2d2d44 !important;
    border-radius: 6px !important;
    font-family: monospace !important;
    font-size: 12px !important;
    color: #aaa !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .heroshot-input {
    width: 100% !important;
    padding: 12px !important;
    border: 2px solid #3d3d5c !important;
    border-radius: 6px !important;
    background: #2d2d44 !important;
    color: #fff !important;
    font-size: 14px !important;
    outline: none !important;
    box-sizing: border-box !important;
    transition: border-color 0.2s !important;
  }

  .heroshot-input:focus {
    border-color: #3b82f6 !important;
  }

  .heroshot-input::placeholder {
    color: #666 !important;
  }

  .heroshot-modal-actions {
    display: flex !important;
    gap: 12px !important;
    justify-content: flex-end !important;
    margin-top: 20px !important;
  }

  .heroshot-btn-primary,
  .heroshot-btn-secondary {
    padding: 10px 20px !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
  }

  .heroshot-btn-primary {
    background: #22c55e !important;
    color: #fff !important;
  }

  .heroshot-btn-primary:hover:not(:disabled) {
    background: #16a34a !important;
  }

  .heroshot-btn-primary:disabled {
    background: #3d3d5c !important;
    color: #666 !important;
    cursor: not-allowed !important;
  }

  .heroshot-btn-secondary {
    background: #3d3d5c !important;
    color: #fff !important;
  }

  .heroshot-btn-secondary:hover {
    background: #4d4d6c !important;
  }
</style>
