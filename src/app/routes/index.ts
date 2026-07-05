import express from "express";
import { AuthRoute } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { ChannelRoute } from "../module/channel/channel.route";
import { AdminRoute } from "../module/admin/admin.route";
import { FavoriteRoute } from "../module/user/favorite.route";

const router = express.Router();

router.use("/auth", AuthRoute);
router.use("/users", UserRoutes);
router.use("/channels", ChannelRoute);
router.use("/admin", AdminRoute);
router.use("/user", FavoriteRoute);

export const IndexRoute = router;
