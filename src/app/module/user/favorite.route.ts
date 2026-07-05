import { Router } from "express";
import { Role } from "../../lib/prisma-exports";
import { checkAuth } from "../../middleware/checkAuth";
import { FavoriteController } from "./favorite.controller";

const router = Router();

router.use(checkAuth(Role.CLIENT));

router.get("/favorites", FavoriteController.getFavorites);

router.post("/favorite/:channelId", FavoriteController.toggleFavorite);

export const FavoriteRoute = router;
