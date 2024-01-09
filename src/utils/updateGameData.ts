import { errorHandler, DroppedAsset } from "./index.js";
import { GameDataType } from "../types/gameData.js";
import { Credentials } from "../types/credentials.js";

export const updateGameData = async (credentials: Credentials, updatedData): Promise<GameDataType> => {
  try {
    const droppedAsset = await DroppedAsset.getWithUniqueName(
      "TicTacToeBoard",
      credentials.urlSlug,
      credentials.interactivePublicKey,
      process.env.INTERACTIVE_SECRET,
    );

    const lockId = `${droppedAsset.id}-gameUpdates-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`;
    await droppedAsset.updateDataObject({ ...updatedData }, { lock: { lockId, releaseLock: true } });

    return droppedAsset.dataObject;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateGameData",
      message: "Error updating active game.",
    });
  }
};
