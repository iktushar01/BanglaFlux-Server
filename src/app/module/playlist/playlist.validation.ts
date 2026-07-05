import { z } from "zod";
import { ChannelCategory } from "../../lib/prisma-exports";

export const importPlaylistUrlSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    url: z.string().url("Valid M3U URL is required"),
});

export const importPlaylistUploadSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
});

export const createChannelSchema = z.object({
    name: z.string().min(1).max(200),
    url: z.string().url(),
    logo: z.string().url().optional().or(z.literal("")),
    category: z.nativeEnum(ChannelCategory).optional(),
    isActive: z.boolean().optional(),
});

export const updateChannelSchema = createChannelSchema.partial();

export const channelQuerySchema = z.object({
    category: z.nativeEnum(ChannelCategory).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(24),
    isActive: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === "true")),
});

export const channelIdParamSchema = z.object({
    id: z.string().min(1),
});
