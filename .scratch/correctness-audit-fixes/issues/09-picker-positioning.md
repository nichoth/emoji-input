# 09: Picker flips and stays in the viewport

**What to build:** When a trigger button sits near the bottom of the
viewport, the picker opens above it instead of running off screen. The
panel is placed below the anchor by default, above when there is no
room, and clamped to the viewport inline edges, using the same
placement helper the autocomplete uses. While open, the picker
repositions on window resize and capture-phase scroll, and detaches
those listeners on close.

**Blocked by:** 02 (Prefactor: shared popover placement helper), 05
(Native light dismiss, focus restoration, and custom triggers)

**Touches:** `src/picker.ts` (`open`, `close`, the toggle event handler
from ticket 05, a new `reposition` method), the placement module from
ticket 02, `test/index.ts` (the "emoji-button positions the picker
below itself" test plus new tests).

**Status:** done

**Notes:**

- `open(anchor)` stores the anchor and calls a `reposition` method that
  reads the anchor rect and panel size and applies the shared placement
  result. Inline mode never positions.
- Add `resize` and capture-phase `scroll` listeners on `window` when the
  popover opens and remove them when it closes, including closes that
  arrive through the `toggle` event after a light dismiss. Mirror the
  autocomplete's attach and detach pattern.
- CSS anchor positioning is out of scope. No CSS changes.
- Tests position a trigger near the bottom of the viewport (for example
  with fixed positioning in a test container) and assert the panel's
  bounding rect stays inside `window.innerHeight` and `innerWidth`.

- [x] With the anchor near the bottom edge, the open panel's bottom is within the viewport height
- [x] With the anchor near the right edge, the open panel's right is within the viewport width
- [x] With room below, the panel opens below the anchor
- [x] The panel's position updates after a window resize while open
- [x] After close, resizing the window does not throw and no reposition listener remains
