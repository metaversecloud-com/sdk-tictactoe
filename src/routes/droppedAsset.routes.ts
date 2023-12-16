import auth from "../middleware/auth.js";
import { Router } from "express";
import { alignDroppedAssets } from "../controllers/index.js";

const router = Router();

router.post("/align", auth, alignDroppedAssets);

export default router;
