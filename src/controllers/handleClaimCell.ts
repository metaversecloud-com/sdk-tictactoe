import { Request, Response } from "express";
import {
  DroppedAsset,
  dropWebImageAsset,
  errorHandler,
  getCredentials,
  getGameData,
  getWorldDataObject,
  getFinishLineOptions,
  getWinningCombo,
  updateGameData,
  updateGameText,
} from "../utils/index.js";
import { GameDataType } from "../types/gameDataType";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { assetId, profileId, urlSlug, visitorId } = credentials;
    const { username } = req.body;
    let text = "",
      shouldUpdateGame = false;

    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw "Cell is missing.";

    const gameData: GameDataType = await getGameData(credentials);

    if (!gameData) {
      text = "No active games found. Please select X or O to begin!";
    } else if (gameData.isGameOver) {
      text = "Game over! Press Reset to start another.";
    } else if (!gameData.playerO?.visitorId || !gameData.playerX?.visitorId) {
      text = "Two players are needed to get started.";
    } else if (gameData.playerO?.visitorId !== visitorId && gameData.playerX?.visitorId !== visitorId) {
      text = "Game in progress.";
    } else if (gameData.claimedCells[cell]) {
      text = "Cannot place your move here.";
    } else if (gameData.lastPlayerTurn === visitorId) {
      const username =
        gameData.playerX?.visitorId === visitorId ? gameData.playerO?.username : gameData.playerX?.username;
      text = `It's ${username}'s turn.`;
    } else {
      gameData.lastPlayerTurn = visitorId;
      shouldUpdateGame = true;
    }

    if (!shouldUpdateGame) {
      await updateGameText(credentials, text, `${gameData.keyAssetId}_TicTacToe_gameText`);
      throw text;
    }

    const cellAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });
    await dropWebImageAsset({
      credentials,
      layer1: `${process.env.BUCKET}${visitorId === gameData.playerO?.visitorId ? "blue_o" : "pink_x"}.png`,
      position: cellAsset.position,
      uniqueName: `${gameData.keyAssetId}_TicTacToe_move`,
    });

    gameData.claimedCells[cell] = visitorId;
    const winningCombo = await getWinningCombo(gameData.claimedCells);
    if (winningCombo) {
      // Dropping a finishing line
      const finishLineOptions = await getFinishLineOptions(gameData.keyAssetId, winningCombo, credentials, gameData);
      await dropWebImageAsset({
        credentials,
        ...finishLineOptions,
      });

      // Dropping 👑 and player's name
      text = `👑 ${username} wins!`;
      gameData.isGameOver = true;

      // update world data object
      const world = await getWorldDataObject(credentials);
      const promises = [];
      promises.push(
        world.incrementDataObjectValue(`keyAssets.${gameData.keyAssetId}.gamesWonByUser.${profileId}.count`, 1),
      );
      promises.push(world.incrementDataObjectValue(`keyAssets.${gameData.keyAssetId}.totalGamesWonCount`, 1));
      Promise.all(promises);
    }

    await updateGameText(credentials, text, `${gameData.keyAssetId}_TicTacToe_gameText`);

    gameData.lastInteraction = new Date();
    await updateGameData(credentials, gameData.keyAssetId, gameData);

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
