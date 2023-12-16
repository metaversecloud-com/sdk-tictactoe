import visitorController from "../controllers/visitor.controller.js";
import { Router } from "express";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/list", auth, visitorController.list);

export default router;
