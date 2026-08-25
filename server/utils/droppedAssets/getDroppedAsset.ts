import { DroppedAssetInterface } from "@rtsdk/topia";
import { DroppedAsset } from "../topiaInit.js";
import { errorHandler } from "../errorHandler.js";
import { Credentials } from "../../types/credentialsInterface.js";

/**
 * Get a dropped asset by its assetId (the id in credentials).
 * Used to fetch the key asset (opens the drawer) so we can read state
 * from its data object.
 */
export const getDroppedAsset = async (credentials: Credentials): Promise<DroppedAssetInterface | undefined> => {
  try {
    const { assetId, urlSlug } = credentials;
    if (!assetId) throw new Error("assetId is required");
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    return droppedAsset;
  } catch (error) {
    errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset details.",
    });
    return undefined;
  }
};
