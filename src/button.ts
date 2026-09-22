import { type EmojiPicker } from './picker'

const ICON_SVG = `<svg class="emoji-button"
    fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10"
        fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="9" cy="10" r="1"/>
    <circle cx="15" cy="10" r="1"/>
    <path d="M8 15c2 2 6 2 8 0"
        fill="none" stroke="currentColor"
        stroke-linecap="round" stroke-width="2"/>
</svg>`

export class EmojiButton extends HTMLElement {
    static TAG = 'emoji-button'

    static define (tag = EmojiButton.TAG):void {
        if (!customElements.get(tag)) customElements.define(tag, EmojiButton)
    }

    private readonly button:HTMLButtonElement

    constructor () {
        super()
        this.button = document.createElement('button')
        this.button.className = 'emoji-button'
        this.button.type = 'button'
        this.button.setAttribute('aria-label', 'Open emoji picker')
        this.button.innerHTML = ICON_SVG
        this.button.addEventListener('click', this.onClick)
    }

    connectedCallback ():void {
        if (!this.button.isConnected) this.append(this.button)
    }

    private onClick = (ev:MouseEvent):void => {
        ev.stopPropagation()
        const forId = this.getAttribute('for')
        if (!forId) return

        const root = this.getRootNode() as Document
        const target = root.getElementById(forId)
        if (target?.localName !== 'emoji-picker') return

        const picker = target as EmojiPicker
        picker.open(this)
    }
}

EmojiButton.define()

declare global {
    interface HTMLElementTagNameMap {
        'emoji-button':EmojiButton;
    }
}
