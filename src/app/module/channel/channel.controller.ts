import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ChannelService } from "../channel/channel.service";

const getChannels = catchAsync(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const result = await ChannelService.getChannels({
        category: req.query.category as any,
        ...(search ? { search } : {}),
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 24,
        activeOnly: true,
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channels retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getChannelById = catchAsync(async (req: Request, res: Response) => {
    const channel = await ChannelService.getChannelById(req.params.id as string, true);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channel retrieved successfully",
        data: channel,
    });
});

export const ChannelController = {
    getChannels,
    getChannelById,
};
