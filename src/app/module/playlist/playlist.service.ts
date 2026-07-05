import axios from "axios";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ChannelCategory, PlaylistSourceType } from "../../lib/prisma-exports";
import { parseM3U } from "./m3u.parser";

export interface ImportPlaylistPayload {
    title: string;
    rawContent: string;
    sourceType: PlaylistSourceType;
}

export interface ImportPlaylistResult {
    playlistId: string;
    imported: number;
    skipped: number;
    invalid: number;
    total: number;
}

const importChannels = async (
    playlistId: string,
    channels: ReturnType<typeof parseM3U>["channels"],
): Promise<{ imported: number; skipped: number }> => {
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
                    playlistId,
                },
            });
            imported++;
        } catch (error: unknown) {
            const prismaError = error as { code?: string };
            if (prismaError.code === "P2002") {
                skipped++;
            } else {
                throw error;
            }
        }
    }

    return { imported, skipped };
};

const importFromContent = async (payload: ImportPlaylistPayload): Promise<ImportPlaylistResult> => {
    const trimmed = payload.rawContent.trim();
    if (!trimmed.includes("#EXTM3U") && !trimmed.includes("#EXTINF")) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid M3U content");
    }

    const { channels, invalid } = parseM3U(trimmed);

    const playlist = await prisma.playlist.create({
        data: {
            title: payload.title,
            sourceType: payload.sourceType,
            rawContent: trimmed,
        },
    });

    const { imported, skipped } = await importChannels(playlist.id, channels);

    return {
        playlistId: playlist.id,
        imported,
        skipped,
        invalid,
        total: channels.length,
    };
};

const importFromUpload = async (title: string, fileBuffer: Buffer): Promise<ImportPlaylistResult> => {
    const rawContent = fileBuffer.toString("utf-8");
    return importFromContent({
        title,
        rawContent,
        sourceType: PlaylistSourceType.UPLOAD,
    });
};

const importFromUrl = async (title: string, url: string): Promise<ImportPlaylistResult> => {
    let response;
    try {
        response = await axios.get<string>(url, {
            timeout: 30000,
            responseType: "text",
            headers: { Accept: "application/vnd.apple.mpegurl, text/plain, */*" },
            maxContentLength: 5 * 1024 * 1024,
        });
    } catch {
        throw new AppError(StatusCodes.BAD_REQUEST, "Failed to fetch M3U from URL");
    }

    const rawContent = response.data;
    if (!rawContent || typeof rawContent !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Empty or invalid response from URL");
    }

    return importFromContent({
        title,
        rawContent,
        sourceType: PlaylistSourceType.URL,
    });
};

export const PlaylistService = {
    importFromUpload,
    importFromUrl,
};
