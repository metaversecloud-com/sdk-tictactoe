import { Credentials } from "../types/credentialsInterface.js";
import { errorHandler, DroppedAsset } from "./index.js";

export const updateGameText = async (credentials: Credentials, text: string, uniqueName: string) => {
  try {
    const { interactivePublicKey, urlSlug } = credentials;
    const droppedAsset = await DroppedAsset.getWithUniqueName(
      uniqueName,
      urlSlug,
      interactivePublicKey,
      process.env.INTERACTIVE_SECRET,
    );
    await droppedAsset.updateCustomTextAsset({}, text);
    return droppedAsset;
  } catch (error) {
    errorHandler({
      error,
      functionName: "updateGameText",
      message: "Error updating game text.",
    });
  }
};
