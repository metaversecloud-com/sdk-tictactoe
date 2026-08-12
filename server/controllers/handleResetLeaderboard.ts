import { Request, Response } from "express";
import { VisitorInterface } from "@rtsdk/topia";
import {
  errorHandler,
  getCredentials,
  getDroppedAssetDataObject,
  resetLeaderboard,
  Visitor,
} from "../utils/index.js";

/**
 * Wipe the leaderboard on this key asset. Admin-only.
 */
export const handleResetLeaderboard = async (req: Request, res: Response) => {
  try {
    const source =
      req.body && req.body.interactiveNonce ? req.body : req.query && req.query.interactiveNonce ? req.query : req.body;
    const credentials = getCredentials(source);
    const { urlSlug, visitorId } = credentials;

    const visitor = (await Visitor.get(visitorId, urlSlug, { credentials })) as VisitorInterface;
    if (!(visitor as any).isAdmin) {
      return res.status(403).json({ success: false, message: "Only admins can reset the leaderboard." });
    }

    const dataObjResult = await getDroppedAssetDataObject(credentials);
    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;

    await resetLeaderboard(keyAsset);
    // Return the new (empty) leaderboard so callers can update state without
    // a follow-up GET — reset always produces `[]` by definition.
    return res.json({ success: true, message: "Leaderboard reset.", leaderboard: [] });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetLeaderboard",
      message: "Error resetting leaderboard",
      req,
      res,
    });
  }
};
