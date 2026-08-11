import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetDataObject, parseLeaderboard } from "../utils/index.js";

/**
 * Return the top-25 leaderboard for this key asset.
 */
export const handleGetLeaderboard = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const dataObjResult = await getDroppedAssetDataObject(credentials);
    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;
    const leaderboard = parseLeaderboard(keyAsset, 25);
    return res.json({ success: true, leaderboard });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetLeaderboard",
      message: "Error loading leaderboard",
      req,
      res,
    });
  }
};
