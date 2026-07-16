// backend/src/routes/checkoutRouter.ts
import {Router} from 'express';
import { createCheckout } from '../controllers/checkoutController';


const checkoutRouter=Router();

checkoutRouter.post("/",createCheckout);

export default checkoutRouter;