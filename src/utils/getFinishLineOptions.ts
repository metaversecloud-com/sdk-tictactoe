import { combos, errorHandler, getDroppedAsset } from "./index.js";
import { Credentials } from "../types/credentialsInterface";

const cellWidth = 80;

export const getFinishLineOptions = async (assetId: string, combo, credentials: Credentials, game: any) => {
  try {
    const { urlSlug, visitorId } = credentials;
    credentials.assetId = assetId;

    const keyAsset = await getDroppedAsset(credentials);
    if (!keyAsset) throw "TicTacToe board not found";

    const position = {
      x: keyAsset.position.x,
      y: keyAsset.position.y - 200,
    };

    const color = game.playerO.visitorId === visitorId ? "blue" : "pink";
    const options = {
      layer1: `${process.env.BUCKET}${color}_horizontal.png`,
      position,
      uniqueName: `${assetId}_TicTacToe_finishLine`,
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
  } catch (error) {
    errorHandler({
      error,
      functionName: "getFinishLineOptions",
      message: "Error getting finish line options.",
    });
  }
};
