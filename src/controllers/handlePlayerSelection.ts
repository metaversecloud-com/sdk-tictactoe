import { Request, Response } from "express";
import { errorHandler, getGameData, getCredentials, updateGameData, updateGameText } from "../utils/index.js";
import { GameDataType } from "../types/gameData.js";

export const handlePlayerSelection = async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as "x" | "o";
    const isPlayerX = symbol === "o" ? 0 : 1;
    const credentials = getCredentials(req.body);
    const { visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = true;

    const gameData: GameDataType = await getGameData(credentials);
    if (!gameData) throw "There was an issue retrieving game data.";

    if (gameData.playerX?.visitorId === visitorId) {
      text = `You are already player X`;
      shouldUpdateGame = false;
    } else if (gameData.playerO?.visitorId === visitorId) {
      text = `You are already player O`;
      shouldUpdateGame = false;
    } else if (isPlayerX && gameData.playerX?.visitorId) {
      text = "Player X already selected.";
      shouldUpdateGame = false;
    } else if (!isPlayerX && gameData.playerO?.visitorId) {
      text = "Player O already selected.";
      shouldUpdateGame = false;
    } else if ((isPlayerX && gameData.playerO?.visitorId) || (!isPlayerX && gameData.playerX?.visitorId)) {
      text = "Let the game begin!";
    } else {
      text = "Find a second player!";
    }

    const textAsset = await updateGameText(credentials, text);
    if (!shouldUpdateGame) throw text;

    gameData.messageTextId = textAsset.id;
    gameData[`player${symbol.toUpperCase()}`] = { visitorId, username };
    updateGameData(credentials, gameData);

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
