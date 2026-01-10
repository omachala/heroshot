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

  /**
   * Stop all keyboard events from reaching the page underneath.
   * This prevents the host page's keyboard shortcuts from interfering.
   */
  function stopKeyboardEvent(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Escape') {
      onCancel();
    }
  }
</script>

<div
  class="backdrop"
  onclick={onCancel}
  onkeydown={stopKeyboardEvent}
  onkeyup={(event) => event.stopPropagation()}
  onkeypress={(event) => event.stopPropagation()}
  role="presentation"
>
  <div
    class="modal"
    onclick={(event) => event.stopPropagation()}
    onkeydown={stopKeyboardEvent}
    onkeyup={(event) => event.stopPropagation()}
    onkeypress={(event) => event.stopPropagation()}
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
        class="input"
      />

      <div class="actions">
        <button type="button" class="btn-secondary" onclick={onCancel}>
          Cancel
        </button>
        <button type="submit" class="btn-primary" disabled={!name.trim()}>
          Save
        </button>
      </div>
    </form>
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

  .modal {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 24px;
    min-width: 400px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #fff;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 600;
  }

  .selector-preview {
    margin: 0 0 20px;
    padding: 8px 12px;
    background: #2d2d44;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    color: #aaa;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .input {
    width: 100%;
    padding: 12px;
    border: 2px solid #3d3d5c;
    border-radius: 6px;
    background: #2d2d44;
    color: #fff;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .input:focus {
    border-color: #3b82f6;
  }

  .input::placeholder {
    color: #666;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .btn-primary,
  .btn-secondary {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #22c55e;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #16a34a;
  }

  .btn-primary:disabled {
    background: #3d3d5c;
    color: #666;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #3d3d5c;
    color: #fff;
  }

  .btn-secondary:hover {
    background: #4d4d6c;
  }
</style>
