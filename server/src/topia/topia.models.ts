import { initDroppedAsset } from "./topia.factories.js";
import jwt from "jsonwebtoken";

export const InteractiveAsset = async (options: {
  id: string, requestBody: any, position: Position,
  uniqueName: string,
  urlSlug: string,
}) => {
  try {
    const { assetId, interactiveNonce, visitorId } = options.requestBody;
    const payload = {
      interactiveNonce,
      visitorId,
      assetId,
    };

    const droppedAsset = await initDroppedAsset().drop({
      id: options.id, credentials: options.requestBody,
      requestOptions: { headers: { InteractiveJWT: jwt.sign(payload, process.env.INTERACTIVE_SECRET!!) } },
    }, options);

    // This adds your public developer key to the dropped asset so visitors can interact with it in-world.
    if (droppedAsset)
      await droppedAsset.setInteractiveSettings({
        isInteractive: true,
        interactivePublicKey: process.env.INTERACTIVE_KEY,
      });
    return droppedAsset;
  } catch (e: any) {
    const m = "Error creating interactive asset";
    console.log(m, e);
    console.log(JSON.stringify(e.data));
    return Promise.reject(m);
  }
};

export interface Player {
  username: string;
  visitorId: number;
}

export interface Position {
  x: number;
  y: number;
}

export class Game {
  player1?: Player;
  player2?: Player;
  boardId: number;
  center: Position;
  startBtnId?: string;
  finishLineId?: string;
  messageTextId?: string;
  moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  status: [number, number, number, number, number, number, number, number, number];

  constructor(boardId: number, center: Position) {
    this.boardId = boardId;
    this.center = center;
    this.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.moves = [];
  }
}

