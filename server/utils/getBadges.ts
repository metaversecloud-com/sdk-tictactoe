import { Credentials } from "../types/credentialsInterface.js";
import { getCachedInventoryItems } from "./inventoryCache.js";

export type BadgeRecord = {
  [name: string]: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
};

/**
 * Return the map of all active ecosystem badges available to this instance.
 * Uses the shared inventory cache — INACTIVE items are already filtered at
 * the cache layer, so we only need to check type + name here.
 */
export const getBadges = async (credentials: Credentials, forceRefresh = false): Promise<BadgeRecord> => {
  const inventoryItems = await getCachedInventoryItems({ credentials, forceRefresh });

  const badges: BadgeRecord = {};
  for (const item of inventoryItems) {
    const { id, name, image_path, description, type } = item as any;
    if (name && type === "BADGE") {
      badges[name] = {
        id,
        name,
        icon: image_path || "",
        description: description || "",
      };
    }
  }
  return badges;
};

/**
 * Given a fetched visitor's inventoryItems, return a name->{id,name,icon} map
 * of active BADGE items they own.
 */
export const getVisitorBadges = (visitorInventoryItems: any[] = []): Record<string, { id: string; name: string; icon: string }> => {
  const owned: Record<string, { id: string; name: string; icon: string }> = {};
  for (const visitorItem of visitorInventoryItems) {
    const { id, status, item } = visitorItem;
    const { name, type, image_url = "" } = item || {};
    if (status === "ACTIVE" && type === "BADGE" && name) {
      owned[name] = { id, name, icon: image_url };
    }
  }
  return owned;
};
