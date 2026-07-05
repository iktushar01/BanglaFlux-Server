import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ChannelService } from "../channel/channel.service";

const getAdminChannels = catchAsync(async (req: Request, res: Response) => {
    const isActiveParam = req.query.isActive as string | undefined;
    const isActive =
        isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
    const search = req.query.search as string | undefined;

    const result = await ChannelService.getChannels({
        category: req.query.category as any,
        ...(search ? { search } : {}),
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 24,
        ...(isActive !== undefined ? { isActive } : {}),
        activeOnly: false,
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channels retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const createChannel = catchAsync(async (req: Request, res: Response) => {
    const channel = await ChannelService.createChannel(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Channel created successfully",
        data: channel,
    });
});

const updateChannel = catchAsync(async (req: Request, res: Response) => {
    const channel = await ChannelService.updateChannel(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channel updated successfully",
        data: channel,
    });
});

const deleteChannel = catchAsync(async (req: Request, res: Response) => {
    await ChannelService.deleteChannel(req.params.id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channel deleted successfully",
    });
});

const toggleChannel = catchAsync(async (req: Request, res: Response) => {
    const channel = await ChannelService.toggleChannelActive(req.params.id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channel status updated",
        data: channel,
    });
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await ChannelService.getStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Dashboard stats retrieved",
        data: stats,
    });
});

const getChannelByIdAdmin = catchAsync(async (req: Request, res: Response) => {
    const channel = await ChannelService.getChannelById(req.params.id as string, false);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Channel retrieved successfully",
        data: channel,
    });
});

export const AdminController = {
    getAdminChannels,
    getChannelByIdAdmin,
    createChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    getDashboardStats,
};
