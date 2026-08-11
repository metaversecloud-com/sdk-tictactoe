import { errorHandler } from "../errorHandler.js";
import { getKeyAsset } from "./getKeyAsset.js";
import { initializeDroppedAssetDataObject } from "./initializeDroppedAssetDataObject.js";
import { Credentials } from "../../types/credentialsInterface.js";

/**
 * Resolve THE key asset for this scene drop (via getKeyAsset — which uses a
 * world-data-object cache and, if missing, resolves by uniqueName + sceneDropId),
 * then ensure its data object is initialized with the default game shape.
 *
 * Every controller must read/write state through this — never through the
 * click-target asset — so game state stays on ONE asset per scene, not on
 * whatever piece a visitor happened to click.
 */
export const getDroppedAssetDataObject = async (credentials: Credentials) => {
  try {
    const keyAsset = await getKeyAsset(credentials);
    const wasDataObjectInitialized = await initializeDroppedAssetDataObject(keyAsset);
    return { keyAsset, wasDataObjectInitialized };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetDataObject",
      message: "Error getting game data.",
    });
  }
};
