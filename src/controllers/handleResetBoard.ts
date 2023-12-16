import { Request, Response } from "express";
import { activeGames } from "../constants.js";
import { errorHandler, resetBoard } from "../utils/index.js";

export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const urlSlug: string = req.body.urlSlug;

    let activeGame = activeGames[urlSlug];
    if (!activeGame) return res.status(400).send({ message: "Game not found." });

    await resetBoard(activeGame, req.credentials, urlSlug);
    return res.status(200).send({ message: "Game reset successfully" });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleResetBoard",
      message: "Error resetting the board.",
      req,
      res,
    });
  }
};
