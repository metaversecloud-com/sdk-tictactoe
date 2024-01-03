import { cellWidth } from "../constants.js";
import { Credentials } from "../types/credentials.js";
import { createTextAsset, errorHandler, DroppedAsset } from "./index.js";

export const updateGameText = async (credentials: Credentials, text: string) => {
  try {
    const { interactivePublicKey, urlSlug } = credentials;
    const style = {
      textColor: "#333333",
      textSize: 20,
      textWidth: 300,
    };
    let droppedAsset;
    try {
      droppedAsset = await DroppedAsset.getWithUniqueName(
        "TicTacToeText",
        urlSlug,
        interactivePublicKey,
        process.env.INTERACTIVE_SECRET,
      );
      await droppedAsset.updateCustomTextAsset(style, text);
    } catch (error) {
      const boardAsset = await DroppedAsset.getWithUniqueName(
        "TicTacToeBoard",
        urlSlug,
        interactivePublicKey,
        process.env.INTERACTIVE_SECRET,
      );
      if (!boardAsset) throw "TicTacToe board not found";
      // @ts-ignore
      const position = boardAsset.position;

      const textAsset = await createTextAsset(credentials);
      droppedAsset = await DroppedAsset.drop(textAsset, {
        isInteractive: true,
        interactivePublicKey: interactivePublicKey,
        position: { x: position.x, y: position.y - cellWidth * 2.5 },
        text,
        uniqueName: "TicTacToeText",
        urlSlug: urlSlug,
        ...style,
      });
    }
    return droppedAsset;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateGameText",
      message: "Error updating game text.",
    });
  }
};
