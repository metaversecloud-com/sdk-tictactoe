import { DroppedAsset, errorHandler } from "./index.js";
import { GameDataType } from "../types/gameDataType.js";
import { Credentials } from "../types/credentialsInterface";

export const updateGameData = async (
  credentials: Credentials,
  droppedAssetId: string,
  updatedData,
): Promise<GameDataType> => {
  try {
    const droppedAsset = await DroppedAsset.create(droppedAssetId, credentials.urlSlug, {
      credentials: { ...credentials, assetId: droppedAssetId },
    });

    const lockId = `${droppedAsset.id}-gameUpdates-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`;
    await droppedAsset.updateDataObject({ ...updatedData }, { lock: { lockId, releaseLock: true } });

    return droppedAsset.dataObject;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateGameData",
      message: "Error updating active game.",
    });
  }
};
