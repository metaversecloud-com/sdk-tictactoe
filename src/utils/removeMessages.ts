import { errorHandler } from "./index.js";
import { World } from "./topiaInit.js";
import { Credentials } from "../types/credentials";

export const removeMessages = async (credentials: Credentials, gameId: string, urlSlug: string) => {
  try {
    const world = World.create(urlSlug, { credentials });
    const messageAssets = await world.fetchDroppedAssetsWithUniqueName({
      uniqueName: `message${gameId}`,
      isPartial: true,
    });
    console.log("messageAssets.length: ", messageAssets.length);
    if (messageAssets.length) {
      await Promise.allSettled(messageAssets.map((m) => m.deleteDroppedAsset()));
    }
  } catch (error) {
    errorHandler({
      error,
      functionName: "removeMessages",
      message: "Error removing messages.",
    });
  }
};
