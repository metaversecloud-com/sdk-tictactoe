import { Request, Response } from "express";
import { VisitorInterface } from "@rtsdk/topia";
import {
  errorHandler,
  getBadges,
  getCredentials,
  getDroppedAssetDataObject,
  getVisitorBadges,
  parseLeaderboard,
  Visitor,
} from "../utils/index.js";

/**
 * Payload for the LeaderboardHome route (Leaderboard | Badges tabs). Returns
 * only what those two tabs render — no game data, no visitorStats, no board
 * verify. Fires the `drawer_opened` analytic once per minute per visitor.
 */
export const handleGetLeaderboardState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug, visitorId } = credentials;
    const forceRefresh = req.query.forceRefreshInventory === "true";

    const [visitor, dataObjResult, badges] = await Promise.all([
      Visitor.get(visitorId, urlSlug, { credentials }) as Promise<VisitorInterface>,
      getDroppedAssetDataObject(credentials),
      getBadges(credentials, forceRefresh),
    ]);

    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;

    await visitor.fetchInventoryItems().catch(() => {});
    const visitorInventory = getVisitorBadges((visitor as any).inventoryItems || []);

    // drawer_opened analytic — bucketed per minute so a rapid re-open only
    // counts once per visitor per scene.
    try {
      const bucket = new Date(Math.round(new Date().getTime() / 60000) * 60000).toISOString();
      const lockId = `drawer_opened-${credentials.sceneDropId || "no-scene"}-${bucket}`;
      await (visitor as any).updateDataObject(
        {},
        {
          lock: { lockId, releaseLock: false },
          analytics: [{ analyticName: "drawer_opened", profileId, urlSlug, uniqueKey: profileId }],
        },
      );
    } catch (error) {
      // Lock already held this minute — analytic already fired.
    }

    const leaderboard = parseLeaderboard(keyAsset, 25);

    return res.json({
      success: true,
      visitor: {
        isAdmin: (visitor as any).isAdmin || false,
        displayName: credentials.displayName || "",
        profileId,
        visitorId,
      },
      leaderboard,
      badges,
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetLeaderboardState",
      message: "Error loading leaderboard state",
      req,
      res,
    });
  }
};
