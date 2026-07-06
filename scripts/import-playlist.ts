import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";
import { PlaylistSourceType } from "../src/app/lib/prisma-exports";
import {
    DEFAULT_PLAYLIST_M3U_URL,
    DEFAULT_PLAYLIST_TITLE,
    fetchM3UContent,
} from "../src/app/module/playlist/playlist-fetch";
import { bulkImportChannels } from "../src/app/module/playlist/playlist-import";
import { parseM3U } from "../src/app/module/playlist/m3u.parser";

async function main() {
    const url = process.env.PLAYLIST_M3U_URL?.trim() || DEFAULT_PLAYLIST_M3U_URL;

    console.log(`Fetching playlist from ${url}...`);
    const rawContent = await fetchM3UContent(url);
    const { channels, invalid } = parseM3U(rawContent);

    console.log(`Parsed ${channels.length} channels (${invalid} invalid/skipped lines)`);

    await prisma.channel.deleteMany();
    await prisma.playlist.deleteMany();

    const playlist = await prisma.playlist.create({
        data: {
            title: DEFAULT_PLAYLIST_TITLE,
            sourceType: PlaylistSourceType.URL,
            rawContent,
        },
    });

    const imported = await bulkImportChannels(playlist.id, channels);
    const total = await prisma.channel.count();
    console.log(`Import done: ${imported} imported, ${total} total in DB`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
