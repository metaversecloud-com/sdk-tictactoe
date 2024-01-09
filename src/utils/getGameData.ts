import { errorHandler, DroppedAsset, initializeDroppedAssetDataObject } from "./index.js";
import { GameDataType } from "../types/gameData.js";
import { Credentials } from "../types/credentials.js";

export const getGameData = async (credentials: Credentials): Promise<GameDataType> => {
  try {
    const droppedAsset = await DroppedAsset.getWithUniqueName(
      "TicTacToeBoard",
      credentials.urlSlug,
      credentials.interactivePublicKey,
      process.env.INTERACTIVE_SECRET,
    );
    await initializeDroppedAssetDataObject(droppedAsset);

    return droppedAsset.dataObject;
  } catch (error) {
    errorHandler({
      error,
      functionName: "getGameData",
      message: "Error getting game data.",
    });
  }
};
