// Taking turns: each cell of the board posts to /api/click/:cell (webhook) when clicked.
import { ALICE, BOB, BUCKET, CAROL, cellPosition, expect, gameData, test } from "../../fixtures";

test("player X's move claims the cell, drops a pink X on it and passes the turn", async ({ world }) => {
  await world.seed({ assetData: gameData({ turn: ALICE }) });

  const response = await world.click(ALICE, 4);

  expect(response.ok()).toBe(true);
  const game = await world.game();
  expect(game.claimedCells).toMatchObject({ 4: ALICE.visitorId, 0: null });
  expect(game).toMatchObject({ lastPlayerTurn: ALICE.visitorId, turnCount: 1, isGameOver: false });
  expect(await world.dropped("TicTacToe_move")).toEqual([
    expect.objectContaining({ layer1: `${BUCKET}pink_x.png`, position: cellPosition(4), sceneDropId: "scene-1" }),
  ]);
  expect(await world.text()).toBe("It's Bob's turn.");
  // The first move of a game counts as a start for both players.
  expect((await world.events("analytics")).filter((e) => e.analyticName === "starts").map((e) => e.profileId).sort()).toEqual(
    [ALICE.profileId, BOB.profileId].sort(),
  );
});

test("player O's move drops a blue O", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });

  const response = await world.click(BOB, 0);

  expect(response.ok()).toBe(true);
  expect((await world.game()).claimedCells).toMatchObject({ 0: BOB.visitorId, 4: ALICE.visitorId });
  expect(await world.dropped("TicTacToe_move")).toEqual([
    expect.objectContaining({ layer1: `${BUCKET}blue_o.png`, position: cellPosition(0) }),
  ]);
  expect(await world.text()).toBe("It's Alice's turn.");
  expect(await world.analytics()).not.toContain("starts");
});

test("a player can't move twice in a row", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });

  const response = await world.click(ALICE, 0);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[0]).toBeNull();
  expect(await world.dropped("TicTacToe_move")).toEqual([]);
  expect(await world.text()).toBe("It's Bob's turn.");
});

test("a cell that's already taken can't be claimed again", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 4: ALICE }, turn: BOB }) });

  const response = await world.click(BOB, 4);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[4]).toBe(ALICE.visitorId);
  expect(await world.dropped("TicTacToe_move")).toEqual([]);
  expect(await world.text()).toBe("Cannot place your move here.");
});

test("someone who isn't playing can't move", async ({ world }) => {
  await world.seed({ assetData: gameData({ turn: ALICE }) });

  const response = await world.click(CAROL, 4);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[4]).toBeNull();
  expect(await world.text()).toBe("Game in progress.");
});

test("nobody can move before both players have joined", async ({ world }) => {
  await world.seed({ assetData: gameData({ o: null }) });

  const response = await world.click(ALICE, 4);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[4]).toBeNull();
  expect(await world.text()).toBe("Two players are needed to get started.");
});

test("nobody can move once the game is over", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 0: ALICE, 1: ALICE, 2: ALICE, 3: BOB, 4: BOB }, turn: BOB, isGameOver: true }) });

  const response = await world.click(BOB, 5);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[5]).toBeNull();
  expect(await world.text()).toBe("Game over! Press Reset to play again.");
});

test("nobody can move while a reset is in progress", async ({ world }) => {
  await world.seed({ assetData: gameData({ turn: ALICE, isResetInProgress: true }) });

  const response = await world.click(ALICE, 4);

  expect(response.ok()).toBe(false);
  expect((await world.game()).claimedCells[4]).toBeNull();
});
