import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { PlaylistSourceType } from "../lib/prisma-exports";
import { parseM3U } from "../module/playlist/m3u.parser";

const M3U_PATH = path.resolve(process.cwd(), "scripts/banglaflux.m3u");

export const seedSamplePlaylist = async () => {
  try {
    if (!fs.existsSync(M3U_PATH)) {
      console.log("No scripts/banglaflux.m3u found. Skipping playlist seed.");
      return;
    }

    const rawContent = fs.readFileSync(M3U_PATH, "utf-8");
    const { channels, invalid } = parseM3U(rawContent);

    if (channels.length === 0) {
      console.warn("banglaflux.m3u parsed zero channels. Skipping seed.");
      return;
    }

    const existing = await prisma.channel.count();
    if (existing >= channels.length) {
      console.log(
        `Channels up to date (${existing}/${channels.length} in playlist). Skipping seed.`,
      );
      return;
    }

    console.log(
      `Importing playlist: ${existing} in DB, ${channels.length} in file (${invalid} invalid lines)...`,
    );

    const playlist = await prisma.playlist.create({
      data: {
        title: "BanglaFlux Full Playlist",
        sourceType: PlaylistSourceType.UPLOAD,
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
      `Playlist seed: ${imported} new, ${skipped} skipped, ${total} total channels.`,
    );
  } catch (error) {
    console.error("Error seeding sample playlist:", error);
  }
};
