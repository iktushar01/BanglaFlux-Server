import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";
import { PlaylistSourceType } from "../src/app/lib/prisma-exports";
import { parseM3U } from "../src/app/module/playlist/m3u.parser";

const M3U_PATH =
  process.env.SAMPLE_M3U_PATH ??
  path.resolve(process.cwd(), "scripts/banglaflux.m3u");

async function main() {
  if (!fs.existsSync(M3U_PATH)) {
    console.error(`Playlist not found: ${M3U_PATH}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(M3U_PATH, "utf-8");
  const { channels, invalid } = parseM3U(rawContent);

  console.log(`Parsed ${channels.length} channels (${invalid} invalid/skipped lines)`);

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
  console.log(`Import done: ${imported} new, ${skipped} duplicates skipped, ${total} total in DB`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
