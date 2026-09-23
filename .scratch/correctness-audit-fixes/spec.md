# Correctness audit fixes

**Status:** ready-for-agent
**Source:** correctness audit of the three components, 2026-09-23.
All picker interaction defects below were reproduced in the project's
browser test runner before this spec was written.

## Problem Statement

The package cannot be consumed as published. The built JavaScript fails to
load in Node, the stylesheets never reach `dist`, and the package is marked
private while the release script tries to publish it.

Once loaded, the emoji picker misbehaves for keyboard and pointer users.
Pressing Enter on a category tab or skin tone radio inserts the first emoji
in the grid instead of activating the control. Arrow keys typed into the
search box jump focus into the grid. Clicking anywhere else on the page
closes the picker but then drags focus back to the button that opened it.
An inline picker disappears after the first selection and ignores arrow
keys entirely. Opening the picker from any click handler that does not stop
propagation closes it in the same tick. Every emoji cell is in the Tab
order, so leaving the search box by Tab walks through hundreds of buttons.

The autocomplete component has smaller gaps: it commits on Enter during
IME composition, leaves ARIA attributes behind on detach, and can lose
properties set before element upgrade.

## Solution

Ship a package that loads in Node and the browser with its CSS available
through documented subpaths. Make the picker behave like a native popover:
the platform handles light dismiss, focus only moves when the user
finishes or cancels an action, keyboard handling is scoped to the control
that has focus, and the grid follows the ARIA grid pattern with a single
tabbable cell. Make inline mode a first-class display mode rather than a
popover that happens to be visible. Harden the autocomplete against IME
composition, detach, and pre-upgrade property assignment.

## User Stories

1. As an app developer, I want `import '@substrate-system/emoji-input'`
   and the `/picker` and `/button` subpaths to load in Node and in a
   bundler, so that server rendering and client bundling both work.
2. As an app developer, I want a documented CSS subpath that actually
   resolves, so that the components are styled and positioned out of the
   box.
3. As a keyboard user, I want Enter and Space on a category tab or skin
   tone radio to activate that control, so that I can browse without
   accidentally inserting an emoji.
4. As a keyboard user, I want arrow keys inside the search box to edit my
   query, so that the picker does not hijack text editing.
5. As a keyboard user, I want one Tab stop for the emoji grid, with arrow
   keys moving between cells, so that I can leave the picker in a few
   keystrokes.
6. As a pointer user, I want clicking outside the picker to close it and
   leave focus where I clicked, so that the picker does not fight me for
   focus.
7. As an app developer, I want `picker.open()` to work from my own click
   handler without special event handling, so that I can build custom
   triggers.
8. As an app developer, I want an inline picker to stay visible after a
   selection and support the same keyboard navigation as the popover, so
   that I can embed it in a form.
9. As a screen reader user, I want the picker to announce search result
   counts rather than re-reading every cell I hover, so that the live
   region is informative instead of noisy.
10. As an IME user, I want Enter while composing text to confirm my
    candidate rather than insert an emoji, so that the autocomplete does
    not corrupt my input.

## Implementation Decisions

### Packaging and build

- The emoji dataset import in the data adapter declares a JSON import
  attribute (`with { type: 'json' }`). The ESM build keeps the attribute;
  the CJS build lowers it to `require`. This is the smallest change that
  keeps `src/data.ts` as the adapter boundary. If the TypeScript
  configuration rejects import attributes, switch its module setting to
  one that accepts them rather than changing the data adapter's shape.
- The build copies the three component stylesheets into `dist` unchanged
  and also emits minified copies. The package `exports` map gains explicit
  entries for `./css` (all three stylesheets concatenated), `./css/min`,
  and per-component `./index.css`, `./picker.css`, `./button.css`. The
  `./*` wildcard stays for JavaScript. Explicit entries are required
  because Node does not fall through an `exports` target array on a
  missing file.
- `private` is removed from package.json. `microtags` is removed from
  dependencies; nothing imports it.
- AGENTS.md's statement that styles are injected through
  `adoptedStyleSheets` is corrected: styles ship as separate stylesheets
  the consumer imports. No component injects CSS. The README CSS section is
  rewritten to match the new subpaths. Badges that point at other packages
  are fixed or removed. No tests are written for docs.

### Picker: dismissal and open state

- The panel uses `popover="auto"` instead of `popover="manual"` when not
  inline. The platform now owns light dismiss and Escape. The document
  click listener is deleted. The click that called `open()` can no longer
  close the popover because there is no listener to receive it.
- The picker listens to the panel's `toggle` event to keep its `opened`
  flag and `isOpen` getter in sync, so state is correct whether the close
  came from `close()`, Escape, or a light dismiss.
- In browsers without the Popover API, the existing `hidden` toggling
  remains and Escape is the only dismiss path. No polyfill is added; the
  package keeps zero runtime dependencies beyond the dataset.
- The picker keeps its own Escape handler only for the non-popover
  fallback and for inline mode (where it clears the query and returns
  focus to the search box rather than hiding anything).

### Picker: focus restoration

- Focus is restored to the trigger only when the picker closes by Escape
  or by `close()` being called programmatically while focus is inside the
  panel.
- After a selection, focus moves to the `for` target field when one
  exists, positioned after the inserted emoji, so the user keeps typing.
  Without a target field, focus returns to the trigger.
- A light dismiss never moves focus. Disconnecting the element never moves
  focus.

### Picker: inline mode

- The `inline` attribute selects a display mode. In inline mode the panel
  is always visible, `isOpen` is always true, keyboard handling is always
  active, `open()` only focuses the search box, and `close()` and
  selection never hide the panel. `hidden` is never set on an inline panel.
- Changing the `inline` attribute while connected switches modes and
  resets the panel to the closed popover state or the visible inline
  state accordingly.

### Picker: keyboard scoping

- The host keydown handler dispatches on where the event originated:
  - Grid cell buttons: arrows move within the grid, Home and End move to
    the row start and end, Enter and Space activate the cell (native
    button behavior, no `preventDefault` on Enter).
  - Search box: ArrowDown moves focus to the first (or last focused)
    cell. Enter selects the first visible emoji when the query is
    non-empty. All other keys are left to the input.
  - Tabs: existing ArrowLeft, ArrowRight, Home, End handling stays.
    Enter and Space are left to the native button.
  - Skin tone radios: ArrowLeft and ArrowRight move between and check
    radios, matching the tab pattern. Enter and Space are left to the
    native button.
- Column count for ArrowUp and ArrowDown is derived from the rendered row
  structure, not a hardcoded 8.

### Picker: grid semantics

- The grid renders `role="row"` wrappers, each holding `role="gridcell"`
  wrappers, each holding a native `<button>` that carries the emoji, its
  accessible name, and the click handler. Buttons keep their native role.
- Roving tabindex: exactly one cell button has `tabindex="0"` (the last
  focused cell, or the first cell after a render). All others are `-1`.
- The column template moves from the grid container to the row so the
  existing eight-column layout is preserved. This is the only CSS change
  in the grid area.
- Hover and focus preview listeners are delegated from the grid container
  rather than attached per cell.

### Picker: live region

- The preview element that mirrors the hovered or focused emoji becomes
  `aria-hidden`. The cell's own accessible name already announces it.
- The `role="status"` region announces the result count when the query
  changes, debounced so rapid typing produces one announcement. It is
  silent while browsing categories.

### Picker: positioning

- `open(anchor)` uses the same flip logic as the autocomplete popover:
  below the anchor by default, above when there is no room, clamped to
  the viewport inline edges. The caret rectangle helper and the placement
  helper in the autocomplete module are split so the placement half is
  shared by both components.
- The picker repositions on window resize and capture-phase scroll while
  open and detaches those listeners on close, matching the autocomplete.
- CSS anchor positioning is not adopted in this change; see Out of Scope.

### Picker: search

- The query is trimmed before it reaches the shared search function so
  leading whitespace does not empty the results.

### Autocomplete

- The keydown handler ignores Enter, Tab, Escape, and arrow keys while
  `isComposing` is true or `keyCode` is 229, so IME candidate confirmation
  passes through untouched.
- `detach()` removes `aria-autocomplete`, `aria-controls`, and
  `aria-activedescendant` from the field it set them on.
- On connect, the element reconciles `emojis`, `minChars`, and
  `maxResults`: if an own property was assigned before upgrade, its value
  is captured, the own property deleted, and the value reapplied through
  the class setter or field so pre-upgrade assignment is not lost.
- On connect, the element adopts an existing `.emoji-search-list` child
  (server-rendered from the static `render` helper) instead of creating a
  second one.

### Button

- The button resolves its target by checking for an `open` method on the
  element the `for` attribute names rather than comparing `localName`, so
  pickers registered under a custom tag still work.

## Testing Decisions

Seams, highest first:

1. The existing browser suite (`test/index.ts`, bundled with esbuild and
   run by tapout). Every picker and autocomplete behavior above is
   asserted here by dispatching real DOM events on connected elements and
   querying public roles (`tab`, `radio`, `gridcell`, `row`, `status`,
   `option`, `listbox`) and public properties (`isOpen`, `emojis`). No
   test reads component class names, private fields, or specific text
   content. Prior art: the existing `emoji-picker supports keyboard grid
   navigation and dismissal`, `emoji-picker returns focus to trigger on
   close`, and `Tab commits the selected emoji` tests.
2. A Node package smoke run after `npm run build` and before the browser
   bundle in the `test` script. It imports the ESM entry and each subpath,
   requires the CJS entries, asserts the exported class names, and asserts
   the CSS files named in `exports` exist. Prior art: the existing
   `button subpath exports only EmojiButton` test already reads
   package.json `exports`; the smoke extends that check with actual module
   loading, which can only happen in Node.

A good test here observes what a user or consumer observes: focus
location, `isOpen`, the emoji-select event detail, the field's value,
element roles and `tabindex`, and whether a module loads. It does not
assert on how the component stores state.

Behaviors that must have a test:

- Enter on a tab or tone radio activates it and does not emit emoji-select.
- ArrowLeft in the search box leaves focus in the search box.
- After an outside click, focus stays on the clicked element.
- After selection with a `for` field, focus is on that field.
- Inline picker stays visible after selection and arrows move focus.
- `open()` from a bubbling click handler leaves `isOpen` true.
- Exactly one gridcell button has `tabindex="0"`; cells sit under rows.
- Status region updates on query change, not on hover.
- Picker panel stays inside the viewport when the anchor is near the
  bottom edge.
- Enter with `isComposing` true does not commit in the autocomplete.
- `detach()` leaves no aria attributes on the field.
- A property set before `customElements.define` survives upgrade.
- ESM import and CJS require of every entry succeed in Node.
- Every path in the `exports` CSS entries exists after build.

Update the existing tests that assumed the old structure (gridcell
buttons as direct grid children, status region updated on hover, manual
popover). Do not test README or AGENTS.md content.

## Out of Scope

- Virtualizing or paginating the grid; rendering cost with the full
  dataset is a performance topic, not a correctness one.
- Reducing bundle size by lazy-loading or slimming the emoji dataset.
- Adopting CSS anchor positioning or `position-try-fallbacks`; the
  guidance retrieved during the audit still lists it as limited
  availability, so manual placement stays.
- `visualViewport` handling for on-screen keyboards on mobile.
- Searching the human-readable `label` field in addition to `name` and
  keywords.
- Exposing `aria-expanded` on the button; that needs the button to observe
  picker state and is a separate small feature.
- A popover polyfill for browsers without the Popover API.
- Fixing README badges beyond the CSS section and the incorrect package
  references; the demo link placeholder is left for the maintainer.

## Further Notes

- The switch to `popover="auto"` changes one visible interaction: clicking
  the emoji button while the picker is open now light-dismisses on
  pointerdown and reopens on click. This is the standard toggle-button
  feel and is acceptable.
- Keep the user's CSS rules: no font sizes below 1rem, no unrelated CSS
  edits, nested selectors over new class names.
- Import of the picker class solely as a type is elided by bundlers, so
  the element never registers. This bit the audit's own probe. It is
  standard TypeScript behavior and not a library bug, but the README
  example that imports the class should reference it as a value (it does,
  via `EmojiPicker.TAG`).
- The modern-web-guidance skill reported itself outdated during the
  audit (installed 2026_05_16, latest 2026_09_04). Re-check the popover
  and anchor positioning support notes against the current version before
  implementation if browser support matters for a decision above.
