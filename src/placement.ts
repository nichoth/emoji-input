export interface AnchorRect {
    top:number;
    left:number;
    height:number;
}

export interface Size {
    width:number;
    height:number;
}

export interface Position {
    top:number;
    left:number;
}

export function placePopover (
    anchor:AnchorRect,
    panel:Size,
    viewport:Size,
    gap:number,
):Position {
    let left = anchor.left
    let top = anchor.top + anchor.height + gap

    if (left + panel.width > viewport.width - gap) {
        left = Math.max(gap, viewport.width - panel.width - gap)
    }

    if (top + panel.height > viewport.height - gap) {
        top = Math.max(gap, anchor.top - panel.height - gap)
    }

    return { top, left }
}
