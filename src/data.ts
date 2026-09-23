import emojiData from '@emoji-mart/data/sets/15/native.json' with { type:'json' }

type EmojiMartSkin = {
    readonly unified:string;
    readonly native:string;
}

type EmojiMartRecord = {
    readonly id:string;
    readonly name:string;
    readonly keywords:Array<string>;
    readonly skins:Array<EmojiMartSkin>;
}

type EmojiMartCategory = {
    readonly id:string;
    readonly emojis:Array<string>;
}

type EmojiMartData = {
    readonly categories:Array<EmojiMartCategory>;
    readonly emojis:Record<string, EmojiMartRecord>;
}

export type EmojiSkin = EmojiMartSkin&{
    readonly tone:number;
}

export type EmojiEntry = {
    readonly emoji:string;
    readonly name:string;
    readonly keywords?:Array<string>;
    readonly label?:string;
    readonly category?:string|null;
    readonly categories?:Array<string>;
    readonly skins?:Array<EmojiSkin>;
    readonly variants?:Array<EmojiSkin>;
}

const data = emojiData as unknown as EmojiMartData

function categoryMap (
    categories:ReadonlyArray<EmojiMartCategory>,
):Map<string, Array<string>> {
    const result = new Map<string, Array<string>>()
    for (const category of categories) {
        for (const id of category.emojis) {
            const existing = result.get(id) ?? []
            existing.push(category.id)
            result.set(id, existing)
        }
    }
    return result
}

function adaptSkin (skin:EmojiMartSkin, index:number):EmojiSkin {
    return {
        unified:skin.unified,
        native:skin.native,
        tone:index,
    }
}

function adaptEmoji (
    record:EmojiMartRecord,
    categories:ReadonlyMap<string, Array<string>>,
):EmojiEntry {
    const categoryNames = categories.get(record.id) ?? []
    const skins = record.skins.map(adaptSkin)
    return {
        emoji:skins[0]?.native ?? '',
        name:record.id,
        keywords:[...record.keywords],
        label:record.name,
        category:categoryNames[0] ?? null,
        categories:[...categoryNames],
        skins,
        variants:skins,
    }
}

const categories = categoryMap(data.categories)

export const DEFAULT_EMOJIS:Array<EmojiEntry> = Object.values(data.emojis)
    .map(record => adaptEmoji(record, categories))
