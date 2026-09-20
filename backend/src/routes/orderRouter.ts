import {Router} from 'express';
import { createStreamChannel, createVideoInvite, getOrder, listOrders } from '../controllers/orderController';
import { validateUuidParam } from '../middleware/validateUuidParam';

const orderRouter=Router();

orderRouter.get("/",listOrders);
orderRouter.get("/:id",validateUuidParam("id"),getOrder);
orderRouter.post("/:id/stream-channel",validateUuidParam("id"),createStreamChannel);
orderRouter.post("/:id/video-invite",validateUuidParam("id"),createVideoInvite);



export default orderRouter;