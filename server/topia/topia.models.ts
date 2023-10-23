import { initAsset, initDroppedAsset } from "./topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
import utils from "../utils.js";
import topiaAdapter from "../adapters/topia.adapter.js";
import { cellWidth } from "../ttt.utils.js";

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
  readonly id: string;
  readonly urlSlug: string;
  readonly center: Position;
  public clearStatus = this.clearMoves;
  private readonly _moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  private _status: [number, number, number, number, number, number, number, number, number];

  private _player1?: Player;
  private _player2?: Player;

  get player1() {
    return this._player1;
  }

  set player1(p: Player | undefined) {
    this._player1 = p;
    this._lastUpdated = new Date();
  }
  private _inControl: 0 | 1 = 0;

  get player2() {
    return this._player2;
  }

  set player2(p: Player | undefined) {
    this._player2 = p;
    this._lastUpdated = new Date();
  }
  private _finishLineId?: string;

  get inControl() {
    return this._inControl;
  }
  private _messageTextId?: string;

  get finishLineId() {
    return this._finishLineId;
  }

  set finishLineId(id: string | undefined) {
    this._finishLineId = id;
    this._lastUpdated = new Date();
  }
  private _player1TextId?: string;

  get messageTextId() {
    return this._messageTextId;
  }

  set messageTextId(id: string | undefined) {
    this._messageTextId = id;
    this._lastUpdated = new Date();
  }
  private _player2TextId?: string;

  get player1TextId() {
    return this._player1TextId;
  }

  set player1TextId(id: string | undefined) {
    this._player1TextId = id;
    this._lastUpdated = new Date();
  }
  private _player1ScoreId?: string;

  get player2TextId() {
    return this._player2TextId;
  }

  set player2TextId(id: string | undefined) {
    this._player2TextId = id;
    this._lastUpdated = new Date();
  }
  private _player2ScoreId?: string;

  get player1ScoreId() {
    return this._player1ScoreId;
  }

  set player1ScoreId(id: string | undefined) {
    this._player1ScoreId = id;
    this._lastUpdated = new Date();
  }
  private _lastUpdated: Date;

  get player2ScoreId() {
    return this._player2ScoreId;
  }

  set player2ScoreId(id: string | undefined) {
    this._player2ScoreId = id;
    this._lastUpdated = new Date();
  }

  constructor(center: Position, urlSlug: string, credentials: InteractiveCredentials) {
    this.center = center;
    this.urlSlug = urlSlug;
    this.id = utils.generateRandomString();
    this._status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._inControl = 0;
    this._lastUpdated = new Date();
    this._moves = [];
    this.createWebImages(credentials).then(() => console.log(`Created web images for ${this.id}`));
  }

  get lastUpdated() {
    return this._lastUpdated;
  }

  /**
   *
   * To get all the moves. Iterate i from 0 to 8 and call `getMove(i)`.
   */
  getMove(i: number) {
    // fixme Handle this error peacefully
    if (i < 0 || i > 8)
      throw new Error("IndexOutOfBounds");
    return this._moves[i];
  }

  async makeMove(i: number, cellAsset: DroppedAssetInterface | undefined, credentials: InteractiveCredentials) {
    cellAsset = cellAsset ?? initDroppedAsset().create(this._moves[i], this.urlSlug, { credentials }) as DroppedAssetInterface;
    await cellAsset.updateWebImageLayers(``, `${process.env.API_URL}/${this._inControl ? "blue_o" : "pink_cross"}.png`);

    this._status[i] = this._inControl ? this._player2.visitorId : this._player1.visitorId;
    this._inControl = ((this._inControl + 1) % 2) as 0 | 1;
    this._lastUpdated = new Date();
  }

  async clearMoves(credentials: InteractiveCredentials) {
    const promises = this._moves.map(assetId => initDroppedAsset().create(assetId, this.urlSlug, { credentials }))
      .map(a => a as DroppedAssetInterface)
      .map(async a => a.updateWebImageLayers(`${process.env.API_URL}/blank.png`, ""));
    await Promise.allSettled(promises);
    this._status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._lastUpdated = new Date();
  }

  getStatus(i: number) {
    if (i < 0 || i > 8)
      throw new Error("IndexOutOfBounds");
    return this._status[i];
  }

  async reset(credentials: InteractiveCredentials) {
    this._messageTextId = undefined;
    this._finishLineId = undefined;
    this._player1TextId = undefined;
    this._player2TextId = undefined;
    this._player1ScoreId = undefined;
    this._player2ScoreId = undefined;
    this._player1 = undefined;
    this._player2 = undefined;
    return this.clearMoves(credentials);
  }

  private async createWebImages(credentials: InteractiveCredentials) {
    const promises = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(async (i) => {
      const cellImage = await topiaAdapter.createWebImage({
        urlSlug: this.urlSlug,
        imageUrl: `${process.env.API_URL}/blank.png`,
        position: { x: this.center.x + (i % 3 - 1) * cellWidth, y: this.center.y + (i / 3 - 1) * cellWidth },
        credentials,
        uniqueName: `${this.id}_cell_${i}`,
      }) as DroppedAssetInterface;
      await cellImage.addWebhook({
        dataObject: {},
        isUniqueOnly: false,
        type: "assetClicked",
        url: `${process.env.API_URL}/backend/move`,
        title: "Make a move",
        description: "Make a move",
      });

      this._moves[i] = cellImage.id;
    });

    return Promise.all(promises);
  }

}
