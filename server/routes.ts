import express from "express";
import assetRoutes from "./src/routes/asset.routes.js";
import ticTacToeRoutes from "./src/routes/ticTacToe.routes.js";
import webhookRoutes from "./src/routes/webhook.routes.js";
import visitorRoutes from "./src/routes/visitor.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "ttt server is running!" });
});

router.use(ticTacToeRoutes);
router.use("/wh", webhookRoutes);
router.use("/visitors", visitorRoutes);
router.use("/assets", assetRoutes);

export default router;
