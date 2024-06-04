import express, { NextFunction, Request, Response } from "express";
import auth from "./middleware/auth.js";
import { handleClaimCell, handlePlayerSelection, handleResetBoard } from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();

router.post("/select-player/:symbol", auth, handlePlayerSelection);
router.post("/click/:cell", auth, handleClaimCell);
router.post("/reset", auth, handleResetBoard);

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

// Error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  res.status(500).send({ success: false, message: err.message });
});

export default router;
