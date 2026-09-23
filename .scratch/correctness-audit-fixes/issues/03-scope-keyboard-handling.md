# 03: Keyboard handling scoped to the focused control

**What to build:** Keyboard events inside the picker are handled by the
control that has focus. A keyboard user who presses Enter or Space on a
category tab or skin tone radio activates that control and no emoji is
inserted. Arrow keys typed in the search box edit the query instead of
jumping focus into the grid. ArrowDown from the search box moves focus
into the grid. Enter in the search box with a non-empty query selects
the first visible emoji. Skin tone radios support ArrowLeft and
ArrowRight the way tabs already do.

**Blocked by:** None (can start immediately)

**Touches:** `src/picker.ts` (`onKeydown`, `onTabKeydown`, the tone
radio rendering and a new tone keydown handler, `static render` where
listeners are attached), `test/index.ts` (the existing keyboard grid
navigation test and new tests).

**Status:** done

**Notes:**

- The host keydown handler dispatches on where the event originated
  (`event.target` closest gridcell button, search input, tab, or tone
  radio) rather than treating every key as a grid key.
- Grid cell buttons: arrows move within the grid (keep the current
  hardcoded eight-column step for ArrowUp and ArrowDown in this ticket;
  ticket 06 derives it from rendered rows). Enter and Space are left to
  the native button, so no `preventDefault` on Enter and no synthetic
  click.
- Search box: ArrowDown moves focus to the first cell or the last
  focused cell. Enter with a non-empty query selects the first visible
  emoji. Every other key, including ArrowLeft, ArrowRight, ArrowUp,
  Home, and End, is left to the input.
- Tabs: existing ArrowLeft, ArrowRight, Home, End behavior stays. Enter
  and Space are left to the native button.
- Tone radios: ArrowLeft and ArrowRight move focus between radios and
  check the focused one, matching the tab pattern. Enter and Space are
  left to the native button.
- Escape handling is unchanged in this ticket; ticket 05 reworks it.
- Tests query public roles (`tab`, `radio`, `gridcell`, `searchbox` or
  the input by its role) and observe focus location, `isOpen`, and
  whether `emoji-select` fired. Do not read class names or private
  fields.

- [x] Enter on a focused category tab activates that tab and does not emit `emoji-select`
- [x] Enter on a focused skin tone radio checks that radio and does not emit `emoji-select`
- [x] ArrowLeft pressed in the search box leaves focus in the search box
- [x] ArrowDown pressed in the search box moves focus into the grid
- [x] Enter in the search box with a non-empty query emits `emoji-select` for the first visible emoji
- [x] ArrowRight on a focused tone radio moves focus to and checks the next radio
- [x] Existing tab arrow navigation and grid arrow navigation tests still pass
