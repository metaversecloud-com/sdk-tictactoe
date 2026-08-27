import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset, World } from "../topiaInit.js";
import { errorHandler } from "../errorHandler.js";
import { verifyBoard } from "../verifyBoard.js";
import { Credentials } from "../../types/credentialsInterface.js";
import { KEY_ASSET_UNIQUE_NAME } from "../../constants.js";

/**
 * Resolve the key asset for a scene drop.
 *
 * The key asset (uniqueName === `KEY_ASSET_UNIQUE_NAME`) is the single source
 * of truth for game state within a scene drop. Every webhook click could come
 * from any asset in the scene (an X/O sprite, a cell, the reset button), but
 * game state must always be read from and written to the key asset — never
 * the clicked one.
 *
 * We cache the resolution on `world.dataObject.scenes[sceneDropId].keyAssetId`
 * so subsequent calls don't have to re-scan the scene.
 *
 * Resolution order:
 *   1. Read cached `scenes[sceneDropId].keyAssetId` from world data object.
 *   2. If missing AND the clicked asset IS the key asset (matches uniqueName),
 *      use the clicked assetId and cache it.
 *   3. Otherwise, look up the key asset via `sceneDropId + uniqueName` and
 *      cache it.
 */
export const getKeyAsset = async (credentials: Credentials): Promise<DroppedAssetInterface> => {
  const { assetId: clickedAssetId, sceneDropId, uniqueName, urlSlug } = credentials;
  if (!sceneDropId) throw new Error("sceneDropId is required to resolve the key asset");

  const world = World.create(urlSlug, { credentials });
  await world.fetchDataObject();
  const worldData: any = world.dataObject || {};

  let keyAssetId: string | undefined = worldData?.scenes?.[sceneDropId]?.keyAssetId;

  if (!keyAssetId) {
    if (uniqueName === KEY_ASSET_UNIQUE_NAME && clickedAssetId) {
      keyAssetId = clickedAssetId;
    } else {
      // Not clicked directly — scan the scene for the key asset by unique name.
      const found: any = await world.fetchDroppedAssetsBySceneDropId({
        sceneDropId,
        uniqueName: KEY_ASSET_UNIQUE_NAME,
      });
      const first = Array.isArray(found) ? found[0] : Array.isArray((found as any)?.assets) ? (found as any).assets[0] : null;
      let recoveredId: string | undefined = first?.id;

      if (!recoveredId) {
        // Author-error or corrupted scene — delegate to verifyBoard, which
        // wipes the scene (except the click origin), rebuilds a fresh board
        // with a new key asset, then removes the click origin last. Then
        // scan again to pick up the new key asset's id.
        const rebuildResult = await verifyBoard(credentials);
        if (!rebuildResult.fullRebuild) {
          throw new Error(
            `Key asset (uniqueName="${KEY_ASSET_UNIQUE_NAME}") missing from scene drop ${sceneDropId} and rebuild did not run.`,
          );
        }
        const foundAfter: any = await world.fetchDroppedAssetsBySceneDropId({
          sceneDropId,
          uniqueName: KEY_ASSET_UNIQUE_NAME,
        });
        const rebuiltFirst = Array.isArray(foundAfter)
          ? foundAfter[0]
          : Array.isArray((foundAfter as any)?.assets)
            ? (foundAfter as any).assets[0]
            : null;
        recoveredId = rebuiltFirst?.id as string | undefined;
        if (!recoveredId) {
          throw new Error(`Key asset still missing after rebuild for scene drop ${sceneDropId}`);
        }
      }

      keyAssetId = recoveredId;
    }

    // Cache the mapping so future clicks skip the scan.
    try {
      await world.updateDataObject(
        {
          [`scenes.${sceneDropId}`]: { keyAssetId },
        },
        {},
      );
    } catch (error) {
      errorHandler({
        error,
        functionName: "getKeyAsset",
        message: "Non-fatal: could not cache keyAssetId on world data object",
      });
    }
  }

  const keyAsset = await DroppedAsset.get(keyAssetId, urlSlug, {
    credentials: { ...credentials, assetId: keyAssetId },
  });
  if (!keyAsset) throw new Error("Key asset lookup returned undefined");

  return keyAsset;
};
