import { test } from '@substrate-system/tapzero'
import { sleep } from '@substrate-system/dom'
import {
    EmojiInput,
    EmojiButton as MainEmojiButton,
    EmojiPicker as MainEmojiPicker,
    DEFAULT_EMOJIS,
    type EmojiEntry,
    type EmojiSelectDetail,
} from '../src/index.js'
import { EmojiPicker } from '../src/picker.js'
import { EmojiButton } from '../src/button.js'
import { search } from '../src/search.js'
import packageJson from '../package.json'
import '../src/button.css'
import '../src/picker.css'

// -- Helpers ---------------------------------------------------

const SMALL_SET:EmojiEntry[] = [
    {
        emoji:'😀',
        name:'grinning',
        keywords:['smile', 'happy'],
    },
    {
        emoji:'😃',
        name:'smiley',
        keywords:['smile', 'happy'],
    },
    {
        emoji:'😄',
        name:'smile',
        keywords:['happy', 'laugh'],
    },
    {
        emoji:'🍕',
        name:'pizza',
        keywords:['food'],
    },
    {
        emoji:'🍔',
        name:'hamburger',
        keywords:['burger', 'food'],
    },
    {
        emoji:'🔥',
        name:'fire',
        keywords:['lit', 'hot'],
    },
    {
        emoji:'🐱',
        name:'cat',
        keywords:['kitty'],
    },
    {
        emoji:'🐶',
        name:'dog',
        keywords:['puppy'],
    },
]

// -- Data structure --------------------------------------------

test('DEFAULT_EMOJIS has expected structure', t => {
    t.ok(
        DEFAULT_EMOJIS.length >= 1800,
        'contains the complete emoji-mart set'
    )

    const first = DEFAULT_EMOJIS[0]
    t.equal(
        typeof first.emoji, 'string',
        'emoji field is a string'
    )
    t.equal(
        typeof first.name, 'string',
        'name field is a string'
    )
    t.ok(
        Array.isArray(first.keywords),
        'keywords is an array'
    )
})

test('DEFAULT_EMOJIS includes category and skin data', t => {
    const butter = DEFAULT_EMOJIS.find(
        emoji => emoji.name === 'butter'
    )

    t.ok(butter, 'includes butter')
    t.equal(butter?.emoji, '🧈', 'uses the native butter glyph')
    t.ok(butter?.category, 'includes a category')
    t.ok(Array.isArray(butter?.categories), 'includes categories')

    const wave = DEFAULT_EMOJIS.find(
        emoji => emoji.name === 'wave'
    )
    t.equal(wave?.skins?.length, 6, 'includes skin tone variants')
    t.equal(wave?.skins?.[5]?.native, '👋🏿', 'keeps variant glyphs')
})

test('DEFAULT_EMOJIS entries all have emoji and name', t => {
    const invalid = DEFAULT_EMOJIS.filter(
        e => !e.emoji || !e.name
    )
    t.equal(
        invalid.length, 0,
        'no entries missing emoji or name'
    )
})

test('shared search ranks name prefixes before substrings', t => {
    const emojis:EmojiEntry[] = [
        { emoji:'1', name:'pineapple', keywords:[] },
        { emoji:'2', name:'apple', keywords:[] },
        { emoji:'3', name:'grape', keywords:[] },
    ]

    const results = search(emojis, 'app', 8)
    t.equal(
        JSON.stringify(results.map(emoji => emoji.name)),
        JSON.stringify(['apple', 'pineapple']),
        'prefix matches rank before substring matches'
    )
})

test('shared search ranks keyword prefixes after name matches', t => {
    const emojis:EmojiEntry[] = [
        { emoji:'1', name:'grape', keywords:['apple'] },
        { emoji:'2', name:'pineapple', keywords:[] },
        { emoji:'3', name:'fruit', keywords:['appetizer'] },
    ]

    const results = search(emojis, 'app', 8)
    t.equal(
        JSON.stringify(results.map(emoji => emoji.name)),
        JSON.stringify(['pineapple', 'grape', 'fruit']),
        'keyword prefix matches rank after name matches'
    )
})

// -- Registration and setup ------------------------------------

test('custom element is registered', t => {
    const ctor = customElements.get('emoji-search')
    t.ok(ctor, 'emoji-search tag is defined')
    t.equal(ctor, EmojiInput, 'maps to EmojiInput class')
})

test('emoji-picker custom element is registered', t => {
    const ctor = customElements.get('emoji-picker')
    t.ok(ctor, 'emoji-picker tag is defined')
    t.equal(ctor, EmojiPicker, 'maps to EmojiPicker class')

    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    t.ok(picker.emojis.length > 0, 'has default emoji data')
    t.ok(!picker.isOpen, 'starts closed')
    picker.remove()
})

test('emoji-button custom element renders an accessible smiley button', t => {
    const ctor = customElements.get('emoji-button')
    t.ok(ctor, 'emoji-button tag is defined')
    t.equal(ctor, EmojiButton, 'maps to EmojiButton class')

    const button = document.createElement('emoji-button')
    document.body.appendChild(button)
    const inner = button.querySelector('button')
    t.ok(inner, 'renders a native button')
    t.equal(inner?.type, 'button', 'button does not submit forms')
    t.ok(inner?.querySelector('svg'), 'renders the smiley SVG inline')
    button.remove()
})

test('emoji-button uses currentColor and supports color override', t => {
    const button = document.createElement('emoji-button')
    button.style.setProperty('--emoji-button-color', 'rgb(18, 52, 86)')
    document.body.appendChild(button)

    const svg = button.querySelector('svg')
    const inner = button.querySelector('button')
    t.equal(
        svg?.getAttribute('fill'),
        'currentColor',
        'the SVG inherits its fill from currentColor'
    )
    t.equal(
        getComputedStyle(inner as Element).color,
        'rgb(18, 52, 86)',
        'the custom property overrides the icon color'
    )
    button.remove()
})

test('emoji-button opens the picker named by for', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.id = 'button-picker-target'
    let opens = 0
    picker.open = () => { opens++ }

    const button = document.createElement('emoji-button')
    button.setAttribute('for', picker.id)
    document.body.append(picker, button)
    button.querySelector('button')?.click()

    t.equal(opens, 1, 'click calls the referenced picker open method')
    button.remove()
    picker.remove()
})

test('emoji-button positions the picker below itself', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.id = 'position-test-picker'
    picker.setAttribute('for', 'position-target')

    const wrapper = document.createElement('div')
    wrapper.style.position = 'relative'
    wrapper.style.marginTop = '120px'
    wrapper.style.marginLeft = '200px'

    const button = document.createElement('emoji-button') as EmojiButton
    button.setAttribute('for', picker.id)

    wrapper.append(button, picker)
    document.body.append(wrapper)

    button.querySelector('button')?.click()
    t.ok(picker.isOpen, 'picker opens')

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    const panel = picker.querySelector(
        '.emoji-picker__panel'
    ) as HTMLElement
    const btnRect = button.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()

    t.ok(
        panelRect.top >= btnRect.bottom - 1,
        'picker top is at or below the button bottom'
    )
    t.ok(
        Math.abs(panelRect.left - btnRect.left) < 2,
        'picker left aligns with the button left'
    )

    picker.close()
    picker.remove()
    wrapper.remove()
})

test('button subpath exports only EmojiButton', t => {
    const buttonExports = packageJson.exports['./button'] as {
        import:string;
        require:string;
    }|undefined
    t.ok(buttonExports, 'button subpath is declared')
    t.equal(
        buttonExports?.import,
        './dist/button.js',
        'button import subpath points to the ESM build'
    )
    t.equal(
        buttonExports?.require,
        './dist/button.cjs',
        'button require subpath points to the CommonJS build'
    )
})

test('main entrypoint exports all component classes', t => {
    t.equal(
        MainEmojiPicker,
        EmojiPicker,
        'main entrypoint exports EmojiPicker'
    )
    t.equal(
        MainEmojiButton,
        EmojiButton,
        'main entrypoint exports EmojiButton'
    )
    t.equal(
        EmojiInput,
        customElements.get('emoji-search'),
        'main entrypoint exports EmojiInput'
    )
})

test('emoji-picker defaults to the recently used tab', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)

    const tabs = picker.querySelectorAll('[role="tab"]')
    const recentsTab = tabs[0]
    t.equal(
        recentsTab?.getAttribute('aria-selected'),
        'true',
        'recently used tab is selected by default'
    )
    const peopleTab = tabs[1]
    t.equal(
        peopleTab?.getAttribute('aria-selected'),
        'false',
        'people tab is not selected by default'
    )
    picker.remove()
})

test('emoji-picker renders category tabs and an eight-column grid', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const tabs = picker.querySelectorAll('[role="tab"]')
    t.equal(tabs.length, 9, 'has recents and eight category tabs')
    t.equal(
        tabs[0]?.getAttribute('aria-label'),
        'Recently used',
        'recents is the first tab'
    )
    t.equal(
        tabs[1]?.getAttribute('aria-label'),
        'People',
        'people is the first emoji category'
    )

    const grid = picker.querySelector('[role="grid"]')
    t.ok(grid, 'renders an emoji grid')
    t.equal(
        getComputedStyle(grid as Element).gridTemplateColumns
            .split(' ').length,
        8,
        'grid has eight columns'
    )

    const natureTab = picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Nature"]'
    )
    natureTab?.click()
    t.ok(
        grid?.textContent?.includes('🐒'),
        'category tab filters the grid'
    )
    picker.remove()
})

test('emoji-picker stays open when switching categories', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    t.ok(picker.isOpen, 'picker is open before tab click')

    const natureTab = picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Nature"]'
    )
    natureTab?.click()
    t.ok(
        picker.isOpen,
        'picker stays open after clicking a category tab'
    )
    picker.close()
    picker.remove()
})

test('emoji-picker grid constrains its height', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const grid = picker.querySelector<HTMLElement>('[role="grid"]')
    t.ok(grid, 'grid exists')
    const style = getComputedStyle(grid as Element)
    t.ok(
        style.overflowY === 'auto' || style.overflowY === 'scroll',
        'grid has scrollable overflow'
    )
    picker.close()
    picker.remove()
})

test('emoji-picker search filters visible emoji', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )
    t.ok(input, 'renders a search input')
    if (input) {
        input.value = 'butter'
        input.dispatchEvent(new InputEvent('input', { bubbles:true }))
    }

    const grid = picker.querySelector('[role="grid"]')
    t.ok(grid?.textContent?.includes('🧈'), 'shows the matching emoji')
    t.ok(
        !grid?.textContent?.includes('😀'),
        'hides emoji that do not match the query'
    )
    picker.remove()
})

test('emoji-picker emits emoji-select and closes after selection', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )
    if (input) {
        input.value = 'butter'
        input.dispatchEvent(new InputEvent('input', { bubbles:true }))
    }

    const details:Array<EmojiSelectDetail> = []
    picker.addEventListener('emoji-select', (event) => {
        details.push((event as CustomEvent<EmojiSelectDetail>).detail)
    })
    const emoji = Array.from(
        picker.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
    ).find(button => button.textContent === '🧈')
    emoji?.click()

    const detail = details[0]
    t.ok(detail, 'emits selection detail')
    if (detail) {
        t.equal(detail.emoji.name, 'butter', 'emits the selected emoji')
        t.equal(detail.query, 'butter', 'emits the current search query')
    }
    t.ok(!picker.isOpen, 'closes after selecting an emoji')
    picker.remove()
})

test('emoji-picker supports keyboard grid navigation and dismissal', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    const buttons = picker.querySelectorAll<HTMLButtonElement>(
        '[role="gridcell"]'
    )
    const first = buttons[0]
    first?.focus()
    if (first) keydown(first, 'ArrowRight')
    t.equal(
        document.activeElement,
        buttons[1],
        'ArrowRight moves to the next emoji'
    )
    if (buttons[1]) keydown(buttons[1], 'ArrowDown')
    t.equal(
        document.activeElement,
        buttons[9],
        'ArrowDown moves by one grid row'
    )

    let selected = false
    picker.addEventListener('emoji-select', () => { selected = true })
    if (buttons[9]) keydown(buttons[9], 'Enter')
    t.ok(selected, 'Enter selects the focused emoji')
    t.ok(!picker.isOpen, 'Enter closes the picker')

    picker.open()
    keydown(picker, 'Escape')
    t.ok(!picker.isOpen, 'Escape closes the picker')
    picker.remove()
})

test('emoji-picker closes when a popover click lands outside', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    t.ok(picker.isOpen, 'opens through the public open method')

    document.body.dispatchEvent(new MouseEvent('click', { bubbles:true }))
    t.ok(!picker.isOpen, 'outside click closes the popover')
    picker.remove()
})

test('emoji-picker inline mode stays in document flow', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    const grid = picker.querySelector('[role="grid"]')
    const panel = grid?.parentElement
    t.ok(grid, 'inline mode still renders the picker grid')
    t.ok(panel && !panel.hasAttribute('popover'),
        'inline mode removes popover behavior')
    t.equal(
        getComputedStyle(panel as Element).position,
        'static',
        'inline mode uses in-flow positioning'
    )
    picker.remove()
})

test('emoji-picker injects styles and accepts picker custom properties', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.style.setProperty('--emoji-picker-width', '400px')
    document.body.appendChild(picker)

    const panel = picker.querySelector('[role="grid"]')?.parentElement
    t.equal(
        getComputedStyle(panel as Element).width,
        '400px',
        'picker width can be themed with a custom property'
    )
    const hasPickerStyles = document.head.querySelector(
        '#emoji-picker-styles'
    )
    t.ok(hasPickerStyles, 'injects picker styles via style tag')
    picker.remove()
})

test('emoji-picker stores and restores capped recently used emoji', t => {
    const key = 'emoji-picker-test-recents'
    localStorage.removeItem(key)
    const emojis:Array<EmojiEntry> = Array.from(
        { length:25 },
        (_, index) => ({
            emoji:String.fromCodePoint(0x1f600 + index),
            name:`test-${index}`,
            keywords:[],
            category:'people',
        })
    )
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.setAttribute('recent-key', key)
    picker.emojis = emojis
    document.body.appendChild(picker)

    for (const emoji of emojis) {
        picker.open()
        picker.querySelector<HTMLElement>(
            '[role="tab"][aria-label="People"]'
        )?.click()
        const button = Array.from(
            picker.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
        ).find(item => item.textContent === emoji.emoji)
        button?.click()
    }

    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Recently used"]'
    )?.click()
    const recents = picker.querySelectorAll('[role="gridcell"]')
    t.equal(recents.length, 24, 'caps recents at 24 entries')
    t.equal(
        recents[0]?.textContent,
        emojis[24]?.emoji,
        'most recently selected emoji is first'
    )

    const duplicate = emojis[10]
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Recently used"]'
    )?.click()
    Array.from(
        picker.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')
    ).find(item => item.textContent === duplicate?.emoji)?.click()

    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Recently used"]'
    )?.click()
    t.equal(
        picker.querySelector('[role="gridcell"]')?.textContent,
        duplicate?.emoji,
        'duplicate selection moves the emoji to the front'
    )
    picker.remove()

    const restored = document.createElement('emoji-picker') as EmojiPicker
    restored.setAttribute('recent-key', key)
    restored.emojis = emojis
    document.body.appendChild(restored)
    restored.open()
    restored.querySelector<HTMLElement>(
        '[role="tab"][aria-label="Recently used"]'
    )?.click()
    t.equal(
        restored.querySelectorAll('[role="gridcell"]').length,
        24,
        'restores recents from localStorage'
    )
    restored.remove()
    localStorage.removeItem(key)
})

test('emoji-picker applies and restores a selected skin tone', t => {
    const key = 'emoji-picker-test-skin-tone'
    localStorage.removeItem(key)
    const wave = DEFAULT_EMOJIS.find(emoji => emoji.name === 'wave')
    t.ok(wave, 'has an emoji with skin tone variants')
    if (!wave) return

    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.setAttribute('skin-tone-key', key)
    picker.emojis = [wave]
    document.body.appendChild(picker)

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    const swatches = picker.querySelectorAll('[role="radio"]')
    t.equal(swatches.length, 6, 'renders six skin tone swatches')
    swatches[5]?.dispatchEvent(new MouseEvent('click', { bubbles:true }))
    const waveButton = picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"]'
    )
    t.equal(waveButton?.textContent, '👋🏿', 'uses the selected skin tone')

    let selected = ''
    picker.addEventListener('emoji-select', (event) => {
        selected = (event as CustomEvent<EmojiSelectDetail>)
            .detail.emoji.emoji
    })
    waveButton?.click()
    t.equal(selected, '👋🏿', 'emits the selected skin tone variant')
    picker.remove()

    const restored = document.createElement('emoji-picker') as EmojiPicker
    restored.setAttribute('skin-tone-key', key)
    restored.emojis = [wave]
    document.body.appendChild(restored)
    restored.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    t.equal(
        restored.querySelector('[role="gridcell"]')?.textContent,
        '👋🏿',
        'restores the skin tone from localStorage'
    )
    restored.remove()
    localStorage.removeItem(key)
})

test('emoji-picker updates its preview when an emoji is hovered', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.appendChild(picker)

    const button = picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"]'
    )
    const preview = picker.querySelector('[role="status"]')
    t.ok(preview, 'renders a preview region')
    button?.dispatchEvent(new MouseEvent('mouseenter', { bubbles:true }))
    t.ok(
        preview?.textContent?.includes('🧈'),
        'preview shows the hovered emoji'
    )
    t.ok(
        preview?.textContent?.includes('butter'),
        'preview shows the hovered emoji name'
    )
    picker.remove()
})

test('emoji-picker inserts into the field named by for', t => {
    const field = document.createElement('textarea')
    field.id = 'emoji-picker-target'
    field.value = 'hello world'
    field.setSelectionRange(6, 6)
    document.body.appendChild(field)

    const picker = document.createElement('emoji-picker') as EmojiPicker
    picker.setAttribute('for', field.id)
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLButtonElement>('[role="gridcell"]')?.click()

    t.equal(
        field.value,
        'hello 🧈world',
        'inserts the selected emoji at the field caret'
    )
    picker.remove()
    field.remove()
})

test('element has correct defaults', t => {
    const { el } = setup()
    t.equal(el.minChars, 2, 'minChars defaults to 2')
    t.equal(el.maxResults, 8, 'maxResults defaults to 8')
    t.ok(el.emojis.length > 0, 'has default emoji data')
    el.remove()
})

test('auto-attaches to child textarea', t => {
    const { el, textarea } = setup()
    t.equal(
        textarea.getAttribute('aria-autocomplete'),
        'list',
        'textarea gets aria-autocomplete=list'
    )
    el.remove()
})

test('attaches to child added after connect', async t => {
    t.plan(1)
    const el = document.createElement(
        'emoji-search'
    ) as EmojiInput
    document.body.appendChild(el)
    const textarea = document.createElement('textarea')
    el.appendChild(textarea)
    await sleep(50)
    t.equal(
        textarea.getAttribute('aria-autocomplete'),
        'list',
        'MutationObserver picks up late child'
    )
    el.remove()
})

test('attaches via for attribute', t => {
    const textarea = document.createElement('textarea')
    textarea.id = 'test-external-field'
    document.body.appendChild(textarea)

    const el = document.createElement(
        'emoji-search'
    ) as EmojiInput
    el.setAttribute('for', 'test-external-field')
    el.emojis = SMALL_SET
    document.body.appendChild(el)

    t.equal(
        textarea.getAttribute('aria-autocomplete'),
        'list',
        'external field gets aria-autocomplete'
    )

    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover opens for external field')

    el.remove()
    textarea.remove()
})

test('works with input element', t => {
    const el = document.createElement(
        'emoji-search'
    ) as EmojiInput
    const input = document.createElement('input')
    input.type = 'text'
    el.appendChild(input)
    document.body.appendChild(el)
    el.emojis = SMALL_SET

    simulateInput(input, ':pizza')
    t.ok(el.isOpen, 'popover opens for input element')

    keydown(input, 'Enter')
    t.ok(
        input.value.includes('🍕'),
        'emoji inserted into input'
    )

    el.remove()
})

// -- Trigger behavior ------------------------------------------

test('popover opens on valid trigger', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, 'hello :sm')
    t.ok(el.isOpen, 'opens for :sm after space')
    el.remove()
})

test('popover opens at start of input', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    t.ok(el.isOpen, 'opens when colon at position 0')
    el.remove()
})

test('does not open for short query', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':s')
    t.ok(
        !el.isOpen,
        'stays closed with 1 char (minChars=2)'
    )
    el.remove()
})

test('does not trigger after word character', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, 'word:sm')
    t.ok(
        !el.isOpen,
        'no trigger when colon follows letter'
    )
    el.remove()
})

test('triggers after opening paren', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, '(:sm')
    t.ok(el.isOpen, 'triggers after (')
    el.remove()
})

test('closes when trigger disappears', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    t.ok(el.isOpen, 'opens first')
    simulateInput(textarea, 'no trigger here')
    t.ok(!el.isOpen, 'closes when no trigger')
    el.remove()
})

test('search is case-insensitive', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':SM')
    t.ok(el.isOpen, 'opens for uppercase query')
    const items = listItems(el)
    t.ok(items.length >= 1, 'finds results')
    el.remove()
})

// -- Search results --------------------------------------------

test('finds results by name prefix', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    const items = listItems(el)
    t.ok(items.length >= 2, 'matches name prefixes')
    el.remove()
})

test('finds results by name substring', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':burger')
    const items = listItems(el)
    t.ok(items.length >= 1, 'matches name substrings')
    el.remove()
})

test('finds results by keyword', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':lit')
    const items = listItems(el)
    t.ok(items.length >= 1, 'matches keywords')
    el.remove()
})

test('respects maxResults', t => {
    const { el, textarea } = setup(SMALL_SET)
    el.maxResults = 2
    simulateInput(textarea, ':sm')
    const items = listItems(el)
    t.ok(items.length <= 2, 'results capped at maxResults')
    el.remove()
})

test('shows empty state for no matches', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':zzzzzz')
    t.ok(
        el.isOpen,
        'popover opens even with no matches'
    )
    const items = listItems(el)
    t.equal(items.length, 0, 'no result items')
    const empty = el.querySelector(
        '.emoji-search__empty'
    )
    t.ok(empty, 'empty state element shown')
    el.remove()
})

// -- Keyboard navigation --------------------------------------

test('first item selected by default', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    const items = listItems(el)
    t.equal(
        items[0]?.getAttribute('aria-selected'),
        'true',
        'first item is selected'
    )
    el.remove()
})

test('ArrowDown moves selection forward', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    keydown(textarea, 'ArrowDown')
    const items = listItems(el)
    t.equal(
        items[0]?.getAttribute('aria-selected'),
        'false',
        'first item deselected'
    )
    t.equal(
        items[1]?.getAttribute('aria-selected'),
        'true',
        'second item selected'
    )
    el.remove()
})

test('ArrowUp wraps from first to last', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    const items = listItems(el)
    const lastIdx = items.length - 1
    keydown(textarea, 'ArrowUp')
    t.equal(
        items[lastIdx]?.getAttribute('aria-selected'),
        'true',
        'last item selected after wrap'
    )
    el.remove()
})

test('ArrowDown wraps from last to first', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    const items = listItems(el)
    const count = items.length
    for (let i = 0; i < count; i++) {
        keydown(textarea, 'ArrowDown')
    }
    t.equal(
        items[0]?.getAttribute('aria-selected'),
        'true',
        'wraps back to first'
    )
    el.remove()
})

test('aria-activedescendant tracks selection', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    const first = textarea.getAttribute(
        'aria-activedescendant'
    )
    t.ok(first, 'set when popover opens')
    keydown(textarea, 'ArrowDown')
    const second = textarea.getAttribute(
        'aria-activedescendant'
    )
    t.notEqual(
        first, second,
        'changes on navigation'
    )
    el.remove()
})

// -- Commit behavior -------------------------------------------

test('Enter commits the selected emoji', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    keydown(textarea, 'Enter')
    t.ok(!el.isOpen, 'popover closes')
    t.ok(
        textarea.value.includes('🍕'),
        'emoji inserted'
    )
    t.ok(
        !textarea.value.includes(':pizza'),
        'trigger text replaced'
    )
    el.remove()
})

test('Tab commits the selected emoji', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    keydown(textarea, 'Tab')
    t.ok(!el.isOpen, 'popover closes')
    t.ok(
        textarea.value.includes('🍕'),
        'emoji inserted via Tab'
    )
    el.remove()
})

test('Escape closes without inserting', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover open')
    keydown(textarea, 'Escape')
    t.ok(!el.isOpen, 'popover closes')
    t.ok(
        textarea.value.includes(':pizza'),
        'original text preserved'
    )
    el.remove()
})

test('committed emoji has trailing space', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    keydown(textarea, 'Enter')
    t.ok(
        textarea.value.endsWith(' '),
        'space after emoji'
    )
    el.remove()
})

test('preserves text before trigger', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, 'hello :pizza')
    keydown(textarea, 'Enter')
    t.ok(
        textarea.value.startsWith('hello '),
        'preceding text kept'
    )
    t.ok(
        textarea.value.includes('🍕'),
        'emoji inserted after prefix'
    )
    el.remove()
})

test('navigated commit inserts correct emoji', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    keydown(textarea, 'ArrowDown')
    keydown(textarea, 'Enter')
    t.ok(
        textarea.value.includes('😄'),
        'second result emoji inserted'
    )
    el.remove()
})

test('click on item commits emoji', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    const items = listItems(el)
    t.ok(items.length > 0, 'has items to click')
    items[0]?.click()
    t.ok(!el.isOpen, 'closes after click')
    t.ok(
        textarea.value.includes('🍕'),
        'emoji inserted on click'
    )
    el.remove()
})

// -- Events ----------------------------------------------------

test('emoji-select event fires on commit', async t => {
    t.plan(3)
    const { el, textarea } = setup(SMALL_SET)

    el.addEventListener('emoji-select', ((
        ev:CustomEvent<EmojiSelectDetail>
    ) => {
        t.ok(ev.detail.emoji, 'has emoji detail')
        t.equal(
            ev.detail.emoji.name, 'pizza',
            'correct emoji name'
        )
        t.equal(
            ev.detail.query, 'pizza',
            'correct query string'
        )
    }) as EventListener)

    simulateInput(textarea, ':pizza')
    keydown(textarea, 'Enter')
    el.remove()
})

test('emoji-select event bubbles', async t => {
    t.plan(1)
    const { el, textarea } = setup(SMALL_SET)

    document.body.addEventListener(
        'emoji-select',
        function handler () {
            t.ok(true, 'event bubbles to body')
            document.body.removeEventListener(
                'emoji-select', handler
            )
        }
    )

    simulateInput(textarea, ':pizza')
    keydown(textarea, 'Enter')
    el.remove()
})

// -- Configuration ---------------------------------------------

test('minChars can be lowered', t => {
    const { el, textarea } = setup(SMALL_SET)
    el.minChars = 1
    simulateInput(textarea, ':s')
    t.ok(el.isOpen, 'opens with 1 char when minChars=1')
    el.remove()
})

test('custom emoji data', t => {
    const custom:EmojiEntry[] = [
        {
            emoji:'🧪',
            name:'test_tube',
            keywords:['science'],
        },
    ]
    const { el, textarea } = setup(custom)
    simulateInput(textarea, ':test')
    const items = listItems(el)
    t.equal(items.length, 1, 'finds custom emoji')
    keydown(textarea, 'Enter')
    t.ok(
        textarea.value.includes('🧪'),
        'custom emoji inserted'
    )
    el.remove()
})

// -- Lifecycle -------------------------------------------------

test('detach prevents further triggers', t => {
    const { el, textarea } = setup(SMALL_SET)
    el.detach()
    simulateInput(textarea, ':pizza')
    t.ok(!el.isOpen, 'no popover after detach')
    el.remove()
})

test('re-attach after detach', t => {
    const { el, textarea } = setup(SMALL_SET)
    el.detach()
    el.attach(textarea)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'works after re-attach')
    el.remove()
})

test('popover re-opens after close', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'opens first time')
    keydown(textarea, 'Escape')
    t.ok(!el.isOpen, 'closes on Escape')
    simulateInput(textarea, ':cat')
    t.ok(el.isOpen, 'opens again with new query')
    el.remove()
})

test('aria-controls set and cleared', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':sm')
    t.ok(
        textarea.hasAttribute('aria-controls'),
        'set when open'
    )
    keydown(textarea, 'Escape')
    t.ok(
        !textarea.hasAttribute('aria-controls'),
        'removed on close'
    )
    el.remove()
})

test('disconnectedCallback cleans up', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'opens while connected')
    el.remove()
    simulateInput(textarea, ':cat')
    t.ok(!el.isOpen, 'no trigger after disconnect')
})

function setup (emojis?:EmojiEntry[]):{
    el:EmojiInput;
    textarea:HTMLTextAreaElement;
} {
    const el = document.createElement(
        'emoji-search'
    ) as EmojiInput
    const textarea = document.createElement('textarea')
    el.appendChild(textarea)
    document.body.appendChild(el)
    if (emojis) el.emojis = emojis
    return { el, textarea }
}

function simulateInput (
    field:HTMLTextAreaElement|HTMLInputElement,
    value:string,
):void {
    field.value = value
    field.selectionStart = value.length
    field.selectionEnd = value.length
    field.dispatchEvent(
        new InputEvent('input', { bubbles:true })
    )
}

function keydown (field:HTMLElement, key:string):void {
    field.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        bubbles:true,
        cancelable:true,
    }))
}

function listItems (
    el:EmojiInput,
):NodeListOf<HTMLElement> {
    return el.querySelectorAll(
        '.emoji-search__item'
    )
}
