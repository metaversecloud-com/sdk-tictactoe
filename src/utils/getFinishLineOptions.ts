import { Game } from "../topia/index.js";
import { combos, errorHandler } from "../utils/index.js";
import { Credentials } from "../types/credentials";

const cellWidth = 80;

export const getFinishLineOptions = (urlSlug: string, game: Game, combo, credentials: Credentials) => {
  try {
    const color = game.player1.visitorId === credentials.visitorId ? "pink" : "blue";
    const options = {
      layer1: `${process.env.API_URL}/${color}_horizontal.png`,
      position: { x: game.center.x, y: game.center.y - cellWidth },
      uniqueName: `finish_line${game.id}`,
      urlSlug,
    };

    switch (combo) {
      case combos.H_MID:
        options.position = game.center;
        break;

      case combos.H_BOT:
        options.position = { x: game.center.x, y: game.center.y + cellWidth };
        break;

      case combos.V_LEFT:
        options.position = { x: game.center.x - cellWidth, y: game.center.y };
        options.layer1 = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case combos.V_MID:
        options.position = game.center;
        options.layer1 = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case combos.V_RIGHT:
        options.position = { x: game.center.x + cellWidth, y: game.center.y };
        options.layer1 = `${process.env.API_URL}/${color}_vertical.png`;
        break;

      case combos.L_CROSS:
        options.position = game.center;
        options.layer1 = `${process.env.API_URL}/${color}_oblique_1.png`;
        break;

      case combos.R_CROSS:
        options.position = game.center;
        options.layer1 = `${process.env.API_URL}/${color}_oblique.png`;
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
