import webhookController from "../controllers/webhook.controller.js";
import { noAuth } from "../middleware/auth.js";
import { RequestHandler, Router } from "express";

export default (router: Router, auth: RequestHandler = noAuth) => {
  router.post("/ttt/wh/start-area/:action", auth, webhookController.startArea);
  return router;
}
