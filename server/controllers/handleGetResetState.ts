import { Request, Response } from "express";
import { VisitorInterface } from "@rtsdk/topia";
import { errorHandler, getCredentials, getDroppedAssetDataObject, verifyBoard, Visitor } from "../utils/index.js";
import { GameDataType } from "../types/index.js";

/**
 * Payload for the ResetPage route. Returns only what `useCanReset` reads —
 * the visitor's admin flag + visitorId, and the minimal slice of game data
 * needed to run the eligibility check.
 *
 * Runs `verifyBoard` (self-heal on missing pieces) — the visitor is about
 * to perform a board-maintenance action, so it's the right moment to check.
 * Fires the `drawer_opened` analytic once per minute per visitor.
 */
export const handleGetResetState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug, visitorId } = credentials;

    // Self-heal the scene if any expected asset is missing. Await so the
    // client sees an intact board by the time the reset is confirmed.
    await verifyBoard(credentials);

    const [visitor, dataObjResult] = await Promise.all([
      Visitor.get(visitorId, urlSlug, { credentials }) as Promise<VisitorInterface>,
      getDroppedAssetDataObject(credentials),
    ]);

    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;
    const fullGameData = (keyAsset.dataObject || {}) as GameDataType;

    // Only ship the fields useCanReset actually reads.
    const gameData = {
      isResetInProgress: fullGameData.isResetInProgress || false,
      isGameOver: fullGameData.isGameOver || false,
      playerX: { visitorId: fullGameData.playerX?.visitorId ?? null },
      playerO: { visitorId: fullGameData.playerO?.visitorId ?? null },
      lastInteraction: fullGameData.lastInteraction || null,
    };

    // drawer_opened analytic — bucketed per minute.
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
      // Already fired this minute.
    }

    return res.json({
      success: true,
      visitor: {
        isAdmin: (visitor as any).isAdmin || false,
        displayName: credentials.displayName || "",
        profileId,
        visitorId,
      },
      gameData,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetResetState",
      message: "Error loading reset state",
      req,
      res,
    });
  }
};
