/**
 * <emoji-search>
 *
 * Wrap a <textarea> or <input>. When the user types `:` followed by
 * two or more characters, a popover opens at the caret with matching
 * emoji. Arrow keys move, Enter/Tab insert, Escape closes.
 *
 * No shadow DOM. The list is a plain child element with class
 * `emoji-search__list`; styles are injected once into the document
 * (or into the shadow root the element happens to live in) and use
 * `--emoji-search-*` custom properties for theming.
 *
 *   <emoji-search>
 *     <textarea></textarea>
 *   </emoji-search>
 *
 * Or attach to a field that lives elsewhere:
 *
 *   const el = document.querySelector('emoji-search')
 *   el.attach(document.querySelector('#chat'))
 *
 * Pass your own data (e.g. from `unicode-emoji-json` or `emojibase-data`)
 * via `el.emojis = [{ emoji: '🍕', name: 'pizza', keywords: ['food'] }]`.
 */

export interface EmojiEntry {
    emoji:string;
    name:string;        // shortcode, snake_case
    keywords?:string[];
}

export interface EmojiSelectDetail {
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
// Default data — a starter set. Swap in a full dataset via `.emojis`.
// ---------------------------------------------------------------------

function parse (src:string):EmojiEntry[] {
    return src.trim().split('\n').map(line => {
        const [emoji, name, kw] = line.split('|')
        return { emoji, name, keywords:kw ? kw.split(' ') : [] }
    })
}

export const DEFAULT_EMOJIS:EmojiEntry[] = parse(`
😀|grinning|smile happy
😃|smiley|smile happy
😄|smile|happy laugh
😁|grin|happy
😆|laughing|lol haha
😅|sweat_smile|nervous
🤣|rofl|laugh lol
😂|joy|laugh cry tears
🙂|slightly_smiling_face|smile
🙃|upside_down_face|silly
😉|wink|flirt
😊|blush|happy shy
😇|innocent|angel halo
🥰|smiling_face_with_hearts|love
😍|heart_eyes|love crush
🤩|star_struck|wow
😘|kissing_heart|kiss love
😋|yum|tasty food
😛|stuck_out_tongue|tongue
😜|stuck_out_tongue_winking_eye|silly
🤪|zany_face|crazy
🤔|thinking|hmm think
🤨|raised_eyebrow|suspicious
😐|neutral_face|meh
😑|expressionless|blank
😶|no_mouth|silent
🙄|roll_eyes|eyeroll
😏|smirk|smug
😬|grimacing|awkward
🤥|lying_face|pinocchio
😌|relieved|calm
😔|pensive|sad
😪|sleepy|tired
🤤|drooling_face|drool
😴|sleeping|zzz sleep
😷|mask|sick
🤒|face_with_thermometer|sick
🤕|face_with_head_bandage|hurt
🤢|nauseated_face|sick
🤮|vomiting_face|puke
🥵|hot_face|heat
🥶|cold_face|freezing
🥴|woozy_face|drunk
😵|dizzy_face|dizzy
🤯|exploding_head|mind blown
🤠|cowboy_hat_face|cowboy
🥳|partying_face|party celebrate
😎|sunglasses|cool
🤓|nerd_face|glasses
🧐|monocle_face|inspect
😕|confused|puzzled
😟|worried|concerned
🙁|slightly_frowning_face|sad
😮|open_mouth|surprised
😯|hushed|surprised
😲|astonished|shocked
😳|flushed|embarrassed
🥺|pleading_face|puppy eyes
😢|cry|sad tear
😭|sob|cry sad
😱|scream|fear
😖|confounded|frustrated
😣|persevere|struggle
😞|disappointed|sad
😓|sweat|nervous
😩|weary|tired
😤|triumph|huff angry
😡|rage|angry mad
😠|angry|mad
🤬|face_with_symbols_on_mouth|swearing
💀|skull|dead
☠️|skull_and_crossbones|danger
💩|poop|poo
🤡|clown_face|clown
👻|ghost|boo spooky
👽|alien|ufo
🤖|robot|bot
😺|smiley_cat|cat
🙈|see_no_evil|monkey
🙉|hear_no_evil|monkey
🙊|speak_no_evil|monkey
💋|kiss|lips
❤️|heart|love red
🧡|orange_heart|love
💛|yellow_heart|love
💚|green_heart|love
💙|blue_heart|love
💜|purple_heart|love
🖤|black_heart|love
🤍|white_heart|love
💔|broken_heart|sad
💕|two_hearts|love
💖|sparkling_heart|love
💯|100|hundred perfect
💢|anger|angry
💥|boom|explosion collision
💫|dizzy|star
💦|sweat_drops|water
💨|dash|wind fast
🕳️|hole|
💬|speech_balloon|chat
💤|zzz|sleep
👋|wave|hello bye
🤚|raised_back_of_hand|stop
✋|hand|stop high five
🖖|vulcan_salute|spock
👌|ok_hand|okay
🤌|pinched_fingers|italian
✌️|v|peace victory
🤞|crossed_fingers|luck
🤟|love_you_gesture|rock
🤘|metal|rock horns
🤙|call_me_hand|shaka
👈|point_left|
👉|point_right|
👆|point_up_2|
👇|point_down|
☝️|point_up|
👍|thumbsup|+1 yes like
👎|thumbsdown|-1 no dislike
✊|fist|power
👊|punch|fist bump
🤛|fist_left|
🤜|fist_right|
👏|clap|applause
🙌|raised_hands|hooray praise
🤝|handshake|deal
🙏|pray|please thanks
💪|muscle|strong flex
🧠|brain|smart
👀|eyes|look
👁️|eye|look
🫀|anatomical_heart|
🗣️|speaking_head|talk
👤|bust_in_silhouette|user
👥|busts_in_silhouette|users group
🐶|dog|puppy
🐱|cat|kitty
🐭|mouse|
🐹|hamster|
🐰|rabbit|bunny
🦊|fox_face|
🐻|bear|
🐼|panda_face|
🐨|koala|
🐯|tiger|
🦁|lion|
🐮|cow|
🐷|pig|
🐸|frog|
🐵|monkey_face|
🐔|chicken|
🐧|penguin|
🐦|bird|
🦆|duck|
🦉|owl|
🦄|unicorn|
🐝|bee|honeybee
🐛|bug|insect
🦋|butterfly|
🐌|snail|slow
🐢|turtle|slow
🐍|snake|python
🐙|octopus|
🦀|crab|rust
🐳|whale|
🐬|dolphin|
🐟|fish|
🦈|shark|
🐊|crocodile|
🐘|elephant|
🦒|giraffe|
🐉|dragon|
🌵|cactus|
🎄|christmas_tree|xmas
🌲|evergreen_tree|
🌴|palm_tree|
🌱|seedling|plant sprout
🍀|four_leaf_clover|luck
🍁|maple_leaf|canada
🌸|cherry_blossom|flower
🌹|rose|flower
🌻|sunflower|flower
🌈|rainbow|pride
☀️|sunny|sun
🌙|crescent_moon|night
⭐|star|
🌟|star2|glowing
✨|sparkles|shiny magic
⚡|zap|lightning electric
🔥|fire|lit hot
💧|droplet|water
🌊|ocean|wave
❄️|snowflake|cold
☁️|cloud|
🌍|earth_africa|globe world
🌎|earth_americas|globe world
🍎|apple|fruit
🍌|banana|fruit
🍇|grapes|fruit
🍓|strawberry|fruit
🍉|watermelon|fruit
🍋|lemon|fruit
🍑|peach|fruit
🍒|cherries|fruit
🥑|avocado|
🥕|carrot|
🌽|corn|
🌶️|hot_pepper|spicy
🍞|bread|
🧀|cheese|
🍔|hamburger|burger
🍟|fries|
🍕|pizza|
🌮|taco|
🌯|burrito|
🍣|sushi|
🍜|ramen|noodles
🍩|doughnut|donut
🍪|cookie|
🎂|birthday|cake
🍰|cake|
🍫|chocolate_bar|
🍿|popcorn|
☕|coffee|
🍵|tea|
🍺|beer|
🍻|beers|cheers
🍷|wine_glass|
🥂|champagne|cheers
🍸|cocktail|
🧋|bubble_tea|boba
🥤|cup_with_straw|soda
⚽|soccer|football
🏀|basketball|
🏈|football|
⚾|baseball|
🎾|tennis|
🏐|volleyball|
🎱|8ball|billiards
🏓|ping_pong|
🏆|trophy|win
🥇|first_place_medal|gold
🎯|dart|bullseye target
🎮|video_game|gaming controller
🎲|game_die|dice
🧩|jigsaw|puzzle
🎨|art|paint palette
🎬|clapper|movie film
🎤|microphone|sing
🎧|headphones|music
🎵|musical_note|music
🎶|notes|music
🎸|guitar|
🎹|musical_keyboard|piano
🥁|drum|
🚗|car|
🚕|taxi|
🚌|bus|
🚓|police_car|
🚑|ambulance|
🚒|fire_engine|
🚲|bike|bicycle
🛴|scooter|
🚀|rocket|launch ship
✈️|airplane|flight
🚁|helicopter|
⛵|boat|sailboat
🚂|steam_locomotive|train
🏠|house|home
🏢|office|building
🏥|hospital|
🏫|school|
🏰|european_castle|castle
⛺|tent|camping
🗽|statue_of_liberty|nyc
🗼|tokyo_tower|
⌚|watch|
📱|iphone|phone mobile
💻|computer|laptop
🖥️|desktop_computer|
⌨️|keyboard|
🖱️|computer_mouse|
🖨️|printer|
💾|floppy_disk|save
💿|cd|
📀|dvd|
📷|camera|photo
📹|video_camera|
📺|tv|television
📻|radio|
🔋|battery|
🔌|electric_plug|
💡|bulb|idea light
🔦|flashlight|
🕯️|candle|
🗑️|wastebasket|trash
💰|moneybag|money cash
💵|dollar|money
💳|credit_card|
💎|gem|diamond
⚖️|balance_scale|justice
🔧|wrench|tool fix
🔨|hammer|tool
🛠️|hammer_and_wrench|tools
⚙️|gear|settings
🔩|nut_and_bolt|
🔗|link|chain url
🔒|lock|locked secure
🔓|unlock|unlocked
🔑|key|
🛡️|shield|security
🧲|magnet|
🧪|test_tube|science
🧬|dna|
🔬|microscope|
🔭|telescope|
📡|satellite|
💊|pill|medicine
🩹|adhesive_bandage|bandaid
🧹|broom|clean
🧼|soap|
🛒|shopping_cart|
📦|package|box shipping
📫|mailbox|
✉️|envelope|email mail
📧|email|mail
📝|memo|note pencil
📄|page_facing_up|document
📊|bar_chart|chart
📈|chart_with_upwards_trend|growth up
📉|chart_with_downwards_trend|down
📋|clipboard|
📌|pushpin|pin
📍|round_pushpin|location
📎|paperclip|
✂️|scissors|cut
📚|books|
📖|book|read
📰|newspaper|news
🔖|bookmark|
🗓️|spiral_calendar|
📅|date|calendar
⏰|alarm_clock|
⏳|hourglass_flowing_sand|wait
🔍|mag|search
🔎|mag_right|search
🏷️|label|tag
✅|white_check_mark|done check yes
❌|x|no wrong cross
❓|question|
❗|exclamation|
⚠️|warning|caution
🚫|no_entry_sign|forbidden
♻️|recycle|
✔️|heavy_check_mark|check
➕|heavy_plus_sign|plus add
➖|heavy_minus_sign|minus
➡️|arrow_right|
⬅️|arrow_left|
⬆️|arrow_up|
⬇️|arrow_down|
🔄|arrows_counterclockwise|refresh
🔁|repeat|loop
▶️|arrow_forward|play
⏸️|pause_button|pause
⏹️|stop_button|stop
🔀|twisted_rightwards_arrows|shuffle
🔔|bell|notification
🔕|no_bell|mute
🏳️|white_flag|surrender
🏁|checkered_flag|finish race
🚩|triangular_flag_on_post|red flag
🎉|tada|party celebrate congrats
🎊|confetti_ball|party
🎈|balloon|party
🎁|gift|present
🎀|ribbon|bow
🏅|medal_sports|
🧨|firecracker|
🎃|jack_o_lantern|halloween pumpkin
🎆|fireworks|
🕹️|joystick|game
🃏|black_joker|card
🎟️|tickets|
🧵|thread|
🪄|magic_wand|
🧊|ice_cube|cold
🪐|ringed_planet|saturn
`)

// ---------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------

function search (
    data:EmojiEntry[],
    query:string,
    limit:number,
):EmojiEntry[] {
    const q = query.toLowerCase()
    const starts:EmojiEntry[] = []
    const contains:EmojiEntry[] = []
    const keyword:EmojiEntry[] = []

    for (const e of data) {
        const name = e.name.toLowerCase()
        if (name.startsWith(q)) starts.push(e)
        else if (name.includes(q)) contains.push(e)
        else if (e.keywords?.some(k => k.toLowerCase().startsWith(q))) {
            keyword.push(e)
        }
        if (starts.length >= limit) break
    }

    return [...starts, ...contains, ...keyword].slice(0, limit)
}

// ---------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------

const STYLE_ID = 'emoji-search-styles'

const STYLES = `
emoji-search { display: contents; }

.emoji-search__list {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: var(--emoji-search-padding, 4px);
    min-width: var(--emoji-search-min-width, 220px);
    max-width: var(--emoji-search-max-width, 320px);
    border: 1px solid var(--emoji-search-border, #d0d0d0);
    border-radius: var(--emoji-search-radius, 8px);
    background: var(--emoji-search-bg, #fff);
    color: var(--emoji-search-fg, #111);
    box-shadow: var(--emoji-search-shadow, 0 8px 24px rgba(0,0,0,.18));
    font: var(--emoji-search-font, 14px/1.3 system-ui, sans-serif);
    overflow: hidden;
}
.emoji-search__list::backdrop { display: none; }

.emoji-search__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: var(--emoji-search-item-radius, 5px);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}
.emoji-search__item[aria-selected="true"] {
    background: var(--emoji-search-active-bg, #e8e8e8);
    color: var(--emoji-search-active-fg, inherit);
}
.emoji-search__glyph {
    font-size: 1.3em;
    width: 1.5em;
    text-align: center;
    flex: none;
}
.emoji-search__name {
    overflow: hidden;
    text-overflow: ellipsis;
}
.emoji-search__name b {
    font-weight: 600;
    color: var(--emoji-search-match, inherit);
}
.emoji-search__empty {
    padding: 8px 10px;
    opacity: .6;
}
`

let sheet:CSSStyleSheet|null = null

/** Inject styles once per root (document or a host shadow root). */
function ensureStyles (root:Document|ShadowRoot):void {
    if ('adoptedStyleSheets' in root) {
        if (!sheet) {
            sheet = new CSSStyleSheet()
            sheet.replaceSync(STYLES)
        }
        if (!root.adoptedStyleSheets.includes(sheet)) {
            root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
        }
        return
    }
    const r = root as Document|ShadowRoot
    if (r.querySelector(`#${STYLE_ID}`)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = STYLES
    ;(r instanceof Document ? r.head : r).append(style)
}

export class EmojiSearch extends HTMLElement {
    static TAG = 'emoji-search'

    static define (tag = EmojiSearch.TAG):void {
        if (!customElements.get(tag)) customElements.define(tag, EmojiSearch)
    }

    /** Emoji dataset. Replace with a full list if you like. */
    emojis:EmojiEntry[] = DEFAULT_EMOJIS
    /** Characters after `:` before the popover opens. */
    minChars = 2
    /** Max rows to show. */
    maxResults = 8

    private field:Field|null = null
    private list:HTMLElement
    private results:EmojiEntry[] = []
    private index = 0
    private query = ''
    private range:{ start:number; end:number }|null = null
    private observer:MutationObserver|null = null

    private uid = `emoji-search-${Math.random().toString(36).slice(2, 8)}`

    constructor () {
        super()
        const list = document.createElement('div')
        list.className = 'emoji-search__list'
        list.setAttribute('popover', 'manual')
        list.setAttribute('role', 'listbox')
        list.id = `${this.uid}-list`
        this.list = list

        list.addEventListener('pointerdown', ev => ev.preventDefault())  // keep focus
        list.addEventListener('click', ev => {
            const row = (ev.target as HTMLElement)
                .closest<HTMLElement>('.emoji-search__item')
            if (!row) return
            this.index = Number(row.dataset.index)
            this.commit()
        })
        list.addEventListener('pointermove', ev => {
            const row = (ev.target as HTMLElement)
                .closest<HTMLElement>('.emoji-search__item')
            if (!row) return
            const i = Number(row.dataset.index)
            if (i !== this.index) { this.index = i; this.paintSelection() }
        })
    }

    connectedCallback ():void {
        const root = this.getRootNode() as Document|ShadowRoot
        ensureStyles(root)
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

EmojiSearch.define()

declare global {
    interface HTMLElementTagNameMap {
        'emoji-search':EmojiSearch;
    }
    interface HTMLElementEventMap {
        'emoji-select':CustomEvent<EmojiSelectDetail>;
    }
}
