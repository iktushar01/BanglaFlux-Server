import { prisma } from "../../lib/prisma";
import type { ParsedChannel } from "./m3u.parser";

const BATCH_SIZE = 500;

export const bulkImportChannels = async (
    playlistId: string,
    channels: ParsedChannel[],
): Promise<number> => {
    let imported = 0;

    for (let i = 0; i < channels.length; i += BATCH_SIZE) {
        const batch = channels.slice(i, i + BATCH_SIZE);
        const result = await prisma.channel.createMany({
            data: batch.map((channel) => ({
                name: channel.name,
                url: channel.url,
                logo: channel.logo ?? null,
                category: channel.category,
                playlistId,
            })),
            skipDuplicates: true,
        });
        imported += result.count;
    }

    return imported;
};
