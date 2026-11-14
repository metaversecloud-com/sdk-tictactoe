// Permission checks, anti-cheat and concurrency: requests a player can send by hand or at the same time.
import { INTERACTIVE_SECRET } from "../../constants";
import { ALICE, BOB, CAROL, expect, gameData, test } from "../../fixtures";

test("a player can't reset the leaderboard by calling the admin route", async ({ request, world }) => {
  const leaderboard = { [ALICE.profileId]: "Alice|9" };
  await world.seed({ assetData: gameData({ leaderboard }) });

  const response = await request.post(world.api("/leaderboard/reset", world.as(BOB)));

  expect(response.status()).toBe(403);
  expect((await world.game()).leaderboard).toEqual(leaderboard);
});

test("a display name can't change the number of wins on the leaderboard", async ({ page, world }) => {
  // Known bug: entries are stored as "name|wins" and split on "|", so a winner named "Mallory|999"
  // is stored as "Mallory|999|1" and shown (and later incremented) as 999 wins.
  test.fail(true, "EXP-442: display name can rewrite the leaderboard score");
  const mallory = { ...ALICE, displayName: "Mallory|999" };
  await world.seed({ assetData: gameData({ x: mallory, cells: { 0: mallory, 1: mallory, 3: BOB, 4: BOB }, turn: mallory }) });

  await world.webhook("/click/2", mallory, { assetId: "cell-2", uniqueName: "TicTacToe_cell" });
  await page.goto(world.url("/", world.as(BOB)));

  await expect(page.locator(".leaderboard-table tbody tr td.wins")).toHaveText(["1"]);
});

test.describe("cells outside the board", () => {
  for (const cell of ["9", "-1"]) {
    test(`a move on cell ${cell} is rejected and doesn't use up the turn`, async ({ world }) => {
      // Known bug: the cell index is only checked with isNaN, so any number is accepted. The move
      // lands in claimedCells, drops a sprite and passes the turn, letting a player skip turns.
      test.fail(true, "EXP-442: cell index isn't range-checked");
      await world.seed({ assetData: gameData({ turn: ALICE }) });

      const response = await world.click(ALICE, cell, "cell-4");

      expect(response.ok()).toBe(false);
      const game = await world.game();
      expect(Object.keys(game.claimedCells).sort()).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
      expect(game.lastPlayerTurn).toBe(BOB.visitorId);
      expect(await world.dropped("TicTacToe_move")).toEqual([]);
    });
  }

  test("a move on a cell that isn't a number is rejected", async ({ world }) => {
    await world.seed({ assetData: gameData({ turn: ALICE }) });

    const response = await world.click(ALICE, "center", "cell-4");

    expect(response.ok()).toBe(false);
    expect((await world.game()).turnCount).toBe(0);
  });
});

test.describe("at the same time", () => {
  test("a player clicking two cells at once only gets one move", async ({ world }) => {
    await world.seed({ assetData: gameData({ turn: ALICE }) });

    const responses = await Promise.all([world.click(ALICE, 0), world.click(ALICE, 8)]);

    // The second one either hits the move lock (409) or, if it reads after the first one's write, the turn check.
    expect(responses.filter((r) => r.ok())).toHaveLength(1);
    const claimed = Object.values((await world.game()).claimedCells).filter(Boolean);
    expect(claimed).toEqual([ALICE.visitorId]);
    expect(await world.dropped("TicTacToe_move")).toHaveLength(1);
  });

  test("both players clicking at once only lets the player whose turn it is move", async ({ world }) => {
    await world.seed({ assetData: gameData({ turn: ALICE }) });

    await Promise.all([world.click(ALICE, 0), world.click(BOB, 8)]);

    const game = await world.game();
    expect(game.claimedCells[8]).toBeNull();
    expect(Object.values(game.claimedCells).filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  test("two visitors clicking X at once don't both become player X", async ({ world }) => {
    // Known bug: the join lock id includes the visitorId, so two visitors never share a lock and both
    // pass the "already selected" check. Both are told they joined; the last write wins.
    test.fail(true, "EXP-442: simultaneous joins aren't serialized");
    await world.seed();

    const responses = await Promise.all([world.select(ALICE, "x"), world.select(CAROL, "x")]);

    expect(responses.filter((r) => r.ok())).toHaveLength(1);
    expect(await world.game()).toMatchObject({ playerCount: 1 });
  });

  test("X and O claimed at once still start the game with a first player", async ({ world }) => {
    // Known bug: each request sees the other symbol still free, so neither counts as the second
    // player: no first player is picked, GAME_ON never fires and the board keeps saying
    // "Find a second player!" while either player can move first.
    test.fail(true, "EXP-442: simultaneous joins aren't serialized");
    await world.seed();

    await Promise.all([world.select(ALICE, "x"), world.select(BOB, "o")]);

    const game = await world.game();
    expect(game).toMatchObject({ playerX: { visitorId: ALICE.visitorId }, playerO: { visitorId: BOB.visitorId } });
    expect([ALICE.visitorId, BOB.visitorId]).toContain(game.lastPlayerTurn);
    expect(await world.text()).toMatch(/^It's (Alice|Bob)'s turn\.$/);
    expect(game.playerCount).toBe(2);
  });
});

test("error responses never carry the interactive secret", async ({ request, world }) => {
  await world.seed({ assetData: gameData({ turn: ALICE }) });

  const responses = await Promise.all([
    world.click(BOB, 4), // out of turn
    world.click(ALICE, 4, "missing-cell"), // unknown clicked asset
    request.post("/api/click/4"), // no credentials
    request.post(world.api("/leaderboard/reset", world.as(ALICE))), // not an admin
    request.get(world.api("/leaderboard-state", { visitorId: "999" })), // not in the world
  ]);

  for (const response of responses) {
    const body = await response.text();
    expect(body).not.toContain(INTERACTIVE_SECRET);
    expect(body).not.toContain("interactiveSecret");
    // A signed InteractiveJWT (mock-topia's own 401 message names the header, so look for the token).
    expect(body).not.toMatch(/eyJ[\w-]+\.eyJ[\w-]+\./);
  }
});
