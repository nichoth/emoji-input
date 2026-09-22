import { DEFAULT_EMOJIS, type EmojiEntry } from './data.js'
import { search } from './search.js'
import PICKER_STYLES from './picker.css'

export { EmojiButton } from './button.js'

const PICKER_STYLE_ID = 'emoji-picker-styles'

function ensurePickerStyles (root:Document|ShadowRoot):void {
    const r = root as Document|ShadowRoot
    if (r.querySelector(`#${PICKER_STYLE_ID}`)) return
    const style = document.createElement('style')
    style.id = PICKER_STYLE_ID
    style.textContent = PICKER_STYLES
    ;(r instanceof Document ? r.head : r).append(style)
}

type PickerField = HTMLTextAreaElement|HTMLInputElement
type PickerCategory = {
    readonly id:string;
    readonly label:string;
    readonly icon:string;
}

const CATEGORIES:Array<PickerCategory> = [
    { id:'people', label:'People', icon:'😀' },
    { id:'nature', label:'Nature', icon:'🐻' },
    { id:'foods', label:'Food', icon:'🍔' },
    { id:'activity', label:'Activity', icon:'⚽' },
    { id:'places', label:'Places', icon:'🌍' },
    { id:'objects', label:'Objects', icon:'💡' },
    { id:'symbols', label:'Symbols', icon:'🔣' },
    { id:'flags', label:'Flags', icon:'🏳️' },
]

const RECENTS:PickerCategory = {
    id:'recent',
    label:'Recently used',
    icon:'🕘',
}

const MAX_RECENTS = 24
const DEFAULT_RECENT_KEY = 'emoji-picker-recents'
const DEFAULT_SKIN_TONE_KEY = 'emoji-picker-skin-tone'
const memoryRecents = new Map<string, Array<string>>()
const memorySkinTones = new Map<string, number>()
const TONE_SWATCHES = ['👋', '👋🏻', '👋🏼', '👋🏽', '👋🏾', '👋🏿']
const TONE_LABELS = [
    'Default skin tone',
    'Light skin tone',
    'Medium-light skin tone',
    'Medium skin tone',
    'Medium-dark skin tone',
    'Dark skin tone',
]

export class EmojiPicker extends HTMLElement {
    static TAG = 'emoji-picker'
    static observedAttributes = [
        'inline',
        'recent-key',
        'skin-tone-key',
    ]

    static define (tag = EmojiPicker.TAG):void {
        if (!customElements.get(tag)) customElements.define(tag, EmojiPicker)
    }

    private data:Array<EmojiEntry> = DEFAULT_EMOJIS
    private readonly panel:HTMLDivElement
    private readonly tabs:HTMLDivElement
    private readonly searchInput:HTMLInputElement
    private readonly grid:HTMLDivElement
    private readonly tones:HTMLDivElement
    private readonly preview:HTMLDivElement
    private category = 'recent'
    private query = ''
    private opened = false
    private recentNames:Array<string> = []
    private skinTone = 0

    get recentKey ():string {
        return this.getAttribute('recent-key') ?? DEFAULT_RECENT_KEY
    }

    set recentKey (value:string) {
        this.setAttribute('recent-key', value)
    }

    get skinToneKey ():string {
        return this.getAttribute('skin-tone-key')
            ?? DEFAULT_SKIN_TONE_KEY
    }

    set skinToneKey (value:string) {
        this.setAttribute('skin-tone-key', value)
    }

    constructor () {
        super()
        this.panel = document.createElement('div')
        this.panel.className = 'emoji-picker__panel'
        this.panel.setAttribute('popover', 'manual')

        this.tabs = document.createElement('div')
        this.tabs.className = 'emoji-picker__tabs'
        this.tabs.setAttribute('role', 'tablist')

        this.searchInput = document.createElement('input')
        this.searchInput.className = 'emoji-picker__search'
        this.searchInput.type = 'search'
        this.searchInput.placeholder = 'Search emoji'
        this.searchInput.setAttribute('aria-label', 'Search emoji')
        this.searchInput.addEventListener('input', () => {
            this.query = this.searchInput.value
            this.renderGrid()
        })

        this.tones = document.createElement('div')
        this.tones.className = 'emoji-picker__tones'
        this.tones.setAttribute('role', 'radiogroup')
        this.tones.setAttribute('aria-label', 'Skin tone')

        this.grid = document.createElement('div')
        this.grid.className = 'emoji-picker__grid'
        this.grid.setAttribute('role', 'grid')

        this.preview = document.createElement('div')
        this.preview.className = 'emoji-picker__preview'
        this.preview.setAttribute('role', 'status')
        this.preview.setAttribute('aria-live', 'polite')

        this.panel.append(
            this.tabs,
            this.searchInput,
            this.tones,
            this.grid,
            this.preview,
        )
        this.addEventListener('keydown', this.onKeydown)
    }

    get emojis ():Array<EmojiEntry> {
        return this.data
    }

    set emojis (value:Array<EmojiEntry>) {
        this.data = value
        this.renderGrid()
    }

    get isOpen ():boolean {
        return this.opened
    }

    connectedCallback ():void {
        const root = this.getRootNode() as Document|ShadowRoot
        ensurePickerStyles(root)
        this.loadRecents()
        this.loadSkinTone()
        this.syncMode()
        if (!this.panel.isConnected) this.append(this.panel)
        this.renderTabs()
        this.renderTones()
        this.renderGrid()
        document.addEventListener('click', this.onDocumentClick)
    }

    disconnectedCallback ():void {
        document.removeEventListener('click', this.onDocumentClick)
        this.close()
    }

    attributeChangedCallback (name:string):void {
        this.syncMode()
        if (name === 'recent-key') this.loadRecents()
        if (name === 'skin-tone-key') this.loadSkinTone()
        this.renderTones()
        this.renderGrid()
    }

    open (anchor?:HTMLElement):void {
        this.panel.hidden = false
        if (!this.hasAttribute('inline')
            && typeof this.panel.showPopover === 'function') {
            this.panel.showPopover()
        }
        if (anchor && !this.hasAttribute('inline')) {
            const rect = anchor.getBoundingClientRect()
            this.panel.style.top = `${rect.bottom}px`
            this.panel.style.left = `${rect.left}px`
        }
        this.opened = true
    }

    close ():void {
        if (this.panel.matches(':popover-open')) {
            this.panel.hidePopover()
        }
        this.panel.hidden = true
        this.opened = false
    }

    private renderTabs ():void {
        this.tabs.replaceChildren()
        const tabs = [RECENTS, ...CATEGORIES]
        for (const category of tabs) {
            const tab = document.createElement('button')
            tab.type = 'button'
            tab.className = 'emoji-picker__tab'
            tab.setAttribute('role', 'tab')
            tab.setAttribute('aria-label', category.label)
            tab.setAttribute(
                'aria-selected',
                String(category.id === this.category),
            )
            tab.title = category.label
            tab.textContent = category.icon
            tab.addEventListener('click', () => {
                this.category = category.id
                this.renderTabs()
                this.renderGrid()
            })
            this.tabs.append(tab)
        }
    }

    private syncMode ():void {
        if (this.hasAttribute('inline')) {
            this.panel.removeAttribute('popover')
        } else {
            this.panel.setAttribute('popover', 'manual')
        }
    }

    private renderGrid ():void {
        if (!this.grid) return
        this.grid.replaceChildren()
        this.clearPreview()
        const emojis = this.query.trim()
            ? search(this.data, this.query, this.data.length)
            : this.category === RECENTS.id
                ? this.recentEntries()
                : this.data.filter(emoji => (
                    emoji.category === this.category
                    || emoji.categories?.includes(this.category) === true
                ))

        if (!emojis.length) {
            const empty = document.createElement('div')
            empty.className = 'emoji-picker__empty'
            empty.textContent = this.category === RECENTS.id
                ? 'No recently used emoji'
                : 'No emoji in this category'
            this.grid.append(empty)
            return
        }

        for (const emoji of emojis) {
            const displayed = this.withSelectedTone(emoji)
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'emoji-picker__emoji'
            button.setAttribute('role', 'gridcell')
            button.setAttribute(
                'aria-label', displayed.label ?? displayed.name
            )
            button.textContent = displayed.emoji
            button.addEventListener('mouseenter', () => {
                this.showPreview(displayed)
            })
            button.addEventListener('focus', () => {
                this.showPreview(displayed)
            })
            button.addEventListener('click', () => this.select(displayed))
            this.grid.append(button)
        }
    }

    private select (emoji:EmojiEntry):void {
        const query = this.query
        this.addRecent(emoji)
        const field = this.targetField
        if (field) {
            const start = field.selectionStart ?? field.value.length
            const end = field.selectionEnd ?? start
            field.setRangeText(emoji.emoji, start, end, 'end')
            field.dispatchEvent(new InputEvent('input', {
                bubbles:true,
                inputType:'insertText',
                data:emoji.emoji,
            }))
        }
        this.close()
        this.dispatchEvent(new CustomEvent('emoji-select', {
            bubbles:true,
            composed:true,
            detail:{ emoji, query },
        }))
    }

    private get targetField ():PickerField|null {
        const id = this.getAttribute('for')
        if (!id) return null
        const field = document.getElementById(id)
        return field instanceof HTMLTextAreaElement
            || field instanceof HTMLInputElement
            ? field
            : null
    }

    private loadRecents ():void {
        const stored = this.readRecents()
        this.recentNames = stored
    }

    private recentEntries ():Array<EmojiEntry> {
        return this.recentNames
            .map(name => this.data.find(emoji => emoji.name === name))
            .filter((emoji):emoji is EmojiEntry => emoji !== undefined)
    }

    private addRecent (emoji:EmojiEntry):void {
        this.recentNames = [
            emoji.name,
            ...this.recentNames.filter(name => name !== emoji.name),
        ].slice(0, MAX_RECENTS)
        this.writeRecents()
    }

    private readRecents ():Array<string> {
        const key = this.recentKey
        try {
            const value = window.localStorage.getItem(key)
            if (value) {
                const parsed:unknown = JSON.parse(value)
                if (Array.isArray(parsed)) {
                    return parsed.filter(
                        (name):name is string => typeof name === 'string'
                    ).slice(0, MAX_RECENTS)
                }
            }
        } catch {
            return [...memoryRecents.get(key) ?? []]
        }
        return [...memoryRecents.get(key) ?? []]
    }

    private writeRecents ():void {
        const key = this.recentKey
        memoryRecents.set(key, [...this.recentNames])
        try {
            window.localStorage.setItem(
                key,
                JSON.stringify(this.recentNames)
            )
        } catch {
            // The in-memory map is the fallback when storage is unavailable.
        }
    }

    private renderTones ():void {
        if (!this.tones) return
        this.tones.replaceChildren()
        TONE_SWATCHES.forEach((swatch, tone) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'emoji-picker__tone'
            button.setAttribute('role', 'radio')
            button.setAttribute('aria-label', TONE_LABELS[tone] ?? swatch)
            button.setAttribute('aria-checked', String(tone === this.skinTone))
            button.textContent = swatch
            button.addEventListener('click', () => {
                this.skinTone = tone
                this.writeSkinTone()
                this.renderTones()
                this.renderGrid()
            })
            this.tones.append(button)
        })
    }

    private withSelectedTone (emoji:EmojiEntry):EmojiEntry {
        const variants = emoji.skins ?? emoji.variants
        const variant = variants?.[this.skinTone]
        return variant ? { ...emoji, emoji:variant.native } : emoji
    }

    private loadSkinTone ():void {
        const key = this.skinToneKey
        try {
            const value = window.localStorage.getItem(key)
            const tone = value === null ? undefined : Number(value)
            if (tone !== undefined && Number.isInteger(tone)
                && tone >= 0 && tone < TONE_SWATCHES.length) {
                this.skinTone = tone
                return
            }
        } catch {
            // The in-memory map is the fallback when storage is unavailable.
        }
        this.skinTone = memorySkinTones.get(key) ?? 0
    }

    private writeSkinTone ():void {
        const key = this.skinToneKey
        memorySkinTones.set(key, this.skinTone)
        try {
            window.localStorage.setItem(key, String(this.skinTone))
        } catch {
            // The in-memory map is the fallback when storage is unavailable.
        }
    }

    private clearPreview ():void {
        this.preview.replaceChildren()
    }

    private showPreview (emoji:EmojiEntry):void {
        const glyph = document.createElement('span')
        glyph.className = 'emoji-picker__preview-glyph'
        glyph.textContent = emoji.emoji

        const name = document.createElement('span')
        name.className = 'emoji-picker__preview-name'
        name.textContent = emoji.name

        this.preview.replaceChildren(glyph, name)
    }

    private onKeydown = (event:KeyboardEvent):void => {
        if (!this.opened) return
        if (event.key === 'Escape') {
            event.preventDefault()
            this.close()
            return
        }

        const buttons = Array.from(
            this.grid.querySelectorAll<HTMLButtonElement>(
                '[role="gridcell"]'
            )
        )
        if (!buttons.length) return

        const active = document.activeElement
        const current = Math.max(0, buttons.indexOf(
            active as HTMLButtonElement
        ))
        const delta = event.key === 'ArrowRight'
            ? 1
            : event.key === 'ArrowLeft'
                ? -1
                : event.key === 'ArrowDown'
                    ? 8
                    : event.key === 'ArrowUp'
                        ? -8
                        : 0

        if (delta) {
            event.preventDefault()
            const index = (current + delta + buttons.length)
                % buttons.length
            buttons[index]?.focus()
        } else if (event.key === 'Enter') {
            event.preventDefault()
            buttons[current]?.click()
        }
    }

    private onDocumentClick = (event:MouseEvent):void => {
        if (!this.opened) return
        if (!event.composedPath().includes(this)) {
            this.close()
        }
    }
}

EmojiPicker.define()

declare global {
    interface HTMLElementTagNameMap {
        'emoji-picker':EmojiPicker;
    }
}
