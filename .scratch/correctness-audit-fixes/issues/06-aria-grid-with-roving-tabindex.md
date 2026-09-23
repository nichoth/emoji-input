# 06: ARIA grid with rows and a single Tab stop

**What to build:** A keyboard user leaves the search box with one Tab
press into the grid and one more out of it. The grid follows the ARIA
grid pattern: `role="row"` wrappers hold `role="gridcell"` wrappers,
each holding a native `<button>` that carries the emoji, its accessible
name, and the click handler. Exactly one cell button is tabbable at a
time. Arrow keys move between cells, with the ArrowUp and ArrowDown
step derived from the rendered row structure rather than a hardcoded
eight. Home and End move to the row start and end.

**Blocked by:** 03 (Keyboard handling scoped to the focused control)

**Touches:** `src/picker.ts` (`renderGrid`, the grid branch of
`onKeydown`, `showPreview` and `clearPreview` listener wiring),
`src/picker.css` (grid and row column template only), `test/index.ts`
(the "renders category tabs and an eight-column grid", "supports
keyboard grid navigation and dismissal", and "updates its preview when
an emoji is hovered" tests, plus new tests).

**Status:** done

**Notes:**

- Roving tabindex: exactly one cell button has `tabindex="0"`, the last
  focused cell or the first cell after a render. All others are `-1`.
  Update tabindex when focus moves by arrow key or by click.
- The column template moves from the grid container to the row so the
  existing eight-column layout is preserved. This is the only CSS change
  allowed in this ticket. Use existing `--emoji-picker-*` variables and
  nested selectors.
- Hover and focus preview listeners are delegated from the grid
  container rather than attached per cell.
- Column count for ArrowUp and ArrowDown comes from the number of
  gridcells in the current row.
- Home moves to the first cell in the current row, End to the last.
- Buttons keep their native role. Do not put `role="gridcell"` on the
  button itself.
- Tests query `row` and `gridcell` roles and read `tabindex`. Do not
  read class names.

- [x] Every gridcell sits inside an element with `role="row"` and every gridcell contains exactly one native button
- [x] Exactly one gridcell button has `tabindex="0"` after render, after arrow navigation, and after a click
- [x] Tab from the search box lands on the single tabbable cell, and Tab again leaves the grid
- [x] ArrowDown from a cell moves focus to the cell directly below it, using the rendered row length
- [x] Home and End move focus to the first and last cell of the current row
- [x] Enter on a focused cell emits `emoji-select` for that cell
- [x] The grid still renders eight columns per row at the default width
- [x] Hovering a cell still updates the preview through the delegated listener
