import { Credentials } from "../types/credentialsInterface.js";

/**
 * Build a Credentials object from either query params (client GETs) or body (webhook POSTs).
 * Accepts a plain object of params — callers pass `req.query` for client requests
 * or `req.body` for webhook requests.
 * Throws when the credentials are missing or belong to another app; the calling route's catch answers the request.
 */
export const getCredentials = (params: any): Credentials => {
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
  const missingFields = requiredFields.filter((variable) => !params[variable]);
  if (missingFields.length > 0) {
    throw `Missing required parameters: ${missingFields.join(", ")}`;
  }

  if (process.env.INTERACTIVE_KEY !== params.interactivePublicKey) {
    throw "Provided public key does not match";
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
};
