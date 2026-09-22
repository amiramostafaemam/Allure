// backend/src/routes/checkoutRouter.ts
import {Router} from 'express';
import { createCheckout, validatePromoCode } from '../controllers/checkoutController';


const checkoutRouter=Router();

checkoutRouter.post("/",createCheckout);
checkoutRouter.post("/promo/validate",validatePromoCode);

export default checkoutRouter;