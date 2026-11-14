import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

export const KEY_ASSET_ID = "key-asset";
export const SCENE_DROP_ID = "scene-1";
export const VISITOR_ID = 42;

// ---- Tic-Tac-Toe board scene (README "Required Assets with Unique Names") ----

/** uniqueName of the key asset: the reset button that opens the drawer and holds the game state. */
export const KEY_UNIQUE_NAME = "TicTacToe_reset";
export const KEY_POSITION = { x: 500, y: 500 };
/** The board sits 200 above the key asset; cells are 80 apart (server/constants.ts cellWidth). */
export const BOARD_CENTER = { x: 500, y: 300 };
export const CELL_WIDTH = 80;
export const DEFAULT_GAME_TEXT = "Click X or O to begin!";
/** Sprite URL prefix (BUCKET in playwright.config.ts). */
export const BUCKET = "https://example.invalid/tictactoe/";

export const cellId = (cell: number) => `cell-${cell}`;
export const cellPosition = (cell: number) => ({
  x: BOARD_CENTER.x + ((cell % 3) - 1) * CELL_WIDTH,
  y: BOARD_CENTER.y + (Math.floor(cell / 3) - 1) * CELL_WIDTH,
});

/** Every board piece of a prebuilt scene, keyed by id. */
const boardPieces = (sceneDropId = SCENE_DROP_ID) => {
  const piece = (id: string, uniqueName: string, extra: Record<string, unknown> = {}) => ({
    id,
    uniqueName,
    sceneDropId,
    position: BOARD_CENTER,
    dataObject: {},
    ...extra,
  });
  const pieces: Record<string, any> = {
    board: piece("board", "TicTacToe_board"),
    "game-text": piece("game-text", "TicTacToe_gameText", { text: DEFAULT_GAME_TEXT }),
    "player-x-text": piece("player-x-text", "TicTacToe_playerXText", { text: "Player X" }),
    "player-o-text": piece("player-o-text", "TicTacToe_playerOText", { text: "Player O" }),
    "piece-x": piece("piece-x", "TicTacToe_x"),
    "piece-o": piece("piece-o", "TicTacToe_o"),
  };
  for (let cell = 0; cell < 9; cell++) {
    pieces[cellId(cell)] = piece(cellId(cell), "TicTacToe_cell", { position: cellPosition(cell) });
  }
  return pieces;
};

// ---- people ----

export type Person = { visitorId: number; profileId: string; displayName: string; isAdmin?: boolean };

/** Player X, player O, a bystander and an admin. VISITOR_ID (the platform tests' visitor) is "E2E Player". */
export const ALICE: Person = { visitorId: 1, profileId: "profile-alice", displayName: "Alice" };
export const BOB: Person = { visitorId: 2, profileId: "profile-bob", displayName: "Bob" };
export const CAROL: Person = { visitorId: 3, profileId: "profile-carol", displayName: "Carol" };
export const ADMIN: Person = { visitorId: 9, profileId: "profile-admin", displayName: "Admin", isAdmin: true };

const player = (person: Person | null) =>
  person
    ? { profileId: person.profileId, displayName: person.displayName, visitorId: person.visitorId }
    : { profileId: null, displayName: null, visitorId: null };

type Cells = Partial<Record<number, Person | null>>;

/**
 * The key asset's game state (README "Data Objects"). `cells` maps cell index to the person who claimed
 * it; `turn` is who moves next (the app stores the opposite: lastPlayerTurn = who just moved).
 */
export const gameData = ({
  x = ALICE as Person | null,
  o = BOB as Person | null,
  cells = {} as Cells,
  turn = undefined as Person | undefined,
  ...rest
}: { x?: Person | null; o?: Person | null; cells?: Cells; turn?: Person } & Record<string, unknown> = {}) => {
  const claimedCells: Record<number, number | null> = {};
  for (let cell = 0; cell < 9; cell++) claimedCells[cell] = cells[cell]?.visitorId ?? null;
  const next = turn ?? x;
  const lastPlayerTurn = next && x && o ? (next.visitorId === x.visitorId ? o.visitorId : x.visitorId) : null;
  const moves = Object.values(cells).filter(Boolean).length;
  return {
    claimedCells,
    isGameOver: false,
    isResetInProgress: false,
    keyAssetId: KEY_ASSET_ID,
    lastInteraction: new Date().toISOString(),
    lastPlayerTurn,
    playerCount: (x ? 1 : 0) + (o ? 1 : 0),
    playerX: player(x),
    playerO: player(o),
    resetCount: 0,
    turnCount: moves,
    leaderboard: {},
    ...rest,
  };
};

export type SeedOptions = {
  /** The platform tests' visitor (VISITOR_ID) is an admin. */
  isAdmin?: boolean;
  /** false = the scene has no key asset. */
  withAsset?: boolean;
  /** Extra key-asset fields. */
  asset?: Record<string, unknown>;
  /** The key asset's data object (see gameData()). Empty = a freshly dropped board. */
  assetData?: Record<string, unknown>;
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The platform visitor's data object. */
  visitorData?: Record<string, unknown>;
  /** Badges the platform visitor already owns. */
  badges?: string[];
  /** Board pieces to leave out of the scene, by id (e.g. "game-text", "cell-4"). */
  without?: string[];
  /** Further dropped assets in the world, keyed by id. */
  extraAssets?: Record<string, Record<string, unknown>>;
  /** Data objects and owned badges of ALICE, BOB, CAROL and ADMIN, by visitorId. */
  people?: Record<number, { dataObject?: Record<string, unknown>; badges?: string[] }>;
};

const inventory = (badges: string[]) =>
  badges.map((name) => ({
    id: `owned-${name}`,
    item_id: `owned-${name}`,
    status: "ACTIVE",
    item: { name, type: "BADGE", image_url: "" },
  }));

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
  ) {}

  /** A world with the Tic-Tac-Toe scene dropped: key asset, board, labels, X/O sprites and 9 cells. */
  async seed({
    isAdmin = false,
    withAsset = true,
    asset = {},
    assetData = {},
    worldData = {},
    visitorData = {},
    badges = [],
    without = [],
    extraAssets = {},
    people = {},
  }: SeedOptions = {}) {
    const assets: Record<string, any> = { ...boardPieces(), ...extraAssets };
    for (const id of without) delete assets[id];
    if (withAsset) {
      assets[KEY_ASSET_ID] = {
        id: KEY_ASSET_ID,
        assetName: "Tic-Tac-Toe reset button",
        position: KEY_POSITION,
        uniqueName: KEY_UNIQUE_NAME,
        sceneDropId: SCENE_DROP_ID,
        ...asset,
        dataObject: assetData,
      };
    }

    const visitor = (person: Person & { isAdmin?: boolean }, dataObject = {}, owned: string[] = []) => ({
      isAdmin: !!person.isAdmin,
      profileId: person.profileId,
      displayName: person.displayName,
      landmarkZonesString: "",
      privateZoneId: "",
      dataObject,
      inventory: inventory(owned),
    });

    const visitors: Record<number, any> = {
      [VISITOR_ID]: visitor(
        { visitorId: VISITOR_ID, profileId: this.profileId, displayName: this.displayName, isAdmin },
        visitorData,
        badges,
      ),
    };
    for (const person of [ALICE, BOB, CAROL, ADMIN]) {
      visitors[person.visitorId] = visitor(person, people[person.visitorId]?.dataObject, people[person.visitorId]?.badges);
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: { dataObject: worldData, assets, visitors },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()}`);
  }

  async state() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`);
    return (await response.json()) as {
      dataObject: Record<string, any>;
      assets: Record<string, any>;
      visitors: Record<string, any>;
      events: Array<Record<string, any>>;
      unhandled: string[];
    };
  }

  async assetData(assetId = KEY_ASSET_ID) {
    return (await this.state()).assets[assetId]?.dataObject;
  }

  /** The key asset's game state. */
  game() {
    return this.assetData(KEY_ASSET_ID);
  }

  async visitorData(visitorId = VISITOR_ID) {
    return (await this.state()).visitors[visitorId].dataObject;
  }

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  /** Analytic names the app recorded, in order. */
  async analytics() {
    return (await this.events("analytics")).map((e) => e.analyticName as string);
  }

  /** Text currently shown by a text asset of the scene (TicTacToe_gameText, ...). */
  async text(uniqueName = "TicTacToe_gameText") {
    const assets = Object.values((await this.state()).assets);
    return assets.find((a) => a.uniqueName === uniqueName && a.sceneDropId === SCENE_DROP_ID)?.text;
  }

  /** Dropped assets with this uniqueName (e.g. the TicTacToe_move sprites the app dropped). */
  async dropped(uniqueName: string) {
    return Object.values((await this.state()).assets).filter((a) => a.uniqueName === uniqueName);
  }

  /** Session credentials Topia appends to the app's iframe URL (or sends in a webhook body). */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: KEY_ASSET_ID,
      displayName: this.displayName,
      identityId: "identity-1",
      interactiveNonce: "e2e-nonce",
      interactivePublicKey: INTERACTIVE_KEY,
      profileId: this.profileId,
      sceneDropId: SCENE_DROP_ID,
      uniqueName: KEY_UNIQUE_NAME,
      urlSlug: this.urlSlug,
      username: "e2e-player",
      visitorId: String(VISITOR_ID),
      ...overrides,
    });
  }

  /** Credential overrides for one of the seeded people. */
  as(person: Person) {
    return { visitorId: String(person.visitorId), profileId: person.profileId, displayName: person.displayName };
  }

  /** App page URL as Topia opens it in the iframe. */
  url(path = "/", overrides: Record<string, string> = {}) {
    return `${path}?${this.credentials(overrides)}`;
  }

  /** App API path carrying the session credentials, as the client's backendAPI sends them. */
  api(path: string, overrides: Record<string, string> = {}) {
    return `/api${path}?${this.credentials(overrides)}`;
  }

  /**
   * Fires the asset-click webhook Topia sends when `person` clicks a board piece: POST to the webhook
   * URL with the session credentials in the JSON body.
   */
  webhook(path: string, person: Person, piece: { assetId: string; uniqueName: string }) {
    return this.request.post(`/api${path}`, {
      data: Object.fromEntries(this.credentials({ ...this.as(person), ...piece })),
    });
  }

  /** `person` clicks the pink X or blue O sprite. */
  select(person: Person, symbol: "x" | "o") {
    return this.webhook(`/select-player/${symbol}`, person, { assetId: `piece-${symbol}`, uniqueName: `TicTacToe_${symbol}` });
  }

  /** `person` clicks a cell of the board. */
  click(person: Person, cell: number | string, assetId = cellId(Number(cell))) {
    return this.webhook(`/click/${cell}`, person, { assetId, uniqueName: "TicTacToe_cell" });
  }

  /** `person` confirms a reset in the drawer (opened from the key asset). */
  reset(person: Person) {
    return this.request.post(this.api("/reset", this.as(person)));
  }
}

export const test = base.extend<{ world: TopiaWorld }>({
  // Keep the browser hermetic: only the app itself is reachable (icons and images point at real S3 buckets).
  page: async ({ page }, use) => {
    await page.route(
      (url) => url.hostname !== "localhost",
      (route) => route.abort(),
    );
    await use(page);
  },
  world: async ({ request }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(`world-${id}`, `profile-${id}`, request);
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
