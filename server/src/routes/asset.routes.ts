import assetController from "../controllers/asset.controller.js";
import { noAuth } from "../middleware/auth.js";
import { RequestHandler, Router } from "express";

export default (router: Router, auth: RequestHandler = noAuth) => {
  router.post("/ttt/assets/dropped", auth, assetController.getDropped);
  router.post("/ttt/assets/align", auth, assetController.align);
  router.post("/ttt/assets/list", auth, assetController.list);
  return router;
}
