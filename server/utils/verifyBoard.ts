import { Credentials } from "../types/credentialsInterface.js";
import { World } from "./topiaInit.js";
import { errorHandler } from "./errorHandler.js";
import { generateBoard } from "./generateBoard.js";
import { KEY_ASSET_UNIQUE_NAME } from "../constants.js";

/**
 * uniqueNames a prebuilt board scene must contain (excluding the key asset,
 * which is checked separately since a missing key asset triggers a full
 * rebuild rather than a per-piece repair). Cells share one uniqueName; the
 * count is compared to `REQUIRED_CELL_COUNT` below.
 */
const REQUIRED_LABEL_UNIQUE_NAMES = [
  "TicTacToe_board",
  "TicTacToe_gameText",
  "TicTacToe_playerXText",
  "TicTacToe_playerOText",
  "TicTacToe_x",
  "TicTacToe_o",
];
const REQUIRED_CELL_UNIQUE_NAME = "TicTacToe_cell";
const REQUIRED_CELL_COUNT = 9;

export interface VerifyBoardResult {
  ok: boolean;
  /** Some pieces were regenerated in place (partial repair). */
  regenerated: boolean;
  /**
   * The scene was fully rebuilt: the key asset (`TicTacToe_reset`) was missing,
   * so every existing dropped asset was cleared and a fresh board generated,
   * then the asset that fired the webhook was deleted last. Callers should
   * NOT continue their normal flow when this is true — the world state under
   * them has been replaced.
   */
  fullRebuild: boolean;
}

/**
 * Check that a scene has all board assets. If any are missing, invoke
 * `generateBoard` to regenerate them at their expected positions relative to
 * the key asset. Safe to call on every drawer open OR every webhook click —
 * it's a no-op when the board is complete.
 *
 * Special case: if the key asset (uniqueName `TicTacToe_reset`) is missing,
 * we can't self-heal in place (`generateBoard` positions everything relative
 * to it). Instead we clear the entire scene EXCEPT the asset that fired the
 * webhook, regenerate a fresh board, and finally delete the firing asset as
 * the last step. That gets us back to a good baseline no matter which stray
 * asset the visitor happened to click.
 *
 * Implementation: one `fetchDroppedAssetsBySceneDropId` up front (no uniqueName
 * filter) gives us the full scene. Every count check below is an in-memory
 * pass over that list — no per-uniqueName round trips.
 */
export const verifyBoard = async (credentials: Credentials): Promise<VerifyBoardResult> => {
  try {
    const { assetId: clickedAssetId, sceneDropId, urlSlug } = credentials;
    if (!sceneDropId) {
      // No scene means nothing to verify — the app is being opened in a way
      // that doesn't carry sceneDropId. Skip silently.
      return { ok: false, regenerated: false, fullRebuild: false };
    }

    const world = World.create(urlSlug, { credentials });

    // Single scene-wide fetch. Everything below is a local count/filter.
    let allSceneAssets: any[] = [];
    try {
      const fetched: any = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });
      allSceneAssets = Array.isArray(fetched) ? fetched : Array.isArray(fetched?.assets) ? fetched.assets : [];
    } catch (error) {
      // If we can't enumerate the scene we can't safely verify anything.
      // Treat as no-op rather than risk a false-positive rebuild.
      errorHandler({
        error,
        functionName: "verifyBoard",
        message: "Non-fatal: could not enumerate scene assets",
      });
      return { ok: false, regenerated: false, fullRebuild: false };
    }

    const countsByUniqueName = new Map<string, number>();
    for (const asset of allSceneAssets) {
      const name = asset?.uniqueName;
      if (typeof name !== "string") continue;
      countsByUniqueName.set(name, (countsByUniqueName.get(name) || 0) + 1);
    }

    // Key asset missing → full rebuild.
    if ((countsByUniqueName.get(KEY_ASSET_UNIQUE_NAME) || 0) === 0) {
      console.log(`verifyBoard: key asset missing for scene ${sceneDropId} — clearing scene and rebuilding`);

      // 1. Delete everything EXCEPT the asset that fired the click. Leaving
      // the firing asset in place until the very end avoids surprising the
      // webhook context we're running under.
      const preClickedIds = allSceneAssets
        .map((a) => a?.id)
        .filter((id): id is string => !!id && id !== clickedAssetId);

      if (preClickedIds.length > 0) {
        try {
          await World.deleteDroppedAssets(urlSlug, preClickedIds, process.env.INTERACTIVE_SECRET || "", credentials);
        } catch (error) {
          errorHandler({
            error,
            functionName: "verifyBoard",
            message: "Non-fatal: failed to delete stale scene assets during rebuild",
          });
        }
      }

      // 2. Rebuild the entire scene from scratch (this drops a fresh key
      // asset, which future clicks will bind to).
      await generateBoard(credentials);

      // 3. Delete the click's originating asset LAST — after the rebuild
      // owns the scene. Best-effort: if it's already gone or the delete
      // fails, we still return a successful rebuild.
      if (clickedAssetId) {
        try {
          await World.deleteDroppedAssets(urlSlug, [clickedAssetId], process.env.INTERACTIVE_SECRET || "", credentials);
        } catch (error) {
          errorHandler({
            error,
            functionName: "verifyBoard",
            message: "Non-fatal: failed to delete originating asset after rebuild",
          });
        }
      }

      return { ok: true, regenerated: true, fullRebuild: true };
    }

    // Key asset present — partial-repair path.
    const missingLabels = REQUIRED_LABEL_UNIQUE_NAMES.filter(
      (uniqueName) => (countsByUniqueName.get(uniqueName) || 0) === 0,
    );
    const cellCount = countsByUniqueName.get(REQUIRED_CELL_UNIQUE_NAME) || 0;
    const cellsShort = cellCount < REQUIRED_CELL_COUNT;

    if (missingLabels.length === 0 && !cellsShort) {
      return { ok: true, regenerated: false, fullRebuild: false };
    }

    console.log(
      `verifyBoard: regenerating missing pieces for scene ${sceneDropId} — labels missing=${JSON.stringify(
        missingLabels,
      )}, cells found=${cellCount}`,
    );
    await generateBoard(credentials, { missingUniqueNames: missingLabels, cellsShort });
    return { ok: true, regenerated: true, fullRebuild: false };
  } catch (error) {
    errorHandler({
      error,
      functionName: "verifyBoard",
      message: "Error verifying board scene",
    });
    return { ok: false, regenerated: false, fullRebuild: false };
  }
};
