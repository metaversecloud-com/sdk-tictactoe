import { World } from "../topiaInit.js";
import { errorHandler } from "../errorHandler.js";
import { initializeWorldDataObject } from "./initializeWorldDataObject.js";
import { Credentials } from "../../types/credentialsInterface.js";

export const getWorldDataObject = async (credentials: Credentials) => {
  try {
    const { assetId, urlSlug } = credentials;
    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    await initializeWorldDataObject({ assetId, world, urlSlug });
    return world;
  } catch (error) {
    errorHandler({ error, functionName: "getWorldDataObject", message: "Error getting world details" });
  }
};
