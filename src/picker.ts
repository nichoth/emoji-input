import { DEFAULT_EMOJIS, type EmojiEntry } from './data.js'
import { search } from './search.js'

export { EmojiButton } from './button.js'

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
        if (!window || !window.customElements) return
        const customElements = window.customElements
        if (!customElements.get(tag)) customElements.define(tag, EmojiPicker)
    }

    private data:Array<EmojiEntry> = DEFAULT_EMOJIS
    private panel!:HTMLDivElement
    private tabs!:HTMLDivElement
    private searchInput!:HTMLInputElement
    private grid!:HTMLDivElement
    private tones!:HTMLDivElement
    private preview!:HTMLDivElement
    private category = 'recent'
    private query = ''
    private opened = false
    private recentNames:Array<string> = []
    private skinTone = 0

    get recentKey ():string {
        return this.getAttribute('recent-key')
            ?? DEFAULT_RECENT_KEY
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

    static render (el:EmojiPicker):void {
        el.panel = document.createElement('div')
        el.panel.className = 'emoji-picker-panel'
        el.panel.setAttribute('popover', 'manual')

        el.tabs = document.createElement('div')
        el.tabs.className = 'emoji-picker-tabs'
        el.tabs.setAttribute('role', 'tablist')

        el.searchInput = document.createElement('input')
        el.searchInput.className = 'emoji-picker-search'
        el.searchInput.type = 'search'
        el.searchInput.placeholder = 'Search emoji'
        el.searchInput.setAttribute(
            'aria-label',
            'Search emoji',
        )
        el.searchInput.addEventListener('input', () => {
            el.query = el.searchInput.value
            el.renderGrid()
        })

        el.tones = document.createElement('div')
        el.tones.className = 'emoji-picker-tones'
        el.tones.setAttribute('role', 'radiogroup')
        el.tones.setAttribute('aria-label', 'Skin tone')

        el.grid = document.createElement('div')
        el.grid.className = 'emoji-picker-grid'
        el.grid.setAttribute('role', 'grid')

        el.preview = document.createElement('div')
        el.preview.className = 'emoji-picker-preview'
        el.preview.setAttribute('role', 'status')
        el.preview.setAttribute('aria-live', 'polite')

        el.panel.append(
            el.tabs,
            el.searchInput,
            el.tones,
            el.grid,
            el.preview,
        )
        el.addEventListener('keydown', el.onKeydown)
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
        if (!this.panel) EmojiPicker.render(this)
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
            tab.className = 'emoji-picker-tab'
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
        if (!this.panel) return
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
            empty.className = 'emoji-picker-empty'
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
            button.className = 'emoji-picker-emoji'
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
            button.className = 'emoji-picker-tone'
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
        glyph.className = 'emoji-picker-preview-glyph'
        glyph.textContent = emoji.emoji

        const name = document.createElement('span')
        name.className = 'emoji-picker-preview-name'
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
