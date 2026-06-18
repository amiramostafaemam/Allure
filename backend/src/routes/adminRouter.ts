import {Router} from 'express';
import { createAdminProduct, deleteAdminProduct, getImageKitAuth, listAdminProducts, requireAdmin, updateAdminProduct } from '../controllers/adminController';

const adminRouter=Router();

adminRouter.use(requireAdmin)

adminRouter.get("/imagekit/auth",getImageKitAuth)
adminRouter.get("/products",listAdminProducts);
adminRouter.post("/products",createAdminProduct);
adminRouter.patch("/products/:id",updateAdminProduct);
adminRouter.delete("/products/:id",deleteAdminProduct);


export default adminRouter;