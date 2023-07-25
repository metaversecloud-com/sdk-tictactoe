import express from "express";
import assetRoutes from "./routes/asset.routes.js";
import ticTacToeRoutes from "./routes/ticTacToe.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import visitorRoutes from "./routes/visitor.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "ttt server is running!" });
});

router.use(ticTacToeRoutes);
router.use("/wh", webhookRoutes);
router.use("/visitors", visitorRoutes);
router.use("/assets", assetRoutes);

export default router;
