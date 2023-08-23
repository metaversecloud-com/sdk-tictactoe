import { InteractiveCredentials } from "@rtsdk/topia";
import { Request } from "express";

const getCredentials = (reqObj: any): InteractiveCredentials => {
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
  const missingFields = requiredFields.filter((variable) => !reqObj[variable]);
  if (missingFields.length > 0)
    throw new Error(`Missing required body parameters: ${missingFields.join(", ")}`);

  return {
    interactiveNonce: reqObj.interactiveNonce as string,
    interactivePublicKey: reqObj.interactivePublicKey as string,
    urlSlug: reqObj.urlSlug as string,
    visitorId: Number(reqObj.visitorId),
    assetId: reqObj.assetId as string | undefined,
  };
};

const utils = {
  generateRandomString: () => Math.random().toString(36).slice(2),

  /**
   *
   * @param from  Inclusive
   * @param to    Exclusive
   * @param integer If whole numbers are required
   * @return Random number in the given range
   */
  randomNumber: (from: number, to: number, integer = true) => {
    const r = Math.random() * (to - from) + from;
    if (integer)
      return Math.floor(r);
    return r;
  },

  /**
   *
   * @return A number around the given `pivot` varying by given `diffusion`.
   */
  diffuse: (pivot: number, diffusion: number, integer = true) =>
    utils.randomNumber(pivot - diffusion, pivot + diffusion, integer),

  credentialsFromRequest: (req: Request): InteractiveCredentials => {
    try {
      return getCredentials(req.query);
    } catch (e) {
      console.warn("Could not get credentials from query. Trying body.");
      return getCredentials(req.body);
    }
  },

};

export default utils;
