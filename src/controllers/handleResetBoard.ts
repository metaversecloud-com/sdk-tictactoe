import { Request, Response } from "express";
import { DroppedAsset, getActiveGames, errorHandler, updateActiveGame, updateGameText } from "../utils/index.js";

export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const credentials = req.credentials;
    const { urlSlug } = credentials;

    const activeGame = getActiveGames(urlSlug);
    if (activeGame) {
      const finishLine = DroppedAsset.create(activeGame.finishLineId, urlSlug, { credentials });
      const message = DroppedAsset.create(activeGame.messageTextId, urlSlug, { credentials });

      let moves = [];
      for (const move in activeGame.moves) {
        moves.push(DroppedAsset.create(move, urlSlug, { credentials }));
      }

      await Promise.allSettled([
        finishLine.deleteDroppedAsset(),
        message.deleteDroppedAsset(),
        ...moves.map((m) => m.deleteDroppedAsset()),
      ]);

      updateActiveGame({ [urlSlug]: {} }, urlSlug);
      updateGameText(credentials, "");
    }
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
