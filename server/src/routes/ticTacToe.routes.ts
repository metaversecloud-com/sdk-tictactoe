import ticTacToeController from "../controllers/ticTacToe.controller.js";
import { RequestHandler, Router } from "express";
import { noAuth } from "../middleware/auth.js";

export default (router: Router, auth: RequestHandler = noAuth) => {
  router.post("/ttt/leaderboard", auth, ticTacToeController.leaderboard);
  router.post("/ttt/click/:cell", auth, ticTacToeController.gameMoves);
  router.post("/ttt/:player/:action", auth, ticTacToeController.playerMovement);
  return router;
}
