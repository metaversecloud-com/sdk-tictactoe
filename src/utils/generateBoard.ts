import {
  dropTextAsset,
  dropWebImageAsset,
  errorHandler,
  getDroppedAsset,
  initializeDroppedAssetDataObject,
} from "./index.js";
import { Credentials } from "../types/credentialsInterface.js";
import { cellWidth } from "../constants.js";

export const generateBoard = async (credentials: Credentials) => {
  try {
    const { assetId } = credentials;
    const keyAsset = await getDroppedAsset(credentials);
    const { position: resetBtnCenter } = keyAsset;
    const boardCenter = {
      x: resetBtnCenter.x,
      y: resetBtnCenter.y - 200,
    };

    initializeDroppedAssetDataObject(keyAsset);

    await Promise.all([
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}Board.png`,
        position: boardCenter,
        uniqueName: `${assetId}_TicTacToe_board`,
      }),
      dropTextAsset({
        credentials,
        position: {
          x: boardCenter.x,
          y: resetBtnCenter.y - 375,
        },
        style: { textColor: "#ece4c3", textSize: 24, textWidth: 300 },
        text: "Click X or O to begin!",
        uniqueName: `${assetId}_TicTacToe_gameText`,
      }),
      dropTextAsset({
        credentials,
        position: {
          x: resetBtnCenter.x - 200,
          y: boardCenter.y,
        },
        style: { textColor: "#ff61ff", textSize: 24, textWidth: 170 },
        text: "",
        uniqueName: `${assetId}_TicTacToe_playerXText`,
      }),
      dropTextAsset({
        credentials,
        position: {
          x: resetBtnCenter.x + 200,
          y: boardCenter.y,
        },
        style: { textColor: "#22ffff", textSize: 24, textWidth: 170 },
        text: "",
        uniqueName: `${assetId}_TicTacToe_playerOText`,
      }),
    ]);

    const [x, o, cell0, cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8] = await Promise.all([
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}pink_x.png`,
        position: {
          x: resetBtnCenter.x - 200,
          y: boardCenter.y - cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_x`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}blue_o.png`,
        position: {
          x: resetBtnCenter.x + 200,
          y: boardCenter.y - cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_o`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}TopLeft.png`,
        position: {
          x: boardCenter.x - cellWidth,
          y: boardCenter.y - cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}TopCenter.png`,
        position: {
          x: boardCenter.x,
          y: boardCenter.y - cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}TopRight.png`,
        position: {
          x: boardCenter.x + cellWidth,
          y: boardCenter.y - cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}MiddleLeft.png`,
        position: {
          x: boardCenter.x - cellWidth,
          y: boardCenter.y,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}MiddleCenter.png`,
        position: boardCenter,
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}MiddleRight.png`,
        position: {
          x: boardCenter.x + cellWidth,
          y: boardCenter.y,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}BottomLeft.png`,
        position: {
          x: boardCenter.x - cellWidth,
          y: boardCenter.y + cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}BottomCenter.png`,
        position: {
          x: boardCenter.x,
          y: boardCenter.y + cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
      dropWebImageAsset({
        credentials,
        layer0: `${process.env.BUCKET}BottomRight.png`,
        position: {
          x: boardCenter.x + cellWidth,
          y: boardCenter.y + cellWidth,
        },
        uniqueName: `${assetId}_TicTacToe_cell`,
      }),
    ]);

    const webhookPayload = {
      dataObject: {},
      description: "",
      isUniqueOnly: false,
      type: "assetClicked",
      shouldSetClickType: true,
    };

    await Promise.all([
      x.addWebhook({
        ...webhookPayload,
        title: "Pink X Selected",
        url: `${process.env.APP_URL}select-player/x`,
      }),
      o.addWebhook({
        ...webhookPayload,
        title: "Blue O Selected",
        url: `${process.env.APP_URL}select-player/o`,
      }),
      cell0.addWebhook({
        ...webhookPayload,
        description: "Cell 0",
        title: "Top Left Clicked",
        url: `${process.env.APP_URL}click/0`,
      }),
      cell1.addWebhook({
        ...webhookPayload,
        description: "Cell 1",
        title: "Top Center Clicked",
        url: `${process.env.APP_URL}click/1`,
      }),
      cell2.addWebhook({
        ...webhookPayload,
        description: "Cell 2",
        title: "Top Right Clicked",
        url: `${process.env.APP_URL}click/2`,
      }),
      cell3.addWebhook({
        ...webhookPayload,
        description: "Cell 3",
        title: "Middle Left Clicked",
        url: `${process.env.APP_URL}click/3`,
      }),
      cell4.addWebhook({
        ...webhookPayload,
        description: "Cell 4",
        title: "Middle Center Clicked",
        url: `${process.env.APP_URL}click/4`,
      }),
      cell5.addWebhook({
        ...webhookPayload,
        description: "Cell 5",
        title: "Middle Right Clicked",
        url: `${process.env.APP_URL}click/5`,
      }),
      cell6.addWebhook({
        ...webhookPayload,
        description: "Cell 6",
        title: "Bottom Left Clicked",
        url: `${process.env.APP_URL}click/6`,
      }),
      cell7.addWebhook({
        ...webhookPayload,
        description: "Cell 7",
        title: "Bottom Center Clicked",
        url: `${process.env.APP_URL}click/7`,
      }),
      cell8.addWebhook({
        ...webhookPayload,
        description: "Cell 8",
        title: "Bottom Right Clicked",
        url: `${process.env.APP_URL}click/8`,
      }),
    ]);

    return { success: true };
  } catch (error) {
    errorHandler({
      error,
      functionName: "generateBoard",
      message: "Error generating game board.",
    });
  }
};
