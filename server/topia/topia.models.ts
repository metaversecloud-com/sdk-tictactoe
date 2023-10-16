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

  private _player1?: Player;
  private _player2?: Player;
  private _inControl: 0 | 1 = 0;
  private _finishLineId?: string;
  private _messageTextId?: string;
  private _player1TextId?: string;
  private _player2TextId?: string;
  private _player1ScoreId?: string;
  private _player2ScoreId?: string;
  private _lastUpdated: Date;

  public clearStatus = this.clearMoves;
  private _moves: [string?, string?, string?, string?, string?, string?, string?, string?, string?];
  private _status: [number, number, number, number, number, number, number, number, number];

  constructor(center: Position, urlSlug: string) {
    this.center = center;
    this.urlSlug = urlSlug;
    this.id = utils.generateRandomString();
    this._status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._moves = [];
    this._inControl = 0;
    this._lastUpdated = new Date();
  }

  get player1() {
    return this._player1;
  }

  set player1(p: Player | undefined) {
    this._player1 = p;
    this._lastUpdated = new Date();
  }

  get player2() {
    return this._player2;
  }

  set player2(p: Player | undefined) {
    this._player2 = p;
    this._lastUpdated = new Date();
  }

  get inControl() {
    return this._inControl;
  }

  get finishLineId() {
    return this._finishLineId;
  }

  set finishLineId(id: string | undefined) {
    this._finishLineId = id;
    this._lastUpdated = new Date();
  }

  get messageTextId() {
    return this._messageTextId;
  }

  set messageTextId(id: string | undefined) {
    this._messageTextId = id;
    this._lastUpdated = new Date();
  }

  get player1TextId() {
    return this._player1TextId;
  }

  set player1TextId(id: string | undefined) {
    this._player1TextId = id;
    this._lastUpdated = new Date();
  }

  get player2TextId() {
    return this._player2TextId;
  }

  set player2TextId(id: string | undefined) {
    this._player2TextId = id;
    this._lastUpdated = new Date();
  }

  get player1ScoreId() {
    return this._player1ScoreId;
  }

  set player1ScoreId(id: string | undefined) {
    this._player1ScoreId = id;
    this._lastUpdated = new Date();
  }

  get player2ScoreId() {
    return this._player2ScoreId;
  }

  set player2ScoreId(id: string | undefined) {
    this._player2ScoreId = id;
    this._lastUpdated = new Date();
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

  addMove(i: number, m: string) {
    this._moves[i] = m;
    this._status[i] = this._inControl ? this._player2.visitorId : this._player1.visitorId;
    this._inControl = ((this._inControl + 1) % 2) as 0 | 1;
    this._lastUpdated = new Date();
  }

  clearMoves() {
    this._moves = [];
    this._status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._lastUpdated = new Date();
  }

  getStatus(i: number) {
    if (i < 0 || i > 8)
      throw new Error("IndexOutOfBounds");
    return this._status[i];
  }

  reset() {
    this._messageTextId = undefined;
    this._finishLineId = undefined;
    this._player1TextId = undefined;
    this._player2TextId = undefined;
    this._player1ScoreId = undefined;
    this._player2ScoreId = undefined;
    this.clearMoves();
  }

}

