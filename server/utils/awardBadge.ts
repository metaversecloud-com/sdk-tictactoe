import { Credentials } from "../types/credentialsInterface.js";
import { getCachedInventoryItems } from "./inventoryCache.js";
import { standardizeError } from "./standardizeError.js";

/**
 * Grant a badge to a visitor by name.
 * - Idempotent from the caller's perspective (checks caller-provided `ownedBadgeNames`).
 * - Best-effort: on failure, logs and returns { granted: false }.
 * - The caller is responsible for firing analytics events + toast.
 */
export const grantBadgeIfNew = async ({
  credentials,
  visitor,
  badgeName,
  ownedBadgeNames,
}: {
  credentials: Credentials;
  visitor: any;
  badgeName: string;
  ownedBadgeNames: Set<string>;
}): Promise<{ granted: boolean; error?: string }> => {
  try {
    if (ownedBadgeNames.has(badgeName)) return { granted: false };

    const inventoryItems = await getCachedInventoryItems({ credentials });
    const inventoryItem = inventoryItems.find(
      (item: any) => item.name === badgeName && item.type === "BADGE" && item.status === "ACTIVE",
    );
    if (!inventoryItem) {
      console.warn(`Badge "${badgeName}" not found in ecosystem inventory`);
      return { granted: false, error: "badge_not_found" };
    }

    try {
      await visitor.grantInventoryItem(inventoryItem, 1);
      // Best-effort toast to signal the badge was earned.
      visitor
        .fireToast({
          groupId: "badges",
          title: `You unlocked the ${badgeName} badge!`,
          text: "",
        })
        .catch(() => {
          /* toast failure is non-fatal */
        });
      return { granted: true };
    } catch (error) {
      console.warn(`Failed to grant badge "${badgeName}"`, standardizeError(error));
      return { granted: false, error: "grant_failed" };
    }
  } catch (error) {
    console.warn(`grantBadgeIfNew unexpected failure for "${badgeName}"`, standardizeError(error));
    return { granted: false, error: "unexpected" };
  }
};
