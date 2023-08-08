import { initDroppedAsset } from "./topia/topia.factories.js";
import { DroppedAsset, DroppedAssetInterface, InteractiveCredentials } from "@rtsdk/topia";
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
   * @param from  {number} Inclusive
   * @param to    {number} Exclusive
   * @param integer {boolean} If whole numbers are required
   * @return {number}
   */
  randomNumber: (from: number, to: number, integer = true) => {
    const r = Math.random() * (to - from) + from;
    if (integer)
      return Math.floor(r);
    return r;
  },

  /**
   *
   * @param pivot     {number}
   * @param diffusion {number}
   * @param integer   {boolean}
   * @return {number} A number around the given `pivot` varying by given `diffusion`.
   */
  diffuse: (pivot: number, diffusion: number, integer = true) =>
    utils.randomNumber(pivot - diffusion, pivot + diffusion, integer),

  /**
   *
   * @param v1    {string}
   * @param v2    {string}
   * @return {string} Longest common substring between the two given strings
   */
  longestCommonSubstring: (v1: string, v2: string) => {
    const smaller = v1.length < v2.length ? v1 : v2;
    const larger = v1.length < v2.length ? v2 : v1;
    const substrs = utils.substrings(smaller);
    for (let substr of substrs)
      if (larger.indexOf(substr) > -1)
        return substr;
    return "";
  },

  /**
   *
   * @param str   {string}
   * @return {string[]} All substrings of the given str, except ''
   */
  substrings: (str: string) => {
    /**
     *
     * @type {string[]}
     */
    const substrs = [];
    for (let i = 0; i < str.length; i++) {
      for (let j = i + 1; j <= str.length; j++)
        substrs.push(str.slice(i, j));
    }
    // Sorting from longest to shortest string
    substrs.sort((a, b) => b.length - a.length);
    // Keeping only the unique values
    return substrs.filter((s, i, a) => a.indexOf(s) === i);
  },


  /**
   *
   * @param urlSlug {string}
   * @param config {{
   * id: number,
   *     email: string,
   *     type: 'crosshairs'| 'absolute'| 'relative',
   *     assetSuffix: number,
   *     targetAssetId?: string,
   *     x: number,
   *     y: number,
   *     onlyDrop: boolean}}
   *     @param uniqueNamePrefix {string}
   * @param worldAssets {DroppedAsset[]}
   * @return {Promise<{x:number, y: number}>}
   */
  calculatePosition: async (urlSlug: string, config: {
    id: number,
    email: string,
    type: "crosshairs" | "absolute" | "relative",
    assetSuffix: number,
    targetAssetId?: string,
    x: number,
    y: number,
    onlyDrop: boolean
  }, uniqueNamePrefix: string, worldAssets: DroppedAssetInterface[]) => {
    console.log(`config: `, JSON.stringify(config));
    switch (config.type) {
      case "absolute":
        return { x: config.x, y: config.y };

      case "crosshairs":
        try {
          // todo Ask SDK team to add uniqueName property to DroppedAssetInterface
          // @ts-ignore
          const cs = worldAssets.filter(d => !!d.uniqueName).filter(d => d.uniqueName === `${uniqueNamePrefix}_${config.id}_crosshairs`);
          if (cs.length)
            return cs[0].position;

          throw new Error("Could not find cross-hairs.");
        } catch (e) {
          console.error("Could not find cross-hairs.", e);
          return {
            x: utils.randomNumber(-500, 500),
            y: utils.randomNumber(-500, 500),
          };
        }

      case "relative":
        try {
          const referencedAsset = await initDroppedAsset().get(config.targetAssetId, urlSlug) as DroppedAssetInterface;
          return { x: referencedAsset.position.x + config.x, y: referencedAsset.position.y + config.y };
        } catch (e) {
          console.error(`Could not find referenced asset`, e);
          return {
            x: utils.diffuse(config.x, 250),
            y: utils.diffuse(config.y, 250),
          };
        }
    }
  },

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
