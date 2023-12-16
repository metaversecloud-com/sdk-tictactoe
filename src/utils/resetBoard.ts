import { DroppedAsset, Game } from "../topia/index.js";
import { errorHandler } from "../utils/index.js";
import { Credentials } from "../types/credentials";

export const resetBoard = async (activeGame: Game, credentials: Credentials, urlSlug: string) => {
  try {
    const finishLine = DroppedAsset.create(activeGame.finishLineId, urlSlug, { credentials });
    const message = DroppedAsset.create(activeGame.messageTextId, urlSlug, { credentials });
    const moves = activeGame.moves.map((m) => DroppedAsset.create(m, urlSlug, { credentials }));
    activeGame.moves = [];
    activeGame.status = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    activeGame.messageTextId = undefined;
    activeGame.finishLineId = undefined;

    await Promise.allSettled([
      finishLine.deleteDroppedAsset(),
      message.deleteDroppedAsset(),
      ...moves.map((m) => m.deleteDroppedAsset()),
    ]);
  } catch (error) {
    errorHandler({
      error,
      functionName: "resetBoard",
      message: "Error resetting the board.",
    });
  }
};
