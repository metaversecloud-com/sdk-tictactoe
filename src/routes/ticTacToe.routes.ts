import { Router } from "express";
import auth from "../middleware/auth.js";
import { handleMakeMove, handlePlayerMovement, handleResetBoard } from "../controllers/index.js";

const router = Router();

router.post("/click/:cell", auth, handleMakeMove);
router.post("/:player/:action", auth, handlePlayerMovement);
router.post("/reset", auth, handleResetBoard);

export default router;
