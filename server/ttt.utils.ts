import { Game } from "./topia/topia.models.js";
import topiaAdapter from "./adapters/topia.adapter.js";
import { initDroppedAsset, initWorld } from "./topia/topia.factories.js";
import { DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
import { Request } from "express";

export const WinningCombo = {
  H_TOP: [0, 1, 2],
  H_MID: [3, 4, 5],
  H_BOT: [6, 7, 8],
  V_LEFT: [0, 3, 6],
  V_MID: [1, 4, 7],
  V_RIGHT: [2, 5, 8],
  L_CROSS: [2, 4, 6],
  R_CROSS: [0, 4, 8],
  identify: (status: readonly [number, number, number, number, number, number, number, number, number]): null | readonly [number, number, number] => {
    if (status[0] && status[1] && status[2] && status[0] === status[1] && status[1] === status[2])
      return WinningCombo.H_TOP;

    if (status[3] && status[4] && status[5] && status[3] === status[4] && status[4] === status[5])
      return WinningCombo.H_MID;

    if (status[6] && status[7] && status[8] && status[6] === status[7] && status[7] === status[8])
      return WinningCombo.H_BOT;

    if (status[0] && status[3] && status[6] && status[0] === status[3] && status[3] === status[6])
      return WinningCombo.V_LEFT;

    if (status[1] && status[4] && status[7] && status[1] === status[4] && status[4] === status[7])
      return WinningCombo.V_MID;

    if (status[2] && status[5] && status[8] && status[2] === status[5] && status[5] === status[8])
      return WinningCombo.V_RIGHT;

    if (status[0] && status[4] && status[8] && status[0] === status[4] && status[4] === status[8])
      return WinningCombo.R_CROSS;

    if (status[2] && status[4] && status[6] && status[2] === status[4] && status[4] === status[6])
      return WinningCombo.L_CROSS;

    return null;
  },
} as const;

export default {
  updateLeaderboard: () => {
  },
  updateMessage: () => {
  },

  findWinningCombo: (status: [number, number, number, number, number, number, number, number, number]): null | {
    player: number,
    combo: readonly [number, number, number]
  } => {
    const combo = WinningCombo.identify(status);
    if (!combo)
      return null;
    return { player: status[combo[0]], combo };
  },

  dropStartButton: async (urlSlug: string, game: Game, credentials: InteractiveCredentials) => {
    // todo drop a start button at the given position, set a webhook to start the game as well
    const startBtn = await topiaAdapter.createWebImage({
      urlSlug, imageUrl: `${process.env.API_URL}/start_button.png`, position: game.center,
      uniqueName: `start_btn${game.suffix}`, credentials,
    });

    await startBtn.addWebhook({
      dataObject: {},
      isUniqueOnly: false,
      type: "assetClicked",
      url: `${process.env.API_URL}/backend/start`,
      title: "Start Game",
      description: "Starts the game",
    });

    // game.startBtnId = startBtn.id;
    return startBtn;
  },

  makeMove: async (options: {
    urlSlug: string,
    game: Game,
    cross: boolean,
    cell: string,
    credentials: InteractiveCredentials
  }) => {
    const cell = await initDroppedAsset().get(options.cell, options.urlSlug, { credentials: options.credentials }) as DroppedAssetInterface;
    return topiaAdapter.createWebImage({
      urlSlug: options.urlSlug,
      imageUrl: `${process.env.API_URL}/${options.cross ? `pink_cross` : "blue_o"}.png`,
      position: { x: cell.position.x || 0, y: cell.position.y || 0 },
      uniqueName: options.game.suffix + Date.now() + "_move",
      credentials: options.credentials,
    });
  },

  /**
   * Drops a finish line in the world
   */
  dropFinishLine: async (urlSlug: string, game: Game, combo: readonly [number, number, number], credentials: InteractiveCredentials) => {
    const cellWidth = 90;

    const color = game.player1.visitorId === credentials.visitorId ? "pink" : "blue";

    switch (combo) {
      case WinningCombo.H_TOP:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_horizontal.png`,
          position: { x: game.center.x, y: game.center.y - cellWidth },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.H_MID:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_horizontal.png`,
          position: game.center,
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.H_BOT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_horizontal.png`,
          position: { x: game.center.x, y: game.center.y + cellWidth },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.V_LEFT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_vertical.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.V_MID:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_vertical.png`,
          position: game.center,
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.V_RIGHT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_vertical.png`,
          position: { x: game.center.x + cellWidth, y: game.center.y },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.L_CROSS:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_oblique_1.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y + cellWidth },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });

      case WinningCombo.R_CROSS:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/${color}_oblique.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y - cellWidth },
          uniqueName: `finish_line${game.suffix}`, credentials,
        });
    }
  },

  extractSuffix: async (request: Request): Promise<string | undefined> => {
    const asset = await initDroppedAsset().get(request.body.assetId, request.body.urlSlug, { credentials: request.visitor.credentials }) as DroppedAssetInterface | undefined;
    if (!asset)
      return undefined;
    const suffix = asset.assetName;
    console.log("Suffix: ", suffix);
    return suffix;
  },

  removeMessages: async (urlSlug: string, suffix: string, credentials: InteractiveCredentials) => {
    const world = initWorld().create(urlSlug, { credentials });
    const messages = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: `message${suffix}` });
    console.log("messageAssets.length: ", messages.length);
    if (messages.length) {
      await Promise.allSettled(messages.map(m => m.deleteDroppedAsset()));
    }
  },
};

