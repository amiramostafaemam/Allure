import {Router} from 'express';
import { createStreamToken } from '../controllers/streamController';

const streamRouter=Router();

streamRouter.post("/token",createStreamToken);

export default streamRouter;