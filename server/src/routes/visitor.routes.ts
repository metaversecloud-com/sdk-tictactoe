import visitorController from "../controllers/visitor.controller.js";
import { RequestHandler, Router } from "express";
import { noAuth } from "../middleware/auth.js";

export default (router: Router, auth: RequestHandler = noAuth) => {
  router.post("/ttt/visitor/list", auth, visitorController.list);
  return router;
}
