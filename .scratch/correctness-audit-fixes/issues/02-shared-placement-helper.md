# 02: Prefactor: shared popover placement helper

**What to build:** The autocomplete's positioning code is split into two
parts: a caret rectangle helper that stays private to the autocomplete,
and a placement helper that takes an anchor rectangle plus a panel size
and returns a top and left that place the panel below the anchor by
default, above when there is no room, clamped to the viewport inline
edges. The placement helper lives in its own module so the picker can
import it in ticket 09. Behavior of the autocomplete does not change.

**Blocked by:** None (can start immediately)

**Touches:** `src/index.ts` (the `reposition` method and the caret
mirror-div section), a new module such as `src/placement.ts`.

**Status:** done

**Notes:**

- This is a pure refactor. "Make the change easy, then make the easy
  change." The existing autocomplete popover tests (opens at caret,
  re-opens after close, closes when trigger disappears) are the
  regression net and must stay green without modification.
- The new module must not touch `document` or `window` at import time
  so it stays safe for the Node smoke run introduced in ticket 01. Read
  viewport size at call time.
- Do not add positioning to the picker in this ticket.
- Keep the flip gap and the below-then-above rule exactly as the
  autocomplete does it today.

- [x] The placement helper is a pure function: given an anchor rect, a panel size, a viewport size, and a gap it returns coordinates without touching the DOM
- [x] Placement returns a position below the anchor when there is room, above when there is not, and never past the viewport's inline edges
- [x] The autocomplete uses the shared helper and all existing autocomplete popover tests pass unchanged
- [x] Importing the placement module in Node does not throw
