import {Router} from 'express';
import { createStreamChannel, createVideoInvite, getOrder, listOrders } from '../controllers/orderController';

const orderRouter=Router();

orderRouter.get("/",listOrders);
orderRouter.get("/:id",getOrder);
orderRouter.post("/:id/stream-channel",createStreamChannel);
orderRouter.post("/:id/video-invite",createVideoInvite);



export default orderRouter;