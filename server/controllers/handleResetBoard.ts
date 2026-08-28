import { Request, Response } from "express";
import { VisitorInterface } from "@rtsdk/topia";
import {
  errorHandler,
  getCredentials,
  getDroppedAssetDataObject,
  updateGameData,
  updateGameText,
  verifyBoard,
  Visitor,
  World,
} from "../utils/index.js";
import { GameDataType } from "../types/index.js";
import { defaultGameData, defaultGameText } from "../constants.js";

/**
 * Reset the board.
 * - Admin: full clear + rebuild player names + reset game text (does not delete
 *   scene assets; the scene is authored, not generated).
 * - Player: only when isGameOver or lastInteraction > 5 min ago.
 * - Move sprites, finish line, crown are cleared regardless.
 */
export const handleResetBoard = async (req: Request, res: Response) => {
  try {
    const source =
      req.body && req.body.interactiveNonce ? req.body : req.query && req.query.interactiveNonce ? req.query : req.body;
    const credentials = getCredentials(source);
    const { sceneDropId, urlSlug, visitorId } = credentials;

    // First: verify the scene has all required pieces. If the key asset is
    // missing (old-webhook reset button predates the current uniqueName
    // convention, or an admin deleted it), verifyBoard wipes the scene
    // except the click origin, drops a fresh board, and removes the click
    // origin last. In that case the current request is done — the rebuild
    // itself IS the reset, and further writes in this same request would
    // race against Topia's eventual consistency on the just-created assets.
    const verification = await verifyBoard(credentials);
    if (verification.fullRebuild) {
      return res.status(200).send({ message: "Board rebuilt.", success: true, boardRebuilt: true });
    }

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const isAdmin = (visitor as any).isAdmin;

    const dataObjResult = await getDroppedAssetDataObject(credentials);
    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;
    // Use the key asset's OWN id, not credentials.assetId. `getKeyAsset` may
    // have triggered a full-scene rebuild during this request (old webhook
    // reset button clicked → rebuild wipes the click origin), in which case
    // credentials.assetId points at a deleted ghost. All writes below must
    // target the fresh key asset — otherwise isResetInProgress:false lands
    // on nothing and the new key asset stays locked.
    const keyAssetId = (keyAsset as any).id as string;
    const { isGameOver, lastInteraction, playerO, playerX, resetCount } = (keyAsset.dataObject || {}) as GameDataType;

    const resetAllowedDate = new Date();
    resetAllowedDate.setMinutes(resetAllowedDate.getMinutes() - 5);

    const isPlayer = playerX?.visitorId === visitorId || playerO?.visitorId === visitorId;
    // Fresh board (no interactions yet) counts as stale — a reset is a no-op
    // that's still safe. Otherwise, "stale" means >5 min since the last click.
    const isStale = !lastInteraction || new Date(lastInteraction as any).getTime() < resetAllowedDate.getTime();

    if (!isAdmin && !isPlayer && !isGameOver && !isStale) {
      throw new Error("Only current players, admins, or after 5 minutes of inactivity can reset the board");
    }

    await updateGameText(credentials, "Reset in progress...", `TicTacToe_gameText`);

    try {
      try {
        await keyAsset.updateDataObject(
          { isResetInProgress: true },
          {
            lock: {
              lockId: `${keyAssetId}-${resetCount}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`,
            },
          },
        );
      } catch (error) {
        return res.status(409).json({ message: "Reset already in progress." });
      }

      const promises: Promise<any>[] = [];
      const world = World.create(urlSlug, { credentials });

      // Delete the transient move / finish-line / crown assets in this scene.
      if (sceneDropId) {
        const toDeleteUniqueNames = ["TicTacToe_move", "TicTacToe_finishLine", "TicTacToe_crown"];
        const droppedAssetIds: string[] = [];
        for (const uniqueName of toDeleteUniqueNames) {
          try {
            const assets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName });
            if (Array.isArray(assets)) {
              for (const a of assets) if (a?.id) droppedAssetIds.push(a.id);
            }
          } catch (error) {
            // Non-fatal
          }
        }
        if (droppedAssetIds.length > 0) {
          promises.push(
            World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET || "", credentials),
          );
        }
      }

      // Reset labels + game text
      promises.push(updateGameText(credentials, "Player X", `TicTacToe_playerXText`));
      promises.push(updateGameText(credentials, "Player O", `TicTacToe_playerOText`));
      promises.push(updateGameText(credentials, defaultGameText, `TicTacToe_gameText`));

      // Reset game state on the key asset — keep leaderboard intact.
      const updatedData = {
        ...defaultGameData,
        keyAssetId,
        leaderboard: (keyAsset.dataObject as any)?.leaderboard || {},
        isResetInProgress: false,
        resetCount: (resetCount || 0) + 1,
      };
      promises.push(
        updateGameData({
          credentials,
          droppedAssetId: keyAssetId,
          updatedData,
          // Piggy-back the `resets` analytic on the reset write itself — no
          // separate world counter needed; nothing reads it.
          analytics: [{ analyticName: "resets", urlSlug }],
        }),
      );

      const position = { x: keyAsset.position.x, y: (keyAsset.position.y || 0) - 200 };
      world
        .triggerParticle({ position, name: "blueSmoke_fog", duration: 2 })
        .catch((error: any) =>
          errorHandler({ error, functionName: "handleResetBoard", message: "Error triggering particles" }),
        );

      await Promise.all(promises);
      return res.status(200).send({ message: "Game reset successfully", success: true });
    } catch (error) {
      await keyAsset.updateDataObject({ isResetInProgress: false, resetCount: (resetCount || 0) + 1 }).catch(() => {});
      throw error;
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetBoard",
      message: "Error resetting the board.",
      req,
      res,
    });
  }
};
