# 01: Package loads in Node

**What to build:** An app developer can `import '@substrate-system/emoji-input'`
and the `/picker` and `/button` subpaths in Node (ESM) and `require` the
CJS entries, and each module evaluates without throwing. Today the built
JavaScript fails to load because the emoji dataset import has no JSON
import attribute. The test script gains a Node smoke run that proves the
package loads before the browser bundle runs.

**Blocked by:** None (can start immediately)

**Touches:** `src/data.ts` (dataset import line), `package.json`
(`test`, `build-cjs`, `build-esm` scripts), `tsconfig.json` or
`tsconfig.build.json` (module setting only if TypeScript rejects the
import attribute), a new Node smoke script under `test/` (for example
`test/smoke.mjs`), `src/index.ts`, `src/picker.ts`, `src/button.ts`
(exported symbols the smoke asserts on).

**Status:** done

**Notes:**

- The dataset import in the data adapter declares
  `with { type: 'json' }`. The ESM build keeps the attribute. The CJS
  build lowers it to `require`. Keep `src/data.ts` as the adapter
  boundary; do not change the shape of `EmojiEntry`.
- If TypeScript rejects import attributes under the current module
  setting, change the module setting to one that accepts them rather
  than changing the adapter.
- The smoke run executes after `npm run build` and before the esbuild
  browser bundle inside the `test` script. It imports the ESM entry and
  each subpath, requires each CJS entry, and asserts the exported class
  names (`EmojiInput`, `EmojiPicker`, `EmojiButton`). Ticket 04 extends
  this same smoke run with CSS path checks, so give it a clear place to
  add assertions.
- `npm run lint` and `npx tsc --noEmit --project tsconfig.json` must
  still pass.

- [x] ESM import of the main entry, `/picker`, and `/button` succeeds in Node
- [x] CJS require of the main entry, `/picker`, and `/button` succeeds in Node
- [x] The main entry exports `EmojiInput`, `EmojiPicker`, and `EmojiButton`; the `/button` subpath exports only `EmojiButton`
- [x] `npm test` runs the Node smoke before the browser bundle and fails when a module cannot load
- [x] Existing browser tests still pass
