import { DroppedAsset } from "./topiaInit.js";
import { errorHandler } from "./errorHandler.js";
import { GameDataType } from "../types/gameDataType.js";
import { Credentials } from "../types/credentialsInterface.js";

/**
 * Replace the game state on the key-asset data object.
 * Used from the reset path to atomically restore defaults.
 *
 * Uses setDataObject (not updateDataObject) so nested fields like
 * playerX / playerO / claimedCells get wholly replaced — updateDataObject's
 * merge semantics don't reliably overwrite nested children with null.
 */
export const updateGameData = async ({
  analytics,
  credentials,
  droppedAssetId,
  lockId,
  releaseLock = true,
  updatedData,
}: {
  analytics?: Array<Record<string, any>>;
  credentials: Credentials;
  droppedAssetId: string;
  lockId?: string;
  releaseLock?: boolean;
  updatedData: any;
}): Promise<GameDataType | any> => {
  try {
    const droppedAsset = await DroppedAsset.create(droppedAssetId, credentials.urlSlug, {
      credentials: { ...credentials, assetId: droppedAssetId },
    });

    const options: Record<string, any> = {};
    if (lockId) options.lock = { lockId, releaseLock };
    if (analytics && analytics.length) options.analytics = analytics;
    await droppedAsset.setDataObject({ ...updatedData }, options);

    return droppedAsset.dataObject;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "updateGameData",
      message: "Error updating active game.",
    });
  }
};
