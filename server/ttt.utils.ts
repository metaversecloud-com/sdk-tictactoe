import { Game } from "./topia/topia.models.js";
import topiaAdapter from "./adapters/topia.adapter.js";
import { initDroppedAsset, initWorld } from "./topia/topia.factories.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

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
    if (status[0] === status[1] && status[1] === status[2])
      return WinningCombo.H_TOP;

    if (status[3] === status[4] && status[4] === status[5])
      return WinningCombo.H_MID;

    if (status[6] === status[7] && status[7] === status[8])
      return WinningCombo.H_BOT;

    if (status[0] === status[3] && status[3] === status[6])
      return WinningCombo.V_LEFT;

    if (status[1] === status[4] && status[4] === status[7])
      return WinningCombo.V_MID;

    if (status[2] === status[5] && status[5] === status[8])
      return WinningCombo.V_RIGHT;

    if (status[0] === status[4] && status[4] === status[8])
      return WinningCombo.R_CROSS;

    if (status[2] === status[4] && status[4] === status[6])
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

  dropStartButton: async (urlSlug: string, game: Game, requestBody: any) => {
    // todo drop a start button at the given position, set a webhook to start the game as well
    return topiaAdapter.dropAsset(urlSlug, {
      assetId: process.env.START_BUTTON!!, position: game.center,
      uniqueName: game.boardId + "_start_btn",
    }, requestBody);
  },

  makeMove: async (options: { urlSlug: string, game: Game, cross: boolean, cell: string, requestBody: any }) => {
    const assetId = options.cross ? process.env.RED_X!! : process.env.BLUE_O!!;
    const daFactory = initDroppedAsset();
    const cell = await daFactory.get(options.cell, options.urlSlug, { credentials: options.requestBody }) as DroppedAssetInterface;
    return topiaAdapter.dropAsset(options.urlSlug, {
      assetId,
      position: { x: cell.position.x || 0, y: cell.position.y || 0 },
      uniqueName: options.game.boardId + Date.now() + "_move",
    }, options.requestBody);
  },

  dropFinishLine: async (urlSlug: string, game: Game, combo: readonly [number, number, number], requestBody: any) => {
    // todo get asset IDs for vertical line, horizontal line, and oblique line
    const H_LINE = process.env.H_RED_LINE!!;
    const V_LINE = process.env.V_RED_LINE!!;
    const O_LINE = process.env.O_RED_LINE!!;

    const cellWidth = 90;

    switch (combo) {
      case WinningCombo.H_TOP:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: H_LINE,
          position: { x: game.center.x, y: game.center.y - cellWidth },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.H_MID:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: H_LINE,
          position: game.center,
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.H_BOT:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: H_LINE,
          position: { x: game.center.x, y: game.center.y + cellWidth },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.V_LEFT:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: V_LINE,
          position: { x: game.center.x - cellWidth, y: game.center.y },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.V_MID:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: V_LINE,
          position: game.center,
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.V_RIGHT:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: V_LINE,
          position: { x: game.center.x + cellWidth, y: game.center.y },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.L_CROSS:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: O_LINE,
          position: { x: game.center.x - cellWidth, y: game.center.y + cellWidth },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);

      case WinningCombo.R_CROSS:
        return topiaAdapter.dropAsset(urlSlug, {
          assetId: O_LINE,
          position: { x: game.center.x - cellWidth, y: game.center.y - cellWidth },
          uniqueName: game.boardId + "_finish_line",
        }, requestBody);
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

  removeMessages: async (urlSlug: string, boardId: number, requestBody: any) => {
    const world = initWorld().create(urlSlug, { credentials: requestBody });
    const messages = await world.fetchDroppedAssetsWithUniqueName({ uniqueName: boardId + "_message" });
    console.log("messageAssets.length: ", messages.length);
    if (messages.length) {
      for (let m of messages)
        await m.deleteDroppedAsset();
    }
  },
};

