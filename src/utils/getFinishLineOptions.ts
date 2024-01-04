import { combos, DroppedAsset, errorHandler } from "./index.js";
import { Credentials } from "../types/credentials";

const cellWidth = 80;

export const getFinishLineOptions = async (urlSlug: string, game: any, combo, credentials: Credentials) => {
  try {
    const boardAsset = await DroppedAsset.getWithUniqueName(
      "TicTacToeBoard",
      urlSlug,
      credentials.interactivePublicKey,
      process.env.INTERACTIVE_SECRET,
    );
    if (!boardAsset) throw "TicTacToe board not found";

    // @ts-ignore
    const position = boardAsset.position;
    const color = game.playerO.visitorId === credentials.visitorId ? "blue" : "pink";
    const options = {
      layer1: `${process.env.BUCKET}${color}_horizontal.png`,
      position,
      uniqueName: `TicTacToe_finishLine_${urlSlug}`,
      urlSlug,
    };

    switch (combo) {
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
  } catch (error: any) {
    errorHandler({
      error,
      functionName: "getFinishLineOptions",
      message: "Error getting finish line options.",
    });
  }
};
