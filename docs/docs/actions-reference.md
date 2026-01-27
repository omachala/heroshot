---
description: Complete reference for all pre-screenshot actions with properties and examples.
---

# Actions API Reference

Back to [Configuration overview](./config#actions).

### `click`

Click an element. Use to dismiss cookie banners, open menus, expand dropdowns, toggle UI state, or trigger any clickable interaction before capturing.

| Property      | Type                                                                     | Required | Description                             |
| ------------- | ------------------------------------------------------------------------ | -------- | --------------------------------------- |
| `selector`    | string                                                                   | yes      | CSS selector of the element to click    |
| `doubleClick` | boolean                                                                  | no       | Whether to perform a double click       |
| `button`      | `"left"` \| `"right"` \| `"middle"`                                      | no       | Mouse button to click, defaults to left |
| `modifiers`   | (`"Alt"` \| `"Control"` \| `"ControlOrMeta"` \| `"Meta"` \| `"Shift"`)[] | no       | Modifier keys to hold during click      |

```json
// minimal
{
  "type": "click",
  "selector": ".my-element"
}

// with options
{
  "type": "click",
  "selector": ".my-element",
  "doubleClick": true,
  "button": "right",
  "modifiers": [
    "Control"
  ]
}
```

### `type`

Type text into an input, textarea, or contenteditable element. Use to populate forms with demo data, enter search queries, or fill in sample content for screenshots.

| Property   | Type    | Required | Description                                                                                  |
| ---------- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| `selector` | string  | yes      | CSS selector of the input element                                                            |
| `text`     | string  | yes      | Text to type into the element                                                                |
| `submit`   | boolean | no       | Whether to press Enter after typing (submit form)                                            |
| `slowly`   | boolean | no       | Whether to type one character at a time. Useful for triggering key handlers or autocomplete. |

```json
// minimal
{
  "type": "type",
  "selector": ".my-element",
  "text": "Hello world"
}

// with options
{
  "type": "type",
  "selector": ".my-element",
  "text": "Hello world",
  "submit": true,
  "slowly": true
}
```

### `hover`

Hover over an element to trigger :hover states, show tooltips, or reveal hidden menus before capturing.

| Property   | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| `selector` | string | yes      | CSS selector of the element to hover over |

```json
{
  "type": "hover",
  "selector": ".my-element"
}
```

### `select_option`

Select one or more options in a native &lt;select&gt; dropdown to show a specific selection state.

| Property   | Type     | Required | Description                                                           |
| ---------- | -------- | -------- | --------------------------------------------------------------------- |
| `selector` | string   | yes      | CSS selector of the &lt;select&gt; element                            |
| `values`   | string[] | yes      | Option values to select. Supports multiple for multi-select elements. |

```json
{
  "type": "select_option",
  "selector": ".my-element",
  "values": ["option-1", "option-2"]
}
```

### `press_key`

Press a keyboard key or combination. Use to close modals (Escape), submit forms (Enter), navigate focus (Tab), trigger shortcuts, or activate keyboard-driven UI.

| Property | Type   | Required | Description                                                                    |
| -------- | ------ | -------- | ------------------------------------------------------------------------------ |
| `key`    | string | yes      | Key to press, e.g. "Enter", "Escape", "ArrowDown", "Control+a", "Meta+Shift+k" |

```json
{
  "type": "press_key",
  "key": "Enter"
}
```

### `drag`

Drag an element and drop it onto another. Use to show reordering or drag-and-drop interaction mid-state.

| Property | Type   | Required | Description                         |
| -------- | ------ | -------- | ----------------------------------- |
| `from`   | string | yes      | CSS selector of the element to drag |
| `to`     | string | yes      | CSS selector of the drop target     |

```json
{
  "type": "drag",
  "from": ".draggable-item",
  "to": ".drop-zone"
}
```

### `wait`

Pause execution until a condition is met. Wait for a fixed duration, for specific text to appear (e.g. after async loading), or for text to disappear (e.g. loading spinners).

| Property   | Type   | Required | Description                                   |
| ---------- | ------ | -------- | --------------------------------------------- |
| `time`     | number | no       | Time to wait in seconds (max 30s)             |
| `text`     | string | no       | Wait for this text to appear on the page      |
| `textGone` | string | no       | Wait for this text to disappear from the page |

```json
// minimal
{
  "type": "wait"
}

// with options
{
  "type": "wait",
  "time": 0.5,
  "text": "Hello world",
  "textGone": "Loading..."
}
```

### `navigate`

Navigate to a different URL or go back in history. Use to reach a specific page state after login, follow a multi-step flow, or return to a previous page.

| Property | Type    | Required | Description                               |
| -------- | ------- | -------- | ----------------------------------------- |
| `url`    | string  | no       | URL to navigate to (absolute or relative) |
| `back`   | boolean | no       | Navigate back to the previous page        |

```json
// minimal
{
  "type": "navigate"
}

// with options
{
  "type": "navigate",
  "url": "/dashboard",
  "back": true
}
```

### `evaluate`

Run arbitrary JavaScript in the browser context. Use as an escape hatch for DOM manipulation not covered by other actions: removing elements, changing styles, modifying text, or setting up complex page state.

| Property   | Type   | Required | Description                                                                                                            |
| ---------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `function` | string | yes      | JavaScript function to evaluate. Use () =&gt; { ... } for page-level, or (el) =&gt; { ... } when selector is provided. |
| `selector` | string | no       | CSS selector of element to pass as the first argument to the function                                                  |

```json
// minimal
{
  "type": "evaluate",
  "function": "() => { document.querySelector(\".ad\").remove() }"
}

// with options
{
  "type": "evaluate",
  "function": "() => { document.querySelector(\".ad\").remove() }",
  "selector": ".my-element"
}
```

### `fill_form`

Fill multiple form fields in one action. Supports text inputs, checkboxes, radio buttons, dropdowns (combobox), and sliders. Use to show a completed form state in screenshots.

| Property               | Type                                                                   | Required | Description                                                                               |
| ---------------------- | ---------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `fields`               | object[]                                                               | yes      | Array of fields to fill                                                                   |
| ↳ `fields[].selector`  | string                                                                 | yes      | CSS selector of the form field                                                            |
| ↳ `fields[].value`     | string                                                                 | yes      | Value to fill. For checkboxes use "true"/"false". For combobox use the option label text. |
| ↳ `fields[].fieldType` | `"textbox"` \| `"checkbox"` \| `"radio"` \| `"combobox"` \| `"slider"` | yes      | Type of the form field                                                                    |

```json
{
  "type": "fill_form",
  "fields": [
    {
      "selector": "#email",
      "value": "demo@example.com",
      "fieldType": "textbox"
    }
  ]
}
```

### `handle_dialog`

Set up a handler for the next browser dialog (alert, confirm, or prompt). Place this action BEFORE the action that triggers the dialog. It will automatically accept or dismiss when the dialog appears.

| Property     | Type    | Required | Description                              |
| ------------ | ------- | -------- | ---------------------------------------- |
| `accept`     | boolean | yes      | Whether to accept the dialog             |
| `promptText` | string  | no       | Text to enter in case of a prompt dialog |

```json
// minimal
{
  "type": "handle_dialog",
  "accept": true
}

// with options
{
  "type": "handle_dialog",
  "accept": true,
  "promptText": "my answer"
}
```

### `file_upload`

Upload one or more files through a file input element. Use to show file upload previews, populated upload zones, or attachment states.

| Property   | Type     | Required | Description                                                |
| ---------- | -------- | -------- | ---------------------------------------------------------- |
| `selector` | string   | yes      | CSS selector of the file input element                     |
| `paths`    | string[] | yes      | File paths to upload (absolute or relative to config file) |

```json
{
  "type": "file_upload",
  "selector": ".my-element",
  "paths": ["./screenshot.png"]
}
```

### `resize`

Resize the browser viewport mid-flow. Use when you need a different viewport for a specific action (e.g. trigger responsive breakpoints) before capturing.

| Property | Type   | Required | Description               |
| -------- | ------ | -------- | ------------------------- |
| `width`  | number | yes      | Viewport width in pixels  |
| `height` | number | yes      | Viewport height in pixels |

```json
{
  "type": "resize",
  "width": 375,
  "height": 667
}
```

### `hide`

Hide elements from the screenshot. Use to remove cookie banners, chat widgets, ads, or user-specific content (emails, names) before capturing.

| Property    | Type     | Required | Description                                            |
| ----------- | -------- | -------- | ------------------------------------------------------ |
| `selectors` | string[] | yes      | CSS selectors of elements to hide (sets display: none) |

```json
{
  "type": "hide",
  "selectors": [".cookie-banner", ".chat-widget", ".ad-container"]
}
```
