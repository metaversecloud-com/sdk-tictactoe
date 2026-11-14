// Claiming X and O: the canvas sprites post to /api/select-player/:symbol (webhooks).
import { ALICE, BOB, CAROL, KEY_ASSET_ID, expect, gameData, test } from "../../fixtures";

test("the first player to click X becomes player X and waits for an opponent", async ({ world }) => {
  await world.seed();

  const response = await world.select(ALICE, "x");

  expect(response.ok()).toBe(true);
  expect(await world.game()).toMatchObject({
    keyAssetId: KEY_ASSET_ID,
    playerCount: 1,
    playerX: { profileId: ALICE.profileId, displayName: "Alice", visitorId: ALICE.visitorId },
    playerO: { visitorId: null },
    lastPlayerTurn: null,
  });
  expect(await world.text("TicTacToe_gameText")).toBe("Find a second player!");
  expect(await world.text("TicTacToe_playerXText")).toBe("Alice");
  expect(await world.events("set-activity")).toEqual([expect.objectContaining({ type: "set-activity", assetId: KEY_ASSET_ID })]);
  expect((await world.events("set-activity"))[0].webhookType).toBe("GAME_WAITING");
  expect(await world.analytics()).toContain("joins");
  // The game is only counted once both players are in.
  expect(await world.visitorData(ALICE.visitorId)).toEqual({});
});

test("the second player starts the game and one of them is picked to move first", async ({ world }) => {
  await world.seed({ assetData: gameData({ x: ALICE, o: null }) });

  const response = await world.select(BOB, "o");

  expect(response.ok()).toBe(true);
  const game = await world.game();
  expect(game).toMatchObject({ playerCount: 2, playerO: { displayName: "Bob", visitorId: BOB.visitorId } });
  // lastPlayerTurn holds who "just moved", so the other one moves first.
  expect([ALICE.visitorId, BOB.visitorId]).toContain(game.lastPlayerTurn);
  const first = game.lastPlayerTurn === ALICE.visitorId ? "Bob" : "Alice";
  expect(await world.text("TicTacToe_gameText")).toBe(`It's ${first}'s turn.`);
  expect(await world.text("TicTacToe_playerOText")).toBe("Bob");
  expect((await world.events("set-activity")).map((e) => e.webhookType)).toEqual(["GAME_ON"]);
  // Hobbyist badge counter: both players have played one more game.
  expect(await world.visitorData(ALICE.visitorId)).toEqual({ totalGamesPlayed: 1 });
  expect(await world.visitorData(BOB.visitorId)).toEqual({ totalGamesPlayed: 1 });
});

test("a symbol that's already taken can't be claimed by someone else", async ({ world }) => {
  await world.seed({ assetData: gameData({ x: ALICE, o: null }) });

  const response = await world.select(CAROL, "x");

  expect(response.ok()).toBe(false);
  expect(await world.game()).toMatchObject({ playerX: { visitorId: ALICE.visitorId }, playerO: { visitorId: null } });
  expect(await world.text("TicTacToe_gameText")).toBe("Player X already selected.");
});

test("a player can't take both symbols to play against themselves", async ({ world }) => {
  await world.seed({ assetData: gameData({ x: ALICE, o: null }) });

  const response = await world.select(ALICE, "o");

  expect(response.ok()).toBe(false);
  expect(await world.game()).toMatchObject({ playerO: { visitorId: null }, lastPlayerTurn: null });
  expect(await world.text("TicTacToe_gameText")).toBe("You are already player X");
});

test("a bystander can't take over a full game", async ({ world }) => {
  await world.seed({ assetData: gameData() });

  const response = await world.select(CAROL, "o");

  expect(response.ok()).toBe(false);
  expect(await world.game()).toMatchObject({ playerO: { visitorId: BOB.visitorId } });
  expect(await world.text("TicTacToe_gameText")).toBe("Player O already selected.");
});
