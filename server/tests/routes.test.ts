import express from "express";
import request from "supertest";

import router from "../routes.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
}

const baseCreds = {
  assetId: "asset-123",
  interactivePublicKey: process.env.INTERACTIVE_KEY,
  interactiveNonce: "nonce-xyz",
  visitorId: 1,
  urlSlug: "my-world",
  sceneDropId: "scene-abc",
  profileId: "profile-1",
  displayName: "Alice",
  username: "alice",
};

// Mock the utils module at the boundary so the routes can be exercised without
// hitting @rtsdk/topia.
jest.mock("@utils/index.js", () => {
  const errorHandler = jest.fn(({ res }: any) => {
    if (res && !res.headersSent) res.status(500).send({ success: false, error: "test-error" });
    return {};
  });
  return {
    errorHandler,
    getCredentials: jest.fn(),
    getDroppedAssetDataObject: jest.fn(),
    getBadges: jest.fn().mockResolvedValue({}),
    getVisitorBadges: jest.fn().mockReturnValue({}),
    parseLeaderboard: jest.fn().mockReturnValue([]),
    verifyBoard: jest.fn().mockResolvedValue({ ok: true, regenerated: false, fullRebuild: false }),
    resetLeaderboard: jest.fn().mockResolvedValue(undefined),
    Visitor: {
      get: jest.fn(),
      create: jest.fn(),
    },
    World: {
      create: jest.fn(),
      deleteDroppedAssets: jest.fn().mockResolvedValue({}),
    },
    // Auth middleware pulls these:
    // and the routes indirectly need them too
    DroppedAsset: {
      get: jest.fn().mockResolvedValue({ position: { x: 0, y: 0 } }),
    },
    // Handlers used by non-tested routes so their imports don't blow up:
    incrementLeaderboardEntry: jest.fn(),
    dropWebImageAsset: jest.fn().mockResolvedValue({}),
    lockDataObject: jest.fn().mockResolvedValue(undefined),
    updateGameText: jest.fn().mockResolvedValue({}),
    getFinishLineOptions: jest.fn().mockReturnValue({}),
    getGameStatus: jest.fn().mockReturnValue({ hasWinningCombo: false, isDraw: false }),
    addNewRowToGoogleSheets: jest.fn(),
    grantBadgeIfNew: jest.fn().mockResolvedValue({ granted: false }),
    getWorldDataObject: jest.fn(),
    updateGameData: jest.fn().mockResolvedValue({}),
  };
});

// Also mock the auth middleware — otherwise it tries to call Visitor.get.
jest.mock("../middleware/auth.js", () => ({
  __esModule: true,
  default: (req: any, _res: any, next: any) => {
    req.credentials = baseCreds;
    next();
  },
}));

const mockUtils = jest.mocked(require("@utils/index.js"));

describe("routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /system/health returns status OK and env keys", async () => {
    const app = makeApp();
    const res = await request(app).get("/api/system/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("envs");
    expect(res.body.envs).toHaveProperty("NODE_ENV");
  });

  test("GET /leaderboard-state returns visitor / leaderboard / badges / inventory (no gameData, no verifyBoard)", async () => {
    const mockKeyAsset = { id: "asset-123", uniqueName: "reset", position: { x: 100, y: 200 }, dataObject: {} };
    const mockVisitor = {
      isAdmin: true,
      fetchInventoryItems: jest.fn().mockResolvedValue([]),
      inventoryItems: [],
      updateDataObject: jest.fn().mockResolvedValue({}),
    };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getDroppedAssetDataObject.mockResolvedValue({ keyAsset: mockKeyAsset, wasDataObjectInitialized: false });
    mockUtils.getBadges.mockResolvedValue({
      Victory: { id: "b1", name: "Victory", icon: "https://x/y.png", description: "" },
    });
    mockUtils.getVisitorBadges.mockReturnValue({});
    mockUtils.parseLeaderboard.mockReturnValue([{ profileId: "profile-1", displayName: "Alice", wins: 3 }]);
    (mockUtils.Visitor.get as jest.Mock).mockResolvedValue(mockVisitor);

    const app = makeApp();
    const res = await request(app)
      .get("/api/leaderboard-state")
      .query(baseCreds as any);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      visitor: { isAdmin: true, profileId: baseCreds.profileId, visitorId: baseCreds.visitorId },
    });
    expect(res.body.leaderboard[0]).toMatchObject({ profileId: "profile-1", wins: 3 });
    expect(res.body).toHaveProperty("badges");
    expect(res.body).toHaveProperty("visitorInventory");
    expect(res.body).not.toHaveProperty("gameData");
    expect(res.body).not.toHaveProperty("visitorStats");
    expect(mockUtils.verifyBoard).not.toHaveBeenCalled();
  });

  test("GET /reset-state returns visitor + minimal gameData for canReset (runs verifyBoard)", async () => {
    const mockKeyAsset = {
      id: "asset-123",
      position: { x: 0, y: 0 },
      dataObject: {
        isGameOver: false,
        isResetInProgress: false,
        lastInteraction: null,
        playerX: { visitorId: 42, username: "Alice", profileId: "alice" },
        playerO: { visitorId: null, username: null, profileId: null },
        // Include extra fields that should NOT appear in the response.
        claimedCells: { 0: 42 },
        turnCount: 1,
      },
    };
    const mockVisitor = { isAdmin: false, updateDataObject: jest.fn().mockResolvedValue({}) };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getDroppedAssetDataObject.mockResolvedValue({ keyAsset: mockKeyAsset, wasDataObjectInitialized: false });
    (mockUtils.Visitor.get as jest.Mock).mockResolvedValue(mockVisitor);

    const app = makeApp();
    const res = await request(app)
      .get("/api/reset-state")
      .query(baseCreds as any);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      visitor: { isAdmin: false, visitorId: baseCreds.visitorId },
      gameData: {
        isGameOver: false,
        isResetInProgress: false,
        lastInteraction: null,
        playerX: { visitorId: 42 },
        playerO: { visitorId: null },
      },
    });
    // Only the fields useCanReset reads should be present.
    expect(res.body.gameData).not.toHaveProperty("claimedCells");
    expect(res.body.gameData).not.toHaveProperty("turnCount");
    expect(mockUtils.verifyBoard).toHaveBeenCalled();
  });

  test("POST /leaderboard/reset admin-gated + returns empty leaderboard", async () => {
    mockUtils.getCredentials.mockReturnValue(baseCreds);
    // Non-admin — should get 403
    (mockUtils.Visitor.get as jest.Mock).mockResolvedValue({ isAdmin: false });
    const app = makeApp();
    let res = await request(app).post("/api/leaderboard/reset").send(baseCreds);
    expect(res.status).toBe(403);

    // Admin — should succeed
    (mockUtils.Visitor.get as jest.Mock).mockResolvedValue({ isAdmin: true });
    mockUtils.getDroppedAssetDataObject.mockResolvedValue({ keyAsset: { dataObject: {} } });
    res = await request(app).post("/api/leaderboard/reset").send(baseCreds);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Reset returns the new (empty) leaderboard directly so callers skip a follow-up GET.
    expect(res.body.leaderboard).toEqual([]);
    expect(mockUtils.resetLeaderboard).toHaveBeenCalled();
  });

  test("POST /click/:cell bails out early when verifyBoard fully rebuilds the scene", async () => {
    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.verifyBoard.mockResolvedValueOnce({ ok: true, regenerated: true, fullRebuild: true });

    const app = makeApp();
    const res = await request(app).post("/api/click/4").send(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ boardRebuilt: true });
    expect(mockUtils.verifyBoard).toHaveBeenCalled();
    // Downstream game-state work must NOT run — the world under us was replaced.
    expect(mockUtils.getDroppedAssetDataObject).not.toHaveBeenCalled();
  });

  test("POST /select-player/:symbol bails out early when verifyBoard fully rebuilds the scene", async () => {
    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.verifyBoard.mockResolvedValueOnce({ ok: true, regenerated: true, fullRebuild: true });

    const app = makeApp();
    const res = await request(app).post("/api/select-player/x").send(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, boardRebuilt: true });
    expect(mockUtils.verifyBoard).toHaveBeenCalled();
    expect(mockUtils.getDroppedAssetDataObject).not.toHaveBeenCalled();
  });
});
