import { Credentials } from "../types/credentialsInterface.js";
import { errorHandler } from "./errorHandler.js";
import { World } from "./topiaInit.js";

/**
 * Update a text asset in the board scene by its uniqueName.
 * Uses `fetchDroppedAssetsBySceneDropId` under the hood — this replaces the
 * old assetId-prefixed uniqueName lookup.
 */
export const updateGameText = async (credentials: Credentials, text: string, uniqueName: string) => {
  try {
    const { sceneDropId, urlSlug } = credentials;
    if (!sceneDropId) throw new Error("sceneDropId is required to look up scene assets");

    const world = World.create(urlSlug, { credentials });
    const assets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName });
    const droppedAsset = Array.isArray(assets) && assets.length > 0 ? assets[0] : null;
    if (!droppedAsset) {
      console.warn(`updateGameText: no dropped asset found with uniqueName ${uniqueName} in scene ${sceneDropId}`);
      return null;
    }
    await droppedAsset.updateCustomTextAsset({}, text);
    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "updateGameText",
      message: "Error updating game text.",
    });
  }
};
