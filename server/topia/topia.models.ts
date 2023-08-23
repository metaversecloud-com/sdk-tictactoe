import { initAsset, initDroppedAsset } from "./topia.factories.js";
import { DroppedAsset, InteractiveCredentials } from "@rtsdk/topia";
import utils from "../utils.js";

export const InteractiveAsset = async (options: {
  id: string, credentials: InteractiveCredentials, position: Position,
  bottom?: string, top?: string,
  uniqueName: string,
  urlSlug: string
}): Promise<DroppedAsset | null> => {
  try {
    const asset = initAsset().create(options.id, { credentials: options.credentials });
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
  id: string;
  center: Position;
  // startBtnId?: string;
  inControl: 0 | 1 = 0;
  finishLineId?: string;
  messageTextId?: string;
  moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  status: [number, number, number, number, number, number, number, number, number];

  constructor(center: Position) {
    this.center = center;
    this.id = utils.generateRandomString();
    this.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.moves = [];
    this.inControl = 0;
  }
}

