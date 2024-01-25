import { Request, Response } from "express";
import {
  errorHandler,
  getDroppedAssetDataObject,
  getCredentials,
  lockDataObject,
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
    const { keyAssetId, playerCount, playerO, playerX } = keyAsset.dataObject as GameDataType;

    try {
      try {
        const timestamp = new Date(Math.round(new Date().getTime() / 5000) * 5000);
        await lockDataObject(`${keyAssetId}-${visitorId}-${playerCount}-${timestamp}`, keyAsset);
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

      if (!shouldUpdateGame) {
        await updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`);
        throw text;
      }

      await Promise.all([
        keyAsset.updateDataObject({
          lastInteraction: new Date(),
          playerCount: playerCount + 1,
          [`player${symbol.toUpperCase()}`]: { profileId, username, visitorId },
        }),
        updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`),
        updateGameText(credentials, username, `${keyAssetId}_TicTacToe_player${isPlayerX ? "X" : "O"}Text`),
      ]);
    } catch (error) {
      await keyAsset.updateDataObject({ playerCount: playerCount + 1 });
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
