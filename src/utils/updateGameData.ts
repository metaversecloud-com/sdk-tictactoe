import { DroppedAsset, errorHandler } from "./index.js";
import { GameDataType } from "../types/gameDataType.js";
import { Credentials } from "../types/credentialsInterface";

export const updateGameData = async ({
  credentials,
  droppedAssetId,
  lockId,
  releaseLock = true,
  updatedData,
}: {
  credentials: Credentials;
  droppedAssetId: string;
  lockId?: string;
  releaseLock?: boolean;
  updatedData;
}): Promise<GameDataType> => {
  try {
    const droppedAsset = await DroppedAsset.create(droppedAssetId, credentials.urlSlug, {
      credentials: { ...credentials, assetId: droppedAssetId },
    });

    const options = lockId ? { lock: { lockId, releaseLock } } : {};
    await droppedAsset.updateDataObject({ ...updatedData }, options);

    return droppedAsset.dataObject;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "updateGameData",
      message: "Error updating active game.",
    });
    return error;
  }
};
