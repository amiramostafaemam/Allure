import {Router} from 'express';
import { createAdminProduct, deleteAdminProduct, getImageKitAuth, listAdminProducts, requireAdmin, updateAdminProduct } from '../controllers/adminController';
import { updateOrderStatus } from '../controllers/orderController';
import { getAdminStats } from '../controllers/adminStatsController';
import { listCustomers, updateCustomerRole } from '../controllers/adminUsersController';
import { createCategory, deleteCategory, listCategories, renameCategory } from '../controllers/adminCategoriesController';
import { validateUuidParam } from '../middleware/validateUuidParam';

const adminRouter=Router();

adminRouter.use(requireAdmin)

adminRouter.get("/imagekit/auth",getImageKitAuth)
adminRouter.get("/products",listAdminProducts);
adminRouter.post("/products",createAdminProduct);
adminRouter.patch("/products/:id",validateUuidParam("id"),updateAdminProduct);
adminRouter.delete("/products/:id",validateUuidParam("id"),deleteAdminProduct);

adminRouter.patch("/orders/:id/status",validateUuidParam("id"),updateOrderStatus);

adminRouter.get("/stats",getAdminStats);

adminRouter.get("/customers",listCustomers);
adminRouter.patch("/customers/:id/role",validateUuidParam("id"),updateCustomerRole);

adminRouter.get("/categories",listCategories);
adminRouter.post("/categories",createCategory);
adminRouter.patch("/categories/:id",validateUuidParam("id"),renameCategory);
adminRouter.delete("/categories/:id",validateUuidParam("id"),deleteCategory);


export default adminRouter;