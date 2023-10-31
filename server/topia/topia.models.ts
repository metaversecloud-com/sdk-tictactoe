import { initAsset, initDroppedAsset } from "./topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
import utils from "../utils.js";
import storageAdapter from "../adapters/storage.adapter";

export const InteractiveAsset = async (options: {
  id: string, credentials: InteractiveCredentials, position: Position,
  bottom?: string, top?: string,
  uniqueName: string,
  urlSlug: string
}): Promise<DroppedAsset | null> => {
  try {
    const asset = initAsset().create(options.id, { credentials: options.credentials });
    return initDroppedAsset().drop(asset, {
      ...options,
      isInteractive: true,
      interactivePublicKey: options.credentials.interactivePublicKey,
    });
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
}

export class Position {
  x: number;
  y: number;

  constructor(p: { x?: number, y?: number }) {
    this.x = p.x || 0;
    this.y = p.y || 0;
  };
}

// pojo
export class GameData {
  readonly id: string;
  readonly urlSlug: string;
  readonly center: Position;
  moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  status: [number, number, number, number, number, number, number, number, number];

  player1?: Player;
  player2?: Player;

  lastUpdated: number;
  inControl: 0 | 1 = 0;

  finishLineId?: string;
  messageTextId?: string;

  player1TextId?: string;
  player2TextId?: string;
  player1ScoreId?: string;
  player2ScoreId?: string;

  constructor(center: Position, urlSlug: string) {
    this.id = utils.generateRandomString();
    this.center = center;
    this.urlSlug = urlSlug;
    this.moves = [];
    this.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.lastUpdated = Date.now();
  }
}

export class Game {
  data: GameData;

  get id() {
    return this.data.id;
  }

  get urlSlug() {
    return this.data.urlSlug;
  }

  get center() {
    return this.data.center;
  }

  get player1() {
    return this.data.player1;
  }

  set player1(p: Player | undefined) {
    this.data.player1 = p;
    this.data.lastUpdated = Date.now();
  }

  get player2() {
    return this.data.player2;
  }

  set player2(p: Player | undefined) {
    this.data.player2 = p;
    this.data.lastUpdated = Date.now();
  }

  get inControl() {
    return this.data.inControl;
  }

  get finishLineId() {
    return this.data.finishLineId;
  }

  set finishLineId(id: string | undefined) {
    this.data.finishLineId = id;
    this.data.lastUpdated = Date.now();
  }

  get player1TextId() {
    return this.data.player1TextId;
  }

  set player1TextId(id: string | undefined) {
    this.data.player1TextId = id;
    this.data.lastUpdated = Date.now();
  }

  get player2TextId() {
    return this.data.player2TextId;
  }

  set player2TextId(id: string | undefined) {
    this.data.player2TextId = id;
    this.data.lastUpdated = Date.now();
  }

  get messageTextId() {
    return this.data.messageTextId;
  }

  set messageTextId(id: string | undefined) {
    this.data.messageTextId = id;
    this.data.lastUpdated = Date.now();
  }

  get player1ScoreId() {
    return this.data.player1ScoreId;
  }

  set player1ScoreId(id: string | undefined) {
    this.data.player1ScoreId = id;
    this.data.lastUpdated = Date.now();
  }

  get player2ScoreId() {
    return this.data.player2ScoreId;
  }

  set player2ScoreId(id: string | undefined) {
    this.data.player2ScoreId = id;
    this.data.lastUpdated = Date.now();
  }

  get lastUpdated() {
    return this.data.lastUpdated;
  }

  constructor(options: {
    newInstance?: { center: Position, urlSlug: string, credentials: InteractiveCredentials },
    data?: GameData
  }) {
    if (!options.newInstance && !options.data)
      throw new Error("Either newInstance or data must be provided.");

    if (options.data)
      this.data = options.data;
    else if (options.newInstance) {
      this.data = new GameData(options.newInstance.center, options.newInstance.urlSlug);
    }
  }

  /**
   *
   * To get all the moves. Iterate i from 0 to 8 and call `getMove(i)`.
   * todo functions don't work when a game is fetched from data-storage. We may have to keep Game object as POJO and move functions into a separate GameUtils.
   */
  getMove(i: number) {
    // fixme Handle this error peacefully
    if (i < 0 || i > 8)
      throw new Error("IndexOutOfBounds");
    return this.data.moves[i];
  }

  /**
   * @returns {Promise<boolean>} `true` if this is the first move made by this player
   */
  async makeMove(i: number, cellAsset: DroppedAssetInterface | undefined, credentials: InteractiveCredentials): Promise<boolean> {
    cellAsset = cellAsset ?? initDroppedAsset().create(this.data.moves[i], this.data.urlSlug, { credentials }) as DroppedAssetInterface;
    await cellAsset.updateWebImageLayers(``, `${process.env.API_URL}/${this.data.inControl ? "blue_o" : "pink_cross"}.png`);

    this.data.moves[i] = cellAsset.id;
    this.data.status[i] = this.data.inControl ? this.data.player2.visitorId : this.data.player1.visitorId;
    this.data.inControl = ((this.data.inControl + 1) % 2) as 0 | 1;
    this.data.lastUpdated = Date.now();

    return this.data.status.filter(s => s === this.data.status[i]).length === 1;
  }

  async clearMoves(credentials: InteractiveCredentials) {
    const promises = this.data.moves.filter(a => a).map(assetId => initDroppedAsset().create(assetId, this.data.urlSlug, { credentials }))
      .map(a => {
        // todo remove console.debug
        console.debug("Clearing move: ", a.id);
        return a.updateWebImageLayers("", `${process.env.API_URL}/blank.png`);
      });
    await Promise.allSettled(promises);
    this.data.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.data.lastUpdated = Date.now();
    return storageAdapter.saveGame(this, credentials);
  }

  getStatus(i: number) {
    if (i < 0 || i > 8)
      throw new Error("IndexOutOfBounds");
    return this.data.status[i];
  }

  async reset(credentials: InteractiveCredentials) {
    // this.data.messageTextId = undefined;
    this.data.finishLineId = undefined;
    // this.data.player1TextId = undefined;
    // this.data.player2TextId = undefined;
    // this.data.player1ScoreId = undefined;
    // this.data.player2ScoreId = undefined;
    this.data.player1 = undefined;
    this.data.player2 = undefined;
    return this.clearMoves(credentials);
  }

}
