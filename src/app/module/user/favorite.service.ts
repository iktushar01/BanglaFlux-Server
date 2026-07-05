import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const toggleFavorite = async (userId: string, channelId: string) => {
    const channel = await prisma.channel.findFirst({
        where: { id: channelId, isActive: true },
    });

    if (!channel) {
        throw new AppError(StatusCodes.NOT_FOUND, "Channel not found");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { favorites: { where: { id: channelId } } },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const isFavorited = user.favorites.length > 0;

    if (isFavorited) {
        await prisma.user.update({
            where: { id: userId },
            data: { favorites: { disconnect: { id: channelId } } },
        });
        return { favorited: false, channelId };
    }

    await prisma.user.update({
        where: { id: userId },
        data: { favorites: { connect: { id: channelId } } },
    });

    return { favorited: true, channelId };
};

const getFavorites = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            favorites: {
                where: { isActive: true },
                orderBy: { name: "asc" },
            },
        },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user.favorites;
};

const getFavoriteIds = async (userId: string): Promise<string[]> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { favorites: { select: { id: true } } },
    });

    return user?.favorites.map((f) => f.id) ?? [];
};

export const FavoriteService = {
    toggleFavorite,
    getFavorites,
    getFavoriteIds,
};
