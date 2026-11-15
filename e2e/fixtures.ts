import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

/**
 * Id of the dropped asset the app is opened from. Per world instead with test.use({ uniqueAssetId: true })
 * (then use world.assetId): apps that match SSE connections or caches by assetId alone would otherwise mix
 * up parallel tests, since real asset ids are globally unique.
 */
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
/** Sprite URL prefix (BUCKET in app.config.ts). */
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

// Visitor data objects are stored per profile and shared by every world (like the real API), so each
// worker process gets its own profiles: tests running in parallel never see each other's totalWins.
const RUN = process.pid;

/** Player X, player O, a bystander and an admin. VISITOR_ID (the platform tests' visitor) is "E2E Player". */
export const ALICE: Person = { visitorId: 1, profileId: `profile-alice-${RUN}`, displayName: "Alice" };
export const BOB: Person = { visitorId: 2, profileId: `profile-bob-${RUN}`, displayName: "Bob" };
export const CAROL: Person = { visitorId: 3, profileId: `profile-carol-${RUN}`, displayName: "Carol" };
export const ADMIN: Person = { visitorId: 9, profileId: `profile-admin-${RUN}`, displayName: "Admin", isAdmin: true };

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
  isAdmin?: boolean;
  /** Visitor is standing inside the asset's zone. */
  inZone?: boolean;
  /** false = the dropped asset the app was opened from doesn't exist in the world. */
  withAsset?: boolean;
  /** Extra dropped-asset fields (assetName, topLayerURL, uniqueName, ...). */
  asset?: Record<string, unknown>;
  /** The dropped asset's data object. */
  assetData?: Record<string, unknown>;
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The visitor's data object (the same record as its user data object, like the real API). */
  visitorData?: Record<string, unknown>;
  /** Badges the visitor already owns. */
  badges?: string[];
  /**
   * Catalog items the visitor already owns (any type), by catalog id or name, with their quantity
   * (default 1) and the user item's own metadata (default {}). Unknown items fail the seed.
   */
  inventory?: OwnedItem[];
  /** Extra fields on the visitor (expressions: ["emote-wave"] it owns, username, ...). */
  visitor?: Record<string, unknown>;
  /**
   * Other players in the world, keyed by visitorId. Act as one with world.as(id) / world.apiAs(id, path).
   * Their default profileIds are unique per world; an explicit profileId is shared by every test that uses
   * it (user data objects are global in the mock), so derive it from the world: world.scopedId("alice").
   */
  otherVisitors?: Record<number, OtherVisitor>;
  /** Data objects of profiles that aren't in the world, keyed by profileId (use world.scopedId(...) keys). */
  users?: Record<string, Record<string, unknown>>;
  /**
   * The ecosystem inventory catalog (GET /inventory, grants) for this world. Default: mock-topia/catalog.json
   * if the app has one, else four Quiz badges. Useless for apps that cache the catalog process-wide (they
   * keep the first world's): give those a catalog.json instead.
   */
  inventoryItems?: InventoryItem[];
  /** Unlockable expressions (GET /expressions, grant-expression). Default: the mock's Wave and Dance. */
  expressions?: Array<{ id: string; name: string } & Record<string, unknown>>;
  /**
   * The world's user group data objects, as Visitor.fetchUserGroupDataObject returns them (default none).
   */
  userGroupDataObjects?: Array<Record<string, unknown>>;
  /** Extra fields for GET /world-details (World.fetchDetails); default { urlSlug, name, width, height }. */
  worldDetails?: Record<string, unknown>;
  /** Further dropped assets in the world, keyed by id (their `id` defaults to the key). */
  extraAssets?: Record<string, Record<string, unknown>>;
  /**
   * Scenes GET /scenes/:sceneId (Scene.get / fetchSceneById) knows, keyed by scene id (their `id` is the key).
   * Read from the caller's world (the InteractiveJWT's urlSlug); an unknown id answers 200 with a null body,
   * like the real getSceneById.
   */
  scenes?: Record<string, Record<string, unknown>>;
  /** Board pieces to leave out of the scene, by id (e.g. "game-text", "cell-4"). */
  without?: string[];
  /** Data objects and owned badges of ALICE, BOB, CAROL and ADMIN, by visitorId. */
  people?: Record<number, { dataObject?: Record<string, unknown>; badges?: string[] }>;
  /** Delay for every public-API call into the world, so concurrent requests overlap. */
  latencyMs?: number;
  /**
   * Delay for matching public-API calls only: { "<substring of 'METHOD /api/v1/...'>": ms }, e.g.
   * { "PUT /api/v1/world": 300 } or { "/visitors/42/set-data-object": 400 }. Adds to latencyMs. Calls
   * outside /world/ (inventory, user data objects, ...) count for the world in the caller's JWT.
   */
  delays?: Record<string, number>;
  /**
   * Fail matching public-API calls: { "<substring of 'METHOD /api/v1/...'>": status }, e.g.
   * { "grant-visitor-inventory-item": 500 }. Matched like delays; logged as "injected-failure" events.
   */
  failures?: Record<string, number>;
  /**
   * Data-object writes with a lockId take the lock first and hold it for their delay (latencyMs + delays),
   * like a real write that takes time, so a concurrent write with the same lockId gets 409. Default false:
   * the delay runs before the write, which takes and frees the lock at once.
   */
  holdLocksDuringDelay?: boolean;
};

/** A catalog item a visitor owns: catalog id or name, quantity (default 1), user item metadata (default {}). */
export type OwnedItem = { item: string; quantity?: number; metadata?: Record<string, unknown> };

/**
 * Another player in the world. Defaults: profileId "<world.profileId>-v<id>", displayName "Player <id>",
 * username "player-<id>".
 */
export type OtherVisitor = {
  profileId?: string;
  displayName?: string;
  isAdmin?: boolean;
  /** Standing inside the asset's zone. Default true. */
  inZone?: boolean;
  visitorData?: Record<string, unknown>;
  badges?: string[];
  inventory?: OwnedItem[];
} & Record<string, unknown>;

/** An ecosystem inventory item as GET /inventory returns it. */
export type InventoryItem = {
  id: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  image_path?: string;
  metadata?: Record<string, unknown>;
} & Record<string, unknown>;

/** A visitor inventory entry shaped like GET get-visitor-inventory-items returns it. */
const ownedBadge = (name: string) => ({
  id: `owned-${name}`,
  item_id: `owned-${name}`,
  itemId: `owned-${name}`,
  name,
  type: "BADGE",
  image_url: "",
  quantity: 1,
  status: "ACTIVE",
  item: { id: `owned-${name}`, name, type: "BADGE", image_url: "" },
});

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";

  private others: Record<number, OtherVisitor> = {};

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
    /** Id of the dropped asset the app is opened from (KEY_ASSET_ID unless the test uses uniqueAssetId). */
    readonly assetId = KEY_ASSET_ID,
  ) {}

  async seed({
    isAdmin = false,
    inZone = true,
    withAsset = true,
    asset = {},
    assetData = {},
    worldData = {},
    visitorData = {},
    badges = [],
    inventory = [],
    visitor = {},
    otherVisitors = {},
    users = {},
    inventoryItems,
    expressions,
    worldDetails,
    userGroupDataObjects,
    extraAssets = {},
    scenes,
    latencyMs = 0,
    delays = {},
    failures = {},
    holdLocksDuringDelay = false,
    without = [],
    people = {},
  }: SeedOptions = {}) {
    // The Tic-Tac-Toe scene: board, labels, X/O sprites and 9 cells around the key asset (the reset button).
    extraAssets = { ...boardPieces(), ...extraAssets };
    for (const id of without) delete extraAssets[id];
    asset = { assetName: "Tic-Tac-Toe reset button", position: KEY_POSITION, uniqueName: KEY_UNIQUE_NAME, ...asset };
    // ALICE, BOB, CAROL and ADMIN are always in the world.
    const peopleVisitors: Record<number, OtherVisitor> = {};
    for (const person of [ALICE, BOB, CAROL, ADMIN]) {
      peopleVisitors[person.visitorId] = {
        profileId: person.profileId,
        displayName: person.displayName,
        isAdmin: !!person.isAdmin,
        inZone: false,
        visitorData: people[person.visitorId]?.dataObject ?? {},
        badges: people[person.visitorId]?.badges ?? [],
      };
    }
    otherVisitors = { ...peopleVisitors, ...otherVisitors };
    this.others = otherVisitors;
    const assets: Record<string, any> = Object.fromEntries(
      Object.entries(extraAssets).map(([id, fields]) => [id, { id, ...fields }]),
    );
    if (withAsset) {
      assets[this.assetId] = {
        id: this.assetId,
        assetName: "E2E Asset",
        position: { x: 500, y: 500 },
        uniqueName: "e2e-asset",
        sceneDropId: SCENE_DROP_ID,
        topLayerURL: "https://example.invalid/e2e-asset.png",
        ...asset,
        dataObject: assetData,
      };
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: {
        dataObject: worldData,
        latencyMs,
        delays,
        failures,
        holdLocksDuringDelay,
        worldDetails,
        userGroupDataObjects,
        scenes,
        assets,
        users,
        inventoryItems,
        expressions,
        visitors: {
          ...Object.fromEntries(
            Object.entries(otherVisitors).map(
              ([
                id,
                {
                  inZone: zoned = true,
                  visitorData: data = {},
                  badges: owned = [],
                  inventory: items = [],
                  isAdmin: admin = false,
                  ...rest
                },
              ]) => [
                id,
                {
                  ...this.player(Number(id)),
                  // Real visitors always have one; the same as world.as(id) sends.
                  username: `player-${id}`,
                  isAdmin: admin,
                  landmarkZonesString: zoned ? Object.keys(assets).join(",") : "",
                  privateZoneId: "",
                  dataObject: data,
                  inventory: owned.map(ownedBadge),
                  ownedItems: items,
                  ...rest,
                },
              ],
            ),
          ),
          [VISITOR_ID]: {
            isAdmin,
            profileId: this.profileId,
            displayName: this.displayName,
            // The same as world.credentials() sends.
            username: "e2e-player",
            landmarkZonesString: inZone ? Object.keys(assets).join(",") : "",
            privateZoneId: "",
            dataObject: visitorData,
            inventory: badges.map(ownedBadge),
            ownedItems: inventory,
            ...visitor,
          },
        },
      },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()} ${await response.text()}`);
  }

  /**
   * Replaces the injected failures mid-test (same format as seed's `failures`); no argument stops them,
   * e.g. to check the app recovers once Topia answers again.
   */
  async setFailures(failures: Record<string, number> = {}) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, { data: { failures } });
    if (!response.ok()) throw new Error(`Changing mock failures failed: ${response.status()}`);
  }

  /**
   * An id unique to this world, e.g. an explicit profileId for otherVisitors or a `users` key: profiles are
   * global in the mock, so a fixed "alice" would be shared by every test running in parallel.
   */
  scopedId(name: string) {
    return `${this.profileId}-${name}`;
  }

  /** Changes visitor fields mid-test (moveTo, isAdmin, landmarkZonesString, ...). */
  async updateVisitor(fields: Record<string, unknown>, visitorId = VISITOR_ID) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}/visitors/${visitorId}`, {
      data: fields,
    });
    if (!response.ok()) throw new Error(`Updating mock visitor failed: ${response.status()}`);
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

  async assetData(assetId = this.assetId) {
    return (await this.state()).assets[assetId]?.dataObject;
  }

  async visitorData(visitorId = VISITOR_ID) {
    return (await this.state()).visitors[visitorId].dataObject;
  }

  /** A profile's user data object (for a visitor, the same record as visitorData). */
  async userData(profileId = this.profileId) {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/users/${profileId}`);
    return (await response.json()).dataObject as Record<string, any>;
  }

  /** Objects in mock-topia's fake S3, from every test: filter by key. */
  async s3Objects() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/s3`);
    return (await response.json()) as Array<{ bucket: string; key: string; size: number; contentType?: string }>;
  }

  /** Identity of a player in this world: VISITOR_ID or one seeded with otherVisitors. */
  player(visitorId: number) {
    if (visitorId === VISITOR_ID) return { visitorId, profileId: this.profileId, displayName: this.displayName };
    const seeded = this.others[visitorId] ?? {};
    return {
      visitorId,
      profileId: seeded.profileId ?? `${this.profileId}-v${visitorId}`,
      displayName: seeded.displayName ?? `Player ${visitorId}`,
    };
  }

  /**
   * Credential overrides that make a request come from another player, with their own nonce like a
   * separate drawer: world.url("/", world.as(43)), world.credentials(world.as(43)). Also takes one of the
   * seeded people (ALICE, ...), whose profileId and displayName win (e.g. a renamed { ...ALICE, displayName }).
   */
  as(who: number | Person): Record<string, string> {
    if (typeof who !== "number") {
      return { ...this.as(who.visitorId), visitorId: String(who.visitorId), profileId: who.profileId, displayName: who.displayName };
    }
    const visitorId = who;
    if (visitorId === VISITOR_ID) return {};
    const { profileId, displayName } = this.player(visitorId);
    return {
      visitorId: String(visitorId),
      profileId,
      displayName,
      identityId: `identity-${visitorId}`,
      username: `player-${visitorId}`,
      interactiveNonce: `e2e-nonce-${this.urlSlug}-v${visitorId}`,
    };
  }

  /** App API path as another player's iframe calls it. */
  apiAs(visitorId: number, path: string, overrides: Record<string, string> = {}) {
    return this.api(path, { ...this.as(visitorId), ...overrides });
  }

  /** The key asset's game state. */
  game() {
    return this.assetData(KEY_ASSET_ID);
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

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  /** Session credentials Topia appends to the app's iframe URL. */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: this.assetId,
      displayName: this.displayName,
      identityId: "identity-1",
      // Unique per world: apps that key state by nonce across worlds (SSE connections, caches) would
      // otherwise mix up parallel tests.
      interactiveNonce: `e2e-nonce-${this.urlSlug}`,
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

// A 24x24 stand-in for the SDK style's CDN icons (stubSdkIcons).
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24"/></svg>';

export const test = base.extend<{ world: TopiaWorld; uniqueAssetId: boolean; stubSdkIcons: boolean }>({
  uniqueAssetId: [false, { option: true }],
  /**
   * test.use({ stubSdkIcons: true }) answers https://sdk-style.s3.amazonaws.com/icons/* with a 24x24 SVG
   * instead of aborting it. A button whose only content is such an icon is otherwise 0x0 and Playwright
   * can't click it (or use press() from helpers/press.ts).
   */
  stubSdkIcons: [false, { option: true }],
  // The browser may only talk to the app: anything else (CDNs, analytics, real Topia) is aborted, so a
  // test can't pass or flake on the network.
  context: async ({ context, stubSdkIcons }, use) => {
    await context.route(
      (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
      (route) => route.abort(),
    );
    // Registered last, so it's matched first.
    if (stubSdkIcons) {
      await context.route("https://sdk-style.s3.amazonaws.com/icons/**", (route) =>
        route.fulfill({ contentType: "image/svg+xml", body: ICON_SVG }),
      );
    }
    await use(context);
  },
  world: async ({ request, uniqueAssetId }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(
      `world-${id}`,
      `profile-${id}`,
      request,
      uniqueAssetId ? `key-asset-${id}` : KEY_ASSET_ID,
    );
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
