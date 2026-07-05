import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { FavoriteService } from "./favorite.service";
import { IRequestUser } from "../auth/auth.interface";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await FavoriteService.toggleFavorite(user.userId, req.params.channelId as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.favorited ? "Added to favorites" : "Removed from favorites",
        data: result,
    });
});

const getFavorites = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const favorites = await FavoriteService.getFavorites(user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Favorites retrieved successfully",
        data: favorites,
    });
});

export const FavoriteController = {
    toggleFavorite,
    getFavorites,
};
