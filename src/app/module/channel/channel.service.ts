import { StatusCodes } from "http-status-codes";
import type { Prisma } from "../../../generated/prisma/index";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ChannelCategory } from "../../lib/prisma-exports";

export interface ChannelQuery {
    category?: ChannelCategory;
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    activeOnly?: boolean;
}

const buildWhere = (query: ChannelQuery): Prisma.ChannelWhereInput => {
    const where: Prisma.ChannelWhereInput = {};

    if (query.activeOnly) {
        where.isActive = true;
    } else if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }

    if (query.category) {
        where.category = query.category;
    }

    if (query.search?.trim()) {
        where.name = { contains: query.search.trim(), mode: "insensitive" };
    }

    return where;
};

const getChannels = async (query: ChannelQuery) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;
    const skip = (page - 1) * limit;
    const where = buildWhere(query);

    const [data, total] = await Promise.all([
        prisma.channel.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.channel.count({ where }),
    ]);

    return {
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
};

const getChannelById = async (id: string, activeOnly = true) => {
    const channel = await prisma.channel.findUnique({ where: { id } });

    if (!channel) {
        throw new AppError(StatusCodes.NOT_FOUND, "Channel not found");
    }

    if (activeOnly && !channel.isActive) {
        throw new AppError(StatusCodes.NOT_FOUND, "Channel not found");
    }

    return channel;
};

const createChannel = async (payload: {
    name: string;
    url: string;
    logo?: string;
    category?: ChannelCategory;
    isActive?: boolean;
}) => {
    try {
        return await prisma.channel.create({
            data: {
                name: payload.name,
                url: payload.url,
                logo: payload.logo || null,
                category: payload.category ?? ChannelCategory.OTHER,
                isActive: payload.isActive ?? true,
            },
        });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2002") {
            throw new AppError(StatusCodes.CONFLICT, "A channel with this URL already exists");
        }
        throw error;
    }
};

const updateChannel = async (
    id: string,
    payload: Partial<{
        name: string;
        url: string;
        logo?: string;
        category: ChannelCategory;
        isActive: boolean;
    }>,
) => {
    await getChannelById(id, false);

    try {
        return await prisma.channel.update({
            where: { id },
            data: {
                ...(payload.name !== undefined && { name: payload.name }),
                ...(payload.url !== undefined && { url: payload.url }),
                ...(payload.logo !== undefined && { logo: payload.logo || null }),
                ...(payload.category !== undefined && { category: payload.category }),
                ...(payload.isActive !== undefined && { isActive: payload.isActive }),
            },
        });
    } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === "P2002") {
            throw new AppError(StatusCodes.CONFLICT, "A channel with this URL already exists");
        }
        throw error;
    }
};

const deleteChannel = async (id: string) => {
    await getChannelById(id, false);
    await prisma.channel.delete({ where: { id } });
};

const toggleChannelActive = async (id: string) => {
    const channel = await getChannelById(id, false);
    return prisma.channel.update({
        where: { id },
        data: { isActive: !channel.isActive },
    });
};

const getStats = async () => {
    const [total, active, inactive] = await Promise.all([
        prisma.channel.count(),
        prisma.channel.count({ where: { isActive: true } }),
        prisma.channel.count({ where: { isActive: false } }),
    ]);

    return { total, active, inactive, playlists: await prisma.playlist.count() };
};

export const ChannelService = {
    getChannels,
    getChannelById,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannelActive,
    getStats,
};
