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
import buttonCss from '../src/button.css'
import pickerCss from '../src/picker.css'

const _style = document.createElement('style')
_style.textContent = [buttonCss, pickerCss].join('\n')
document.head.appendChild(_style)

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

// -- Static render (Node-compatible) ---------------------------

test('static render returns an HTML string', t => {
    const html = EmojiInput.render('test-uid')
    t.equal(typeof html, 'string', 'returns a string')
    t.ok(
        html.includes('emoji-search-list'),
        'contains the list class'
    )
    t.ok(
        html.includes('role="listbox"'),
        'has listbox role'
    )
    t.ok(
        html.includes('aria-label="Emoji suggestions"'),
        'listbox has an accessible label'
    )
    t.ok(
        html.includes('id="test-uid-list"'),
        'uses the uid for the element id'
    )
    t.ok(
        html.includes('popover="manual"'),
        'has popover attribute'
    )
})

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
    const ctor = customElements.get('emoji-input')
    t.ok(ctor, 'emoji-input tag is defined')
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
    t.ok(inner?.querySelector('.visually-hidden'), 'has a visually-hidden label')
    button.remove()
})

test('emoji-button uses currentColor', t => {
    const button = document.createElement('emoji-button')
    document.body.appendChild(button)

    const svg = button.querySelector('svg')
    t.equal(
        svg?.getAttribute('fill'),
        'currentColor',
        'the SVG inherits its fill from currentColor'
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
        '.emoji-picker-panel'
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

test('picker panel stays inside viewport when anchor is near bottom', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = SMALL_SET

    const anchor = document.createElement('button')
    anchor.style.position = 'fixed'
    anchor.style.bottom = '10px'
    anchor.style.left = '100px'
    anchor.textContent = 'trigger'
    document.body.append(anchor, picker)

    picker.open(anchor)
    t.ok(picker.isOpen, 'picker opens')

    const panel = picker.querySelector(
        '.emoji-picker-panel'
    ) as HTMLElement
    const panelRect = panel.getBoundingClientRect()

    t.ok(
        panelRect.bottom <= window.innerHeight,
        'panel bottom is within viewport height'
    )

    picker.close()
    anchor.remove()
    picker.remove()
})

test('picker panel stays inside viewport when anchor is near right edge', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = SMALL_SET

    const anchor = document.createElement('button')
    anchor.style.position = 'fixed'
    anchor.style.top = '10px'
    anchor.style.right = '0px'
    anchor.textContent = 'trigger'
    document.body.append(anchor, picker)

    picker.open(anchor)
    t.ok(picker.isOpen, 'picker opens')

    const panel = picker.querySelector(
        '.emoji-picker-panel'
    ) as HTMLElement
    const panelRect = panel.getBoundingClientRect()

    t.ok(
        panelRect.right <= window.innerWidth,
        'panel right is within viewport width'
    )

    picker.close()
    anchor.remove()
    picker.remove()
})

test('picker opens below anchor when there is room', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = SMALL_SET

    const anchor = document.createElement('button')
    anchor.style.position = 'fixed'
    anchor.style.top = '10px'
    anchor.style.left = '10px'
    anchor.textContent = 'trigger'
    document.body.append(anchor, picker)

    picker.open(anchor)
    const panel = picker.querySelector(
        '.emoji-picker-panel'
    ) as HTMLElement
    const anchorRect = anchor.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()

    t.ok(
        panelRect.top >= anchorRect.bottom - 1,
        'panel top is at or below anchor bottom'
    )

    picker.close()
    anchor.remove()
    picker.remove()
})

test('picker repositions on window resize while open', async t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = SMALL_SET

    const anchor = document.createElement('button')
    anchor.style.position = 'fixed'
    anchor.style.top = '10px'
    anchor.style.left = '10px'
    anchor.textContent = 'trigger'
    document.body.append(anchor, picker)

    picker.open(anchor)
    const panel = picker.querySelector(
        '.emoji-picker-panel'
    ) as HTMLElement
    const rectBefore = panel.getBoundingClientRect()

    anchor.style.top = '50px'
    anchor.style.left = '50px'
    window.dispatchEvent(new Event('resize'))
    await sleep(50)

    const rectAfter = panel.getBoundingClientRect()
    t.ok(
        rectAfter.top !== rectBefore.top
            || rectAfter.left !== rectBefore.left,
        'panel position updated after resize'
    )

    picker.close()
    anchor.remove()
    picker.remove()
})

test('after close no reposition listener remains', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = SMALL_SET

    const anchor = document.createElement('button')
    anchor.style.position = 'fixed'
    anchor.style.top = '10px'
    anchor.style.left = '10px'
    anchor.textContent = 'trigger'
    document.body.append(anchor, picker)

    picker.open(anchor)
    picker.close()

    const panel = picker.querySelector(
        '.emoji-picker-panel'
    ) as HTMLElement
    const rectBefore = panel.getBoundingClientRect()

    anchor.style.top = '100px'
    window.dispatchEvent(new Event('resize'))

    const rectAfter = panel.getBoundingClientRect()
    t.ok(
        rectAfter.top === rectBefore.top
            && rectAfter.left === rectBefore.left,
        'panel position unchanged after close + resize'
    )

    anchor.remove()
    picker.remove()
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
        customElements.get('emoji-input'),
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

test('emoji-picker grid exists when open', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const grid = picker.querySelector<HTMLElement>('[role="grid"]')
    t.ok(grid, 'grid exists')
    picker.close()
    picker.remove()
})

test('emoji-picker grid has an accessible label', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    const grid = picker.querySelector('[role="grid"]')
    t.equal(
        grid?.getAttribute('aria-label'),
        'Emoji',
        'grid has aria-label'
    )
    picker.remove()
})

test('emoji-picker search controls the grid', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    const search = picker.querySelector(
        'input[type="search"]'
    )
    const grid = picker.querySelector('[role="grid"]')
    t.ok(
        search?.getAttribute('aria-controls'),
        'search has aria-controls'
    )
    t.equal(
        search?.getAttribute('aria-controls'),
        grid?.id,
        'search aria-controls references the grid'
    )
    picker.remove()
})

test('emoji-picker moves focus to search on open', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    const search = picker.querySelector(
        'input[type="search"]'
    )
    t.equal(
        document.activeElement,
        search,
        'search input is focused after open'
    )
    picker.close()
    picker.remove()
})

test('emoji-picker returns focus to trigger on close', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open(trigger)
    picker.close()
    t.equal(
        document.activeElement,
        trigger,
        'focus returns to the trigger element'
    )
    picker.remove()
    trigger.remove()
})

test('open() from bubbling click handler leaves isOpen true', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'open picker'
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.append(trigger, picker)

    trigger.addEventListener('click', () => {
        picker.open(trigger)
    })
    trigger.click()

    t.ok(
        picker.isOpen,
        'picker stays open after bubbling click'
    )
    picker.close()
    picker.remove()
    trigger.remove()
})

test('Escape with focus inside panel closes and restores focus', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.append(trigger)
    trigger.focus()

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.append(picker)
    picker.open(trigger)
    t.ok(picker.isOpen, 'picker is open')

    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    t.equal(
        document.activeElement,
        search,
        'focus is inside panel'
    )
    keydown(picker, 'Escape')
    t.ok(!picker.isOpen, 'picker closed')
    t.equal(
        document.activeElement,
        trigger,
        'focus returned to trigger'
    )
    picker.remove()
    trigger.remove()
})

test('programmatic close() with focus inside restores trigger', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.append(trigger)
    trigger.focus()

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.append(picker)
    picker.open(trigger)

    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    search?.focus()
    picker.close()
    t.equal(
        document.activeElement,
        trigger,
        'focus returned to trigger on programmatic close'
    )
    picker.remove()
    trigger.remove()
})

test('selection with for field focuses that field', t => {
    const field = document.createElement('textarea')
    field.id = 'select-focus-target'
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.append(field, trigger)

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('for', field.id)
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.append(picker)
    trigger.focus()
    picker.open(trigger)
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )?.click()

    t.equal(
        document.activeElement,
        field,
        'focus moved to the for field after selection'
    )
    t.ok(
        field.value.includes('🧈'),
        'emoji was inserted'
    )
    picker.remove()
    field.remove()
    trigger.remove()
})

test('selection without for field focuses trigger', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    document.body.append(trigger)

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.append(picker)
    trigger.focus()
    picker.open(trigger)
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )?.click()

    t.equal(
        document.activeElement,
        trigger,
        'focus returned to trigger after selection'
    )
    picker.remove()
    trigger.remove()
})

test('isOpen false after light dismiss', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.append(picker)
    picker.open()
    t.ok(picker.isOpen, 'starts open')

    const panel = picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )
    panel?.dispatchEvent(new ToggleEvent('toggle', {
        newState:'closed',
        oldState:'open',
    }))

    t.ok(
        !picker.isOpen,
        'isOpen is false after toggle event'
    )
    picker.remove()
})

test('removing picker while open does not move focus', t => {
    const trigger = document.createElement('button')
    trigger.textContent = 'trigger'
    const other = document.createElement('button')
    other.textContent = 'other'
    document.body.append(trigger, other)

    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.append(picker)
    trigger.focus()
    picker.open(trigger)

    other.focus()
    picker.remove()

    t.equal(
        document.activeElement,
        other,
        'focus stays on other after disconnect'
    )
    trigger.remove()
    other.remove()
})

test('button opens picker with custom tag name', t => {
    class CustomPicker extends EmojiPicker {}
    const tag = 'custom-emoji-picker'
    if (!customElements.get(tag)) {
        customElements.define(tag, CustomPicker)
    }

    const picker = document.createElement(tag) as EmojiPicker
    picker.id = 'custom-tag-picker'
    const btn = document.createElement(
        'emoji-button'
    ) as EmojiButton
    btn.setAttribute('for', picker.id)
    document.body.append(picker, btn)

    btn.querySelector('button')?.click()
    t.ok(
        picker.isOpen,
        'button opened the custom-tagged picker'
    )
    picker.close()
    picker.remove()
    btn.remove()
})

test('emoji-picker tabs use roving tabindex', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)

    const tabs = picker.querySelectorAll('[role="tab"]')
    const selected = tabs[0]
    const notSelected = tabs[1]
    t.equal(
        selected?.getAttribute('tabindex'),
        '0',
        'selected tab has tabindex 0'
    )
    t.equal(
        notSelected?.getAttribute('tabindex'),
        '-1',
        'non-selected tab has tabindex -1'
    )
    picker.remove()
})

test('emoji-picker tabs navigate with arrow keys', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const firstTab = picker.querySelector<HTMLElement>(
        '[role="tab"]'
    )
    firstTab?.focus()
    keydown(firstTab!, 'ArrowRight')

    const tabs = picker.querySelectorAll('[role="tab"]')
    t.equal(
        tabs[1]?.getAttribute('aria-selected'),
        'true',
        'ArrowRight activates the next tab'
    )
    t.equal(
        document.activeElement,
        tabs[1],
        'ArrowRight moves focus to the next tab'
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
        picker.querySelectorAll<HTMLButtonElement>(
            '[role="gridcell"] button'
        )
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
        '[role="gridcell"] button'
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

test('Enter on a category tab activates it without emoji-select', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    let selected = false
    picker.addEventListener('emoji-select', () => { selected = true })

    const peopleTab = picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )
    peopleTab?.focus()
    t.equal(
        document.activeElement,
        peopleTab,
        'focus is on the People tab'
    )
    if (peopleTab) {
        keydown(peopleTab, 'Enter')
        peopleTab.click()
    }

    t.ok(!selected, 'Enter on tab does not emit emoji-select')
    const updatedPeopleTab = picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )
    t.equal(
        updatedPeopleTab?.getAttribute('aria-selected'),
        'true',
        'People tab is now selected'
    )
    t.ok(picker.isOpen, 'picker stays open')
    picker.close()
    picker.remove()
})

test('Enter on a skin tone radio checks it without emoji-select', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    let selected = false
    picker.addEventListener('emoji-select', () => { selected = true })

    const radios = picker.querySelectorAll<HTMLElement>('[role="radio"]')
    t.ok(radios.length >= 2, 'has skin tone radios')
    const second = radios[1]
    second?.focus()
    if (second) {
        keydown(second, 'Enter')
        second.click()
    }

    t.ok(!selected, 'Enter on radio does not emit emoji-select')
    const updatedRadios = picker.querySelectorAll<HTMLElement>(
        '[role="radio"]'
    )
    t.equal(
        updatedRadios[1]?.getAttribute('aria-checked'),
        'true',
        'radio is now checked'
    )
    t.ok(picker.isOpen, 'picker stays open')
    picker.close()
    picker.remove()
})

test('ArrowLeft in search box stays in search box', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    t.equal(
        document.activeElement,
        search,
        'search is focused after open'
    )
    if (search) keydown(search, 'ArrowLeft')
    t.equal(
        document.activeElement,
        search,
        'focus stays in search after ArrowLeft'
    )
    if (search) keydown(search, 'ArrowRight')
    t.equal(
        document.activeElement,
        search,
        'focus stays in search after ArrowRight'
    )
    if (search) keydown(search, 'ArrowUp')
    t.equal(
        document.activeElement,
        search,
        'focus stays in search after ArrowUp'
    )
    picker.close()
    picker.remove()
})

test('ArrowDown in search box moves focus into grid', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    search?.focus()
    if (search) keydown(search, 'ArrowDown')

    const firstBtn = picker.querySelector<HTMLElement>(
        '[role="gridcell"] button'
    )
    t.equal(
        document.activeElement,
        firstBtn,
        'focus moves to the first gridcell button'
    )
    picker.close()
    picker.remove()
})

test('Enter in search with query selects first visible emoji', t => {
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
        details.push(
            (event as CustomEvent<EmojiSelectDetail>).detail
        )
    })

    if (input) keydown(input, 'Enter')

    t.equal(details.length, 1, 'emits emoji-select')
    t.ok(
        details[0]?.emoji.name.startsWith('butter'),
        'selects the first visible emoji matching the query'
    )
    picker.close()
    picker.remove()
})

test('ArrowRight on tone radio moves and checks next radio', t => {
    const picker = document.createElement('emoji-picker') as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const radios = picker.querySelectorAll<HTMLElement>('[role="radio"]')
    t.ok(radios.length >= 3, 'has at least 3 radios')
    radios[0]?.focus()
    t.equal(
        document.activeElement,
        radios[0],
        'first radio is focused'
    )

    if (radios[0]) keydown(radios[0], 'ArrowRight')

    const updated = picker.querySelectorAll<HTMLElement>(
        '[role="radio"]'
    )
    t.equal(
        document.activeElement,
        updated[1],
        'focus moved to second radio'
    )
    t.equal(
        updated[1]?.getAttribute('aria-checked'),
        'true',
        'second radio is now checked'
    )
    t.equal(
        updated[0]?.getAttribute('aria-checked'),
        'false',
        'first radio is unchecked'
    )
    picker.close()
    picker.remove()
})

test('after outside click, focus stays on clicked element', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    const other = document.createElement('button')
    other.textContent = 'other'
    document.body.append(picker, other)
    picker.open()
    t.ok(picker.isOpen, 'picker is open')

    other.focus()
    picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )?.dispatchEvent(new ToggleEvent('toggle', {
        newState:'closed',
        oldState:'open',
    }))

    t.ok(
        !picker.isOpen,
        'picker reports closed after light dismiss'
    )
    t.equal(
        document.activeElement,
        other,
        'focus stays on the clicked element'
    )
    picker.remove()
    other.remove()
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

test('inline picker reports isOpen true on connect', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    t.ok(
        picker.isOpen,
        'isOpen is true without calling open()'
    )
    picker.remove()
})

test('inline picker stays visible after selection', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.appendChild(picker)

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    let detail:EmojiSelectDetail|null = null
    picker.addEventListener('emoji-select', (ev) => {
        detail = (ev as CustomEvent<EmojiSelectDetail>).detail
    })

    picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )?.click()

    t.ok(detail, 'emoji-select was emitted')
    t.ok(
        picker.isOpen,
        'isOpen is still true after selection'
    )
    const panel = picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )
    t.ok(
        panel && !panel.hidden,
        'panel is still visible after selection'
    )
    picker.remove()
})

test('arrow keys work in inline picker without open()', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const buttons = picker.querySelectorAll<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    t.ok(buttons.length >= 2, 'grid has cells')
    buttons[0]?.focus()
    keydown(buttons[0]!, 'ArrowRight')

    t.equal(
        document.activeElement,
        buttons[1],
        'ArrowRight moves focus in inline picker'
    )
    picker.remove()
})

test('Escape in inline picker clears query and stays visible', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )
    if (input) {
        input.value = 'butter'
        input.dispatchEvent(
            new InputEvent('input', { bubbles:true })
        )
    }

    t.equal(input?.value, 'butter', 'query is set')
    keydown(picker, 'Escape')

    t.equal(
        input?.value,
        '',
        'Escape clears the search query'
    )
    t.ok(
        picker.isOpen,
        'inline picker stays open after Escape'
    )
    const panel = picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )
    t.ok(
        panel && !panel.hidden,
        'panel is still visible after Escape'
    )
    t.equal(
        document.activeElement,
        input,
        'focus moves to search input after Escape'
    )
    picker.remove()
})

test('close() on inline picker leaves panel visible', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    t.ok(picker.isOpen, 'starts open')
    picker.close()
    t.ok(
        picker.isOpen,
        'isOpen still true after close()'
    )
    const panel = picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )
    t.ok(
        panel && !panel.hidden,
        'panel still visible after close()'
    )
    picker.remove()
})

test('toggling inline attribute switches display mode', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)

    t.ok(!picker.isOpen, 'starts closed as popover')

    picker.setAttribute('inline', '')
    t.ok(
        picker.isOpen,
        'isOpen true after adding inline'
    )
    const panel = picker.querySelector<HTMLElement>(
        '.emoji-picker-panel'
    )
    t.ok(
        panel && !panel.hidden,
        'panel visible after adding inline'
    )
    t.ok(
        !panel?.hasAttribute('popover'),
        'popover attribute removed'
    )

    picker.removeAttribute('inline')
    t.ok(
        !picker.isOpen,
        'isOpen false after removing inline'
    )
    t.ok(
        panel?.hidden,
        'panel hidden after removing inline'
    )
    t.equal(
        panel?.getAttribute('popover'),
        'auto',
        'popover attribute restored'
    )
    picker.remove()
})

test('open() on inline picker only focuses search', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.setAttribute('inline', '')
    document.body.appendChild(picker)

    const other = document.createElement('button')
    other.textContent = 'other'
    document.body.append(other)
    other.focus()

    picker.open()
    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    t.equal(
        document.activeElement,
        search,
        'open() focuses search input in inline mode'
    )
    t.ok(
        picker.isOpen,
        'isOpen remains true'
    )
    picker.remove()
    other.remove()
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
            picker.querySelectorAll<HTMLButtonElement>(
                '[role="gridcell"] button'
            )
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
        picker.querySelectorAll<HTMLButtonElement>(
            '[role="gridcell"] button'
        )
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
        '[role="gridcell"] button'
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
        restored.querySelector(
            '[role="gridcell"] button'
        )?.textContent,
        '👋🏿',
        'restores the skin tone from localStorage'
    )
    restored.remove()
    localStorage.removeItem(key)
})

test('every gridcell sits inside a row and contains a button', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const rows = picker.querySelectorAll('[role="row"]')
    t.ok(rows.length > 0, 'grid has rows')

    const cells = picker.querySelectorAll('[role="gridcell"]')
    t.ok(cells.length > 0, 'grid has gridcells')

    for (const cell of Array.from(cells)) {
        t.equal(
            cell.closest('[role="row"]')?.getAttribute('role'),
            'row',
            'gridcell is inside a row'
        )
        const buttons = cell.querySelectorAll('button')
        t.equal(
            buttons.length,
            1,
            'gridcell contains exactly one button'
        )
    }
    picker.close()
    picker.remove()
})

test('exactly one gridcell button has tabindex 0', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const tabbable = () => picker.querySelectorAll(
        '[role="gridcell"] button[tabindex="0"]'
    )
    t.equal(
        tabbable().length, 1,
        'one tabbable button after render'
    )

    const buttons = picker.querySelectorAll<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    buttons[0]?.focus()
    keydown(buttons[0]!, 'ArrowRight')
    t.equal(
        tabbable().length, 1,
        'one tabbable button after arrow navigation'
    )
    t.equal(
        tabbable()[0],
        buttons[1],
        'tabbable button is the focused one'
    )

    buttons[3]?.click()
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    t.equal(
        tabbable().length, 1,
        'one tabbable button after click and re-render'
    )
    picker.close()
    picker.remove()
})

test('grid renders eight columns per row', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const rows = picker.querySelectorAll('[role="row"]')
    t.ok(rows.length > 1, 'has multiple rows')
    const firstRowCells = rows[0]!
        .querySelectorAll('[role="gridcell"]')
    t.equal(
        firstRowCells.length, 8,
        'first row has eight cells'
    )
    picker.close()
    picker.remove()
})

test('Enter on a focused grid cell emits emoji-select', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    let detail:EmojiSelectDetail|null = null
    picker.addEventListener('emoji-select', (ev) => {
        detail = (ev as CustomEvent<EmojiSelectDetail>).detail
    })

    const btn = picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    btn?.focus()
    keydown(btn!, 'Enter')
    t.ok(detail, 'Enter emits emoji-select')
    t.ok(
        detail!.emoji.emoji.length > 0,
        'detail contains the emoji'
    )
    picker.close()
    picker.remove()
})

test('Home and End move to row start and end', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const buttons = picker.querySelectorAll<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    const firstRow = picker.querySelector('[role="row"]')
    const rowLen = firstRow ?
        firstRow.querySelectorAll('[role="gridcell"]').length :
        8

    buttons[3]?.focus()
    keydown(buttons[3]!, 'Home')
    t.equal(
        document.activeElement,
        buttons[0],
        'Home moves to the first cell in the row'
    )

    keydown(buttons[0]!, 'End')
    t.equal(
        document.activeElement,
        buttons[rowLen - 1],
        'End moves to the last cell in the row'
    )
    picker.close()
    picker.remove()
})

test('ArrowDown moves to the cell below using row length', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const buttons = picker.querySelectorAll<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    const firstRow = picker.querySelector('[role="row"]')
    const rowLen = firstRow ?
        firstRow.querySelectorAll('[role="gridcell"]').length :
        8

    buttons[2]?.focus()
    keydown(buttons[2]!, 'ArrowDown')
    t.equal(
        document.activeElement,
        buttons[2 + rowLen],
        'ArrowDown moves by the rendered row length'
    )

    keydown(buttons[2 + rowLen]!, 'ArrowUp')
    t.equal(
        document.activeElement,
        buttons[2],
        'ArrowUp moves back by the rendered row length'
    )
    picker.close()
    picker.remove()
})

test('Tab from search lands on tabbable cell', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()
    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()

    const search = picker.querySelector<HTMLElement>(
        'input[type="search"]'
    )
    search?.focus()

    const tabbable = picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button[tabindex="0"]'
    )
    t.ok(tabbable, 'a tabbable cell exists')

    const nonTabbable = picker.querySelectorAll(
        '[role="gridcell"] button[tabindex="-1"]'
    )
    t.ok(
        nonTabbable.length > 0,
        'other cells are not tabbable'
    )
    picker.close()
    picker.remove()
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
        '[role="gridcell"] button'
    )
    const preview = picker.querySelector(
        '.emoji-picker-preview'
    )
    t.ok(preview, 'renders a preview region')
    button?.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles:true,
    }))
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

test('preview element has aria-hidden', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)

    const preview = picker.querySelector(
        '.emoji-picker-preview'
    )
    t.equal(
        preview?.getAttribute('aria-hidden'),
        'true',
        'preview is hidden from assistive technology'
    )
    picker.remove()
})

test('status region updates after search query changes', async t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )
    if (input) {
        input.value = 'butter'
        input.dispatchEvent(
            new InputEvent('input', { bubbles:true })
        )
    }

    const status = picker.querySelector('[role="status"]')
    t.ok(status, 'has a status region')

    await waitFor(() => {
        return (status?.textContent?.trim().length ?? 0) > 0
    })

    t.ok(
        (status?.textContent?.trim().length ?? 0) > 0,
        'status region has content after query change'
    )
    picker.close()
    picker.remove()
})

test('status region does not update on hover or focus', async t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    picker.emojis = [{
        emoji:'🧈',
        name:'butter',
        keywords:['food'],
        category:'people',
    }]
    document.body.appendChild(picker)

    const status = picker.querySelector('[role="status"]')
    const before = status?.textContent ?? ''

    const button = picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )
    button?.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles:true,
    }))
    await sleep(200)

    t.equal(
        status?.textContent ?? '',
        before,
        'status unchanged after hover'
    )

    button?.focus()
    await sleep(200)

    t.equal(
        status?.textContent ?? '',
        before,
        'status unchanged after focus'
    )
    picker.remove()
})

test('status region does not update on category change', async t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const status = picker.querySelector('[role="status"]')
    await sleep(200)
    const before = status?.textContent ?? ''

    picker.querySelector<HTMLElement>(
        '[role="tab"][aria-label="People"]'
    )?.click()
    await sleep(200)

    t.equal(
        status?.textContent ?? '',
        before,
        'status unchanged after category switch'
    )
    picker.close()
    picker.remove()
})

test('rapid typing yields single debounced status update', async t => {
    t.plan(1)
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )
    const status = picker.querySelector('[role="status"]')

    for (const char of ['b', 'bu', 'but']) {
        if (input) {
            input.value = char
            input.dispatchEvent(
                new InputEvent('input', { bubbles:true })
            )
        }
    }

    t.equal(
        status?.textContent?.trim() ?? '',
        '',
        'status is empty during rapid typing'
    )

    picker.close()
    picker.remove()
})

test('query with leading spaces returns same results', t => {
    const picker = document.createElement(
        'emoji-picker'
    ) as EmojiPicker
    document.body.appendChild(picker)
    picker.open()

    const input = picker.querySelector<HTMLInputElement>(
        'input[type="search"]'
    )

    if (input) {
        input.value = 'butter'
        input.dispatchEvent(
            new InputEvent('input', { bubbles:true })
        )
    }
    const trimmedCells = picker.querySelectorAll(
        '[role="gridcell"]'
    ).length

    if (input) {
        input.value = '  butter'
        input.dispatchEvent(
            new InputEvent('input', { bubbles:true })
        )
    }
    const spacedCells = picker.querySelectorAll(
        '[role="gridcell"]'
    ).length

    t.equal(
        spacedCells,
        trimmedCells,
        'leading spaces produce same results as trimmed'
    )
    t.ok(
        trimmedCells > 0,
        'at least one result for butter'
    )
    picker.close()
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
    picker.querySelector<HTMLButtonElement>(
        '[role="gridcell"] button'
    )?.click()

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
        'emoji-input'
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
        'emoji-input'
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
        'emoji-input'
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
        '.emoji-search-empty'
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

test('Enter with isComposing true does not commit', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover is open')
    keydown(textarea, 'Enter', { isComposing:true })
    t.ok(el.isOpen, 'popover stays open during IME')
    t.ok(
        textarea.value.includes(':pizza'),
        'trigger text not replaced during IME'
    )
    t.ok(
        !textarea.value.includes('🍕'),
        'no emoji inserted during IME'
    )
    el.remove()
})

test('keyCode 229 does not commit', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover is open')
    keydown(textarea, 'Enter', { keyCode:229 })
    t.ok(el.isOpen, 'popover stays open for keyCode 229')
    el.remove()
})

test('detach removes all aria attributes from field', t => {
    const { el, textarea } = setup(SMALL_SET)
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover opened')
    el.detach()
    t.ok(
        !textarea.hasAttribute('aria-autocomplete'),
        'aria-autocomplete removed'
    )
    t.ok(
        !textarea.hasAttribute('aria-controls'),
        'aria-controls removed'
    )
    t.ok(
        !textarea.hasAttribute('aria-activedescendant'),
        'aria-activedescendant removed'
    )
    el.remove()
})

test('minChars assigned before upgrade is honored', t => {
    const tag = `emoji-input-pre-${Math.random().toString(36).slice(2, 8)}`
    const el = document.createElement(tag) as EmojiInput
    const textarea = document.createElement('textarea')
    el.appendChild(textarea)
    ;(el as any).minChars = 1
    document.body.appendChild(el)
    customElements.define(tag, class extends EmojiInput {
        static TAG = tag
    })
    customElements.upgrade(el)
    t.equal(el.minChars, 1, 'minChars survived upgrade')
    simulateInput(textarea, ':s')
    t.ok(el.isOpen, 'opens with 1 char after pre-upgrade minChars=1')
    el.remove()
})

test('emojis assigned before upgrade is used for search', t => {
    const tag = `emoji-input-pre2-${Math.random().toString(36).slice(2, 8)}`
    const el = document.createElement(tag) as EmojiInput
    const textarea = document.createElement('textarea')
    el.appendChild(textarea)
    const custom:EmojiEntry[] = [
        { emoji:'🧪', name:'test_tube', keywords:['science'] },
    ]
    ;(el as any).emojis = custom
    document.body.appendChild(el)
    customElements.define(tag, class extends EmojiInput {
        static TAG = tag
    })
    customElements.upgrade(el)
    t.equal(el.emojis, custom, 'emojis survived upgrade')
    simulateInput(textarea, ':test')
    const items = listItems(el)
    t.ok(items.length >= 1, 'finds pre-upgrade custom emoji')
    el.remove()
})

test('adopts existing rendered list child', t => {
    const el = document.createElement('emoji-input') as EmojiInput
    const textarea = document.createElement('textarea')
    const uid = 'ssr-test'
    const wrapper = document.createElement('div')
    wrapper.innerHTML = EmojiInput.render(uid)
    const list = wrapper.firstElementChild as HTMLElement
    el.appendChild(textarea)
    el.appendChild(list)
    document.body.appendChild(el)
    const lists = el.querySelectorAll('[role="listbox"]')
    t.equal(lists.length, 1, 'exactly one listbox exists')
    el.emojis = SMALL_SET
    simulateInput(textarea, ':pizza')
    t.ok(el.isOpen, 'popover works with adopted list')
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

test('all done', () => {
    // @ts-expect-error tests
    window.testsFinished = true
})

function setup (emojis?:EmojiEntry[]):{
    el:EmojiInput;
    textarea:HTMLTextAreaElement;
} {
    const el = document.createElement('emoji-input') as EmojiInput
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

function keydown (
    field:HTMLElement,
    key:string,
    opts?:KeyboardEventInit,
):void {
    field.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        bubbles:true,
        cancelable:true,
        ...opts,
    }))
}

async function waitFor (
    condition:() => boolean,
    timeout = 500,
):Promise<void> {
    const start = Date.now()
    while (!condition()) {
        if (Date.now() - start > timeout) {
            throw new Error('waitFor timed out')
        }
        await sleep(20)
    }
}

function listItems (
    el:EmojiInput,
):NodeListOf<HTMLElement> {
    return el.querySelectorAll(
        '.emoji-search-item'
    )
}
