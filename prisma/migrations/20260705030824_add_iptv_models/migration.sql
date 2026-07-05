-- CreateEnum
CREATE TYPE "ChannelCategory" AS ENUM ('SPORTS', 'MOVIES', 'NEWS', 'ENTERTAINMENT', 'MUSIC', 'CARTOON', 'BANGLADESH', 'DOCUMENTARY', 'SERIES', 'OTHER');

-- CreateEnum
CREATE TYPE "PlaylistSourceType" AS ENUM ('UPLOAD', 'URL');

-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "PlaylistSourceType" NOT NULL,
    "rawContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "logo" TEXT,
    "category" "ChannelCategory" NOT NULL DEFAULT 'OTHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playlistId" TEXT,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserFavorites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserFavorites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "channel_url_key" ON "channel"("url");

-- CreateIndex
CREATE INDEX "channel_category_idx" ON "channel"("category");

-- CreateIndex
CREATE INDEX "channel_isActive_idx" ON "channel"("isActive");

-- CreateIndex
CREATE INDEX "_UserFavorites_B_index" ON "_UserFavorites"("B");

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavorites" ADD CONSTRAINT "_UserFavorites_A_fkey" FOREIGN KEY ("A") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavorites" ADD CONSTRAINT "_UserFavorites_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
