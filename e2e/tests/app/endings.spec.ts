// How games end: a line in every direction, draws, the leaderboard, win counters and badges.
import { ALICE, BOB, BOARD_CENTER, BUCKET, CELL_WIDTH, KEY_POSITION, Person, expect, gameData, test } from "../../fixtures";

const { x: cx, y: cy } = BOARD_CENTER;

// Each line, with the finish-line sprite and where it's dropped (server/utils/getFinishLineOptions.ts).
const LINES = [
  { name: "top row", cells: [0, 1, 2], sprite: "horizontal", position: { x: cx, y: cy - CELL_WIDTH } },
  { name: "middle row", cells: [3, 4, 5], sprite: "horizontal", position: { x: cx, y: cy } },
  { name: "bottom row", cells: [6, 7, 8], sprite: "horizontal", position: { x: cx, y: cy + CELL_WIDTH } },
  { name: "left column", cells: [0, 3, 6], sprite: "vertical", position: { x: cx - CELL_WIDTH, y: cy } },
  { name: "middle column", cells: [1, 4, 7], sprite: "vertical", position: { x: cx, y: cy } },
  { name: "right column", cells: [2, 5, 8], sprite: "vertical", position: { x: cx + CELL_WIDTH, y: cy } },
  { name: "diagonal from top left", cells: [0, 4, 8], sprite: "oblique", position: { x: cx, y: cy } },
  { name: "diagonal from top right", cells: [2, 4, 6], sprite: "oblique_1", position: { x: cx, y: cy } },
];

/** X holds two cells of the line, O two cells outside it; X to move. */
const oneMoveFromWinning = (line: number[]) => {
  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => !line.includes(c));
  const cells: Record<number, Person> = { [line[0]]: ALICE, [line[1]]: ALICE, [others[0]]: BOB, [others[1]]: BOB };
  return gameData({ cells, turn: ALICE });
};

/** Crown above the winner's name label: X's on the left, O's on the right. */
const crownPosition = (isO: boolean) => ({ x: KEY_POSITION.x + (isO ? 200 : -200), y: KEY_POSITION.y - 180 - CELL_WIDTH * 2 });

for (const line of LINES) {
  test(`three in the ${line.name} wins`, async ({ world }) => {
    await world.seed({ assetData: oneMoveFromWinning(line.cells) });

    const response = await world.click(ALICE, line.cells[2]);

    expect(response.ok()).toBe(true);
    expect(await world.game()).toMatchObject({ isGameOver: true });
    expect(await world.text()).toBe("Alice wins!");
    expect(await world.dropped("TicTacToe_finishLine")).toEqual([
      expect.objectContaining({ layer1: `${BUCKET}pink_${line.sprite}.png`, position: line.position }),
    ]);
    expect(await world.dropped("TicTacToe_crown")).toEqual([
      expect.objectContaining({ layer0: `${BUCKET}crown.png`, position: crownPosition(false) }),
    ]);
  });
}

test("a win updates the leaderboard, the winner's counters and badges", async ({ world }) => {
  await world.seed({ assetData: oneMoveFromWinning([0, 1, 2]) });

  await world.click(ALICE, 2);

  expect((await world.game()).leaderboard).toEqual({ [ALICE.profileId]: "Alice|1" });
  expect(await world.visitorData(ALICE.visitorId)).toMatchObject({ totalWins: 1 });
  expect(await world.visitorData(BOB.visitorId)).toEqual({});
  expect((await world.events("grant-item")).map((e) => [e.visitorId, e.name])).toEqual([[String(ALICE.visitorId), "Victory"]]);
  expect(await world.events("fire-toast")).toContainEqual(
    expect.objectContaining({ visitorId: String(ALICE.visitorId), title: "You unlocked the Victory badge!" }),
  );
  expect(await world.events("particles")).toContainEqual(expect.objectContaining({ particleId: "particle-2", followPlayerId: ALICE.visitorId }));
  const analytics = await world.analytics();
  expect(analytics).toEqual(expect.arrayContaining(["wins", "completions", "badge_earned_Victory"]));
  expect(analytics.filter((a) => a === "completions")).toHaveLength(2);
});

test("player O can win too, with blue pieces and the crown on O's side", async ({ world }) => {
  await world.seed({ assetData: gameData({ cells: { 0: BOB, 4: BOB, 1: ALICE, 2: ALICE, 6: ALICE }, turn: BOB }) });

  const response = await world.click(BOB, 8);

  expect(response.ok()).toBe(true);
  expect(await world.text()).toBe("Bob wins!");
  expect(await world.dropped("TicTacToe_finishLine")).toEqual([expect.objectContaining({ layer1: `${BUCKET}blue_oblique.png` })]);
  expect(await world.dropped("TicTacToe_crown")).toEqual([expect.objectContaining({ position: crownPosition(true) })]);
  expect((await world.game()).leaderboard).toEqual({ [BOB.profileId]: "Bob|1" });
});

test("a full board without a line is a draw", async ({ world }) => {
  // X O X / X O O / O X _  -> X takes the last cell, no line.
  await world.seed({
    assetData: gameData({ cells: { 0: ALICE, 2: ALICE, 3: ALICE, 7: ALICE, 1: BOB, 4: BOB, 5: BOB, 6: BOB }, turn: ALICE }),
  });

  const response = await world.click(ALICE, 8);

  expect(response.ok()).toBe(true);
  expect(await world.game()).toMatchObject({ isGameOver: true, leaderboard: {} });
  expect(await world.text()).toBe("It's a draw! Press Reset to play again.");
  expect(await world.dropped("TicTacToe_finishLine")).toEqual([]);
  expect(await world.dropped("TicTacToe_crown")).toEqual([]);
  expect(await world.events("grant-item")).toEqual([]);
  expect(await world.events("particles")).toEqual([expect.objectContaining({ particleId: "particle-1" })]);
  const analytics = await world.analytics();
  expect(analytics.filter((a) => a === "ties")).toHaveLength(2);
  expect(analytics).not.toContain("wins");
});

test("completing a line with the last free cell is a win, not a draw", async ({ world }) => {
  await world.seed({
    assetData: gameData({ cells: { 2: ALICE, 3: ALICE, 5: ALICE, 7: ALICE, 0: BOB, 1: BOB, 4: BOB, 6: BOB }, turn: ALICE }),
  });

  await world.click(ALICE, 8);

  expect(await world.text()).toBe("Alice wins!");
  expect((await world.game()).leaderboard).toEqual({ [ALICE.profileId]: "Alice|1" });
});

test("wins add up on the leaderboard and keep the other players", async ({ world }) => {
  await world.seed({
    assetData: { ...oneMoveFromWinning([0, 1, 2]), leaderboard: { [ALICE.profileId]: "Alice|3", [BOB.profileId]: "Bob|5" } },
    people: { [ALICE.visitorId]: { dataObject: { totalWins: 3, totalGamesPlayed: 6 }, badges: ["Victory"] } },
  });

  await world.click(ALICE, 2);

  expect((await world.game()).leaderboard).toEqual({ [ALICE.profileId]: "Alice|4", [BOB.profileId]: "Bob|5" });
  expect(await world.visitorData(ALICE.visitorId)).toEqual({ totalWins: 4, totalGamesPlayed: 6 });
  // Victory is already owned and no other threshold is reached.
  expect(await world.events("grant-item")).toEqual([]);
});

test("the 15th win awards Champion and the 10th game awards Hobbyist", async ({ world }) => {
  await world.seed({
    assetData: oneMoveFromWinning([0, 1, 2]),
    people: { [ALICE.visitorId]: { dataObject: { totalWins: 14, totalGamesPlayed: 10 }, badges: ["Victory"] } },
  });

  await world.click(ALICE, 2);

  expect((await world.events("grant-item")).map((e) => e.name)).toEqual(["Champion", "Hobbyist"]);
  expect(await world.analytics()).toEqual(expect.arrayContaining(["badge_earned_Champion", "badge_earned_Hobbyist"]));
});

test("a whole game: both join, take turns, one wins and shows up on the leaderboard", async ({ page, world }) => {
  await world.seed();
  expect((await world.select(ALICE, "x")).ok()).toBe(true);
  expect((await world.select(BOB, "o")).ok()).toBe(true);

  // Whoever was picked to go first takes the top row; the other plays the middle row.
  const { lastPlayerTurn } = await world.game();
  const [first, second] = lastPlayerTurn === ALICE.visitorId ? [BOB, ALICE] : [ALICE, BOB];
  for (const [person, cell] of [[first, 0], [second, 3], [first, 1], [second, 4], [first, 2]] as const) {
    expect((await world.click(person, cell)).ok(), `${person.displayName} on ${cell}`).toBe(true);
  }

  expect(await world.text()).toBe(`${first.displayName} wins!`);
  expect(await world.dropped("TicTacToe_move")).toHaveLength(5);
  await page.goto(world.url("/", world.as(second)));
  await expect(page.locator(".leaderboard-table tbody tr")).toHaveText([new RegExp(`1\\s*${first.displayName}\\s*1`)]);
});
