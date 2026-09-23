import { DEFAULT_EMOJIS, type EmojiEntry } from './data.js'
import { search } from './search.js'
import { placePopover } from './placement.js'

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

const Base = typeof HTMLElement !== 'undefined' ?
    HTMLElement :
    class {} as unknown as typeof HTMLElement

export class EmojiPicker extends Base {
    static TAG = 'emoji-picker'
    static observedAttributes = [
        'inline',
        'recent-key',
        'skin-tone-key',
    ]

    static define (tag = EmojiPicker.TAG):void {
        if (typeof window === 'undefined' || !window.customElements) return
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
    private status!:HTMLDivElement
    private statusTimer:ReturnType<typeof setTimeout>|null = null
    private category = 'recent'
    private query = ''
    private opened = false
    private recentNames:Array<string> = []
    private skinTone = 0
    private uid = `emoji-picker-${
        Math.random().toString(36).slice(2, 8)
    }`

    private triggerElement:HTMLElement|null = null
    private anchorElement:HTMLElement|null = null

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
        el.panel.setAttribute('popover', 'auto')

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
        el.searchInput.setAttribute(
            'aria-controls',
            `${el.uid}-grid`,
        )
        el.searchInput.addEventListener('input', () => {
            el.query = el.searchInput.value.trim()
            el.renderGrid()
            el.scheduleStatusUpdate()
        })

        el.tones = document.createElement('div')
        el.tones.className = 'emoji-picker-tones'
        el.tones.setAttribute('role', 'radiogroup')
        el.tones.setAttribute('aria-label', 'Skin tone')

        el.grid = document.createElement('div')
        el.grid.className = 'emoji-picker-grid'
        el.grid.id = `${el.uid}-grid`
        el.grid.setAttribute('role', 'grid')
        el.grid.setAttribute('aria-label', 'Emoji')

        el.preview = document.createElement('div')
        el.preview.className = 'emoji-picker-preview'
        el.preview.setAttribute('aria-hidden', 'true')

        el.status = document.createElement('div')
        el.status.className = 'emoji-picker-status'
        el.status.setAttribute('role', 'status')
        el.status.setAttribute('aria-live', 'polite')

        el.panel.append(
            el.tabs,
            el.searchInput,
            el.tones,
            el.grid,
            el.preview,
            el.status,
        )
        el.addEventListener('keydown', el.onKeydown)
        el.tabs.addEventListener('keydown', el.onTabKeydown)
        el.tones.addEventListener('keydown', el.onToneKeydown)
        el.grid.addEventListener('mouseenter', (ev) => {
            el.onGridHoverOrFocus(ev)
        }, true)
        el.grid.addEventListener('focusin', (ev) => {
            el.onGridHoverOrFocus(ev)
        })
        el.grid.addEventListener('click', (ev) => {
            const btn = (ev.target as HTMLElement)
                .closest<HTMLButtonElement>(
                    '[role="gridcell"] button'
                )
            if (btn) el.focusCell(btn)
        })
        el.panel.addEventListener('toggle', el.onPanelToggle)
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
    }

    disconnectedCallback ():void {
        this.detachPositionListeners()
        if (this.panel.matches(':popover-open')) {
            this.panel.hidePopover()
        }
        this.panel.hidden = true
        this.opened = false
        this.anchorElement = null
        this.triggerElement = null
    }

    attributeChangedCallback (name:string):void {
        this.syncMode()
        if (name === 'recent-key') this.loadRecents()
        if (name === 'skin-tone-key') this.loadSkinTone()
        this.renderTones()
        this.renderGrid()
    }

    open (anchor?:HTMLElement):void {
        if (this.hasAttribute('inline')) {
            this.searchInput.focus({ preventScroll:true })
            return
        }
        const el = document.activeElement
        this.triggerElement =
            el instanceof HTMLElement ? el : null
        this.anchorElement = anchor ?? null
        this.panel.hidden = false
        if (typeof this.panel.showPopover === 'function') {
            this.panel.showPopover()
        }
        if (anchor && !this.hasAttribute('inline')) {
            this.reposition()
        }
        this.opened = true
        if (!this.hasAttribute('inline')) {
            this.attachPositionListeners()
        }
        this.searchInput.focus({ preventScroll:true })
    }

    close ():void {
        if (this.hasAttribute('inline')) return
        this.detachPositionListeners()
        const restoreFocus = this.triggerElement
            && this.panel.contains(document.activeElement)
        if (this.panel.matches(':popover-open')) {
            this.panel.hidePopover()
        }
        this.panel.hidden = true
        this.opened = false
        this.anchorElement = null
        if (restoreFocus) {
            this.triggerElement!.focus()
        }
        this.triggerElement = null
    }

    private renderTabs ():void {
        this.tabs.replaceChildren()
        const tabs = [RECENTS, ...CATEGORIES]
        for (const category of tabs) {
            const tab = document.createElement('button')
            tab.type = 'button'
            tab.className = 'emoji-picker-tab'
            tab.id = `${this.uid}-tab-${category.id}`
            tab.setAttribute('role', 'tab')
            tab.setAttribute('aria-label', category.label)
            tab.setAttribute(
                'aria-selected',
                String(category.id === this.category),
            )
            tab.tabIndex = category.id === this.category ?
                0 : -1
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
            this.panel.hidden = false
            this.opened = true
        } else {
            this.panel.setAttribute('popover', 'auto')
            this.panel.hidden = true
            this.opened = false
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

        const cols = 8
        let row:HTMLDivElement|null = null
        for (let i = 0; i < emojis.length; i++) {
            if (i % cols === 0) {
                row = document.createElement('div')
                row.setAttribute('role', 'row')
                row.className = 'emoji-picker-row'
                this.grid.append(row)
            }
            const emoji = emojis[i]!
            const displayed = this.withSelectedTone(emoji)
            const cell = document.createElement('div')
            cell.setAttribute('role', 'gridcell')
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'emoji-picker-emoji'
            button.setAttribute(
                'aria-label', displayed.label ?? displayed.name
            )
            button.textContent = displayed.emoji
            button.tabIndex = i === 0 ? 0 : -1
            button.dataset.emojiName = emoji.name
            button.addEventListener(
                'click', () => this.select(displayed)
            )
            cell.append(button)
            row!.append(cell)
        }
    }

    private onGridHoverOrFocus (ev:Event):void {
        const btn = (ev.target as HTMLElement)
            .closest<HTMLButtonElement>(
                '[role="gridcell"] button'
            )
        if (!btn) return
        const name = btn.dataset.emojiName
        const entry = this.data.find(
            e => e.name === name
        )
        if (entry) {
            this.showPreview(
                this.withSelectedTone(entry)
            )
        }
    }

    private select (emoji:EmojiEntry):void {
        const query = this.query
        this.addRecent(emoji)
        const field = this.targetField
        const trigger = this.triggerElement
        if (field) {
            const start = field.selectionStart
                ?? field.value.length
            const end = field.selectionEnd ?? start
            field.setRangeText(
                emoji.emoji, start, end, 'end'
            )
            field.dispatchEvent(new InputEvent('input', {
                bubbles:true,
                inputType:'insertText',
                data:emoji.emoji,
            }))
        }
        const isInline = this.hasAttribute('inline')
        if (!isInline) {
            if (this.panel.matches(':popover-open')) {
                this.panel.hidePopover()
            }
            this.panel.hidden = true
            this.opened = false
            this.triggerElement = null
        }
        if (field) {
            field.focus()
        } else if (!isInline && trigger) {
            trigger.focus()
        }
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

    private scheduleStatusUpdate ():void {
        if (this.statusTimer !== null) {
            clearTimeout(this.statusTimer)
        }
        if (!this.query) {
            this.status.textContent = ''
            return
        }
        this.statusTimer = setTimeout(() => {
            const count = this.grid.querySelectorAll(
                '[role="gridcell"]'
            ).length
            this.status.textContent = `${count} results`
            this.statusTimer = null
        }, 150)
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
            if (this.hasAttribute('inline')) {
                this.query = ''
                this.searchInput.value = ''
                this.renderGrid()
                this.searchInput.focus()
            } else {
                this.close()
            }
            return
        }

        const target = event.target as HTMLElement|null

        if (target?.closest('[role="tab"]')) {
            return
        }

        if (target?.closest('[role="radio"]')) {
            return
        }

        if (target === this.searchInput) {
            this.onSearchKeydown(event)
            return
        }

        if (target?.closest('[role="gridcell"]')
            || target?.closest('[role="grid"]')) {
            this.onGridKeydown(event)
        }
    }

    private onSearchKeydown (event:KeyboardEvent):void {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            const btn = this.grid.querySelector<HTMLButtonElement>(
                '[role="gridcell"] button'
            )
            if (btn) this.focusCell(btn)
            return
        }

        if (event.key === 'Enter') {
            const query = this.searchInput.value.trim()
            if (!query) return
            const btn = this.grid.querySelector<HTMLButtonElement>(
                '[role="gridcell"] button'
            )
            btn?.click()
        }
    }

    private onGridKeydown (event:KeyboardEvent):void {
        const buttons = Array.from(
            this.grid.querySelectorAll<HTMLButtonElement>(
                '[role="gridcell"] button'
            )
        )
        if (!buttons.length) return

        const active = document.activeElement
        const current = Math.max(0, buttons.indexOf(
            active as HTMLButtonElement
        ))

        const currentBtn = buttons[current]!
        const row = currentBtn.closest('[role="row"]')
        const rowCells = row ?
            Array.from(row.querySelectorAll<HTMLButtonElement>(
                '[role="gridcell"] button'
            )) :
            buttons
        const colIndex = rowCells.indexOf(currentBtn)
        const cols = rowCells.length

        let next = -1
        if (event.key === 'ArrowRight') {
            next = current + 1 < buttons.length ?
                current + 1 : current
        } else if (event.key === 'ArrowLeft') {
            next = current - 1 >= 0 ?
                current - 1 : current
        } else if (event.key === 'ArrowDown') {
            const target = current + cols
            next = target < buttons.length ?
                target : current
        } else if (event.key === 'ArrowUp') {
            const target = current - cols
            next = target >= 0 ?
                target : current
        } else if (event.key === 'Home') {
            next = current - colIndex
        } else if (event.key === 'End') {
            next = current - colIndex + rowCells.length - 1
        } else if (
            event.key === 'Enter' || event.key === ' '
        ) {
            currentBtn.click()
            return
        }

        if (next >= 0 && next !== current) {
            event.preventDefault()
            this.focusCell(buttons[next]!)
        }
    }

    private focusCell (button:HTMLButtonElement):void {
        const prev = this.grid.querySelector<HTMLButtonElement>(
            '[role="gridcell"] button[tabindex="0"]'
        )
        if (prev) prev.tabIndex = -1
        button.tabIndex = 0
        button.focus()
    }

    private onTabKeydown = (event:KeyboardEvent):void => {
        const tabs = Array.from(
            this.tabs.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]'
            )
        )
        const current = tabs.indexOf(
            document.activeElement as HTMLButtonElement
        )
        if (current === -1) return

        let next = -1
        if (event.key === 'ArrowRight') {
            next = (current + 1) % tabs.length
        } else if (event.key === 'ArrowLeft') {
            next = (current - 1 + tabs.length)
                % tabs.length
        } else if (event.key === 'Home') {
            next = 0
        } else if (event.key === 'End') {
            next = tabs.length - 1
        }

        if (next < 0) return
        event.preventDefault()
        event.stopPropagation()
        const allCategories = [RECENTS, ...CATEGORIES]
        this.category = allCategories[next]!.id
        this.renderTabs()
        this.renderGrid()
        this.tabs.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]'
        )[next]?.focus()
    }

    private onToneKeydown = (event:KeyboardEvent):void => {
        const radios = Array.from(
            this.tones.querySelectorAll<HTMLButtonElement>(
                '[role="radio"]'
            )
        )
        const current = radios.indexOf(
            document.activeElement as HTMLButtonElement
        )
        if (current === -1) return

        let next = -1
        if (event.key === 'ArrowRight') {
            next = (current + 1) % radios.length
        } else if (event.key === 'ArrowLeft') {
            next = (current - 1 + radios.length)
                % radios.length
        }

        if (next < 0) return
        event.preventDefault()
        event.stopPropagation()
        this.skinTone = next
        this.writeSkinTone()
        this.renderTones()
        this.renderGrid()
        this.tones.querySelectorAll<HTMLButtonElement>(
            '[role="radio"]'
        )[next]?.focus()
    }

    private reposition ():void {
        if (!this.anchorElement) return
        const anchor = this.anchorElement.getBoundingClientRect()
        const pos = placePopover(
            {
                top:anchor.top,
                left:anchor.left,
                height:anchor.height,
            },
            {
                width:this.panel.offsetWidth,
                height:this.panel.offsetHeight,
            },
            {
                width:window.innerWidth,
                height:window.innerHeight,
            },
            4,
        )
        this.panel.style.top = `${pos.top}px`
        this.panel.style.left = `${pos.left}px`
    }

    private onReposition = ():void => {
        this.reposition()
    }

    private attachPositionListeners ():void {
        window.addEventListener('resize', this.onReposition)
        window.addEventListener(
            'scroll', this.onReposition, true
        )
    }

    private detachPositionListeners ():void {
        window.removeEventListener(
            'resize', this.onReposition
        )
        window.removeEventListener(
            'scroll', this.onReposition, true
        )
    }

    private onPanelToggle = (event:Event):void => {
        const te = event as ToggleEvent
        if (te.newState === 'closed') {
            this.detachPositionListeners()
            this.panel.hidden = true
            this.opened = false
            this.anchorElement = null
            this.triggerElement = null
        }
    }
}

EmojiPicker.define()

declare global {
    interface HTMLElementTagNameMap {
        'emoji-picker':EmojiPicker;
    }
}
