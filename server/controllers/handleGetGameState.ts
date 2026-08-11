import { Request, Response } from "express";
import { VisitorInterface } from "@rtsdk/topia";
import {
  errorHandler,
  getBadges,
  getCredentials,
  getDroppedAssetDataObject,
  getVisitorBadges,
  parseLeaderboard,
  verifyBoard,
  Visitor,
} from "../utils/index.js";
import { GameDataType } from "../types/index.js";

/**
 * Returns everything the client drawer needs to render:
 *   - the game data (from the key-asset data object)
 *   - the visitor's admin flag + basic identity
 *   - the top-25 leaderboard (from the key-asset data object)
 *   - the ecosystem badge catalog + the visitor's badge inventory
 *   - the visitor's totalWins / totalGamesPlayed counters (for UI)
 *
 * Runs `verifyBoard` as a self-heal on every call — cheap when the scene is
 * intact.
 * Fires the `drawer_opened` analytic once per minute-bucketed session, keyed
 * on the visitor's data object.
 */
export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug, visitorId } = credentials;
    const forceRefresh = req.query.forceRefreshInventory === "true";

    // Kick off board verification (self-heal). Don't block the response on
    // regeneration — just await the check so the client sees an intact board
    // as soon as possible.
    await verifyBoard(credentials);

    const [visitor, dataObjResult, badges] = await Promise.all([
      Visitor.get(visitorId, urlSlug, { credentials }) as Promise<VisitorInterface>,
      getDroppedAssetDataObject(credentials),
      getBadges(credentials, forceRefresh),
    ]);

    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;
    const gameData = (keyAsset.dataObject || {}) as GameDataType;

    // Fetch visitor inventory + data object for badge display + counters
    await Promise.all([visitor.fetchInventoryItems().catch(() => {}), visitor.fetchDataObject().catch(() => {})]);

    const visitorInventory = getVisitorBadges((visitor as any).inventoryItems || []);
    const vData: any = (visitor as any).dataObject || {};
    const visitorStats = {
      totalWins: (vData.totalWins as number) || 0,
      totalGamesPlayed: (vData.totalGamesPlayed as number) || 0,
    };

    // Fire drawer_opened, once per minute per visitor+scene (dedup via lockId).
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
      // Lock already held — analytic already fired this bucket. Silent no-op.
    }

    const leaderboard = parseLeaderboard(keyAsset, 25);

    return res.json({
      success: true,
      isAdmin: (visitor as any).isAdmin || false,
      visitor: {
        isAdmin: (visitor as any).isAdmin || false,
        displayName: credentials.displayName || "",
        profileId,
        visitorId,
      },
      gameData,
      uniqueName: (keyAsset as any).uniqueName || "",
      leaderboard,
      badges,
      visitorInventory,
      visitorStats,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetGameState",
      message: "Error loading game state",
      req,
      res,
    });
  }
};
