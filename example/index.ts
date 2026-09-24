import { type FunctionComponent, render } from 'preact'
import { html } from 'htm/preact'
import { EmojiInput, EmojiPicker, EmojiButton } from '../src/index.js'
import '../src/picker.css'
import '../src/button.css'
import '../src/index.css'
import './index.css'

const Example:FunctionComponent = function () {
    return html`<div class="example">
        <${EmojiInput.TAG}>
            <textarea id="message"></textarea>
        <//>

        <div class="picker-row">
            <${EmojiButton.TAG} for="picker"><//>
            <${EmojiPicker.TAG} id="picker" for="message"><//>
        </div>
    </div>`
}

render(html`<${Example} />`, document.getElementById('root')!)
