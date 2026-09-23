/**
 * <emoi-input>
 *
 * Wrap a <textarea> or <input>. When the user types `:` followed by
 * two or more characters, a popover opens at the caret with matching
 * emoji. Arrow keys move, Enter/Tab insert, Escape closes.
 *
 * No shadow DOM. The list is a plain child element with class
 * `emoji-search__list`; import `index.css` alongside the component
 * and use `--emoji-search-*` custom properties for theming.
 *
 *   <emoi-input>
 *     <textarea></textarea>
 *   </emoi-input>
 *
 * Or attach to a field that lives elsewhere:
 *
 *   const el = document.querySelector('emoi-input')
 *   el.attach(document.querySelector('#chat'))
 *
 * Pass your own data (e.g. from `unicode-emoji-json` or `emojibase-data`)
 * via `el.emojis = [{ emoji: '🍕', name: 'pizza', keywords: ['food'] }]`.
 */

import { DEFAULT_EMOJIS, type EmojiEntry } from './data.js'
import { search } from './search.js'
export { EmojiPicker } from './picker.js'
export { EmojiButton } from './button.js'
export { DEFAULT_EMOJIS, type EmojiEntry } from './data.js'

export type EmojiSelectDetail = {
    emoji:EmojiEntry;
    query:string;
}
type Field = HTMLTextAreaElement|HTMLInputElement

const TRIGGER = /:([a-z0-9_+-]*)$/i

// ---------------------------------------------------------------------
// Caret position (mirror-div technique)
// ---------------------------------------------------------------------

const MIRROR_PROPS = [
    'boxSizing', 'width', 'height',
    'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderStyle',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontSizeAdjust', 'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent', 'textDecoration',
    'letterSpacing', 'wordSpacing', 'tabSize', 'whiteSpace',
    'wordWrap', 'wordBreak',
] as const

interface CaretRect { top:number; left:number; height:number }

function caretRect (field:Field, pos:number):CaretRect {
    const isTextarea = field instanceof HTMLTextAreaElement
    const cs = getComputedStyle(field)
    const mirror = document.createElement('div')
    const s = mirror.style

    for (const p of MIRROR_PROPS) {
        s[p] = cs[p]
    }
    s.position = 'absolute'
    s.visibility = 'hidden'
    s.top = '0'
    s.left = '-9999px'
    s.overflow = 'hidden'
    s.whiteSpace = isTextarea ? 'pre-wrap' : 'pre'
    if (isTextarea) s.wordWrap = 'break-word'

    const before = field.value.slice(0, pos)
    mirror.textContent = isTextarea ? before : before.replace(/\s/g, '\u00a0')

    const marker = document.createElement('span')
    marker.textContent = field.value.slice(pos) || '.'
    mirror.appendChild(marker)
    document.body.appendChild(mirror)

    const rect = field.getBoundingClientRect()
    const borderTop = parseFloat(cs.borderTopWidth) || 0
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0
    const lineHeight = parseFloat(cs.lineHeight) || marker.offsetHeight

    const out = {
        top:rect.top + borderTop + marker.offsetTop - field.scrollTop,
        left:rect.left + borderLeft + marker.offsetLeft - field.scrollLeft,
        height:lineHeight,
    }
    mirror.remove()
    return out
}

// ---------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------

export class EmojiInput extends HTMLElement {
    static TAG = 'emoi-input'

    static define (tag = EmojiInput.TAG):void {
        if (!customElements.get(tag)) {
            customElements.define(tag, EmojiInput)
        }
    }

    static render (el:EmojiInput):void {
        const list = document.createElement('div')
        list.className = 'emoji-search__list'
        list.setAttribute('popover', 'manual')
        list.setAttribute('role', 'listbox')
        list.id = `${el.uid}-list`
        el.list = list

        list.addEventListener(
            'pointerdown',
            ev => ev.preventDefault(),
        )
        list.addEventListener('click', ev => {
            const row = (ev.target as HTMLElement)
                .closest<HTMLElement>(
                    '.emoji-search__item'
                )
            if (!row) return
            el.index = Number(row.dataset.index)
            el.commit()
        })
        list.addEventListener('pointermove', ev => {
            const row = (ev.target as HTMLElement)
                .closest<HTMLElement>(
                    '.emoji-search__item'
                )
            if (!row) return
            const i = Number(row.dataset.index)
            if (i !== el.index) {
                el.index = i
                el.paintSelection()
            }
        })
    }

    /** Emoji dataset. Replace with a full list if you like. */
    emojis:EmojiEntry[] = DEFAULT_EMOJIS
    /** Characters after `:` before the popover opens. */
    minChars = 2
    /** Max rows to show. */
    maxResults = 8

    private field:Field|null = null
    private list!:HTMLElement
    private results:EmojiEntry[] = []
    private index = 0
    private query = ''
    private range:{ start:number; end:number }|null = null
    private observer:MutationObserver|null = null

    private uid =
        `emoji-search-${Math.random().toString(36).slice(2, 8)}`

    connectedCallback ():void {
        const root = this.getRootNode() as Document|ShadowRoot
        if (!this.list) EmojiInput.render(this)
        if (!this.list.isConnected) this.append(this.list)

        const forId = this.getAttribute('for')
        if (forId) {
            const target = root.getElementById(forId)
            if (target) this.attach(target as Field)
        } else {
            this.attachSlotted()
            this.observer = new MutationObserver(() => {
                if (!this.field) this.attachSlotted()
            })
            this.observer.observe(this, { childList:true, subtree:true })
        }
    }

    disconnectedCallback ():void {
        this.detach()
        this.observer?.disconnect()
    }

    /** Hook up a textarea or text input. */
    attach (field:Field):void {
        this.detach()
        this.field = field
        field.addEventListener('input', this.onInput)
        ;(field as HTMLElement).addEventListener('keydown', this.onKeydown)
        field.addEventListener('blur', this.close)
        field.addEventListener('scroll', this.reposition)
        field.setAttribute('aria-autocomplete', 'list')
        window.addEventListener('resize', this.reposition)
        window.addEventListener('scroll', this.reposition, true)
    }

    detach ():void {
        if (!this.field) return
        this.close()
        const f = this.field
        f.removeEventListener('input', this.onInput)
        ;(f as HTMLElement).removeEventListener('keydown', this.onKeydown)
        f.removeEventListener('blur', this.close)
        f.removeEventListener('scroll', this.reposition)
        window.removeEventListener('resize', this.reposition)
        window.removeEventListener('scroll', this.reposition, true)
        this.field = null
    }

    get isOpen ():boolean {
        return this.list.matches(':popover-open')
    }

    close = ():void => {
        if (this.isOpen) this.list.hidePopover()
        this.results = []
        this.range = null
        this.field?.removeAttribute('aria-activedescendant')
        this.field?.removeAttribute('aria-controls')
    }

    // -- private -------------------------------------------------------

    private attachSlotted ():void {
        const f = this.querySelector<Field>(
            ':scope > textarea, :scope > input, textarea, input',
        )
        if (f) this.attach(f)
    }

    private onInput = ():void => {
        const f = this.field
        if (!f) return
        const pos = f.selectionStart ?? f.value.length
        const before = f.value.slice(0, pos)
        const m = TRIGGER.exec(before)

        if (!m || m[1].length < this.minChars) {
            this.close()
            return
        }

        // don't trigger inside a word like "http://foo"
        const prev = before[m.index - 1]
        if (prev && /[^\s([{]/.test(prev)) {
            this.close()
            return
        }

        this.query = m[1]
        this.range = { start:m.index, end:pos }
        this.results = search(this.emojis, this.query, this.maxResults)
        this.index = 0
        this.render()
        this.open()
    }

    private onKeydown = (ev:KeyboardEvent):void => {
        if (!this.isOpen) return
        switch (ev.key) {
            case 'ArrowDown':
                ev.preventDefault()
                this.move(1)
                break
            case 'ArrowUp':
                ev.preventDefault()
                this.move(-1)
                break
            case 'Enter':
            case 'Tab':
                if (this.results.length) {
                    ev.preventDefault()
                    this.commit()
                }
                break
            case 'Escape':
                ev.preventDefault()
                this.close()
                break
        }
    }

    private move (delta:number):void {
        const n = this.results.length
        if (!n) return
        this.index = (this.index + delta + n) % n
        this.paintSelection()
    }

    private commit ():void {
        const f = this.field
        const chosen = this.results[this.index]
        const r = this.range
        if (!f || !chosen || !r) return

        const insert = chosen.emoji + ' '
        f.setRangeText(insert, r.start, r.end, 'end')
        const query = this.query
        this.close()
        f.dispatchEvent(new InputEvent('input', {
            bubbles:true,
            inputType:'insertText',
            data:insert,
        }))
        this.dispatchEvent(new CustomEvent<EmojiSelectDetail>('emoji-select', {
            bubbles:true,
            composed:true,
            detail:{ emoji:chosen, query },
        }))
    }

    private render ():void {
        const list = this.list
        list.replaceChildren()
        if (!this.results.length) {
            const empty = document.createElement('div')
            empty.className = 'emoji-search__empty'
            empty.textContent = `No emoji matching :${this.query}`
            list.append(empty)
            return
        }
        const q = this.query.toLowerCase()
        this.results.forEach((e, i) => {
            const row = document.createElement('div')
            row.className = 'emoji-search__item'
            row.setAttribute('role', 'option')
            row.id = `${this.uid}-opt-${i}`
            row.dataset.index = String(i)

            const glyph = document.createElement('span')
            glyph.className = 'emoji-search__glyph'
            glyph.textContent = e.emoji

            const name = document.createElement('span')
            name.className = 'emoji-search__name'
            const at = e.name.toLowerCase().indexOf(q)
            if (at >= 0) {
                name.append(
                    ':' + e.name.slice(0, at),
                    Object.assign(document.createElement('b'), {
                        textContent:e.name.slice(at, at + q.length),
                    }),
                    e.name.slice(at + q.length) + ':',
                )
            } else {
                name.textContent = `:${e.name}:`
            }

            row.append(glyph, name)
            list.append(row)
        })
        this.paintSelection()
    }

    private paintSelection ():void {
        const rows = this.list.querySelectorAll<HTMLElement>('.emoji-search__item')
        rows.forEach((row, i) => {
            row.setAttribute('aria-selected', String(i === this.index))
        })
        rows[this.index]?.scrollIntoView({ block:'nearest' })
        this.field?.setAttribute(
            'aria-activedescendant',
            `${this.uid}-opt-${this.index}`,
        )
    }

    private open ():void {
        if (!this.isOpen) this.list.showPopover()
        this.field?.setAttribute('aria-controls', this.list.id)
        this.reposition()
    }

    private reposition = ():void => {
        const f = this.field
        if (!f || !this.isOpen || !this.range) return
        const caret = caretRect(f, this.range.start)
        const box = this.list.getBoundingClientRect()
        const gap = 4
        const vw = document.documentElement.clientWidth
        const vh = document.documentElement.clientHeight

        let left = caret.left
        let top = caret.top + caret.height + gap
        if (left + box.width > vw - gap) left = Math.max(gap, vw - box.width - gap)
        if (top + box.height > vh - gap) {
            top = Math.max(gap, caret.top - box.height - gap)
        }
        this.list.style.left = `${Math.round(left)}px`
        this.list.style.top = `${Math.round(top)}px`
    }
}

EmojiInput.define()

declare global {
    interface HTMLElementTagNameMap {
        'emoi-input':EmojiInput;
    }
    interface HTMLElementEventMap {
        'emoji-select':CustomEvent<EmojiSelectDetail>;
    }
}
