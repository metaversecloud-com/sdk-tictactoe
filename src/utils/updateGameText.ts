import { Credentials } from "../types/credentialsInterface.js";
import { errorHandler, DroppedAsset } from "./index.js";

export const updateGameText = async (credentials: Credentials, text: string, uniqueName: string) => {
  try {
    const droppedAsset = await DroppedAsset.getWithUniqueName(
      uniqueName,
      credentials.urlSlug,
      process.env.INTERACTIVE_SECRET,
      credentials,
    );
    await droppedAsset.updateCustomTextAsset({}, text);
    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "updateGameText",
      message: "Error updating game text.",
    });
  }
};
