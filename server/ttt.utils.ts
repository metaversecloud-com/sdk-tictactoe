import { Game } from "./topia/topia.models.js";
import topiaAdapter from "./adapters/topia.adapter.js";
import { initDroppedAsset, initWorld } from "./topia/topia.factories.js";
import { DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
import { BoardIdData } from "./topia/DataObject.js";

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
      uniqueName: game.boardId + "_start_btn", credentials,
    });

    await BoardIdData.write(startBtn, game.boardId);

    await startBtn.addWebhook({
      dataObject: { boardId: game.boardId },
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
      imageUrl: `${process.env.API_URL}/${options.cross ? `blue_x` : "pink_o"}.png`,
      position: { x: cell.position.x || 0, y: cell.position.y || 0 },
      uniqueName: options.game.boardId + Date.now() + "_move",
      credentials: options.credentials,
    });
  },

  dropFinishLine: async (urlSlug: string, game: Game, combo: readonly [number, number, number], credentials: InteractiveCredentials) => {
    const cellWidth = 90;

    switch (combo) {
      case WinningCombo.H_TOP:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_horizontal.png`,
          position: { x: game.center.x, y: game.center.y - cellWidth },
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.H_MID:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_horizontal.png`,
          position: game.center,
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.H_BOT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_horizontal.png`,
          position: { x: game.center.x, y: game.center.y + cellWidth },
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.V_LEFT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_vertical.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y },
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.V_MID:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_vertical.png`,
          position: game.center,
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.V_RIGHT:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_vertical.png`,
          position: { x: game.center.x + cellWidth, y: game.center.y },
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.L_CROSS:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_oblique.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y + cellWidth },
          uniqueName: game.boardId + "_finish_line", credentials,
        });

      case WinningCombo.R_CROSS:
        return topiaAdapter.createWebImage({
          urlSlug,
          imageUrl: `${process.env.API_URL}/blue_oblique.png`,
          position: { x: game.center.x - cellWidth, y: game.center.y - cellWidth },
          uniqueName: game.boardId + "_finish_line", credentials,
        });
    }
  },

  extractBoardId: (requestBody: any): number | undefined => {
    const dataObject: { boardId?: number, target?: any } | undefined = requestBody.dataObject;
    if (!dataObject)
      return undefined;
    let bId: any | undefined = dataObject.boardId;

    if (!bId && dataObject.target && dataObject.target.value && dataObject.target.value.boardId)
      bId = dataObject.target.value.boardId;

    if (!bId)
      return undefined;

    const boardId = Number(bId);
    if (isNaN(boardId))
      return undefined;
    return boardId;
  },

  removeMessages: async (urlSlug: string, boardId: number, credentials: InteractiveCredentials) => {
    const world = initWorld().create(urlSlug, { credentials });
    const messages = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: boardId + "_message" });
    console.log("messageAssets.length: ", messages.length);
    if (messages.length) {
      for (let m of messages)
        await m.deleteDroppedAsset();
    }
  },
};

