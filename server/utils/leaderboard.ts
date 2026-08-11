/**
 * Leaderboard is stored on the key-asset data object under `leaderboard`,
 * as a map keyed by profileId:
 *   { [profileId]: "displayName|wins" }
 * Format mirrors sdk-lunch-swap's pipe-delimited leaderboard schema.
 */

export type LeaderboardEntry = {
  profileId: string;
  displayName: string;
  wins: number;
};

/**
 * Parse the raw leaderboard blob into a sorted top-N array of entries.
 */
export const parseLeaderboard = (keyAsset: any, limit = 25): LeaderboardEntry[] => {
  const raw = keyAsset?.dataObject?.leaderboard;
  if (!raw || typeof raw !== "object") return [];

  const entries: LeaderboardEntry[] = [];
  for (const profileId of Object.keys(raw)) {
    const value = raw[profileId];
    if (typeof value !== "string") continue;
    const [displayName, winsStr] = value.split("|");
    const wins = parseInt(winsStr) || 0;
    entries.push({ profileId, displayName: displayName || "", wins });
  }

  entries.sort((a, b) => b.wins - a.wins);
  return entries.slice(0, limit);
};

/**
 * Increment a player's leaderboard entry by 1 win. If the player is not on
 * the leaderboard yet, they are added with 1 win.
 */
export const incrementLeaderboardEntry = async (
  keyAsset: any,
  profileId: string,
  displayName: string,
): Promise<void> => {
  if (!profileId) return;

  const raw = (keyAsset?.dataObject?.leaderboard || {}) as Record<string, string>;
  const existing = raw[profileId];
  let newWins = 1;
  if (existing && typeof existing === "string") {
    const [, winsStr] = existing.split("|");
    newWins = (parseInt(winsStr) || 0) + 1;
  }
  const resultString = `${displayName || ""}|${newWins}`;
  await keyAsset.updateDataObject({ [`leaderboard.${profileId}`]: resultString });
};

/**
 * Wipe the leaderboard to an empty map.
 */
export const resetLeaderboard = async (keyAsset: any): Promise<void> => {
  await keyAsset.updateDataObject({ leaderboard: {} });
};
