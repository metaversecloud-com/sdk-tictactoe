import { Request, Response } from "express";
import {
  addNewRowToGoogleSheets,
  DroppedAsset,
  dropWebImageAsset,
  errorHandler,
  getCredentials,
  getDroppedAssetDataObject,
  getFinishLineOptions,
  getGameStatus,
  getVisitorBadges,
  grantBadgeIfNew,
  incrementLeaderboardEntry,
  lockDataObject,
  updateGameText,
  Visitor,
  World,
} from "../utils/index.js";
import { GameDataType } from "../types/gameDataType.js";
import {
  BADGE_CHAMPION,
  BADGE_CHAMPION_WINS,
  BADGE_HOBBYIST,
  BADGE_HOBBYIST_GAMES,
  BADGE_VICTORY,
  cellWidth,
} from "../constants.js";

/**
 * Place a move in a specific cell. Runs win/draw detection, drops the move
 * sprite, updates the game text, and — on win — drops the finish-line PNG
 * and crown, increments world stats, updates the leaderboard, and awards
 * ecosystem badges.
 */
export const handleClaimCell = async (req: Request, res: Response) => {
  try {
    const source =
      req.body && req.body.interactiveNonce ? req.body : req.query && req.query.interactiveNonce ? req.query : req.body;
    const credentials = getCredentials(source);
    const { displayName, profileId, urlSlug, visitorId } = credentials;

    let text = "";
    let shouldUpdateGame = false;
    const analytics: Array<Record<string, any>> = [];

    const cell = parseInt(req.params.cell);
    if (isNaN(cell)) throw new Error("Cell is missing.");

    const dataObjResult = await getDroppedAssetDataObject(credentials);
    if (!dataObjResult || !("keyAsset" in dataObjResult)) throw new Error("Unable to load game key asset");
    const { keyAsset } = dataObjResult;

    const gameData = (keyAsset.dataObject || {}) as GameDataType;
    const {
      claimedCells = {},
      isGameOver,
      isResetInProgress,
      keyAssetId,
      lastPlayerTurn,
      playerO,
      playerX,
      resetCount,
      turnCount,
    } = gameData;

    if (isResetInProgress) throw new Error("Reset in progress.");

    const updatedData: Record<string, any> = {
      isGameOver,
      lastPlayerTurn,
      lastInteraction: new Date(),
      turnCount: (turnCount || 0) + 1,
    };

    try {
      try {
        const timestamp = new Date(Math.round(new Date().getTime() / 5000) * 5000);
        await lockDataObject(`${keyAssetId}-${resetCount}-${turnCount}-${timestamp}`, keyAsset);
      } catch (error) {
        return res.status(409).json({ message: "Move already in progress." });
      }

      if (isGameOver) {
        text = "Game over! Press Reset to play again.";
      } else if (!playerO?.visitorId || !playerX?.visitorId) {
        text = "Two players are needed to get started.";
      } else if (playerO.visitorId !== visitorId && playerX.visitorId !== visitorId) {
        text = "Game in progress.";
      } else if ((claimedCells as any)[cell]) {
        text = "Cannot place your move here.";
      } else if (lastPlayerTurn === visitorId) {
        const otherName = playerX.visitorId === visitorId ? playerO.displayName : playerX.displayName;
        text = `It's ${otherName}'s turn.`;
      } else {
        updatedData.lastPlayerTurn = visitorId;
        (claimedCells as any)[cell] = visitorId;
        shouldUpdateGame = true;
        const nextName = lastPlayerTurn === playerO.visitorId ? playerO.displayName : playerX.displayName;
        text = `It's ${nextName}'s turn.`;
      }

      if (!shouldUpdateGame) {
        await updateGameText(credentials, text, `TicTacToe_gameText`);
        throw text;
      }

      const promises: Promise<any>[] = [];

      // Locate this specific cell (identified by credentials.assetId — the
      // clicked dropped asset) so we can drop the move at its position.
      const world = World.create(urlSlug, { credentials });
      const clickedCellId = credentials.assetId;
      let cellPosition: { x?: number; y?: number } | null = null;
      try {
        if (clickedCellId) {
          const clickedAsset = await DroppedAsset.get(clickedCellId, urlSlug, { credentials });
          cellPosition = (clickedAsset as any)?.position || null;
        }
      } catch (error) {
        // Non-fatal — proceed without cell position; drop happens near the board center.
      }

      promises.push(
        dropWebImageAsset({
          credentials,
          layer1: `${process.env.BUCKET}${visitorId === playerO?.visitorId ? "blue_o" : "pink_x"}.png`,
          position: cellPosition ?? { x: keyAsset.position.x, y: (keyAsset.position.y || 0) - 200 },
          uniqueName: `TicTacToe_move`,
        }),
      );

      // Fire `starts` on the first move (turnCount = 0 at entry).
      if ((turnCount || 0) === 0) {
        analytics.push(
          { analyticName: "starts", profileId: playerO.profileId, urlSlug, uniqueKey: playerO.profileId },
          { analyticName: "starts", profileId: playerX.profileId, urlSlug, uniqueKey: playerX.profileId },
        );
        addNewRowToGoogleSheets([{ event: "starts", urlSlug, profileId }]);
      }

      const gameStatus = getGameStatus(claimedCells);
      let didWin = false;
      let didTie = false;

      if (gameStatus.isDraw) {
        text = "It's a draw! Press Reset to play again.";
        updatedData.isGameOver = true;
        didTie = true;

        world
          .triggerParticle({ position: keyAsset.position, name: "pastelConfetti_explosion" })
          .catch((error: any) =>
            errorHandler({ error, functionName: "handleClaimCell", message: "Error triggering particles" }),
          );

        const uniqueKey =
          (playerO.profileId || "") > (playerX.profileId || "")
            ? `${playerO.profileId}-${playerX.profileId}`
            : `${playerX.profileId}-${playerO.profileId}`;
        analytics.push(
          { analyticName: "ties", profileId: playerO.profileId, urlSlug, uniqueKey },
          { analyticName: "ties", profileId: playerX.profileId, urlSlug, uniqueKey },
          { analyticName: "completions", profileId: playerO.profileId, urlSlug, uniqueKey: playerO.profileId },
          { analyticName: "completions", profileId: playerX.profileId, urlSlug, uniqueKey: playerX.profileId },
        );
        addNewRowToGoogleSheets([
          { event: "ties", urlSlug, profileId: playerO.profileId },
          { event: "ties", urlSlug, profileId: playerX.profileId },
          { event: "completions", urlSlug, profileId: playerO.profileId },
          { event: "completions", urlSlug, profileId: playerX.profileId },
        ]);
      } else if (gameStatus.hasWinningCombo) {
        text = `${displayName} wins!`;
        updatedData.isGameOver = true;
        didWin = true;
        const keyAssetPosition = keyAsset.position;

        // Drop finish line
        const finishLineOptions = getFinishLineOptions(
          playerO.visitorId === visitorId,
          keyAssetPosition,
          gameStatus.winningCombo || [],
        );
        if (finishLineOptions && !("error" in (finishLineOptions as any))) {
          promises.push(dropWebImageAsset({ credentials, ...(finishLineOptions as any) }));
        }

        // Drop crown
        const crownPos = {
          x: playerO.visitorId === visitorId ? (keyAssetPosition.x || 0) + 200 : (keyAssetPosition.x || 0) - 200,
          y: (keyAssetPosition.y || 0) - 180 - cellWidth * 2,
        };
        promises.push(
          dropWebImageAsset({
            credentials,
            layer0: `${process.env.BUCKET}crown.png`,
            position: crownPos,
            uniqueName: `TicTacToe_crown`,
          }),
        );

        // Winner particles
        try {
          const winnerVisitor = await Visitor.create(visitorId, urlSlug, { credentials });
          winnerVisitor
            .triggerParticle({ name: "crown_float" })
            .catch((error: any) =>
              errorHandler({ error, functionName: "handleClaimCell", message: "Error triggering particles" }),
            );
        } catch (error) {
          errorHandler({ error, functionName: "handleClaimCell", message: "Error building winner visitor" });
        }

        // World-scoped counters (kept for backwards compat with world stats consumers)
        analytics.push(
          { analyticName: "wins", profileId, urlSlug, uniqueKey: profileId },
          { analyticName: "completions", profileId: playerO.profileId, urlSlug, uniqueKey: playerO.profileId },
          { analyticName: "completions", profileId: playerX.profileId, urlSlug, uniqueKey: playerX.profileId },
        );
        addNewRowToGoogleSheets([
          { event: "wins", urlSlug, profileId },
          { event: "completions", urlSlug, profileId: playerO.profileId },
          { event: "completions", urlSlug, profileId: playerX.profileId },
        ]);
      }

      // Persist game-state update + game text.
      promises.push(
        keyAsset.updateDataObject(
          {
            ...updatedData,
            [`claimedCells.${cell}`]: visitorId,
          },
          { analytics },
        ),
      );
      promises.push(updateGameText(credentials, text, `TicTacToe_gameText`));

      await Promise.all(promises);

      // On a win, update leaderboard + increment visitor counters + award badges.
      if (didWin) {
        // Leaderboard (best-effort)
        try {
          await incrementLeaderboardEntry(keyAsset, profileId, displayName);
        } catch (error) {
          errorHandler({ error, functionName: "handleClaimCell", message: "Error updating leaderboard" });
        }

        // Visitor counter + badge checks
        try {
          const winnerVisitor = await Visitor.create(visitorId, urlSlug, { credentials });
          await winnerVisitor.incrementDataObjectValue("totalWins", 1).catch(() => null);
          // Read back the visitor's data & inventory to gate badges.
          await winnerVisitor.fetchDataObject().catch(() => {});
          await winnerVisitor.fetchInventoryItems().catch(() => {});
          const vData = (winnerVisitor as any).dataObject || {};
          const totalWins: number = (vData.totalWins as number) || 0;
          const totalGamesPlayed: number = (vData.totalGamesPlayed as number) || 0;
          const ownedBadgeNames = new Set(Object.keys(getVisitorBadges((winnerVisitor as any).inventoryItems || [])));

          const badgesToTry: Array<{ name: string; threshold: (w: number, g: number) => boolean }> = [
            { name: BADGE_VICTORY, threshold: (w) => w >= 1 },
            { name: BADGE_CHAMPION, threshold: (w) => w >= BADGE_CHAMPION_WINS },
            { name: BADGE_HOBBYIST, threshold: (_w, g) => g >= BADGE_HOBBYIST_GAMES },
          ];

          for (const b of badgesToTry) {
            if (!b.threshold(totalWins, totalGamesPlayed)) continue;
            const result = await grantBadgeIfNew({
              credentials,
              visitor: winnerVisitor,
              badgeName: b.name,
              ownedBadgeNames,
            });
            if (result.granted) {
              // Fire a badge_earned analytic for tracking.
              try {
                await winnerVisitor.updateDataObject(
                  {},
                  {
                    analytics: [
                      {
                        analyticName: `badge_earned_${b.name.replace(/\s+/g, "_")}`,
                        profileId,
                        urlSlug,
                        uniqueKey: profileId,
                      },
                    ],
                  },
                );
              } catch (error) {
                // Non-fatal.
              }
              ownedBadgeNames.add(b.name);
            }
          }
        } catch (error) {
          errorHandler({ error, functionName: "handleClaimCell", message: "Error awarding badges" });
        }
      }

      void didTie;
    } catch (error) {
      await keyAsset.updateDataObject({ turnCount: (turnCount || 0) + 1 }).catch(() => {});
      throw error;
    }
    return res.status(200).send({ message: "Move successfully made." });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleClaimCell",
      message: "Error making a move.",
      req,
      res,
    });
  }
};
