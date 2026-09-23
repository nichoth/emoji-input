import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let passed = 0
let failed = 0

async function test (name, fn) {
    try {
        await fn()
        passed++
        console.log(`  ok - ${name}`)
    } catch (err) {
        failed++
        console.log(`  not ok - ${name}`)
        console.log(`    ${err.message}`)
    }
}

console.log('TAP version 13')
console.log('# Node smoke tests')

// -- ESM imports --

await test(
    'ESM import of main entry succeeds',
    async () => {
        const mod = await import(
            resolve(root, 'dist/index.js')
        )
        assert.equal(typeof mod.EmojiInput, 'function')
        assert.equal(typeof mod.EmojiPicker, 'function')
        assert.equal(typeof mod.EmojiButton, 'function')
    },
)

await test(
    'ESM import of /picker succeeds',
    async () => {
        const mod = await import(
            resolve(root, 'dist/picker.js')
        )
        assert.equal(typeof mod.EmojiPicker, 'function')
    },
)

await test(
    'ESM import of /button succeeds',
    async () => {
        const mod = await import(
            resolve(root, 'dist/button.js')
        )
        assert.equal(typeof mod.EmojiButton, 'function')
    },
)

// -- CJS require --

await test(
    'CJS require of main entry succeeds',
    async () => {
        const mod = require(resolve(root, 'dist/index.cjs'))
        assert.equal(typeof mod.EmojiInput, 'function')
        assert.equal(typeof mod.EmojiPicker, 'function')
        assert.equal(typeof mod.EmojiButton, 'function')
    },
)

await test(
    'CJS require of /picker succeeds',
    async () => {
        const mod = require(resolve(root, 'dist/picker.cjs'))
        assert.equal(typeof mod.EmojiPicker, 'function')
    },
)

await test(
    'CJS require of /button succeeds',
    async () => {
        const mod = require(resolve(root, 'dist/button.cjs'))
        assert.equal(typeof mod.EmojiButton, 'function')
    },
)

// -- CSS export paths --

await test(
    'CSS files named in exports exist after build',
    async () => {
        const pkg = JSON.parse(
            (await import('node:fs'))
                .readFileSync(resolve(root, 'package.json'), 'utf8'),
        )
        const cssEntries = [
            './index.css',
            './picker.css',
            './button.css',
            './css',
            './css/min',
        ]
        for (const key of cssEntries) {
            const entry = pkg.exports[key]
            assert.ok(entry, `exports["${key}"] missing`)
            const target = typeof entry === 'string' ?
                entry :
                entry.default || entry.import
            assert.ok(target, `no target for exports["${key}"]`)
            const full = resolve(root, target)
            assert.ok(
                existsSync(full),
                `${target} does not exist`,
            )
        }
    },
)

await test(
    'CSS subpaths resolve via import.meta.resolve',
    async () => {
        const cssSubpaths = [
            '@substrate-system/emoji-input/index.css',
            '@substrate-system/emoji-input/picker.css',
            '@substrate-system/emoji-input/button.css',
            '@substrate-system/emoji-input/css',
            '@substrate-system/emoji-input/css/min',
        ]
        for (const specifier of cssSubpaths) {
            const resolved = import.meta.resolve(specifier)
            assert.ok(
                resolved,
                `import.meta.resolve("${specifier}") failed`,
            )
            const path = fileURLToPath(resolved)
            assert.ok(
                existsSync(path),
                `${specifier} resolved to ${path} which does not exist`,
            )
        }
    },
)

// -- Export shape --

await test(
    'main entry exports EmojiInput, EmojiPicker, EmojiButton',
    async () => {
        const mod = await import(
            resolve(root, 'dist/index.js')
        )
        assert.ok('EmojiInput' in mod)
        assert.ok('EmojiPicker' in mod)
        assert.ok('EmojiButton' in mod)
    },
)

await test(
    '/button subpath exports only EmojiButton',
    async () => {
        const mod = await import(
            resolve(root, 'dist/button.js')
        )
        assert.ok('EmojiButton' in mod)
        assert.ok(!('EmojiInput' in mod))
        assert.ok(!('EmojiPicker' in mod))
    },
)

console.log(`\n1..${passed + failed}`)
console.log(`# pass ${passed}`)
console.log(`# fail ${failed}`)

if (failed > 0) process.exit(1)
