import { test } from '@substrate-system/tapzero'
import { waitFor } from '@substrate-system/dom'

test('example', async t => {
    t.plan(2)
    t.ok('ok', 'should be an example')
    document.body.innerHTML += '<div></div>'
    t.ok(await waitFor('div'), 'a div exists')
})
