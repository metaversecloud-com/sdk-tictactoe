import { defaultGameData } from "../../constants.js";
import { errorHandler } from "../errorHandler.js";

/**
 * Ensure the key asset's data object has the default game shape.
 * Returns true if we had to initialize (first-time setup), false otherwise.
 */
export const initializeDroppedAssetDataObject = async (droppedAsset: any): Promise<boolean> => {
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
          leaderboard: {},
        },
        { lock: { lockId, releaseLock: true } },
      );
    } else if (!droppedAsset.dataObject.leaderboard) {
      // Backfill leaderboard on assets initialized under the pre-leaderboard schema.
      const lockId = `${droppedAsset.id}-leaderboard-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await droppedAsset
        .updateDataObject({ leaderboard: {} }, { lock: { lockId, releaseLock: true } })
        .catch(() => console.warn("Unable to backfill leaderboard on key asset"));
    }

    return wasDataObjectInitialized;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return false;
  }
};
