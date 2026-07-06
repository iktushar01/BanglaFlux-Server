import { ChannelCategory } from "../../lib/prisma-exports";

export interface ParsedChannel {
    name: string;
    url: string;
    logo?: string;
    category: ChannelCategory;
}

export interface ParseM3UResult {
    channels: ParsedChannel[];
    invalid: number;
}

const GROUP_TITLE_REGEX = /group-title="([^"]*)"/i;
const TVG_LOGO_REGEX = /tvg-logo="([^"]*)"/i;

const CATEGORY_MAP: Record<string, ChannelCategory> = {
    sports: ChannelCategory.SPORTS,
    "live sports": ChannelCategory.SPORTS,
    world_cup: ChannelCategory.SPORTS,
    "football world cup 2026": ChannelCategory.SPORTS,
    "fifa world cup 2026": ChannelCategory.SPORTS,
    fancode: ChannelCategory.SPORTS,
    toffee: ChannelCategory.SPORTS,
    football: ChannelCategory.SPORTS,
    movies: ChannelCategory.MOVIES,
    "movies - bangla": ChannelCategory.MOVIES,
    "movies - english": ChannelCategory.MOVIES,
    "hindi movies": ChannelCategory.MOVIES,
    "english movie": ChannelCategory.MOVIES,
    "english movies": ChannelCategory.MOVIES,
    "bangla movies": ChannelCategory.MOVIES,
    "kolkata bangla movies": ChannelCategory.MOVIES,
    "hindi dabbing movies": ChannelCategory.MOVIES,
    goldmines: ChannelCategory.MOVIES,
    news: ChannelCategory.NEWS,
    "english news": ChannelCategory.NEWS,
    "international news": ChannelCategory.NEWS,
    "bangla news": ChannelCategory.NEWS,
    "news internasional": ChannelCategory.NEWS,
    "news internasional tv": ChannelCategory.NEWS,
    "indian bangla news": ChannelCategory.NEWS,
    "bangladeshi news 🇧🇩": ChannelCategory.NEWS,
    entertainment: ChannelCategory.ENTERTAINMENT,
    "indian-bangla": ChannelCategory.ENTERTAINMENT,
    "indian bangla": ChannelCategory.ENTERTAINMENT,
    "kolkata bangla": ChannelCategory.ENTERTAINMENT,
    "sm all tv": ChannelCategory.ENTERTAINMENT,
    india: ChannelCategory.ENTERTAINMENT,
    indian: ChannelCategory.ENTERTAINMENT,
    hindi: ChannelCategory.ENTERTAINMENT,
    pakistan: ChannelCategory.ENTERTAINMENT,
    "akash go": ChannelCategory.ENTERTAINMENT,
    music: ChannelCategory.MUSIC,
    "bangla music": ChannelCategory.MUSIC,
    "hindi music": ChannelCategory.MUSIC,
    "kolkata bangla music": ChannelCategory.MUSIC,
    "fm-radio": ChannelCategory.MUSIC,
    "fm redio": ChannelCategory.MUSIC,
    "radio fm": ChannelCategory.MUSIC,
    cartoon: ChannelCategory.CARTOON,
    kids: ChannelCategory.CARTOON,
    "cartoon drama": ChannelCategory.CARTOON,
    "cartoons | 24/7": ChannelCategory.CARTOON,
    bangladesh: ChannelCategory.BANGLADESH,
    bangla: ChannelCategory.BANGLADESH,
    "bangladeshi 🇧🇩": ChannelCategory.BANGLADESH,
    "bangladeshi iptv 🇧🇩": ChannelCategory.BANGLADESH,
    "bd.bang.ch ( bdix )": ChannelCategory.BANGLADESH,
    documentary: ChannelCategory.DOCUMENTARY,
    series: ChannelCategory.SERIES,
};

const mapGroupTitleByKeywords = (normalized: string): ChannelCategory | null => {
    if (/sport|football|world.?cup|fifa|fancode|toffee|cricket/.test(normalized)) {
        return ChannelCategory.SPORTS;
    }
    if (/movie|goldmines/.test(normalized)) {
        return ChannelCategory.MOVIES;
    }
    if (/news|internasional/.test(normalized)) {
        return ChannelCategory.NEWS;
    }
    if (/cartoon|kids/.test(normalized)) {
        return ChannelCategory.CARTOON;
    }
    if (/music|\bfm\b|radio/.test(normalized)) {
        return ChannelCategory.MUSIC;
    }
    if (/documentary/.test(normalized)) {
        return ChannelCategory.DOCUMENTARY;
    }
    if (/series/.test(normalized) && !/cartoon/.test(normalized)) {
        return ChannelCategory.SERIES;
    }
    if (/bangla|bangladesh|bdix/.test(normalized) && !/news|movie|music/.test(normalized)) {
        return ChannelCategory.BANGLADESH;
    }
    if (/entertain|indian|hindi|kolkata|india|pakistan/.test(normalized)) {
        return ChannelCategory.ENTERTAINMENT;
    }
    return null;
};

export const mapGroupTitleToCategory = (groupTitle?: string): ChannelCategory => {
    if (!groupTitle?.trim()) {
        return ChannelCategory.OTHER;
    }

    const normalized = groupTitle.trim().toLowerCase();
    return (
        CATEGORY_MAP[normalized] ??
        mapGroupTitleByKeywords(normalized) ??
        ChannelCategory.OTHER
    );
};

export const isValidStreamUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

/** Pull the first http(s) URL from a line (handles trailing notes like "(quality increase option)"). */
export const extractStreamUrl = (line: string): string | null => {
    const match = line.match(/https?:\/\/[^\s]+/i);
    if (!match) return null;

    let url = match[0].replace(/[.,;:]+$/, "");
    if (!isValidStreamUrl(url)) return null;
    return url;
};

const parseExtInfLine = (line: string): { name: string; logo?: string; groupTitle?: string } | null => {
    const groupMatch = line.match(GROUP_TITLE_REGEX);
    const logoMatch = line.match(TVG_LOGO_REGEX);
    const groupTitle = groupMatch?.[1];
    const logo = logoMatch?.[1]?.trim() || undefined;

    const commaIndex = line.lastIndexOf(",");
    if (commaIndex === -1) {
        return null;
    }

    const name = line.slice(commaIndex + 1).trim();
    if (!name) {
        return null;
    }

    return { name, ...(logo ? { logo } : {}), ...(groupTitle ? { groupTitle } : {}) };
};

export const parseM3U = (content: string): ParseM3UResult => {
    const lines = content.split(/\r?\n/);
    const channels: ParsedChannel[] = [];
    const seenUrls = new Set<string>();
    let invalid = 0;

    let pending: { name: string; logo?: string; groupTitle?: string } | null = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith("#EXTM3U")) continue;
        if (line.startsWith("#") && !line.startsWith("#EXTINF")) continue;

        if (line.startsWith("#EXTINF")) {
            pending = parseExtInfLine(line);
            if (!pending) invalid++;
            continue;
        }

        if (!pending) {
            if (!line.startsWith("#")) invalid++;
            continue;
        }

        const url = extractStreamUrl(line);
        if (!url) {
            invalid++;
            pending = null;
            continue;
        }

        const normalizedUrl = url.toLowerCase();
        if (seenUrls.has(normalizedUrl)) {
            pending = null;
            continue;
        }

        seenUrls.add(normalizedUrl);
        channels.push({
            name: pending.name,
            url,
            category: mapGroupTitleToCategory(pending.groupTitle),
            ...(pending.logo ? { logo: pending.logo } : {}),
        });
        pending = null;
    }

    if (pending) invalid++;

    return { channels, invalid };
};
