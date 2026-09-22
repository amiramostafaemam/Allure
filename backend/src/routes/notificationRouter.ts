import { Router } from 'express';
import { listNotifications, markAllNotificationsRead, markNotificationRead, markOrderNotificationsRead } from '../controllers/notificationsController';
import { validateUuidParam } from '../middleware/validateUuidParam';

const notificationRouter = Router();

notificationRouter.get("/", listNotifications);
notificationRouter.patch("/read-all", markAllNotificationsRead);
notificationRouter.patch("/order/:orderId/read", validateUuidParam("orderId"), markOrderNotificationsRead);
notificationRouter.patch("/:id/read", validateUuidParam("id"), markNotificationRead);

export default notificationRouter;
