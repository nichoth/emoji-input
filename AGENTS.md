# Working notes

## Emoji data and search

- `src/data.ts` is the adapter boundary for the Emoji Mart JSON dataset.
  Keep the public `EmojiEntry` fields compatible with custom emoji data.
- `src/search.ts` owns the shared ranking order: name prefix, name
  substring, then keyword prefix.
- Changes to the data adapter should be checked with `npm run lint`,
  `npx tsc --noEmit --project tsconfig.json`, and the browser test bundle.

## Picker component conventions

- Picker DOM stays light-DOM; its styles are injected once per document or
  shadow root through `adoptedStyleSheets`.
- Picker UI tokens use the `--emoji-picker-*` namespace so host styles can
  theme the panel without relying on internal class names.
- Picker category filtering should consume `EmojiEntry.category` or
  `EmojiEntry.categories`, while text filtering should use `src/search.ts`.

## Component exports

- Public custom elements should register from their component module and keep
  their DOM in light DOM with styles injected through adopted stylesheets.
- Adding a public component requires updating the main entrypoint and its
  explicit package subpath together so ESM and CommonJS builds agree.
## Picker state and interaction

- Persisted picker preferences should use configurable attributes and guard
  every `localStorage` read and write with an in-memory fallback.
- Picker interaction tests should query public roles such as `gridcell`,
  `radio`, and `status`, rather than component class names or private fields.
