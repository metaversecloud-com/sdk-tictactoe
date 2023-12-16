import webhookController from "../controllers/webhook.controller.js";
import auth from "../middleware/auth.js";
import { Router } from "express";

const router = Router();

router.post("/start-area/:action", auth, webhookController.startArea);

export default router;
