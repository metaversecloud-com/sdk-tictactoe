import { errorHandler } from "../errorHandler.js";

export const initializeWorldDataObject = async ({
  assetId,
  world,
  urlSlug,
}: {
  assetId: string;
  world;
  urlSlug: string;
}) => {
  try {
    const payload = {
      gamesPlayedByUser: {},
      gamesWonByUser: {},
      keyAssetId: assetId,
      totalGamesResetCount: 0,
      totalGamesWonCount: 0,
    };
    const lockId = `${urlSlug}-${assetId}-keyAssetId-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || !world.dataObject?.keyAssets) {
      await world.setDataObject(
        {
          keyAssets: {
            [assetId]: { ...payload },
          },
        },
        { lock: { lockId, releaseLock: true } },
      );
    } else if (!world.dataObject?.keyAssets?.[assetId]) {
      await world.updateDataObject(
        {
          [`keyAssets.${assetId}`]: { ...payload },
        },
        { lock: { lockId, releaseLock: true } },
      );
    }
    return;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "initializeWorldDataObject",
      message: "Error initializing world data object",
    });
    return await world.fetchDataObject();
  }
};
