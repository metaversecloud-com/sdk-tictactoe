import { errorHandler, DroppedAsset, getDroppedAsset, initializeDroppedAssetDataObject } from "../index.js";
import { Credentials } from "../../types/credentialsInterface.js";

export const getDroppedAssetDataObject = async (credentials: Credentials) => {
  try {
    const droppedAsset = await getDroppedAsset(credentials);
    const uniqueName = droppedAsset.uniqueName.split("_TicTacToe_");
    const keyAssetId = !uniqueName[0] || uniqueName[0].toLowerCase() === "reset" ? credentials.assetId : uniqueName[0];

    const keyAsset = await DroppedAsset.create(keyAssetId, credentials.urlSlug, {
      credentials: { ...credentials, assetId: keyAssetId },
    });
    const wasDataObjectInitialized = await initializeDroppedAssetDataObject(keyAsset);

    return { keyAsset, wasDataObjectInitialized };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getGameData",
      message: "Error getting game data.",
    });
  }
};
