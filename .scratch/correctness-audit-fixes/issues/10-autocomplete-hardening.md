# 10: Autocomplete hardening

**What to build:** An IME user pressing Enter to confirm a composition
candidate gets their candidate, not an emoji. Calling `detach()` leaves
the field with no leftover `aria-autocomplete`, `aria-controls`, or
`aria-activedescendant`. Properties assigned to an `emoji-input`
element before `customElements.define` ran survive the upgrade. A
server-rendered suggestion list child is adopted on connect instead of
a second list being created.

**Blocked by:** 02 (Prefactor: shared popover placement helper)

**Touches:** `src/index.ts` (`onKeydown`, `detach`, `connectedCallback`,
`hydrate`, the `emojis`, `minChars`, and `maxResults` members),
`test/index.ts` (the "detach prevents further triggers", "aria-controls
set and cleared", and "disconnectedCallback cleans up" tests plus new
tests).

**Status:** done

**Notes:**

- The blocking edge on 02 exists only because both tickets edit the
  autocomplete module and this tracker runs tickets concurrently. There
  is no logical dependency.
- `onKeydown` returns early for Enter, Tab, Escape, and arrow keys when
  `ev.isComposing` is true or `ev.keyCode === 229`.
- `detach()` removes all three aria attributes from the field it set
  them on.
- On connect, for each of `emojis`, `minChars`, and `maxResults`: if
  `Object.prototype.hasOwnProperty.call(this, name)` is true, capture the
  value, delete the own property, and reassign through the class
  accessor or field so the value is not shadowed.
- On connect, if a `.emoji-search-list` child already exists (from the
  static `render` helper) adopt it as `this.list` instead of creating a
  second one. The existing `hydrate` method is the place to look.
- Tests create the element with `document.createElement` before the
  class is defined under a fresh tag name (use `EmojiInput.define` with
  a unique tag) to exercise the pre-upgrade path.

- [x] A keydown Enter with `isComposing` true while the popover is open does not insert an emoji and leaves the popover open
- [x] After `detach()`, the field has none of `aria-autocomplete`, `aria-controls`, or `aria-activedescendant`
- [x] `minChars` assigned on an un-upgraded element is honored after upgrade
- [x] `emojis` assigned on an un-upgraded element is used for search after upgrade
- [x] Connecting an element whose HTML already contains the rendered list yields exactly one `listbox`
- [x] Existing autocomplete tests pass
