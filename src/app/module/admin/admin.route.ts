import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { m3uUpload } from "../../../config/m3u-upload.config";
import { AdminController } from "./admin.controller";
import { PlaylistController } from "../playlist/playlist.controller";
import {
    channelIdParamSchema,
    channelQuerySchema,
    createChannelSchema,
    importPlaylistUrlSchema,
    importPlaylistUploadSchema,
    updateChannelSchema,
} from "../playlist/playlist.validation";

const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN] as const;

const router = Router();

router.use(checkAuth(...adminRoles));

router.get("/stats", AdminController.getDashboardStats);

router.post(
    "/playlist/upload",
    m3uUpload.single("file"),
    validateRequest(importPlaylistUploadSchema),
    PlaylistController.uploadPlaylist,
);

router.post(
    "/playlist/url",
    validateRequest(importPlaylistUrlSchema),
    PlaylistController.importPlaylistFromUrl,
);

router.get(
    "/channels",
    validateRequest(channelQuerySchema, "query"),
    AdminController.getAdminChannels,
);

router.get(
    "/channel/:id",
    validateRequest(channelIdParamSchema, "params"),
    AdminController.getChannelByIdAdmin,
);

router.post(
    "/channel",
    validateRequest(createChannelSchema),
    AdminController.createChannel,
);

router.put(
    "/channel/:id",
    validateRequest(channelIdParamSchema, "params"),
    validateRequest(updateChannelSchema),
    AdminController.updateChannel,
);

router.delete(
    "/channel/:id",
    validateRequest(channelIdParamSchema, "params"),
    AdminController.deleteChannel,
);

router.patch(
    "/channel/:id/toggle",
    validateRequest(channelIdParamSchema, "params"),
    AdminController.toggleChannel,
);

export const AdminRoute = router;
