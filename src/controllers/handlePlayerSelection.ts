import { Request, Response } from "express";
import { errorHandler, getActiveGames, getCredentials, updateActiveGame } from "../utils/index.js";
import { updateGameText } from "../utils/updateGameText.js";

export const handlePlayerSelection = async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as "x" | "o";
    const isPlayerX = symbol === "o" ? 0 : 1;
    const credentials = getCredentials(req.body);
    const { urlSlug, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = true;

    let activeGame = getActiveGames(urlSlug);
    if (!activeGame) activeGame = updateActiveGame(activeGame, urlSlug);

    if (activeGame.playerX?.visitorId === visitorId) {
      text = `You are already player X`;
      shouldUpdateGame = false;
    } else if (activeGame.playerO?.visitorId === visitorId) {
      text = `You are already player O`;
      shouldUpdateGame = false;
    } else if (isPlayerX && activeGame.playerX) {
      text = "Player X already selected.";
      shouldUpdateGame = false;
    } else if (!isPlayerX && activeGame.playerO) {
      text = "Player O already selected.";
      shouldUpdateGame = false;
    } else if ((isPlayerX && activeGame.playerO) || (!isPlayerX && activeGame.playerX)) {
      text = "Let the game begin!";
    } else {
      text = "Find a second player!";
    }

    const textAsset = await updateGameText(credentials, text);
    if (!shouldUpdateGame) throw text;

    activeGame.messageTextId = textAsset.id;
    activeGame[`player${symbol.toUpperCase()}`] = { visitorId, username };
    updateActiveGame(activeGame, urlSlug);

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
