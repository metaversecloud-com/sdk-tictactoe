import { Credentials } from "../types/credentialsInterface.js";
import { errorHandler } from "./errorHandler.js";

/**
 * Build a Credentials object from either query params (client GETs) or body (webhook POSTs).
 * Accepts a plain object of params — callers pass `req.query` for client requests
 * or `req.body` for webhook requests.
 */
export const getCredentials = (params: any): Credentials => {
  try {
    const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
    const missingFields = requiredFields.filter((variable) => !params[variable]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required parameters: ${missingFields.join(", ")}`);
    }
    return {
      assetId: params.assetId,
      displayName: params.displayName,
      identityId: params.identityId,
      interactiveNonce: params.interactiveNonce,
      interactivePublicKey: params.interactivePublicKey,
      profileId: params.profileId,
      sceneDropId: params.sceneDropId,
      uniqueName: params.uniqueName,
      urlSlug: params.urlSlug,
      username: params.name,
      visitorId: Number(params.visitorId),
    };
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "getCredentials",
      message: "Error getting credentials.",
    });
  }
};
