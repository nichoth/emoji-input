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

const Base = typeof HTMLElement !== 'undefined' ?
    HTMLElement :
    class {} as unknown as typeof HTMLElement

export class EmojiButton extends Base {
    static TAG = 'emoji-button'
    private button:HTMLButtonElement|null = null

    static define (tag = EmojiButton.TAG):void {
        if (typeof window === 'undefined' || !window.customElements) return

        if (!customElements.get(tag)) {
            customElements.define(tag, EmojiButton)
        }
    }

    static render ():string {
        return `<button class="emoji-button" type="button">
            ${ICON_SVG}
            <span class="visually-hidden">
                Open emoji picker
            </span>
        </button>`
    }

    connectedCallback ():void {
        const btn = this.querySelector('button.emoji-button') as HTMLButtonElement
        if (btn) {
            this.button = btn
        } else {
            this.innerHTML = EmojiButton.render()
            this.button = this.querySelector('button')!
        }

        this.button!.addEventListener('click', this.onClick)
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
