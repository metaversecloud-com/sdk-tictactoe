import { Request, Response } from "express";
import {
  DroppedAsset,
  dropWebImageAsset,
  errorHandler,
  getCredentials,
  getDroppedAssetDataObject,
  getWorldDataObject,
  getFinishLineOptions,
  getWinningCombo,
  lockDataObject,
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

    const keyAsset = await getDroppedAssetDataObject(credentials);
    const updatedData: GameDataType = keyAsset.dataObject;
    const { claimedCells, isGameOver, keyAssetId, lastPlayerTurn, playerO, playerX, resetCount, turnCount } =
      updatedData;

    try {
      try {
        await lockDataObject(
          `${keyAssetId}-${resetCount}-${turnCount}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`,
          keyAsset,
        );
      } catch (error) {
        return res.status(409).json({ message: "Move already in progress." });
      }

      if (isGameOver) {
        text = "Game over! Press Reset to start another.";
      } else if (!playerO.visitorId || !playerX.visitorId) {
        text = "Two players are needed to get started.";
      } else if (playerO.visitorId !== visitorId && playerX.visitorId !== visitorId) {
        text = "Game in progress.";
      } else if (claimedCells[cell]) {
        text = "Cannot place your move here.";
      } else if (lastPlayerTurn === visitorId) {
        const username = playerX.visitorId === visitorId ? playerO.username : playerX.username;
        text = `It's ${username}'s turn.`;
      } else {
        updatedData.lastPlayerTurn = visitorId;
        shouldUpdateGame = true;
      }

      if (!shouldUpdateGame) {
        await updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`);
        throw text;
      }

      const cellAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });
      await dropWebImageAsset({
        credentials,
        layer1: `${process.env.BUCKET}${visitorId === playerO.visitorId ? "blue_o" : "pink_x"}.png`,
        position: cellAsset.position,
        uniqueName: `${keyAssetId}_TicTacToe_move`,
      });

      updatedData.claimedCells[cell] = visitorId;
      const winningCombo = await getWinningCombo(updatedData.claimedCells);
      if (winningCombo) {
        // Dropping a finishing line
        const finishLineOptions = await getFinishLineOptions(keyAssetId, winningCombo, credentials, updatedData);
        await dropWebImageAsset({
          credentials,
          ...finishLineOptions,
        });

        // Dropping 👑 and player's name
        text = `👑 ${username} wins!`;
        updatedData.isGameOver = true;

        // update world data object
        const world = await getWorldDataObject(credentials);
        const promises = [];
        promises.push(world.incrementDataObjectValue(`keyAssets.${keyAssetId}.gamesWonByUser.${profileId}.count`, 1));
        promises.push(world.incrementDataObjectValue(`keyAssets.${keyAssetId}.totalGamesWonCount`, 1));
        Promise.all(promises);
      }

      await updateGameText(credentials, text, `${keyAssetId}_TicTacToe_gameText`);

      updatedData.lastInteraction = new Date();
      updatedData.turnCount = turnCount + 1;
      await updateGameData({
        credentials,
        droppedAssetId: keyAssetId,
        updatedData,
      });
    } catch (error) {
      await updateGameData({
        credentials,
        droppedAssetId: keyAssetId,
        updatedData: { turnCount: turnCount + 1 },
      });
      throw error;
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
