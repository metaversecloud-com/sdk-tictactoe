import { Credentials } from "../types/credentials";
import { errorHandler } from "./index.js";

export const getCredentials = (params: any): Credentials => {
  try {
    const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
    const missingFields = requiredFields.filter((variable) => !params[variable]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required body parameters: ${missingFields.join(", ")}`);
    }
    return {
      assetId: params.assetId,
      interactiveNonce: params.interactiveNonce,
      interactivePublicKey: params.interactivePublicKey,
      urlSlug: params.urlSlug,
      visitorId: Number(params.visitorId),
    };
  } catch (error: any) {
    errorHandler({
      error,
      functionName: "getCredentials",
      message: "Error getting credentials from req.",
    });
  }
};
