import { EmojiInput } from '../src/index.js'

export function render ():string {
    return `<div>
        <${EmojiInput.TAG}>
            <textarea />
        </${EmojiInput.TAG}>
    </div>`
}
