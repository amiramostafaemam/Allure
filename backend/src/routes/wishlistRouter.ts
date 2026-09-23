import { Router } from 'express';
import { addToWishlist, listWishlist, removeFromWishlist } from '../controllers/wishlistController';
import { validateUuidParam } from '../middleware/validateUuidParam';

const wishlistRouter = Router();

wishlistRouter.get("/", listWishlist);
wishlistRouter.post("/", addToWishlist);
wishlistRouter.delete("/:productId", validateUuidParam("productId"), removeFromWishlist);

export default wishlistRouter;
