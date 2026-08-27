import { Request, Response } from "express";
import { WorldActivityType } from "@rtsdk/topia";
import {
  errorHandler,
  getDroppedAssetDataObject,
  getCredentials,
  lockDataObject,
  updateGameText,
  verifyBoard,
  Visitor,
  World,
} from "../utils/index.js";
import { GameDataType } from "../types/gameDataType.js";

/**
 * Claim X or O for the calling visitor.
 *
 * When the SECOND player successfully claims (both playerX and playerO now
 * set), we roll a 50/50 for who moves first, set `lastPlayerTurn` accordingly,
 * increment `totalGamesPlayed` on BOTH visitors (for badges), and update the
 * on-canvas game text to `It's <firstPlayerName>'s turn.`.
 *
 * Convention: `lastPlayerTurn` holds the visitorId of the player who JUST
 * moved. To make Y move first, set lastPlayerTurn = X.visitorId (so X "just
 * moved"). handleClaimCell uses this to gate turns.
 */
export const handlePlayerSelection = async (req: Request, res: Response) => {
  try {
    const symbol = (req.params.symbol as "x" | "o") || "x";
    const isPlayerX = symbol === "x";

    // Credentials may arrive on body (webhook) or query (client) — accept either.
    const source =
      req.body && req.body.interactiveNonce ? req.body : req.query && req.query.interactiveNonce ? req.query : req.body;
    const credentials = getCredentials(source);
    const { displayName, profileId, urlSlug, visitorId } = credentials;

    // Verify the scene has all required pieces (including the key asset).
    // If it doesn't, verifyBoard may fully rebuild — in which case the world
    // beneath us has been replaced and the player-selection webhook target
    // no longer exists.
    const verification = await verifyBoard(credentials);
    if (verification.fullRebuild) {
      return res.json({ success: true, boardRebuilt: true });
    }

    let text = "";
    let shouldUpdateGame = true;

    const dataObjResult = await getDroppedAssetDataObject(credentials);
    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;
    const { keyAssetId, playerCount, playerO, playerX } = (keyAsset.dataObject || {}) as GameDataType;

    try {
      try {
        const timestamp = new Date(Math.round(new Date().getTime() / 5000) * 5000);
        await lockDataObject(`${keyAssetId}-${visitorId}-${playerCount}-${timestamp}`, keyAsset);
      } catch (error) {
        return res.status(409).json({ message: "Player selection already in progress." });
      }

      const world = World.create(urlSlug, { credentials });

      const isSecondPlayerJoining =
        (isPlayerX && !playerX?.visitorId && !!playerO?.visitorId) ||
        (!isPlayerX && !playerO?.visitorId && !!playerX?.visitorId);

      if (playerX?.visitorId === visitorId) {
        text = `You are already player X`;
        shouldUpdateGame = false;
      } else if (playerO?.visitorId === visitorId) {
        text = `You are already player O`;
        shouldUpdateGame = false;
      } else if (isPlayerX && playerX?.visitorId) {
        text = "Player X already selected.";
        shouldUpdateGame = false;
      } else if (!isPlayerX && playerO?.visitorId) {
        text = "Player O already selected.";
        shouldUpdateGame = false;
      }

      if (!shouldUpdateGame) {
        await updateGameText(credentials, text, `TicTacToe_gameText`);
        throw text;
      }

      const otherPlayer = isPlayerX ? playerO : playerX;

      // Build the update. On the second-join, roll a coin and pick first mover.
      const updateFields: Record<string, any> = {
        lastInteraction: new Date(),
        playerCount: (playerCount || 0) + 1,
        [`player${symbol.toUpperCase()}`]: { profileId, displayName, visitorId },
      };

      let onCanvasText = "Find a second player!";
      if (isSecondPlayerJoining) {
        const me = { profileId, displayName, visitorId };
        const other = otherPlayer as { profileId?: string; displayName?: string; visitorId?: number };
        const firstIsMe = Math.random() < 0.5;
        const firstPlayer = firstIsMe ? me : other;
        const other2 = firstIsMe ? other : me;

        // Set lastPlayerTurn to the *non-first* player's visitorId so the
        // first player is not blocked by the "it's not your turn" check.
        updateFields.lastPlayerTurn = other2.visitorId ?? null;
        onCanvasText = `It's ${firstPlayer.displayName || ""}'s turn.`;

        world.triggerActivity({ type: WorldActivityType.GAME_ON, assetId: keyAssetId }).catch((error: any) => {
          console.error("Error triggering GAME_ON activity:", error);
        });
      } else {
        world.triggerActivity({ type: WorldActivityType.GAME_WAITING, assetId: keyAssetId }).catch((error: any) =>
          errorHandler({
            error,
            functionName: "handlePlayerSelection",
            message: "Error triggering GAME_WAITING activity",
          }),
        );
      }

      const analytics: Array<Record<string, any>> = [
        { analyticName: "joins", profileId, urlSlug, uniqueKey: profileId },
      ];

      await keyAsset.updateDataObject(updateFields, { analytics });

      // Best-effort canvas updates.
      await Promise.all([
        updateGameText(credentials, onCanvasText, `TicTacToe_gameText`),
        updateGameText(credentials, displayName, `TicTacToe_player${isPlayerX ? "X" : "O"}Text`),
      ]);

      // Badge counter: increment totalGamesPlayed for both players when
      // the second player has just joined.
      if (isSecondPlayerJoining) {
        try {
          const meVisitor = await Visitor.create(visitorId, urlSlug, { credentials });
          await meVisitor
            .incrementDataObjectValue("totalGamesPlayed", 1)
            .catch(() => console.warn("failed to increment totalGamesPlayed for joining player"));

          if (otherPlayer?.visitorId) {
            const otherVisitor = await Visitor.create(otherPlayer.visitorId, urlSlug, { credentials });
            await otherVisitor
              .incrementDataObjectValue("totalGamesPlayed", 1)
              .catch(() => console.warn("failed to increment totalGamesPlayed for other player"));
          }
        } catch (error) {
          errorHandler({
            error,
            functionName: "handlePlayerSelection",
            message: "Error incrementing totalGamesPlayed",
          });
        }
      }
    } catch (error) {
      await keyAsset.updateDataObject({ playerCount: (playerCount || 0) + 1 }).catch(() => {});
      throw error;
    }
    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handlePlayerSelection",
      message: "Error handling player selection",
      req,
      res,
    });
  }
};
