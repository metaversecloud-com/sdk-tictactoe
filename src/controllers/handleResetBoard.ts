import { Request, Response } from "express";
import { getGameData, errorHandler, updateGameData, updateGameText, World } from "../utils/index.js";
import { GameDataType } from "../types/gameData.js";
import { defaultGameData } from "../constants.js";

export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const credentials = req.credentials;
    const { urlSlug } = credentials;

    const gameData: GameDataType = await getGameData(credentials);

    const droppedAssetIds = [];
    if (gameData.finishLineId) droppedAssetIds.push(gameData.finishLineId);
    for (const move in gameData.moves) {
      droppedAssetIds.push(gameData.moves[move]);
    }
    if (droppedAssetIds.length > 0) {
      await World.deleteDroppedAssets(
        urlSlug,
        droppedAssetIds,
        credentials.interactivePublicKey,
        process.env.INTERACTIVE_SECRET,
      );
    }
    const updatedData = {
      ...defaultGameData,
      resetCount: gameData.resetCount + 1,
    };
    await updateGameData(credentials, updatedData);
    updateGameText(credentials, "");

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
