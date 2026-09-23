# Working notes

## Emoji data and search

- `src/data.ts` is the adapter boundary for the Emoji Mart JSON dataset.
  Keep the public `EmojiEntry` fields compatible with custom emoji data.
- `src/search.ts` owns the shared ranking order: name prefix, name
  substring, then keyword prefix.
- The JSON dataset import uses `with { type: 'json' }`. The tsconfig
  module must be `ESNext` (or `NodeNext`/`Preserve`) to accept import
  attributes. esbuild preserves the attribute in ESM output and lowers
  it to `require` in CJS output.
- Changes to the data adapter should be checked with `npm run lint`,
  `npx tsc --noEmit --project tsconfig.json`, and the browser test bundle.

## Picker component conventions

- Picker DOM stays light-DOM; its styles ship as separate CSS files the
  consumer imports via the package's CSS subpath exports.
- Picker UI tokens use the `--emoji-picker-*` namespace so host styles can
  theme the panel without relying on internal class names.
- Picker category filtering should consume `EmojiEntry.category` or
  `EmojiEntry.categories`, while text filtering should use `src/search.ts`.

## Component exports

- Public custom elements should register from their component module and keep
  their DOM in light DOM with styles shipped as separate CSS files.
- Adding a public component requires updating the main entrypoint and its
  explicit package subpath together so ESM and CommonJS builds agree.
- `test/smoke.mjs` runs in Node after build and before the browser bundle.
  It verifies ESM and CJS loading of every subpath. Extend it when adding
  new subpaths or CSS export entries.
## Picker state and interaction

- Persisted picker preferences should use configurable attributes and guard
  every `localStorage` read and write with an in-memory fallback.
- Picker interaction tests should query public roles such as `gridcell`,
  `radio`, and `status`, rather than component class names or private fields.
- The grid uses the ARIA grid pattern: `role="row"` wrappers hold
  `role="gridcell"` wrappers, each holding a native `<button>`. Query
  buttons inside gridcells with `[role="gridcell"] button`, not
  `[role="gridcell"]` alone.
- Roving tabindex: exactly one grid button has `tabindex="0"`. Use
  `focusCell()` to update tabindex when moving focus by arrow key or click.
- Grid event listeners (hover, focus, click) are delegated from the grid
  container in `static render`, not per-cell in `renderGrid`. This avoids
  accumulating listeners across re-renders.
- The preview element (`.emoji-picker-preview`) has `aria-hidden="true"`.
  A separate `role="status"` element announces the result count on query
  change after a debounce. The status region is not updated on hover,
  focus, or category change.

## Picker dismissal and focus

- The panel uses `popover="auto"` (not `"manual"`) when not inline.
  Light dismiss and Escape are handled by the platform; no document
  click listener is needed.
- The `toggle` event on the panel keeps the `opened` flag in sync.
  Use `ToggleEvent` with `newState:'closed'` to detect dismissal.
- Focus restoration only happens when focus is inside the panel at the
  time of close. Light dismiss and `disconnectedCallback` never call
  `focus()`.
- `EmojiButton` checks `typeof target.open === 'function'` instead of
  comparing `localName`, so pickers registered under custom tags work.

## Picker inline mode

- The `inline` attribute selects a display mode. In inline mode the panel
  has no `popover` attribute, is always visible, and `isOpen` is always true.
- `open()` in inline mode only focuses the search box. `close()` is a no-op.
- Selection in inline mode emits `emoji-select` and inserts into the `for`
  field but never hides the panel.
- Escape in inline mode clears the search query, re-renders the grid, and
  focuses the search box instead of closing.
- `syncMode()` handles toggling the `inline` attribute at runtime: adding it
  removes `popover`, clears `hidden`, and sets `opened`; removing it restores
  `popover="auto"` and resets to the closed state.

## Autocomplete custom element

- Public properties (`emojis`, `minChars`, `maxResults`) use `declare`
  field declarations so they emit no JS field initializer. Defaults are
  set in the constructor after pre-upgrade property reconciliation. This
  pattern is required for custom elements that support property assignment
  before `customElements.define` runs.
- The `onKeydown` handler guards against IME composition with
  `ev.isComposing || ev.keyCode === 229` before processing any key.
- `connectedCallback` adopts an existing `.emoji-search-list` child
  (server-rendered via `EmojiInput.render()`) instead of creating a
  duplicate.
- `detach()` removes `aria-autocomplete` from the field; `close()`
  handles `aria-controls` and `aria-activedescendant`.

## Placement helper

- `src/placement.ts` is a pure function shared by the autocomplete and
  picker for positioning popovers relative to an anchor. It must not
  reference `document` or `window` at import time so it stays safe for
  Node imports.
- Unit tests for placement live in `test/placement.ts` and run in Node
  via esbuild bundling (no browser needed).
- The picker attaches `resize` and capture-phase `scroll` listeners on
  `window` while the popover is open and detaches them on close, light
  dismiss (toggle event), and disconnect. The autocomplete follows the
  same attach/detach pattern. Both must detach in every close path.
- `renderTabs()` and `renderTones()` replace all children, so any DOM
  reference grabbed before a click or keydown that triggers re-rendering
  will be stale. Re-query after the action.
- Synthetic `KeyboardEvent` dispatches do not trigger native button click
  behavior in test harnesses. Grid cell Enter/Space must be forwarded to
  `click()` in the keydown handler; tab and radio Enter/Space rely on
  the test calling `.click()` after `keydown()` to simulate native
  behavior.
- The host `onKeydown` dispatches by `event.target`: grid cells, search
  input, tabs, and tone radios each have separate handlers. New keyboard
  controls should follow this dispatch pattern.
