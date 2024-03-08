import { defaultGameData } from "../../constants.js";
import { errorHandler } from "../index.js";

export const initializeDroppedAssetDataObject = async (droppedAsset) => {
  try {
    let wasDataObjectInitialized = false;
    await droppedAsset.fetchDataObject();

    if (!droppedAsset.dataObject?.keyAssetId) {
      wasDataObjectInitialized = true;
      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await droppedAsset.setDataObject(
        {
          ...defaultGameData,
          keyAssetId: droppedAsset.id,
        },
        { lock: { lockId, releaseLock: true } },
      );
    }

    return wasDataObjectInitialized;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
