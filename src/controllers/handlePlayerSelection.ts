import { Request, Response } from "express";
import {
  errorHandler,
  getDroppedAssetDataObject,
  getCredentials,
  lockDataObject,
  updateGameData,
  updateGameText,
} from "../utils/index.js";
import { GameDataType } from "../types/gameDataType.js";

export const handlePlayerSelection = async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as "x" | "o";
    const isPlayerX = symbol === "o" ? 0 : 1;
    const credentials = getCredentials(req.body);
    const { profileId, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = true;

    const keyAsset = await getDroppedAssetDataObject(credentials);
    const updatedData: GameDataType = keyAsset.dataObject;
    const { keyAssetId, playerCount, playerO, playerX } = updatedData;

    try {
      try {
        await lockDataObject(
          `${keyAssetId}-${visitorId}-${playerCount}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`,
          keyAsset,
        );
      } catch (error) {
        return res.status(409).json({ message: "Player selection already in progress." });
      }

      if (playerX.visitorId === visitorId) {
        text = `You are already player X`;
        shouldUpdateGame = false;
      } else if (playerO.visitorId === visitorId) {
        text = `You are already player O`;
        shouldUpdateGame = false;
      } else if (isPlayerX && playerX.visitorId) {
        text = "Player X already selected.";
        shouldUpdateGame = false;
      } else if (!isPlayerX && playerO.visitorId) {
        text = "Player O already selected.";
        shouldUpdateGame = false;
      } else if ((isPlayerX && playerO.visitorId) || (!isPlayerX && playerX.visitorId)) {
        text = "Let the game begin!";
      } else {
        text = "Find a second player!";
      }

      await updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`);
      if (!shouldUpdateGame) throw text;

      await updateGameText(credentials, username, `${keyAssetId}_TicTacToe_player${isPlayerX ? "X" : "O"}Text`);

      updatedData[`player${symbol.toUpperCase()}`] = { profileId, username, visitorId };
      updatedData.lastInteraction = new Date();

      await updateGameData({
        credentials,
        droppedAssetId: keyAssetId,
        updatedData,
      });
    } catch (error) {
      await updateGameData({
        credentials,
        droppedAssetId: keyAssetId,
        updatedData: { playerCount: playerCount + 1 },
      });
      throw error;
    }
    return res.json({ success: true });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handlePlayerSelection",
      message: "Error handling player selection",
      req,
      res,
    });
  }
};
