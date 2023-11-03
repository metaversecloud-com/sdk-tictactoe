import ticTacToeController from "../controllers/ticTacToe.controller.js";
import { Router } from "express";
import auth from "../middleware/auth.js";
import blocking from "../middleware/blocking.js";

const tttRouter = Router();

tttRouter.get("/scores/:gameId", auth, ticTacToeController.scores);
tttRouter.post("/click/:cell", auth, blocking, ticTacToeController.gameMoves);
tttRouter.post("/select-player/:symbol", auth, blocking, ticTacToeController.playerSelection);

tttRouter.post("/reset", auth, blocking, ticTacToeController.resetBoard);

export default tttRouter;
