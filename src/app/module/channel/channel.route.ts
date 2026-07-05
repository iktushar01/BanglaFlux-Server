import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { ChannelController } from "./channel.controller";
import { channelIdParamSchema, channelQuerySchema } from "../playlist/playlist.validation";

const router = Router();

router.get(
    "/",
    validateRequest(channelQuerySchema, "query"),
    ChannelController.getChannels,
);

router.get(
    "/:id",
    validateRequest(channelIdParamSchema, "params"),
    ChannelController.getChannelById,
);

export const ChannelRoute = router;
