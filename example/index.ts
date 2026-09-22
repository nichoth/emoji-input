import { type FunctionComponent, render } from 'preact'
import { html } from 'htm/preact'
import { EmojiSearch } from '../src/index.js'

const Example:FunctionComponent<unknown> = function () {
    return html`<div class="example">
        <${EmojiSearch.TAG}>
            <textarea></textarea>
        <//>
    </div>`
}

render(html`<${Example} />`, document.getElementById('root')!)
