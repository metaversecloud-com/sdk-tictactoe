import ticTacToeController from "../controllers/ticTacToe.controller.js";
import { Router } from "express";
import auth from "../middleware/auth.js";

const tttRouter = Router();

tttRouter.get("/scores/:gameId", auth, ticTacToeController.scores);
tttRouter.post("/click/:cell", auth, ticTacToeController.gameMoves);
tttRouter.post("/select-player/:symbol", auth, ticTacToeController.playerSelection);
// todo remove the endpoint below
tttRouter.post("/:player/:action", auth, ticTacToeController.playerMovement);

tttRouter.post("/reset", auth, ticTacToeController.resetBoard);

export default tttRouter;
