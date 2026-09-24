# emoji input
[![tests](https://img.shields.io/github/actions/workflow/status/nichoth/emoji-input/nodejs.yml?style=flat-square)](https://github.com/nichoth/emoji-input/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/emoji-input?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/emoji-input)](https://packagephobia.com/result?p=@substrate-system/emoji-input)
[![gzip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/emoji-input)](https://bundlephobia.com/package/@substrate-system/emoji-input)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)

When someone types `:<text>`, open an emoji picker. Or trigger the emoji picker
programmatically.

* Wrap a `<textarea>`/`<input>`, or point at one with `for="id"`,
  or call `.attach(input)`.
* On input, it looks at the text by the caret for `:xx`
  (it is word-boundary aware, so `http://foo` doesn't trigger).
  Two chars minimum.
* The list is a `<div popover="manual">`
* Position comes from a mirror-div caret measurement, flipped above the caret
  if there's no room below.
* Up and down arrows cycle, Enter/Tab insert emoji + space via setRangeText,
  Esc closes.
* Mouse hover/click also work; pointerdown is prevented so the field keeps focus.
* Fires emoji-select ({ emoji, query }) and a synthetic input event so
  frameworks pick up the change.
* no shadow DOM

[See a live demo](https://nichoth.github.io/package-name/)

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Install](#install)
- [Example](#example)
  * [Text Helper](#text-helper)
  * [Emoji Picker Component](#emoji-picker-component)
- [Modules](#modules)
  * [ESM](#esm)
  * [Common JS](#common-js)
- [CSS](#css)
  * [All components](#all-components)
  * [Per component](#per-component)
  * [CSS Variables](#css-variables)
  * [pre-built JS](#pre-built-js)

<!-- tocstop -->

</details>

## Install

```sh
npm i -S @substrate-system/emoji-input
```

## Example

### Text Helper

Use this with a `textarea` or `input` as a child, or give it a `for` attribute
equal to the `id` attribute of a `textarea` or `input`.

```js
import { EmojiInput } from '@substrate-system/emoji-input'

document.body += `
    <div class="example">
        <${EmojiInput.TAG}>
            <textarea></textarea>
        </${EmojiInput.TAG}>
    </div>
`
```

### Emoji Picker Component

An emoji picker UI. This package inlcudes a convenient button
component for openening the picker.

```ts
import { EmojiPicker } from '@substrate-system/emoji-input/picker'
import { EmojiButton } from '@substrate-system/emoji-input/button'

// note `id` attributes
document.body.innerHTML += `
  <textarea id="message"></textarea>

  <${EmojiButton.TAG} for="picker"><//>
  <${EmojiPicker.TAG} id="picker" for="message"><//>
`
```

![screenshot of emoji picker](image.png)



## Modules

This exposes ESM and common JS via
[package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM

```js
import { EmojiInput } from '@substrate-system/emoji-input'
```

### Common JS

```js
require('@substrate-system/emoji-input')
```

## CSS

Styles ship as separate CSS files. Import all three component
stylesheets at once, or pick only the ones you need.

### All components

```js
import '@substrate-system/emoji-input/css'
```

Or minified:

```js
import '@substrate-system/emoji-input/css/min'
```

### Per component

```js
import '@substrate-system/emoji-input/index.css'
import '@substrate-system/emoji-input/picker.css'
import '@substrate-system/emoji-input/button.css'
```

### CSS Variables

Every component reads its colors, sizes, and fonts from CSS custom
properties. Set them on the element or any ancestor.
Each variable has a default, so you only need to set the ones
you want to change.

```css
emoji-picker {
    --emoji-picker-bg: #1e1e1e;
    --emoji-picker-fg: #eee;
    --emoji-picker-border: #444;
}
```

#### Autocomplete (`index.css`)

These style the suggestion list that `<emoji-input>` shows while you type
a `:shortcode`.

| Variable | Default | Description |
| --- | --- | --- |
| `--emoji-search-padding` | `4px` | Padding inside the list |
| `--emoji-search-min-width` | `220px` | Minimum width of the list |
| `--emoji-search-max-width` | `320px` | Maximum width of the list |
| `--emoji-search-border` | `#d0d0d0` | Border color of the list |
| `--emoji-search-radius` | `8px` | Corner radius of the list |
| `--emoji-search-bg` | `#fff` | Background color of the list |
| `--emoji-search-fg` | `#111` | Text color of the list |
| `--emoji-search-shadow` | `0 8px 24px rgb(0 0 0 / 18%)` | Box shadow |
| `--emoji-search-font` | `14px/1.3 system-ui, sans-serif` | `font` shorthand |
| `--emoji-search-item-radius` | `5px` | Corner radius of each item |
| `--emoji-search-active-bg` | `#e8e8e8` | Background of the active item |
| `--emoji-search-active-fg` | `inherit` | Text color of the active item |
| `--emoji-search-match` | `inherit` | Color of the matched text |

#### Picker (`picker.css`)

These style the `<emoji-picker>` panel, in both popover and `inline` mode.

| Variable | Default | Description |
| --- | --- | --- |
| `--emoji-picker-width` | `320px` | Width of the panel |
| `--emoji-picker-padding` | `8px` | Padding inside the panel |
| `--emoji-picker-border` | `#d0d0d0` | Border color of the panel |
| `--emoji-picker-bg` | `#fff` | Background color of the panel |
| `--emoji-picker-fg` | `#111` | Text color of the panel |
| `--emoji-picker-shadow` | `0 8px 24px rgb(0 0 0 / 18%)` | Box shadow |
| `--emoji-picker-font` | `14px/1.3 system-ui, sans-serif` | `font` shorthand |
| `--emoji-picker-tab-color` | `#666` | Text color of category tabs |
| `--emoji-picker-tab-active-bg` | `#e8e8e8` | Background of the selected tab |
| `--emoji-picker-tab-active-color` | `#111` | Text color of the selected tab |
| `--emoji-picker-grid-height` | `300px` | Max height of the grid before it scrolls |
| `--emoji-picker-grid-gap` | `2px` | Gap between emoji in the grid |
| `--emoji-picker-search-border` | `#d0d0d0` | Border color of the search box |
| `--emoji-picker-search-bg` | `#fff` | Background of the search box |
| `--emoji-picker-search-fg` | `#111` | Text color of the search box |
| `--emoji-picker-tone-font` | `18px/1.2 sans-serif` | `font` shorthand for skin tone buttons |
| `--emoji-picker-tone-active-bg` | `--emoji-picker-tab-active-bg` | Background of the selected skin tone |
| `--emoji-picker-emoji-font` | `24px/1.2 sans-serif` | `font` shorthand for emoji in the grid |
| `--emoji-picker-hover-bg` | `#e8e8e8` | Background of a hovered or focused emoji |
| `--emoji-picker-muted` | `#666` | Text color of the "no results" message |
| `--emoji-picker-preview-border` | `transparent` | Top border of the preview row |
| `--emoji-picker-preview-fg` | `inherit` | Text color of the preview row |
| `--emoji-picker-preview-glyph-font` | `28px/1.2 sans-serif` | `font` shorthand for the preview emoji |

#### Button (`button.css`)

These style the `<emoji-button>` that opens a picker.

| Variable | Default | Description |
| --- | --- | --- |
| `--emoji-button-color` | `currentColor` | Color of the button icon |
| `--emoji-button-size` | `24px` | Width and height of the button and icon |

### pre-built JS

This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy

```sh
cp ./node_modules/@substrate-system/emoji-input/dist/index.min.js ./public/emoji.min.js
```

#### HTML

```html
<script type="module" src="./emoji.min.js"></script>
```
