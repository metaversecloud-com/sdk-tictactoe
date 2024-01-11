import { errorHandler, DroppedAsset } from "../index.js";
import { Credentials } from "../../types/credentialsInterface.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const getDroppedAsset = async (credentials: Credentials): Promise<DroppedAssetInterface> => {
  try {
    const { assetId, urlSlug } = credentials;
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    return droppedAsset;
  } catch (error) {
    errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset details.",
    });
  }
};
