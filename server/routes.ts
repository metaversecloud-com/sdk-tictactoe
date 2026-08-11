import express, { NextFunction, Request, Response } from "express";
import auth from "./middleware/auth.js";
import {
  handleClaimCell,
  handleCloseIframe,
  handleGetGameState,
  handleGetLeaderboard,
  handlePlayerSelection,
  handleResetBoard,
  handleResetLeaderboard,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();

// Client-facing (drawer) routes
router.get("/game-state", handleGetGameState);
router.get("/leaderboard", handleGetLeaderboard);
router.post("/leaderboard/reset", auth, handleResetLeaderboard);
router.post("/close-iframe", auth, handleCloseIframe);

// Webhook-triggered routes (also usable from the client)
router.post("/select-player/:symbol", auth, handlePlayerSelection);
router.post("/click/:cell", auth, handleClaimCell);
router.post("/reset", auth, handleResetBoard);

const SERVER_START_DATE = new Date();
router.get("/system/health", (_req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      COMMIT_HASH: process.env.COMMIT_HASH,
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      BUCKET: process.env.BUCKET,
      GOOGLESHEETS_CLIENT_EMAIL: process.env.GOOGLESHEETS_CLIENT_EMAIL ? "SET" : "UNSET",
      GOOGLESHEETS_SHEET_ID: process.env.GOOGLESHEETS_SHEET_ID ? "SET" : "UNSET",
      GOOGLESHEETS_PRIVATE_KEY: process.env.GOOGLESHEETS_PRIVATE_KEY ? "SET" : "UNSET",
      GOOGLESHEETS_SHEET_RANGE: process.env.GOOGLESHEETS_SHEET_RANGE ? "SET" : "UNSET",
    },
  });
});

// Error handling
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  res.status(500).send({ success: false, message: err.message });
});

export default router;
