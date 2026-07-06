import { prisma } from "../lib/prisma";
import { PlaylistSourceType } from "../lib/prisma-exports";
import {
    DEFAULT_PLAYLIST_M3U_URL,
    DEFAULT_PLAYLIST_TITLE,
    fetchM3UContent,
} from "../module/playlist/playlist-fetch";
import { parseM3U } from "../module/playlist/m3u.parser";

const getPlaylistUrl = () => process.env.PLAYLIST_M3U_URL?.trim() || DEFAULT_PLAYLIST_M3U_URL;

const shouldReplaceExisting = async (expectedCount: number): Promise<boolean> => {
    if (process.env.PLAYLIST_FORCE_REFRESH === "true") {
        return true;
    }

    const synced = await prisma.playlist.findFirst({
        where: {
            title: DEFAULT_PLAYLIST_TITLE,
            sourceType: PlaylistSourceType.URL,
        },
        include: { _count: { select: { channels: true } } },
        orderBy: { createdAt: "desc" },
    });

    if (!synced) {
        return true;
    }

    return Math.abs(synced._count.channels - expectedCount) > 5;
};

export const seedSamplePlaylist = async () => {
    try {
        const url = getPlaylistUrl();
        console.log(`Fetching playlist from ${url}...`);

        const rawContent = await fetchM3UContent(url);
        const { channels, invalid } = parseM3U(rawContent);

        if (channels.length === 0) {
            console.warn("LiveTV playlist parsed zero channels. Skipping seed.");
            return;
        }

        const replace = await shouldReplaceExisting(channels.length);
        if (!replace) {
            const total = await prisma.channel.count();
            console.log(
                `LiveTV playlist up to date (${total}/${channels.length} channels). Skipping seed.`,
            );
            return;
        }

        console.log(
            `Syncing LiveTV playlist: ${channels.length} channels (${invalid} invalid lines)...`,
        );

        await prisma.channel.deleteMany();
        await prisma.playlist.deleteMany();

        const playlist = await prisma.playlist.create({
            data: {
                title: DEFAULT_PLAYLIST_TITLE,
                sourceType: PlaylistSourceType.URL,
                rawContent,
            },
        });

        let imported = 0;
        let skipped = 0;

        for (const channel of channels) {
            try {
                await prisma.channel.create({
                    data: {
                        name: channel.name,
                        url: channel.url,
                        logo: channel.logo ?? null,
                        category: channel.category,
                        playlistId: playlist.id,
                    },
                });
                imported++;
            } catch (error: unknown) {
                const prismaError = error as { code?: string };
                if (prismaError.code === "P2002") skipped++;
                else throw error;
            }
        }

        const total = await prisma.channel.count();
        console.log(
            `LiveTV playlist sync: ${imported} imported, ${skipped} skipped, ${total} total channels.`,
        );
    } catch (error) {
        console.error("Error seeding LiveTV playlist:", error);
    }
};
