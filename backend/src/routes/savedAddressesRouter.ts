import { Router } from 'express';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '../controllers/savedAddressesController';
import { validateUuidParam } from '../middleware/validateUuidParam';

const savedAddressesRouter = Router();

savedAddressesRouter.get("/", listAddresses);
savedAddressesRouter.post("/", createAddress);
savedAddressesRouter.patch("/:id", validateUuidParam("id"), updateAddress);
savedAddressesRouter.delete("/:id", validateUuidParam("id"), deleteAddress);

export default savedAddressesRouter;
