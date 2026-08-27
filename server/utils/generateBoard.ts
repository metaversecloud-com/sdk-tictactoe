import { dropTextAsset, dropWebImageAsset, errorHandler, getDroppedAsset } from "./index.js";
import { Credentials } from "../types/credentialsInterface.js";
import { cellWidth, defaultGameText } from "../constants.js";
import { DroppedAssetClickType } from "@rtsdk/topia";

type GenerateOptions = {
  // If provided, only regenerate these uniqueNames from the label set
  // (TicTacToe_board / _gameText / _playerXText / _playerOText / _x / _o).
  missingUniqueNames?: string[];
  // If true, regenerate all 9 cells regardless.
  cellsShort?: boolean;
};

/**
 * Self-heal fallback: regenerate any missing pieces at their expected positions
 * relative to the key asset. This is NOT called on first drawer-open in normal
 * operation — admins are expected to drop a prebuilt scene. It runs only when
 * `verifyBoard` finds gaps.
 *
 * If called with no options, regenerates the full board (used on hard reset).
 */
export const generateBoard = async (credentials: Credentials, opts: GenerateOptions = {}) => {
  try {
    const keyAsset = await getDroppedAsset(credentials);
    if (!keyAsset) throw new Error("Key asset not found — cannot regenerate board");

    const { position: resetBtnCenter } = keyAsset as any;
    const boardCenter = {
      x: resetBtnCenter.x,
      y: resetBtnCenter.y - 200,
    };

    // APP_URL is the backend base (ends in `/api/`) — right for webhooks that
    // hit our routes, wrong for LINK-type assets that need to open a client
    // page in the drawer. Strip the trailing `/api` (with or without slash)
    // to get the app root; e.g. `https://foo.com/api/` → `https://foo.com/`.
    const appUrl = process.env.APP_URL || "";
    const appRootUrl = appUrl.replace(/\/api\/?$/, "/");

    const regenerateAll = !opts.missingUniqueNames && opts.cellsShort === undefined;
    const missingSet = new Set(opts.missingUniqueNames || []);
    const needs = (uniqueName: string) => regenerateAll || missingSet.has(uniqueName);

    const promises: Promise<any>[] = [];

    if (needs("TicTacToe_reset")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}reset.png`,
          position: resetBtnCenter,
          uniqueName: `TicTacToe_reset`,
          clickType: DroppedAssetClickType.LINK,
          clickableLink: `${appRootUrl}reset`,
          clickableLinkTitle: "Reset Tic Tac Toe",
        }),
      );
    }

    if (needs("TicTacToe_info")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}info.png`,
          position: { x: resetBtnCenter.x, y: resetBtnCenter.y + 100 },
          uniqueName: `TicTacToe_info`,
          clickType: DroppedAssetClickType.LINK,
          clickableLink: `${appRootUrl}info`,
          clickableLinkTitle: "How to Play Tic Tac Toe",
        }),
      );
    }

    if (needs("TicTacToe_leaderboard")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}leaderboard.png`,
          position: { x: boardCenter.x, y: resetBtnCenter.y - 475 },
          uniqueName: `TicTacToe_leaderboard`,
          clickType: DroppedAssetClickType.LINK,
          clickableLink: `${appRootUrl}leaderboard`,
          clickableLinkTitle: "Leaderboard",
        }),
      );
    }

    if (needs("TicTacToe_board")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}Board.png`,
          position: boardCenter,
          uniqueName: `TicTacToe_board`,
        }),
      );
    }

    if (needs("TicTacToe_gameText")) {
      promises.push(
        dropTextAsset({
          credentials,
          position: { x: boardCenter.x, y: resetBtnCenter.y - 375 },
          style: { textColor: "#ece4c3", textSize: 22, textWidth: 300 },
          text: defaultGameText,
          uniqueName: `TicTacToe_gameText`,
        }),
      );
    }

    if (needs("TicTacToe_playerXText")) {
      promises.push(
        dropTextAsset({
          credentials,
          position: { x: resetBtnCenter.x - 200, y: boardCenter.y },
          style: { textColor: "#ff61ff", textSize: 20, textWidth: 150 },
          text: "Player X",
          uniqueName: `TicTacToe_playerXText`,
        }),
      );
    }

    if (needs("TicTacToe_playerOText")) {
      promises.push(
        dropTextAsset({
          credentials,
          position: { x: resetBtnCenter.x + 200, y: boardCenter.y },
          style: { textColor: "#22ffff", textSize: 20, textWidth: 150 },
          text: "Player O",
          uniqueName: `TicTacToe_playerOText`,
        }),
      );
    }

    if (needs("TicTacToe_x")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}pink_x.png`,
          position: { x: resetBtnCenter.x - 200, y: boardCenter.y - cellWidth },
          uniqueName: `TicTacToe_x`,
        }).then((asset: any) =>
          asset?.addWebhook({
            dataObject: {},
            description: "",
            isUniqueOnly: false,
            type: "assetClicked",
            shouldSetClickType: true,
            title: "Pink X Selected",
            url: `${process.env.APP_URL}select-player/x`,
          }),
        ),
      );
    }

    if (needs("TicTacToe_o")) {
      promises.push(
        dropWebImageAsset({
          credentials,
          layer0: `${process.env.BUCKET}blue_o.png`,
          position: { x: resetBtnCenter.x + 200, y: boardCenter.y - cellWidth },
          uniqueName: `TicTacToe_o`,
        }).then(async (asset: any) => {
          console.log("🚀 ~ generateBoard.ts:164 ~ asset:", asset.uniqueName);
          await asset?.addWebhook({
            dataObject: {},
            description: "",
            isUniqueOnly: false,
            type: "assetClicked",
            shouldSetClickType: true,
            title: "Blue O Selected",
            url: `${process.env.APP_URL}select-player/o`,
          });
        }),
      );
    }

    // Cells are all-or-nothing: if we're regenerating cells we regenerate all 9
    // (their shared uniqueName means we can't easily know which one is missing).
    if (regenerateAll || opts.cellsShort) {
      const cellDefs = [
        { image: "TopLeft.png", x: boardCenter.x - cellWidth, y: boardCenter.y - cellWidth, idx: 0 },
        { image: "TopCenter.png", x: boardCenter.x, y: boardCenter.y - cellWidth, idx: 1 },
        { image: "TopRight.png", x: boardCenter.x + cellWidth, y: boardCenter.y - cellWidth, idx: 2 },
        { image: "MiddleLeft.png", x: boardCenter.x - cellWidth, y: boardCenter.y, idx: 3 },
        { image: "MiddleCenter.png", x: boardCenter.x, y: boardCenter.y, idx: 4 },
        { image: "MiddleRight.png", x: boardCenter.x + cellWidth, y: boardCenter.y, idx: 5 },
        { image: "BottomLeft.png", x: boardCenter.x - cellWidth, y: boardCenter.y + cellWidth, idx: 6 },
        { image: "BottomCenter.png", x: boardCenter.x, y: boardCenter.y + cellWidth, idx: 7 },
        { image: "BottomRight.png", x: boardCenter.x + cellWidth, y: boardCenter.y + cellWidth, idx: 8 },
      ];
      for (const c of cellDefs) {
        promises.push(
          dropWebImageAsset({
            credentials,
            layer0: `${process.env.BUCKET}${c.image}`,
            position: { x: c.x, y: c.y },
            uniqueName: `TicTacToe_cell`,
          }).then((asset: any) =>
            asset?.addWebhook({
              dataObject: {},
              description: `Cell ${c.idx}`,
              isUniqueOnly: false,
              type: "assetClicked",
              shouldSetClickType: true,
              title: `Cell ${c.idx} Clicked`,
              url: `${process.env.APP_URL}click/${c.idx}`,
            }),
          ),
        );
      }
    }

    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "generateBoard",
      message: "Error generating game board.",
    });
  }
};
