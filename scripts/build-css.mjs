import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'src')
const dist = resolve(root, 'dist')

const files = ['index.css', 'picker.css', 'button.css']

for (const file of files) {
    copyFileSync(resolve(src, file), resolve(dist, file))
}

const combined = files
    .map(f => readFileSync(resolve(src, f), 'utf8'))
    .join('\n')

writeFileSync(resolve(dist, 'emoji-input.css'), combined)

const { code } = transform({
    filename: 'emoji-input.css',
    code: Buffer.from(combined),
    minify: true,
})

writeFileSync(resolve(dist, 'emoji-input.min.css'), code)
