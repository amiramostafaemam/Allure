import {Router} from 'express';
import { getCategories, getProductBySlug, listProducts } from '../controllers/productController';

const productRouter=Router();

productRouter.get("/",listProducts);
productRouter.get("/categories",getCategories);
productRouter.get("/:slug",getProductBySlug);

export default productRouter;