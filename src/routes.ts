import express, { NextFunction, Request, Response } from "express";
import assetRoutes from "./routes/droppedAsset.routes.js";
import ticTacToeRoutes from "./routes/ticTacToe.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import visitorRoutes from "./routes/visitor.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "TicTacToe server is running!" });
});

router.use(ticTacToeRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/visitors", visitorRoutes);
router.use("/dropped-assets", assetRoutes);

// Error handling
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  res.status(500).send({ success: false, message: err.message });
});

export default router;
