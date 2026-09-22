import type { EmojiEntry } from './data.js'

export function search (
    data:ReadonlyArray<EmojiEntry>,
    query:string,
    limit:number,
):Array<EmojiEntry> {
    const q = query.toLowerCase()
    const starts:Array<EmojiEntry> = []
    const contains:Array<EmojiEntry> = []
    const keyword:Array<EmojiEntry> = []

    for (const emoji of data) {
        const name = emoji.name.toLowerCase()
        if (name.startsWith(q)) starts.push(emoji)
        else if (name.includes(q)) contains.push(emoji)
        else if (emoji.keywords?.some(
            word => word.toLowerCase().startsWith(q),
        )) keyword.push(emoji)
    }

    return [...starts, ...contains, ...keyword].slice(0, limit)
}
