// The drawer pages: Leaderboard | Badges (opened from the canvas leaderboard asset), How to Play.
import { ADMIN, ALICE, BOB, CAROL, expect, gameData, test } from "../../fixtures";

const LEADERBOARD = { [ALICE.profileId]: "Alice|2", [BOB.profileId]: "Bob|7", [CAROL.profileId]: "Carol|4" };

test("the leaderboard ranks players by wins and highlights the visitor", async ({ page, world }) => {
  await world.seed({ assetData: gameData({ leaderboard: LEADERBOARD }) });
  await page.goto(world.url("/leaderboard", world.as(ALICE)));

  const rows = page.locator(".leaderboard-table tbody tr");
  await expect(rows).toHaveText([/1\s*Bob\s*7/, /2\s*Carol\s*4/, /3\s*Alice\s*2/]);
  await expect(rows.nth(2)).toHaveClass(/highlight/);
  await expect(rows.nth(0)).not.toHaveClass(/highlight/);
});

test("the leaderboard shows the top 25 only", async ({ page, world }) => {
  const leaderboard = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`profile-${i}`, `Player ${i}|${i}`]));
  await world.seed({ assetData: gameData({ leaderboard }) });
  await page.goto(world.url("/", world.as(ALICE)));

  const rows = page.locator(".leaderboard-table tbody tr");
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("Player 29");
  await expect(rows.last()).toContainText("Player 5");
});

test("an empty leaderboard invites the first win", async ({ page, world }) => {
  await world.seed();
  await page.goto(world.url("/", world.as(ALICE)));

  await expect(page.getByText("No wins yet. Be the first!")).toBeVisible();
  // Opening the drawer on a freshly dropped board sets up the game state on the key asset.
  expect(await world.game()).toMatchObject({ keyAssetId: "key-asset", playerCount: 0, leaderboard: {} });
  expect((await world.state()).dataObject).toEqual({ scenes: { "scene-1": { keyAssetId: "key-asset" } } });
});

test("the badges tab shows owned badges in color and the rest in grayscale", async ({ page, world }) => {
  await world.seed({ assetData: gameData(), people: { [ALICE.visitorId]: { badges: ["Victory"] } } });
  await page.goto(world.url("/", world.as(ALICE)));

  await page.getByRole("button", { name: "Badges" }).click();

  await expect(page.getByRole("img", { name: "Victory" })).not.toHaveClass(/grayscale/);
  await expect(page.getByRole("img", { name: "Champion" })).toHaveClass(/badge-img-grayscale/);
  await expect(page.getByRole("img", { name: "Hobbyist" })).toHaveClass(/badge-img-grayscale/);
});

test("an admin resets the leaderboard from the drawer", async ({ page, world }) => {
  await world.seed({ assetData: gameData({ leaderboard: LEADERBOARD }) });
  await page.goto(world.url("/", world.as(ADMIN)));
  await expect(page.locator(".leaderboard-table tbody tr")).toHaveCount(3);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset Leaderboard" }).click();

  await expect(page.getByText("No wins yet. Be the first!")).toBeVisible();
  expect((await world.game()).leaderboard).toEqual({});
});

test("dismissing the confirmation keeps the leaderboard", async ({ page, world }) => {
  await world.seed({ assetData: gameData({ leaderboard: LEADERBOARD }) });
  await page.goto(world.url("/", world.as(ADMIN)));

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reset Leaderboard" }).click();

  await expect(page.locator(".leaderboard-table tbody tr")).toHaveCount(3);
  expect((await world.game()).leaderboard).toEqual(LEADERBOARD);
});

test("players don't see the leaderboard reset button", async ({ page, world }) => {
  await world.seed({ assetData: gameData({ leaderboard: LEADERBOARD }) });
  await page.goto(world.url("/", world.as(ALICE)));

  await expect(page.locator(".leaderboard-table tbody tr")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Reset Leaderboard" })).toHaveCount(0);
});

test("How to Play shows the instructions", async ({ page, world }) => {
  await world.seed();
  await page.goto(world.url("/info", world.as(ALICE)));

  await expect(page.getByRole("img", { name: "How To Play" })).toBeAttached();
});

test("asks to open the app inside a Topia world when credentials are missing", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Missing Interactive Parameters" })).toBeVisible();
});

test("shows an error when the visitor isn't in the world", async ({ page, world }) => {
  await world.seed({ assetData: gameData() });
  await page.goto(world.url("/", { visitorId: "999" }));

  await expect(page.locator(".text-error")).toContainText("Error");
});
