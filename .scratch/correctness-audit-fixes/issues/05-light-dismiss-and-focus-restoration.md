# 05: Native light dismiss, focus restoration, and custom triggers

**What to build:** The picker behaves like a native popover. Clicking
anywhere outside closes it and leaves focus where the user clicked. An
app developer can call `picker.open()` from their own click handler
without stopping propagation and the picker stays open. Focus returns
to the trigger only when the picker closes by Escape or by a
programmatic `close()` while focus is inside the panel. After a
selection, focus moves to the `for` target field positioned after the
inserted emoji, or back to the trigger when there is no field. A light
dismiss or disconnect never moves focus. The button opens any element
that has an `open` method, so pickers registered under a custom tag
work.

**Blocked by:** 03 (Keyboard handling scoped to the focused control)

**Touches:** `src/picker.ts` (`static render` popover attribute,
`syncMode`, `open`, `close`, `select`, `onKeydown` Escape branch,
`onDocumentClick` and its listener registration in
`connectedCallback` and `disconnectedCallback`, `opened` flag and
`isOpen` getter), `src/button.ts` (`onClick`), `test/index.ts` (the
"closes when a popover click lands outside", "returns focus to trigger
on close", "emits emoji-select and closes after selection", and
"inserts into the field named by for" tests, plus new tests).

**Status:** done

**Notes:**

- The panel uses `popover="auto"` instead of `popover="manual"` when
  not inline. The platform owns light dismiss and Escape. Delete the
  document click listener entirely.
- Listen to the panel's `toggle` event to keep the `opened` flag and
  `isOpen` in sync, so state is correct whether the close came from
  `close()`, Escape, or a light dismiss.
- In browsers without the Popover API keep the existing `hidden`
  toggling; Escape is the only dismiss path there. No polyfill.
- The picker keeps its own Escape handler only for the non-popover
  fallback. Inline mode Escape behavior is ticket 07.
- Focus rules: Escape or programmatic `close()` with focus inside the
  panel restores focus to the trigger. Selection with a `for` field
  focuses that field with the caret after the inserted emoji. Selection
  without a field returns focus to the trigger. Light dismiss and
  `disconnectedCallback` never call `focus()`.
- `EmojiButton.onClick` drops `stopPropagation` and checks
  `typeof target.open === 'function'` instead of comparing `localName`.
- Known accepted change: clicking the emoji button while the picker is
  open light-dismisses on pointerdown and reopens on click. Do not try
  to suppress this.
- Update the existing tests that assumed the manual popover and the
  document click listener.

- [x] After an outside click on another focusable element, the picker is closed and focus stays on the clicked element
- [x] Calling `open()` from a click handler that lets the event bubble to `document` leaves `isOpen` true after the event finishes
- [x] Escape with focus inside the panel closes the picker and moves focus to the trigger
- [x] Programmatic `close()` with focus inside the panel moves focus to the trigger
- [x] After a selection with a `for` field, focus is on that field and the emoji is inserted at the caret
- [x] After a selection without a `for` field, focus is on the trigger
- [x] `isOpen` reports false after a light dismiss without `close()` being called
- [x] Removing the picker from the document while open does not move focus
- [x] The button opens a picker registered under a custom tag name
