import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PlaylistService } from "../playlist/playlist.service";
import AppError from "../../errorHelpers/AppError";

const uploadPlaylist = catchAsync(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const title = req.body.title as string;

    if (!file?.buffer) {
        throw new AppError(StatusCodes.BAD_REQUEST, "M3U file is required");
    }

    const result = await PlaylistService.importFromUpload(title, file.buffer);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Playlist imported successfully",
        data: result,
    });
});

const importPlaylistFromUrl = catchAsync(async (req: Request, res: Response) => {
    const { title, url } = req.body as { title: string; url: string };
    const result = await PlaylistService.importFromUrl(title, url);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Playlist imported successfully",
        data: result,
    });
});

export const PlaylistController = {
    uploadPlaylist,
    importPlaylistFromUrl,
};
