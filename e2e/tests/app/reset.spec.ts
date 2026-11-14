// Resetting the board: POST /api/reset, the Reset drawer page (opened from the key asset) and the
// board self-heal that runs when it opens.
import { APP_PORT } from "../../constants";
import { ADMIN, ALICE, BOB, CAROL, DEFAULT_GAME_TEXT, KEY_ASSET_ID, SCENE_DROP_ID, expect, gameData, test } from "../../fixtures";

const WON = { 0: ALICE, 1: ALICE, 2: ALICE, 3: BOB, 4: BOB };
const SIX_MINUTES_AGO = () => new Date(Date.now() - 6 * 60 * 1000).toISOString();

/** Sprites a finished game leaves on the board, plus a move on another board (scene) in the same world. */
const leftovers = {
  "move-1": { id: "move-1", uniqueName: "TicTacToe_move", sceneDropId: SCENE_DROP_ID },
  "move-2": { id: "move-2", uniqueName: "TicTacToe_move", sceneDropId: SCENE_DROP_ID },
  "finish-line": { id: "finish-line", uniqueName: "TicTacToe_finishLine", sceneDropId: SCENE_DROP_ID },
  crown: { id: "crown", uniqueName: "TicTacToe_crown", sceneDropId: SCENE_DROP_ID },
  "other-board-move": { id: "other-board-move", uniqueName: "TicTacToe_move", sceneDropId: "scene-2" },
};

test("a player's reset after a win clears the board but keeps the leaderboard", async ({ world }) => {
  await world.seed({
    assetData: gameData({ cells: WON, turn: BOB, isGameOver: true, resetCount: 2, leaderboard: { [ALICE.profileId]: "Alice|1" } }),
    extraAssets: leftovers,
  });

  const response = await world.reset(BOB);

  expect(response.ok()).toBe(true);
  const game = await world.game();
  expect(game).toMatchObject({
    isGameOver: false,
    isResetInProgress: false,
    keyAssetId: KEY_ASSET_ID,
    lastPlayerTurn: null,
    playerCount: 0,
    playerX: { visitorId: null },
    playerO: { visitorId: null },
    resetCount: 3,
    turnCount: 0,
    leaderboard: { [ALICE.profileId]: "Alice|1" },
  });
  expect(Object.values(game.claimedCells).every((v) => v === null)).toBe(true);
  expect(await world.text("TicTacToe_gameText")).toBe(DEFAULT_GAME_TEXT);
  expect(await world.text("TicTacToe_playerXText")).toBe("Player X");
  expect(await world.text("TicTacToe_playerOText")).toBe("Player O");
  const { assets } = await world.state();
  for (const id of ["move-1", "move-2", "finish-line", "crown"]) expect(assets[id], id).toBeUndefined();
  expect(assets["other-board-move"]).toBeDefined();
  expect(await world.analytics()).toContain("resets");
  expect(await world.events("particles")).toEqual([expect.objectContaining({ particleId: "particle-3" })]);
});

test("a current player can reset a game in progress", async ({ world }) => {
  // The rule the Reset page states: "Only current players, admins, or after 5 minutes of inactivity".
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });

  const response = await world.reset(ALICE);

  expect(response.ok()).toBe(true);
  expect(await world.game()).toMatchObject({ playerX: { visitorId: null }, resetCount: 1 });
});

test("a bystander can't reset a game in progress", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }), extraAssets: { "move-1": leftovers["move-1"] } });

  const response = await world.reset(CAROL);

  expect(response.ok()).toBe(false);
  expect(await world.game()).toMatchObject({ playerX: { visitorId: ALICE.visitorId }, claimedCells: { 4: ALICE.visitorId }, resetCount: 0 });
  expect((await world.state()).assets["move-1"]).toBeDefined();
});

test("a bystander can reset once the game is over or abandoned for 5 minutes", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: WON, turn: BOB, isGameOver: true }) });
  expect((await world.reset(CAROL)).ok()).toBe(true);

  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB, lastInteraction: SIX_MINUTES_AGO() }) });
  expect((await world.reset(CAROL)).ok()).toBe(true);
  expect(await world.game()).toMatchObject({ playerX: { visitorId: null }, resetCount: 1 });
});

test("an admin can reset a game in progress", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });

  expect((await world.reset(ADMIN)).ok()).toBe(true);
  expect(await world.game()).toMatchObject({ playerX: { visitorId: null }, resetCount: 1 });
});

test("two resets at the same time leave one clean board, not a stuck one", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: WON, turn: BOB, isGameOver: true }) });

  const responses = await Promise.all([world.reset(ALICE), world.reset(BOB)]);

  // Overlapping resets share the reset lock (409); one that starts after the other finished is a no-op reset.
  const statuses = responses.map((r) => r.status());
  expect(statuses.every((s) => s === 200 || s === 409)).toBe(true);
  const succeeded = statuses.filter((s) => s === 200).length;
  expect(succeeded).toBeGreaterThanOrEqual(1);
  expect(await world.game()).toMatchObject({ resetCount: succeeded, isResetInProgress: false, isGameOver: false, playerX: { visitorId: null } });
});

test.describe("Reset page", () => {
  test("a player confirms the reset and the drawer closes", async ({ page, world }) => {
    await world.seed({ assetData: gameData({ cells: WON, turn: BOB, isGameOver: true }) });
    await page.goto(world.url("/reset", world.as(ALICE)));

    await expect(page.getByRole("heading", { name: "Reset the board?" })).toBeVisible();
    await page.getByRole("button", { name: "Yes, Reset" }).click();

    await expect.poll(async () => (await world.events("close-iframe")).length).toBe(1);
    expect(await world.events("close-iframe")).toEqual([
      expect.objectContaining({ visitorId: String(ALICE.visitorId), droppedAssetId: KEY_ASSET_ID }),
    ]);
    expect(await world.game()).toMatchObject({ isGameOver: false, playerX: { visitorId: null }, resetCount: 1 });
  });

  test("staying here closes the drawer without resetting", async ({ page, world }) => {
    await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });
    await page.goto(world.url("/reset", world.as(ALICE)));

    await page.getByRole("button", { name: "No, Stay Here" }).click();

    await expect.poll(async () => (await world.events("close-iframe")).length).toBe(1);
    expect(await world.game()).toMatchObject({ playerX: { visitorId: ALICE.visitorId }, resetCount: 0 });
  });

  test("a bystander is told why they can't reset a game in progress", async ({ page, world }) => {
    await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });
    await page.goto(world.url("/reset", world.as(CAROL)));

    await expect(page.getByRole("heading", { name: "Can't reset the board" })).toBeVisible();
    await expect(page.getByText("Only current players, admins, or after 5 minutes of inactivity can reset the board.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yes, Reset" })).toHaveCount(0);
    await page.getByRole("button", { name: "OK" }).click();
    await expect.poll(async () => (await world.events("close-iframe")).length).toBe(1);
  });

  test("a bystander can reset a finished game", async ({ page, world }) => {
    await world.seed({ assetData: gameData({ cells: WON, turn: BOB, isGameOver: true }) });
    await page.goto(world.url("/reset", world.as(CAROL)));

    await page.getByRole("button", { name: "Yes, Reset" }).click();

    await expect.poll(async () => (await world.game()).resetCount).toBe(1);
  });

  test("opening it puts back board pieces that went missing", async ({ page, world }) => {
    await world.seed({ assetData: gameData(), without: ["game-text", "cell-4"] });
    await page.goto(world.url("/reset", world.as(ALICE)));
    await expect(page.getByRole("heading", { name: "Reset the board?" })).toBeVisible();

    expect(await world.dropped("TicTacToe_gameText")).toEqual([
      expect.objectContaining({ text: DEFAULT_GAME_TEXT, sceneDropId: SCENE_DROP_ID, assetId: "textAsset" }),
    ]);
    // Cells share one uniqueName, so all 9 are dropped again, each wired to its own click webhook.
    expect(await world.dropped("TicTacToe_cell")).toHaveLength(8 + 9);
    const webhooks = (await world.events("webhooks")).map((e) => e.url).sort();
    expect(webhooks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => `http://localhost:${APP_PORT}/api/click/${c}`).sort());
  });
});
