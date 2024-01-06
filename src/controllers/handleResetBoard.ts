import { Request, Response } from "express";
import { DroppedAsset, getActiveGames, errorHandler, updateActiveGame, updateGameText, World } from "../utils/index.js";

export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const credentials = req.credentials;
    const { urlSlug } = credentials;

    const activeGame = await getActiveGames(urlSlug);
    if (activeGame) {
      const droppedAssetIds = [];
      if (activeGame.finishLineId) droppedAssetIds.push(activeGame.finishLineId);
      if (activeGame.moves) {
        for (const move in activeGame.moves) {
          droppedAssetIds.push(activeGame.moves[move]);
        }
      }
      if (droppedAssetIds.length > 0) {
        await World.deleteDroppedAssets(
          urlSlug,
          droppedAssetIds,
          credentials.interactivePublicKey,
          process.env.INTERACTIVE_SECRET,
        );
      }
      await updateActiveGame({}, urlSlug);
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
