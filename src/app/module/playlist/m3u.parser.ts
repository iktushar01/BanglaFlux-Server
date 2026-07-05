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
    movies: ChannelCategory.MOVIES,
    news: ChannelCategory.NEWS,
    entertainment: ChannelCategory.ENTERTAINMENT,
    music: ChannelCategory.MUSIC,
    cartoon: ChannelCategory.CARTOON,
    bangladesh: ChannelCategory.BANGLADESH,
    documentary: ChannelCategory.DOCUMENTARY,
    series: ChannelCategory.SERIES,
};

export const mapGroupTitleToCategory = (groupTitle?: string): ChannelCategory => {
    if (!groupTitle?.trim()) {
        return ChannelCategory.OTHER;
    }
    return CATEGORY_MAP[groupTitle.trim().toLowerCase()] ?? ChannelCategory.OTHER;
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
