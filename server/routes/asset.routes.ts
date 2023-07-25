import assetController from "../controllers/asset.controller.js";
import auth from "../middleware/auth.js";
import { Router } from "express";

const assetRouter = Router();

assetRouter.post("/dropped", auth, assetController.getDropped);
assetRouter.post("/align", auth, assetController.align);
assetRouter.post("/list", auth, assetController.list);

export default assetRouter;
