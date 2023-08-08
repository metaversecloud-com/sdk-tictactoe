import { initAsset, initDroppedAsset } from "./topia.factories.js";
import { DroppedAsset, InteractiveCredentials } from "@rtsdk/topia";

export const InteractiveAsset = async (options: {
  id: string, credentials: InteractiveCredentials, position: Position,
  bottom?: string, top?: string,
  uniqueName: string,
  urlSlug: string
}): Promise<DroppedAsset | null> => {
  try {
    const asset = initAsset().create(options.id, {
      credentials: options.credentials,
      attributes: { requestOptions: { top: options.top, bottom: options.bottom } },
    });
    const droppedAsset = await initDroppedAsset().drop(asset, options);

    // This adds your public developer key to the dropped asset so visitors can interact with it in-world.
    if (droppedAsset)
      await droppedAsset.setInteractiveSettings({
        isInteractive: true,
        interactivePublicKey: options.credentials.interactivePublicKey,
      });
    return droppedAsset;
  } catch (e: any) {
    const m = "Error creating interactive asset";
    console.log(m, e);
    console.log(JSON.stringify(e.data));
    // return Promise.reject(m);
    return null;
  }
};

export interface Player {
  username: string;
  visitorId: number;
  interactiveNonce: string;
}

export class Position {
  x: number;
  y: number;

  constructor(p: { x?: number, y?: number }) {
    this.x = p.x || 0;
    this.y = p.y || 0;
  };
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

