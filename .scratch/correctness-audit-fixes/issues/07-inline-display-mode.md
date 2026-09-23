# 07: Inline as a first-class display mode

**What to build:** An app developer embeds `<emoji-picker inline>` in a
form. The panel is always visible, `isOpen` is always true, keyboard
navigation works without ever calling `open()`, and selecting an emoji
leaves the panel on screen. `open()` only focuses the search box.
`close()` and selection never hide the panel. Escape clears the query
and returns focus to the search box. Toggling the `inline` attribute
while connected switches between the closed popover state and the
visible inline state.

**Blocked by:** 05 (Native light dismiss, focus restoration, and custom
triggers)

**Touches:** `src/picker.ts` (`syncMode`, `attributeChangedCallback`,
`open`, `close`, `select`, `isOpen`, `onKeydown` Escape branch, any
`opened` gate on keyboard handling), `test/index.ts` (the "inline mode
stays in document flow" test plus new tests).

**Status:** done

**Notes:**

- `inline` selects a display mode. In inline mode the panel never has
  `popover` or `hidden` set, `isOpen` returns true, and the keyboard
  handler is always active.
- `open()` in inline mode focuses the search box and does nothing else.
  `close()` in inline mode is a no-op for visibility. Selection in
  inline mode emits `emoji-select`, inserts into the `for` field when
  present, and leaves the panel visible.
- Escape in inline mode clears the query, re-renders the grid, and
  focuses the search box.
- Adding `inline` while connected removes the popover attribute, clears
  `hidden`, and sets the open flag. Removing it restores
  `popover="auto"` and resets to the closed state.
- Roving tabindex and ARIA grid structure from ticket 06 are not
  required for this ticket's tests, but if 06 has landed the inline
  grid should behave identically.

- [x] An inline picker reports `isOpen` true immediately after connect without `open()` being called
- [x] After a selection, an inline picker's panel is still visible and `isOpen` is still true
- [x] Arrow keys move focus between grid cells in an inline picker that was never opened
- [x] Escape in an inline picker clears the search query and leaves the panel visible
- [x] `close()` on an inline picker leaves the panel visible
- [x] Adding the `inline` attribute to a connected popover picker makes the panel visible; removing it hides the panel and `isOpen` becomes false
