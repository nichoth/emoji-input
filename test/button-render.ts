import { test } from '@substrate-system/tapzero'
import { EmojiButton } from '../src/button.js'

test('EmojiButton.render returns a string', t => {
    const html = EmojiButton.render()
    t.equal(typeof html, 'string', 'returns a string')
})

test('EmojiButton.render contains a button element', t => {
    const html = EmojiButton.render()
    t.ok(html.includes('<button'), 'contains a button tag')
    t.ok(
        html.includes('type="button"'),
        'button type prevents form submission'
    )
})

test('EmojiButton.render has an accessible label', t => {
    const html = EmojiButton.render()
    t.ok(
        html.includes('aria-label="Open emoji picker"'),
        'has aria-label for the button'
    )
})

test('EmojiButton.render includes the smiley SVG', t => {
    const html = EmojiButton.render()
    t.ok(html.includes('<svg'), 'contains an SVG')
    t.ok(
        html.includes('fill="currentColor"'),
        'SVG uses currentColor'
    )
})

test('EmojiButton.render has the emoji-button class', t => {
    const html = EmojiButton.render()
    t.ok(
        html.includes('class="emoji-button"'),
        'button has the emoji-button class'
    )
})
