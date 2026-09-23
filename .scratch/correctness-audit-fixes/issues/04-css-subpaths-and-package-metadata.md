# 04: CSS subpaths, package metadata, and docs

**What to build:** An app developer can import the component stylesheets
from documented package subpaths that actually resolve, and the package
can be published. The build copies the three stylesheets into `dist`
unchanged and also emits minified copies. The `exports` map gains
explicit CSS entries. `private` is removed and the unused `microtags`
dependency is dropped. The README CSS section and the AGENTS.md
statement about style injection are corrected to match reality.

**Blocked by:** 01 (Package loads in Node)

**Touches:** `package.json` (`exports`, `private`, `dependencies`,
`build` scripts), `src/index.css`, `src/picker.css`, `src/button.css`
(copied, not edited), the Node smoke script from ticket 01, `README.md`
(CSS section and badges), `AGENTS.md` (stylesheet statement).

**Status:** done

**Notes:**

- New `exports` entries: `./css` (all three stylesheets concatenated),
  `./css/min` (minified concatenation), and per-component
  `./index.css`, `./picker.css`, `./button.css`. The `./*` wildcard
  stays for JavaScript. Explicit entries are required because Node does
  not fall through an `exports` target array on a missing file.
- Use lightningcss (already a devDependency) or esbuild for the
  minified copies. Do not edit the stylesheet contents.
- Remove `"private": true`. Remove `microtags` from `dependencies`;
  nothing imports it.
- AGENTS.md currently says picker styles are injected through
  `adoptedStyleSheets`. That is false. Styles ship as separate
  stylesheets the consumer imports and no component injects CSS.
  Correct both the picker convention and the component export
  convention that repeat the claim.
- Rewrite the README CSS section to document the new subpaths. Fix or
  remove badges that point at other packages. Leave the demo link
  placeholder alone.
- Do not write tests for README or AGENTS.md content.
- The smoke run from ticket 01 gains an assertion that every path named
  in the `exports` CSS entries exists after build.

- [x] After `npm run build`, every file referenced by the `./css`, `./css/min`, `./index.css`, `./picker.css`, and `./button.css` export entries exists in `dist`
- [x] Resolving each CSS subpath from Node via `import.meta.resolve` or `require.resolve` succeeds
- [x] `package.json` has no `private` field and no `microtags` dependency
- [x] The Node smoke run fails when a CSS export path is missing
- [x] `npm run lint`, type check, and the browser test bundle pass
