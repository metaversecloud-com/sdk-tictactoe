import { Request, Response } from "express";
import {
  errorHandler,
  getDroppedAssetDataObject,
  getWorldDataObject,
  generateBoard,
  lockDataObject,
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

    updateGameText(credentials, "Reset in progress...", `${assetId}_TicTacToe_gameText`);

    const keyAsset = await getDroppedAssetDataObject(credentials);
    const { isGameOver, lastInteraction, playerO, playerX, resetCount } = keyAsset.dataObject as GameDataType;

    try {
      try {
        await lockDataObject(
          `${assetId}-${resetCount}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`,
          keyAsset,
        );
      } catch (error) {
        return res.status(409).json({ message: "Reset already in progress." });
      }

      const resetAllowedDate = new Date();
      resetAllowedDate.setMinutes(resetAllowedDate.getMinutes() - 5);

      if (!isAdmin && !lastInteraction) {
        throw "Nothing to reset!";
      } else if (
        !isAdmin &&
        !isGameOver &&
        playerO.visitorId !== visitorId &&
        playerX.visitorId !== visitorId &&
        new Date(lastInteraction).getTime() > resetAllowedDate.getTime()
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

        const crown = await world.fetchDroppedAssetsWithUniqueName({
          isPartial: false,
          uniqueName: `${assetId}_TicTacToe_crown`,
        });
        if (crown.length > 0) droppedAssetIds.push(crown[0].id);

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

      // update world data object
      const promises = [];
      const xProfileId = playerX.profileId;
      const oProfileId = playerO.profileId;
      if (xProfileId && oProfileId) {
        promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.gamesPlayedByUser.${xProfileId}.count`, 1));
        promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.gamesPlayedByUser.${oProfileId}.count`, 1));
      }
      promises.push(world.incrementDataObjectValue(`keyAssets.${assetId}.totalGamesResetCount`, 1));
      await Promise.all(promises);

      if (isAdmin) await generateBoard(credentials);

      // update key asset data object
      const updatedData = {
        ...defaultGameData,
        keyAssetId: assetId,
        resetCount: resetCount + 1,
      };
      await updateGameData({
        credentials,
        droppedAssetId: assetId,
        updatedData,
      });

      return res.status(200).send({ message: "Game reset successfully" });
    } catch (error) {
      updateGameText(credentials, "", `${assetId}_TicTacToe_gameText`);
      await updateGameData({
        credentials,
        droppedAssetId: assetId,
        updatedData: { resetCount: resetCount + 1 },
      });
      throw error;
    }
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
