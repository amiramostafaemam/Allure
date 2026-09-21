import {Router} from 'express';
import { getCategories, getProductBySlug, listProducts } from '../controllers/productController';
import { createReview, listReviews } from '../controllers/reviewsController';

const productRouter=Router();

productRouter.get("/",listProducts);
productRouter.get("/categories",getCategories);
productRouter.get("/:slug",getProductBySlug);
productRouter.get("/:slug/reviews",listReviews);
productRouter.post("/:slug/reviews",createReview);

export default productRouter;