# 08: Result-count live region and query trimming

**What to build:** A screen reader user hears the number of matching
emoji when the search query changes, and hears nothing extra when
hovering or arrowing across cells. The preview element that mirrors the
hovered emoji is hidden from assistive technology because the cell's
own accessible name already announces it. Announcements are debounced
so rapid typing produces one. Category browsing is silent. A query with
leading whitespace returns the same results as the trimmed query.

**Blocked by:** 06 (ARIA grid with rows and a single Tab stop)

**Touches:** `src/picker.ts` (`static render` for the preview and
status elements, `showPreview`, `clearPreview`, `renderGrid`, the
search input handler), `test/index.ts` (the "updates its preview when
an emoji is hovered" and "search filters visible emoji" tests plus new
tests).

**Status:** done

**Notes:**

- The preview element gets `aria-hidden="true"`. It still updates
  visually on hover and focus.
- The `role="status"` region receives the result count text when the
  query changes, after a short debounce (around 150 ms is fine). It is
  not updated on hover, focus, or category change.
- The query is trimmed before it reaches the shared search function in
  `src/search.ts`. Do not change the search function's ranking order.
- Tests query the `status` role and read whether its content changed,
  not the specific wording. Use a condition-based wait for the debounce
  rather than a fixed sleep where possible.

- [x] The `status` region content changes after the search query changes
- [x] The `status` region content does not change when a cell is hovered or focused
- [x] The `status` region content does not change when the active category changes
- [x] Typing several characters quickly yields a single status update after the debounce
- [x] The preview element has `aria-hidden="true"`
- [x] A query with leading spaces renders the same cells as the trimmed query
