import { Request, Response } from "express";
import {
  createWebImageAsset,
  errorHandler,
  getGameData,
  getCredentials,
  getFinishLineOptions,
  getWinningCombo,
  updateGameData,
  updateGameText,
} from "../utils/index.js";
import { DroppedAsset } from "../utils/topiaInit.js";
import { GameDataType } from "../types/gameData";

export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { assetId, interactivePublicKey, urlSlug, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = false;

    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw "Cell is missing.";

    const gameData: GameDataType = await getGameData(credentials);

    if (!gameData) {
      text = "No active games found. Please select X or O to begin!";
    } else if (!gameData.playerO?.visitorId || !gameData.playerX?.visitorId) {
      text = "Two players are needed to get started.";
    } else if (gameData.status[cell]) {
      text = "Cannot place your move here.";
    } else if (gameData.lastTurn === visitorId) {
      text = "It's not your turn.";
    } else {
      gameData.lastTurn = visitorId;
      shouldUpdateGame = true;
    }

    gameData.status[cell] = visitorId;

    await updateGameText(credentials, text);
    if (!shouldUpdateGame) throw text;

    const cellAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const webImageAsset = await createWebImageAsset(req.credentials);
    const droppedAsset = await DroppedAsset.drop(webImageAsset, {
      isInteractive: true,
      interactivePublicKey,
      layer0: "",
      layer1: `${process.env.BUCKET}${visitorId === gameData.playerO?.visitorId ? "blue_o" : "pink_x"}.png`,
      // @ts-ignore
      position: cellAsset.position,
      uniqueName: `TicTacToe_move_${urlSlug}`,
      urlSlug,
    });

    if (!gameData.moves) gameData.moves = {};
    gameData.moves[cell] = droppedAsset.id;

    const winningCombo = await getWinningCombo(gameData.status);
    if (winningCombo) {
      // Dropping a finishing line
      const finishLineOptions = await getFinishLineOptions(urlSlug, gameData, winningCombo, req.credentials);
      const finishLine = await DroppedAsset.drop(webImageAsset, {
        ...finishLineOptions,
        isInteractive: true,
        interactivePublicKey,
      });
      gameData.finishLineId = finishLine.id;

      // Dropping 👑 and player's name
      text = `👑 ${username} wins!`;
      const textAsset = await updateGameText(credentials, text);
      gameData.messageTextId = textAsset.id;
    }
    await updateGameData(credentials, gameData);

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
