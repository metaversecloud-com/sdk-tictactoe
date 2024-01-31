import { combos, errorHandler } from "./index.js";
import { cellWidth } from "../constants.js";

export const getFinishLineOptions = async (
  isPlayerO: boolean,
  keyAssetId: string,
  keyAssetPosition: { x?: number; y?: number },
  winningCombo: number[],
) => {
  try {
    const position = {
      x: keyAssetPosition.x,
      y: keyAssetPosition.y - 200,
    };

    const color = isPlayerO ? "blue" : "pink";
    const options = {
      layer1: `${process.env.BUCKET}${color}_horizontal.png`,
      position,
      uniqueName: `${keyAssetId}_TicTacToe_finishLine`,
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
