import { Request, Response } from "express";
import {
  createWebImageAsset,
  errorHandler,
  getActiveGames,
  getCredentials,
  getFinishLineOptions,
  getWinningCombo,
  updateActiveGame,
  updateGameText,
} from "../utils/index.js";
import { DroppedAsset } from "../utils/topiaInit.js";

export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { assetId, interactivePublicKey, urlSlug, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = false;

    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw "Cell is missing.";

    const activeGame = await getActiveGames(urlSlug);
    if (!activeGame.status) activeGame.status = {};

    if (!activeGame) {
      text = "No active games found. Please select X or O to begin!";
    } else if (!activeGame.playerO || !activeGame.playerX) {
      text = "Two players are needed to get started.";
    } else if (activeGame.status[cell]) {
      text = "Cannot place your move here.";
    } else if (activeGame.lastTurn === visitorId) {
      text = "It's not your turn.";
    } else {
      activeGame.lastTurn = visitorId;
      shouldUpdateGame = true;
    }

    activeGame.status[cell] = visitorId;

    await updateGameText(credentials, text);
    if (!shouldUpdateGame) throw text;

    const cellAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const webImageAsset = await createWebImageAsset(req.credentials);
    const droppedAsset = await DroppedAsset.drop(webImageAsset, {
      isInteractive: true,
      interactivePublicKey,
      layer0: "",
      layer1: `${process.env.BUCKET}${visitorId === activeGame.playerO?.visitorId ? "blue_o" : "pink_x"}.png`,
      // @ts-ignore
      position: cellAsset.position,
      uniqueName: `TicTacToe_move_${urlSlug}`,
      urlSlug,
    });

    if (!activeGame.moves) activeGame.moves = {};
    activeGame.moves[cell] = droppedAsset.id;

    await updateActiveGame(activeGame, urlSlug);

    const winningCombo = await getWinningCombo(activeGame.status);
    if (winningCombo) {
      // Dropping a finishing line
      const finishLineOptions = await getFinishLineOptions(urlSlug, activeGame, winningCombo, req.credentials);
      const finishLine = await DroppedAsset.drop(webImageAsset, {
        ...finishLineOptions,
        isInteractive: true,
        interactivePublicKey,
      });
      activeGame.finishLineId = finishLine.id;

      // Dropping 👑 and player's name
      text = `👑 ${username} wins!`;
      const textAsset = await updateGameText(credentials, text);
      activeGame.messageTextId = textAsset.id;

      await updateActiveGame(activeGame, urlSlug);
    }

    return res.status(200).send({ message: "Move successfully made." });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleClaimCell",
      message: "Error making a move.",
      req,
      res,
    });
  }
};
