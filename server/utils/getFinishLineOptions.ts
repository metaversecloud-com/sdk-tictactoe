import { combos } from "./getGameStatus.js";
import { errorHandler } from "./errorHandler.js";
import { cellWidth } from "../constants.js";

/**
 * Given the winning combo, return the layer + position for the finish-line PNG
 * that should be dropped over the board.
 * Positions are relative to the *board center* (which sits 200 above the key asset).
 */
export const getFinishLineOptions = (
  isPlayerO: boolean,
  keyAssetPosition: { x?: number; y?: number },
  winningCombo: number[],
) => {
  try {
    const position: { x: number; y: number } = {
      x: keyAssetPosition.x || 0,
      y: (keyAssetPosition.y || 0) - 200,
    };

    const color = isPlayerO ? "blue" : "pink";
    const options: {
      layer1: string;
      position: { x: number; y: number };
      uniqueName: string;
    } = {
      layer1: `${process.env.BUCKET}${color}_horizontal.png`,
      position,
      uniqueName: `TicTacToe_finishLine`,
    };

    switch (winningCombo) {
      case combos.H_TOP:
        options.position = { x: position.x, y: position.y - cellWidth };
        break;

      case combos.H_BOT:
        options.position = { x: position.x, y: position.y + cellWidth };
        break;

      case combos.V_LEFT:
        options.position = { x: position.x - cellWidth, y: position.y };
        options.layer1 = `${process.env.BUCKET}${color}_vertical.png`;
        break;

      case combos.V_MID:
        options.layer1 = `${process.env.BUCKET}${color}_vertical.png`;
        break;

      case combos.V_RIGHT:
        options.position = { x: position.x + cellWidth, y: position.y };
        options.layer1 = `${process.env.BUCKET}${color}_vertical.png`;
        break;

      case combos.L_CROSS:
        options.layer1 = `${process.env.BUCKET}${color}_oblique_1.png`;
        break;

      case combos.R_CROSS:
        options.layer1 = `${process.env.BUCKET}${color}_oblique.png`;
        break;
    }
    return options;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getFinishLineOptions",
      message: "Error getting finish line options.",
    });
  }
};
