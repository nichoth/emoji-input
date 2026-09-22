# emoji input
[![tests](https://img.shields.io/github/actions/workflow/status/nichoth/emoji-input/nodejs.yml?style=flat-square)](https://github.com/nichoth/emoji-input/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/icons?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@nichoth/session-cookie)](https://packagephobia.com/result?p=@nichoth/session-cookie)
[![gzip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/emoji-input)](https://bundlephobia.com/package/@substrate-system/emoji-input)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)

When someone types `:<text>`, open an emoji picker.

* Wrap a `<textarea>`/`<input>`, or point at one with `for="id"`, or call
  `.attach(input)`.
* On input, it looks at the text by the caret for `:xx`
  (word-boundary aware, so `http://foo` doesn't trigger). Two chars minimum.
* The list is a `<div popover="manual">`
* Position comes from a mirror-div caret measurement, flipped above the caret
  if there's no room below.
* Up and down arrows cycle, Enter/Tab insert emoji + space via setRangeText,
  Esc closes.
* Mouse hover/click also work; pointerdown is prevented so the field keeps focus.
* Fires emoji-select ({ emoji, query }) and a synthetic input event so
  frameworks pick up the change.

[See a live demo](https://nichoth.github.io/package-name/)

<details><summary><h2>Contents</h2></summary>
<!-- toc -->
</details>

## Install

```sh
npm i -S @substrate-system/package
```

## Example

`usage instructions here`

### JS
```js
import '@substrate-system/package/module'
```


## Modules

This exposes ESM and common JS via [package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import '@substrate-system/package/module'
```

### Common JS
```js
require('@substrate-system/package/module')
```

## CSS

### Import CSS

```js
import '@substrate-system/package-name/css'
```

Or minified:
```js
import '@substrate-system/package-name/css/min'
```

### Customize CSS via some variables

```css
component-name {
    --example: pink;
}
```

### pre-built JS
This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/package/dist/module.min.js ./public
```

#### HTML
```html
<script type="module" src="./module.min.js"></script>
```
