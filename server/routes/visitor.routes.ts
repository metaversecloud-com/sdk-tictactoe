import visitorController from "../controllers/visitor.controller.js";
import { Router } from "express";
import auth from "../middleware/auth.js";

const visitorRouter = Router();

visitorRouter.post("/list", auth, visitorController.list);

export default visitorRouter;
