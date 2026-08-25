import { Credentials } from "../types/credentialsInterface.js";
import { World } from "./topiaInit.js";
import { errorHandler } from "./errorHandler.js";
import { generateBoard } from "./generateBoard.js";

/**
 * Required uniqueNames a prebuilt board scene must contain.
 * Cells intentionally share one uniqueName — all 9 cells are looked up as a batch.
 */
const REQUIRED_SCENE_UNIQUE_NAMES = [
  "TicTacToe_board",
  "TicTacToe_gameText",
  "TicTacToe_playerXText",
  "TicTacToe_playerOText",
  "TicTacToe_x",
  "TicTacToe_o",
];
const REQUIRED_CELL_UNIQUE_NAME = "TicTacToe_cell";
const REQUIRED_CELL_COUNT = 9;

/**
 * Check that a scene has all board assets. If any are missing, invoke
 * `generateBoard` to regenerate them at their expected positions relative to
 * the key asset. Safe to call on every drawer open — it's a no-op when the
 * board is complete.
 */
export const verifyBoard = async (
  credentials: Credentials,
): Promise<{ ok: boolean; regenerated: boolean }> => {
  try {
    const { sceneDropId, urlSlug } = credentials;
    if (!sceneDropId) {
      // No scene means nothing to verify — the app is being opened in a way
      // that doesn't carry sceneDropId. Skip silently.
      return { ok: false, regenerated: false };
    }

    const world = World.create(urlSlug, { credentials });
    const [labelResults, cellsRaw] = await Promise.all([
      Promise.all(
        REQUIRED_SCENE_UNIQUE_NAMES.map((uniqueName) =>
          world
            .fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName })
            .then((assets: any) => ({ uniqueName, count: Array.isArray(assets) ? assets.length : 0 }))
            .catch(() => ({ uniqueName, count: 0 })),
        ),
      ),
      world
        .fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName: REQUIRED_CELL_UNIQUE_NAME })
        .catch(() => []),
    ]);

    const missingLabels = labelResults.filter((r) => r.count === 0).map((r) => r.uniqueName);
    const cellCount = Array.isArray(cellsRaw) ? cellsRaw.length : 0;
    const cellsShort = cellCount < REQUIRED_CELL_COUNT;

    if (missingLabels.length === 0 && !cellsShort) {
      return { ok: true, regenerated: false };
    }

    console.log(
      `verifyBoard: regenerating missing pieces for scene ${sceneDropId} — labels missing=${JSON.stringify(
        missingLabels,
      )}, cells found=${cellCount}`,
    );
    await generateBoard(credentials, { missingUniqueNames: missingLabels, cellsShort });
    return { ok: true, regenerated: true };
  } catch (error) {
    errorHandler({
      error,
      functionName: "verifyBoard",
      message: "Error verifying board scene",
    });
    return { ok: false, regenerated: false };
  }
};
