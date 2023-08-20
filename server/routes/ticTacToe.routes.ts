import ticTacToeController from "../controllers/ticTacToe.controller.js";
import { Router } from "express";
import auth from "../middleware/auth.js";

const tttRouter = Router();

tttRouter.get("/leaderboard", auth, ticTacToeController.leaderboard);
tttRouter.post("/click/:cell", auth, ticTacToeController.gameMoves);
tttRouter.post("/:player/:action", auth, ticTacToeController.playerMovement);
tttRouter.post("/reset", auth, ticTacToeController.resetBoard);

export default tttRouter;
