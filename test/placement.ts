import { test } from '@substrate-system/tapzero'
import { placePopover } from '../src/placement.js'

test('placePopover positions below anchor when there is room', t => {
    const result = placePopover(
        { top:100, left:50, height:20 },
        { width:200, height:150 },
        { width:800, height:600 },
        4,
    )
    t.equal(result.top, 124, 'top = anchor.top + anchor.height + gap')
    t.equal(result.left, 50, 'left = anchor.left')
})

test('placePopover flips above anchor when no room below', t => {
    const result = placePopover(
        { top:500, left:50, height:20 },
        { width:200, height:150 },
        { width:800, height:600 },
        4,
    )
    t.equal(
        result.top, 346,
        'top = anchor.top - panel.height - gap'
    )
})

test('placePopover clamps left when panel overflows right edge', t => {
    const result = placePopover(
        { top:100, left:700, height:20 },
        { width:200, height:150 },
        { width:800, height:600 },
        4,
    )
    t.equal(
        result.left, 596,
        'left = viewport.width - panel.width - gap'
    )
})

test('placePopover clamps left to gap minimum', t => {
    const result = placePopover(
        { top:100, left:2, height:20 },
        { width:900, height:150 },
        { width:800, height:600 },
        4,
    )
    t.equal(result.left, 4, 'left clamped to gap')
})

test('placePopover flips above and clamps to gap minimum', t => {
    const result = placePopover(
        { top:500, left:50, height:20 },
        { width:200, height:550 },
        { width:800, height:600 },
        4,
    )
    t.equal(result.top, 4, 'top clamped to gap when above')
})
