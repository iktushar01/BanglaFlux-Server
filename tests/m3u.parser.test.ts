import { describe, expect, it } from "vitest";
import { mapGroupTitleToCategory, parseM3U, isValidStreamUrl, extractStreamUrl } from "../src/app/module/playlist/m3u.parser";
import { ChannelCategory } from "../src/app/lib/prisma-exports";

describe("m3u.parser", () => {
    it("parses EXTINF with group-title and tvg-logo", () => {
        const content = `#EXTM3U
#EXTINF:-1 group-title="Sports" tvg-logo="https://example.com/logo.jpg", BTV NS
http://180.94.28.28:8097/BTV/index.m3u8
`;

        const { channels, invalid } = parseM3U(content);
        expect(channels).toHaveLength(1);
        expect(channels[0].name).toBe("BTV NS");
        expect(channels[0].category).toBe(ChannelCategory.SPORTS);
        expect(channels[0].logo).toBe("https://example.com/logo.jpg");
        expect(invalid).toBe(0);
    });

    it("skips duplicate URLs within file", () => {
        const content = `#EXTM3U
#EXTINF:-1, Channel A
http://example.com/stream.m3u8
#EXTINF:-1, Channel B
http://example.com/stream.m3u8
`;

        const { channels } = parseM3U(content);
        expect(channels).toHaveLength(1);
    });

    it("maps unknown group to OTHER", () => {
        expect(mapGroupTitleToCategory("Unknown")).toBe(ChannelCategory.OTHER);
        expect(mapGroupTitleToCategory()).toBe(ChannelCategory.OTHER);
    });

    it("validates stream URLs", () => {
        expect(isValidStreamUrl("http://example.com/a.m3u8")).toBe(true);
        expect(isValidStreamUrl("not-a-url")).toBe(false);
    });

    it("extracts URL from line with trailing notes", () => {
        const line =
            "https://example.com/live/stream.m3u8?token=abc (quality increase option)";
        expect(extractStreamUrl(line)).toBe("https://example.com/live/stream.m3u8?token=abc");
    });

    it("parses full playlist file with expected channel count", () => {
        const fs = require("node:fs");
        const path = require("node:path");
        const file = path.resolve(__dirname, "../scripts/banglaflux.m3u");
        if (!fs.existsSync(file)) return;

        const content = fs.readFileSync(file, "utf-8");
        const { channels } = parseM3U(content);
        expect(channels.length).toBeGreaterThan(140);
    });
});
