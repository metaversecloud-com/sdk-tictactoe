import { Request, Response } from "express";
import {
  getGameData,
  getWorldDataObject,
  errorHandler,
  generateBoard,
  updateGameData,
  updateGameText,
  Visitor,
  World,
} from "../utils/index.js";
import { GameDataType } from "../types/index.js";
import { defaultGameData } from "../constants.js";
import { VisitorInterface } from "@rtsdk/topia";

export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const credentials = req.credentials;
    const { assetId, interactivePublicKey, urlSlug, visitorId } = credentials;

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const isAdmin = visitor.isAdmin;

    const gameData: GameDataType = await getGameData(credentials);

    const resetAllowedDate = new Date();
    resetAllowedDate.setMinutes(resetAllowedDate.getMinutes() - 5);

    if (!isAdmin && !gameData.lastInteraction) {
      throw "Nothing to reset!";
    } else if (
      !isAdmin &&
      !gameData.isGameOver &&
      gameData.playerO?.visitorId !== visitorId &&
      gameData.playerX?.visitorId !== visitorId &&
      new Date(gameData.lastInteraction).getTime() > resetAllowedDate.getTime()
    ) {
      throw "You must be either a player or admin to reset the board";
    }

    let droppedAssetIds = [],
      droppedAssets;
    const world = await getWorldDataObject(credentials);

    if (isAdmin) {
      droppedAssets = await world.fetchDroppedAssetsWithUniqueName({
        isPartial: true,
        uniqueName: assetId,
      });
    } else {
      droppedAssets = await world.fetchDroppedAssetsWithUniqueName({
        isPartial: false,
        uniqueName: `${assetId}_TicTacToe_move`,
      });

      const finishLine = await world.fetchDroppedAssetsWithUniqueName({
        isPartial: false,
        uniqueName: `${assetId}_TicTacToe_finishLine`,
      });
      if (finishLine.length > 0) droppedAssetIds.push(finishLine[0].id);

      updateGameText(credentials, "", `${assetId}_TicTacToe_gameText`);
      updateGameText(credentials, "", `${assetId}_TicTacToe_playerXText`);
      updateGameText(credentials, "", `${assetId}_TicTacToe_playerOText`);
    }

    for (const droppedAsset in droppedAssets) {
      droppedAssetIds.push(droppedAssets[droppedAsset].id);
    }
    if (droppedAssetIds.length > 0) {
      await World.deleteDroppedAssets(urlSlug, droppedAssetIds, interactivePublicKey, process.env.INTERACTIVE_SECRET);
    }

    // update key asset data object
    const updatedData = {
      ...defaultGameData,
      keyAssetId: assetId,
      resetCount: gameData.resetCount + 1,
    };
    await updateGameData(credentials, assetId, updatedData);

    // update world data object
    const promises = [];
    const xProfileId = gameData.playerX?.profileId;
    const oProfileId = gameData.playerO?.profileId;
    if (xProfileId && oProfileId) {
      promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.gamesPlayedByUser.${xProfileId}.count`, 1));
      promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.gamesPlayedByUser.${oProfileId}.count`, 1));
    }
    promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.totalGamesResetCount`, 1));
    await Promise.all(promises);

    if (isAdmin) await generateBoard(credentials);

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
