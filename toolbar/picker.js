(function() {
  // Prevent double initialization
  if (window.__heroshotPickerInit) return;
  window.__heroshotPickerInit = true;

  // State
  let isPickerActive = false;
  let currentElement = null;

  // Create toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'heroshot-toolbar';
  toolbar.innerHTML = `
    <button id="heroshot-picker-btn" title="Pick element">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    </button>
    <span id="heroshot-status">Click crosshair to pick element</span>
  `;
  document.body.appendChild(toolbar);

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'heroshot-overlay';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  // Get element from point, piercing shadow DOMs
  function deepElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    if (!el) return null;

    // Traverse into shadow roots
    while (el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }

    return el;
  }

  // Get unique selector for element, with shadow DOM support
  function getSelector(el) {
    if (el.id && !el.id.startsWith('heroshot')) {
      return `#${el.id}`;
    }

    const path = [];
    let current = el;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      if (current.id && !current.id.startsWith('heroshot')) {
        path.unshift(`#${current.id}`);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith('heroshot'));
        if (classes.length > 0) {
          selector += '.' + classes.slice(0, 2).join('.');
        }
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);

      // Check if we're inside a shadow root
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        // Add shadow DOM piercing indicator and continue from shadow host
        path.unshift('>>>');
        current = root.host;
      } else {
        current = parent;
      }

      if (path.length > 8) break;
    }

    return path.join(' > ').replace(/> >>> >/g, ' >>> ');
  }

  // Update overlay to show dark areas around element
  function updateOverlay(rect) {
    // Clear previous overlay
    overlay.innerHTML = '';

    if (!rect) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Top dark area
    const top = document.createElement('div');
    top.className = 'heroshot-overlay-dark';
    top.style.cssText = `top:0;left:0;width:${vw}px;height:${rect.top}px;`;
    overlay.appendChild(top);

    // Bottom dark area
    const bottom = document.createElement('div');
    bottom.className = 'heroshot-overlay-dark';
    bottom.style.cssText = `top:${rect.bottom}px;left:0;width:${vw}px;height:${vh - rect.bottom}px;`;
    overlay.appendChild(bottom);

    // Left dark area
    const left = document.createElement('div');
    left.className = 'heroshot-overlay-dark';
    left.style.cssText = `top:${rect.top}px;left:0;width:${rect.left}px;height:${rect.height}px;`;
    overlay.appendChild(left);

    // Right dark area
    const right = document.createElement('div');
    right.className = 'heroshot-overlay-dark';
    right.style.cssText = `top:${rect.top}px;left:${rect.right}px;width:${vw - rect.right}px;height:${rect.height}px;`;
    overlay.appendChild(right);

    // Highlight border around element
    const highlight = document.createElement('div');
    highlight.className = 'heroshot-highlight';
    highlight.style.cssText = `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
    overlay.appendChild(highlight);
  }

  // Mouse move handler
  function onMouseMove(e) {
    if (!isPickerActive) return;

    const el = deepElementFromPoint(e.clientX, e.clientY);

    if (el && !el.closest('#heroshot-toolbar') && !el.closest('#heroshot-overlay')) {
      currentElement = el;
      const rect = el.getBoundingClientRect();
      updateOverlay(rect);

      const selector = getSelector(el);
      document.getElementById('heroshot-status').textContent = selector;
    }
  }

  // Click handler
  function onClick(e) {
    if (!isPickerActive) return;
    if (e.target.closest('#heroshot-toolbar')) return;

    e.preventDefault();
    e.stopPropagation();

    if (currentElement) {
      const selector = getSelector(currentElement);
      const url = window.location.href;

      // Call exposed function from Playwright
      if (window.onElementPicked) {
        window.onElementPicked({ url, selector });
      }

      // Deactivate picker
      togglePicker();
    }
  }

  // Toggle picker mode
  function togglePicker() {
    isPickerActive = !isPickerActive;
    const btn = document.getElementById('heroshot-picker-btn');
    const status = document.getElementById('heroshot-status');

    if (isPickerActive) {
      btn.classList.add('active');
      status.textContent = 'Hover over element, click to select';
      document.body.style.cursor = 'crosshair';
    } else {
      btn.classList.remove('active');
      status.textContent = 'Click crosshair to pick element';
      document.body.style.cursor = '';
      updateOverlay(null);
      currentElement = null;
    }
  }

  // Event listeners
  document.getElementById('heroshot-picker-btn').addEventListener('click', togglePicker);
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);

  // ESC to cancel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPickerActive) {
      togglePicker();
    }
  }, true);
})();
