import { Credentials } from "../types/credentials";
import { errorHandler } from "../utils/index.js";

export const getCredentials = (query: any): Credentials => {
  try {
    const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
    const missingFields = requiredFields.filter((variable) => !query[variable]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required body parameters: ${missingFields.join(", ")}`);
    }
    return {
      assetId: query.assetId,
      interactiveNonce: query.interactiveNonce,
      interactivePublicKey: query.interactivePublicKey,
      urlSlug: query.urlSlug,
      visitorId: Number(query.visitorId),
    };
  } catch (error: any) {
    errorHandler({
      error,
      functionName: "getCredentials",
      message: "Error getting credentials from req.query.",
    });
  }
};
