import { Request, Response } from "express";
import { errorHandler, getActiveGames, getCredentials, updateActiveGame } from "../utils/index.js";
import { updateGameText } from "../utils/updateGameText.js";

export const handlePlayerSelection = async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as "x" | "o";
    const player = symbol === "x" ? 0 : 1;
    const credentials = getCredentials(req.query);
    const { urlSlug, visitorId } = credentials;
    const { username } = req.query;

    let activeGame = getActiveGames(urlSlug);
    if (!activeGame) activeGame = updateActiveGame(activeGame, urlSlug);

    if (!player && activeGame.player1) return res.status(400).send({ message: "Player 1 already selected." });
    else if (player && activeGame.player2) return res.status(400).send({ message: "Player 2 already selected." });

    const text = activeGame.player1 && activeGame.player2 ? "" : "Find a second player!";
    const textAsset = await updateGameText(credentials, text);
    activeGame.messageTextId = textAsset.id;

    activeGame[`player${player + 1}`] = { visitorId, username };
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
