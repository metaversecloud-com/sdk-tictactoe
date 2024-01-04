import express, { NextFunction, Request, Response } from "express";
import auth from "./middleware/auth.js";
import { handleClaimCell, handlePlayerSelection, handleResetBoard } from "./controllers/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "TicTacToe server is running!" });
});

router.post("/select-player/:symbol", auth, handlePlayerSelection);
router.post("/click/:cell", auth, handleClaimCell);
// router.post("/align-board", auth, alignDroppedAssets);
router.post("/reset", auth, handleResetBoard);

// Error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  res.status(500).send({ success: false, message: err.message });
});

export default router;
